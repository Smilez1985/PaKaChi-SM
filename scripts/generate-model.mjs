/** Experimental local TripoSR evaluation. Does not replace or publish an avatar. */
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {Box3,Vector3,Mesh} from 'three';
import {orientTripoSRGlb} from './orient-triposr.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const MAX_BYTES=50*1024*1024;

export function processRun(command,args,{cwd,timeout=30000,onData=()=>{},signal,env}={}) {
 signal?.throwIfAborted();
 return new Promise((accept,reject)=>{
  const child=spawn(command,args,{cwd,env,shell:false,windowsHide:true,detached:process.platform!=='win32'});let stdout='',stderr='',failure,killTimer;
  const kill=signal=>{if(process.platform==='win32'){if(child.pid)spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{shell:false,windowsHide:true,stdio:'ignore'}).on('error',()=>{});}else if(child.pid){try{process.kill(-child.pid,signal);}catch{child.kill(signal);}}};
  const stop=error=>{if(failure)return;failure=error;kill('SIGTERM');killTimer=setTimeout(()=>kill('SIGKILL'),2000);killTimer.unref();};
  const abort=()=>stop(new Error('Generator abgebrochen.'));
  const timer=setTimeout(()=>stop(new Error('Zeitlimit des Generators überschritten.')),timeout);
  const clean=()=>{if(failure)kill('SIGKILL');clearTimeout(timer);clearTimeout(killTimer);signal?.removeEventListener('abort',abort);};
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  child.stdout.on('data',data=>{stdout=(stdout+data).slice(-1000000);onData(data.toString());});
  child.stderr.on('data',data=>{stderr=(stderr+data).slice(-1000000);onData(data.toString());});
  child.on('error',error=>{clean();reject(error);});
  child.on('close',code=>{clean();if(failure)reject(failure);else accept({code,stdout,stderr});});
 });
}
export async function checkEnvironment({python='python',repo,device='cuda:0',signal,env}={}) {
 const blockers=[],result={python,device,backend:'TripoSR',ready:false,blockers};
 if(!['cpu','cuda:0'].includes(device))throw new Error('Gerät muss cpu oder cuda:0 sein.');
 let cwd;
 if(repo){cwd=resolve(repo);try{const source=await readFile(join(cwd,'run.py'));result.backendSourceSha256=sha(source);if(!source.includes('--model-save-format'))blockers.push('TripoSR run.py unterstützt den erwarteten GLB-Aufruf nicht.');}catch{blockers.push('TripoSR run.py fehlt.');cwd=undefined;}}
 else blockers.push('Lokalen TripoSR-Ordner mit --repo angeben.');
 const code=`import importlib.util,json\nr={'missing':[m for m in ['torch','tsr','rembg','xatlas','torchmcubes','PIL'] if importlib.util.find_spec(m) is None]}\nif 'torch' not in r['missing']:\n import torch\n r.update(torch=torch.__version__,cuda=torch.cuda.is_available())\n if r['cuda']: r.update(gpu=torch.cuda.get_device_name(0),vramBytes=torch.cuda.get_device_properties(0).total_memory)\nprint(json.dumps(r))`;
 try{const p=await processRun(python,['-c',code],{cwd,signal,env});if(p.code!==0)throw new Error('Python/PyTorch-Prüfung fehlgeschlagen.');result.runtime=JSON.parse(p.stdout.trim().split('\n').at(-1));if(result.runtime.missing.length)blockers.push('Fehlende Python-Module: '+result.runtime.missing.join(', '));if(device!=='cpu'&&!result.runtime.cuda)blockers.push('CUDA über diesen Python-Interpreter nicht verfügbar. CPU nur ausdrücklich mit --device cpu testen.');}
 catch(error){blockers.push(error.message);}
 signal?.throwIfAborted();result.ready=blockers.length===0;return result;
}

/** Uses the player's actual GLTFLoader, not just the filename or a process exit code. */
export async function inspectGenerated(file) {
 const info=await stat(file);if(info.size>MAX_BYTES||info.size<20)throw new Error('GLB fehlt, ist leer oder überschreitet 50 MiB.');
 const bytes=await readFile(file);if(bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw new Error('Keine vollständige GLB-2-Datei.');
 if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event {constructor(type,init={}){super(type);Object.assign(this,init);}};
 const gltf=await parseModel(Uint8Array.from(bytes).buffer);let vertices=0,triangles=0,meshes=0,bones=0;const bounds=new Box3();
 try{
  gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(node=>{
   if(node.isBone)bones++;
   if(!(node instanceof Mesh))return;meshes++;const attr=node.geometry.getAttribute('position');if(!attr)throw new Error('Mesh ohne Positionen.');vertices+=attr.count;if(vertices>2000000)throw new Error('Mehr als zwei Millionen Vertices; Modell zuerst vereinfachen.');
   triangles+=(node.geometry.index?.count??attr.count)/3;
   for(let i=0;i<attr.count;i++){const p=node.getVertexPosition(i,new Vector3()).applyMatrix4(node.matrixWorld);if(!p.toArray().every(Number.isFinite))throw new Error('Nicht endliche Geometrie.');bounds.expandByPoint(p);}
  });
  if(!meshes||vertices<3||bounds.isEmpty()||bounds.getSize(new Vector3()).length()<1e-8)throw new Error('Keine nutzbare Modellgeometrie.');
  return {bytes:bytes.length,sha256:sha(bytes),vertices,triangles,meshes,bones,clips:gltf.animations.length,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},visualReview:'pending',rigReview:'pending'};
 }finally{disposeModel(gltf.scene);}
}

export async function generate(options,{check=checkEnvironment,launch=processRun}={}) {
 const {python='python',repo,image,output='generated',device='cuda:0',resolution=256,timeout=1800,signal,env}=options;signal?.throwIfAborted();
 if(!repo||!image)throw new Error('--repo und --image sind erforderlich.');
 if(!Number.isInteger(resolution)||resolution<64||resolution>512)throw new Error('Auflösung muss ganzzahlig zwischen 64 und 512 sein.');
 if(!Number.isInteger(timeout)||timeout<1||timeout>86400)throw new Error('Zeitlimit muss zwischen 1 und 86400 Sekunden liegen.');
 const input=resolve(image);if(!['.png','.jpg','.jpeg','.webp'].includes(extname(input).toLowerCase()))throw new Error('PNG, JPEG oder WebP erforderlich.');
 const size=(await stat(input)).size;if(!size||size>20*1024*1024)throw new Error('Bild muss zwischen 1 Byte und 20 MiB groß sein.');
 const inputBytes=await readFile(input),environment=await check({python,repo,device,signal,env});signal?.throwIfAborted();if(!environment.ready)throw new Error(environment.blockers.join('\n'));
 const job=join(resolve(output),new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8));await mkdir(job,{recursive:true});
 const copy=join(job,'source'+extname(input).toLowerCase());await writeFile(copy,inputBytes,{flag:'wx'});
 const args=[join(resolve(repo),'run.py'),copy,'--device',device,'--output-dir',join(job,'result'),'--model-save-format','glb','--mc-resolution',String(resolution)];
 const report={format:'pakachi-generation-report',version:1,backend:'TripoSR',weights:{source:'stabilityai/TripoSR',revision:'not-pinned'},started:new Date().toISOString(),status:'running',input:{name:input.split(/[\\/]/).at(-1),sha256:sha(inputBytes)},environment,command:{python,args},visualReview:'pending',rigReview:'pending',transformationReview:'pending'};
 const manifest=join(job,'report.json'),save=()=>writeFile(manifest,JSON.stringify(report,null,2)+'\n');await save();const start=performance.now();let log='';
 try{
  const p=await launch(python,args,{cwd:resolve(repo),env,timeout:timeout*1000,signal,onData:data=>{log=(log+data).slice(-2000000);}});
  signal?.throwIfAborted();if(p.code!==0)throw new Error(`Generator fehlgeschlagen (Exit ${p.code}); siehe generator.log.`);
  const glb=join(job,'result','0','mesh.glb'),native=await readFile(glb);
  if(native.length>MAX_BYTES)throw new Error('GLB überschreitet 50 MiB.');
  await writeFile(join(job,'result','0','mesh-native.glb'),native,{flag:'wx'});
  await writeFile(glb,orientTripoSRGlb(native));
  report.orientation={source:'Z-up / +X front',target:'Y-up / +Z front',nativeFile:'result/0/mesh-native.glb',nativeSha256:sha(native)};
  report.model=await inspectGenerated(glb);report.model.file='result/0/mesh.glb';report.status='generated-unreviewed';
 }catch(error){report.status='failed';report.error=error.message;}
 finally{report.seconds=(performance.now()-start)/1000;report.finished=new Date().toISOString();await writeFile(join(job,'generator.log'),log);await save();}
 return {job,report};
}

async function main(){
 const {values:v}=parseArgs({options:{check:{type:'boolean'},run:{type:'boolean'},help:{type:'boolean'},python:{type:'string',default:'python'},repo:{type:'string'},image:{type:'string'},output:{type:'string',default:'generated'},device:{type:'string',default:'cuda:0'},resolution:{type:'string',default:'256'},timeout:{type:'string',default:'1800'}}});
 if(v.help){console.log('npm run generate:model -- --check --repo TRIPOSR --python PYTHON\nnpm run generate:model -- --run --repo TRIPOSR --python PYTHON --image BILD.png [--output generated] [--device cpu]');return;}
 if(v.check&&v.run)throw new Error('--check oder --run verwenden.');
 if(!v.run){const report=await checkEnvironment(v);console.log(JSON.stringify(report,null,2));process.exitCode=report.ready?0:2;return;}
 const result=await generate({...v,resolution:Number(v.resolution),timeout:Number(v.timeout)});console.log(JSON.stringify(result,null,2));process.exitCode=result.report.status==='failed'?1:0;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
