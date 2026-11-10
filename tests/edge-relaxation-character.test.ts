import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {buildEdgeRelaxationCorrection} from '../src/geometric-skin-correction.ts';
import {attenuateCorrectiveIntersections as limitCorrectiveIntersections} from '../src/corrective-intersection-attenuation.ts';
import {limitCorrectiveStrain} from '../src/corrective-strain-guard.ts';
import {correctionSamples,noMeasuredRegression} from '../src/pose-weight-correction.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {checkCandidateIntersectionFrames,correctionJoints} from '../src/automatic-skin-correction.ts';
import {checkSurfaceIntersections} from '../src/surface-intersections.ts';
globalThis.ProgressEvent??=class extends Event{readonly lengthComputable=false;readonly loaded=0;readonly total=0;} as typeof ProgressEvent;
for(const form of ['humanoid','animal'])test(`real ${form}: positional correction preserves source state and passes or rejects actual intermediate geometry`,async()=>{
 const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url)),model=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(model.scene),signal=new AbortController().signal;
 try{
  const joint=rig.data.points.find(p=>p.name==='LeftHip')!,values=rig.capture(),degree=form==='humanoid'?90:22.5;values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degree*Math.PI/180).toArray();const pose={id:'hip',name:'Hip',seconds:1,values},inspect=createPoseSurfaceChecker(rig),before=inspect(pose),source=JSON.stringify(rig.data),live=rig.capture();
  const center=form==='humanoid'?joint.rest:correctionJoints(rig,before,pose)[0].center,radius=form==='humanoid'?.14512063946937386:.15,work={used:0,limit:12000000,exhausted:false};
  const raw=await buildEdgeRelaxationCorrection(rig,pose,joint,radius,signal,work,()=>true,center);assert.ok(raw);const original=structuredClone(raw);let shape=await limitCorrectiveStrain(rig,raw,[...correctionSamples(rig,pose,8),pose],signal,work);assert.ok(shape);assert.deepEqual(raw,original);assert.equal(JSON.stringify(rig.data),source);assert.deepEqual(rig.capture(),live);
  const affected=shape.meshes.map(m=>m.mesh),gate=checkCandidateIntersectionFrames(rig,[pose,...correctionSamples(rig,pose)],affected,undefined,shape);
  if(!gate.accepted){assert.ok(gate.newIntersections>0);shape=await limitCorrectiveIntersections(rig,shape,[pose,...correctionSamples(rig,pose)],signal,work);assert.ok(shape);shape=await limitCorrectiveStrain(rig,shape,[...correctionSamples(rig,pose,8),pose],signal,work);assert.ok(shape);const refined=checkCandidateIntersectionFrames(rig,[pose,...correctionSamples(rig,pose)],shape.meshes.map(m=>m.mesh),undefined,shape);assert.equal(refined.accepted,true);assert.equal(refined.complete,true);}else{
  assert.equal(gate.accepted,true);assert.equal(gate.complete,true);}
  const after=inspect(pose,undefined,shape);assert.ok(after.issues<=before.issues-(form==='animal'?5:15));assert.equal(noMeasuredRegression(before,after),true);
  for(let step=0;step<=64;step++){const sample={...pose,values:rig.capture()};sample.values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degree*step/64*Math.PI/180).toArray();assert.equal(noMeasuredRegression(inspect(sample),inspect(sample,undefined,shape)),true,`sample ${step}`);}
  const m=rig.surfaces.findIndex(s=>s.mesh.name==='PaKaChi_body'),index=rig.surfaces[m].mesh.geometry.index!.array,b=checkSurfaceIntersections(poseSurfacePositions(rig,values,m),index),a=checkSurfaceIntersections(poseSurfacePositions(rig,values,m,undefined,shape),index);assert.equal(b.checked,true);assert.equal(a.checked,true);assert.ok(a.intersections<=(form==='animal'?b.intersections:b.intersections-1));
  const expected=poseSurfacePositions(rig,values,m,undefined,shape),stop=rig.previewCorrective(values,shape),mesh=rig.surfaces[m].mesh,frame=rig.modelWorldMatrix.invert();for(let v=0;v<expected.length/3;v+=137){const actual=mesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(mesh.matrixWorld).applyMatrix4(frame);assert.ok(actual.distanceTo(new T.Vector3().fromArray(expected,v*3))<1e-6);}stop();assert.equal(JSON.stringify(rig.data),source);assert.deepEqual(rig.capture(),live);
 }finally{rig.dispose();disposeModel(model.scene);}
});
