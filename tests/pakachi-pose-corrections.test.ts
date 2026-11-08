import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {poseMorphBindings} from '../src/pose-morphs.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
Object.assign(globalThis,{ProgressEvent:class extends Event{}});
for(const [form,count]of [['humanoid',6],['animal',1]] as const){
 test(`PaKaChi ${form}: actual corrective targets improve accepted full-angle poses and agree with real body and fur skinning`,async()=>{
  const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url));assert.ok(bytes.length<50*1024*1024);const gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene);
  try{
   const bindings=poseMorphBindings(rig.root),body=bindings.find(b=>b.mesh.name==='PaKaChi_body')!;assert.equal(body.entries.length,count);assert.equal(bindings.find(b=>b.mesh.name==='PaKaChi_fur')!.entries.length,count);const joint=rig.data.points.find(p=>p.name==='LeftElbow')!,inspect=createPoseSurfaceChecker(rig),live=rig.capture();
   // Independent 0.88.0 baseline: positions, normals, colors, influences and topology.
   const hash=createHash('sha256');for(const name of ['position','normal','color','skinIndex','skinWeight']){const a=body.mesh.geometry.attributes[name].array;hash.update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));}const index=body.mesh.geometry.index!.array;hash.update(new Uint8Array(index.buffer,index.byteOffset,index.byteLength));assert.equal(hash.digest('hex'),form==='humanoid'?'d0d2786c7f8e464bad2e0cf6fc5657bcc9474f09829262c86a6369c8e67d418c':'7b042901ab603b683e24779231aaf327f4a064fd8c7d4494af5ba575ba0fbf58');
   for(const entry of body.entries){const values=structuredClone(live);values[joint.id].rotation=entry.pose.toArray();const pose={id:'probe',name:'Probe',seconds:1,values},before=inspect(pose,new Map()),after=inspect(pose);assert.ok(after.issues<before.issues);assert.ok(after.meshes.find(m=>m.name==='PaKaChi_body')!.maximumStretch!<before.meshes.find(m=>m.name==='PaKaChi_body')!.maximumStretch!);
    const predictions=bindings.map(b=>{const i=rig.surfaces.findIndex(s=>s.mesh===b.mesh);return {mesh:b.mesh,positions:poseSurfacePositions(rig,values,i)};});rig.apply(values);assert.deepEqual(rig.capture(),values);const inverse=rig.root.matrixWorld.clone().invert();for(const {mesh,positions}of predictions)for(let v=0;v<positions.length/3;v+=97){const actual=mesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);assert.ok(actual.distanceTo(new T.Vector3().fromArray(positions,v*3))<1e-6);}
   }
   rig.apply(live);for(const {mesh}of bindings)assert.ok(mesh.morphTargetInfluences!.every(w=>w===0));
   for(const [name,axis,degrees]of [['LeftElbow','y',180],['LeftWrist','x',45],['Head','x',45]] as const){const values=structuredClone(live),p=rig.data.points.find(p=>p.name===name)!,direction=new T.Vector3();direction[axis]=1;values[p.id].rotation=new T.Quaternion().setFromAxisAngle(direction,degrees*Math.PI/180).toArray();for(const {mesh}of bindings){const i=rig.surfaces.findIndex(s=>s.mesh===mesh);assert.deepEqual(poseSurfacePositions(rig,values,i),poseSurfacePositions(rig,values,i,new Map()));}}
  }finally{rig.dispose();disposeModel(gltf.scene);}
 });
}
