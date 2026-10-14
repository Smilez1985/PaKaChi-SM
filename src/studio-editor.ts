import {parseStudioCommand} from './studio-command.ts';
import {flagAffectedPoses,moveReview,reviewLabels} from './studio-review.ts';
import * as T from 'three';
import {detectJoints,detectConnections,edgeKey} from './studio-detection.ts';
import { connectedPoints, StudioHistory, FIGURE_TRACK } from './studio-data.ts';
import type { StudioData, StudioProject, Transform, ControlPoint } from './studio-data.ts';
import { StudioRig } from './studio-rig.ts';
import type { StudioView } from './studio-view.ts';
import type { Move } from './catalog.ts';
interface Snapshot {data:StudioData;values:Record<string,Transform>}
interface Hooks { suspend:()=>void; resume:()=>void; changed:()=>void; feedback:(s:string)=>void }
const uid=()=>`p-${crypto.randomUUID()}`;
export class StudioEditor {
  readonly rig:StudioRig;
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
  private gesturePositions=new Map<string,T.Vector3>();
  private timeline:{move:Move;time:number;preview:boolean}|null=null;
  private gesture:Snapshot|null=null;
  private gesturePosition:T.Vector3|null=null;
  readonly session=crypto.randomUUID();
  private revision=0;
  private agentEditing=false;
  dirty=false;
  paused=false;
  speed=1;
  constructor(rig:StudioRig,view:StudioView,host:HTMLElement,project:Omit<StudioProject,'studio'>,hooks:Hooks) {
    this.rig=rig;this.view=view;this.host=host;this.project=project;this.hooks=hooks;this.initial=structuredClone(rig.initial);
    view.onSelect=id=>{this.selected=id;this.render();};
    view.onAdd=(position,mesh)=>this.addPoint(position,mesh);
    view.onConnect=id=>this.connect(id);
    view.onStart=()=>{this.gesture=this.snapshot();this.gesturePosition=this.point ? rig.position(this.point):null;this.gesturePositions=new Map(rig.data.points.map(p=>[p.id,rig.position(p)]));};
    view.onMove=(position,rotation)=>{
      const p=this.point;if(!p)return;
      if(p.id!==FIGURE_TRACK && this.groupMove && !this.edit && p.kind==='surface' && this.gesture && this.gesturePosition){const delta=position.clone().sub(this.gesturePosition), connected=connectedPoints(rig.data,p.id);
        for(const q of rig.data.points.filter(q=>q.kind==='surface'&&connected.has(q.id))){rig.setPoint(q,this.gesturePositions.get(q.id)!.clone().add(delta),new T.Quaternion(),false);}
      }else rig.setPoint(p,position,rotation,this.edit);
      this.view.refresh();this.refreshNumbers();
    };
    view.onEnd=()=>{if(this.gesture){flagAffectedPoses(this.gesture.data,this.data);this.history.push(this.gesture);this.gesture=null;this.mark();this.render();}};
    this.render();
  }
  get point(){if(this.selected===FIGURE_TRACK&&!this.edit)return this.rig.figure;return this.rig.data.points.find(p=>p.id===this.selected);}
  get data(){return this.rig.data;}
  get playing(){return !!this.timeline;}
  get current(){return this.timeline?.move ?? null;}
  get duration(){const m=this.rig.data.moves.find(m=>m.id===this.timeline?.move.id);return m?this.rig.duration(m):0;}
  get progress(){return this.duration ? this.timeline!.time/this.duration:0;}
  private snapshot():Snapshot{return {data:structuredClone(this.data),values:this.rig.capture()};}
  private restore(s:Snapshot){this.rig.data=structuredClone(s.data);this.rig.reset();this.rig.apply(s.values);this.mark();this.render();}
  private mark(){this.revision++;this.dirty=true;this.hooks.changed();}
  private mutate(fn:()=>void){const before=this.snapshot();fn();flagAffectedPoses(before.data,this.data);this.history.push(before);this.mark();this.render();}
  enter(){this.revision++;this.hooks.suspend();this.stopMove();this.active=true;this.rig.reset();if(this.data.draft)this.rig.apply(this.data.draft);this.view.setEnabled(true);this.render();}
  leave(){this.agentEditing=false;this.revision++;if(this.active&&!this.playing)this.data.draft=this.rig.capture();this.active=false;this.stopMove();this.view.setEnabled(false);this.rig.restoreSource();this.hooks.resume();}
  stopMove(){this.timeline=null;this.paused=false;this.view.setEnabled(this.active);}
  stopPreview(){this.stopMove();this.render();}
  play(id:string,preview=false):boolean {
    const move=this.data.moves.find(m=>m.id===id);if(!move)return false;
    this.hooks.suspend();this.rig.reset();this.timeline={move:{id:move.id,name:move.name,loop:move.loop,clip:move.id},time:0,preview};this.paused=false;
    this.rig.apply(this.rig.sample(move,0));this.view.setEnabled(false);this.render();return true;
  }
  update(delta:number){if(!this.timeline||this.paused)return;const t=this.timeline,move=this.data.moves.find(m=>m.id===t.move.id)!;t.time+=delta*this.speed;const duration=this.rig.duration(move);
    if(t.time>=duration){if(move.loop)t.time%=duration;else {t.time=duration;this.rig.apply(this.rig.sample(move,duration));if(t.preview){this.paused=true;this.stopPreview();}else{this.stopMove();this.rig.restoreSource();this.hooks.resume();}return;}}
    this.rig.apply(this.rig.sample(move,t.time));
  }
  togglePause(){this.paused=!this.paused;}
  seek(ratio:number){if(!this.timeline)return;const move=this.data.moves.find(m=>m.id===this.timeline!.move.id)!;this.timeline.time=T.MathUtils.clamp(ratio,0,.999999)*this.duration;this.rig.apply(this.rig.sample(move,this.timeline.time));}
  setSpeed(value:number){this.speed=T.MathUtils.clamp(value,.25,2);}
  private addPoint(position:T.Vector3,mesh?:number){if(!this.edit||this.playing)return;if(this.data.points.length>=256){this.hooks.feedback('Höchstens 256 Kontrollpunkte pro Projekt.');return;}
    this.mutate(()=>{const p:ControlPoint={id:uid(),name:`Punkt ${this.data.points.length+1}`,kind:'surface',rest:position.toArray(),size:.015,radius:.12,...(mesh!==undefined?{mesh}:{})};this.data.points.push(p);for(const pose of this.data.poses)pose.values[p.id]={position:[...p.rest],rotation:[0,0,0,1]};if(this.data.draft)this.data.draft[p.id]={position:[...p.rest],rotation:[0,0,0,1]};this.selected=p.id;this.rig.reset();});
    this.view.setAction('select');this.hooks.feedback('Punkt gesetzt. Größe und Einflussbereich sind getrennt einstellbar.');
  }
  private connect(id:string){if(!this.edit||!this.selected||id===this.selected)return;
    this.mutate(()=>{const index=this.data.links.findIndex(([a,b])=>(a===id&&b===this.selected)||(b===id&&a===this.selected));if(index>=0)this.data.links.splice(index,1);else if(this.data.links.length<2048)this.data.links.push([this.selected!,id]);});this.view.setAction('select');
  }
  private refreshNumbers(){const p=this.point;if(!p)return;const pos=this.rig.position(p);['x','y','z'].forEach((axis,i)=>{const input=this.host.querySelector<HTMLInputElement>(`#point-${axis}`);if(input)input.value=pos.toArray()[i].toFixed(3);});}
  private render(){
    const remembered = Object.fromEntries(['pose-name','move-name','move-id','pose-list','studio-moves'].map(id=>[id,this.host.querySelector<HTMLInputElement>(`#${id}`)?.value ?? '']));
    const loop = this.host.querySelector<HTMLInputElement>('#move-loop')?.checked ?? false;
    const selected=this.selected;const poses=this.data.poses;
    this.host.innerHTML=`<h2>Avatar-Studio</h2><label class="check"><input id="studio-agent-edit" type="checkbox" ${this.agentEditing?'checked':''}> KI darf dieses Studio bearbeiten</label><p class="subtle">Nur für diese Sitzung. Änderungen sind rückgängig machbar.</p><div class="studio-file-actions"><button id="studio-new">Neu</button><button id="studio-save">Speichern${this.dirty?' *':''}</button></div>
    <div class="studio-modes" role="group" aria-label="Bearbeitungsmodus"><button id="mode-pose" aria-pressed="${!this.edit}">Figur bewegen</button><button id="mode-rig" aria-pressed="${this.edit}">Gelenke bearbeiten</button></div>
    <p class="subtle">${this.edit?'Punkte setzen und verbinden. Bestehende Skelettpunkte verschieben ihren Drehpunkt.':'Punkt direkt ziehen oder farbige Griffe verwenden. Skelettpunkte können auch gedreht werden.'}</p>
    <div class="studio-actions"><button id="studio-undo" ${this.history.canUndo?'':'disabled'}>↶ Zurück</button><button id="studio-redo" ${this.history.canRedo?'':'disabled'}>↷ Wiederholen</button></div>
    <div class="studio-detection" ${this.edit?'':'hidden'}><button id="detect-joints">Joints automatisch erkennen</button><button id="detect-links">Joint-Verbindungen automatisch erkennen</button><p class="subtle">Erkennung verwendet vorhandene Skelettdaten. Für Modelle ohne Skelett ist KI-Rigging noch nicht verfügbar.</p></div>
    <button id="figure-select" ${this.edit?'hidden':''}>Gesamte Figur bewegen</button>
    <label for="studio-points">Gelenk / Gesichtspunkt</label><select id="studio-points"><option value="">Punkt auswählen …</option></select>
    <div class="studio-actions" ${this.edit?'':'hidden'}><button id="point-add">＋ Punkt setzen</button><button id="point-connect" ${this.point?'':'disabled'}>Verbinden / lösen</button></div>
    <div id="point-fields" ${this.point?'':'hidden'}><label>Name<input id="point-name" maxlength="100"></label><label>Punktgröße<input id="point-size" type="range" min="0.003" max="0.15" step="0.001"></label>
    <label id="radius-label">Einflussbereich<input id="point-radius" type="range" min="0.005" max="0.6" step="0.005"></label>
    <div class="point-xyz">${['x','y','z'].map(a=>`<label>${a.toUpperCase()}<input id="point-${a}" type="number" step="0.005" min="-100" max="100"></label>`).join('')}</div>
    <label id="rotation-label">Griffe<select id="point-transform"><option value="translate">Verschieben</option><option value="rotate">Drehen</option></select></label>
    <label class="check" id="group-label"><input id="point-group" type="checkbox" ${this.groupMove?'checked':''}> Verbundene freie Punkte gemeinsam bewegen</label>
    <button id="point-delete" ${this.edit?'':'hidden'}>Kontrollpunkt löschen</button><p class="subtle" id="point-kind"></p></div>
    <section ${this.edit?'':'hidden'}><h3>Verbindungen</h3><div id="studio-links"></div></section>
    <button id="pose-reset">Grundpose</button>
    <div class="studio-poses"><h3>Posen & Bewegung</h3><label>Posenname<input id="pose-name" maxlength="100" placeholder="z. B. Hand oben"></label><button id="pose-add">Aktuelle Pose speichern</button>
    <label for="pose-list">Gespeicherte Posen</label><select id="pose-list"></select><div class="studio-actions"><button id="pose-show">Anzeigen</button><button id="pose-replace">Ersetzen</button><button id="pose-delete">Löschen</button></div>
    <div id="pose-review" class="studio-review" hidden><strong>Pose prüfen</strong><ul id="pose-review-reasons"></ul><p>Pose anzeigen und bei Bedarf korrigieren. „Ersetzen“ speichert die Korrektur.</p><button id="pose-reviewed">Pose als geprüft markieren</button></div>
    <label>Übergang zu dieser Pose (Sekunden)<input id="pose-seconds" type="number" min="0.1" max="30" step="0.1" value="1"></label><div class="studio-actions"><button id="pose-up">↑ Früher</button><button id="pose-down">↓ Später</button></div>
    <p class="subtle">Eine Bewegung nutzt alle Posen in dieser Reihenfolge. Bei Schleifen bestimmt die Zeit der ersten Pose den Rückweg.</p>
    <label>Bewegungsname<input id="move-name" maxlength="100" placeholder="z. B. Lächeln"></label><label>Schlagwort<input id="move-id" maxlength="100" placeholder="z. B. laecheln"></label><label class="check"><input id="move-loop" type="checkbox"> Als Schleife</label><button id="move-add" ${poses.length>=2?'':'disabled'}>Bewegung speichern</button>
    <label for="studio-moves">Eigene Bewegungen</label><select id="studio-moves"></select><p id="move-review" class="studio-review" hidden>Diese Bewegung enthält Posen mit Prüfhinweisen. Vorschau ansehen und die markierten Posen prüfen.</p><div class="studio-actions"><button id="move-preview">Vorschau</button><button id="move-stop">Stopp</button><button id="move-delete">Löschen</button></div></div>
    <p class="subtle">Projekt laden: „Projekt laden“ oben. Mausrad: Nahzoom · rechts ziehen: Ansicht verschieben.</p>`;
    const q=<E extends HTMLElement=HTMLElement>(id:string)=>this.host.querySelector<E>(`#${id}`)!;
    const input=(id:string)=>q<HTMLInputElement>(id);
    const on=(id:string,fn:()=>void)=>{q<HTMLButtonElement>(id).onclick=()=>{try{fn();}catch(e){this.hooks.feedback(e instanceof Error?e.message:String(e));}};};
    const points=q<HTMLSelectElement>('studio-points');if(!this.edit){const option=new Option('Gesamte Figur',FIGURE_TRACK);option.dataset.figureLabel='';points.add(option);}for(const p of this.data.points)points.add(new Option(`${p.kind==='bone'?'◇':'●'} ${p.name}`,p.id));points.value=selected??'';
    points.onchange=()=>{this.selected=points.value||null;this.view.setAction('select');this.render();};
    input('studio-agent-edit').onchange=()=>{this.agentEditing=input('studio-agent-edit').checked;this.revision++;};
    on('figure-select',()=>{this.selected=FIGURE_TRACK;this.view.setAction('select');this.render();});
    on('mode-pose',()=>{this.revision++;this.edit=false;this.view.setAction('select');this.rig.reset();this.render();});
    on('mode-rig',()=>{this.revision++;this.edit=true;if(this.selected===FIGURE_TRACK)this.selected=null;this.view.setAction('select');this.rig.reset();this.render();});
    on('studio-undo',()=>{const s=this.history.undo(this.snapshot());if(s)this.restore(s);});on('studio-redo',()=>{const s=this.history.redo(this.snapshot());if(s)this.restore(s);});
    on('studio-new',()=>this.mutate(()=>{this.rig.data=structuredClone(this.initial);this.data.poses=[];this.data.moves=[];this.rig.reset();this.selected=null;}));
    on('studio-save',()=>this.save());
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
    for(const edge of this.data.links){const row=document.createElement('div');row.className='connection-row';const name=document.createElement('span');name.dataset.userText='';name.textContent=edge.map(id=>this.data.points.find(p=>p.id===id)?.name??id).join(' ↔ ');const remove=document.createElement('button');remove.textContent='Verbindung entfernen';remove.onclick=()=>this.mutate(()=>{this.data.links=this.data.links.filter(e=>edgeKey(e)!==edgeKey(edge));});row.append(name,remove);links.append(row);}
    on('point-add',()=>{this.view.setAction('add');this.hooks.feedback('In die Figur klicken. Neben der Figur wird der Punkt auf der Ansichtsebene gesetzt.');});
    on('point-connect',()=>{this.view.setAction('connect');this.hooks.feedback('Zweiten Punkt anklicken. Eine vorhandene Verbindung wird gelöst.');});
    if(this.point){const p=this.point;const whole=p.id===FIGURE_TRACK;input('point-name').disabled=whole;input('point-size').disabled=whole;input('point-radius').disabled=whole;input('point-name').value=p.name;input('point-size').value=String(p.size);input('point-radius').value=String(p.radius);q('radius-label').hidden=p.kind==='bone'||whole;q('rotation-label').hidden=(!whole&&p.kind!=='bone')||this.edit;q('group-label').hidden=p.kind!=='surface'||this.edit||whole;
      q('point-kind').textContent=whole?'Gesamte Figur verschieben oder drehen. Beides wird in jeder Pose gespeichert.':p.kind==='bone'?'Skelettpunkt. Löschen entfernt den Griff, das Quellskelett bleibt erhalten.':'Freier Oberflächenpunkt. Verbindungen gruppieren Punkte, ohne eine Gelenkkette vorauszusetzen.';
      input('point-name').onchange=()=>{const v=input('point-name').value.trim();if(v)this.mutate(()=>p.name=v);};
      input('point-size').onchange=()=>this.mutate(()=>p.size=Number(input('point-size').value));
      input('point-radius').onchange=()=>this.mutate(()=>{p.radius=Number(input('point-radius').value);this.rig.apply(this.rig.capture());});
      ['x','y','z'].forEach((axis,i)=>{input(`point-${axis}`).onchange=()=>{const v=Number(input(`point-${axis}`).value);if(!Number.isFinite(v)||Math.abs(v)>100)return;this.mutate(()=>{const pos=this.rig.position(p).toArray();pos[i]=v;this.rig.setPoint(p,new T.Vector3().fromArray(pos),this.rig.rotation(p),this.edit);});};});
      q<HTMLSelectElement>('point-transform').value=this.rotate?'rotate':'translate';
      q<HTMLSelectElement>('point-transform').onchange=()=>{this.rotate=q<HTMLSelectElement>('point-transform').value==='rotate';this.view.setRotation(this.rotate);};
      input('point-group').onchange=()=>this.groupMove=input('point-group').checked;
      on('point-delete',()=>this.mutate(()=>{this.data.points=this.data.points.filter(x=>x.id!==p.id);this.data.links=this.data.links.filter(l=>!l.includes(p.id));this.data.poses.forEach(pose=>delete pose.values[p.id]);if(this.data.draft)delete this.data.draft[p.id];this.selected=null;this.rig.reset();}));
    }
    on('pose-reset',()=>this.mutate(()=>this.rig.reset()));
    on('pose-add',()=>{if(this.data.poses.length>=100)throw new Error('Höchstens 100 Posen.');const name=input('pose-name').value.trim()||`Pose ${poses.length+1}`;this.mutate(()=>this.data.poses.push({id:uid(),name,seconds:1,values:this.rig.capture()}));});
    const list=q<HTMLSelectElement>('pose-list');poses.forEach((p,i)=>list.add(new Option(`${p.review?.length?'⚠ ':''}${i+1}. ${p.name}`,p.id)));list.value=poses.some(p=>p.id===remembered['pose-list'])?remembered['pose-list']:(poses[0]?.id??'');const pose=()=>this.data.poses.find(p=>p.id===list.value);
    list.onchange=()=>{const p=pose();input('pose-seconds').value=String(p?.seconds??1);q('pose-review').hidden=!p?.review?.length;q('pose-review-reasons').replaceChildren();for(const reason of p?.review??[]){const li=document.createElement('li');li.textContent=reviewLabels[reason];q('pose-review-reasons').append(li);}};list.onchange(new Event('change'));
    on('pose-show',()=>{const p=pose();if(p)this.mutate(()=>{this.rig.reset();this.rig.apply(p.values);});});
    on('pose-replace',()=>{const p=pose();if(p)this.mutate(()=>{p.values=this.rig.capture();delete p.review;});});
    on('pose-reviewed',()=>{const p=pose();if(p?.review?.length)this.mutate(()=>{delete p.review;});});
    on('pose-delete',()=>{const p=pose();if(p){if(this.data.moves.some(m=>m.poses.includes(p.id)))throw new Error('Diese Pose wird noch von einer Bewegung verwendet. Zuerst die Bewegung löschen.');this.mutate(()=>this.data.poses=this.data.poses.filter(x=>x!==p));}});
    input('pose-seconds').onchange=()=>{const p=pose(),v=Number(input('pose-seconds').value);if(p && v>=.1&&v<=30)this.mutate(()=>p.seconds=v);};
    for(const [button,offset] of [['pose-up',-1],['pose-down',1]] as const)on(button,()=>{const p=pose(),i=poses.indexOf(p!);if(i>=0 && i+offset>=0 && i+offset<poses.length)this.mutate(()=>{[poses[i],poses[i+offset]]=[poses[i+offset],poses[i]];});});
    on('move-add',()=>{const id=input('move-id').value.trim(),name=input('move-name').value.trim();if(!/^[a-z0-9][a-z0-9_-]{0,99}$/.test(id)||!name)throw new Error('Name und eindeutiges Schlagwort angeben (a–z, 0–9, _ oder -).');if(this.project.avatar.moves.some(m=>m.id===id)||this.data.moves.some(m=>m.id===id))throw new Error('Dieses Schlagwort ist bereits vergeben.');if(this.data.moves.length>=100)throw new Error('Höchstens 100 Bewegungen.');const loop=input('move-loop').checked;this.mutate(()=>this.data.moves.push({id,name,loop,poses:poses.map(p=>p.id)}));});
    const moves=q<HTMLSelectElement>('studio-moves');this.data.moves.forEach(m=>moves.add(new Option(`${moveReview(this.data,m).needsReview?'⚠ ':''}${m.name}`,m.id)));
    moves.value=this.data.moves.some(m=>m.id===remembered['studio-moves'])?remembered['studio-moves']:(this.data.moves[0]?.id??'');
    moves.onchange=()=>{const m=this.data.moves.find(m=>m.id===moves.value);q('move-review').hidden=!m||!moveReview(this.data,m).needsReview;};moves.onchange(new Event('change'));
    for(const id of ['pose-name','move-name','move-id'])input(id).value=remembered[id];input('move-loop').checked=loop;
    on('move-preview',()=>this.play(moves.value,true));on('move-stop',()=>this.stopPreview());on('move-delete',()=>this.mutate(()=>this.data.moves=this.data.moves.filter(m=>m.id!==moves.value)));
    if(this.playing){this.host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(e=>e.disabled=e.id!=='move-stop'&&e.id!=='studio-agent-edit');}
    this.view.setFigureEnabled(!this.edit);this.view.setRotation(this.rotate && !this.edit);this.view.select(this.selected);this.refreshNumbers();
  }
  inspect(args:Record<string,unknown>={}) {
    const section=args.section??'info',offset=args.offset??0,limit=args.limit??32;
    if(Object.keys(args).some(k=>!['section','offset','limit'].includes(k))||!['info','points','poses','moves'].includes(section as string)||!Number.isInteger(offset)||(offset as number)<0||!Number.isInteger(limit)||(limit as number)<1||(limit as number)>32)throw new Error('Ungültige Studio-Abfrage.');
    const info={session:this.session,revision:this.revision,dirty:this.dirty,open:this.active,editable:this.active&&this.agentEditing&&!this.playing&&!this.gesture,mode:this.edit?'rig':'pose',figure:{id:FIGURE_TRACK,position:this.rig.position(this.rig.figure).toArray(),rotation:this.rig.rotation(this.rig.figure).toArray()},counts:{points:this.data.points.length,poses:this.data.poses.length,moves:this.data.moves.length,surfaces:this.rig.surfaces.length},undo:this.history.canUndo,redo:this.history.canRedo};
    if(section==='info')return info;
    const items=section==='points'?this.data.points.map(p=>({...p,position:this.rig.position(p).toArray(),rotation:this.rig.rotation(p).toArray(),connections:this.data.links.filter(l=>l.includes(p.id)).map(l=>l[0]===p.id?l[1]:l[0])})):section==='poses'?this.data.poses.map(p=>({id:p.id,name:p.name,seconds:p.seconds,review:p.review??[]})):this.data.moves.map(m=>({id:m.id,name:m.name,loop:m.loop,poseCount:m.poses.length,...moveReview(this.data,m)}));
    // Bound pages by count and UTF-8 size so both MCP bridges stay below their payload limit.
    const page:unknown[]=[];let bytes=0;for(const item of items.slice(offset as number,(offset as number)+(limit as number))){const length=new TextEncoder().encode(JSON.stringify(item)).length;if(page.length&&bytes+length>40000)break;page.push(item);bytes+=length;}
    return {...info,section,total:items.length,items:page,nextOffset:(offset as number)+page.length<items.length?(offset as number)+page.length:null};
  }
  execute(raw:unknown) {
    const c=parseStudioCommand(raw);
    if(!this.active||!this.agentEditing)throw new Error('Studio-Bearbeitung durch KI ist nicht freigegeben.');
    if(this.playing||this.gesture)throw new Error('Studio ist beschäftigt. Nach Vorschau oder Ziehgeste erneut abfragen.');
    if(c.session!==this.session||c.expectedRevision!==this.revision)throw new Error('Studio-Stand hat sich geändert. get_studio erneut abfragen.');
    const point=c.id===FIGURE_TRACK?this.rig.figure:this.data.points.find(p=>p.id===c.id),pose=this.data.poses.find(p=>p.id===c.id);
    const require=(ok:unknown,message='Studio-Aktion passt nicht zum aktuellen Modus oder Ziel.'):void=>{if(!ok)throw new Error(message);};
    let resultId:string|undefined;
    switch(c.action){
      case 'set_mode':require(c.mode);this.revision++;this.edit=c.mode==='rig';this.selected=null;this.view.setAction('select');this.rig.reset();this.render();break;
      case 'add_point':{
        require(this.edit&&c.position&&this.data.points.length<256);require(c.mesh===undefined||c.mesh<this.rig.surfaces.length);
        this.mutate(()=>{const p:ControlPoint={id:uid(),name:c.name?.trim()||`Punkt ${this.data.points.length+1}`,kind:'surface',rest:[...c.position!],size:c.size??.015,radius:c.radius??.12,...(c.mesh!==undefined?{mesh:c.mesh}:{})};this.data.points.push(p);for(const pose of this.data.poses)pose.values[p.id]={position:[...p.rest],rotation:[0,0,0,1]};if(this.data.draft)this.data.draft[p.id]={position:[...p.rest],rotation:[0,0,0,1]};this.selected=p.id;resultId=p.id;this.rig.reset();});break;
      }
      case 'update_point':{
        require(point);const p=point!;require(p.id!==FIGURE_TRACK||!this.edit);require(c.rotation===undefined||!this.edit&&(p.kind==='bone'||p.id===FIGURE_TRACK));require(p.id!==FIGURE_TRACK||(c.size===undefined&&c.radius===undefined&&c.name===undefined));require(c.radius===undefined||p.kind==='surface');require(['name','position','rotation','size','radius'].some(k=>k in c));
        this.mutate(()=>{if(c.name!==undefined)p.name=c.name.trim();if(c.size!==undefined)p.size=c.size;if(c.radius!==undefined)p.radius=c.radius;if(c.position||c.rotation)this.rig.setPoint(p,c.position?new T.Vector3().fromArray(c.position):this.rig.position(p),c.rotation?new T.Quaternion().fromArray(c.rotation):this.rig.rotation(p),this.edit);else this.rig.apply(this.rig.capture());this.selected=p.id;});break;
      }
      case 'delete_point':require(this.edit&&point&&point.id!==FIGURE_TRACK);this.mutate(()=>{this.data.points=this.data.points.filter(p=>p.id!==c.id);this.data.links=this.data.links.filter(l=>!l.includes(c.id!));for(const p of this.data.poses)delete p.values[c.id!];if(this.data.draft)delete this.data.draft[c.id!];this.selected=null;this.rig.reset();});break;
      case 'connect_points':case 'disconnect_points':{
        require(this.edit&&point&&point.id!==FIGURE_TRACK&&c.target!==c.id&&this.data.points.some(p=>p.id===c.target));const index=this.data.links.findIndex(l=>l.includes(c.id!)&&l.includes(c.target!));require(c.action!=='connect_points'||index>=0||this.data.links.length<2048);
        if(c.action==='connect_points'&&index<0)this.mutate(()=>this.data.links.push([c.id!,c.target!]));else if(c.action==='disconnect_points'&&index>=0)this.mutate(()=>{this.data.links.splice(index,1);});else this.revision++;break;
      }
      case 'save_pose':require(!this.edit&&this.data.poses.length<100);this.mutate(()=>{resultId=uid();this.data.poses.push({id:resultId,name:c.name?.trim()||`Pose ${this.data.poses.length+1}`,seconds:c.seconds??1,values:this.rig.capture()});});break;
      case 'apply_pose':require(!this.edit&&pose);this.mutate(()=>{this.rig.reset();this.rig.apply(pose!.values);});break;
      case 'replace_pose':require(!this.edit&&pose);this.mutate(()=>{pose!.values=this.rig.capture();delete pose!.review;});break;
      case 'create_move':require(!this.edit&&c.id&&c.id!==FIGURE_TRACK&&c.name&&c.poses&&c.poses.every(id=>this.data.poses.some(p=>p.id===id))&&this.data.moves.length<100&&!this.data.moves.some(m=>m.id===c.id)&&!this.project.avatar.moves.some(m=>m.id===c.id));this.mutate(()=>{this.data.moves.push({id:c.id!,name:c.name!.trim(),poses:[...c.poses!],loop:c.loop??false});resultId=c.id;});break;
      case 'undo':case 'redo':{const snapshot=c.action==='undo'?this.history.undo(this.snapshot()):this.history.redo(this.snapshot());require(snapshot,'Kein weiterer Bearbeitungsschritt.');this.restore(snapshot!);break;}
    }
    this.hooks.feedback('Studio-Änderung durch KI übernommen.');return {accepted:true,session:this.session,revision:this.revision,...(resultId?{id:resultId}:{})};
  }
  save(){
    this.data.draft=this.rig.capture();
    const value:StudioProject={...this.project,studio:structuredClone(this.data)};
    const url=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${this.project.avatar.id}.pakachi.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.dirty=false;this.render();this.hooks.feedback('Studio-Projekt mit Modell, Kontrollpunkten, Posen und Bewegungen heruntergeladen.');
  }
  dispose(){this.view.dispose();this.host.replaceChildren();}
}
export function encodeModel(buffer:ArrayBuffer):string {let s='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);}
export function decodeModel(base64:string):ArrayBuffer {return Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer;}
