import {exportMoveGLB} from './move-glb.ts';
import {exportFigureGLB,exportRiggedFigureGLB} from './figure-glb.ts';
import {PlaybackTransition} from './playback-transition.ts';
import {StudioWeightStroke} from './studio-weight-stroke.ts';
import {checkMoveBends} from './move-limit-check.ts';
import {checkMoveSurface as inspectMoveSurface} from './move-surface-check.ts';
import {checkPoseSurface as inspectPoseSurface,suggestGentlerPose} from './pose-surface-check.ts';
import {poseMorphBindings} from './pose-morphs.ts';
import {searchWeightCorrection} from './pose-weight-correction.ts';
import {findAutomaticSkinCorrection,skinCorrectionOverrides} from './automatic-skin-correction.ts';
import type {AutomaticSkinProposal,SkinProgress} from './automatic-skin-correction.ts';
import {noMeasuredRegression,betterSurfaceReport} from './pose-weight-correction.ts';
import {summarizeVolume} from './surface-volume.ts';
import type {SurfaceVolumeReport} from './surface-volume.ts';
import {loadMoveLibrary,loadLibraryMove} from './move-library.ts';
import type {LibraryMove} from './move-library.ts';
import {exportMoveFile,importMoveFile,MAX_MOVE_FILE} from './move-file.ts';
import {parseStudioCommand,validMoveSequenceUpdates} from './studio-command.ts';
import {flagAffectedPoses,moveReview,reviewLabels} from './studio-review.ts';
import * as T from 'three';
import {detectJoints,detectConnections,edgeKey} from './studio-detection.ts';
import { connectedPoints, StudioHistory, FIGURE_TRACK, validFigureScale, validBendLimit } from './studio-data.ts';
import type { StudioData, StudioProject, Transform, ControlPoint, StudioMove } from './studio-data.ts';
import { StudioRig } from './studio-rig.ts';
import type { StudioView } from './studio-view.ts';
import type { Move } from './catalog.ts';
interface Snapshot {data:StudioData;values:Record<string,Transform>}
interface Hooks { suspend:()=>void; resume:()=>void; changed:()=>void; feedback:(s:string)=>void }
const uid=()=>`p-${crypto.randomUUID()}`;
const volumeText=(v:SurfaceVolumeReport)=>`Volumenschätzung: ${v.measuredComponents?'min '+v.minimumRatio?.toFixed(3)+'× · max '+v.maximumRatio?.toFixed(3)+'×':'nicht messbar'} · ${v.issues} auffällig · ${v.measuredComponents} messbar · ${v.unmeasurableComponents} nicht messbar`;
export class StudioEditor {
  readonly rig:StudioRig;
  readonly playbackTransition:PlaybackTransition;
  private readonly view:StudioView;
  private readonly host:HTMLElement;
  private readonly hooks:Hooks;
  private readonly project:Omit<StudioProject,'studio'>;
  private readonly initial:StudioData;
  private history=new StudioHistory<Snapshot>();
  private selected:string|null=null;
  private edit=false;
  private active=false;
  private groupMove=false;
  private rotate=false;
  private insertionRatio=.5;
  private addingBoneParent:string|null=null;
  private weightStroke:StudioWeightStroke|null=null;
  private weightAmount=.5;
  private weightLocal=false;
  private weightColors=false;
  private weightVisible=false;
  private weightRadius=.2;
  private gesturePositions=new Map<string,T.Vector3>();
  private inspectionOrigin:Record<string,Transform>|null=null;
  private proposalOrigin:Record<string,Transform>|null=null;
  private timeline:{move:Move;time:number;preview:boolean;sequence?:StudioMove}|null=null;
  private gesture:Snapshot|null=null;
  private gesturePosition:T.Vector3|null=null;
  get interactionActive(){return this.playing||!!this.gesture||!!this.weightStroke||this.rig.skinPreviewActive;}
  readonly session=crypto.randomUUID();
  private revision=0;
  private agentEditing=false;
  private disposed=false;
  private exportingFigure=false;
  private moveCheck:AbortController|null=null;
  private surfaceCheck:AbortController|null=null;
  private automaticCheck:AbortController|null=null;
  private automaticProposal:(AutomaticSkinProposal&{id:string;revision:number})|null=null;
  private automaticProgress:SkinProgress|null=null;
  private automaticOutcome:''|'none'='';
  private weightCorrection:(NonNullable<Awaited<ReturnType<typeof searchWeightCorrection>>>&{revision:number;jointId:string})|null=null;
  private library:LibraryMove[]=[];
  private libraryRequest:AbortController|null=null;
  dirty=false;
  paused=false;
  speed=1;
  constructor(rig:StudioRig,view:StudioView,host:HTMLElement,project:Omit<StudioProject,'studio'>,hooks:Hooks) {
    this.rig=rig;this.playbackTransition=new PlaybackTransition(rig.root);this.view=view;this.host=host;this.project=project;this.hooks=hooks;this.initial=structuredClone(rig.initial);
    view.onSelect=id=>{this.surfaceCheck?.abort();this.weightCorrection=null;this.selected=id;this.render();};
    view.onAdd=(position,mesh)=>{
      const parent=this.data.points.find(p=>p.id===this.addingBoneParent);
      if(!this.addingBoneParent){this.addPoint(position,mesh);return;}
      if(!this.active||!this.edit||this.interactionActive)return;
      try{if(!parent)throw Error('Elternknochen erneut auswählen.');this.mutate(()=>{this.selected=this.rig.addBone(parent,position).id;});this.hooks.feedback('Knochen hinzugefügt. Hautgewichte bei Bedarf gezielt übertragen.');}catch(error){this.hooks.feedback((error as Error).message);}
      this.addingBoneParent=null;this.view.setAction('select');
    };
    view.onConnect=id=>this.connect(id);
    view.onStart=()=>{this.gesture=this.snapshot();this.gesturePosition=this.point ? rig.position(this.point):null;this.gesturePositions=new Map(rig.data.points.map(p=>[p.id,rig.position(p)]));};
    view.onMove=(position,rotation,intent)=>{
      const p=this.point;if(!p)return;
      if(p.id!==FIGURE_TRACK && this.groupMove && !this.edit && p.kind==='surface' && this.gesture && this.gesturePosition){const delta=position.clone().sub(this.gesturePosition), connected=connectedPoints(rig.data,p.id);
        for(const q of rig.data.points.filter(q=>q.kind==='surface'&&connected.has(q.id))){rig.setPoint(q,this.gesturePositions.get(q.id)!.clone().add(delta),new T.Quaternion(),false);}
      }else rig.setPoint(p,position,rotation,this.edit,intent??(this.rotate?'rotate':'translate'));
      this.view.refresh();this.refreshWeightPreview();this.refreshWeightColors();this.refreshNumbers();
    };
    view.onEnd=()=>{if(this.gesture){flagAffectedPoses(this.gesture.data,this.data);this.history.push(this.gesture);this.gesture=null;this.mark();this.render();}};
    view.onBrushStart=()=>{
      const source=this.point,target=this.data.points.find(p=>p.id===this.host.querySelector<HTMLSelectElement>('#weight-target')?.value);
      if(!this.active||!this.edit||this.interactionActive||source?.kind!=='bone'||target?.kind!=='bone')return false;
      this.weightStroke=new StudioWeightStroke(rig,source,target,this.weightAmount,this.weightRadius,this.weightVisible?this.view.weightView():undefined);this.host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(e=>e.disabled=true);return true;
    };
    view.onBrushSample=position=>{if(!this.weightStroke)return;try{this.weightStroke.sample(position);this.refreshWeightColors();this.view.setWeightRegion?.(position?{center:position.toArray(),radius:this.weightRadius}:null);}catch(error){this.weightStroke=null;this.view.setAction('select');this.render();this.hooks.feedback((error as Error).message+' Pinselstrich zurückgenommen.');}};
    view.onBrushEnd=cancel=>{const stroke=this.weightStroke;this.weightStroke=null;if(!stroke)return;if(cancel)stroke.cancel();else if(stroke.finish()){flagAffectedPoses(stroke.before.data,this.data);this.history.push(stroke.before);this.mark();}this.view.setAction('select');this.render();this.hooks.feedback(cancel?'Pinselstrich abgebrochen.':'Pinselstrich abgeschlossen. Posen und Bewegungen prüfen.');};
    this.render();
  }
  get point(){if(this.selected===FIGURE_TRACK&&!this.edit)return this.rig.figure;return this.rig.data.points.find(p=>p.id===this.selected);}
  get data(){return this.rig.data;}
  get playing(){return !!this.timeline;}
  get current(){return this.timeline?.move ?? null;}
  get duration(){const m=this.timeline?.sequence??this.rig.data.moves.find(m=>m.id===this.timeline?.move.id);return m?this.rig.duration(m):0;}
  get progress(){return this.duration ? this.timeline!.time/this.duration:0;}
  private refreshWeightColors(){this.view.setWeightBone?.(this.active&&this.edit&&!this.playing&&this.weightColors&&this.point?.kind==='bone'?this.point.bone!:null);}
  private refreshWeightPreview(){const p=this.point;this.view.setWeightRegion?.(this.active&&this.edit&&!this.playing&&this.weightLocal&&p?.kind==='bone'?{center:[...p.rest],radius:this.weightRadius}:null);}
  private snapshot():Snapshot{return {data:structuredClone(this.data),values:this.rig.capture()};}
  private restore(s:Snapshot){this.rig.data=structuredClone(s.data);this.rig.reset();this.rig.apply(s.values);this.mark();this.render();}
  private mark(){this.automaticCheck?.abort();this.automaticProposal=null;this.automaticOutcome='';this.moveCheck?.abort();this.surfaceCheck?.abort();this.weightCorrection=null;this.revision++;this.dirty=true;this.hooks.changed();}
  private mutate(fn:()=>void){this.rig.stopSkinPreview();const before=this.snapshot();fn();flagAffectedPoses(before.data,this.data);this.history.push(before);this.mark();this.render();}
  beginPlaybackTransition(){
    const d=this.data;
    if(this.active||d.boneInsertions?.length||d.boneDeletions?.length||d.boneReparents?.length||d.weightTransfers?.length||JSON.stringify(d.boneRest)!==JSON.stringify(this.initial.boneRest)){this.playbackTransition.cancel();return;}
    const points=d.points.filter(p=>p.kind==='surface');
    this.playbackTransition.begin(this.rig.surfaces.filter((_,i)=>points.some(p=>p.mesh===undefined||p.mesh===i)).map(s=>s.mesh));
  }
  enter(){this.playbackTransition.cancel();this.revision++;this.hooks.suspend();this.stopMove();this.active=true;this.rig.reset();if(this.data.draft)this.rig.apply(this.data.draft);this.view.setEnabled(true);this.render();}
  leave(){this.rig.stopSkinPreview();this.automaticCheck?.abort();this.automaticProposal=null;this.playbackTransition.cancel();this.view.setAction('select');this.moveCheck?.abort();this.surfaceCheck?.abort();this.libraryRequest?.abort();this.agentEditing=false;this.revision++;if(this.active&&this.proposalOrigin)this.data.draft=structuredClone(this.proposalOrigin);else if(this.active&&!this.playing)this.data.draft=this.rig.capture();this.weightCorrection=null;this.active=false;this.stopMove();this.view.setEnabled(false);this.rig.restoreSource();this.hooks.resume();}
  stopMove(){this.rig.stopSkinPreview();if(this.proposalOrigin){this.rig.apply(this.proposalOrigin);this.proposalOrigin=null;this.view.refresh();}if(this.inspectionOrigin){this.rig.apply(this.inspectionOrigin);this.inspectionOrigin=null;this.view.refresh();}this.timeline=null;this.paused=false;this.view.setEnabled(this.active);}
  stopPreview(){this.stopMove();this.render();}
  play(id:string,preview=false):boolean {
    const move=this.data.moves.find(m=>m.id===id);if(!move)return false;
    if(!preview)this.beginPlaybackTransition();else this.playbackTransition.cancel();
    this.stopMove();this.hooks.suspend();this.rig.reset();this.timeline={move:{id:move.id,name:move.name,loop:move.loop,clip:move.id},time:0,preview};this.paused=false;
    this.rig.apply(this.rig.sample(move,0));this.playbackTransition.afterFrame(0);this.view.setEnabled(false);this.render();return true;
  }
  update(delta:number){if(!this.timeline||this.paused)return;const t=this.timeline,move=t.sequence??this.data.moves.find(m=>m.id===t.move.id)!;t.time+=delta*this.speed;const duration=this.rig.duration(move);
    if(t.time>=duration){if(move.loop)t.time%=duration;else {t.time=duration;this.rig.apply(this.rig.sample(move,duration));if(t.preview){this.paused=true;this.stopPreview();}else{this.beginPlaybackTransition();this.stopMove();this.rig.restoreSource();this.hooks.resume();this.playbackTransition.afterFrame(0);}return;}}
    this.rig.apply(this.rig.sample(move,t.time));
  }
  togglePause(){this.paused=!this.paused;}
  seek(ratio:number){if(!this.timeline||!Number.isFinite(ratio))return;this.playbackTransition.cancel();const move=this.timeline.sequence??this.data.moves.find(m=>m.id===this.timeline!.move.id)!;this.timeline.time=T.MathUtils.clamp(ratio,0,.999999)*this.duration;this.rig.apply(this.rig.sample(move,this.timeline.time));}
  setSpeed(value:number){this.speed=T.MathUtils.clamp(value,.25,2);}
  private addPoint(position:T.Vector3,mesh?:number){if(!this.edit||this.playing)return;if(this.data.points.length>=256){this.hooks.feedback('Höchstens 256 Kontrollpunkte pro Projekt.');return;}
    this.mutate(()=>{const p:ControlPoint={id:uid(),name:`Punkt ${this.data.points.length+1}`,kind:'surface',rest:position.toArray(),size:.015,radius:.12,...(mesh!==undefined?{mesh}:{})};this.data.points.push(p);for(const pose of this.data.poses)pose.values[p.id]={position:[...p.rest],rotation:[0,0,0,1]};if(this.data.draft)this.data.draft[p.id]={position:[...p.rest],rotation:[0,0,0,1]};this.selected=p.id;this.rig.reset();});
    this.addingBoneParent=null;this.view.setAction('select');this.hooks.feedback('Punkt gesetzt. Größe und Einflussbereich sind getrennt einstellbar.');
  }
  private connect(id:string){if(!this.edit||!this.selected||id===this.selected)return;
    const a=this.data.points.find(p=>p.id===this.selected),b=this.data.points.find(p=>p.id===id);if(!a||!b)return;
    if(!this.data.links.some(l=>l.includes(a.id)&&l.includes(b.id))){try{this.rig.validateConnection(a,b);}catch(e){this.hooks.feedback((e as Error).message);return;}}
    this.mutate(()=>{const index=this.data.links.findIndex(([a,b])=>(a===id&&b===this.selected)||(b===id&&a===this.selected));if(index>=0)this.data.links.splice(index,1);else if(this.data.links.length<2048)this.data.links.push([this.selected!,id]);});this.addingBoneParent=null;this.view.setAction('select');
  }
  private refreshNumbers(){const label=this.host.querySelector('#figure-scale-value');if(label)label.textContent=`${Math.round(this.rig.scale*100)} %`;const p=this.point;if(!p)return;const pos=this.rig.position(p);['x','y','z'].forEach((axis,i)=>{const input=this.host.querySelector<HTMLInputElement>(`#point-${axis}`);if(input)input.value=pos.toArray()[i].toFixed(3);});}
  private render(){
    if(this.weightCorrection&&this.weightCorrection.jointId!==this.point?.id)this.weightCorrection=null;
    const remembered = Object.fromEntries(['pose-name','move-name','move-id','pose-list','studio-moves','library-moves','move-steps'].map(id=>[id,this.host.querySelector<HTMLInputElement>(`#${id}`)?.value ?? '']));
    const loop = this.host.querySelector<HTMLInputElement>('#move-loop')?.checked ?? false;
    const selected=this.selected;const poses=this.data.poses;
    this.host.innerHTML=`<h2>Avatar-Studio</h2><label class="check"><input id="studio-agent-edit" type="checkbox" ${this.agentEditing?'checked':''}> KI darf dieses Studio bearbeiten</label><p class="subtle">Nur für diese Sitzung. Änderungen sind rückgängig machbar.</p><div class="studio-file-actions"><button id="studio-new">Neu</button><button id="studio-save">Speichern${this.dirty?' *':''}</button><button id="figure-glb" ${this.exportingFigure?'disabled':''}>Figur als GLB (Standbild)</button><button id="figure-rig-glb" ${this.exportingFigure?'disabled':''}>Figur als GLB (mit Rig)</button></div><p class="subtle">Standbild ohne Rig oder aktuelle Form mit Hautskelett. Beide ohne Animationen. Studio-Projekt zusätzlich speichern.</p>
    <label class="check" ${poseMorphBindings(this.rig.root).length?'':'hidden'}><input id="studio-pose-corrections" type="checkbox" ${this.rig.poseCorrectionsActive?'checked':''} ${this.rig.poseCorrectionsCompatible?'':'disabled'}> Poseabhängige Hautkorrekturen</label><p class="subtle" ${poseMorphBindings(this.rig.root).length?'':'hidden'}> Geprüfte Haltungen; bei unpassenden Achsen- oder Gelenkkombinationen blenden Korrekturen aus. Nach Rig-/Gewichtsänderungen ausgeschaltet. Bewegung visuell prüfen.</p><div class="studio-modes" role="group" aria-label="Bearbeitungsmodus"><button id="mode-pose" aria-pressed="${!this.edit}">Figur bewegen</button><button id="mode-rig" aria-pressed="${this.edit}">Gelenke bearbeiten</button></div>
    <p class="subtle">${this.edit?'Punkte setzen und verbinden. Bestehende Skelettpunkte verschieben ihren Drehpunkt.':'Ziehen bewegt verbundene Gelenkketten. Unter Drehen lässt sich die Ausrichtung direkt mit der Maus ändern.'}</p>
    <div class="studio-actions"><button id="studio-undo" ${this.history.canUndo?'':'disabled'}>↶ Zurück</button><button id="studio-redo" ${this.history.canRedo?'':'disabled'}>↷ Wiederholen</button></div>
    <div class="studio-detection" ${this.edit?'':'hidden'}><button id="detect-joints">Joints automatisch erkennen</button><button id="detect-links">Joint-Verbindungen automatisch erkennen</button><p class="subtle">Erkennung verwendet vorhandene Skelettdaten. Für Modelle ohne Skelett ist KI-Rigging noch nicht verfügbar.</p></div>
    <button id="figure-select" ${this.edit?'hidden':''}>Gesamte Figur bewegen</button>
    <label for="studio-points">Gelenk / Gesichtspunkt</label><select id="studio-points"><option value="">Punkt auswählen …</option></select>
    <div class="studio-actions" ${this.edit?'':'hidden'}><label>Position auf der Knochenstrecke <output id="bone-ratio-value">${Math.round(this.insertionRatio*100)} %</output><input id="bone-ratio" type="range" min="10" max="90" step="1" value="${Math.round(this.insertionRatio*100)}" aria-label="Position des Zwischengelenks"><span class="subtle">Vom Elternknochen zum ausgewählten Kindknochen; 50 % = Mitte.</span></label><button id="bone-add">＋ Knochen setzen</button><button id="bone-insert">Knochen dazwischen einfügen</button><button id="point-add">＋ Punkt setzen</button><button id="point-connect" ${this.point?'':'disabled'}>Verbinden / lösen</button></div>
    <div ${this.edit&&this.point?.kind==='bone'?'':'hidden'}><label for="bone-parent">Neuer Elternknochen</label><select id="bone-parent"></select><button id="bone-reparent">Knochen umhängen</button><p class="subtle">Ändert die echte Skelettverbindung. Einzelposen bleiben erhalten; Bewegungsübergänge danach prüfen.</p></div>
    <div ${this.edit&&this.point?.kind==='bone'?'':'hidden'}><label class="check"><input id="weight-colors" type="checkbox" ${this.weightColors?'checked':''}> Hautgewichte farbig anzeigen</label><p class="subtle">Ausgewählter Knochen: Blau = 0 %, Grün = 50 %, Rot = 100 %. Dazwischen interpolierte Farben. Nur geriggte Oberflächen; ursprüngliche Materialien erscheinen nach dem Ausschalten wieder.</p><label for="weight-target">Oberflächen-Einfluss übertragen auf</label><select id="weight-target"></select><label>Anteil <output id="weight-amount-value">${Math.round(this.weightAmount*100)} %</output><input id="weight-amount" type="range" min="1" max="100" step="1" value="${Math.round(this.weightAmount*100)}"></label><label class="check"><input id="weight-local" type="checkbox" ${this.weightLocal?'checked':''}> Nur im Umkreis des Quellgelenks</label><label>Radius <output id="weight-radius-value">${this.weightRadius.toFixed(3)}</output><input id="weight-radius" type="range" min="0.005" max="2" step="0.005" value="${this.weightRadius}" ${this.weightLocal?'':'disabled'}></label><button id="weight-transfer">Einfluss übertragen</button><label class="check"><input id="weight-visible" type="checkbox" ${this.weightVisible?'checked':''}> Pinsel nur auf sichtbare Oberfläche</label><button id="weight-brush">Mit Pinsel übertragen</button><p class="subtle">Quelle und Ziel wählen, dann mit gedrückter linker Maustaste über die Haut ziehen. Ein Strich = ein Undo-Schritt. Radius gilt auch ohne Umkreis-Checkbox. Überlappende Aufträge verstärken den Einfluss. Höchstens 1024 gespeicherte Übertragungen; bei Überschreitung wird der ganze Strich zurückgenommen.</p><p class="subtle">Überträgt Einfluss des gewählten Knochens. Im Umkreis nimmt die Stärke zum Rand weich ab; außerhalb bleibt die Hautzuordnung unverändert. Grüne Außenringe zeigen die Grenze, orange Innenringe die halbe Stärke. Die Vorschau zeigt den räumlichen Bereich, nicht die tatsächlich gewichteten Vertices. Bezug ist die ursprüngliche Grundpose. Ohne Umkreis gilt die Übertragung überall. Grundpose bleibt erhalten; Posen und Bewegungen prüfen. Pro Oberflächenpunkt bleiben höchstens vier Einflüsse.</p></div>
    <div id="point-fields" ${this.point?'':'hidden'}><label>Name<input id="point-name" maxlength="100"></label><label>Punktgröße<input id="point-size" type="range" min="0.003" max="0.15" step="0.001"></label>
    <div id="bend-fields" hidden><label class="check"><input id="bend-enabled" type="checkbox"> IK-Beugegrenze</label><label>Minimale Beugung <output id="bend-min-value"></output><input id="bend-min" type="range" min="0" max="175" step="1"></label><label>Maximale Beugung <output id="bend-max-value"></output><input id="bend-max" type="range" min="0" max="175" step="1"></label><p class="subtle">0° ist gestreckt. Gilt beim Ziehen des Endpunkts einer Zweiglied-Kette. Direkte Drehung und gespeicherte Moves bleiben unverändert.</p></div><label id="radius-label">Einflussbereich<input id="point-radius" type="range" min="0.005" max="0.6" step="0.005"></label>
    <div class="point-xyz">${['x','y','z'].map(a=>`<label>${a.toUpperCase()}<input id="point-${a}" type="number" step="0.005" min="-100" max="100"></label>`).join('')}</div>
    <label id="figure-scale-label" hidden>Figurgröße <output id="figure-scale-value"></output><input id="figure-scale" type="range" min="0.1" max="5" step="0.01"></label>
    <label id="rotation-label">Griffe<select id="point-transform"><option value="translate">Verschieben</option><option value="rotate">Drehen</option></select></label>
    <label class="check" id="group-label"><input id="point-group" type="checkbox" ${this.groupMove?'checked':''}> Verbundene freie Punkte gemeinsam bewegen</label>
    <button id="bone-delete" ${this.edit&&this.point?.kind==='bone'?'':'hidden'}>Knochen wirklich löschen</button><button id="point-delete" ${this.edit?'':'hidden'}>Kontrollpunkt löschen</button><p class="subtle" id="point-kind"></p></div>
    <section ${this.edit?'':'hidden'}><h3>Verbindungen</h3><div id="studio-links"></div></section>
    <button id="pose-reset">Grundpose</button>
    <div class="studio-poses"><h3>Posen & Bewegung</h3><label>Posenname<input id="pose-name" maxlength="100" placeholder="z. B. Hand oben"></label><button id="pose-add">Aktuelle Pose speichern</button>
    <label for="pose-list">Gespeicherte Posen</label><select id="pose-list"></select><div class="studio-actions"><button id="pose-show">Anzeigen</button><button id="pose-replace">Ersetzen</button><button id="pose-delete">Löschen</button></div>
    <button id="pose-check-limits">Beugegrenzen der Pose prüfen</button><div id="pose-limit-result" role="status"></div>
    <div class="studio-actions"><button id="pose-check-surface">Oberfläche der Pose prüfen</button><button id="pose-gentler">Schonendere Pose erstellen</button><button id="pose-surface-cancel">Vorschlag abbrechen</button></div><div id="pose-surface-result" role="status"></div><p class="subtle">Vergleicht die gespeicherte Pose mit der Grundform. Eine schonendere Variante wird als neue Pose gespeichert. Anatomie, Kollisionen und Charakterdesign bleiben visuell zu prüfen.</p>
    <h3>Automatischer Korrekturauftrag</h3><div class="studio-actions"><button id="skin-auto-start">Hautkorrektur automatisch suchen</button><button id="skin-auto-cancel">Auftrag abbrechen</button></div><div id="skin-auto-progress" role="status"></div><div id="skin-auto-result" role="status"></div><div class="studio-actions"><button id="skin-auto-original">Original ansehen</button><button id="skin-auto-preview">Korrektur ansehen</button><button id="skin-auto-stop">Vergleich beenden</button><button id="skin-auto-apply">Geprüfte Korrektur übernehmen</button></div><p class="subtle">Wählt auffällige Hautbereiche und Gelenke selbst. Prüft gespeicherte Posen sowie Zwischenbilder aller eigenen Moves. Vorschau verändert das Projekt nicht. Eine übernommene Korrektur ist rückgängig machbar. Geschlossene Netzteile erhalten eine Volumenschätzung. Offene Flächen sind dafür nicht messbar. Selbstüberschneidungen, lokale Einschnürungen und Charakterdesign bleiben visuell zu prüfen.</p>
    <label>Korrekturradius<input id="pose-weight-radius" type="number" min="0.005" max="2" step="0.005" value="${this.weightRadius}"></label><div class="studio-actions"><button id="pose-weight-search">Lokale Hautkorrektur suchen</button><button id="pose-weight-apply">Hautkorrektur übernehmen</button></div><div id="pose-weight-result" role="status"></div><p class="subtle">Gespeicherte Pose und Gelenk auswählen. Prüft kleine Gewichtsänderungen zwischen Gelenk und Elternknochen. Zielbewegung bleibt erhalten; Übernahme ändert die Hautbindung für alle Bewegungen. Visuell prüfen.</p>
    <div id="pose-review" class="studio-review" hidden><strong>Pose prüfen</strong><ul id="pose-review-reasons"></ul><p>Pose anzeigen und bei Bedarf korrigieren. „Ersetzen“ speichert die Korrektur.</p><button id="pose-reviewed">Pose als geprüft markieren</button></div>
    <label>Übergang zu dieser Pose (Sekunden)<input id="pose-seconds" type="number" min="0.1" max="30" step="0.1" value="1"></label><div class="studio-actions"><button id="pose-up">↑ Früher</button><button id="pose-down">↓ Später</button></div>
    <p class="subtle">Eine Bewegung nutzt alle Posen in dieser Reihenfolge. Bei Schleifen bestimmt die Zeit der ersten Pose den Rückweg.</p>
    <label>Bewegungsname<input id="move-name" maxlength="100" placeholder="z. B. Lächeln"></label><label>Schlagwort<input id="move-id" maxlength="100" placeholder="z. B. laecheln"></label><label class="check"><input id="move-loop" type="checkbox"> Als Schleife</label><button id="move-add" ${poses.length>=2?'':'disabled'}>Bewegung speichern</button>
    <label for="studio-moves">Eigene Bewegungen</label><select id="studio-moves"></select><label for="move-steps">Posenfolge dieser Bewegung</label><select id="move-steps" data-user-text></select><div class="studio-actions"><button id="move-step-up">Schritt nach vorne</button><button id="move-step-down">Schritt nach hinten</button><button id="move-step-remove">Schritt entfernen</button></div><div class="studio-actions"><button id="move-step-add">Ausgewählte Pose einfügen</button><button id="move-step-replace">Schritt durch ausgewählte Pose ersetzen</button></div><p class="subtle">Die Pose oben auswählen. Wiederholungen sind einzelne Schritte; Posen bleiben im Projekt erhalten.</p><p id="move-review" class="studio-review" hidden>Diese Bewegung enthält Posen mit Prüfhinweisen. Vorschau ansehen und die markierten Posen prüfen.</p><div class="studio-actions"><button id="move-preview">Vorschau</button><button id="move-stop">Stopp</button><button id="move-inspect-save" ${this.inspectionOrigin?'':'hidden'}>Prüfbild als neue Pose übernehmen</button><button id="move-delete">Löschen</button></div><div class="studio-actions"><button id="move-check-limits">Beugegrenzen der Bewegung prüfen</button><button id="move-check-surface">Oberfläche der Bewegung prüfen</button><button id="move-check-cancel">Prüfung abbrechen</button></div><div id="move-limit-result" role="status"></div><div id="move-surface-result" role="status"></div><div class="studio-actions"><button id="move-export">Move exportieren</button><button id="move-glb-export">Move als GLB (Animation)</button><button id="move-import">Move importieren</button><input id="move-file" type="file" accept=".json,.pakachi-move.json" hidden></div><p class="subtle">GLB: Knochen-, Figuren- und Oberflächenbewegung. Schleife im Zielprogramm wählen.</p><label for="library-moves">Gemeinsame Move-Sammlung</label><select id="library-moves" data-user-text></select><div class="studio-actions"><button id="library-refresh">Sammlung laden</button><button id="library-import">Aus Sammlung importieren</button></div><p class="subtle">Die Sammlung gehört zur Anwendung. Import nur bei passendem Modell und Rig.</p><p class="subtle">Move-Dateien benötigen dasselbe Modell und dieselbe Gelenkstruktur. Kein automatisches Retargeting.</p></div>
    <p class="subtle">Projekt laden: „Projekt laden“ oben. Mausrad: Nahzoom · rechts ziehen: Ansicht verschieben.</p>`;
    const q=<E extends HTMLElement=HTMLElement>(id:string)=>this.host.querySelector<E>(`#${id}`)!;
    const input=(id:string)=>q<HTMLInputElement>(id);
    const on=(id:string,fn:()=>void)=>{q<HTMLButtonElement>(id).onclick=()=>{try{fn();}catch(e){this.hooks.feedback(e instanceof Error?e.message:String(e));}};};
    const points=q<HTMLSelectElement>('studio-points');if(!this.edit){const option=new Option('Gesamte Figur',FIGURE_TRACK);option.dataset.figureLabel='';points.add(option);}for(const p of this.data.points)points.add(new Option(`${p.kind==='bone'?'◇':'●'} ${p.name}`,p.id));points.value=selected??'';
    points.onchange=()=>{this.surfaceCheck?.abort();this.weightCorrection=null;this.selected=points.value||null;this.addingBoneParent=null;this.view.setAction('select');this.render();};
    input('studio-agent-edit').onchange=()=>{this.agentEditing=input('studio-agent-edit').checked;this.revision++;};
    on('figure-select',()=>{this.selected=FIGURE_TRACK;this.addingBoneParent=null;this.view.setAction('select');this.render();});
    on('mode-pose',()=>{this.revision++;this.edit=false;this.addingBoneParent=null;this.view.setAction('select');this.rig.reset();this.render();});
    on('mode-rig',()=>{this.revision++;this.edit=true;if(this.selected===FIGURE_TRACK)this.selected=null;this.addingBoneParent=null;this.view.setAction('select');this.rig.reset();this.render();});
    q<HTMLButtonElement>('bone-add').disabled=!this.edit||this.point?.kind!=='bone'||this.interactionActive;
    on('bone-add',()=>{if(!this.edit||this.point?.kind!=='bone'||this.interactionActive)return;this.addingBoneParent=this.point.id;this.view.setAction('add');this.hooks.feedback('Position für den neuen Kindknochen anklicken. Hautgewichte bleiben zunächst unverändert.');});
    q<HTMLButtonElement>('bone-insert').disabled=!this.edit||this.point?.kind!=='bone'||this.playing;
    const parentSelect=q<HTMLSelectElement>('bone-parent');parentSelect.add(new Option('Elternknochen auswählen …',''));for(const p of this.data.points.filter(p=>p.kind==='bone'&&p.id!==this.point?.id))parentSelect.add(new Option(p.name,p.id));
    q<HTMLButtonElement>('bone-reparent').disabled=!this.edit||this.point?.kind!=='bone'||this.interactionActive;
    on('bone-reparent',()=>{if(!this.edit||!this.point||this.interactionActive)return;const target=this.data.points.find(p=>p.id===parentSelect.value);if(!target)throw Error('Neuen Elternknochen auswählen.');this.mutate(()=>this.rig.reparentBone(this.point!,target));this.hooks.feedback('Knochen umgehängt. Gespeicherte Einzelposen erhalten; Bewegungsübergänge prüfen.');});
    const weightTarget=q<HTMLSelectElement>('weight-target');weightTarget.add(new Option('Zielknochen auswählen …',''));for(const p of this.data.points.filter(p=>p.kind==='bone'&&p.id!==this.point?.id))weightTarget.add(new Option(p.name,p.id));
    input('weight-amount').oninput=()=>{this.weightAmount=Number(input('weight-amount').value)/100;q('weight-amount-value').textContent=Math.round(this.weightAmount*100)+' %';};
    input('weight-visible').onchange=()=>{this.weightVisible=input('weight-visible').checked;};
    input('weight-colors').onchange=()=>{this.weightColors=input('weight-colors').checked;this.refreshWeightColors();};
    input('weight-local').onchange=()=>{this.weightLocal=input('weight-local').checked;input('weight-radius').disabled=!this.weightLocal;this.refreshWeightPreview();};
    input('weight-radius').oninput=()=>{this.weightRadius=Number(input('weight-radius').value);q('weight-radius-value').textContent=this.weightRadius.toFixed(3);this.refreshWeightPreview();};
    q<HTMLButtonElement>('weight-brush').disabled=!this.edit||this.point?.kind!=='bone'||this.interactionActive;
    on('weight-brush',()=>{if(!this.edit||this.point?.kind!=='bone'||this.interactionActive)return;if(!this.data.points.some(p=>p.id===weightTarget.value&&p.kind==='bone'))throw Error('Zielknochen auswählen.');this.rig.reset();this.view.refresh();this.addingBoneParent=null;this.view.setAction('brush');this.hooks.feedback('Mit linker Maustaste über die Haut malen. Ein Strich wird gemeinsam rückgängig gemacht.');});
    q<HTMLButtonElement>('weight-transfer').disabled=!this.edit||this.point?.kind!=='bone'||this.interactionActive;
    on('weight-transfer',()=>{if(!this.edit||!this.point||this.interactionActive)return;const target=this.data.points.find(p=>p.id===weightTarget.value);if(!target)throw Error('Zielknochen auswählen.');this.mutate(()=>this.rig.transferWeights(this.point!,target,this.weightAmount,this.weightLocal?{center:[...this.point!.rest],radius:this.weightRadius}:undefined));this.hooks.feedback('Oberflächen-Einfluss übertragen. Posen und Bewegungen prüfen.');});
    on('bone-delete',()=>{if(!this.edit||this.point?.kind!=='bone'||this.interactionActive)return;try{this.mutate(()=>{this.selected=this.rig.deleteBone(this.point!);});this.hooks.feedback('Knochen entfernt. Kinder und Hautgewichte dem Elternknochen zugeordnet; Posen prüfen.');}catch(error){this.hooks.feedback((error as Error).message);}});
    input('bone-ratio').disabled=!this.edit||this.point?.kind!=='bone'||this.interactionActive;
    input('bone-ratio').oninput=()=>{this.insertionRatio=Number(input('bone-ratio').value)/100;q('bone-ratio-value').textContent=Math.round(this.insertionRatio*100)+' %';};
    on('bone-insert',()=>{if(!this.edit||!this.point||this.interactionActive)return;try{this.mutate(()=>{this.selected=this.rig.insertJoint(this.point!,this.insertionRatio).id;});this.hooks.feedback('Zwischengelenk eingefügt. Hautgewichte angepasst; vorhandene Posen prüfen.');}catch(error){this.hooks.feedback((error as Error).message);}});
    on('studio-undo',()=>{const s=this.history.undo(this.snapshot());if(s)this.restore(s);});on('studio-redo',()=>{const s=this.history.redo(this.snapshot());if(s)this.restore(s);});
    on('studio-new',()=>this.mutate(()=>{this.rig.data=structuredClone(this.initial);this.data.poses=[];this.data.moves=[];this.rig.reset();this.selected=null;}));
    on('studio-save',()=>this.save());
    input('studio-pose-corrections').onchange=()=>{const enabled=input('studio-pose-corrections').checked;this.mutate(()=>{this.data.poseCorrections=enabled;this.rig.apply(this.rig.capture());});};
    q<HTMLButtonElement>('figure-rig-glb').onclick=()=>{void this.exportFigure(true).catch(error=>{if(!this.disposed)this.hooks.feedback(error instanceof Error?error.message:'GLB-Export fehlgeschlagen.');});};
    q<HTMLButtonElement>('figure-glb').onclick=()=>{void this.exportFigure().catch(error=>{if(!this.disposed)this.hooks.feedback(error instanceof Error?error.message:'GLB-Export fehlgeschlagen.');});};
    on('detect-joints',()=>{
      if(!this.rig.bones.length){this.hooks.feedback('Das Modell enthält kein Skelett. KI-Erkennung für ungeriggte Modelle ist noch nicht verfügbar.');return;}
      const points=detectJoints(this.rig);if(!points.length){this.hooks.feedback('Keine zusätzlichen Gelenke erkannt. Vorhandene Punkte bleiben erhalten.');return;}
      if(this.data.points.length+points.length>256)throw new Error('Höchstens 256 Kontrollpunkte pro Projekt.');
      this.mutate(()=>{for(const p of points){p.rest=this.rig.position(p).toArray();this.data.points.push(p);const value=this.data.boneRest[p.bone!];for(const pose of this.data.poses)pose.values[p.id]=structuredClone(value);if(this.data.draft)this.data.draft[p.id]=structuredClone(value);}});
      this.hooks.feedback('Erkannte Gelenke ergänzt.');
    });
    on('detect-links',()=>{const edges=detectConnections(this.rig);if(!edges.length){this.hooks.feedback('Keine zusätzlichen Skelettverbindungen erkannt. Freie Punkte bitte gezielt verbinden.');return;}
      if(this.data.links.length+edges.length>2048)throw new Error('Höchstens 2048 Verbindungen.');
      this.mutate(()=>this.data.links.push(...edges));this.hooks.feedback('Erkannte Verbindungen ergänzt.');});
    const links=q('studio-links');if(!this.data.links.length)links.textContent='Keine Verbindungen.';
    for(const edge of this.data.links){const row=document.createElement('div');row.className='connection-row';const name=document.createElement('span');name.dataset.userText='';name.textContent=edge.map(id=>this.data.points.find(p=>p.id===id)?.name??id).join(' ↔ ');const remove=document.createElement('button');remove.textContent='Verbindung entfernen';remove.onclick=()=>this.mutate(()=>{this.data.links=this.data.links.filter(e=>edgeKey(e)!==edgeKey(edge));});const kind=document.createElement('span');kind.textContent=this.rig.isBoneConnection(this.data.points.find(p=>p.id===edge[0])!,this.data.points.find(p=>p.id===edge[1])!)?'Gelenkkette':'Punktgruppe';row.append(name,kind,remove);links.append(row);}
    on('point-add',()=>{this.addingBoneParent=null;this.view.setAction('add');this.hooks.feedback('In die Figur klicken. Neben der Figur wird der Punkt auf der Ansichtsebene gesetzt.');});
    on('point-connect',()=>{this.view.setAction('connect');this.hooks.feedback('Zweiten Punkt anklicken. Eine vorhandene Verbindung wird gelöst.');});
    if(this.point){const p=this.point;const whole=p.id===FIGURE_TRACK;input('point-name').disabled=whole;input('point-size').disabled=whole;input('point-radius').disabled=whole;input('point-name').value=p.name;input('point-size').value=String(p.size);input('point-radius').value=String(p.radius);q('radius-label').hidden=p.kind==='bone'||whole;q('rotation-label').hidden=(!whole&&p.kind!=='bone')||this.edit;q('group-label').hidden=p.kind!=='surface'||this.edit||whole;
      q('figure-scale-label').hidden=!whole||this.edit;
      const scale=input('figure-scale');scale.value=String(this.rig.scale);
      scale.oninput=()=>{const value=Number(scale.value);if(!validFigureScale(value))return;if(!this.gesture)this.view.onStart();this.rig.setFigureScale(value);this.view.refresh();this.refreshNumbers();};
      const finishScale=()=>{if(this.gesture)this.view.onEnd();};scale.onchange=finishScale;scale.onblur=finishScale;scale.onpointercancel=finishScale;
      q('point-kind').textContent=whole?'Gesamte Figur verschieben, drehen oder gleichmäßig skalieren. Alles wird in jeder Pose gespeichert.':p.kind==='bone'?'Skelettpunkt: Ziehen beugt die verbundene Kette, ohne Knochen zu verlängern. Drehen ändert die Ausrichtung.':'Freier Oberflächenpunkt. Verbindungen gruppieren Punkte, ohne eine Gelenkkette vorauszusetzen.';
      input('point-name').onchange=()=>{const v=input('point-name').value.trim();if(v)this.mutate(()=>p.name=v);};
      input('point-size').onchange=()=>this.mutate(()=>p.size=Number(input('point-size').value));
      q('bend-fields').hidden=!this.edit||p.kind!=='bone';input('bend-enabled').checked=!!p.bendLimit;
      for(const key of ['min','max'] as const){const field=input('bend-'+key);field.value=String(p.bendLimit?.[key]??(key==='min'?0:175));field.disabled=!p.bendLimit;q('bend-'+key+'-value').textContent=field.value+'°';field.oninput=()=>{q('bend-'+key+'-value').textContent=field.value+'°';};field.onchange=()=>{const limit={min:Number(input('bend-min').value),max:Number(input('bend-max').value)};if(!validBendLimit(limit)){this.hooks.feedback('Ungültige IK-Beugegrenze.');this.render();return;}this.mutate(()=>{p.bendLimit=limit;});};}
      input('bend-enabled').onchange=()=>{const enabled=input('bend-enabled').checked;this.mutate(()=>{if(enabled)p.bendLimit={min:0,max:175};else delete p.bendLimit;});};
      input('point-radius').onchange=()=>this.mutate(()=>{p.radius=Number(input('point-radius').value);this.rig.apply(this.rig.capture());});
      ['x','y','z'].forEach((axis,i)=>{input(`point-${axis}`).onchange=()=>{const v=Number(input(`point-${axis}`).value);if(!Number.isFinite(v)||Math.abs(v)>100)return;this.mutate(()=>{const pos=this.rig.position(p).toArray();pos[i]=v;this.rig.setPoint(p,new T.Vector3().fromArray(pos),this.rig.rotation(p),this.edit,'translate');});};});
      q<HTMLSelectElement>('point-transform').value=this.rotate?'rotate':'translate';
      q<HTMLSelectElement>('point-transform').onchange=()=>{this.rotate=q<HTMLSelectElement>('point-transform').value==='rotate';this.view.setRotation(this.rotate);};
      input('point-group').onchange=()=>this.groupMove=input('point-group').checked;
      on('point-delete',()=>this.mutate(()=>{this.data.points=this.data.points.filter(x=>x.id!==p.id);this.data.links=this.data.links.filter(l=>!l.includes(p.id));this.data.poses.forEach(pose=>delete pose.values[p.id]);if(this.data.draft)delete this.data.draft[p.id];this.selected=null;this.rig.reset();}));
    }
    on('pose-reset',()=>this.mutate(()=>this.rig.reset()));
    on('pose-add',()=>{if(this.data.poses.length>=100)throw new Error('Höchstens 100 Posen.');const name=input('pose-name').value.trim()||`Pose ${poses.length+1}`;this.mutate(()=>this.data.poses.push({id:uid(),name,seconds:1,values:this.rig.capture()}));});
    const list=q<HTMLSelectElement>('pose-list');poses.forEach((p,i)=>list.add(new Option(`${p.review?.length?'⚠ ':''}${i+1}. ${p.name}`,p.id)));list.value=poses.some(p=>p.id===remembered['pose-list'])?remembered['pose-list']:(poses[0]?.id??'');const pose=()=>this.data.poses.find(p=>p.id===list.value);
    list.onchange=()=>{if(this.weightCorrection?.poseId!==list.value){this.weightCorrection=null;q('pose-weight-result').replaceChildren();}q('pose-limit-result').replaceChildren();q('pose-surface-result').replaceChildren();q<HTMLButtonElement>('pose-check-limits').disabled=!pose();q<HTMLButtonElement>('pose-check-surface').disabled=!pose()||!!this.surfaceCheck;q<HTMLButtonElement>('pose-gentler').disabled=!pose()||this.edit||!!this.surfaceCheck||this.data.poses.length>=100;q<HTMLButtonElement>('pose-surface-cancel').disabled=!this.surfaceCheck;q<HTMLButtonElement>('pose-weight-search').disabled=!pose()||this.edit||this.point?.kind!=='bone'||!!this.surfaceCheck;q<HTMLButtonElement>('pose-weight-apply').disabled=!this.weightCorrection||this.edit||!!this.surfaceCheck;q<HTMLInputElement>('pose-weight-radius').disabled=!!this.surfaceCheck;const p=pose();input('pose-seconds').value=String(p?.seconds??1);q('pose-review').hidden=!p?.review?.length;q('pose-review-reasons').replaceChildren();for(const reason of p?.review??[]){const li=document.createElement('li');li.textContent=reviewLabels[reason];q('pose-review-reasons').append(li);}};list.onchange(new Event('change'));
    on('pose-show',()=>{const p=pose();if(p)this.mutate(()=>{this.rig.reset();this.rig.apply(p.values);});});
    on('pose-replace',()=>{const p=pose();if(p)this.mutate(()=>{p.values=this.rig.capture();delete p.review;});});
    on('pose-check-limits',()=>{const p=pose();if(!p)return;const report=this.checkPoseLimits(p.id),host=q('pose-limit-result');host.replaceChildren();const summary=document.createElement('p');summary.textContent='Prüfung der gespeicherten Einzelpose. Zwischenbilder und Kollisionen sind nicht geprüft.';host.append(summary);
      if(!report.results.length){const note=document.createElement('p');note.textContent='Keine auswertbaren Zweiglied-Ketten mit Beugegrenzen.';host.append(note);}
      for(const result of report.results){const row=document.createElement('p'),label=document.createElement('span'),status=document.createElement('strong');label.dataset.userText='';label.textContent=`${result.name} [${result.jointId}]: ${result.angle===null?'—':result.angle.toFixed(2)+'°'} (${result.min}–${result.max}°) · `;status.textContent=result.status==='within'?'Innerhalb der Grenze':result.status==='outside'?'Grenze verletzt':'Nicht messbar';row.append(label,status);host.append(row);}
      for(const point of report.unmatched){const row=document.createElement('p'),label=document.createElement('span'),status=document.createElement('strong');label.dataset.userText='';label.textContent=point.name+' ['+point.id+']: ';status.textContent='Keine passende verbundene Zweiglied-Kette';row.append(label,status);host.append(row);}
    });
    on('pose-reviewed',()=>{const p=pose();if(p?.review?.length)this.mutate(()=>{delete p.review;});});
    on('pose-check-surface',()=>{const p=pose();if(!p)return;const report=this.checkPoseSurface(p.id),host=q('pose-surface-result');host.replaceChildren();
      const summary=document.createElement('p');summary.textContent=report.status==='outside'?'Auffällige Oberflächenverformung.':report.status==='within'?'Keine Überschreitung der Verformungsgrenzen.':'Keine auswertbare Dreiecksoberfläche.';host.append(summary);
      const counts=document.createElement('p');counts.dataset.userText='';counts.textContent=`${report.issues} / ${report.compared} △ · ${report.referenceDegenerate} △ ∅`;host.append(counts);
      const detail=document.createElement('details'),heading=document.createElement('summary');heading.textContent='Messwerte nach Teilmodell';detail.append(heading);
      for(const mesh of report.meshes){const row=document.createElement('p');row.dataset.userText='';row.textContent=`${mesh.name}: ${mesh.issues}/${mesh.compared} △ · min ${mesh.minimumStretch?.toFixed(3)??'—'}× · max ${mesh.maximumStretch?.toFixed(3)??'—'}× · ${mesh.referenceDegenerate} △ ∅`;detail.append(row);const volume=document.createElement('p');volume.textContent=volumeText(mesh.volume);detail.append(volume);}host.append(detail);
      const limits=document.createElement('p');limits.textContent='Prüfgrenzen: Dehnung 0,25–3×, Fläche mindestens 0,1×. Volumenschätzung geschlossener Netzteile: 0,8–1,2× (Prüfheuristik). Offene Flächen sind nicht messbar; Selbstüberschneidungen und lokale Einschnürungen bleiben ungeprüft. ∅: bereits in der Grundform nicht messbar.';host.append(limits);
    });
    q<HTMLButtonElement>('pose-gentler').onclick=()=>{const p=pose();if(!p)return;void this.createGentlerPose(p.id).then(result=>{if(!this.disposed&&!result)this.hooks.feedback('Keine schonendere Pose innerhalb der Prüfgrenzen gefunden. Rig und Hautgewichte gezielt korrigieren.');}).catch(error=>{if(!this.disposed)this.hooks.feedback(error instanceof Error&&error.name==='AbortError'?'Prüfung abgebrochen.':error instanceof Error?error.message:'Prüfung fehlgeschlagen.');});};
    const correction=this.weightCorrection;if(correction){const row=q('pose-weight-result');const numbers=document.createElement('span');numbers.dataset.userText='';const from=this.data.points.find(p=>p.id===correction.from)?.name,to=this.data.points.find(p=>p.id===correction.to)?.name;numbers.textContent=`${from} → ${to}: ${Math.round(correction.amount*100)} % · ${correction.before.issues} → ${correction.after.issues} △ · ${correction.checkedPoses} / ${correction.intermediateSamples}`;row.append(numbers);for(let i=0;i<correction.after.meshes.length;i++){const v=document.createElement('p');v.textContent=volumeText(correction.after.meshes[i].volume);row.append(v);}const legend=document.createElement('p');legend.textContent='Vergleich: gespeicherte Posen / Zwischenposen. Dreiecke: vorher → nachher.';row.append(legend);const note=document.createElement('p');note.textContent='Verbesserung gemessen. Noch nicht übernommen; Kollisionen und Charakterdesign sind nicht geprüft.';row.append(note);}
    input('pose-weight-radius').onchange=()=>{const radius=Number(input('pose-weight-radius').value);if(!Number.isFinite(radius)||radius<.005||radius>2){this.hooks.feedback('Gelenk und gültigen Korrekturradius wählen.');input('pose-weight-radius').value=String(this.weightRadius);return;}this.weightRadius=radius;this.weightCorrection=null;this.render();};
    q<HTMLButtonElement>('pose-weight-search').onclick=()=>{const p=pose();if(!p)return;void this.findWeightCorrection(p.id).then(result=>{if(!this.disposed&&!result)this.hooks.feedback('Keine lokale Hautkorrektur mit bestandener Vergleichsprüfung gefunden.');}).catch(error=>{if(!this.disposed)this.hooks.feedback(error instanceof Error&&error.name==='AbortError'?'Prüfung abgebrochen.':error instanceof Error?error.message:'Prüfung fehlgeschlagen.');});};
    on('pose-weight-apply',()=>this.applyWeightCorrection());
    const automatic=this.automaticSummary();q<HTMLButtonElement>('skin-auto-start').disabled=!!this.automaticCheck||!!this.surfaceCheck||!!this.moveCheck||this.edit||this.interactionActive||!this.data.poses.length;
    q<HTMLButtonElement>('skin-auto-cancel').disabled=!this.automaticCheck;
    for(const id of ['skin-auto-original','skin-auto-preview','skin-auto-apply'])q<HTMLButtonElement>(id).disabled=!automatic;
    q<HTMLButtonElement>('skin-auto-stop').disabled=!this.rig.skinPreviewActive;
    const fail=(error:unknown)=>{if(!this.disposed&&this.active)this.hooks.feedback(error instanceof Error&&error.name==='AbortError'?'Prüfung abgebrochen.':error instanceof Error?error.message:'Prüfung fehlgeschlagen.');};
    q<HTMLButtonElement>('skin-auto-start').onclick=()=>{void this.startAutomaticSkinCorrection().catch(fail);};
    q<HTMLButtonElement>('skin-auto-cancel').onclick=()=>this.automaticCheck?.abort();
    on('skin-auto-original',()=>{if(automatic)this.previewAutomaticSkinCorrection(automatic.id,false);});on('skin-auto-preview',()=>{if(automatic)this.previewAutomaticSkinCorrection(automatic.id,true);});
    on('skin-auto-stop',()=>{this.rig.stopSkinPreview();this.view.setEnabled(this.active);this.view.refresh();this.render();});
    on('skin-auto-apply',()=>{if(automatic)this.applyAutomaticSkinCorrection(automatic.id);});
    if(automatic){const result=q('skin-auto-result'),numbers=document.createElement('p');numbers.dataset.userText='';numbers.textContent=`${automatic.beforeIssues} → ${automatic.afterIssues} △ · ${automatic.checkedPoses} P · ${automatic.checkedMoves} M · ${automatic.motionSamples} F · ${automatic.checkedCandidates} V`;result.append(numbers);for(const v of automatic.volume){const row=document.createElement('p');row.textContent=`Volumenschätzung · ${v.mesh}: ${v.before.minimumRatio?.toFixed(3)??'nicht messbar'} → ${v.after.minimumRatio?.toFixed(3)??'nicht messbar'}× · ${v.after.unmeasurableComponents} nicht messbar`;result.append(row);}const legend=document.createElement('p');legend.textContent='Gemessene Zielpose: vorher → nachher. P: gespeicherte Posen, M: eigene Moves, F: Move-Stichproben, V: Suchvarianten. Noch nicht übernommen.';result.append(legend);}
    else if(this.automaticOutcome==='none')q('skin-auto-result').textContent='Keine Korrektur mit bestandener Gegenprüfung gefunden.';
    if(this.automaticProgress)this.showAutomaticProgress(this.automaticProgress);

    on('pose-surface-cancel',()=>this.surfaceCheck?.abort());
    on('pose-delete',()=>{const p=pose();if(p){if(this.data.moves.some(m=>m.poses.includes(p.id)))throw new Error('Diese Pose wird noch von einer Bewegung verwendet. Zuerst die Bewegung löschen.');this.mutate(()=>this.data.poses=this.data.poses.filter(x=>x!==p));}});
    input('pose-seconds').onchange=()=>{const p=pose(),v=Number(input('pose-seconds').value);if(p && v>=.1&&v<=30)this.mutate(()=>p.seconds=v);};
    for(const [button,offset] of [['pose-up',-1],['pose-down',1]] as const)on(button,()=>{const p=pose(),i=poses.indexOf(p!);if(i>=0 && i+offset>=0 && i+offset<poses.length)this.mutate(()=>{[poses[i],poses[i+offset]]=[poses[i+offset],poses[i]];});});
    on('move-add',()=>{const id=input('move-id').value.trim(),name=input('move-name').value.trim();if(!/^[a-z0-9][a-z0-9_-]{0,99}$/.test(id)||!name)throw new Error('Name und eindeutiges Schlagwort angeben (a–z, 0–9, _ oder -).');if(this.project.avatar.moves.some(m=>m.id===id)||this.data.moves.some(m=>m.id===id))throw new Error('Dieses Schlagwort ist bereits vergeben.');if(this.data.moves.length>=100)throw new Error('Höchstens 100 Bewegungen.');const loop=input('move-loop').checked;this.mutate(()=>this.data.moves.push({id,name,loop,poses:poses.map(p=>p.id)}));});
    const moves=q<HTMLSelectElement>('studio-moves');this.data.moves.forEach(m=>moves.add(new Option(`${moveReview(this.data,m).needsReview?'⚠ ':''}${m.name}`,m.id)));
    moves.value=this.data.moves.some(m=>m.id===remembered['studio-moves'])?remembered['studio-moves']:(this.data.moves[0]?.id??'');
    const steps=q<HTMLSelectElement>('move-steps');
    const stepButtons=()=>{const m=this.data.moves.find(m=>m.id===moves.value),index=Number(steps.value),locked=this.edit||this.interactionActive;
      q<HTMLButtonElement>('move-step-up').disabled=locked||!m||index<=0;
      q<HTMLButtonElement>('move-step-down').disabled=locked||!m||index>=m.poses.length-1;
      q<HTMLButtonElement>('move-step-remove').disabled=locked||!m||m.poses.length<=2;
      q<HTMLButtonElement>('move-step-add').disabled=locked||!m||m.poses.length>=100||!pose();
      q<HTMLButtonElement>('move-step-replace').disabled=locked||!m||!pose();
    };
    steps.onchange=stepButtons;
    const poseChange=list.onchange;list.onchange=event=>{poseChange?.call(list,event);stepButtons();};
    const rebuildSteps=(selected=0)=>{steps.replaceChildren();const m=this.data.moves.find(m=>m.id===moves.value);m?.poses.forEach((id,i)=>{const p=this.data.poses.find(p=>p.id===id)!;steps.add(new Option(`${i+1}. ${p.name} [${id}] · ${p.seconds} s`,String(i)));});steps.value=String(Math.max(0,Math.min(selected,(m?.poses.length??1)-1)));stepButtons();};
    moves.onchange=()=>{q<HTMLButtonElement>('move-glb-export').disabled=!moves.value||this.exportingFigure||this.interactionActive;rebuildSteps();q('move-limit-result').replaceChildren();q('move-surface-result').replaceChildren();for(const id of ['move-check-limits','move-check-surface'])q<HTMLButtonElement>(id).disabled=!!this.moveCheck||!!this.surfaceCheck||!moves.value;q<HTMLButtonElement>('move-check-cancel').disabled=!this.moveCheck;const m=this.data.moves.find(m=>m.id===moves.value);q('move-review').hidden=!m||!moveReview(this.data,m).needsReview;};moves.onchange(new Event('change'));rebuildSteps(Number(remembered['move-steps'])||0);
    for(const id of ['pose-name','move-name','move-id'])input(id).value=remembered[id];input('move-loop').checked=loop;
    const changeStep=(operation:'up'|'down'|'remove'|'add'|'replace')=>{const move=this.data.moves.find(m=>m.id===moves.value);if(!move)return;const sequence=[...move.poses];let index=Number(steps.value);if(!Number.isInteger(index)||index<0||index>=sequence.length)return;
      if(operation==='up'||operation==='down'){const target=index+(operation==='up'?-1:1);if(target<0||target>=sequence.length)return;[sequence[index],sequence[target]]=[sequence[target],sequence[index]];index=target;}
      else if(operation==='remove')sequence.splice(index,1);
      else {const selected=pose();if(!selected)return;if(operation==='add'){index++;sequence.splice(index,0,selected.id);}else sequence[index]=selected.id;}
      this.updateMoveSequence(move.id,sequence);const select=this.host.querySelector<HTMLSelectElement>('#move-steps');if(select){select.value=String(Math.min(index,sequence.length-1));select.dispatchEvent(new Event('change'));}
    };
    for(const [id,operation] of [['move-step-up','up'],['move-step-down','down'],['move-step-remove','remove'],['move-step-add','add'],['move-step-replace','replace']] as const)on(id,()=>changeStep(operation));
    on('move-preview',()=>this.play(moves.value,true));on('move-stop',()=>this.stopPreview());on('move-delete',()=>this.mutate(()=>this.data.moves=this.data.moves.filter(m=>m.id!==moves.value)));
    on('move-inspect-save',()=>this.captureInspectionPose());
    q<HTMLButtonElement>('move-check-limits').onclick=()=>{const id=moves.value,revision=this.revision;void this.checkMoveLimits(id).then(report=>{
      if(this.disposed||!this.active||this.host.querySelector<HTMLSelectElement>('#studio-moves')?.value!==id)return;
      const host=q('move-limit-result');host.replaceChildren();const summary=document.createElement('p');summary.textContent='Stichprobe: 16 Schritte je Übergang. Kein lückenloser Nachweis; Kollisionen sind nicht geprüft.';host.append(summary);const count=document.createElement('p');count.dataset.userText='';const countLabel=document.createElement('span');countLabel.textContent='Geprüfte Stichproben';host.append(countLabel);count.textContent=String(report.samples);host.append(count);
      if(!report.joints.length){const note=document.createElement('p');note.textContent='Keine auswertbaren Zweiglied-Ketten mit Beugegrenzen.';host.append(note);}
      for(const item of report.joints){const row=document.createElement('p'),label=document.createElement('span'),status=document.createElement('strong');label.dataset.userText='';label.textContent=`${item.name} [${item.jointId}]: ${item.minimum?.toFixed(2)??'—'}–${item.maximum?.toFixed(2)??'—'}° (${item.min}–${item.max}°) · `;status.textContent=item.violations?'Grenze verletzt':item.unmeasurable?'Nicht messbar':'Keine Verletzung in den Stichproben';row.append(label,status);if(item.firstIssue!==null){const time=document.createElement('span');time.dataset.userText='';time.textContent=' · '+item.firstIssue.toFixed(3)+' s';row.append(time);const show=document.createElement('button');show.textContent='Auffälliges Bild ansehen';show.onclick=()=>{try{this.previewMoveAt(id,item.firstIssue!,revision);}catch(error){this.hooks.feedback(error instanceof Error?error.message:'Prüfung fehlgeschlagen.');}};row.append(show);}host.append(row);}
      for(const point of report.unmatched){const row=document.createElement('p'),name=document.createElement('span'),status=document.createElement('strong');name.dataset.userText='';name.textContent=point.name+' ['+point.id+']: ';status.textContent='Keine passende verbundene Zweiglied-Kette';row.append(name,status);host.append(row);}
    }).catch(error=>{if(!this.disposed&&this.active)this.hooks.feedback(error instanceof Error&&error.name==='AbortError'?'Prüfung abgebrochen.':error instanceof Error?error.message:'Prüfung fehlgeschlagen.');});};
    q<HTMLButtonElement>('move-check-surface').onclick=()=>{const id=moves.value,revision=this.revision;void this.checkMoveSurface(id).then(report=>{
      if(this.disposed||!this.active||this.revision!==revision||this.host.querySelector<HTMLSelectElement>('#studio-moves')?.value!==id)return;
      const host=q('move-surface-result');host.replaceChildren();const summary=document.createElement('p');summary.textContent='Oberflächenstichprobe: 16 Grundschritte je Übergang einschließlich Schleifenschluss, ergänzt um höchstens 64 adaptive Zwischenbilder an auffälligen Abschnitten. Kein lückenloser Nachweis. Volumenschätzung nur für geschlossene Netzteile (0,8–1,2×). Selbstüberschneidungen und lokale Einschnürungen sind nicht geprüft.';host.append(summary);
      const count=document.createElement('p');count.dataset.userText='';count.textContent=String(report.samples);const label=document.createElement('span');label.textContent='Geprüfte Stichproben';host.append(label,count);
      for(const item of report.meshes){const row=document.createElement('p'),name=document.createElement('span'),status=document.createElement('strong');name.dataset.userText='';name.textContent=`${item.name}: ${item.maximumIssues} / ${item.compared} △ · `;status.textContent=item.invalidSamples?'Nicht messbar':item.maximumIssues||item.volume.maximumIssues?'Oberfläche auffällig':'Keine Auffälligkeit in den Stichproben';row.append(name,status);
        const v=document.createElement('span');v.textContent=` · Volumenschätzung: ${item.volume.maximumIssues} auffällig · min ${item.volume.minimumRatio?.toFixed(3)??'—'}× · max ${item.volume.maximumRatio?.toFixed(3)??'—'}× · ${item.volume.unmeasurableSamples} Stichproben teilweise/nicht messbar`;row.append(v);const time=item.worstTime??item.volume.worstTime??item.firstIssue??item.volume.firstIssue;if(time!==null){const value=document.createElement('span');value.dataset.userText='';value.textContent=' · '+time.toFixed(3)+' s';const show=document.createElement('button');show.textContent='Auffälliges Bild ansehen';show.onclick=()=>{try{this.previewMoveAt(id,time,revision);}catch(error){this.hooks.feedback(error instanceof Error?error.message:'Prüfung fehlgeschlagen.');}};row.append(value,show);}host.append(row);}
    }).catch(error=>{if(!this.disposed&&this.active)this.hooks.feedback(error instanceof Error&&error.name==='AbortError'?'Prüfung abgebrochen.':error instanceof Error?error.message:'Prüfung fehlgeschlagen.');});};
    q<HTMLButtonElement>('move-check-cancel').onclick=()=>this.moveCheck?.abort();
    q<HTMLButtonElement>('move-glb-export').disabled=!moves.value||this.exportingFigure||this.interactionActive;
    q<HTMLButtonElement>('move-glb-export').onclick=()=>{void this.exportAnimatedMove(moves.value).catch(error=>{if(!this.disposed)this.hooks.feedback(error instanceof Error?error.message:'GLB-Export fehlgeschlagen.');});};
    q<HTMLButtonElement>('move-export').disabled=!moves.value;
    q<HTMLButtonElement>('move-export').onclick=()=>{void this.exportMove(moves.value).then(value=>{if(this.disposed)return;const url=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=value.move.id+'.pakachi-move.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}).catch(error=>{if(!this.disposed)this.hooks.feedback(error instanceof Error?error.message:'Move-Export fehlgeschlagen.');});};
    on('move-import',()=>input('move-file').click());
    const library=q<HTMLSelectElement>('library-moves');this.library.forEach(m=>library.add(new Option(m.name,m.id)));library.value=this.library.some(m=>m.id===remembered['library-moves'])?remembered['library-moves']:(this.library[0]?.id??'');
    const report=(error:unknown)=>{if(!this.disposed&&this.active&&!(error instanceof Error&&error.name==='AbortError'))this.hooks.feedback(error instanceof Error?error.message:'Move-Sammlung nicht erreichbar.');};
    q<HTMLButtonElement>('library-refresh').disabled=!!this.libraryRequest;
    q<HTMLButtonElement>('library-import').disabled=!!this.libraryRequest||!library.value;
    q<HTMLButtonElement>('library-refresh').onclick=()=>{void this.refreshMoveLibrary().catch(report);};
    q<HTMLButtonElement>('library-import').onclick=()=>{const item=this.library.find(m=>m.id===library.value);if(item)void this.importLibraryMove(item).catch(report);};
    input('move-file').onchange=()=>{const file=input('move-file').files?.[0],revision=this.revision;input('move-file').value='';if(!file)return;void (async()=>{if(file.size>MAX_MOVE_FILE)throw Error('Move-Datei ist größer als 8 MiB.');await this.importMove(JSON.parse(await file.text()),revision);})().catch(error=>{if(!this.disposed)this.hooks.feedback(error instanceof Error?error.message:'Move-Import fehlgeschlagen.');});};
    if(this.playing){this.host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(e=>e.disabled=e.id!=='move-stop'&&e.id!=='studio-agent-edit'&&!(e.id==='move-inspect-save'&&this.inspectionOrigin&&this.paused&&this.data.poses.length<100));}
    if(this.rig.skinPreviewActive){this.host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(e=>e.disabled=!['skin-auto-original','skin-auto-preview','skin-auto-stop','skin-auto-apply'].includes(e.id)||e.id!=='skin-auto-stop'&&!this.automaticSummary());}
    this.view.setFigureEnabled(!this.edit);this.view.setRotation(this.rotate && !this.edit);this.view.select(this.selected);this.refreshWeightPreview();this.refreshWeightColors();this.refreshNumbers();
  }
  inspect(args:Record<string,unknown>={}) {
    const section=args.section??'info',offset=args.offset??0,limit=args.limit??32;
    if(Object.keys(args).some(k=>!['section','offset','limit'].includes(k))||!['info','points','poses','moves'].includes(section as string)||!Number.isInteger(offset)||(offset as number)<0||!Number.isInteger(limit)||(limit as number)<1||(limit as number)>32)throw new Error('Ungültige Studio-Abfrage.');
    const info={view:this.view.weightView?.(),session:this.session,revision:this.revision,dirty:this.dirty,open:this.active,editable:this.active&&this.agentEditing&&!this.interactionActive,mode:this.edit?'rig':'pose',figure:{id:FIGURE_TRACK,scale:this.rig.scale,position:this.rig.position(this.rig.figure).toArray(),rotation:this.rig.rotation(this.rig.figure).toArray()},counts:{points:this.data.points.length,poses:this.data.poses.length,moves:this.data.moves.length,surfaces:this.rig.surfaces.length},undo:this.history.canUndo,redo:this.history.canRedo,poseCorrections:{available:poseMorphBindings(this.rig.root).length>0,enabled:this.rig.poseCorrectionsActive,compatible:this.rig.poseCorrectionsCompatible},weightCorrection:this.weightCorrection?{status:'proposal',poseId:this.weightCorrection.poseId,from:this.weightCorrection.from,to:this.weightCorrection.to,amount:this.weightCorrection.amount,region:structuredClone(this.weightCorrection.region),beforeIssues:this.weightCorrection.before.issues,afterIssues:this.weightCorrection.after.issues,beforeVolumeIssues:this.weightCorrection.before.volumeIssues,afterVolumeIssues:this.weightCorrection.after.volumeIssues,volume:this.weightCorrection.after.meshes.slice(0,32).map(m=>({mesh:m.mesh,...summarizeVolume(m.volume)})),checkedPoses:this.weightCorrection.checkedPoses,intermediateSamples:this.weightCorrection.intermediateSamples,requiresVisualReview:true,unchecked:['collisions','self-intersections','local-volume','character-design','continuous-motion']}:null};
    const extended={...info,automaticSkinCorrection:this.automaticSummary(),automaticSkinJob:this.automaticProgress&&this.automaticCheck?{...this.automaticProgress}:null};if(section==='info')return extended;
    const items=section==='points'?this.data.points.map(p=>({...p,...(p.kind==='bone'?{parentBone:this.rig.bones.indexOf(this.rig.bones[p.bone!].parent as T.Bone)<0?null:this.rig.bones.indexOf(this.rig.bones[p.bone!].parent as T.Bone),parentId:this.data.points.find(q=>q.kind==='bone'&&this.rig.bones[q.bone!]===this.rig.bones[p.bone!].parent)?.id??null}:{}),position:this.rig.position(p).toArray(),rotation:this.rig.rotation(p).toArray(),ikChain:this.rig.poseChain(p).map(b=>this.data.points.find(p=>p.kind==='bone'&&this.rig.bones[p.bone!]===b)!.id),connections:this.data.links.filter(l=>l.includes(p.id)).map(l=>l[0]===p.id?l[1]:l[0])})):section==='poses'?this.data.poses.map(p=>({id:p.id,name:p.name,seconds:p.seconds,review:p.review??[]})):this.data.moves.map(m=>({id:m.id,name:m.name,loop:m.loop,poseCount:m.poses.length,poses:[...m.poses],...moveReview(this.data,m)}));
    // Bound pages by count and UTF-8 size so both MCP bridges stay below their payload limit.
    const page:unknown[]=[];let bytes=0;for(const item of items.slice(offset as number,(offset as number)+(limit as number))){const length=new TextEncoder().encode(JSON.stringify(item)).length;if(page.length&&bytes+length>40000)break;page.push(item);bytes+=length;}
    return {...extended,section,total:items.length,items:page,nextOffset:(offset as number)+page.length<items.length?(offset as number)+page.length:null};
  }
  execute(raw:unknown) {
    const c=parseStudioCommand(raw);
    if(!this.active||!this.agentEditing)throw new Error('Studio-Bearbeitung durch KI ist nicht freigegeben.');
    if(this.interactionActive&&!(c.action==='apply_skin_correction'&&this.rig.skinPreviewActive))throw new Error('Studio ist beschäftigt. Nach Vorschau oder Ziehgeste erneut abfragen.');
    if(c.session!==this.session||c.expectedRevision!==this.revision)throw new Error('Studio-Stand hat sich geändert. get_studio erneut abfragen.');
    if(c.action==='apply_skin_correction'){this.applyAutomaticSkinCorrection(c.id!);return {accepted:true,session:this.session,revision:this.revision};}
    const point=c.id===FIGURE_TRACK?this.rig.figure:this.data.points.find(p=>p.id===c.id),pose=this.data.poses.find(p=>p.id===c.id);
    const require=(ok:unknown,message='Studio-Aktion passt nicht zum aktuellen Modus oder Ziel.'):void=>{if(!ok)throw new Error(message);};
    let resultId:string|undefined;
    switch(c.action){
      case 'set_mode':require(c.mode);this.revision++;this.edit=c.mode==='rig';this.selected=null;this.addingBoneParent=null;this.view.setAction('select');this.rig.reset();this.render();break;
      case 'add_point':{
        require(this.edit&&c.position&&this.data.points.length<256);require(c.mesh===undefined||c.mesh<this.rig.surfaces.length);
        this.mutate(()=>{const p:ControlPoint={id:uid(),name:c.name?.trim()||`Punkt ${this.data.points.length+1}`,kind:'surface',rest:[...c.position!],size:c.size??.015,radius:c.radius??.12,...(c.mesh!==undefined?{mesh:c.mesh}:{})};this.data.points.push(p);for(const pose of this.data.poses)pose.values[p.id]={position:[...p.rest],rotation:[0,0,0,1]};if(this.data.draft)this.data.draft[p.id]={position:[...p.rest],rotation:[0,0,0,1]};this.selected=p.id;resultId=p.id;this.rig.reset();});break;
      }
      case 'update_point':{
        require(point);const p=point!;require(p.id!==FIGURE_TRACK||!this.edit);require(c.rotation===undefined||!this.edit&&(p.kind==='bone'||p.id===FIGURE_TRACK));require(p.id!==FIGURE_TRACK||(c.size===undefined&&c.radius===undefined&&c.name===undefined));require(c.radius===undefined||p.kind==='surface');require(c.scale===undefined||p.id===FIGURE_TRACK&&!this.edit);require(c.bendLimit===undefined||this.edit&&p.kind==='bone');require(['name','position','rotation','scale','size','radius','bendLimit'].some(k=>k in c));
        this.mutate(()=>{if(c.bendLimit!==undefined){if(c.bendLimit===null)delete p.bendLimit;else p.bendLimit=structuredClone(c.bendLimit);}if(c.name!==undefined)p.name=c.name.trim();if(c.size!==undefined)p.size=c.size;if(c.radius!==undefined)p.radius=c.radius;if(c.position||c.rotation)this.rig.setPoint(p,c.position?new T.Vector3().fromArray(c.position):this.rig.position(p),c.rotation?new T.Quaternion().fromArray(c.rotation):this.rig.rotation(p),this.edit,c.position?(c.rotation?'both':'translate'):'rotate');else this.rig.apply(this.rig.capture());if(c.scale!==undefined)this.rig.setFigureScale(c.scale);this.selected=p.id;});break;
      }
      case 'add_bone':require(this.edit&&point?.kind==='bone');this.mutate(()=>{const added=this.rig.addBone(point!,new T.Vector3().fromArray(c.position!));this.selected=added.id;resultId=added.id;});break;
      case 'insert_bone':require(this.edit&&point?.kind==='bone');this.mutate(()=>{const added=this.rig.insertJoint(point!,c.ratio??.5);this.selected=added.id;resultId=added.id;});break;
      case 'transfer_weights':{const target=this.data.points.find(p=>p.id===c.target);require(this.edit&&point?.kind==='bone'&&target?.kind==='bone');this.mutate(()=>{this.rig.transferWeights(point!,target!,c.amount!,c.region);this.selected=point!.id;});break;}
      case 'reparent_bone':{const target=this.data.points.find(p=>p.id===c.target);require(this.edit&&point?.kind==='bone'&&target?.kind==='bone');this.mutate(()=>{this.rig.reparentBone(point!,target!);this.selected=point!.id;});break;}
      case 'delete_bone':require(this.edit&&point?.kind==='bone');this.mutate(()=>{this.selected=this.rig.deleteBone(point!);});break;
      case 'delete_point':require(this.edit&&point&&point.id!==FIGURE_TRACK);this.mutate(()=>{this.data.points=this.data.points.filter(p=>p.id!==c.id);this.data.links=this.data.links.filter(l=>!l.includes(c.id!));for(const p of this.data.poses)delete p.values[c.id!];if(this.data.draft)delete this.data.draft[c.id!];this.selected=null;this.rig.reset();});break;
      case 'connect_points':case 'disconnect_points':{
        require(this.edit&&point&&point.id!==FIGURE_TRACK&&c.target!==c.id&&this.data.points.some(p=>p.id===c.target));const index=this.data.links.findIndex(l=>l.includes(c.id!)&&l.includes(c.target!));if(c.action==='connect_points'&&index<0)this.rig.validateConnection(point!,this.data.points.find(p=>p.id===c.target)!);require(c.action!=='connect_points'||index>=0||this.data.links.length<2048);
        if(c.action==='connect_points'&&index<0)this.mutate(()=>this.data.links.push([c.id!,c.target!]));else if(c.action==='disconnect_points'&&index>=0)this.mutate(()=>{this.data.links.splice(index,1);});else this.revision++;break;
      }
      case 'save_pose':require(!this.edit&&this.data.poses.length<100);this.mutate(()=>{resultId=uid();this.data.poses.push({id:resultId,name:c.name?.trim()||`Pose ${this.data.poses.length+1}`,seconds:c.seconds??1,values:this.rig.capture()});});break;
      case 'apply_pose':require(!this.edit&&pose);this.mutate(()=>{this.rig.reset();this.rig.apply(pose!.values);});break;
      case 'replace_pose':require(!this.edit&&pose);this.mutate(()=>{pose!.values=this.rig.capture();delete pose!.review;});break;
      case 'create_move':require(!this.edit&&c.id&&c.id!==FIGURE_TRACK&&c.name&&c.poses&&c.poses.every(id=>this.data.poses.some(p=>p.id===id))&&this.data.moves.length<100&&!this.data.moves.some(m=>m.id===c.id)&&!this.project.avatar.moves.some(m=>m.id===c.id));this.mutate(()=>{this.data.moves.push({id:c.id!,name:c.name!.trim(),poses:[...c.poses!],loop:c.loop??false});resultId=c.id;});break;
      case 'update_move':require(c.id&&c.poses);this.updateMoveSequence(c.id!,c.poses!,c.expectedRevision);resultId=c.id;break;
      case 'update_moves':this.updateMoveSequences(c.updates!,c.expectedRevision);break;
      case 'undo':case 'redo':{const snapshot=c.action==='undo'?this.history.undo(this.snapshot()):this.history.redo(this.snapshot());require(snapshot,'Kein weiterer Bearbeitungsschritt.');this.restore(snapshot!);break;}
    }
    this.hooks.feedback('Studio-Änderung durch KI übernommen.');return {accepted:true,session:this.session,revision:this.revision,...(resultId?{id:resultId}:{})};
  }
  private async withLibrary<T>(work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
    if(this.disposed||!this.active||this.interactionActive||this.libraryRequest)throw Error('Studio ist beschäftigt oder geschlossen.');
    const request=new AbortController();this.libraryRequest=request;const timeout=setTimeout(()=>request.abort(),30000);this.render();
    try{return await work(request.signal);}finally{clearTimeout(timeout);if(this.libraryRequest===request)this.libraryRequest=null;if(!this.disposed&&this.active)this.render();}
  }
  async refreshMoveLibrary(base=import.meta.env?.BASE_URL??'/',fetcher:typeof fetch=fetch){
    return this.withLibrary(async signal=>{const entries=await loadMoveLibrary(base,signal,fetcher);signal.throwIfAborted();this.library=entries;this.hooks.feedback(entries.length?'Move-Sammlung geladen.':'Die Move-Sammlung ist leer.');});
  }
  async importLibraryMove(item:LibraryMove,base=import.meta.env?.BASE_URL??'/',fetcher:typeof fetch=fetch){
    const revision=this.revision;
    return this.withLibrary(async signal=>{const file=await loadLibraryMove(item,base,signal,fetcher);signal.throwIfAborted();await this.importMove(file,revision,signal);});
  }
  async exportFigure(withRig=false){
    if(this.disposed||!this.active||this.interactionActive||this.exportingFigure)throw Error('Studio ist beschäftigt oder geschlossen.');
    const revision=this.revision;this.exportingFigure=true;this.render();
    try{
      this.view.setWeightBone?.(null);
      const exporting=withRig?exportRiggedFigureGLB(this.rig.root):exportFigureGLB(this.rig.surfaces.map(s=>s.mesh));
      this.refreshWeightColors();
      const bytes=await exporting;
      if(this.disposed||!this.active||this.revision!==revision||this.interactionActive)throw Error('Studio geändert; GLB-Export verworfen. Bitte erneut exportieren.');
      const url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download=this.project.avatar.id+(withRig?'-rig.glb':'-standbild.glb');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      this.hooks.feedback(withRig?'GLB mit Hautskelett heruntergeladen. Studio-Posen und Animationen zusätzlich im Projekt speichern.':'GLB-Standbild heruntergeladen. Rig, Posen und Animationen bleiben im Studio-Projekt.');
    }finally{this.exportingFigure=false;if(!this.disposed){this.refreshWeightColors();this.render();}}
  }
  async exportAnimatedMove(id:string){
    if(this.disposed||!this.active||this.interactionActive||this.exportingFigure)throw Error('Studio ist beschäftigt oder geschlossen.');
    const move=this.data.moves.find(m=>m.id===id);if(!move)throw Error('Bewegung fehlt.');
    const revision=this.revision;this.exportingFigure=true;this.render();
    try{
      this.view.setWeightBone?.(null);const exporting=exportMoveGLB(this.rig,move);this.refreshWeightColors();const bytes=await exporting;
      if(this.disposed||!this.active||this.revision!==revision||this.interactionActive)throw Error('Studio geändert; GLB-Export verworfen. Bitte erneut exportieren.');
      const url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download=this.project.avatar.id+'-'+move.id+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      this.hooks.feedback('GLB mit ausgewähltem Studio-Move heruntergeladen. Schleifenwiedergabe im Zielprogramm wählen.');
    }finally{this.exportingFigure=false;if(!this.disposed){this.refreshWeightColors();this.render();}}
  }
  async exportMove(id:string){if(this.disposed||!this.active||this.interactionActive)throw Error('Studio ist beschäftigt oder geschlossen.');return exportMoveFile(this.exportProject(),id);}
  async importMove(value:unknown,expectedRevision=this.revision,signal?:AbortSignal){
    const valid=()=>!signal?.aborted&&!this.disposed&&this.active&&!this.interactionActive&&this.revision===expectedRevision;
    if(!valid())throw Error('Studio-Stand hat sich geändert. Move erneut importieren.');
    const data=await importMoveFile(value,this.exportProject());
    if(!valid())throw Error('Studio-Stand hat sich geändert. Move erneut importieren.');
    this.mutate(()=>{this.rig.data=data;});
    const moves=this.host.querySelector<HTMLSelectElement>('#studio-moves');if(moves){moves.value=data.moves.at(-1)!.id;moves.dispatchEvent(new Event('change'));}
    this.hooks.feedback('Bewegung und Posen importiert. Vorschau prüfen; Zurück macht den Import rückgängig.');
  }
  updateMoveSequence(id:string,poses:string[],expectedRevision=this.revision){
    this.updateMoveSequences([{id,poses}],expectedRevision);
  }
  updateMoveSequences(updates:{id:string;poses:string[]}[],expectedRevision=this.revision){
    if(this.disposed||!this.active||this.edit||this.interactionActive||this.revision!==expectedRevision)throw Error('Studio ist beschäftigt oder der Stand hat sich geändert.');
    if(!validMoveSequenceUpdates(updates))throw Error('Ungültiges Bewegungspaket. Maximal 8 Bewegungen und insgesamt 200 Posenverweise.');
    // Resolve and copy every target before changing anything: a bad later entry cannot partially apply.
    const changes=updates.map(update=>{
      const move=this.data.moves.find(m=>m.id===update.id);
      if(!move||update.poses.some(id=>!this.data.poses.some(p=>p.id===id)))throw Error('Eine Bewegung benötigt 2 bis 100 vorhandene Posen.');
      return {move,poses:[...update.poses]};
    }).filter(({move,poses})=>move.poses.length!==poses.length||move.poses.some((id,i)=>id!==poses[i]));
    if(!changes.length)return;
    this.mutate(()=>{for(const {move,poses} of changes)move.poses=poses;});
  }
  previewSequence(id:string,poses:string[],session:string,expectedRevision:number):()=>void {
    if(this.disposed||!this.active||this.edit||this.interactionActive||this.moveCheck||session!==this.session||expectedRevision!==this.revision)throw Error('Studio ist beschäftigt oder der Stand hat sich geändert.');
    const move=this.data.moves.find(m=>m.id===id);
    if(!move||!validMoveSequenceUpdates([{id,poses}])||poses.some(id=>!this.data.poses.some(p=>p.id===id)))throw Error('Eine Bewegung benötigt 2 bis 100 vorhandene Posen.');
    const sequence:StudioMove={...move,poses:[...poses]},values=this.rig.sample(sequence,0),origin=this.rig.capture();
    this.hooks.suspend();this.rig.reset();this.proposalOrigin=origin;
    const timeline=this.timeline={move:{id:move.id,name:move.name,loop:move.loop,clip:move.id},sequence,time:0,preview:true};
    this.paused=false;this.rig.apply(values);this.view.setEnabled(false);this.render();
    // Only stop this preview; a late panel cleanup must not interrupt a newer player action.
    return ()=>{if(this.timeline===timeline)this.stopPreview();};
  }
  previewMoveAt(id:string,time:number,expectedRevision=this.revision){
    if(this.disposed||!this.active||this.gesture||this.moveCheck||this.revision!==expectedRevision)throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');
    const move=this.data.moves.find(m=>m.id===id);if(!move||!Number.isFinite(time)||time<0||time>this.rig.duration(move))throw Error('Ungültiger Prüfzeitpunkt.');
    // Validate/sample before changing playback, then preserve the prior editing pose.
    const values=this.rig.sample(move,time);this.stopMove();const origin=this.rig.capture();
    this.play(id,true);this.inspectionOrigin=origin;this.timeline!.time=time;this.paused=true;this.rig.apply(values);this.view.refresh();this.render();
  }
  captureInspectionPose(){
    if(!this.inspectionOrigin||!this.timeline||!this.paused||!this.active||this.disposed||this.gesture)throw Error('Zuerst ein Prüfbild öffnen.');
    if(this.data.poses.length>=100)throw Error('Höchstens 100 Posen.');
    const values=this.rig.capture();this.stopMove();
    this.mutate(()=>{this.rig.apply(values);this.data.poses.push({id:uid(),name:`Pose ${this.data.poses.length+1}`,seconds:1,values:structuredClone(values)});});
    const select=this.host.querySelector<HTMLSelectElement>('#pose-list');if(select){select.value=this.data.poses.at(-1)!.id;select.dispatchEvent(new Event('change'));}
    this.hooks.feedback('Prüfbild als neue Pose übernommen. Bewegung bleibt unverändert.');
  }
  async checkMoveLimits(id:string){
    return this.runMoveCheck(id,checkMoveBends);
  }
  async checkMoveSurface(id:string,signal?:AbortSignal){
    return this.runMoveCheck(id,inspectMoveSurface,signal);
  }
  private async runMoveCheck<Report>(id:string,check:(rig:StudioRig,move:StudioMove,signal:AbortSignal,valid:()=>boolean)=>Promise<Report>,signal?:AbortSignal){
    if(this.disposed||!this.active||this.interactionActive||this.moveCheck||this.surfaceCheck||this.automaticCheck)throw Error('Studio ist beschäftigt oder geschlossen.');
    const move=this.data.moves.find(m=>m.id===id);if(!move)throw Error('Bewegung nicht gefunden.');
    signal?.throwIfAborted();const request=new AbortController(),revision=this.revision,abort=()=>request.abort();signal?.addEventListener('abort',abort,{once:true});this.moveCheck=request;this.render();
    const selection=this.host.querySelector<HTMLSelectElement>('#studio-moves')?.value;
    try{return await check(this.rig,move,request.signal,()=>!this.disposed&&this.active&&!this.interactionActive&&this.revision===revision&&this.host.querySelector<HTMLSelectElement>('#studio-moves')?.value===selection);}
    finally{signal?.removeEventListener('abort',abort);if(this.moveCheck===request)this.moveCheck=null;if(!this.disposed){for(const id of ['move-check-limits','move-check-surface']){const start=this.host.querySelector<HTMLButtonElement>('#'+id);if(start)start.disabled=!this.host.querySelector<HTMLSelectElement>('#studio-moves')?.value;}const cancel=this.host.querySelector<HTMLButtonElement>('#move-check-cancel');if(cancel)cancel.disabled=true;}}
  }
  async analyzeSurface(args:Record<string,unknown>,signal?:AbortSignal){
    if(Object.keys(args).some(k=>!['session','expectedRevision','kind','id'].includes(k))||args.session!==this.session||args.expectedRevision!==this.revision||!['pose','move'].includes(args.kind as string)||typeof args.id!=='string'||!args.id||args.id.length>100)throw Error('Studio-Stand oder Prüfziel ungültig. get_studio erneut abfragen.');
    signal?.throwIfAborted();const revision=this.revision;
    const report=args.kind==='pose'?this.checkPoseSurface(args.id):await this.checkMoveSurface(args.id,signal);
    signal?.throwIfAborted();if(this.disposed||!this.active||revision!==this.revision)throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');
    const meshes=report.meshes.map(m=>'maximumIssues' in m?m:{mesh:m.mesh,name:m.name,compared:m.compared,maximumIssues:m.issues,maximumStretch:m.maximumStretch,minimumStretch:m.minimumStretch,invalidSamples:m.invalid||!m.compared?1:0,firstIssue:m.issues?0:null,worstTime:m.issues?0:null,volume:{maximumIssues:m.volume.issues,minimumRatio:m.volume.minimumRatio,maximumRatio:m.volume.maximumRatio,minimumMeasuredComponents:m.volume.measuredComponents,unmeasurableSamples:m.volume.unmeasurableComponents||!m.volume.measuredComponents?1:0,firstIssue:m.volume.issues?0:null,worstTime:m.volume.issues?0:null,limits:m.volume.limits,selfIntersectionsChecked:false}});
    return {session:this.session,revision,kind:args.kind,id:args.id,samples:'samples' in report?report.samples:1,continuous:false,maximumVolumeIssues:meshes.reduce((s,m)=>s+m.volume.maximumIssues,0),maximumIssues:meshes.reduce((s,m)=>s+m.maximumIssues,0),invalidSamples:meshes.reduce((s,m)=>s+m.invalidSamples,0),totalMeshes:meshes.length,meshes:[...meshes].sort((a,b)=>b.maximumIssues-a.maximumIssues||b.volume.maximumIssues-a.volume.maximumIssues||b.compared-a.compared).slice(0,32),truncated:meshes.length>32,unchecked:['collisions','self-intersections','local-volume','character-design','continuous-motion']};
  }
  checkPoseLimits(id:string){
    if(this.disposed||!this.active||this.interactionActive)throw Error('Studio ist beschäftigt oder geschlossen.');
    const pose=this.data.poses.find(p=>p.id===id);if(!pose)throw Error('Pose nicht gefunden.');
    return this.rig.checkPoseBends(pose);
  }
  checkPoseSurface(id:string){
    if(this.disposed||!this.active||this.interactionActive||this.surfaceCheck||this.automaticCheck)throw Error('Studio ist beschäftigt oder geschlossen.');
    const pose=this.data.poses.find(p=>p.id===id);if(!pose)throw Error('Pose nicht gefunden.');return inspectPoseSurface(this.rig,pose);
  }
  async createGentlerPose(id:string){
    if(this.disposed||!this.active||this.edit||this.interactionActive||this.surfaceCheck||this.moveCheck||this.automaticCheck)throw Error('Studio ist beschäftigt oder geschlossen.');
    const pose=this.data.poses.find(p=>p.id===id);if(!pose)throw Error('Pose nicht gefunden.');if(this.data.poses.length>=100)throw Error('Höchstens 100 Posen.');
    const request=new AbortController(),revision=this.revision,selection=this.host.querySelector<HTMLSelectElement>('#pose-list')?.value;this.surfaceCheck=request;this.render();
    const valid=()=>!this.disposed&&this.active&&!this.edit&&!this.interactionActive&&this.revision===revision&&this.host.querySelector<HTMLSelectElement>('#pose-list')?.value===selection;
    try{
      const proposal=await suggestGentlerPose(this.rig,structuredClone(pose),request.signal,valid);if(!proposal)return null;
      if(!valid()||this.data.poses.length>=100)throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');
      const next={id:uid(),name:(pose.name+' · Prüfkandidat').slice(0,100),seconds:pose.seconds,values:structuredClone(proposal.values)};
      this.surfaceCheck=null;this.mutate(()=>{this.rig.apply(next.values);this.data.poses.push(next);});
      const select=this.host.querySelector<HTMLSelectElement>('#pose-list');if(select){select.value=next.id;select.dispatchEvent(new Event('change'));}
      this.hooks.feedback('Schonendere Pose als Prüfkandidat erstellt. Originalpose und Bewegung bleiben erhalten. Vorschau prüfen.');return {id:next.id,fraction:proposal.fraction};
    }finally{if(this.surfaceCheck===request)this.surfaceCheck=null;if(!this.disposed){const selected=this.host.querySelector<HTMLSelectElement>('#pose-list')?.value;for(const id of ['pose-check-surface','pose-gentler','pose-weight-search','pose-weight-apply']){const button=this.host.querySelector<HTMLButtonElement>('#'+id);if(button)button.disabled=!this.active||this.interactionActive||!selected||(id==='pose-gentler'&&(this.edit||this.data.poses.length>=100))||(id==='pose-weight-search'&&(this.edit||this.point?.kind!=='bone'))||(id==='pose-weight-apply'&&(this.edit||!this.weightCorrection));}const cancel=this.host.querySelector<HTMLButtonElement>('#pose-surface-cancel');if(cancel)cancel.disabled=true;const radius=this.host.querySelector<HTMLInputElement>('#pose-weight-radius');if(radius)radius.disabled=false;}}
  }
  async findWeightCorrection(id:string){
    if(this.disposed||!this.active||this.edit||this.interactionActive||this.surfaceCheck||this.moveCheck||this.automaticCheck)throw Error('Studio ist beschäftigt oder geschlossen.');
    const pose=this.data.poses.find(p=>p.id===id),joint=this.point;if(!pose||joint?.kind!=='bone')throw Error('Gespeicherte Pose und Gelenk auswählen.');
    const request=new AbortController(),revision=this.revision,pointId=joint.id,selection=this.host.querySelector<HTMLSelectElement>('#pose-list')?.value;this.weightCorrection=null;this.surfaceCheck=request;this.render();
    const valid=()=>!this.disposed&&this.active&&!this.edit&&!this.interactionActive&&this.revision===revision&&this.point?.id===pointId&&this.host.querySelector<HTMLSelectElement>('#pose-list')?.value===selection;
    try{const proposal=await searchWeightCorrection(this.rig,structuredClone(pose),joint,this.weightRadius,request.signal,valid);if(!proposal)return null;if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');this.weightCorrection={...proposal,revision,jointId:pointId};return proposal;}
    finally{if(this.surfaceCheck===request)this.surfaceCheck=null;if(!this.disposed&&this.active)this.render();}
  }
  applyWeightCorrection(){
    const proposal=this.weightCorrection;if(this.disposed||!this.active||this.edit||this.interactionActive||this.surfaceCheck||!proposal||proposal.revision!==this.revision||proposal.jointId!==this.point?.id||proposal.poseId!==this.host.querySelector<HTMLSelectElement>('#pose-list')?.value)throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');
    const from=this.data.points.find(p=>p.id===proposal.from),to=this.data.points.find(p=>p.id===proposal.to),pose=this.data.poses.find(p=>p.id===proposal.poseId);if(!from||!to||!pose)throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');
    this.mutate(()=>{const before=this.snapshot();try{this.rig.transferWeights(from,to,proposal.amount,proposal.region);const actual=inspectPoseSurface(this.rig,pose);if(!betterSurfaceReport(actual,proposal.before)||!noMeasuredRegression(proposal.after,actual))throw Error('Korrektur verbessert die tatsächliche Oberfläche nicht.');this.rig.apply(pose.values);}catch(error){this.rig.data=before.data;this.rig.reset();this.rig.apply(before.values);throw error;}});
    this.hooks.feedback('Lokale Hautkorrektur übernommen. Zielpose bleibt erhalten. Bewegungen visuell prüfen.');
  }
  private showAutomaticProgress(value:SkinProgress){
    const host=this.host.querySelector('#skin-auto-progress');if(!host)return;host.replaceChildren();const phase=document.createElement('span');phase.textContent=value.phase==='diagnosis'?'Oberfläche untersuchen':value.phase==='search'?'Korrekturvarianten suchen':'Posen und Bewegungen gegenprüfen';const counts=document.createElement('span');counts.dataset.userText='';counts.textContent=` · ${value.samples} / ${value.joints} / ${value.candidates}`;host.append(phase,counts);
  }
  private automaticSummary(){
    const p=this.automaticProposal;if(!p||p.revision!==this.revision)return null;
    return {id:p.id,target:{...p.targetOrigin},jointId:p.jointId,from:p.from,to:p.to,amount:p.amount,radius:p.region.radius,beforeIssues:p.before.issues,afterIssues:p.after.issues,beforeVolumeIssues:p.before.volumeIssues,afterVolumeIssues:p.after.volumeIssues,totalMeshes:p.before.meshes.length,truncated:p.before.meshes.length>32,volume:p.before.meshes.map((m,i)=>({mesh:m.mesh,triangleIssues:m.issues,compared:m.compared,before:summarizeVolume(m.volume),after:summarizeVolume(p.after.meshes[i].volume)})).sort((a,b)=>b.triangleIssues-a.triangleIssues||b.before.issues-a.before.issues||b.compared-a.compared).slice(0,32),unchecked:['self-intersections','local-volume','character-design','continuous-motion'],checkedPoses:p.checkedPoses,checkedMoves:p.checkedMoves,motionSamples:p.motionSamples,checkedJoints:p.checkedJoints,checkedCandidates:p.checkedCandidates,requiresVisualReview:true,continuous:false,command:{session:this.session,expectedRevision:this.revision,action:'apply_skin_correction',id:p.id}};
  }
  async proposeSkinCorrection(args:Record<string,unknown>,signal?:AbortSignal){
    if(Object.keys(args).some(k=>!['session','expectedRevision','poseId','radius'].includes(k))||args.session!==this.session||args.expectedRevision!==this.revision||args.poseId!==undefined&&(typeof args.poseId!=='string'||!args.poseId||args.poseId.length>100)||args.radius!==undefined&&(typeof args.radius!=='number'||!Number.isFinite(args.radius)||args.radius<.005||args.radius>2))throw Error('Studio-Stand oder Prüfziel ungültig. get_studio erneut abfragen.');
    return this.startAutomaticSkinCorrection(signal,{poseId:args.poseId as string|undefined,radius:args.radius as number|undefined});
  }
  async startAutomaticSkinCorrection(signal?:AbortSignal,options:{poseId?:string;radius?:number}={}){
    if(this.disposed||!this.active||this.edit||this.interactionActive||this.automaticCheck||this.surfaceCheck||this.moveCheck||this.exportingFigure)throw Error('Studio ist beschäftigt oder geschlossen.');
    signal?.throwIfAborted();const request=new AbortController(),revision=this.revision,abort=()=>request.abort();signal?.addEventListener('abort',abort,{once:true});this.automaticCheck=request;this.automaticProposal=null;this.automaticOutcome='';this.automaticProgress={phase:'diagnosis',samples:0,joints:0,candidates:0,vertexSamples:0};this.render();
    const valid=()=>!this.disposed&&this.active&&!this.edit&&!this.interactionActive&&this.revision===revision;
    try{const proposal=await findAutomaticSkinCorrection(this.rig,request.signal,valid,{...options,progress:value=>{this.automaticProgress=value;this.showAutomaticProgress(value);}});request.signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');if(proposal)this.automaticProposal={...proposal,id:'skin-'+crypto.randomUUID(),revision};else this.automaticOutcome='none';return this.automaticSummary();}
    finally{signal?.removeEventListener('abort',abort);if(this.automaticCheck===request)this.automaticCheck=null;this.automaticProgress=null;if(!this.disposed&&this.active)this.render();}
  }
  previewAutomaticSkinCorrection(id:string,corrected=true){
    const p=this.automaticProposal;if(this.disposed||!this.active||this.edit||this.automaticCheck||this.surfaceCheck||this.moveCheck||!p||p.id!==id||p.revision!==this.revision||this.playing||this.gesture||this.weightStroke)throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');
    this.rig.stopSkinPreview();const restore=this.rig.previewSkin(p.target.values,corrected?skinCorrectionOverrides(this.rig,p):new Map());this.view.setEnabled(false);this.view.refresh();this.render();return ()=>{restore();if(!this.disposed){this.view.setEnabled(this.active&&!this.rig.skinPreviewActive);this.view.refresh();this.render();}};
  }
  applyAutomaticSkinCorrection(id:string){
    const p=this.automaticProposal;if(this.disposed||!this.active||this.edit||this.automaticCheck||this.surfaceCheck||this.moveCheck||!p||p.id!==id||p.revision!==this.revision||this.playing||this.gesture||this.weightStroke)throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');
    this.rig.stopSkinPreview();const from=this.data.points.find(q=>q.id===p.from),to=this.data.points.find(q=>q.id===p.to);if(!from||!to)throw Error('Korrekturgelenke fehlen.');
    this.mutate(()=>{const before=this.snapshot();try{this.rig.transferWeights(from,to,p.amount,p.region);const actual=inspectPoseSurface(this.rig,p.target);if(!noMeasuredRegression(p.after,actual)||actual.issues>p.after.issues)throw Error('Korrektur stimmt nicht mit dem geprüften Vorschlag überein.');this.rig.apply(before.values);}catch(error){this.rig.data=before.data;this.rig.reset();this.rig.apply(before.values);throw error;}});this.view.setEnabled(true);this.view.refresh();this.hooks.feedback('Geprüfte Hautkorrektur übernommen. Posen und Moves bleiben erhalten.');
  }
  restoreDirty(value:boolean){this.dirty=value;this.render();}
  exportProject():StudioProject {
    if(this.interactionActive)throw new Error('Studio-Bewegung zuerst beenden.');
    const studio=structuredClone(this.data);
    if(this.active)studio.draft=this.rig.capture();
    return {...structuredClone(this.project),studio};
  }
  save(){
    const value=this.exportProject();
    const url=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${this.project.avatar.id}.pakachi.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.dirty=false;this.render();this.hooks.feedback('Studio-Projekt mit Modell, Kontrollpunkten, Posen und Bewegungen heruntergeladen.');
  }
  dispose(){this.rig.stopSkinPreview();this.automaticCheck?.abort();this.automaticProposal=null;this.playbackTransition.cancel();if(this.proposalOrigin)this.stopMove();this.moveCheck?.abort();this.surfaceCheck?.abort();this.libraryRequest?.abort();this.disposed=true;this.view.dispose();this.rig.dispose();this.host.replaceChildren();}
}
export function encodeModel(buffer:ArrayBuffer):string {let s='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);}
export function decodeModel(base64:string):ArrayBuffer {return Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer;}
