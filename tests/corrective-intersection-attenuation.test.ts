import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import type {StudioCorrectiveShape} from '../src/studio-corrective-shapes.ts';
import {activeCorrectiveIntersectionPoses,attenuateCorrectiveIntersections} from '../src/corrective-intersection-attenuation.ts';
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
test('a crossing is removed by a partial tested shift while seam aliases and independent useful shifts survive',async()=>{
 const f=fixture(),input=structuredClone(f.shape),data=JSON.stringify(f.rig.data),live=f.rig.capture(),positions=f.mesh.geometry.getAttribute('position').array.slice(),budget=work();
 try{
  const bad=checkSurfaceIntersections(poseSurfacePositions(f.rig,f.pose.values,0,undefined,f.shape),f.mesh.geometry.index!.array);assert.equal(bad.intersections,1);
  const result=await attenuateCorrectiveIntersections(f.rig,f.shape,[f.pose],signal(),budget);assert.ok(result);assert.deepEqual(result.meshes[0].indices,[3,6,9]);
  const deltas=result.meshes[0].deltas;assert.ok(deltas[2]<0&&deltas[2]>input.meshes[0].deltas[2]);assert.deepEqual(deltas.slice(0,3),deltas.slice(6,9));assert.deepEqual(deltas.slice(3,6),[0,0,.1]);
  const report=checkSurfaceIntersections(poseSurfacePositions(f.rig,f.pose.values,0,undefined,result),f.mesh.geometry.index!.array);assert.equal(report.checked,true);assert.equal(report.intersections,0);assert.ok(budget.used>0&&budget.used<=budget.limit);
  assert.deepEqual(f.shape,input);assert.equal(JSON.stringify(f.rig.data),data);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(f.mesh.geometry.getAttribute('position').array,positions);
 }finally{f.rig.dispose();}
});
test('the cached local trials agree with complete queries for moving skin and multiple driver amounts',async()=>{
 const f=fixture();
 try{
  f.rig.dispose();const si=f.mesh.geometry.getAttribute('skinIndex');for(let v=0;v<si.count;v++)si.setX(v,1);const rig=new StudioRig(f.mesh.parent!);
  try{
   const joint=rig.data.points.find(p=>p.name==='Bend')!,poses=[Math.PI/4,Math.PI/2].map((angle,i)=>{const values=rig.capture();values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),angle).toArray();return {id:'pose-'+i,name:'Pose',seconds:1,values};});
   const result=await attenuateCorrectiveIntersections(rig,f.shape,poses,signal(),work());assert.ok(result);
   for(const pose of poses){const report=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,0,undefined,result),f.mesh.geometry.index!.array);assert.equal(report.checked,true);assert.equal(report.intersections,0);}
  }finally{rig.dispose();}
 }finally{f.mesh.geometry.dispose();}
});
test('safe shifts remain exact and incomplete queries, work exhaustion, cancellation and stale revisions refuse partial results',async()=>{
 const f=fixture(),input=structuredClone(f.shape);
 try{
  const safe=structuredClone(f.shape);safe.meshes=[{mesh:0,indices:[6],deltas:[0,0,.1]}];assert.deepEqual(await attenuateCorrectiveIntersections(f.rig,safe,[f.pose],signal(),work()),safe);
  const tiny={used:0,limit:1,exhausted:false};assert.equal(await attenuateCorrectiveIntersections(f.rig,f.shape,[f.pose],signal(),tiny),null);assert.equal(tiny.exhausted,true);assert.equal(tiny.used,0);
  const abort=new AbortController(),pending=attenuateCorrectiveIntersections(f.rig,f.shape,[f.pose],abort.signal,work());abort.abort();await assert.rejects(pending,{name:'AbortError'});
  let valid=true;const stale=attenuateCorrectiveIntersections(f.rig,f.shape,[f.pose],signal(),work(),()=>valid);valid=false;await assert.rejects(stale,/geändert/);
  await assert.rejects(attenuateCorrectiveIntersections(f.rig,f.shape,Array(5).fill(f.pose),signal(),work()),/Gegenprüfung/);
  const p=f.mesh.geometry.getAttribute('position');for(const v of [3,4,5])p.setZ(v,0);f.rig.dispose();const rig=new StudioRig(f.mesh.parent!);
  try{const pose={...f.pose,values:rig.capture()},joint=rig.data.points.find(p=>p.name==='Bend')!;pose.values[joint.id].rotation=[...f.shape.pose] as [number,number,number,number];assert.equal(await attenuateCorrectiveIntersections(rig,f.shape,[pose],signal(),work()),null);}finally{rig.dispose();}
  assert.deepEqual(f.shape,input);
 }finally{f.rig.dispose();}
});

test('large seam groups stay bounded and cannot publish a half-tested attenuation', {timeout:5000}, async()=>{
 const f=fixture();
 try{
  f.rig.dispose();const count=32775,positions=new Float32Array(count*3),original=f.mesh.geometry.getAttribute('position');positions.set(original.array as Float32Array);for(let v=10;v<count;v++)positions.set([0,-.5,.5],v*3);
  f.mesh.geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));f.mesh.geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(count*4),4));f.mesh.geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(Array.from({length:count*4},(_,i)=>i%4?0:1),4));const rig=new StudioRig(f.mesh.parent!);
  try{
   const shape=structuredClone(f.shape),extra=Array.from({length:32765},(_,i)=>i+10);shape.meshes[0].indices.push(...extra);for(const _v of extra)shape.meshes[0].deltas.push(0,0,-1.5);const input=structuredClone(shape),pose={...f.pose,values:rig.capture()},joint=rig.data.points.find(p=>p.name==='Bend')!;pose.values[joint.id].rotation=[...shape.pose] as [number,number,number,number];
   const budget={used:0,limit:1500000,exhausted:false};assert.equal(await attenuateCorrectiveIntersections(rig,shape,[pose],signal(),budget),null);assert.equal(budget.exhausted,true);assert.ok(budget.used<=budget.limit);assert.deepEqual(shape,input);
  }finally{rig.dispose();}
 }finally{f.mesh.geometry.dispose();}
});

test('local displacement caching refuses renormalization of an installed driver',async()=>{
 const f=fixture();
 try{
  const safe=structuredClone(f.shape);safe.meshes=[{mesh:0,indices:[6],deltas:[0,0,.1]}];f.rig.addCorrective(safe);const source=structuredClone(f.rig.data),live=f.rig.capture();
  assert.equal(await attenuateCorrectiveIntersections(f.rig,safe,[f.pose],signal(),work()),null);assert.deepEqual(f.rig.data,source);assert.deepEqual(f.rig.capture(),live);
 }finally{f.rig.dispose();}
});

test('refinement retains active motion peaks, removes exact duplicate/neutral poses and preserves nearby distinct rotations',()=>{
 const f=fixture();
 try{
  const joint=f.rig.data.points.find(p=>p.name==='Bend')!,neutral={...f.pose,id:'neutral',values:f.rig.capture()},middle={...f.pose,id:'middle',values:f.rig.capture()},near={...f.pose,id:'near',values:f.rig.capture()};middle.values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/4).toArray();near.values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/4+1e-10).toArray();
  const duplicate={...middle,id:'duplicate',values:Object.fromEntries(Object.entries(middle.values).reverse().map(([id,v])=>[id,{rotation:[...v.rotation],position:[...v.position],scale:v.scale??1}]))} as typeof middle;
  const poses=[neutral,f.pose,middle,duplicate,near],input=structuredClone(poses);assert.deepEqual(activeCorrectiveIntersectionPoses(f.rig,poses,f.shape).map(p=>p.id),[f.pose.id,'middle','near']);assert.deepEqual(poses,input);
 }finally{f.rig.dispose();}
});
