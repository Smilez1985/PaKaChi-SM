import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {captureRiggedFigure,disposeStaticFigure,exportRiggedFigureGLB} from '../src/figure-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
class BinaryReader {result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}}
Object.assign(globalThis,{FileReader:BinaryReader});
if(typeof globalThis.ProgressEvent==='undefined')Object.assign(globalThis,{ProgressEvent:class extends Event{constructor(type:string,options={}){super(type);Object.assign(this,options);}}});
function fixture(){
 const parent=new T.Group(),root=new T.Group(),base=new T.Bone(),tip=new T.Bone();parent.scale.setScalar(.7);parent.position.set(.2,-.1,.3);parent.add(root);root.position.set(.1,.2,0);base.name='Base';tip.name='Tip';tip.position.y=1;base.add(tip);root.add(base);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,.2,1.2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));const mesh=new T.SkinnedMesh(geometry,new T.MeshStandardMaterial());mesh.name='Skin';root.add(mesh);parent.updateMatrixWorld(true);mesh.bind(new T.Skeleton([base,tip]));tip.rotation.z=.4;tip.position.x=.1;parent.updateMatrixWorld(true);return {root,mesh,tip};
}
const vertices=(mesh:T.SkinnedMesh)=>Array.from({length:3},(_,i)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));
const near=(a:T.Vector3[],b:T.Vector3[])=>a.forEach((v,i)=>assert.ok(v.distanceTo(b[i])<1e-5,`vertex ${i}: ${v.distanceTo(b[i])}`));
test('rig snapshot owns geometry, materials and skeleton while preserving world-space skin',()=>{
 const {root,mesh,tip}=fixture(),before=vertices(mesh),snapshot=captureRiggedFigure(root),skin=snapshot.getObjectByName('Skin') as T.SkinnedMesh;
 near(vertices(skin),before);assert.notEqual(skin.skeleton,mesh.skeleton);assert.notEqual(skin.geometry,mesh.geometry);assert.notEqual(skin.material,mesh.material);assert.notEqual(skin.skeleton.bones[1],tip);assert.notEqual(skin.skeleton.boneInverses[0],mesh.skeleton.boneInverses[0]);
 let sourceDisposals=0;mesh.geometry.addEventListener('dispose',()=>sourceDisposals++);(mesh.material as T.Material).addEventListener('dispose',()=>sourceDisposals++);skin.skeleton.bones[1].position.x+=.5;snapshot.updateMatrixWorld(true);assert.ok(vertices(skin)[2].distanceTo(before[2])>.1);near(vertices(mesh),before);disposeStaticFigure(snapshot);assert.equal(sourceDisposals,0);
});
test('rigged GLB roundtrip retains current deformation and can still move its skin',async()=>{
 const {root,mesh}=fixture(),before=vertices(mesh),bytes=await exportRiggedFigureGLB(root),{scene}=await parseModel(bytes);scene.updateMatrixWorld(true);const skin=scene.getObjectByName('Skin') as T.SkinnedMesh;assert.ok(skin instanceof T.SkinnedMesh);near(vertices(skin),before);skin.skeleton.bones[1].rotation.z+=.5;scene.updateMatrixWorld(true);assert.ok(vertices(skin)[2].distanceTo(before[2])>.01);near(vertices(mesh),before);disposeModel(scene);
});
test('unsupported rig capture fails without disposing the source',()=>{
 const {root,mesh,tip}=fixture();let disposed=0;mesh.geometry.addEventListener('dispose',()=>disposed++);tip.visible=false;assert.throws(()=>captureRiggedFigure(root),/Ausgeblendete/);tip.visible=true;tip.removeFromParent();assert.throws(()=>captureRiggedFigure(root),/außerhalb/);assert.equal(disposed,0);assert.throws(()=>captureRiggedFigure(new T.Group()),/kein exportierbares/);
});
test('edited Mika hierarchy and weights survive rigged GLB export',async()=>{
 const {readFile}=await import('node:fs/promises');const {StudioRig}=await import('../src/studio-rig.ts');
 const bytes=await readFile(new URL('../public/model-zoo/mika/model.gltf',import.meta.url)),{scene}=await parseModel(Uint8Array.from(bytes).buffer),holder=new T.Group();holder.scale.setScalar(.8);holder.position.set(.2,.1,-.1);holder.add(scene);holder.updateMatrixWorld(true);const rig=new StudioRig(scene);
 const knee=rig.data.points.find(p=>p.name==='LeftKnee')!,foot=rig.data.points.find(p=>p.name==='LeftFoot')!,added=rig.insertJoint(foot,.4);rig.transferWeights(knee,added,.25);rig.deleteBone(knee);rig.bones[added.bone!].rotation.x=.3;holder.updateMatrixWorld(true);
 const sample=(m:T.SkinnedMesh)=>[0,Math.floor(m.geometry.getAttribute('position').count/2),m.geometry.getAttribute('position').count-1].map(i=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld));
 const skins=rig.surfaces.map(s=>s.mesh).filter((m):m is T.SkinnedMesh=>m instanceof T.SkinnedMesh),before=skins.map(sample),exported=await exportRiggedFigureGLB(scene),loaded=await parseModel(exported);loaded.scene.updateMatrixWorld(true);
 skins.forEach((mesh,i)=>{const copy=loaded.scene.getObjectByName(mesh.name) as T.SkinnedMesh;assert.ok(copy instanceof T.SkinnedMesh);assert.equal(copy.skeleton.bones.length,mesh.skeleton.bones.length);near(sample(copy),before[i]);assert.deepEqual(Array.from(copy.geometry.getAttribute('skinWeight').array),Array.from(mesh.geometry.getAttribute('skinWeight').array));});
 skins.forEach((m,i)=>near(sample(m),before[i]));rig.dispose();disposeModel(scene);disposeModel(loaded.scene);
});
