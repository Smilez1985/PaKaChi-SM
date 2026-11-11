import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import type {StudioCorrectiveShape} from '../src/studio-corrective-shapes.ts';
import {poseSurfacePositions} from '../src/pose-surface-check.ts';
import {checkSurfaceIntersections} from '../src/surface-intersections.ts';
import {checkCandidateIntersectionRegression,checkCandidateIntersectionSequence,checkCandidateIntersectionFrames} from '../src/automatic-skin-correction.ts';

test('removing an old cut never hides a different new pair, including a partially measurable after-surface',async()=>{
 for(const contact of [false,true]){
  const root=new T.Group(),base=new T.Bone(),joint=new T.Bone();base.name='Root';joint.name='Bend';base.add(joint);root.add(base);
  const positions=[-1,-1,0,1,-1,0,0,1,0, 0,-.5,-1,0,-.5,1,0,.5,1, 9,-1,0,11,-1,0,10,1,0, 10,-.5,1,10,-.5,3,10,.5,3];if(contact)positions.push(10,1,2,10,1,3,10.25,1.25,3);
  const count=positions.length/3,geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(Array.from({length:count},(_,i)=>i));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(count*4),4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(Array.from({length:count*4},(_,i)=>i%4?0:1),4));geometry.computeVertexNormals();
  const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([base,joint]));const rig=new StudioRig(root);
  try{
   const point=rig.data.points.find(p=>p.name==='Bend')!,values=rig.capture();values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2).toArray();const pose={id:'bend',name:'Bend',seconds:1,values};
   const indices=[3,4,5,9,10,11,...(contact?[12,13,14]:[])],shape:StudioCorrectiveShape={id:'shape-swap',group:'shape-swap',joint:'Bend',rest:[0,0,0,1],pose:[...values[point.id].rotation],radius:Math.PI/2,meshes:[{mesh:0,indices,deltas:indices.flatMap(v=>[0,0,v<6?2:-2])}]};
   const source=JSON.stringify(rig.data),live=rig.capture(),before=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,0),mesh.geometry.index!.array),after=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,0,undefined,shape),mesh.geometry.index!.array);
   assert.equal(before.checked,true);assert.equal(before.intersections,1);assert.equal(after.intersections,1);assert.deepEqual(before.examples,[[0,1]]);assert.deepEqual(after.examples,[[2,3]]);assert.equal(after.checked,!contact);
   const gate=checkCandidateIntersectionRegression(rig,pose,[0],undefined,shape);assert.equal(gate.accepted,false);assert.equal(gate.newIntersections,1);assert.equal(gate.complete,!contact);assert.equal(JSON.stringify(rig.data),source);assert.deepEqual(rig.capture(),live);
   const poses=Array.from({length:17},(_,i)=>{const v=rig.capture();v[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),i/1000).toArray();return {...pose,values:v};});poses[7]=pose;
   assert.equal(checkCandidateIntersectionFrames(rig,[poses[0],poses[8],poses[16]],[0],undefined,shape).accepted,true,'sparse endpoints and midpoint miss the new pair');
   let yields=0;const sequence=await checkCandidateIntersectionSequence(rig,poses,[0],undefined,shape,async()=>{yields++;});
   assert.equal(sequence.accepted,false);assert.equal(sequence.newIntersections,1);assert.equal(sequence.checkedFrames,8);assert.equal(yields,8);assert.equal(sequence.complete,false,'unvisited later frames are not certified');
   const abort=new AbortController();await assert.rejects(()=>checkCandidateIntersectionSequence(rig,poses,[0],undefined,shape,async()=>{abort.abort();abort.signal.throwIfAborted();}),{name:'AbortError'});
   assert.equal(JSON.stringify(rig.data),source);assert.deepEqual(rig.capture(),live);
  }finally{rig.dispose();geometry.dispose();}
 }
});
