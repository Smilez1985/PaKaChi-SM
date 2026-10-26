import {loadCatalogProject} from './catalog-project.ts';
import type {ZooEntry} from './local-zoo.ts';
import {mountLocalZoo} from './local-zoo-panel.ts';
import {prepareAvatar} from './avatar-candidate.ts';
import {checkpointElements,disposeAll,installAtomically} from './avatar-installation.ts';
import {ModelSwitchHistory} from './model-switch-history.ts';
import {mountGenerationPanel} from './generation-panel.ts';
import type {ProjectRevision} from './ai-jobs.ts';
import {mountAssistantPanel} from './assistant-panel.ts';
import {options} from './options.ts';
import {moveReview} from './studio-review.ts';
import './style.css';
import {mountOptions,translate} from './options.ts';
import { StudioEditor, encodeModel, decodeModel } from './studio-editor.ts';
import { parseProject } from './studio-data.ts';
import type { StudioProject } from './studio-data.ts';
import { StateMachine, STATES } from './control.ts';
import { mountAgentPanel } from './agent-panel.ts';
import { availableMoves, importedAvatar, parseCatalog, catalogChoices } from './catalog.ts';
import type { Avatar, Move } from './catalog.ts';
import { Playback } from './playback.ts';
import { disposeModel, parseModel, modelBounds, Viewer } from './viewer.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <aside class="rail">
    <a class="brand" href="./" aria-label="PaKaChi-SM Startseite"><span class="brand-mark">P<span>•</span></span><span>PaKaChi<span class="brand-sub">STATE MASCHINE</span></span></a>
    <p class="rail-label">DEIN AVATAR, IN BEWEGUNG</p>
    <button id="options-open" class="button outline">Optionen</button><nav aria-label="Anwendungsbereiche">
      <button id="player-tab" class="nav-button active" aria-pressed="true"><span>◉</span> Player</button>
      <button id="studio-tab" class="nav-button" aria-pressed="false"><span>◇</span> Avatar-Studio</button>
    </nav>
    <div class="rail-bottom"><span class="online-dot"></span> Lokal auf deinem Gerät<p>Entwicklungsstand 0.58.0<br>KI-Anbieter · Vorbereitung</p></div>
  </aside>
  <main>
    <header><div><p class="eyebrow">PAKACHI-SM / <span id="section-label">PLAYER</span></p><h1 id="page-title">Dein Model Zoo<span>.</span></h1><p id="page-intro">Eine Figur auswählen. Eine Bewegung starten. Leben einhauchen.</p></div><button id="project-open" class="button outline">Projekt laden</button><input id="project-file" type="file" accept=".json" hidden><button id="import-button" class="button outline">＋ GLB laden</button><input id="file-input" type="file" accept=".glb" hidden></header>
    <div class="model-history" data-user-text><button id="model-undo" disabled>Modellwechsel zurück</button><button id="model-redo" disabled>Modellwechsel wiederholen</button><span id="model-history-note"></span></div>
    <div class="notice identity-note"><span>✦</span><p><strong>Dein PaKaChi bleibt PaKaChi.</strong> Beide Formen und alle 72 Transformationsbilder sind im Originalplayer erhalten. Mika und Nori sind ausschließlich technische Testavatare.</p></div>
    <div id="message" role="status" aria-live="polite">Model Zoo wird geladen …</div>
    <div class="workspace">
      <section class="stage-panel" aria-label="Avatar-Vorschau">
        <div class="stage-top"><span class="pill" id="model-type">3D · TESTAVATAR</span><button id="reset-camera" class="text-button">Ansicht zurücksetzen ↺</button></div>
        <div class="view-tools"><label>Ansicht<select id="view-side"><option value="">Frei drehen</option><option value="front">Vorne</option><option value="back">Hinten</option><option value="left">Links</option><option value="right">Rechts</option><option value="top">Oben</option><option value="bottom">Unten</option></select></label><button id="view-roll-left" title="Ansicht 90 Grad nach links rollen">↶ 90°</button><button id="view-roll-right" title="Ansicht 90 Grad nach rechts rollen">↷ 90°</button></div><div id="viewport"></div><iframe id="legacy-frame" class="legacy-frame" title="PaKaChi Originalplayer mit Tierform und Arbeitsform"></iframe>
        <div class="stage-caption"><div><h2 id="avatar-name">Wird geladen …</h2><p id="avatar-description"></p></div><span class="live-badge" id="activity">Bereit</span></div>
        <p class="camera-help">Mitte halten: frei drehen · rechts ziehen: verschieben · Mausrad: zoomen</p>
      </section>
      <aside class="control-panel">
        <div class="panel-heading"><span class="eyebrow">MODEL ZOO</span><span id="avatar-count" class="count">0</span></div>
        <label for="avatar-select">Avatar auswählen</label><select id="avatar-select" disabled></select>
        <div id="avatar-cards" class="avatar-cards"></div><div id="local-zoo-host"></div>
        <div class="divider"></div>
        <div id="legacy-controls" hidden><h2>PaKaChi · Original</h2><p class="legacy-notice">Dein bestehender Avatar mit beiden Formen, 72 Transformationsbildern und optionalem MQTT. Die originale Darstellung und Steuerung bleiben erhalten.</p><p class="legacy-notice">Wähle links „Arbeiten“ oder „Normaler Chat“. Die Endform bleibt bis zum nächsten Signal stehen.</p><p class="legacy-notice">Der Bildstand ist ein Entwurf mit bekannten Proportions- und Materialschwankungen. Die 3D-Übertragung dieses Designs steht noch aus.</p></div><div id="player-controls">
          <div class="panel-heading"><h2>Bewegungen</h2><span id="move-count" class="count">0</span></div>
          <p class="subtle">Was dieser Avatar schon kann.</p>
          <div id="moves" class="moves"></div>
          <div class="playback"><button id="pause" class="button primary" disabled>Pause</button><label for="speed">Tempo<select id="speed"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label></div>
          <label class="timeline-label" for="timeline"><span>Abspielposition</span><output id="time">0,0 / 0,0 s</output></label><input id="timeline" type="range" min="0" max="1000" value="0" disabled>
          <details class="legend"><summary>Schlagworte & Fähigkeiten</summary><ul id="capabilities"></ul></details>
        </div>
        <div id="generation-host" hidden></div>
        <div id="studio-controls" hidden>
          <p class="subtle">Dein Editor, direkt im Player.</p>
          <label class="check"><input type="checkbox" id="skeleton"> Skelett anzeigen</label>
          <div id="studio-editor"><p class="subtle">Zuerst einen 3D-Avatar auswählen. Für den Original-Bildplayer liegt noch kein 3D-Modell vor.</p></div>
          <button id="back-player" class="button outline">Zurück zum Player</button>
        </div>
        <p class="local-note">GLB-Import bleibt lokal im Browser und gilt für diese Sitzung. Es werden keine Modelle hochgeladen.</p>
      </aside>
    </div>
    <footer><span>PAKACHI · PANDA-KI-CHIMERA</span><span>Zustandssteuerung · MQTT · MCP</span></footer>
  </main>`;

mountOptions();

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
let viewer: Viewer | undefined;
let original = false;
let playback: Playback | null = null;
let catalog: Avatar[] = [];
let zooEntries:ZooEntry[]=[];
let zooPending=false;
let zooPanel:ReturnType<typeof mountLocalZoo>|undefined;
function choices(){return catalogChoices(catalog,zooEntries,loaded,original);}
function selectAvatar(id:string){
 if(zooPending||busy)return;
 if(id==='pakachi-original'){showOriginal();return;}
 if(zooEntries.some(entry=>entry.id===id)){zooPanel?.load(id);return;}
 const avatar=catalog.find(a=>a.id===id);if(avatar)void loadAvatar(avatar);
}
let loaded: Avatar | null = null;
let studio = false;
let modelEpoch=0;
function generationTarget():ProjectRevision {const info=editor?.inspect();return info?{session:info.session,revision:info.revision}:{session:`model-${modelEpoch}`,revision:0};}
let editor: StudioEditor | null = null;
type ModelSnapshot={kind:'original'}|{kind:'project';project:StudioProject;dirty:boolean;identity:Pick<Avatar,'id'|'model'|'rigVersion'>};
const modelHistory=new ModelSwitchHistory<ModelSnapshot>(value=>JSON.stringify(value).length*2);
function captureModel():ModelSnapshot|null {
  if(editor&&loaded)return {kind:'project',project:editor.exportProject(),dirty:editor.dirty,identity:{id:loaded.id,model:loaded.model,rigVersion:loaded.rigVersion}};
  return original?{kind:'original'}:null;
}
function renderModelHistory(){
  const blocked=busy||!!editor?.interactionActive;
  el<HTMLButtonElement>('model-undo').disabled=blocked||!modelHistory.canUndo;
  el<HTMLButtonElement>('model-redo').disabled=blocked||!modelHistory.canRedo;
  el('model-undo').textContent=options.language==='de'?'Modellwechsel zurück':'Undo model switch';
  el('model-redo').textContent=options.language==='de'?'Modellwechsel wiederholen':'Redo model switch';
  el('model-history-note').textContent=options.language==='de'?'Letzter Modellwechsel · nur diese Sitzung':'Last model switch · this session only';
}
async function travelModel(direction:'undo'|'redo'){
  if(busy||editor?.interactionActive)return;
  try{
    const current=captureModel();if(!current)return;
    const expected=generationTarget();
    const accepted=await modelHistory.travel(direction,current,async(snapshot,valid)=>{
      const guard=()=>{const now=generationTarget();return valid()&&!editor?.interactionActive&&now.session===expected.session&&now.revision===expected.revision;};
      if(snapshot.kind==='original')return guard()&&showOriginal(false);
      return loadAvatar(undefined,undefined,snapshot.project,guard,{remember:false,confirm:false,dirty:snapshot.dirty,identity:snapshot.identity});
    });
    if(!accepted)message(options.language==='de'?'Modellwechsel nicht ausgeführt; Projektstand prüfen.':'Model switch not applied; check the project state.',true);
  }catch{message(options.language==='de'?'Modellwechsel konnte nicht wiederhergestellt werden.':'Could not restore the model switch.',true);}
  finally{renderModelHistory();}
}
const transport = () => editor?.playing ? editor : playback;
function mayReplace(): boolean { return !editor?.dirty || window.confirm(translate("Ungespeicherte Studio-Änderungen verwerfen? Mit Abbrechen kannst du zuerst das Projekt speichern.")); }
function resumeBase(): void {
  const id = loaded?.states?.[machine.state ?? ""] ?? loaded?.defaultMove;
  if (id) playback?.setBaseMove(id);
  syncPlayback();
}
function refreshCapabilities(): void {
  if (!loaded || !machine.capability) return;
  const capability = machine.capability;
  capability.moves = [...availableMoves(loaded, loaded.moves.map(m=>m.clip)), ...(editor?.data.moves ?? []).map(m=>({id:m.id,name:m.name,loop:m.loop,clip:m.id,...moveReview(editor!.data,m)}))];
  machine.bind({capability,setState:state=>{editor?.stopMove();editor?.rig.restoreSource();playback!.setBaseMove(loaded!.states![state]);},
    playMove:id=>{if(editor?.play(id))return;editor?.stopMove();editor?.rig.restoreSource();playback!.play(id);}},machine.state);
  renderMoves(capability.moves.map(m=>({...m,clip:m.id})));
  syncPlayback();
}
let request = 0;
let fetchController: AbortController | null = null;
let busy = false;
const machine = new StateMachine(() => window.dispatchEvent(new Event('pakachi-sm:change')));
function rpc(method: string, args: Record<string, unknown> = {}): unknown {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Ungültige Argumente.');
  if (method === 'list_avatars') return choices().map(({id,name,selected})=>({id,name,selected}));
  if (method === 'get_state') return {state:machine.state, capability:machine.capability, ready:!busy && !studio && !!machine.capability};
  if (busy) throw new Error('Avatar wird geladen. Bitte erneut versuchen.');
  if(method==='get_studio'||method==='edit_studio'){if(!editor||original)throw new Error('Zuerst einen 3D-Avatar laden.');if(method==='get_studio')return editor.inspect(args);if(Object.keys(args).some(k=>k!=='command'))throw new Error('Ungültige Studio-Argumente.');return editor.execute(args.command);}
  if (args.avatar && args.avatar !== machine.capability?.id) throw new Error('Bitte diesen Avatar zuerst im Player auswählen.');
  if (method === 'get_avatar_capabilities') { if(!machine.capability) throw new Error('Kein Avatar bereit.'); return machine.capability; }
  if (method === 'list_moves') { if(!machine.capability) throw new Error('Kein Avatar bereit.'); return machine.capability.moves; }
  if (studio && ['set_state','play_move','command'].includes(method)) throw new Error('Studio ist geöffnet. Zum Steuern zurück zum Player wechseln.');
  if (method === 'set_state') return machine.execute({state:args.state, ...(args.avatar ? {avatar:args.avatar} : {})});
  if (method === 'play_move') return machine.execute({move:args.move, ...(args.avatar ? {avatar:args.avatar} : {})});
  if (method === 'command') return machine.execute(args.payload);
  throw new Error('Unbekannte Operation.');
}
window.PaKaChiSM = {call:rpc};
function connectOriginal(): void {
  if (!original) return;
  const frame = el<HTMLIFrameElement>('legacy-frame');
  const win = frame.contentWindow as (Window & {Pakachi?: {setStatus:(value: string) => void; getState:() => {status:string}}}) | null;
  if (!win?.Pakachi) return;
  const api = win.Pakachi;
  const legacyPanel = frame.contentDocument?.querySelector<HTMLElement>('.mqtt-panel');
  if(legacyPanel) legacyPanel.hidden=true;
  machine.bind({capability:{id:'pakachi-original',name:'PaKaChi Original',states:[...STATES],moves:[]},
    setState:state=>api.setStatus(state), playMove:()=>{throw new Error('Formwechsel über Zustände steuern.');}},api.getState().status);
  win.addEventListener('pakachi:state',()=>{if(original && win===frame.contentWindow) machine.observe(api.getState().status);});
}


function message(text: string, error = false): void {
  el('message').textContent = text;
  el('message').classList.toggle('error', error);
}

function changeView(edit: boolean): void {
  if (studio !== edit) { if(edit) editor?.enter(); else editor?.leave(); }
  studio = edit;
  viewer?.setStudio(edit);
  document.body.classList.toggle("studio-active",edit);
  window.dispatchEvent(new Event("pakachi-sm:change"));
  el('player-controls').hidden = edit || original;
  el('studio-controls').hidden = !edit || original;
  el('generation-host').hidden = !edit;
  el('legacy-controls').hidden = !original;
  for (const [id, active] of [['player-tab', !edit], ['studio-tab', edit]] as const) {
    el(id).classList.toggle('active', active);
    el(id).setAttribute('aria-pressed', String(active));
  }
  el('page-title').textContent = edit ? 'Dein Avatar-Studio.' : 'Dein Model Zoo.';
  el('section-label').textContent = edit ? 'AVATAR-STUDIO' : 'PLAYER';
  el('page-intro').textContent = edit ? 'Ein gemeinsamer Ort für deine Figuren und ihre Bewegungen.' : 'Eine Figur auswählen. Eine Bewegung starten. Leben einhauchen.';
  viewer?.showSkeleton(edit && el<HTMLInputElement>('skeleton').checked);
}

function syncPlayback(): void {
  renderModelHistory();
  el<HTMLButtonElement>('pause').disabled = busy || !transport()?.current;
  el<HTMLInputElement>('timeline').disabled = busy || !transport()?.current;
  el('pause').textContent = transport()?.paused ? '▶ Weiter' : 'Ⅱ Pause';
  el('activity').textContent = transport()?.current ? `${transport()!.paused ? 'Pausiert' : '●'} · ${transport()!.current!.name}` : 'Standbild';
  el('moves').querySelectorAll<HTMLButtonElement>('button').forEach(button => {
    const active = button.dataset.move === transport()?.current?.id;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
    button.disabled = busy;
  });
}

function renderCatalog(): void {
  const select=el<HTMLSelectElement>('avatar-select'),items=choices();select.replaceChildren();el('avatar-cards').replaceChildren();
  for(const item of items){
    const source=options.language==='de'?{original:'Original (2D)',builtin:'Katalogavatar',saved:'Gespeichert · lokal',session:'Nur diese Sitzung'}:{original:'Original (2D)',builtin:'Catalog avatar',saved:'Saved · local',session:'This session only'};
    select.add(new Option(item.name+' · '+source[item.source],item.id));
    const button=document.createElement('button');button.className='avatar-card'+(item.source==='original'?' original-card':'')+(item.selected?' selected':'');button.setAttribute('aria-pressed',String(item.selected));button.disabled=busy||zooPending||item.source==='session';
    const initial=document.createElement('span');initial.className='avatar-initial '+item.id;initial.textContent=item.source==='original'?'✦':item.name[0];const title=document.createElement('strong'),type=document.createElement('small');title.textContent=item.name;type.textContent=source[item.source];button.append(initial,title,type);button.onclick=()=>selectAvatar(item.id);el('avatar-cards').append(button);
  }
  const selected=items.find(item=>item.selected);if(selected)select.value=selected.id;
  select.disabled=busy||zooPending;el('avatar-count').textContent=String(items.length);
}

function renderMoves(moves: Move[]): void {
  el('moves').replaceChildren(); el('capabilities').replaceChildren();
  el('move-count').textContent = String(moves.length);
  moves.forEach(move => {
    const button = document.createElement('button'); button.className = 'move-button'; button.dataset.move = move.id;
    const title = document.createElement('span'); title.dataset.userText='';title.textContent = move.name;
    const icon = document.createElement('span'); icon.textContent = move.loop ? '↻' : '↗'; icon.setAttribute('aria-hidden', 'true');
    button.append(title, icon);if(move.needsReview){const note=document.createElement('small');note.textContent='⚠ Posen prüfen';note.className='move-review-badge';button.append(note);} button.onclick = () => { try { rpc('play_move',{move:move.id}); syncPlayback(); } catch(error) {message(String(error),true);} };
    el('moves').append(button);
    const li = document.createElement('li'); const code = document.createElement('code'); code.textContent = move.id;
    li.append(code, ` · ${move.loop ? 'Schleife' : 'einmalig'}`); el('capabilities').append(li);
  });
  if (!moves.length) el('moves').textContent = 'Dieses Modell enthält keine abspielbaren Bewegungen.';
}

function showOriginal(remember=true): boolean {
  if(original&&!busy)return true;
  if(editor?.interactionActive){message('Studio-Bewegung zuerst beenden.',true);return false;}
  if(remember&&!mayReplace()){renderCatalog();return false;}
  let commitHistory:(()=>void)|undefined;
  try{const before=remember?captureModel():null;if(before)commitHistory=modelHistory.checkpoint(before);}catch{message('Modellwechsel konnte nicht gesichert werden.',true);return false;}
  editor?.dispose();editor=null;
  request++; fetchController?.abort(); busy = false;
  playback?.dispose(); playback = null; viewer?.clear(); loaded = null;
  original = true; modelEpoch++; machine.unbind();
  el('avatar-name').textContent='PaKaChi Original';
  el('avatar-description').textContent='Panda-KI-Chimera · Tierform und Arbeitsform · 72 Transformationsbilder';
  el('model-type').textContent='ORIGINAL · 2D';
  renderMoves([]);syncPlayback();
  el('legacy-frame').parentElement!.classList.add('legacy');
  const frame = el<HTMLIFrameElement>('legacy-frame');
  frame.onload = connectOriginal;
  if (!frame.getAttribute('src')) frame.src = `${import.meta.env.BASE_URL}legacy/pakachi/index.html`;
  connectOriginal();
  renderCatalog(); changeView(studio);
  message('PaKaChi · Originalstand wiederhergestellt · 72 Bilder · Tierform ↔ Arbeitsform');
  commitHistory?.();renderModelHistory();return true;
}

async function loadAvatar(avatar?: Avatar, file?: File, project?: StudioProject, valid:()=>boolean=()=>true, restore:{remember?:boolean;confirm?:boolean;dirty?:boolean;identity?:Pick<Avatar,'id'|'model'|'rigVersion'>}={}): Promise<boolean> {
  if(editor?.interactionActive){message('Studio-Bewegung zuerst beenden.',true);return false;}
  if(!valid()||(restore.confirm!==false&&!mayReplace())||!valid()){renderCatalog();return false;}
  const token = ++request;
  fetchController?.abort();
  fetchController = new AbortController();
  busy = true; syncPlayback();window.dispatchEvent(new Event("pakachi-sm:change"));
  message(`${file?.name ?? avatar?.name ?? 'Avatar'} wird geladen …`);
  let parsed:Awaited<ReturnType<typeof parseModel>>|undefined,candidate:ReturnType<typeof prepareAvatar>|undefined,installed=false;
  try {
    if (!viewer) throw new Error('3D benötigt WebGL2/Hardwarebeschleunigung. Der Originalplayer bleibt verfügbar.');
    if(!project&&!file&&avatar?.project){project=await loadCatalogProject(avatar,import.meta.env.BASE_URL,fetchController.signal);if(token!==request||!valid())return false;}
    let buffer: ArrayBuffer;
    if (project) {buffer = decodeModel(project.model);if(buffer.byteLength>50*1024*1024)throw new Error("Das enthaltene Modell ist größer als 50 MB.");}
    else if (file) {
      if (!/\.glb$/i.test(file.name)) throw new Error('Bitte eine eigenständige .glb-Datei auswählen.');
      if (file.size > 50 * 1024 * 1024) throw new Error('Die GLB-Datei ist größer als 50 MB. Bitte einen kleineren Export verwenden.');
      buffer = await file.arrayBuffer();
    } else {
      if (!avatar) throw new Error('Kein Avatar ausgewählt.');
      const response = await fetch(`${import.meta.env.BASE_URL}${avatar.model}`, { signal: fetchController.signal });
      if (!response.ok) throw new Error(`Modelldatei konnte nicht geladen werden (${response.status}).`);
      buffer = await response.arrayBuffer();
    }
    const gltf = parsed = await parseModel(buffer);
    if (token !== request||!valid()) { return false; }
    const next: Avatar = project ? {...project.avatar,id:restore.identity?.id??avatar?.id??'local-import',model:restore.identity?.model??avatar?.model??'',rigVersion:restore.identity?.rigVersion??avatar?.rigVersion??'studio-1'} : file ? importedAvatar(file.name, gltf.animations.map(c => c.name)) : avatar!;
    const moves = availableMoves(next, gltf.animations.map(c => c.name));
    // Validate visible geometry before replacing a working avatar.
    const hasMesh = gltf.scene.getObjectsByProperty('isMesh', true).length > 0;
    if (!hasMesh) { throw new Error('Das Modell enthält keine sichtbare Geometrie.'); }
    // Check studio/model compatibility before replacing the current avatar.
    let bones=0, meshes=0;gltf.scene.traverse(n=>{if(n.type==='Bone')bones++;if('isMesh' in n)meshes++;});
    if(bones>256 || project && (project.studio.boneRest.length!==bones+(project.studio.boneInsertions?.length??0) || project.studio.points.some(p=>p.mesh!==undefined && p.mesh>=meshes))) {throw new Error('Studio-Daten passen nicht zum Modell oder das Modell hat mehr als 256 Gelenke.');}
    modelBounds(gltf.scene);
    let commitHistory:(()=>void)|undefined;
    if(editor?.interactionActive)throw new Error('Studio-Bewegung zuerst beenden.');
    const before=restore.remember!==false?captureModel():null;if(before)commitHistory=modelHistory.checkpoint(before);
    const projectSource = {format:'pakachi-studio' as const,version:1 as const,model:project?.model ?? encodeModel(buffer),avatar:{...next,moves}};
    parsed=undefined; // Ownership passes to the candidate, including preparation failures.
    const prepared=candidate=prepareAvatar({model:gltf,avatar:next,moves,source:projectSource,data:project?.studio,studio,speed:Number(el<HTMLSelectElement>('speed').value),dirty:restore.dirty??false,skeleton:el<HTMLInputElement>('skeleton').checked,resume:resumeBase,changed:refreshCapabilities,feedback:text=>message(text),playbackChanged:syncPlayback});
    // No await between the final target check and publication of the prepared candidate.
    if(token!==request||!valid()){prepared.dispose();return false;}
    const previous={viewer,editor,playback,loaded,original,modelEpoch};
    prepared.viewer.onFrame=viewer.onFrame;
    const restoreBinding=machine.checkpointBinding();
    const restoreUI=checkpointElements(['viewport','studio-editor','moves','capabilities','move-count','avatar-cards','avatar-select','avatar-count','avatar-name','avatar-description','model-type','player-controls','studio-controls','legacy-controls','pause','timeline','activity','model-undo','model-redo','model-history-note','message'].map(id=>el(id)));
    const legacyStage=el('legacy-frame').parentElement!,wasLegacy=legacyStage.classList.contains('legacy');
    const cleanupErrors=installAtomically(()=>{
      viewer=prepared.viewer as Viewer;editor=prepared.editor;playback=prepared.playback;loaded={...next,moves};original=false;modelEpoch++;
      el('viewport').replaceChildren(prepared.stage);el('studio-editor').replaceChildren(prepared.editorHost);
      legacyStage.classList.remove('legacy');el('player-controls').hidden=studio;el('studio-controls').hidden=!studio;el('legacy-controls').hidden=true;
      renderCatalog();el('avatar-name').textContent=next.name;el('avatar-description').textContent=next.description;
      el('model-type').textContent=next.id.startsWith('saved-')?'3D · EIGENER AVATAR':next.id==='local-import'?'3D · EIGENER IMPORT':'3D · KATALOGAVATAR';
      const states=Object.fromEntries(Object.entries(next.states??{}).filter(([,id])=>moves.some(m=>m.id===id)));
      machine.bind({capability:{id:next.id,name:next.name,moves,states:Object.keys(states)},setState:state=>playback!.setBaseMove(states[state]),playMove:id=>{playback!.play(id);}},prepared.initialState);
      refreshCapabilities();
      const missing=next.moves.length-moves.length;
      message(missing?`${missing} deklarierte Bewegung(en) fehlen in der Modelldatei und werden nicht angeboten.`:`${next.name} bereit · ${moves.length} Bewegungen · ${(buffer.byteLength/1024/1024).toFixed(2).replace('.',',')} MB`);
      commitHistory?.();prepared.activate();
    },()=>{
      viewer=previous.viewer;editor=previous.editor;playback=previous.playback;loaded=previous.loaded;original=previous.original;modelEpoch=previous.modelEpoch;
      restoreBinding();legacyStage.classList.toggle('legacy',wasLegacy);restoreUI();
    },()=>prepared.dispose(),()=>{
      const errors=disposeAll([()=>previous.editor?.dispose(),()=>previous.playback?.dispose(),()=>previous.viewer?.dispose(),()=>el<HTMLIFrameElement>('legacy-frame').removeAttribute('src')]);
      if(errors.length)throw new AggregateError(errors,'previous-avatar-cleanup-failed');
    });
    installed=true;
    if(cleanupErrors.length)message('Avatar geladen; alte Ressourcen konnten nicht vollständig freigegeben werden. Projekt speichern und Seite bei Bedarf neu laden.',true);
    return true;
  } catch (error) {
    if (token !== request) return false;
    message(`Laden fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`, true);
    renderCatalog();return false;
  } finally {
    if(!installed)disposeAll([()=>candidate?.dispose(),()=>{if(parsed)disposeModel(parsed.scene);}]);
    if (token === request) { busy = false; renderCatalog();syncPlayback();window.dispatchEvent(new Event("pakachi-sm:change")); }
  }
}

async function boot(): Promise<void> {
  el('model-undo').onclick=()=>{void travelModel('undo');};el('model-redo').onclick=()=>{void travelModel('redo');};
  window.addEventListener('pakachi-options',renderModelHistory);
  const zoo=zooPanel=mountLocalZoo(el('local-zoo-host'),{
    ready:()=>!busy&&!editor?.interactionActive,canSave:()=>!!editor,target:()=>!editor?.interactionActive?generationTarget():null,
    capture:()=>!busy&&editor&&!editor.interactionActive?editor.exportProject():null,
    entriesChanged:entries=>{zooEntries=entries;renderCatalog();window.dispatchEvent(new Event('pakachi-sm:change'));},
    pendingChanged:pending=>{zooPending=pending;renderCatalog();},
    load:(project,valid,entry)=>busy?Promise.resolve(false):loadAvatar(undefined,undefined,project,valid,{identity:{id:entry.id,model:'',rigVersion:'studio-1'}}),
  },()=>options.language);
  window.addEventListener('pakachi-options',renderCatalog);
  const agents = mountAgentPanel(rpc);
  mountAssistantPanel(document.querySelector('.agent-panel')!,rpc,()=>options.language,localStorage,undefined,(id,poses,session,revision)=>{if(busy||!editor)throw Error('Studio nicht verfügbar.');return editor.previewSequence(id,poses,session,revision);});
  const generation=mountGenerationPanel(el('generation-host'),{
    target:()=>studio&&!busy&&!editor?.interactionActive?generationTarget():null,
    adopt:(bytes,expected,valid)=>{
      if(busy)return Promise.resolve(false);
      const guard=()=>{const now=generationTarget();return valid()&&studio&&!editor?.interactionActive&&now.session===expected.session&&now.revision===expected.revision;};
      return loadAvatar(undefined,new File([Uint8Array.from(bytes).buffer],'3D-Entwurf.glb',{type:'model/gltf-binary'}),undefined,guard);
    },
  },()=>options.language,localStorage);
  try { viewer = new Viewer(el('viewport')); }
  catch { message('3D ist ohne WebGL2 nicht verfügbar. Der Originalplayer kann verwendet werden.', true); }
  if (viewer) viewer.onFrame = delta => {
    if(editor?.playing)editor.update(delta);else if(!studio)playback?.update(delta);
    if(editor?.playing)syncPlayback();
    const duration = transport()?.duration ?? 0;
    const progress = transport()?.progress ?? 0;
    if (document.activeElement !== el('timeline')) el<HTMLInputElement>('timeline').value = String(progress * 1000);
    el('time').textContent = `${(duration * progress).toFixed(1).replace('.', ',')} / ${duration.toFixed(1).replace('.', ',')} s`;
  };
  el('player-tab').onclick = () => changeView(false);
  el('studio-tab').onclick = () => changeView(true);
  el('back-player').onclick = () => changeView(false);
  el('reset-camera').onclick = () => {viewer?.resetCamera();el<HTMLSelectElement>('view-side').value='';};
  el('view-side').onchange=()=>viewer?.setView(el<HTMLSelectElement>('view-side').value);
  el('view-roll-left').onclick=()=>viewer?.rollView(90);
  el('view-roll-right').onclick=()=>viewer?.rollView(-90);
  el('skeleton').onchange = () => viewer?.showSkeleton(el<HTMLInputElement>('skeleton').checked);
  el('pause').onclick = () => {transport()?.togglePause();syncPlayback();};
  el('speed').onchange = () => {const value=Number(el<HTMLSelectElement>('speed').value);playback?.setSpeed(value);editor?.setSpeed(value);};
  el('timeline').oninput = () => transport()?.seek(Number(el<HTMLInputElement>('timeline').value) / 1000);
  el('avatar-select').onchange=()=>selectAvatar(el<HTMLSelectElement>('avatar-select').value);
  el('project-open').onclick = () => el<HTMLInputElement>('project-file').click();
  el('project-file').onchange = async () => {
    const file=el<HTMLInputElement>('project-file').files?.[0];el<HTMLInputElement>('project-file').value='';if(!file)return;
    try {if(file.size>80*1024*1024)throw new Error('Projektdatei ist größer als 80 MB.');const project=parseProject(JSON.parse(await file.text()));await loadAvatar(undefined,undefined,project);}
    catch(error){message(`Projekt konnte nicht geladen werden: ${error instanceof Error?error.message:String(error)}`,true);}
  };
  window.addEventListener('beforeunload',event=>{if(editor?.dirty){event.preventDefault();event.returnValue='';}});
  el('import-button').onclick = () => el<HTMLInputElement>('file-input').click();
  el('file-input').onchange = () => {
    const file = el<HTMLInputElement>('file-input').files?.[0];
    if (file) void loadAvatar(undefined, file);
    el<HTMLInputElement>('file-input').value = '';
  };
  let dragDepth = 0;
  document.addEventListener('drop',()=>{dragDepth=0;document.body.classList.remove('dragging');},true);
  document.addEventListener('dragover', event => event.preventDefault());
  document.addEventListener('dragenter', event => { event.preventDefault(); dragDepth++; document.body.classList.add('dragging'); });
  document.addEventListener('dragleave', () => { if (--dragDepth <= 0) document.body.classList.remove('dragging'); });
  document.addEventListener('drop', event => {
    event.preventDefault(); dragDepth = 0; document.body.classList.remove('dragging');
    const file = event.dataTransfer?.files[0]; if(file&&['image/png','image/jpeg'].includes(file.type)){changeView(true);generation.select(file);}else if (file) void loadAvatar(undefined, file);
  });
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}model-zoo/catalog.json`);
    if (!response.ok) throw new Error(`Katalog nicht erreichbar (${response.status}).`);
    catalog = parseCatalog(await response.json()); renderCatalog();
    showOriginal();
  } catch (error) { message(`Model Zoo: ${error instanceof Error ? error.message : String(error)}`, true); }
  window.addEventListener('pagehide', () => { zoo.dispose();agents.dispose(); editor?.dispose(); fetchController?.abort(); request++; playback?.dispose(); viewer?.dispose(); }, { once: true });
}
void boot();
