/** Read-only original-form audit. Save each completed form so a disconnected
 * session can resume with --replay without repeating the automatic search. */
import assert from 'node:assert/strict';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {findAutomaticSkinCorrection,skinCorrectionOverrides} from '../src/automatic-skin-correction.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {noMeasuredRegression} from '../src/pose-weight-correction.ts';
import {checkSurfaceIntersections} from '../src/surface-intersections.ts';

globalThis.ProgressEvent??=class extends Event{};
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++){
 if(!['--output','--replay','--form'].includes(args[i])||!args[i+1])throw Error('Use --output path, --replay evidence.json, --form humanoid|animal.');
 options[args[i].slice(2)]=args[++i];
}
if(options.form&&!['humanoid','animal'].includes(options.form))throw Error('Unknown form.');
const replay=options.replay?JSON.parse(await readFile(options.replay,'utf8')):null;
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const evidence={format:'pakachi-correction-motion-audit',version:1,softwareVersion:pkg.version,complete:false,
 scope:'65 independent body self-intersection pair/strain/volume samples; no continuous, inter-mesh, adjacent-contact or anatomy clearance.',forms:[]};
const save=async()=>{if(options.output){await writeFile(options.output+'.partial',JSON.stringify(evidence,null,2)+'\n');await rename(options.output+'.partial',options.output);}};
for(const form of options.form?[options.form]:['humanoid','animal']){
 const source=`public/model-zoo/pakachi-rigged/${form}.glb`,bytes=await readFile(source),sha256=createHash('sha256').update(bytes).digest('hex');
 const model=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(model.scene);
 try{
  const neutral=rig.capture(),joint=rig.data.points.find(p=>p.name==='LeftHip'),degrees=form==='humanoid'?90:22.5;
  assert.ok(joint);const at=fraction=>{const values=structuredClone(neutral);values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degrees*fraction*Math.PI/180).toArray();return {id:'hip',name:'Hip',seconds:1,values};};
  rig.data.poses=[{id:'rest',name:'Rest',seconds:1,values:neutral},at(1)];rig.data.moves=[{id:'loop',name:'Hip loop',loop:true,poses:['rest','hip']}];
  const original=JSON.stringify(rig.data),live=rig.capture(),started=Date.now();let proposal;
  if(replay){const entry=replay.forms.find(e=>e.form===form);assert.ok(entry?.proposal,'Replay needs the saved actual proposal.');assert.equal(entry.sha256,sha256);proposal=entry.proposal;}
  else {let last=0;proposal=await findAutomaticSkinCorrection(rig,new AbortController().signal,()=>true,{poseId:'hip',progress:p=>{if(Date.now()-last>15000){console.error(JSON.stringify({form,phase:p.phase,candidates:p.candidates,vertexSamples:p.vertexSamples,elapsedMs:Date.now()-started}));last=Date.now();}}});}
  const entry={form,source,sha256,joint:'LeftHip',axis:'X',degrees,mode:replay?'replay-actual-proposal':'full-automatic-job',proposal,status:proposal?'auditing':'no-candidate',samples:[],regressions:[]};
  evidence.forms.push(entry);await save();
  if(proposal){
   const shape=proposal.kind==='geometry'?proposal.shape:undefined,overrides=shape?undefined:skinCorrectionOverrides(rig,proposal),inspect=createPoseSurfaceChecker(rig);
   const mesh=rig.surfaces.findIndex(s=>s.mesh.name==='PaKaChi_body');assert.ok(mesh>=0);const index=rig.surfaces[mesh].mesh.geometry.index.array;
   for(let step=0;step<=64;step++){
    const pose=at(step/64),bp=new Set(),ap=new Set();
    const before=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,mesh),index,100000,{onIntersection:(a,b)=>bp.add(a+':'+b)});
    const after=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,mesh,overrides,shape),index,100000,{onIntersection:(a,b)=>ap.add(a+':'+b)});
    const sample={step,fraction:step/64,before:before.intersections,after:after.intersections,complete:before.checked&&after.checked,newPairs:[...ap].filter(p=>!bp.has(p)),removedPairs:[...bp].filter(p=>!ap.has(p)).length,surfaceRegression:!noMeasuredRegression(inspect(pose),inspect(pose,overrides,shape))};
    entry.samples.push(sample);if(!sample.complete||sample.newPairs.length||sample.surfaceRegression)entry.regressions.push(sample);
    if(step%16===0){await save();console.error(JSON.stringify({form,step,regressions:entry.regressions.length,elapsedMs:Date.now()-started}));}
   }
   entry.status=entry.regressions.length?'rejected-dense-audit':'passed-dense-audit';
  }
  assert.equal(JSON.stringify(rig.data),original);assert.deepEqual(rig.capture(),live);entry.sourcePreserved=true;entry.elapsedMs=Date.now()-started;await save();
 }finally{rig.dispose();disposeModel(model.scene);}
}
evidence.complete=true;await save();console.log(JSON.stringify(evidence,null,2));
if(evidence.forms.some(e=>e.status!=='passed-dense-audit'))process.exitCode=1;
