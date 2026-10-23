import {IndexedDBZoo,parseZooEntries} from './local-zoo.ts';
import type {LocalZoo,ZooEntry} from './local-zoo.ts';
import type {StudioProject} from './studio-data.ts';
import type {ProjectRevision} from './ai-jobs.ts';
interface Host {
 target:()=>ProjectRevision|null;
 ready:()=>boolean;canSave:()=>boolean;
 capture:()=>StudioProject|null;
 load:(project:StudioProject,valid:()=>boolean,entry:ZooEntry)=>Promise<boolean>;
 entriesChanged?:(entries:ZooEntry[])=>void;
 pendingChanged?:(pending:boolean)=>void;
}
export function mountLocalZoo(host:HTMLElement,bridge:Host,language:()=> 'de'|'en',store:LocalZoo=new IndexedDBZoo()){
 const section=document.createElement('section');section.className='local-zoo';section.dataset.userText='';
 const heading=document.createElement('h2'),note=document.createElement('p'),nameLabel=document.createElement('label'),name=document.createElement('input'),save=document.createElement('button'),listLabel=document.createElement('label'),list=document.createElement('select'),load=document.createElement('button'),remove=document.createElement('button'),refresh=document.createElement('button'),status=document.createElement('p');
 name.id='zoo-name';name.maxLength=100;nameLabel.htmlFor=name.id;list.id='zoo-list';listLabel.htmlFor=list.id;
 for(const [button,id] of [[save,'save'],[load,'load'],[remove,'remove'],[refresh,'refresh']] as const){button.type='button';button.id='zoo-'+id;}
 status.setAttribute('role','status');section.append(heading,note,nameLabel,name,save,listLabel,list,load,remove,refresh,status);host.append(section);
 let entries:ZooEntry[]=[],pending=false,disposed=false,generation=0,refreshQueued=false;
 let channel:BroadcastChannel|null=null;try{if(typeof window.BroadcastChannel==='function')channel=new window.BroadcastChannel('pakachi-local-zoo-v1');}catch{/* Focus/manual refresh remains available when messaging is unavailable. */}
 const notify=()=>{try{channel?.postMessage('changed');}catch{/* A committed save must not become a reported failure. */}};
 const reload=()=>{if(disposed)return;if(pending)refreshQueued=true;else void perform(update);};
 if(channel)channel.onmessage=event=>{if(event.data==='changed')reload();};
 window.addEventListener('focus',reload);
 const t=(de:string,en:string)=>language()==='de'?de:en;
 const valid=(target:ProjectRevision)=>{const now=bridge.target();return !!now&&now.session===target.session&&now.revision===target.revision;};
 function render(){
  heading.textContent=t('Eigene Avatare · lokal','My avatars · local');note.textContent=t('In diesem Browser gespeichert, auch nach F5. Maximal 50 Einträge, je 80 MiB; Browserkontingent kann kleiner sein. Browserdaten löschen entfernt die Sammlung. Projekte zusätzlich als Datei sichern.','Stored in this browser, including after reload. Up to 50 entries, 80 MiB each; browser quota may be lower. Clearing browser data removes the collection. Also save projects as files.');
  nameLabel.textContent=t('Name für neue Kopie','Name for new copy');listLabel.textContent=t('Gespeicherte Avatare','Saved avatars');save.textContent=t('Kopie im Model Zoo speichern','Save copy in Model Zoo');load.textContent=t('Avatar laden','Load avatar');remove.textContent=t('Gespeicherte Kopie löschen','Delete saved copy');refresh.textContent=t('Liste aktualisieren','Refresh list');
  save.disabled=pending||!bridge.ready()||!bridge.canSave()||!bridge.target()||!name.value.trim();load.disabled=pending||!bridge.ready()||!bridge.target()||!list.value;remove.disabled=pending||!list.value;refresh.disabled=pending;name.disabled=pending;list.disabled=pending||!entries.length;
 }
 async function update(){const selected=list.value;const next=parseZooEntries(await store.list());if(disposed)return;entries=next;list.replaceChildren();for(const entry of entries){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.name+' · '+(entry.bytes/1024/1024).toFixed(2)+' MiB';list.append(option);}if(entries.some(e=>e.id===selected))list.value=selected;bridge.entriesChanged?.(structuredClone(entries));render();}
 async function perform(action:()=>Promise<void>){if(pending||disposed)return;pending=true;bridge.pendingChanged?.(true);status.textContent='';render();try{await action();}catch{if(!disposed)status.textContent=t('Nicht abgeschlossen. Browserspeicher, Platz und Projekt prüfen. Vorhandenen Avatar als Datei sichern.','Not completed. Check browser storage, space and project. Save your current avatar as a file.');}finally{pending=false;if(!disposed){bridge.pendingChanged?.(false);render();if(refreshQueued){refreshQueued=false;void perform(update);}}}}
 save.onclick=()=>void perform(async()=>{if(!bridge.ready()||!bridge.canSave())return;const project=bridge.capture();if(!project)throw Error('no-project');const entry=await store.add(name.value,project);notify();if(disposed)return;await update();if(disposed)return;list.value=entry.id;status.textContent=t('Neue Kopie gespeichert. Weitere Änderungen werden nicht automatisch übernommen.','New copy saved. Further changes are not saved automatically.');});
 load.onclick=()=>void perform(async()=>{if(!bridge.ready())return;const target=bridge.target(),id=list.value,token=generation;const entry=entries.find(e=>e.id===id);if(!target||!entry)return;const project=await store.read(id);const guard=()=>!disposed&&token===generation&&valid(target);if(!guard()){status.textContent=t('Projekt geändert; Laden verworfen.','Project changed; load discarded.');return;}const accepted=await bridge.load(project,guard,{...entry});if(!disposed)status.textContent=accepted?t('Avatar mit Studio-Daten geladen.','Avatar and Studio data loaded.'):t('Nicht geladen; aktuelles Projekt bleibt erhalten.','Not loaded; current project is preserved.');});
 remove.onclick=()=>{const entry=entries.find(e=>e.id===list.value);if(!entry||pending||!window.confirm(t('Gespeicherte Kopie löschen: ','Delete saved copy: ')+entry.name+'?'))return;void perform(async()=>{await store.remove(entry.id);notify();if(disposed)return;await update();status.textContent=t('Gespeicherte Kopie gelöscht. Der geladene Avatar bleibt erhalten.','Saved copy deleted. The loaded avatar is preserved.');});};
 refresh.onclick=()=>void perform(update);name.oninput=render;list.onchange=render;
 const changed=()=>{render();};window.addEventListener('pakachi-sm:change',changed);window.addEventListener('pakachi-options',render);
 void perform(update);
 return {load(id:string){if(disposed||pending||!entries.some(e=>e.id===id)||!bridge.ready())return false;list.value=id;render();load.click();return true;},dispose(){disposed=true;generation++;channel?.close();window.removeEventListener('focus',reload);window.removeEventListener('pakachi-sm:change',changed);window.removeEventListener('pakachi-options',render);section.remove();}};
}
