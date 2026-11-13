import {ProviderJob} from './ai-jobs.ts';
import type {ProjectRevision} from './ai-jobs.ts';
import type {ProviderAdapter,ProviderConfig,ProviderProfile} from './ai-providers.ts';
import {ProviderRegistry,readProviderConfig,providerRoute,remainingProviderConfig} from './ai-providers.ts';
import {getProviderKey} from './provider-credentials.ts';
import {createLocalGenerationAdapter} from './generation-adapter.ts';
import {mountImageReferenceEditor} from './image-reference-editor.ts';
import {validateGeneration,showGenerationPreview} from './generation-preview.ts';
import {prepareDraftRig} from './draft-rig.ts';
import type {ImageReferenceDocument} from './image-reference.ts';
import type {DraftRigTemplate} from './draft-rig.ts';

interface GenerationHost {
 target:()=>ProjectRevision|null;
 adopt:(bytes:Uint8Array,expected:ProjectRevision,valid:()=>boolean,reference?:ImageReferenceDocument)=>Promise<boolean>;
}
type ReferenceEditor=ReturnType<typeof mountImageReferenceEditor>;
interface Dependencies {
 referenceEditor?:typeof mountImageReferenceEditor;
 adapter?:(key:string,profile:Readonly<ProviderProfile>)=>ProviderAdapter;
 validate?:typeof validateGeneration;
 preview?:typeof showGenerationPreview;
 prepareRig?:typeof prepareDraftRig;
}
export function mountGenerationPanel(host:HTMLElement,bridge:GenerationHost,language:()=> 'de'|'en',storage:Pick<Storage,'getItem'>,deps:Dependencies={}){
 const panel=document.createElement('section');panel.className='generation-panel';panel.dataset.userText='';
 const heading=document.createElement('h2'),destination=document.createElement('p'),notice=document.createElement('p'),label=document.createElement('label'),file=document.createElement('input'),chosen=document.createElement('p'),referenceHost=document.createElement('div'),start=document.createElement('button'),retry=document.createElement('button'),cancel=document.createElement('button'),discard=document.createElement('button'),apply=document.createElement('button'),status=document.createElement('p'),preview=document.createElement('div');
 file.type='file';file.accept='image/png,image/jpeg';file.id='generation-image';label.htmlFor=file.id;
 retry.id='generation-retry';start.id='generation-start';cancel.id='generation-cancel';discard.id='generation-discard';apply.id='generation-apply';
 for(const button of [start,retry,cancel,discard,apply])button.type='button';
 status.setAttribute('role','status');preview.className='generation-preview';
 referenceHost.className='image-reference-host';referenceHost.hidden=true;
 const rigControls=document.createElement('div'),rigLabel=document.createElement('label'),template=document.createElement('select'),alignmentLabel=document.createElement('label'),alignment=document.createElement('select'),rigNotice=document.createElement('p'),rig=document.createElement('button'),original=document.createElement('button'),rigStatus=document.createElement('p');
 template.id='generation-rig-template';rigLabel.htmlFor=template.id;rig.id='generation-rig';original.id='generation-original';rig.type=original.type='button';
 for(const value of ['biped','biped-relaxed','quadruped']){const option=document.createElement('option');option.value=value;template.append(option);}
 alignment.id='generation-rig-alignment';alignmentLabel.htmlFor=alignment.id;for(const value of ['support','bounds']){const option=document.createElement('option');option.value=value;alignment.append(option);}
 rigStatus.setAttribute('role','status');rigControls.append(rigLabel,template,alignmentLabel,alignment,rigNotice,rig,original,rigStatus);
 panel.append(heading,destination,notice,label,file,chosen,referenceHost,start,retry,cancel,discard,status,preview,rigControls,apply);host.append(panel);
 let source:File|undefined,referenceEditor:ReferenceEditor|undefined,referenceReady=false,job:ProviderJob|undefined,sequence=0,controller:AbortController|undefined,disposePreview:(()=>void)|undefined,pending=false,disposed=false;
 let prepared:Awaited<ReturnType<typeof prepareDraftRig>>|undefined;
 let rigPreviewHost:HTMLDivElement|undefined;
 let retryRequest:{config:ProviderConfig;target:ProjectRevision;selected:File;keys:Map<string,string>}|undefined;
 const t=(de:string,en:string)=>language()==='de'?de:en;
 const matches=(target:ProjectRevision)=>{const now=bridge.target();return !!now&&target.session===now.session&&target.revision===now.revision;};
 function clear(preserveReference=false){sequence++;if(!preserveReference){referenceEditor?.dispose();referenceEditor=undefined;referenceReady=false;referenceHost.replaceChildren();referenceHost.hidden=true;}prepared=undefined;rigPreviewHost?.remove();rigPreviewHost=undefined;rigStatus.textContent='';rigControls.hidden=true;retryRequest=undefined;retry.hidden=true;job?.cancel();if(job?.snapshot.status==='preview'||job?.snapshot.status==='stale')job.discard();job=undefined;controller?.abort();controller=undefined;disposePreview?.();disposePreview=undefined;preview.replaceChildren();preview.hidden=true;pending=false;apply.hidden=true;cancel.disabled=true;discard.disabled=true;file.disabled=false;}
 function labels(){retry.textContent=t('Nächsten Anbieter versuchen','Try next provider');heading.textContent=t('Bild → 3D-Entwurf','Image → 3D draft');label.textContent=t('PNG/JPEG auswählen oder hier ablegen','Choose or drop a PNG/JPEG here');start.textContent=t('3D-Entwurf erzeugen','Generate 3D draft');cancel.textContent=t('Abbrechen','Cancel');discard.textContent=t('Ergebnis verwerfen','Discard result');apply.textContent=t('Als neuen Avatar laden','Load as new avatar');notice.textContent=t('Sendet nur den ausdrücklich ausgewählten und markierten Bildausschnitt an den lokalen TripoSR-Dienst. Ein Entwurf ohne zugesichertes Skelett; keine Promptsteuerung. Das aktuelle Modell bleibt bis zur Übernahme erhalten. Der letzte Modellwechsel lässt sich über „Modellwechsel zurück“ wiederherstellen; Projekte zusätzlich speichern. Automatischer Anbieterwechsel nur vor dem Auftragsstart. Ein weiterer Auftrag benötigt einen ausdrücklichen Klick.','Sends only the explicitly selected and marked image region to the configured local TripoSR service. A draft without a guaranteed skeleton; no prompt control. Your current model remains until acceptance. Use Undo model switch to restore the last project; also save projects to disk. Automatic fallback only before execution. Another job requires an explicit click.');}
 function refresh(){
  labels();const config=readProviderConfig(storage),route=providerRoute(config.config,'generation');
  rigLabel.textContent=t('Optionales erstes Skelett','Optional first skeleton');template.options[0].textContent=t('Zweibeiner · A-Pose','Biped · A-pose');template.options[1].textContent=t('Zweibeiner · Arme unten','Biped · arms down');template.options[2].textContent=t('Vierbeiner · stehend','Quadruped · standing');
  alignmentLabel.textContent=t('Körperausrichtung','Body alignment');alignment.options[0].textContent=t('An Standflächen ausrichten','Align using standing supports');alignment.options[1].textContent=t('Nach Gesamtmaßen · bisherige Vorlage','Overall bounds · previous template');
  rig.textContent=t('Skelettentwurf vorbereiten','Prepare skeleton draft');original.textContent=t('Generator-Original zeigen','Show generator original');
  rigNotice.textContent=t('Proportionsvorlage mit Hautgewichten, lokal berechnet. Keine KI-Anatomieerkennung. Aufrechte Ausrichtung und Blick nach vorn (+Z) erforderlich. Gelenke und Beugungen nach der Übernahme im Studio prüfen und korrigieren. Gesicht und einzelne Finger werden nicht geriggt.','A proportional template with skin weights, calculated locally. No AI anatomy recognition. Requires upright orientation and forward facing (+Z). Check and adjust joints and bends in Studio after acceptance. No facial or individual finger rig.');
  const hasPreview=job?.snapshot.status==='preview'&&!apply.hidden;
  rigControls.hidden=!hasPreview;rig.disabled=template.disabled=alignment.disabled=pending||!hasPreview||!matches(job!.snapshot.target);original.hidden=!prepared;original.disabled=rig.disabled;
  const supported=route.some(profile=>profile.adapter==='custom-generation'&&profile.model==='triposr');
  destination.textContent=route.length?route.map(profile=>`${profile.name} · ${profile.model} · ${profile.endpoint}`).join(' → '):t('Optionen: ein Profil „custom-generation“ mit Modell „triposr“ der Rolle 3D-Generator zuordnen.','Options: assign a custom-generation profile with model triposr to the 3D generator role.');
  start.disabled=pending||!source||!referenceReady||!supported||!bridge.target();chosen.textContent=source?`${source.name} · ${(source.size/1024/1024).toFixed(2)} MiB`:t('Noch kein Bild ausgewählt.','No image selected.');
  retry.disabled=pending||!retryRequest||!matches(retryRequest.target);
  if(job?.snapshot.status==='preview')apply.disabled=pending||!matches(job.snapshot.target);
 }
 function select(value:File){clear();source=undefined;status.textContent='';if(!['image/png','image/jpeg'].includes(value.type)||!value.size||value.size>20*1024*1024){status.textContent=t('PNG/JPEG bis 20 MiB erforderlich.','PNG/JPEG up to 20 MiB required.');}else{source=value;referenceHost.hidden=false;referenceEditor=(deps.referenceEditor??mountImageReferenceEditor)(referenceHost,value,language,()=>{referenceReady=false;refresh();void updateReferenceReadiness();});void updateReferenceReadiness();status.textContent=t('Bitte Bildbereiche markieren, zuordnen und bestätigen.','Mark, assign and confirm image regions before generation.');}refresh();}
 async function updateReferenceReadiness(){const editor=referenceEditor;if(!editor)return;try{referenceReady=await editor.ready();if(referenceEditor===editor){refresh();if(!referenceReady)status.textContent=t('3D gesperrt: Alle Bereiche müssen bestätigt oder ignoriert und korrekt zugeordnet sein.','3D locked: every region must be confirmed or ignored and correctly assigned.');}}catch{referenceReady=false;refresh();}}
 file.onchange=()=>{const value=file.files?.[0];if(value)select(value);file.value='';};
 panel.ondragover=event=>{event.preventDefault();event.stopPropagation();};panel.ondrop=event=>{event.preventDefault();event.stopPropagation();document.body.classList.remove('dragging');const value=event.dataTransfer?.files[0];if(value)select(value);};
 start.onclick=async()=>{
  if(pending||!source||!referenceEditor)return;
  const config=readProviderConfig(storage).config,target=bridge.target();
  if(!target||!providerRoute(config,'generation').length)return;
  const keys=new Map(config.profiles.map(profile=>[profile.id,getProviderKey(profile)]));
  try{const crop=await referenceEditor.selectedCrop();if(!referenceReady||!source)return;void begin(config,target,crop,keys);}catch{status.textContent=t('Kein freigegebener Bildausschnitt. Markierungen und Zuordnungen prüfen.','No approved image crop. Check markings and assignments.');}
 };
 retry.onclick=()=>{if(pending||!retryRequest||!matches(retryRequest.target))return;const request=retryRequest;void begin(request.config,request.target,request.selected,request.keys);};
 async function begin(config:ProviderConfig,target:ProjectRevision,selected:File,keys:Map<string,string>){
  clear(true);const current=sequence;pending=true;controller=new AbortController();const signal=controller.signal;
  const tokenFor=(profile:Readonly<ProviderProfile>)=>keys.get(profile.id)??'';
  const registry=new ProviderRegistry();
  registry.register(deps.adapter?{
   id:'custom-generation',
   probe:(profile,signal)=>deps.adapter!(tokenFor(profile),profile).probe(profile,signal),
   run:request=>{const adapter=deps.adapter!(tokenFor(request.profile),request.profile);if(!adapter.run)throw new Error('execution-missing');return adapter.run(request);},
  }:createLocalGenerationAdapter(tokenFor));
  file.disabled=true;cancel.disabled=false;refresh();status.textContent=t('Bild wird vorbereitet …','Preparing image …');
  try{
   const bytes=new Uint8Array(await selected.arrayBuffer());if(current!==sequence)return;
   const task=job=new ProviderJob(registry,{config,role:'generation',input:{prompt:'Image reconstruction',source:{mediaType:selected.type as 'image/png'|'image/jpeg',bytes}},target,timeoutMs:3600000,preflightFallbacks:true,mayRun:()=>current===sequence&&matches(target),validate:deps.validate??validateGeneration});
   task.subscribe(state=>{if(current===sequence){const phases:Record<string,string>={checking:'Verbindung prüfen',queued:'Vorbereiten',running:'Generierung läuft',validating:'Modell prüfen',preview:'Vorschau vorbereiten',failed:'Fehlgeschlagen',cancelled:'Abgebrochen','timed-out':'Zeitlimit erreicht'};status.textContent=t('Auftrag: '+(phases[state.status]??state.status),'Job: '+state.status)+' · '+state.profile.name;}});task.start();
   const result=await task.done;if(current!==sequence)return;
   if(result.status!=='preview'){
    if(result.executionStarted&&['failed','timed-out'].includes(result.status)){
     const next=remainingProviderConfig(config,'generation',result.profile.id);
     if(next){retryRequest={config:next,target,selected,keys};retry.hidden=false;}
    }
    throw new Error(result.status);
   }
   const output=task.preview();if(output.kind!=='model')throw new Error('model-required');
   preview.hidden=false;const cleanup=await (deps.preview??showGenerationPreview)(preview,output.bytes,signal);
   if(current!==sequence){cleanup();return;}disposePreview=cleanup;apply.hidden=false;discard.disabled=false;
   status.textContent=matches(target)?t('Entwurf prüfen: drehen, zoomen. Optional einen Skelettentwurf vorbereiten, dann ausdrücklich übernehmen.','Review the draft: rotate and zoom. Optionally prepare a skeleton draft, then explicitly accept.'):t('Projekt wurde geändert. Ergebnis wird nicht übernommen; neu generieren.','Project changed. Result cannot be applied; generate again.');
  }catch{if(current===sequence){job?.cancel();disposePreview?.();disposePreview=undefined;preview.hidden=true;status.textContent=t('Generierung oder Vorschau fehlgeschlagen. Dienst, Token, Bild und Laufzeit prüfen; vorhandenes Modell bleibt erhalten.','Generation or preview failed. Check service, token, image and runtime; current model is preserved.');if(retryRequest)status.textContent+=' '+t('Der vorherige Dienst könnte noch arbeiten. „Nächsten Anbieter versuchen“ sendet einen neuen Auftrag.','The previous service may still be running. “Try next provider” sends a new job.');}}
  finally{if(current===sequence){pending=false;cancel.disabled=true;file.disabled=false;refresh();}}
 };
 cancel.onclick=()=>{clear(true);status.textContent=t('Lokal abgebrochen; ein vollständiger Stopp des Dienstes ist nicht bestätigt.','Cancelled locally; complete service shutdown is not confirmed.');refresh();};
 discard.onclick=()=>{clear(true);status.textContent=t('Entwurf verworfen.','Draft discarded.');refresh();};
 async function changeRig(withRig:boolean){
  if(pending||job?.snapshot.status!=='preview'||!matches(job.snapshot.target)||!controller)return;
  const output=job.preview();if(output.kind!=='model')return;
  const current=sequence,target=job.snapshot.target,signal=controller.signal;pending=true;cancel.disabled=false;refresh();
  rigStatus.textContent=t('Skelett und Hautbindung werden vorbereitet …','Preparing skeleton and skin binding …');
  let next:Awaited<ReturnType<typeof prepareDraftRig>>|undefined,cleanup:(()=>void)|undefined,installed=false;
  const nextHost=rigPreviewHost=document.createElement('div');nextHost.className='generation-preview';preview.after(nextHost);
  try{
   if(withRig){next=await (deps.prepareRig??prepareDraftRig)(output.bytes,template.value as DraftRigTemplate,signal,alignment.value as 'support'|'bounds');await (deps.validate??validateGeneration)({kind:'model',bytes:next.bytes},signal);}
   signal.throwIfAborted();if(current!==sequence||!matches(target))throw Error('stale');
   cleanup=await (deps.preview??showGenerationPreview)(nextHost,next?.bytes??output.bytes,signal,withRig);
   signal.throwIfAborted();if(current!==sequence||!matches(target))throw Error('stale');
   disposePreview?.();preview.replaceChildren(nextHost);installed=true;disposePreview=cleanup;cleanup=undefined;prepared=next;
   rigStatus.textContent=next?t(`${next.report.bones} Gelenke · ${next.report.vertices} gebundene Vertices. Ungeprüfter Skelettentwurf; im Studio korrigieren.`,`${next.report.bones} joints · ${next.report.vertices} bound vertices. Unreviewed skeleton draft; adjust in Studio.`):t('Unveränderte Generatorausgabe.','Unmodified generator output.');
   if(next?.report.frame){const frame=next.report.frame;rigStatus.textContent+=' '+(frame.mode==='support'?t(`${frame.supports.length} Standflächen erkannt; Körper daran ausgerichtet.`,`${frame.supports.length} standing supports found; body aligned to them.`):frame.reason==='manual-bounds'?t('Vorlage nach Gesamtmaßen gewählt.','Overall-bounds template selected.'):t('Standflächen nicht eindeutig: Vorlage nach Gesamtmaßen verwendet. Gelenke besonders prüfen.','Standing supports ambiguous: using overall bounds. Inspect joints carefully.'));}
   if(next?.report.probes){const probes=next.report.probes,flagged=probes.filter(p=>p.status==='outside').length,unmeasurable=probes.filter(p=>p.status==='unmeasurable').length,partialVolume=probes.some(p=>p.unmeasurableVolumeComponents>0);rigStatus.textContent+=' '+t(`${probes.length} Beugeproben: ${flagged} auffällig, ${unmeasurable} nicht messbar.${partialVolume?' Volumen teilweise nicht messbar.':''} Keine Anatomie- oder Kollisionsfreigabe.`,`${probes.length} bend probes: ${flagged} flagged, ${unmeasurable} unmeasurable.${partialVolume?' Volume coverage incomplete.':''} No anatomy or collision approval.`);}
  }catch{if(current===sequence)rigStatus.textContent=t('Skelettentwurf nicht vorbereitet. Statische räumliche Geometrie erforderlich; die bisherige Vorschau bleibt erhalten.','Could not prepare skeleton draft. Requires static, volumetric geometry; the previous preview is preserved.');}
  finally{cleanup?.();if(!installed)nextHost.remove();if(rigPreviewHost===nextHost)rigPreviewHost=undefined;if(current===sequence){pending=false;cancel.disabled=true;refresh();}}
 }
 rig.onclick=()=>{void changeRig(true);};original.onclick=()=>{void changeRig(false);};
 apply.onclick=async()=>{
  if(pending||job?.snapshot.status!=='preview')return;const target=job.snapshot.target;
  if(!matches(target)){apply.disabled=true;status.textContent=t('Projekt geändert: Übernahme gesperrt.','Project changed: import blocked.');return;}
  const output=job.preview();if(output.kind!=='model')return;const current=sequence;pending=true;refresh();apply.disabled=true;start.disabled=true;
  try{const reference=await referenceEditor?.reference();if(current!==sequence||!matches(target))return;const accepted=await bridge.adopt(prepared?.bytes??output.bytes,target,()=>!disposed&&sequence===current,reference);if(current!==sequence)return;if(accepted){const wasRigged=!!prepared;clear(true);status.textContent=wasRigged?t('Beweglicher Entwurf geladen. Gelenke in „Gelenke bearbeiten“ korrigieren und Beugungen in „Figur bewegen“ prüfen.','Rigged draft loaded. Adjust joints in Edit joints and inspect bends in Move figure.'):t('Neuer Avatar geladen. Rigging und visuelle Qualitätsprüfung bleiben erforderlich.','New avatar loaded. Rigging and visual quality review are still required.');}else status.textContent=t('Nicht übernommen: abgebrochen oder Projekt inzwischen geändert.','Not applied: cancelled or project changed.');}
  catch{if(current===sequence)status.textContent=t('Übernahme fehlgeschlagen.','Import failed.');}
  finally{if(current===sequence)pending=false;refresh();}
 };
 const reset=()=>{clear(true);status.textContent='';refresh();};
 const events=['pakachi-options','pakachi-providers','pakachi-provider-keys','pakachi-vault-lock','storage','pagehide'];events.forEach(event=>window.addEventListener(event,reset));window.addEventListener('pakachi-sm:change',refresh);clear();refresh();
 return {select,dispose(){disposed=true;clear();events.forEach(event=>window.removeEventListener(event,reset));window.removeEventListener('pakachi-sm:change',refresh);panel.remove();}};
}
