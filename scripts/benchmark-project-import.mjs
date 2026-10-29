/** CPU import diagnostic. Each measurement runs in a fresh Node process. */
import {readFile,stat,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir,cpus} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel,modelBounds} from '../src/viewer.ts';
import {parseProject} from '../src/studio-data.ts';
import {decodeModel} from '../src/studio-editor.ts';
import {StudioRig} from '../src/studio-rig.ts';
if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event{constructor(type,options={}){super(type);Object.assign(this,options);}};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const round=n=>Math.round(n*100)/100;
function normalizedRoot(root){
 // Same parent normalization as Viewer.load, without constructing a renderer.
 const bounds=modelBounds(root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),holder=new T.Group();
 const scale=2.4/Math.max(size.x,size.y,size.z);holder.scale.setScalar(scale);holder.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);holder.add(root);holder.updateMatrixWorld(true);
}
async function measure(path){
 let scene,rig;const stages={};globalThis.gc?.();const before=process.memoryUsage(),start=performance.now();
 const step=async(name,fn)=>{const begin=performance.now(),value=await fn();stages[name]=round(performance.now()-begin);return value;};
 try{
  const bytes=await step('readMs',async()=>{if((await stat(path)).size>80*1024*1024)throw Error('Project exceeds 80 MiB');const data=await readFile(path);if(data.length>80*1024*1024)throw Error('Project exceeds 80 MiB');return data;});
  const raw=await step('jsonMs',()=>JSON.parse(bytes.toString('utf8')));
  const project=await step('validateMs',()=>parseProject(raw));
  const buffer=await step('decodeMs',()=>decodeModel(project.model));if(buffer.byteLength>50*1024*1024)throw Error('Model exceeds 50 MiB');
  const model=await step('modelParseMs',()=>{
   const view=new DataView(buffer);let json;
   if(buffer.byteLength>=20&&view.getUint32(0,true)===0x46546c67){const length=view.getUint32(12,true);if(view.getUint32(16,true)!==0x4e4f534a||20+length>buffer.byteLength)throw Error('Invalid GLB JSON chunk');json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,length)));}
   else json=JSON.parse(new TextDecoder().decode(buffer));
   if(json.images?.length)throw Error('Image textures require browser decoding; this CPU benchmark only supports models without images');
   return parseModel(buffer);
  });scene=model.scene;
  await step('normalizeMs',()=>normalizedRoot(scene));
  rig=await step('rigBuildReplayMs',()=>new StudioRig(scene,project.studio));
  if(project.studio.draft)await step('draftMs',()=>rig.apply(project.studio.draft));
  const totalMs=round(performance.now()-start),memory=process.memoryUsage();
  const skin=createHash('sha256');let vertices=0,triangles=0,meshes=0;
  scene.traverse(node=>{if(!node.isMesh)return;meshes++;const geometry=node.geometry,position=geometry.getAttribute('position');vertices+=position?.count??0;triangles+=(geometry.index?.count??position?.count??0)/3;
   for(const key of ['skinIndex','skinWeight']){const a=geometry.getAttribute(key);if(a)for(let i=0;i<a.count;i++)skin.update(JSON.stringify([a.getX(i),a.getY(i),a.getZ(i),a.getW(i)]));}
  });
  return {projectSha256:hash(bytes),modelBytes:buffer.byteLength,projectBytes:bytes.length,transfers:project.studio.weightTransfers?.length??0,meshes,vertices,triangles,bones:rig.bones.length,skinSha256:skin.digest('hex'),stages,totalMs,heapDeltaMiB:round((memory.heapUsed-before.heapUsed)/1048576),rssMiB:round(memory.rss/1048576)};
 }finally{rig?.dispose();if(scene)disposeModel(scene);}
}
async function fixture(path,count){
 const bytes=await readFile(new URL('../public/model-zoo/mika/model.gltf',import.meta.url));let scene,rig;
 try{scene=(await parseModel(Uint8Array.from(bytes).buffer)).scene;normalizedRoot(scene);rig=new StudioRig(scene);
  const from=rig.data.points.find(p=>p.name==='Root'),to=rig.data.points.find(p=>p.name==='Neck');if(!from||!to)throw Error('Missing benchmark bones');
  rig.data.weightTransfers=Array.from({length:count},()=>({from:from.bone,to:to.bone,amount:.001,after:0,region:{center:[...from.rest],radius:2}}));
  await writeFile(path,JSON.stringify({format:'pakachi-studio',version:1,model:bytes.toString('base64'),avatar:{id:'benchmark-mika',name:'Benchmark Mika',description:'CPU import benchmark fixture',moves:[]},studio:rig.data}));
 }finally{rig?.dispose();if(scene)disposeModel(scene);}
}
async function main(){
 const args=process.argv.slice(2);
 if(args[0]==='--case'&&args.length===2){console.log(JSON.stringify(await measure(args[1])));return;}
 if(args.length===1&&args[0]==='--help'){console.log('Usage: npm run benchmark:import -- [--project file.pakachi.json] [--runs 1..10] [--transfers 0..1024]\nWithout --project: generated Mika fixture (default 256 transfers). --transfers only applies to the fixture. JSON report on stdout; source files remain unchanged. Models with image textures are rejected because this Node benchmark cannot reproduce browser decoding.');return;}
 let project,runs=3,transfers=256,customTransfers=false;const seen=new Set();
 for(let i=0;i<args.length;i+=2){const key=args[i],value=args[i+1];if(!['--project','--runs','--transfers'].includes(key)||seen.has(key)||value===undefined)throw Error('Invalid arguments; use --help');seen.add(key);
  if(key==='--project')project=resolve(value);else{if(!/^\d+$/.test(value))throw Error('Expected integer');const n=Number(value);if(key==='--runs'){if(n<1||n>10)throw Error('Runs must be 1..10');runs=n;}else{if(n>1024)throw Error('Transfers must be 0..1024');transfers=n;customTransfers=true;}}
 }
 if(project&&customTransfers)throw Error('--transfers cannot modify a supplied project');
 let temp;
 try{
  if(!project){temp=await mkdtemp(join(tmpdir(),'pakachi-import-'));project=join(temp,'fixture.pakachi.json');await fixture(project,transfers);}
  const samples=[];
  for(let i=0;i<runs;i++){
   const child=spawnSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--case',project],{encoding:'utf8',timeout:300000,maxBuffer:1024*1024});
   if(child.error||child.status!==0)throw Error(child.error?.message||child.stderr||'Measurement failed');samples.push(JSON.parse(child.stdout));
  }
  if(samples.some(s=>s.projectSha256!==samples[0].projectSha256||s.skinSha256!==samples[0].skinSha256))throw Error('Input or reconstructed skin changed between measurements');
  const sorted=samples.map(s=>s.totalMs).sort((a,b)=>a-b),mid=Math.floor(sorted.length/2),median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
  console.log(JSON.stringify({version:1,measuredAt:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,cpu:cpus()[0]?.model,runs,fixture:temp?'mika':'supplied-project',scope:'CPU import stages in fresh processes; startup, fixture creation, checksum calculation, disposal, UI, WebGL, image decoding and browser storage excluded. OS file cache may be warm. Heap delta is not peak or retained memory. No pass/fail performance threshold.',medianTotalMs:round(median),samples},null,2));
 }finally{if(temp)await rm(temp,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
