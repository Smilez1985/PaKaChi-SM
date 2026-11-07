import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {modelCenter} from '../src/camera.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {parseProject} from '../src/studio-data.ts';
import {hierarchy} from '../scripts/pakachi-rig-config.mjs';
if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{}});
const evidence=JSON.parse(await readFile(new URL('../docs/benchmarks/pakachi-rigging-2026-11-07.json',import.meta.url),'utf8'));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
async function load(form:string){const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url));return {bytes,gltf:await parseModel(Uint8Array.from(bytes).buffer)};}
function meshes(root:T.Object3D){const out:T.SkinnedMesh[]=[];root.traverse(n=>{if(n instanceof T.SkinnedMesh)out.push(n);});return out;}
function vertices(mesh:T.SkinnedMesh){mesh.updateWorldMatrix(true,false);mesh.updateMatrixWorld(true);return Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));}
for(const form of ['humanoid','animal']){
 test(`PaKaChi ${form}: shared hierarchy, normalized weights, normals, source preservation and character details`,async()=>{
  const {bytes,gltf}=await load(form),report=evidence.forms.find((r:any)=>r.form===form);try{
   const original=await readFile(new URL('../'+report.source,import.meta.url));assert.equal(sha(original),report.sourceSha256);assert.equal(sha(bytes),report.outputSha256);
   const skins=meshes(gltf.scene);assert.equal(skins.length,2);const body=skins.find(m=>m.name==='PaKaChi_body')!;assert.equal(body.geometry.attributes.position.count,report.sourceVertices);
   assert.deepEqual(body.skeleton.bones.map(b=>[b.name,b.parent instanceof T.Bone?b.parent.name:null]),hierarchy);
   assert.ok(gltf.scene.getObjectByName('LeftEye')!.getWorldPosition(new T.Vector3()).x>gltf.scene.getObjectByName('RightEye')!.getWorldPosition(new T.Vector3()).x);
   for(const mesh of skins){
    const g=mesh.geometry,indices=g.getAttribute('skinIndex'),weights=g.getAttribute('skinWeight'),normal=g.getAttribute('normal');assert.ok(normal);assert.equal((mesh.material as T.MeshStandardMaterial).metalness,0);assert.equal((mesh.material as T.MeshStandardMaterial).flatShading,false);
    for(let i=0;i<weights.count;i++){let sum=0;for(let k=0;k<4;k++){const w=weights.getComponent(i,k);assert.ok(Number.isFinite(w)&&w>=0&&w<=1);assert.ok(indices.getComponent(i,k)<31);sum+=w;}assert.ok(Math.abs(sum-1)<1e-6);}
    const referenced=g.index?[...new Set(g.index.array)]:Array.from({length:normal.count},(_,i)=>i);for(const i of referenced)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(normal,i).length()-1)<1e-4);
   }
   for(const name of ['LeftShoulder','RightShoulder','LeftElbow','RightElbow','LeftHip','RightHip','LeftKnee','RightKnee','Head','Tail1','Tail2','Tail3'])assert.ok(report.coverage[name]>50,name+' must drive real body vertices');
   assert.equal(gltf.animations.length,0);assert.ok(gltf.scene.getObjectByName('Green_iris'));assert.ok(gltf.scene.getObjectByName('Pupil'));assert.ok(gltf.scene.getObjectByName('Muzzle_smile'));assert.ok(gltf.scene.getObjectByName('Green_claw'));assert.ok(report.maxDisplacement<.006);
  }finally{disposeModel(gltf.scene);}
 });
 test(`PaKaChi ${form}: elbow, knee, head and tail deform skin and preserve bone lengths`,async()=>{
  const {gltf}=await load(form);try{const body=meshes(gltf.scene).find(m=>m.name==='PaKaChi_body')!;gltf.scene.updateMatrixWorld(true);const rest=vertices(body),lengths=body.skeleton.bones.map(b=>b.position.length());
   for(const name of ['LeftElbow','RightKnee','Head','Tail2']){
    const bone=body.skeleton.bones.find(b=>b.name===name)!,before=bone.quaternion.clone();bone.rotation.z=.4;gltf.scene.updateMatrixWorld(true);const posed=vertices(body);let moved=0,unchanged=0,max=0;
    posed.forEach((p,i)=>{const d=p.distanceTo(rest[i]);if(d>1e-4)moved++;if(d<1e-7)unchanged++;max=Math.max(max,d);if(name==='Tail2'&&rest[i].y<-.395)assert.ok(d<1e-6,'Tail must not drag a paw');});assert.ok(moved>50,name);assert.ok(unchanged>rest.length*.25,name+' must not move the whole character');assert.ok(max<.8);assert.ok(posed.every(p=>p.toArray().every(Number.isFinite)));
    body.skeleton.bones.forEach((b,i)=>assert.ok(Math.abs(b.position.length()-lengths[i])<1e-9));bone.quaternion.copy(before);gltf.scene.updateMatrixWorld(true);
   }
  }finally{disposeModel(gltf.scene);}
 });
 test(`PaKaChi ${form}: normalized camera and saved Studio pose preserve actual skin and attached face`,async()=>{
  const {bytes,gltf}=await load(form);let second:Awaited<ReturnType<typeof parseModel>>|undefined;try{
   const body=meshes(gltf.scene).find(m=>m.name==='PaKaChi_body')!,rest=vertices(body),expected=new T.Box3().setFromPoints(rest),holder=new T.Group();holder.scale.setScalar(2.4);holder.position.set(-.2,1.1,.15);holder.add(gltf.scene);
   const center=modelCenter(gltf.scene),bounds=new T.Box3().setFromObject(gltf.scene,true);assert.ok(center.distanceTo(bounds.getCenter(new T.Vector3()))<1e-8);assert.ok(center.distanceTo(expected.getCenter(new T.Vector3()).applyMatrix4(holder.matrixWorld))<.04); // Independent rest-vertex frame detects double normalization.
   holder.remove(gltf.scene);gltf.scene.updateMatrixWorld(true);assert.ok(new T.Box3().setFromPoints(vertices(body)).getCenter(new T.Vector3()).distanceTo(expected.getCenter(new T.Vector3()))<1e-6);
   const rig=new StudioRig(gltf.scene),point=rig.data.points.find(p=>p.name==='LeftElbow')!,values=rig.capture();values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.35).toArray();rig.apply(values);
   rig.data.poses.push({id:'bend',name:'Beugen',seconds:1,values});const before=vertices(body);assert.ok(before.some((p,i)=>p.distanceTo(rest[i])>.01));
   const project=parseProject(JSON.parse(JSON.stringify({format:'pakachi-studio',version:1,model:bytes.toString('base64'),avatar:{id:'pakachi',name:'PaKaChi',description:'Rig roundtrip',moves:[]},studio:rig.data})));
   second=await parseModel(Uint8Array.from(Buffer.from(project.model,'base64')).buffer);const loadedRig=new StudioRig(second.scene,project.studio);loadedRig.apply(project.studio.poses[0].values);const after=vertices(meshes(second.scene).find(m=>m.name==='PaKaChi_body')!);before.forEach((p,i)=>assert.ok(p.distanceTo(after[i])<1e-6));
   assert.deepEqual(second.scene.getObjectByName('LeftEye')?.parent?.name,'Head');assert.equal(loadedRig.bones.length,31);
  }finally{disposeModel(gltf.scene);if(second)disposeModel(second.scene);}
 });
}
