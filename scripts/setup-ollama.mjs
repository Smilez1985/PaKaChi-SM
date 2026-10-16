import {createHash,randomUUID} from 'node:crypto';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {CURATED_MODELS,GiB,probeHardware,planModel} from './ollama-hardware.mjs';
const LOCAL='http://127.0.0.1:11434';
async function boundedText(response,max=2*1024*1024){
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 if(!response.body)throw new Error('Leere Antwort.');
 let text='',bytes=0;const decoder=new TextDecoder(),reader=response.body.getReader();
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>max)throw new Error('Antwort zu groß.');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function registryURL(tag){
 if(!/^(?:[a-zA-Z0-9][a-zA-Z0-9_.-]*\/)?[a-zA-Z0-9][a-zA-Z0-9_.-]*:[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(tag)||/cloud/i.test(tag))throw new Error('Expliziten lokalen Ollama-Tag angeben, z. B. name:quantisierung; keine Cloud-Tags/URLs.');
 const colon=tag.lastIndexOf(':'),name=tag.slice(0,colon),version=tag.slice(colon+1);
 return `https://registry.ollama.ai/v2/${name.includes('/')?name:'library/'+name}/manifests/${version}`;
}
/** Fail closed if registry metadata is unavailable or its format changes. No weight download. */
export async function manifestInfo(tag,fetcher=fetch){
 const text=await boundedText(await fetcher(registryURL(tag),{headers:{Accept:'application/vnd.docker.distribution.manifest.v2+json'},redirect:'error',signal:AbortSignal.timeout(15000)}));
 const data=JSON.parse(text);if(data.schemaVersion!==2||!Array.isArray(data.layers)||!data.layers.length||data.layers.length>256)throw new Error('Unbekanntes Modellmanifest.');
 let bytes=0;
 for(const layer of [...data.layers,data.config]){if(!layer||!Number.isSafeInteger(layer.size)||layer.size<0||!/^sha256:[0-9a-f]{64}$/.test(layer.digest))throw new Error('Unvollständige Modellgrößen.');bytes+=layer.size;}
 if(!Number.isSafeInteger(bytes)||bytes<=0)throw new Error('Ungültige Modellgröße.');
 return {bytes,digest:createHash('sha256').update(text).digest('hex')};
}
export async function localJSON(path,body,{fetcher=fetch,timeout=15000}={}){
 const response=await fetcher(LOCAL+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(timeout)});
 return JSON.parse(await boundedText(response));
}
export async function pullModel(tag,{fetcher=fetch,onProgress=()=>{}}={}){
 const response=await fetcher(LOCAL+'/api/pull',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:tag,stream:true}),redirect:'error',signal:AbortSignal.timeout(3600000)});
 if(!response.ok||!response.body)throw new Error('Ollama-Pull fehlgeschlagen.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',success=false;
 function line(text){if(!text.trim())return;const event=JSON.parse(text);if(event.error)throw new Error('Ollama meldet einen Downloadfehler.');if(event.status==='success')success=true;onProgress({status:String(event.status??''),percent:event.total?Math.floor(100*event.completed/event.total):null});}
 try{while(true){const {value,done}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});let index;while((index=pending.indexOf('\n'))!==-1){line(pending.slice(0,index));pending=pending.slice(index+1);}if(pending.length>65536)throw new Error('Ungültige Pull-Antwort.');}pending+=decoder.decode();line(pending);if(!success)throw new Error('Download nicht bestätigt.');}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
const tool={type:'function',function:{name:'get_state',description:'Read the current avatar state.',parameters:{type:'object',properties:{},required:[],additionalProperties:false}}};
export async function validateLocalModel(tag,expectedDigest,{cpu=false,api=localJSON}={}){
 const loaded=await api('/api/tags');const entry=loaded.models?.find(m=>m.name===tag||m.model===tag);
 if(!entry||entry.digest.replace(/^sha256:/,'')!==expectedDigest)throw new Error('Modell-Digest hat sich geändert; neu planen. Kein Modell wird gelöscht.');
 const show=await api('/api/show',{model:tag});if(!show.capabilities?.includes('tools'))throw new Error('Modell meldet keine Werkzeugunterstützung.');
 const cases=[['de','Lies den aktuellen Avatarzustand mit get_state. Rufe genau dieses Werkzeug einmal ohne Argumente auf.'],['en','Read the current avatar state using get_state. Call exactly this tool once with no arguments.']];
 const results=[];
 try{
  for(const [language,prompt] of cases){
   const result=await api('/api/chat',{model:tag,messages:[{role:'user',content:prompt}],tools:[tool],think:false,stream:false,keep_alive:'30s',options:{num_ctx:4096,num_predict:256,temperature:0,...(cpu?{num_gpu:0}:{})}},{timeout:180000});
   const calls=result.message?.tool_calls;
   const passed=result.done===true&&result.done_reason!=='length'&&Array.isArray(calls)&&calls.length===1&&calls[0].function?.name==='get_state'&&calls[0].function.arguments&&typeof calls[0].function.arguments==='object'&&!Array.isArray(calls[0].function.arguments)&&Object.keys(calls[0].function.arguments).length===0;
   results.push({language,passed});
   if(!passed)throw new Error(`Werkzeug-Basistest (${language}) nicht bestanden; keine automatische Freigabe.`);
   const running=await api('/api/ps'),model=running.models?.find(m=>m.digest?.replace(/^sha256:/,'')===expectedDigest);
   if(!model||model.context_length!==4096||!Number.isFinite(model.size)||model.size<=0||!Number.isFinite(model.size_vram))throw new Error('Laufzeitspeicher oder Kontext nicht bestätigt.');
   if(cpu?model.size_vram!==0:model.size_vram<model.size)throw new Error('Gewünschter CPU-/vollständiger GPU-Betrieb nicht bestätigt.');
  }
  return {basicToolTests:results,context:4096,mode:cpu?'cpu':'gpu',vision:'not-tested',complexStudioTasks:'not-tested',quantization:show.details?.quantization_level??'unknown'};
 }finally{await api('/api/generate',{model:tag,keep_alive:0,stream:false},{timeout:15000}).catch(()=>{});}
}
export async function main(args=process.argv.slice(2)){
 const {values}=parseArgs({args,options:{check:{type:'boolean'},cpu:{type:'boolean'},model:{type:'string'},'models-dir':{type:'string'},help:{type:'boolean'}},strict:true});
 if(values.help){console.log('node scripts/setup-ollama.mjs [--check] [--cpu] [--model name:tag] [--models-dir PFAD]\nOhne --check: interaktive Auswahl und ausdrückliche Rückfrage vor Pull und Ladetest. Kein automatischer Download.');return;}
 const cpu=values.cpu===true;let hardware=await probeHardware({modelsDir:values['models-dir']});
 console.log(JSON.stringify({hardware,mode:cpu?'CPU (ausdrücklich)':'GPU',note:'Messung dieses Rechners; nur lokaler Ollama-Dienst auf Port 11434. AMD/Intel/Apple/Multi-GPU derzeit keine automatische GPU-Freigabe.'},null,2));
 const service=await localJSON('/api/version');console.log('Ollama:',service.version);
 const catalog=values.model?[CURATED_MODELS.find(m=>m.tag===values.model)??{tag:values.model,maxWeightGiB:0,runtimeGiB:undefined,quality:'custom-unverified'}]:CURATED_MODELS;
 const entries=[];
 for(const model of catalog){try{const manifest=await manifestInfo(model.tag);if(model.digestPrefix&&!manifest.digest.startsWith(model.digestPrefix))throw new Error('Katalog-Digest geändert; erst erneut kuratieren.');const plan=planModel(hardware,model,manifest.bytes,{cpu});entries.push({model,manifest,plan});console.log(`${entries.length}. ${model.tag}: ${plan.eligible?'Speicher-Vorauswahl bestanden':'NICHT angeboten'} (${(plan.requiredComputeBytes/GiB).toFixed(1)} GiB inkl. Reserve) ${plan.reasons.join(' ')}`);}catch(error){console.log(`${model.tag}: NICHT angeboten (${error.message})`);}}
 if(values.check)return;
 const eligible=entries.filter(e=>e.plan.eligible);if(!eligible.length)throw new Error('Kein Kandidat erfüllt die gemessenen Grenzen. Kein Download.');
 if(!process.stdin.isTTY)throw new Error('Interaktives Terminal erforderlich. --check benötigt keine Eingabe.');
 const terminal=createInterface({input:process.stdin,output:process.stdout});
 try{
  const answer=await terminal.question('Nummer des gewünschten Kandidaten (Enter = abbrechen): ');if(!answer.trim())return;const selected=entries[Number(answer)-1];if(!selected?.plan.eligible)throw new Error('Kein freigegebener Kandidat gewählt.');
  console.log(`Pull: ollama pull ${selected.model.tag}\nDanach zwei lokale Text-/Werkzeug-Basistests mit 4096 Kontext, keine Studio-Änderungen. Keine Qualitätsgarantie für komplexe Aufgaben oder Bilder. Andere Ollama-Aufträge vorher beenden.\nModellordner: ${hardware.modelsDir} (muss zum laufenden Dienst gehören).`);
  if((await terminal.question('Diesen Download und Ladetest jetzt starten? [ja/NEIN] ')).trim().toLowerCase()!=='ja')return;
  hardware=await probeHardware({modelsDir:values['models-dir']});const fresh=await manifestInfo(selected.model.tag);if(fresh.digest!==selected.manifest.digest)throw new Error('Manifest während der Auswahl geändert. Bitte erneut starten.');const plan=planModel(hardware,selected.model,fresh.bytes,{cpu});if(!plan.eligible)throw new Error(plan.reasons.join(' '));
  const running=await localJSON('/api/ps');if(running.models?.length)throw new Error('Andere Modelle sind geladen. Bitte selbst entladen und Einrichtung erneut starten.');
  let previous='';await pullModel(selected.model.tag,{onProgress:p=>{const text=`${p.status} ${Number.isFinite(p.percent)?p.percent+'%':''}`;if(text!==previous){console.log(text);previous=text;}}});
  // Recheck free memory after downloading, without requiring the same free disk space twice.
  const after=await probeHardware({modelsDir:values['models-dir']});const memory=planModel({...after,diskFreeBytes:Number.MAX_SAFE_INTEGER},selected.model,fresh.bytes,{cpu});if(!memory.eligible)throw new Error('Speicher nach Download nicht mehr verfügbar. Kein Ladetest.');
  const validation=await validateLocalModel(selected.model.tag,fresh.digest,{cpu});
  const alias=`pakachi-assistant-${randomUUID().slice(0,8)}`;
  const created=await localJSON('/api/create',{model:alias,from:selected.model.tag,parameters:{num_ctx:4096,...(cpu?{num_gpu:0}:{})},stream:false},{timeout:120000});if(created.status!=='success')throw new Error('Lokales Kontextprofil nicht bestätigt.');
  const directory=resolve('generated','ollama-setup');await mkdir(directory,{recursive:true});const report={createdAt:new Date().toISOString(),serviceVersion:service.version,source:selected.model.tag,digest:fresh.digest,alias,hardware:after,plan,validation,scope:'text-tool-smoke-only; no vision or full studio quality approval'};
  const file=join(directory,alias+'.json');await writeFile(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(`Basistest bestanden. Im Studio: Ollama / ${LOCAL} / Modell ${alias}\nBericht: ${file}\nDer lokale Alias setzt 4096 Kontext; eigene Client-Overrides und parallele Jobs können den Speicherbedarf erhöhen.`);
 }finally{terminal.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error('Einrichtung angehalten:',error.message);process.exitCode=1;});
