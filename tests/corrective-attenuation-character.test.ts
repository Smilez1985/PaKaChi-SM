import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import type {StudioCorrectiveShape} from '../src/studio-corrective-shapes.ts';
import {attenuateCorrectiveIntersections} from '../src/corrective-intersection-attenuation.ts';
import {limitCorrectiveStrain} from '../src/corrective-strain-guard.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {checkSurfaceIntersections} from '../src/surface-intersections.ts';
import {noMeasuredRegression,correctionSamples} from '../src/pose-weight-correction.ts';
globalThis.ProgressEvent??=class extends Event{readonly lengthComputable=false;readonly loaded=0;readonly total=0;} as typeof ProgressEvent;

test('real separated character retains cut reduction after attenuation at failing poses and 65 independent pair/strain checks',async()=>{
 const e=JSON.parse(await readFile(new URL('../docs/benchmarks/pakachi-attenuation-2026-11-11.json',import.meta.url),'utf8')),bytes=await readFile(new URL('../'+e.source,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),e.sourceSha256);
 assert.equal(createHash('sha256').update(await readFile(new URL('../src/corrective-intersection-attenuation.ts',import.meta.url))).digest('hex'),e.reproductionKernelSha256);
 const model=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(model.scene),signal=new AbortController().signal,work={used:0,limit:12000000,exhausted:false};
 try{
  rig.addCorrective(e.seed);const source=structuredClone(rig.data),neutral=rig.capture(),joint=rig.data.points.find(p=>p.name===e.proposal.joint)!,mesh=e.proposal.meshes[0].mesh,index=rig.surfaces[mesh].mesh.geometry.index!.array,inspect=createPoseSurfaceChecker(rig),poseAt=(fraction:number)=>{const values=structuredClone(neutral);values[joint.id].rotation=new T.Quaternion().fromArray(e.proposal.rest).slerp(new T.Quaternion().fromArray(e.proposal.pose),fraction).toArray();return {id:'sample-'+fraction,name:'Sample',seconds:1,values};},target=poseAt(1);
  let shape:StudioCorrectiveShape|null=structuredClone(e.proposal);
  for(const fractions of e.checkpointFractions as number[][]){shape=await attenuateCorrectiveIntersections(rig,shape!,fractions.map(poseAt),signal,work);assert.ok(shape);shape=await limitCorrectiveStrain(rig,shape,[...correctionSamples(rig,target,8),target],signal,work);assert.ok(shape);}
  const before=inspect(target),after=inspect(target,undefined,shape!);assert.ok(after.issues<=before.issues);assert.ok(work.used<=work.limit);assert.equal(work.exhausted,false);
  for(let step=0;step<=64;step++){
   const pose=poseAt(step/64),bp=new Set<string>(),ap=new Set<string>(),b=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,mesh),index,100000,{onIntersection:(a,b)=>bp.add(a+':'+b)}),a=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,mesh,undefined,shape!),index,100000,{onIntersection:(a,b)=>ap.add(a+':'+b)});
   assert.equal(b.checked,true,`baseline ${step}`);assert.equal(a.checked,true,`candidate ${step}`);assert.deepEqual([...ap].filter(p=>!bp.has(p)),[],`new pair at ${step}`);assert.equal(noMeasuredRegression(inspect(pose),inspect(pose,undefined,shape!)),true,`surface ${step}`);
   if(step===64){assert.equal(b.intersections,e.adaptiveRefinement.history.at(-1).target.beforeCuts);assert.equal(a.intersections,e.adaptiveRefinement.history.at(-1).target.afterCuts);assert.ok(a.intersections<=b.intersections-5,'actual target cut improvement survives');}
  }
  assert.deepEqual(rig.data,source);assert.deepEqual(rig.capture(),neutral);
 }finally{rig.dispose();disposeModel(model.scene);}
});
