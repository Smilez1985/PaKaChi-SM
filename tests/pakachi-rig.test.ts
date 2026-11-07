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
import {exportRiggedFigureGLB} from '../src/figure-glb.ts';
if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{}});
const evidence=JSON.parse(await readFile(new URL('../docs/benchmarks/pakachi-rigging-2026-11-07.json',import.meta.url),'utf8'));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
async function load(form:string){const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url));return {bytes,gltf:await parseModel(Uint8Array.from(bytes).buffer)};}
function meshes(root:T.Object3D){const out:T.SkinnedMesh[]=[];root.traverse(n=>{if(n instanceof T.SkinnedMesh)out.push(n);});return out;}
function vertices(mesh:T.SkinnedMesh){mesh.updateWorldMatrix(true,false);mesh.updateMatrixWorld(true);return Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));}
for(const form of ['humanoid','animal']){
 test(`PaKaChi ${form}: arm movement cannot pull either rear paw across overlapping projected silhouettes`,async()=>{
  const {gltf}=await load(form);try{
   const body=gltf.scene.getObjectByName('PaKaChi_body') as T.SkinnedMesh,report=evidence.forms.find((r:any)=>r.form===form);gltf.scene.updateMatrixWorld(true);const original=vertices(body);
   const footSamples=['LeftFoot','RightFoot'].flatMap(name=>{const center=new T.Vector3().fromArray(report.landmarks[name]),indices=original.flatMap((p,i)=>p.y<center.y+.04&&p.distanceTo(center)<.105?[i]:[]);assert.ok(indices.length>20,name+' has actual paw samples');return indices;});
   for(const name of ['LeftElbow','RightElbow','LeftShoulder','RightShoulder']){const bone=body.skeleton.bones.find(b=>b.name===name)!;bone.rotation.x=.6;gltf.scene.updateMatrixWorld(true);for(const i of footSamples)assert.ok(body.getVertexPosition(i,new T.Vector3()).applyMatrix4(body.matrixWorld).distanceTo(original[i])<1e-6,name+' must not drag a rear paw');bone.rotation.x=0;gltf.scene.updateMatrixWorld(true);}
   if(form==='animal'){
    const back=original.flatMap((p,i)=>p.x>-.03&&p.x<.05&&p.y>.015&&p.y<.06&&p.z>-.30&&p.z<-.20?[i]:[]);assert.ok(back.length>20,'actual upper-back samples behind the head');
    for(const name of ['Neck','Head']){const bone=body.skeleton.bones.find(b=>b.name===name)!;bone.rotation.x=.6;gltf.scene.updateMatrixWorld(true);for(const i of back)assert.ok(body.getVertexPosition(i,new T.Vector3()).applyMatrix4(body.matrixWorld).distanceTo(original[i])<1e-6,name+' must not drag the rear upper back');bone.rotation.x=0;gltf.scene.updateMatrixWorld(true);}
   }
  }finally{disposeModel(gltf.scene);}
 });
 test(`PaKaChi ${form}: repaired body has closed manifold edges and finite normals`,async()=>{
  const {gltf}=await load(form);try{
   const geometry=(gltf.scene.getObjectByName('PaKaChi_body') as T.SkinnedMesh).geometry,index=geometry.index!,edges=new Map<string,{count:number;balance:number}>();
   for(let i=0;i<index.count;i+=3)for(let k=0;k<3;k++){const a=index.getX(i+k),b=index.getX(i+(k+1)%3),key=a<b?`${a}:${b}`:`${b}:${a}`,edge=edges.get(key)??{count:0,balance:0};edge.count++;edge.balance+=a<b?1:-1;edges.set(key,edge);}
   for(const [key,{count,balance}] of edges){assert.equal(count,2,'closed manifold edge '+key);assert.equal(balance,0,'consistent winding '+key);}
  }finally{disposeModel(gltf.scene);}
 });
 test(`PaKaChi ${form}: every digit bends its own rigid geometry without moving the palm, body or neighboring digits`,async()=>{
  const {gltf}=await load(form);try{
   const root=gltf.scene.getObjectByName(`PaKaChi_${form}`)!,body=root.getObjectByName('PaKaChi_body') as T.SkinnedMesh;
   assert.deepEqual(root.userData.paws,{version:1,digits:14,joints:28});
   const digitBones=body.skeleton.bones.slice(31);assert.equal(digitBones.length,28);
   root.updateMatrixWorld(true);const original=vertices(body),tipNames=digitBones.filter(b=>/(2|Tip)$/.test(b.name)).map(b=>b.name+'_green_tip');assert.equal(tipNames.length,14);
   const world=(name:string)=>root.getObjectByName(name)!.getWorldPosition(new T.Vector3());
   const palms=['LeftHand','RightHand','LeftFoot','RightFoot'].map(n=>world(n+'_palm'));
   for(const bone of digitBones){
    const end=bone.name.endsWith('1')?bone.name.slice(0,-1)+'2':bone.name.endsWith('Base')?bone.name.slice(0,-4)+'Tip':bone.name;
    const target=end+'_green_tip',before=new Map(tipNames.map(n=>[n,world(n)])),pivot=bone.getWorldPosition(new T.Vector3()),length=bone.position.length();bone.rotation.x=.6;root.updateMatrixWorld(true);
    assert.ok(world(target).distanceTo(before.get(target)!)>.003,bone.name+' moves its real tip');
    assert.ok(bone.getWorldPosition(new T.Vector3()).distanceTo(pivot)<1e-9);assert.ok(Math.abs(bone.position.length()-length)<1e-9);
    for(const n of tipNames)if(n!==target)assert.ok(world(n).distanceTo(before.get(n)!)<1e-9,n+' must stay independent');
    ['LeftHand','RightHand','LeftFoot','RightFoot'].forEach((n,i)=>assert.ok(world(n+'_palm').distanceTo(palms[i])<1e-9));
    for(const i of [0,Math.floor(original.length/2),original.length-1])assert.ok(body.getVertexPosition(i,new T.Vector3()).applyMatrix4(body.matrixWorld).distanceTo(original[i])<1e-9);
    bone.rotation.x=0;root.updateMatrixWorld(true);
   }
  }finally{disposeModel(gltf.scene);}
 });
 test(`PaKaChi ${form}: articulated fingers survive Studio project and rigged GLB round trips`,async()=>{
  const {bytes,gltf}=await load(form);const copies:T.Object3D[]=[];try{
   const rig=new StudioRig(gltf.scene),values=rig.capture();for(const name of ['LeftIndex1','LeftIndex2','RightToe3Tip']){const point=rig.data.points.find(p=>p.name===name)!;values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.45).toArray();}
   rig.apply(values);rig.data.draft=values;gltf.scene.updateMatrixWorld(true);
   const expected=['LeftIndex2_green_tip','RightToe3Tip_green_tip'].map(n=>gltf.scene.getObjectByName(n)!.getWorldPosition(new T.Vector3()));
   const project=parseProject(JSON.parse(JSON.stringify({format:'pakachi-studio',version:1,model:bytes.toString('base64'),avatar:{id:'pakachi',name:'PaKaChi',description:'Paw rig roundtrip',moves:[]},studio:rig.data})));
   const loaded=await parseModel(Uint8Array.from(Buffer.from(project.model,'base64')).buffer);copies.push(loaded.scene);const loadedRig=new StudioRig(loaded.scene,project.studio);loadedRig.apply(project.studio.draft!);loaded.scene.updateMatrixWorld(true);
   const compare=(root:T.Object3D)=>['LeftIndex2_green_tip','RightToe3Tip_green_tip'].forEach((n,i)=>assert.ok(root.getObjectByName(n)!.getWorldPosition(new T.Vector3()).distanceTo(expected[i])<1e-5));compare(loaded.scene);assert.equal(loadedRig.bones.length,59);
   class BinaryReader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}}
   Object.assign(globalThis,{FileReader:BinaryReader});const exported=await exportRiggedFigureGLB(gltf.scene),roundtrip=await parseModel(exported);copies.push(roundtrip.scene);roundtrip.scene.updateMatrixWorld(true);compare(roundtrip.scene);
   const finger=roundtrip.scene.getObjectByName('LeftIndex2')!;finger.rotation.x+=.4;roundtrip.scene.updateMatrixWorld(true);assert.ok(roundtrip.scene.getObjectByName('LeftIndex2_green_tip')!.getWorldPosition(new T.Vector3()).distanceTo(expected[0])>.003);
   compare(gltf.scene);rig.dispose();loadedRig.dispose();
  }finally{disposeModel(gltf.scene);copies.forEach(disposeModel);}
 });
 test(`PaKaChi ${form}: shared hierarchy, normalized weights, normals, source preservation and character details`,async()=>{
  const {bytes,gltf}=await load(form),report=evidence.forms.find((r:any)=>r.form===form);try{
   const original=await readFile(new URL('../'+report.source,import.meta.url));assert.equal(sha(original),report.sourceSha256);assert.equal(sha(bytes),report.outputSha256);
   const skins=meshes(gltf.scene);assert.equal(skins.length,2);const body=skins.find(m=>m.name==='PaKaChi_body')!;assert.equal(body.geometry.attributes.position.count,report.bodyVertices);assert.ok(report.bodyVertices<report.sourceVertices);
   assert.deepEqual(body.skeleton.bones.map(b=>[b.name,b.parent instanceof T.Bone?b.parent.name:null]),hierarchy);
   assert.ok(gltf.scene.getObjectByName('LeftEye')!.getWorldPosition(new T.Vector3()).x>gltf.scene.getObjectByName('RightEye')!.getWorldPosition(new T.Vector3()).x);
   for(const mesh of skins){
    const g=mesh.geometry,indices=g.getAttribute('skinIndex'),weights=g.getAttribute('skinWeight'),normal=g.getAttribute('normal');assert.ok(normal);assert.equal((mesh.material as T.MeshStandardMaterial).metalness,0);assert.equal((mesh.material as T.MeshStandardMaterial).flatShading,false);
    for(let i=0;i<weights.count;i++){let sum=0;for(let k=0;k<4;k++){const w=weights.getComponent(i,k);assert.ok(Number.isFinite(w)&&w>=0&&w<=1);assert.ok(indices.getComponent(i,k)<hierarchy.length);sum+=w;}assert.ok(Math.abs(sum-1)<1e-6);}
    const referenced=g.index?[...new Set(g.index.array)]:Array.from({length:normal.count},(_,i)=>i);for(const i of referenced)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(normal,i).length()-1)<1e-4);
   }
   for(const name of ['LeftShoulder','RightShoulder','LeftElbow','RightElbow','LeftHip','RightHip','LeftKnee','RightKnee','Head','Tail1','Tail2','Tail3'])assert.ok(report.coverage[name]>50,name+' must drive real body vertices');
   assert.equal(gltf.animations.length,0);assert.ok(gltf.scene.getObjectByName('Green_iris'));assert.ok(gltf.scene.getObjectByName('Pupil'));assert.ok(gltf.scene.getObjectByName('Muzzle_smile'));assert.ok(gltf.scene.getObjectByName('LeftToe1Tip_green_tip'));assert.ok(report.maxDisplacement<.01);
   const colors=body.geometry.attributes.color;let green=0;for(let i=0;i<colors.count;i++){for(let k=0;k<3;k++)assert.ok(colors.getComponent(i,k)>=0&&colors.getComponent(i,k)<=1);if(colors.getY(i)>colors.getX(i)*1.5&&colors.getY(i)>colors.getZ(i)*1.4)green++;}assert.ok(green>1000,'source green markings survive normalized color conversion');
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
   assert.deepEqual(second.scene.getObjectByName('LeftEye')?.parent?.name,'Head');assert.equal(loadedRig.bones.length,hierarchy.length);
  }finally{disposeModel(gltf.scene);if(second)disposeModel(second.scene);}
 });
}
