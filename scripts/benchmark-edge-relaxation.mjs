/** Read-only reference evaluation; emits JSON, never rewrites a GLB or applies a proposal. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {findAutomaticSkinCorrection,checkCandidateIntersectionFrames} from '../src/automatic-skin-correction.ts';
import {correctionSamples,noMeasuredRegression} from '../src/pose-weight-correction.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {checkSurfaceIntersections} from '../src/surface-intersections.ts';
globalThis.ProgressEvent??=class extends Event{};
const forms=[],signal=new AbortController().signal;
for(const form of ['humanoid','animal']){
 const source=`public/model-zoo/pakachi-rigged/${form}.glb`,bytes=await readFile(source),model=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(model.scene);
 try{
  const neutral=rig.capture(),values=structuredClone(neutral),joint=rig.data.points.find(p=>p.name==='LeftHip'),degrees=form==='humanoid'?90:22.5;values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degrees*Math.PI/180).toArray();const pose={id:'hip',name:'Hip',seconds:1,values};rig.data.poses=[{id:'rest',name:'Rest',seconds:1,values:neutral},pose];rig.data.moves=[{id:'loop',name:'Hip loop',loop:true,poses:['rest','hip']}];
  const original=JSON.stringify(rig.data),inspect=createPoseSurfaceChecker(rig),before=inspect(pose);let shape,proposal=null;
  proposal=await findAutomaticSkinCorrection(rig,signal,()=>true,{poseId:'hip'});shape=proposal?.shape;
  const entry={form,source,sha256:createHash('sha256').update(bytes).digest('hex'),joint:'LeftHip',axis:'X',degrees,mode:'full-automatic-job',beforeIssues:before.issues,status:'no-candidate'};
  if(shape){
   const after=inspect(pose,undefined,shape),failures=[];
   for(let i=0;i<=64;i++){const v=structuredClone(neutral);v[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degrees*i/64*Math.PI/180).toArray();const p={...pose,values:v},b=inspect(p),a=inspect(p,undefined,shape);if(!noMeasuredRegression(b,a))failures.push({step:i,before:b.issues,after:a.issues});}
   const m=rig.surfaces.findIndex(s=>s.mesh.name==='PaKaChi_body'),index=rig.surfaces[m].mesh.geometry.index.array,cuts=[];
   for(const fraction of [.25,.5,.75,1]){const v=structuredClone(neutral);v[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degrees*fraction*Math.PI/180).toArray();const b=checkSurfaceIntersections(poseSurfacePositions(rig,v,m),index),a=checkSurfaceIntersections(poseSurfacePositions(rig,v,m,undefined,shape),index);cuts.push({fraction,degrees:degrees*fraction,before:b.intersections,after:a.intersections,beforeComplete:b.checked,afterComplete:a.checked});}
   const gate=checkCandidateIntersectionFrames(rig,[pose,...correctionSamples(rig,pose)],shape.meshes.map(m=>m.mesh),undefined,shape);
   Object.assign(entry,{status:proposal&&gate.accepted&&!failures.length?'accepted-automatic-proposal':'rejected-candidate',afterIssues:after.issues,afterVolumeIssues:after.volumeIssues,method:proposal?.geometryMethod??'edge-relaxation',affectedVertices:shape.meshes.reduce((n,m)=>n+m.indices.length,0),independentSamples:65,regressions:failures,bodyCuts:cuts,collisionGate:gate,automatic:proposal?{checkedPoses:proposal.checkedPoses,motionSamples:proposal.motionSamples,checkedMoves:proposal.checkedMoves,checkedCandidates:proposal.checkedCandidates,region:proposal.region,strength:proposal.amount,edgeOperations:proposal.edgeOperations,vertexSamples:proposal.vertexSamples,vertexBudgetExhausted:proposal.vertexBudgetExhausted}:null});
  }
  if(original!==JSON.stringify(rig.data))throw Error('Reference evaluation changed the source');forms.push(entry);
 }finally{rig.dispose();disposeModel(model.scene);}
}
console.log(JSON.stringify({format:'pakachi-edge-relaxation-evidence',version:1,scope:'Static independent-face collision samples and bounded pose/move checks; no anatomical, cross-mesh or continuous-motion clearance.',forms},null,2));
