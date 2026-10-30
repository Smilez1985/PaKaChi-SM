/** Isolated CPU display-transition benchmark; not a rendered frame-rate measurement. */
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {cpus} from 'node:os';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {PlaybackTransition} from '../src/playback-transition.ts';
if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event{constructor(type,options={}){super(type);Object.assign(this,options);}};
const round=n=>Math.round(n*100)/100;
async function run(mode){
 const bytes=await readFile(new URL('../public/model-zoo/mika/model.gltf',import.meta.url));const {scene}=await parseModel(Uint8Array.from(bytes).buffer);let rig,fade;
 try{
  rig=new StudioRig(scene);fade=new PlaybackTransition(scene);
  const meshes=rig.surfaces.map(s=>s.mesh),selected=mode==='all'?meshes:mode==='one'?meshes.slice(0,1):[];
  globalThis.gc?.();const before=process.memoryUsage();const begin=performance.now();fade.begin(selected);const beginMs=performance.now()-begin;
  for(const mesh of selected){const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+.03*(i%7)/7);p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
  const frames=[],checksum=createHash('sha256');let snapshotMemory;
  for(let frame=0;frame<12;frame++){
   const start=performance.now();fade.beforeFrame();fade.afterFrame(.016);frames.push(performance.now()-start);
   // Verify displayed geometry separately from measured CPU work.
   for(const mesh of selected)for(const key of ['position','normal']){const a=mesh.geometry.getAttribute(key);if(a)checksum.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}
   if(frame===0){globalThis.gc?.();snapshotMemory=process.memoryUsage();}
  }
  if(fade.active)throw Error('Transition did not finish');
  const sorted=[...frames].sort((a,b)=>a-b);
  return {mode,selectedMeshes:selected.length,selectedVertices:selected.reduce((n,m)=>n+m.geometry.getAttribute('position').count,0),beginMs:round(beginMs),frameMs:frames.map(round),medianFrameMs:round((sorted[5]+sorted[6])/2),maxFrameMs:round(sorted.at(-1)),snapshotArrayBuffersMiB:round((snapshotMemory.arrayBuffers-before.arrayBuffers)/1048576),snapshotHeapMiB:round((snapshotMemory.heapUsed-before.heapUsed)/1048576),displaySha256:checksum.digest('hex')};
 }finally{fade?.cancel();rig?.dispose();disposeModel(scene);}
}
if(process.argv[2]==='--case'){
 const mode=process.argv[3];if(!['none','one','all'].includes(mode))throw Error('Invalid case');console.log(JSON.stringify(await run(mode)));
}else{
 if(process.argv.length>2)throw Error('No arguments expected');
 const samples=[];
 for(const mode of ['none','one','all'])for(let repeat=0;repeat<3;repeat++){
  const child=spawnSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--case',mode],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
  if(child.error||child.status!==0)throw Error(child.error?.message||child.stderr||'Benchmark failed');samples.push(JSON.parse(child.stdout));
 }
 for(const mode of ['none','one','all'])if(new Set(samples.filter(s=>s.mode===mode).map(s=>s.displaySha256)).size!==1)throw Error('Displayed geometry is not repeatable');
 console.log(JSON.stringify({measuredAt:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,cpu:cpus()[0]?.model,modelSha256:createHash('sha256').update(await readFile(new URL('../public/model-zoo/mika/model.gltf',import.meta.url))).digest('hex'),scope:'Bundled Mika; three fresh processes per affected-mesh count. 12 display frames at 16 ms animation delta. Timings include restore/capture/interpolation/normals/bounds; exclude model/rig load, synthetic target preparation, checksum, GC, animator/IK, WebGL and UI. Memory measured after explicit GC on the first displayed frame relative to loaded rig; not peak memory. No FPS guarantee.',samples},null,2));
}
