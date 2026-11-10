import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import type {StudioCorrectiveShape} from '../src/studio-corrective-shapes.ts';
import {limitCorrectiveIntersections} from '../src/corrective-intersection-guard.ts';
import {poseSurfacePositions} from '../src/pose-surface-check.ts';
import {checkSurfaceIntersections} from '../src/surface-intersections.ts';
function fixture(){
 const root=new T.Group(),base=new T.Bone(),joint=new T.Bone();base.name='Root';joint.name='Bend';base.add(joint);root.add(base);
 const positions=[-1,-1,0,1,-1,0,0,1,0, 0,-.5,.5,0,-.5,1,0,.5,.5, 4,0,0,5,0,0,4,1,0, 0,-.5,.5];
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex([0,1,2,3,4,5,6,7,8]);geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(40),4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(Array.from({length:40},(_,i)=>i%4?0:1),4));geometry.computeVertexNormals();
 const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([base,joint]));
 const rig=new StudioRig(root),point=rig.data.points.find(p=>p.name==='Bend')!,values=rig.capture(),rest=[...values[point.id].rotation];values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2).toArray();
 const pose={id:'bend',name:'Bend',seconds:1,values},shape:StudioCorrectiveShape={id:'shape-probe',group:'shape-probe',joint:'Bend',rest,pose:[...values[point.id].rotation],radius:Math.PI/2,meshes:[{mesh:0,indices:[3,6,9],deltas:[0,0,-1.5,0,0,.1,0,0,-1.5]}]};
 return {rig,mesh,pose,shape};
}
const signal=()=>new AbortController().signal;
const work=()=>({used:0,limit:12000000,exhausted:false});
test('new crossing vertices are pruned with seam aliases, while a separate safe displacement survives',async()=>{
 const f=fixture(),input=structuredClone(f.shape),data=JSON.stringify(f.rig.data),live=f.rig.capture(),positions=f.mesh.geometry.getAttribute('position').array.slice(),budget=work();
 try{
  const before=checkSurfaceIntersections(poseSurfacePositions(f.rig,f.pose.values,0),f.mesh.geometry.index!.array),bad=checkSurfaceIntersections(poseSurfacePositions(f.rig,f.pose.values,0,undefined,f.shape),f.mesh.geometry.index!.array);assert.equal(before.checked,true);assert.equal(before.intersections,0);assert.equal(bad.checked,true);assert.equal(bad.intersections,1);
  const result=await limitCorrectiveIntersections(f.rig,f.shape,[f.pose],signal(),budget);assert.ok(result);assert.deepEqual(result.meshes[0].indices,[6]);assert.deepEqual(result.meshes[0].deltas,[0,0,.1]);assert.ok(budget.used>0);assert.ok(budget.used<=budget.limit);
  const after=checkSurfaceIntersections(poseSurfacePositions(f.rig,f.pose.values,0,undefined,result),f.mesh.geometry.index!.array);assert.equal(after.checked,true);assert.equal(after.intersections,0);assert.deepEqual(f.shape,input);assert.equal(JSON.stringify(f.rig.data),data);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(f.mesh.geometry.getAttribute('position').array,positions);
 }finally{f.rig.dispose();}
});
test('pre-existing crossings remain identified and safe proposals are returned unchanged',async()=>{
 const f=fixture();
 try{
  // Start from the pierced geometry, then move only the separate third face.
  const position=f.mesh.geometry.getAttribute('position');position.setZ(3,-1);f.rig.dispose();const rig=new StudioRig(f.mesh.parent!);
  try{const shape=structuredClone(f.shape);shape.meshes=[{mesh:0,indices:[6],deltas:[0,0,.1]}];const pose={...f.pose,values:rig.capture()};const point=rig.data.points.find(p=>p.name==='Bend')!;pose.values[point.id].rotation=[...shape.pose] as [number,number,number,number];const result=await limitCorrectiveIntersections(rig,shape,[pose],signal(),work());assert.deepEqual(result,shape);}finally{rig.dispose();}
 }finally{f.mesh.geometry.dispose();}
});
test('incomplete contacts, exhausted budgets, stale revisions and aborts never yield partial refinements',async()=>{
 const f=fixture(),input=structuredClone(f.shape);
 try{
  const tiny={used:0,limit:1,exhausted:false};assert.equal(await limitCorrectiveIntersections(f.rig,f.shape,[f.pose],signal(),tiny),null);assert.equal(tiny.exhausted,true);assert.equal(tiny.used,0);
  const controller=new AbortController(),pending=limitCorrectiveIntersections(f.rig,f.shape,[f.pose],controller.signal,work());controller.abort();await assert.rejects(pending);
  let valid=true;const stale=limitCorrectiveIntersections(f.rig,f.shape,[f.pose],signal(),work(),()=>valid);valid=false;await assert.rejects(stale,/geändert/);
  await assert.rejects(limitCorrectiveIntersections(f.rig,f.shape,Array(5).fill(f.pose),signal(),work()),/Gegenprüfung/);
  // Coplanar overlap is deliberately unresolved; it is not a successful repair.
  const p=f.mesh.geometry.getAttribute('position');for(const v of [3,4,5])p.setZ(v,0);f.rig.dispose();const rig=new StudioRig(f.mesh.parent!);
  try{const pose={...f.pose,values:rig.capture()},point=rig.data.points.find(p=>p.name==='Bend')!;pose.values[point.id].rotation=[...f.shape.pose] as [number,number,number,number];assert.equal(await limitCorrectiveIntersections(rig,f.shape,[pose],signal(),work()),null);}finally{rig.dispose();}
  assert.deepEqual(f.shape,input);
 }finally{f.rig.dispose();}
});
