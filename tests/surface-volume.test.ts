import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createSurfaceVolumeChecker,noVolumeRegression} from '../src/surface-volume.ts';
import {checkSurfaceShape} from '../src/surface-check.ts';
import {createPoseSurfaceChecker} from '../src/pose-surface-check.ts';
import {noMeasuredRegression,betterSurfaceReport,searchWeightCorrection} from '../src/pose-weight-correction.ts';
import {findAutomaticSkinCorrection,skinCorrectionOverrides} from '../src/automatic-skin-correction.ts';
import {checkMoveSurface} from '../src/move-surface-check.ts';
import {twistFixture} from './helpers/twist-fixture.ts';

const tetra=[0,0,0,1,0,0,0,1,0,0,0,1],faces=[0,2,1,0,1,3,0,3,2,1,2,3];
const scale=(p:number[],s:number)=>p.map(v=>v*s);
test('closed volume has known magnitude, cubic scale and orientation-independent relative ratios',()=>{
 for(const index of [faces,[...faces].reverse()]){
  const check=createSurfaceVolumeChecker(tetra,index),rest=check(tetra);assert.equal(rest.status,'within');assert.equal(rest.measuredComponents,1);assert.equal(rest.components[0].reference,1/6);assert.equal(rest.minimumRatio,1);
  const moved=[];for(let i=0;i<tetra.length;i+=3)moved.push(1e8-tetra[i+1],-1e8+tetra[i],4+tetra[i+2]);assert.equal(check(moved).minimumRatio,1);
  assert.equal(check(scale(tetra,2)).minimumRatio,8);assert.equal(check(scale(tetra,-1)).minimumRatio,-1);assert.equal(check(scale(tetra,0)).minimumRatio,0);
  const tiny=scale(tetra,1e-9);assert.equal(createSurfaceVolumeChecker(tiny,index)(tiny).minimumRatio,1);
 }
});
test('exact UV seams and non-indexed triangles are welded read-only; separated posed seams lose coverage',()=>{
 const geometry=new T.BoxGeometry(1,1,1).toNonIndexed(),p=Array.from(geometry.attributes.position.array),check=createSurfaceVolumeChecker(p),before=check(p);assert.equal(before.status,'within');assert.equal(before.components[0].reference,1);assert.equal(before.measuredComponents,1);
 const split=[...p];split[0]+=.01;const after=check(split);assert.equal(after.status,'outside');assert.equal(after.minimumRatio,null);assert.equal(after.reasons['split-seam'],1);assert.equal(noVolumeRegression(before,after),false);assert.deepEqual(Array.from(geometry.attributes.position.array),p);geometry.dispose();
});
test('open, invalid, degenerate, non-manifold and inconsistently oriented topology never passes as measured volume',()=>{
 const check=(p:number[],i:number[])=>createSurfaceVolumeChecker(p,i)(p);
 assert.equal(check(tetra,faces.slice(3)).status,'unmeasurable');assert.equal(check(tetra,faces.slice(3)).reasons.open,1);
 const reversed=[...faces];[reversed[0],reversed[1]]=[reversed[1],reversed[0]];assert.equal(check(tetra,reversed).reasons.orientation,1);
 assert.equal(check(tetra,[...faces,0,2,1]).reasons['non-manifold'],1);
 assert.equal(check(tetra,[0,1,9]).reasons.invalid,1);assert.equal(check(tetra,[0,1]).reasons.invalid,1);assert.equal(check([NaN,...tetra.slice(1)],faces).reasons.invalid,1);
 assert.equal(check(tetra.map((v,i)=>i%3===2?0:v),faces).status,'unmeasurable');
 assert.equal(createSurfaceVolumeChecker([],null)([]).status,'unmeasurable');
 const flat=[0,0,0,1,0,0,0,1,0,1,1,0];assert.equal(check(flat,faces).reasons['zero-reference'],1);
});
test('two closed shells touching at a single vertex are rejected as non-manifold',()=>{
 const other=tetra.map(v=>-v),p=[...tetra,...other],i=[...faces,...faces.map(v=>v+4)];const report=createSurfaceVolumeChecker(p,i)(p);assert.equal(report.measuredComponents,0);assert.equal(report.reasons['non-manifold'],2);
});
test('opposite volume changes cannot cancel across components and guards reject lost coverage and inversion',()=>{
 const p=[...tetra,...tetra.map((v,i)=>v+(i%3===0?4:0))],i=[...faces,...faces.map(v=>v+4)],check=createSurfaceVolumeChecker(p,i),before=check(p);
 const deformed=[...scale(tetra,Math.cbrt(.5)),...tetra.map((v,i)=>v*Math.cbrt(1.5)+(i%3===0?4:0))],after=check(deformed);assert.equal(after.issues,2);assert.ok(Math.abs(after.minimumRatio!-.5)<1e-12);assert.ok(Math.abs(after.maximumRatio!-1.5)<1e-12);assert.equal(noVolumeRegression(before,after),false);
 const one=createSurfaceVolumeChecker(tetra,faces);assert.equal(noVolumeRegression(one(scale(tetra,.7)),one(scale(tetra,.6))),false);assert.equal(noVolumeRegression(one(scale(tetra,.6)),one(scale(tetra,.7))),true);assert.equal(noVolumeRegression(one(tetra),one(scale(tetra,-1))),false);assert.equal(noVolumeRegression(one(scale(tetra,1.5)),one(scale(tetra,-.1))),false);assert.equal(noVolumeRegression(one(tetra),one([NaN,...tetra.slice(1)])),false);
});
test('large volume loss with no triangle warning is visible to shared correction guards',()=>{
 const p=[...tetra],after=scale(tetra,.9);assert.equal(checkSurfaceShape(p,after,faces).issues,0);const check=createSurfaceVolumeChecker(p,faces);assert.ok(check(after).minimumRatio!<.8);assert.equal(noVolumeRegression(check(p),check(after)),false);
 const f=twistFixture(false,true),inspect=createPoseSurfaceChecker(f.rig),base=inspect(f.rig.data.poses[1]),bad=structuredClone(base);bad.meshes[0].volume=check(after);base.meshes[0].volume=check(p);assert.equal(noMeasuredRegression(base,bad),false);f.rig.dispose();
});
test('closed twist diagnosis measures collapse and all candidate transfers respect per-component volume',async()=>{
 const f=twistFixture(false,true),inspect=createPoseSurfaceChecker(f.rig),before=inspect(f.pose),snapshot=JSON.stringify(f.rig.data),live=f.rig.capture();assert.equal(before.meshes[0].volume.measuredComponents,1);assert.equal(before.volumeIssues,1);assert.ok(before.meshes[0].volume.minimumRatio!<.4);
 const candidate=await searchWeightCorrection(f.rig,f.pose,f.joint,1.2,new AbortController().signal);assert.ok(candidate);assert.equal(noMeasuredRegression(before,candidate.after),true);assert.ok(candidate.after.meshes[0].volume.minimumRatio!>before.meshes[0].volume.minimumRatio!);assert.equal(betterSurfaceReport(candidate.after,before),true);
 const automatic=await findAutomaticSkinCorrection(f.rig,new AbortController().signal);assert.ok(automatic);assert.equal(noMeasuredRegression(automatic.before,automatic.after),true);assert.equal(JSON.stringify(f.rig.data),snapshot);assert.deepEqual(f.rig.capture(),live);
 const motion=await checkMoveSurface(f.rig,f.rig.data.moves[0],new AbortController().signal);assert.equal(motion.meshes[0].volume.maximumIssues,1);assert.equal(motion.meshes[0].volume.unmeasurableSamples,0);const worst=motion.meshes[0].volume.worstTime!;assert.ok(worst>0&&worst<=1);assert.equal(inspect({...f.pose,values:f.rig.sample(f.rig.data.moves[0],worst)}).meshes[0].volume.minimumRatio,motion.meshes[0].volume.minimumRatio);f.rig.dispose();
 const open=twistFixture();assert.equal(createPoseSurfaceChecker(open.rig)(open.pose).meshes[0].volume.status,'unmeasurable');open.rig.dispose();
});

test('automatic diagnosis can target volume-only warnings without inventing triangle defects',async()=>{
 const f=twistFixture(false,true);f.pose.values[f.joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2).toArray();const before=createPoseSurfaceChecker(f.rig)(f.pose);assert.equal(before.issues,0);assert.equal(before.volumeIssues,1);const p=await findAutomaticSkinCorrection(f.rig,new AbortController().signal);assert.ok(p);assert.equal(p.after.issues,0);assert.equal(noMeasuredRegression(before,p.after),true);assert.equal(betterSurfaceReport(p.after,before),true);f.rig.dispose();
});
test('actual weight candidate improves all triangle warnings but is rejected for further volume loss',async()=>{
 const f=twistFixture(false,true),parent=f.rig.data.points.find(p=>p.bone===0)!,inspect=createPoseSurfaceChecker(f.rig),before=inspect(f.pose);
 const overrides=skinCorrectionOverrides(f.rig,{from:f.joint.id,to:parent.id,amount:.35,region:{center:f.joint.rest,radius:2}} as Parameters<typeof skinCorrectionOverrides>[1]),after=inspect(f.pose,overrides);
 assert.equal(after.issues,0);assert.ok(before.issues>0);assert.ok(after.meshes[0].volume.minimumRatio!<before.meshes[0].volume.minimumRatio!);assert.equal(noMeasuredRegression(before,after),false);assert.equal(await searchWeightCorrection(f.rig,f.pose,f.joint,2,new AbortController().signal),null);f.rig.dispose();
});
