import {ProviderJob} from './ai-jobs.ts';
import type {ProjectRevision} from './ai-jobs.ts';
import type {ProviderAdapter} from './ai-providers.ts';
import {ProviderRegistry,readProviderConfig} from './ai-providers.ts';
import {getProviderKey} from './provider-credentials.ts';
import {createLocalGenerationAdapter} from './generation-adapter.ts';
import {validateGeneration,showGenerationPreview} from './generation-preview.ts';

interface GenerationHost {
 target:()=>ProjectRevision|null;
 adopt:(bytes:Uint8Array,expected:ProjectRevision,valid:()=>boolean)=>Promise<boolean>;
}
interface Dependencies {
 adapter?:(key:string)=>ProviderAdapter;
 validate?:typeof validateGeneration;
 preview?:typeof showGenerationPreview;
}
export function mountGenerationPanel(host:HTMLElement,bridge:GenerationHost,language:()=> 'de'|'en',storage:Pick<Storage,'getItem'>,deps:Dependencies={}){
 const panel=document.createElement('section');panel.className='generation-panel';panel.dataset.userText='';
 const heading=document.createElement('h2'),destination=document.createElement('p'),notice=document.createElement('p'),label=document.createElement('label'),file=document.createElement('input'),chosen=document.createElement('p'),start=document.createElement('button'),cancel=document.createElement('button'),discard=document.createElement('button'),apply=document.createElement('button'),status=document.createElement('p'),preview=document.createElement('div');
 file.type='file';file.accept='image/png,image/jpeg';file.id='generation-image';label.htmlFor=file.id;
 start.id='generation-start';cancel.id='generation-cancel';discard.id='generation-discard';apply.id='generation-apply';
 for(const button of [start,cancel,discard,apply])button.type='button';
 status.setAttribute('role','status');preview.className='generation-preview';
 panel.append(heading,destination,notice,label,file,chosen,start,cancel,discard,status,preview,apply);host.append(panel);
 let source:File|undefined,job:ProviderJob|undefined,sequence=0,controller:AbortController|undefined,disposePreview:(()=>void)|undefined,pending=false,disposed=false;
 const t=(de:string,en:string)=>language()==='de'?de:en;
 const matches=(target:ProjectRevision)=>{const now=bridge.target();return !!now&&target.session===now.session&&target.revision===now.revision;};
 function clear(){sequence++;job?.cancel();if(job?.snapshot.status==='preview'||job?.snapshot.status==='stale')job.discard();job=undefined;controller?.abort();controller=undefined;disposePreview?.();disposePreview=undefined;preview.replaceChildren();preview.hidden=true;pending=false;apply.hidden=true;cancel.disabled=true;discard.disabled=true;file.disabled=false;}
 function labels(){heading.textContent=t('Bild → 3D-Entwurf','Image → 3D draft');label.textContent=t('PNG/JPEG auswählen oder hier ablegen','Choose or drop a PNG/JPEG here');start.textContent=t('3D-Entwurf erzeugen','Generate 3D draft');cancel.textContent=t('Abbrechen','Cancel');discard.textContent=t('Ergebnis verwerfen','Discard result');apply.textContent=t('Als neuen Avatar laden','Load as new avatar');notice.textContent=t('Sendet das ausgewählte Bild an den angezeigten lokalen TripoSR-Dienst. Ein Entwurf ohne zugesichertes Skelett; keine Promptsteuerung. Das aktuelle Modell bleibt bis zur Übernahme erhalten. Modellwechsel ist nicht über Studio-Undo rückgängig machbar; bestehendes Projekt vorher speichern. Kein automatischer Anbieterwechsel.','Sends the selected image to the configured local TripoSR service. A draft without a guaranteed skeleton; no prompt control. Your current model remains until acceptance. Model replacement is not part of Studio Undo; save your project first. No automatic provider fallback.');}
 function refresh(){
  labels();const config=readProviderConfig(storage),profile=config.config.profiles.find(p=>p.id===config.config.assignments.generation);
  const supported=profile?.adapter==='custom-generation'&&profile.model==='triposr';
  destination.textContent=profile?`${profile.name} · ${profile.model} · ${profile.endpoint}`:t('Optionen: ein Profil „custom-generation“ mit Modell „triposr“ der Rolle 3D-Generator zuordnen.','Options: assign a custom-generation profile with model triposr to the 3D generator role.');
  if(profile&&!supported)destination.textContent+=' · '+t('Für dieses Profil fehlt noch die Generierungsanbindung.','Generation integration for this profile is not available yet.');
  start.disabled=pending||!source||!supported||!bridge.target();chosen.textContent=source?`${source.name} · ${(source.size/1024/1024).toFixed(2)} MiB`:t('Noch kein Bild ausgewählt.','No image selected.');
  if(job?.snapshot.status==='preview')apply.disabled=pending||!matches(job.snapshot.target);
 }
 function select(value:File){clear();source=undefined;status.textContent='';if(!['image/png','image/jpeg'].includes(value.type)||!value.size||value.size>20*1024*1024){status.textContent=t('PNG/JPEG bis 20 MiB erforderlich.','PNG/JPEG up to 20 MiB required.');}else source=value;refresh();}
 file.onchange=()=>{const value=file.files?.[0];if(value)select(value);file.value='';};
 panel.ondragover=event=>{event.preventDefault();event.stopPropagation();};panel.ondrop=event=>{event.preventDefault();event.stopPropagation();document.body.classList.remove('dragging');const value=event.dataTransfer?.files[0];if(value)select(value);};
 start.onclick=async()=>{
  if(pending||!source)return;
  const config=readProviderConfig(storage).config,profile=config.profiles.find(p=>p.id===config.assignments.generation),target=bridge.target();
  if(!profile||!target||profile.adapter!=='custom-generation'||profile.model!=='triposr')return;
  clear();const current=sequence,selected=source;pending=true;controller=new AbortController();const signal=controller.signal;
  const token=getProviderKey(profile);const registry=new ProviderRegistry();registry.register(deps.adapter?.(token)??createLocalGenerationAdapter(()=>token));
  file.disabled=true;cancel.disabled=false;refresh();status.textContent=t('Bild wird vorbereitet …','Preparing image …');
  try{
   const bytes=new Uint8Array(await selected.arrayBuffer());if(current!==sequence)return;
   const task=job=new ProviderJob(registry,{config,role:'generation',input:{prompt:'Image reconstruction',source:{mediaType:selected.type as 'image/png'|'image/jpeg',bytes}},target,timeoutMs:3600000,validate:deps.validate??validateGeneration});
   task.subscribe(state=>{if(current===sequence){const phases:Record<string,string>={checking:'Verbindung prüfen',queued:'Vorbereiten',running:'Generierung läuft',validating:'Modell prüfen',preview:'Vorschau vorbereiten',failed:'Fehlgeschlagen',cancelled:'Abgebrochen','timed-out':'Zeitlimit erreicht'};status.textContent=t('Auftrag: '+(phases[state.status]??state.status),'Job: '+state.status);}});task.start();
   const result=await task.done;if(current!==sequence)return;
   if(result.status!=='preview')throw new Error(result.status);
   const output=task.preview();if(output.kind!=='model')throw new Error('model-required');
   preview.hidden=false;const cleanup=await (deps.preview??showGenerationPreview)(preview,output.bytes,signal);
   if(current!==sequence){cleanup();return;}disposePreview=cleanup;apply.hidden=false;discard.disabled=false;
   status.textContent=matches(target)?t('Entwurf prüfen: drehen, zoomen, dann ausdrücklich übernehmen. Rigging ist noch ausstehend.','Review the draft: rotate, zoom, then explicitly accept. Rigging remains pending.'):t('Projekt wurde geändert. Ergebnis wird nicht übernommen; neu generieren.','Project changed. Result cannot be applied; generate again.');
  }catch{if(current===sequence){job?.cancel();disposePreview?.();disposePreview=undefined;preview.hidden=true;status.textContent=t('Generierung oder Vorschau fehlgeschlagen. Dienst, Token, Bild und Laufzeit prüfen; vorhandenes Modell bleibt erhalten.','Generation or preview failed. Check service, token, image and runtime; current model is preserved.');}}
  finally{if(current===sequence){pending=false;cancel.disabled=true;file.disabled=false;refresh();}}
 };
 cancel.onclick=()=>{clear();status.textContent=t('Lokal abgebrochen; ein vollständiger Stopp des Dienstes ist nicht bestätigt.','Cancelled locally; complete service shutdown is not confirmed.');refresh();};
 discard.onclick=()=>{clear();status.textContent=t('Entwurf verworfen.','Draft discarded.');refresh();};
 apply.onclick=async()=>{
  if(pending||job?.snapshot.status!=='preview')return;const target=job.snapshot.target;
  if(!matches(target)){apply.disabled=true;status.textContent=t('Projekt geändert: Übernahme gesperrt.','Project changed: import blocked.');return;}
  const output=job.preview();if(output.kind!=='model')return;const current=sequence;pending=true;apply.disabled=true;start.disabled=true;
  try{const accepted=await bridge.adopt(output.bytes,target,()=>!disposed&&sequence===current);if(current!==sequence)return;if(accepted){clear();status.textContent=t('Neuer Avatar geladen. Rigging und visuelle Qualitätsprüfung bleiben erforderlich.','New avatar loaded. Rigging and visual quality review are still required.');}else status.textContent=t('Nicht übernommen: abgebrochen oder Projekt inzwischen geändert.','Not applied: cancelled or project changed.');}
  catch{if(current===sequence)status.textContent=t('Übernahme fehlgeschlagen.','Import failed.');}
  finally{if(current===sequence)pending=false;refresh();}
 };
 const reset=()=>{clear();status.textContent='';refresh();};
 const events=['pakachi-options','pakachi-providers','pakachi-provider-keys','pakachi-vault-lock','storage','pagehide'];events.forEach(event=>window.addEventListener(event,reset));window.addEventListener('pakachi-sm:change',refresh);clear();refresh();
 return {select,dispose(){disposed=true;clear();events.forEach(event=>window.removeEventListener(event,reset));window.removeEventListener('pakachi-sm:change',refresh);panel.remove();}};
}
