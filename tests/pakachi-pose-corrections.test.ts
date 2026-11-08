import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {exportMoveGLB} from '../src/move-glb.ts';
import {poseMorphBindings} from '../src/pose-morphs.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
Object.assign(globalThis,{ProgressEvent:class extends Event{}});
const evidence=JSON.parse(await readFile(new URL('../docs/benchmarks/pakachi-rigging-2026-11-07.json',import.meta.url),'utf8'));
for(const form of ['humanoid','animal']){
 const report=evidence.forms.find((r:any)=>r.form===form).poseCorrections,count=report.trials.filter((t:any)=>t.accepted).length;
 test(`PaKaChi ${form}: actual corrective targets improve accepted full-angle poses and agree with real body and fur skinning`,async()=>{
  const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url));assert.ok(bytes.length<50*1024*1024);const gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene);
  try{
   const bindings=poseMorphBindings(rig.root),body=bindings.find(b=>b.mesh.name==='PaKaChi_body')!;assert.equal(body.entries.length,count);assert.equal(bindings.find(b=>b.mesh.name==='PaKaChi_fur')!.entries.length,count);assert.ok(count>=6&&count<=16);assert.ok(body.entries.some(e=>e.bone.name.includes('Knee')));const inspect=createPoseSurfaceChecker(rig),live=rig.capture();
   const fur=bindings.find(b=>b.mesh.name==='PaKaChi_fur')!.mesh.geometry;for(const delta of fur.morphAttributes.position!){const values=delta.array;for(let v=0;v<delta.count;v+=3)for(let k=0;k<3;k++){assert.equal(values[v*3+k],values[(v+1)*3+k]);assert.equal(values[v*3+k],values[(v+2)*3+k]);}}for(const normal of fur.morphAttributes.normal!)assert.ok(normal.array.every(v=>v===0));
   // Independent 0.88.0 baseline: positions, normals, colors, influences and topology.
   const hash=createHash('sha256');for(const name of ['position','normal','color','skinIndex','skinWeight']){const a=body.mesh.geometry.attributes[name].array;hash.update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));}const index=body.mesh.geometry.index!.array;hash.update(new Uint8Array(index.buffer,index.byteOffset,index.byteLength));assert.equal(hash.digest('hex'),form==='humanoid'?'d0d2786c7f8e464bad2e0cf6fc5657bcc9474f09829262c86a6369c8e67d418c':'7b042901ab603b683e24779231aaf327f4a064fd8c7d4494af5ba575ba0fbf58');
   for(const entry of body.entries){const values=structuredClone(live);values[rig.data.points.find(p=>p.name===entry.bone.name)!.id].rotation=entry.pose.toArray();const pose={id:'probe',name:'Probe',seconds:1,values},before=inspect(pose,new Map()),after=inspect(pose);assert.ok(after.issues<before.issues);assert.ok(after.meshes.find(m=>m.name==='PaKaChi_body')!.maximumStretch!<before.meshes.find(m=>m.name==='PaKaChi_body')!.maximumStretch!);
    const predictions=bindings.map(b=>{const i=rig.surfaces.findIndex(s=>s.mesh===b.mesh);return {mesh:b.mesh,positions:poseSurfacePositions(rig,values,i)};});rig.apply(values);assert.deepEqual(rig.capture(),values);const inverse=rig.root.matrixWorld.clone().invert();for(const {mesh,positions}of predictions)for(let v=0;v<positions.length/3;v+=97){const actual=mesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);assert.ok(actual.distanceTo(new T.Vector3().fromArray(positions,v*3))<1e-6);}
   }
   // Check the final complete set through Studio's independent surface path,
   // including several pairs and context transitions, not the producer's helper.
   const final=report.finalChecks as any[];assert.ok(final.length>20);assert.ok(final.some(s=>s.kind==='final-joint-pair'));
   const samples=[...final.filter(s=>s.kind==='final-joint-pair').slice(0,4),...final.filter(s=>s.kind==='context-transition').slice(0,4),...final.filter(s=>s.kind==='axis-transition').slice(0,4)];
   for(const sample of samples){const values=structuredClone(live);for(const spec of sample.poses)values[rig.data.points.find(p=>p.name===spec.joint)!.id].rotation=spec.rotation;const pose={id:'combined',name:'Combined',seconds:1,values},before=inspect(pose,new Map()),after=inspect(pose);for(const name of ['PaKaChi_body','PaKaChi_fur']){const a=after.meshes.find(m=>m.name===name)!,b=before.meshes.find(m=>m.name===name)!;assert.ok(a.issues<=b.issues,JSON.stringify(sample.poses));assert.ok(a.maximumStretch!<=b.maximumStretch!+1e-5);}}
   const guarded=body.entries.find(e=>e.shape.constraints?.length);if(guarded){const values=structuredClone(live);values[rig.data.points.find(p=>p.name===guarded.bone.name)!.id].rotation=guarded.pose.toArray();const guard=guarded.shape.constraints![0],point=rig.data.points.find(p=>p.name===guard.joint)!;values[point.id].rotation=new T.Quaternion().fromArray(guard.rest).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/6)).toArray();assert.equal(rig.correctionWeights(values).get(body.mesh)![guarded.index],0);}
   rig.apply(live);for(const {mesh}of bindings)assert.ok(mesh.morphTargetInfluences!.every(w=>w===0));
   for(const [name,axis,degrees]of [['LeftElbow','y',180],['LeftWrist','x',45],['Head','x',45]] as const){const values=structuredClone(live),p=rig.data.points.find(p=>p.name===name)!,direction=new T.Vector3();direction[axis]=1;values[p.id].rotation=new T.Quaternion().setFromAxisAngle(direction,degrees*Math.PI/180).toArray();for(const {mesh}of bindings){const i=rig.surfaces.findIndex(s=>s.mesh===mesh);assert.deepEqual(poseSurfacePositions(rig,values,i),poseSurfacePositions(rig,values,i,new Map()));}}
  }finally{rig.dispose();disposeModel(gltf.scene);}
 });
}

test('original PaKaChi combined elbow and knee corrections survive ordinary animated GLB playback',async()=>{
 const bytes=await readFile(new URL('../public/model-zoo/pakachi-rigged/humanoid.glb',import.meta.url)),source=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(source.scene);let loaded:Awaited<ReturnType<typeof parseModel>>|undefined;
 class Reader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}}
 const previous=globalThis.FileReader;Object.assign(globalThis,{FileReader:Reader});
 try{
  const neutral=rig.capture(),target=structuredClone(neutral);for(const name of ['LeftElbow','LeftKnee','RightKnee'])target[rig.data.points.find(p=>p.name===name)!.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2).toArray();
  rig.data.poses=[{id:'rest',name:'Rest',seconds:1,values:neutral},{id:'target',name:'Combined',seconds:1,values:target}];const move={id:'combined',name:'Combined',poses:['rest','target'],loop:false},output=await exportMoveGLB(rig,move);assert.ok(output.byteLength<50*1024*1024);loaded=await parseModel(output);const mixer=new T.AnimationMixer(loaded.scene),action=mixer.clipAction(loaded.animations[0]);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
  for(const time of [.5,.75,1]){mixer.setTime(time);loaded.scene.updateMatrixWorld(true);const values=rig.sample(move,time);for(const name of ['PaKaChi_body','PaKaChi_fur']){const surface=rig.surfaces.findIndex(s=>s.mesh.name===name),expected=poseSurfacePositions(rig,values,surface),mesh=loaded.scene.getObjectByName(name) as T.SkinnedMesh;assert.equal(mesh.userData.pakachiPoseMorphs,undefined);for(let v=0;v<expected.length/3;v+=197){const actual=mesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(mesh.matrixWorld);assert.ok(actual.distanceTo(new T.Vector3().fromArray(expected,v*3))<1e-5,`${name} at ${time}`);}}}
  assert.deepEqual(rig.capture(),neutral);
 }finally{Object.assign(globalThis,{FileReader:previous});rig.dispose();disposeModel(source.scene);if(loaded)disposeModel(loaded.scene);}
});
