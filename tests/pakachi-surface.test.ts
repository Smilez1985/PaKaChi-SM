import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {checkPoseSurface,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {searchWeightCorrection} from '../src/pose-weight-correction.ts';
globalThis.ProgressEvent??=class extends Event{readonly lengthComputable=false;readonly loaded=0;readonly total=0;} as typeof ProgressEvent;
const evidence=JSON.parse(await readFile(new URL('../docs/benchmarks/pakachi-rigging-2026-11-07.json',import.meta.url),'utf8'));
for(const form of ['humanoid','animal']){
  test(`PaKaChi ${form}: bounded local search refuses an unsupported extreme elbow twist without changing rig or skin`,async()=>{
    const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url)),gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene);
    try{
      const joint=rig.data.points.find(p=>p.name==='LeftElbow')!,values=rig.capture();values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI).toArray();const pose={id:'twist',name:'Twist',seconds:1,values};rig.data.poses=[pose,{id:'neutral',name:'Neutral',seconds:1,values:rig.capture()}];
      const before=structuredClone(rig.data),weights=rig.surfaces.filter(s=>s.mesh instanceof T.SkinnedMesh).map(s=>Array.from(s.mesh.geometry.attributes.skinWeight.array));assert.equal(checkPoseSurface(rig,pose).status,'outside');assert.equal(await searchWeightCorrection(rig,pose,joint,.3,new AbortController().signal),null);assert.deepEqual(rig.data,before);assert.deepEqual(rig.surfaces.filter(s=>s.mesh instanceof T.SkinnedMesh).map(s=>Array.from(s.mesh.geometry.attributes.skinWeight.array)),weights);
    }finally{rig.dispose();disposeModel(gltf.scene);}
  });
  test(`PaKaChi ${form}: actual neutral surface passes and bone-only form retarget exposes skin bridges`,async()=>{
    const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url)),gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene);
    try{
      const values=rig.capture(),pose={id:'reference',name:'Reference',seconds:1,values},live=rig.capture(),matrices=rig.bones.map(b=>b.matrixWorld.toArray()),neutral=checkPoseSurface(rig,pose);assert.equal(neutral.status,'within');assert.ok(neutral.compared>100000);assert.equal(neutral.meshes.find(m=>m.name==='PaKaChi_body')!.referenceDegenerate,0);
      const other=evidence.forms.find((r:{form:string})=>r.form!==form).landmarks;
      for(const point of rig.data.points){const bone=rig.bones[point.bone!],a=other[bone.name],b=other[bone.parent?.name??''];if(a)values[point.id].position=a.map((v:number,i:number)=>v-(b?.[i]??0));}
      const rejected=checkPoseSurface(rig,pose),body=rejected.meshes.find(m=>m.name==='PaKaChi_body')!;assert.equal(rejected.status,'outside');assert.ok(body.issues>1000);assert.ok(body.maximumStretch!>20);assert.ok(body.collapsed>0);assert.deepEqual(rig.capture(),live);assert.deepEqual(rig.bones.map(b=>b.matrixWorld.toArray()),matrices);
    }finally{rig.dispose();disposeModel(gltf.scene);}
  });
  test(`PaKaChi ${form}: predicted vertices agree with the real posed body, fur and attached eyes`,async()=>{
    const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url)),gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene);
    try{
      const values=rig.capture();for(const name of ['LeftElbow','Head','Tail2']){const point=rig.data.points.find(p=>p.name===name)!;values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.4).toArray();}
      const meshes=rig.surfaces.map((s,i)=>({s,i})).filter(({s})=>['PaKaChi_body','PaKaChi_fur','Green_iris'].includes(s.mesh.name)),predicted=meshes.map(({i})=>poseSurfacePositions(rig,values,i));rig.apply(values);const inverse=rig.root.matrixWorld.clone().invert();
      meshes.forEach(({s},m)=>{for(let i=0;i<s.mesh.geometry.attributes.position.count;i+=23){const actual=s.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(s.mesh.matrixWorld).applyMatrix4(inverse);assert.ok(actual.distanceTo(new T.Vector3().fromArray(predicted[m],i*3))<1e-6,s.mesh.name);}});
    }finally{rig.dispose();disposeModel(gltf.scene);}
  });
}


// Real meshes must reach the complete independent-face test before the correction
// gate can compare counts. This checks the previously budget-truncated body nets.
for(const form of ['humanoid','animal'])test(`PaKaChi ${form}: body collision coverage detects a full hip bend regression without applying the pose`,async()=>{
 const {checkSurfaceIntersections}=await import('../src/surface-intersections.ts');
 const {newProvenIntersectionCount}=await import('../src/automatic-skin-correction.ts');
 const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url)),gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene);
 try{
  const live=rig.capture(),beforeData=JSON.stringify(rig.data),values=structuredClone(live),joint=rig.data.points.find(p=>p.name==='LeftHip')!;
  const mesh=rig.surfaces.findIndex(s=>s.mesh.name==='PaKaChi_body'),index=rig.surfaces[mesh].mesh.geometry.index!.array;
  const before=checkSurfaceIntersections(poseSurfacePositions(rig,values,mesh),index);
  values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2).toArray();
  const after=checkSurfaceIntersections(poseSurfacePositions(rig,values,mesh),index);
  assert.equal(before.checked,true);assert.equal(after.checked,true);
  assert.ok(newProvenIntersectionCount(before,after)>0);
  assert.deepEqual(rig.capture(),live);assert.equal(JSON.stringify(rig.data),beforeData);
 }finally{rig.dispose();disposeModel(gltf.scene);}
});
