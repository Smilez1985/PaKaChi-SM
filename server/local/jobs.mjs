import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {join,extname} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {z} from 'zod';
import {launchProcess,workerEnvironment} from './process.mjs';
import {generate,inspectGenerated} from '../../scripts/generate-model.mjs';

export const jobSchema=z.object({kind:z.enum(['blender','python','image-to-3d','inspect-model','acp']),prompt:z.string().min(1).max(20000).optional(),script:z.string().uuid().optional(),inputs:z.array(z.string().uuid()).max(16).default([]),image:z.string().uuid().optional(),resolution:z.number().int().min(64).max(512).default(256),requestId:z.string().uuid().optional()}).strict();
export async function createJobs(settings,assets,{launch=launchProcess,generator=generate,acp,acpConfig=()=>({})}={}){
 const root=join(settings.root,'jobs');await mkdir(root,{recursive:true,mode:0o700});const records=new Map(),active=new Map(),requests=new Map();let startQueue=Promise.resolve();
 for(const name of (await readdir(root)).filter(n=>/^[a-f0-9-]{36}$/.test(n)).slice(-100)){
  try{const r=JSON.parse(await readFile(join(root,name,'job.json'),'utf8'));if(['running','queued'].includes(r.status)){r.status='interrupted';r.error='Anwendung wurde beendet.';}records.set(name,r);}catch{/* Incomplete staging is not advertised as a result. */}
 }
 const persist=async r=>writeFile(join(root,r.id,'job.json'),JSON.stringify(r,null,2)+'\n',{mode:0o600});
 const summary=r=>({...r,log:r.log.slice(-16000)});
 async function start(raw,{parent=null}={}){
  const args=jobSchema.parse(raw),cfg=settings.value;if(!cfg.enabled)throw Error('Lokale Werkzeuge sind ausgeschaltet.');
  const fingerprint=createHash('sha256').update(JSON.stringify({...args,requestId:undefined})).digest('hex');
  if(args.requestId&&requests.has(args.requestId)){const previous=requests.get(args.requestId);if(previous.fingerprint!==fingerprint)throw Error('Auftragskennung bereits anders verwendet.');return summary(records.get(previous.id));}
  if(args.kind==='acp'?[...active.values()].some(a=>a.kind==='acp'):[...active.values()].some(a=>a.kind!=='acp'))throw Error('Ein lokaler Auftrag dieser Art läuft bereits.');
  if(parent&&!active.has(parent))throw Error('Übergeordneter ACP-Auftrag ist nicht aktiv.');
  if(['blender','python','acp'].includes(args.kind)&&!cfg.allowScripts)throw Error('Lokale Skriptausführung ist nicht freigegeben.');
  if(args.kind==='acp'&&(!cfg.acpCommand||!args.prompt||!acp))throw Error('ACP-Agent und Auftrag fehlen.');
  if(['blender','python'].includes(args.kind)&&(!args.script||extname(await assets.file(args.script))!=='.py'))throw Error('Python-Skript als Eingabedatei erforderlich.');
  if(['image-to-3d','inspect-model'].includes(args.kind)&&!args.image)throw Error('Eingabedatei fehlt.');
  if(!settings.value.enabled||(['blender','python','acp'].includes(args.kind)&&!settings.value.allowScripts))throw Error('Lokale Ausführung wurde inzwischen ausgeschaltet.');
  const id=randomUUID(),directory=join(root,id),output=join(directory,'output');await mkdir(output,{recursive:true,mode:0o700});
  const record={id,kind:args.kind,status:'queued',started:new Date().toISOString(),finished:null,log:'',outputs:[],error:null};records.set(id,record);
  const controller=new AbortController();const state={controller,process:null,kind:args.kind,parent};active.set(id,state);if(args.requestId)requests.set(args.requestId,{id,fingerprint});await persist(record);
  const log=text=>{record.log=(record.log+text).slice(-262144);};
  const run=async()=>{
   try{
    controller.signal.throwIfAborted();record.status='running';await persist(record);const inputs=await assets.copyInputs([...new Set([...args.inputs,...(args.image?[args.image]:[])])],directory);controller.signal.throwIfAborted();
    if(args.kind==='acp'){
     const config=acpConfig(id);record.agent=await acp.run({command:cfg.acpCommand,args:cfg.acpArgs,env:config.env??{},cwd:directory,prompt:args.prompt,mcp:config.mcp,signal:controller.signal,timeout:cfg.jobTimeout*1000,onData:log,secrets:config.secrets??[]});
    }else if(['blender','python'].includes(args.kind)){
     const script=join(directory,'script.py');await writeFile(script,await readFile(await assets.file(args.script)),{mode:0o600});
     controller.signal.throwIfAborted();
     const executable=args.kind==='blender'?cfg.blender:cfg.python;if(!executable)throw Error('Programm fehlt.');
     const processArgs=args.kind==='blender'?['--background','--factory-startup','--python-exit-code','1','--python',script]:['-u',script];
     controller.signal.throwIfAborted();
     state.process=launch(executable,processArgs,{cwd:directory,timeout:cfg.jobTimeout*1000,env:{PAKACHI_JOB_OUTPUT:output,PAKACHI_JOB_INPUTS:JSON.stringify(inputs)},onData:log});
     const result=await state.process.done;if(result.stopped||controller.signal.aborted)throw Error('Auftrag abgebrochen oder Zeitlimit erreicht.');if(result.code!==0)throw Error('Programm fehlgeschlagen; Auftragsprotokoll prüfen.');
     record.outputs=await assets.collect(output);
    }else if(args.kind==='inspect-model'){
     record.inspection=await inspectGenerated(inputs[args.image]);log(JSON.stringify(record.inspection)+'\n');
    }else{
     if(!cfg.triposrRepo)throw Error('Lokaler TripoSR-Ordner ist nicht eingerichtet.');
     const result=await generator({python:cfg.python,repo:cfg.triposrRepo,image:inputs[args.image],output,device:cfg.device,resolution:args.resolution,timeout:cfg.jobTimeout,signal:controller.signal,env:workerEnvironment()});
     record.generation=result.report;try{log(await readFile(join(result.job,'generator.log'),'utf8'));}catch{/* Environment checks can fail before a log exists. */}
     if(result.report.status!=='generated-unreviewed')throw Error('3D-Generierung fehlgeschlagen; lokales Generatorprotokoll prüfen.');
     record.outputs=await assets.collect(join(result.job,'result'));
    }
    controller.signal.throwIfAborted();record.status='completed';
   }catch(error){record.status=controller.signal.aborted?'cancelled':'failed';record.error=error.message;}
   finally{record.finished=new Date().toISOString();try{await persist(record);}finally{active.delete(id);}}
  };
  state.done=new Promise(resolve=>setImmediate(()=>{void run().finally(resolve).catch(()=>{});}));return summary(record);
 }
 return {start(raw,options){const result=startQueue.then(()=>start(raw,options));startQueue=result.catch(()=>{});return result;},list:()=>[...records.values()].slice(-100).map(summary),get(id){const r=records.get(id);if(!r)throw Error('Unbekannter Auftrag.');return summary(r);},
  async cancel(id){const a=active.get(id);if(!a)throw Error('Auftrag läuft nicht.');for(const child of active.values())if(child.parent===id){child.controller.abort();child.process?.stop();}a.controller.abort();a.process?.stop();return this.get(id);},
  async close(){for(const a of active.values()){a.controller.abort();a.process?.stop();}await Promise.allSettled([...active.values()].map(a=>a.done));},
 };
}
