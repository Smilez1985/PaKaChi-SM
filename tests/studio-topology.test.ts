import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {detectJoints} from '../src/studio-detection.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {parseProject} from '../src/studio-data.ts';
import {exportMoveFile,importMoveFile} from '../src/move-file.ts';
function fixture(){
 const root=new T.Group(),hip=new T.Bone(),foot=new T.Bone();hip.name='Hip';foot.name='Foot';foot.position.y=2;hip.add(foot);root.add(hip);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([.1,0,0,.1,1.5,0,.1,2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([hip,foot]));const rig=new StudioRig(root);
 return {root,hip,foot,mesh,rig};
}
const project=(rig:StudioRig)=>({format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data});
const vertex=(mesh:T.SkinnedMesh,i:number)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
test('inserted knee is a real weighted bone, retains rest geometry, bends skin and reloads',()=>{
 const {rig,foot,hip,mesh}=fixture(),before=[0,1,2].map(i=>vertex(mesh,i)),point=rig.data.points[1];
 const joint=rig.insertJoint(point);assert.equal(rig.bones.length,3);assert.equal(foot.parent,rig.bones[2]);assert.equal(rig.bones[2].parent,hip);assert.equal(mesh.skeleton.bones.length,3);
 before.forEach((v,i)=>assert.ok(vertex(mesh,i).distanceTo(v)<1e-6));
 assert.equal(mesh.geometry.getAttribute('skinIndex').getX(1),2);assert.equal(mesh.geometry.getAttribute('skinWeight').getX(1),1);
 const target=new T.Vector3(1,1,0);rig.setPoint(point,target,new T.Quaternion(),false,'translate');assert.ok(rig.position(point).distanceTo(target)<1e-5);assert.ok(vertex(mesh,1).distanceTo(before[1])>.2);assert.ok(Math.abs(rig.position(joint).distanceTo(rig.position(point))-1)<1e-6);
 const saved=parseProject(project(rig)).studio,other=fixture();other.rig.data=saved;other.rig.reset();assert.equal(other.foot.parent,other.rig.bones[2]);before.forEach((v,i)=>assert.ok(vertex(other.mesh,i).distanceTo(v)<1e-6));
 rig.restoreSource();assert.equal(foot.parent,hip);assert.equal(mesh.skeleton.bones.length,2);assert.equal(mesh.geometry.getAttribute('skinIndex').getX(1),0);before.forEach((v,i)=>assert.ok(vertex(mesh,i).distanceTo(v)<1e-6));rig.reset();assert.equal(foot.parent,rig.bones[2]);rig.data.points=rig.data.points.filter(p=>p.id!==joint.id);assert.equal(detectJoints(rig)[0].bone,joint.bone);
});
test('existing poses preserve endpoint transforms, topology changes move compatibility and invalid edits fail',async()=>{
 const {rig}=fixture(),p=rig.data.points[1],old=rig.capture();rig.data.poses=[{id:'a',name:'A',seconds:1,values:old},{id:'b',name:'B',seconds:1,values:structuredClone(old)}];rig.data.moves=[{id:'m',name:'M',loop:false,poses:['a','b']}];const file=await exportMoveFile(project(rig),'m');
 const joint=rig.insertJoint(p);assert.ok(rig.data.poses.every(p=>p.values[joint.id]));rig.apply(rig.data.poses[0].values);assert.ok(rig.position(p).distanceTo(new T.Vector3(0,2,0))<1e-6);parseProject(project(rig));await assert.rejects(importMoveFile(file,project(rig)),/passt nicht/);
 const snapshot=structuredClone(rig.data);assert.throws(()=>rig.insertJoint(p,NaN));assert.deepEqual(rig.data,snapshot);
 const bad=project(rig);bad.studio=structuredClone(rig.data);bad.studio.boneInsertions![0].child=3;assert.throws(()=>parseProject(bad));
});
test('Studio insertion is one undo/redo step including skeleton, weights, poses and saved overlay',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const {rig,mesh,foot,hip}=fixture(),host=document.createElement('div');const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onSelect:(_id:string)=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,project(rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();
 const click=(id:string)=>host.querySelector<HTMLButtonElement>('#'+id)!.click();click('pose-add');click('mode-rig');view.onSelect(rig.data.points[1].id);click('bone-insert');
 assert.equal(rig.data.points.length,3);assert.ok(rig.data.poses[0].review?.includes('bone-rest'));assert.equal(editor.exportProject().studio.boneInsertions?.length,1);
 click('studio-undo');assert.equal(rig.data.points.length,2);assert.equal(foot.parent,hip);assert.equal(mesh.skeleton.bones.length,2);assert.equal(rig.data.poses[0].review,undefined);
 click('studio-redo');assert.equal(rig.data.points.length,3);assert.equal(foot.parent,rig.bones[2]);assert.equal(mesh.skeleton.bones.length,3);parseProject(editor.exportProject());editor.dispose();w.happyDOM.abort();
});
test('Mika and Nori preserve skinned vertices through insertion, source restore and reconstructed project',async()=>{
 const {readFileSync}=await import('node:fs');const {parseModel,disposeModel}=await import('../src/viewer.ts');
 if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{constructor(type:string,init:Record<string,unknown>={}){super(type);Object.assign(this,init);}}});
 for(const name of ['mika','nori']){
  const bytes=readFileSync(new URL('../public/model-zoo/'+name+'/model.gltf',import.meta.url));const {scene}=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(scene);
  const surfaces=rig.surfaces.filter(s=>s.mesh instanceof T.SkinnedMesh),vertices=()=>surfaces.flatMap(s=>Array.from({length:s.mesh.geometry.getAttribute('position').count},(_,i)=>vertex(s.mesh as T.SkinnedMesh,i))),before=vertices();
  const child=rig.data.points.find(p=>p.name==='LeftFoot')!;const joint=rig.insertJoint(child);assert.ok(vertices().every((v,i)=>v.distanceTo(before[i])<1e-5));
  rig.setPoint(joint,rig.position(joint),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.5),false,'rotate');assert.ok(vertices().some((v,i)=>v.distanceTo(before[i])>.01));
  const data=structuredClone(rig.data),loaded=await parseModel(Uint8Array.from(bytes).buffer),again=new StudioRig(loaded.scene,data);assert.equal(again.bones.length,rig.bones.length);assert.equal(again.bones[child.bone!].parent,again.bones[joint.bone!]);
  rig.restoreSource();assert.ok(vertices().every((v,i)=>v.distanceTo(before[i])<1e-5));rig.dispose();again.dispose();disposeModel(scene);disposeModel(loaded.scene);
 }
});
test('successive insertions survive catalog export and recover the original weight arrays',async()=>{
 // @ts-expect-error CLI module is JavaScript and has no declaration file.
 const {zooPackage}=await import('../scripts/export-zoo.mjs');const {rig,mesh}=fixture(),sourceIndices=Array.from(mesh.geometry.getAttribute('skinIndex').array),sourceWeights=Array.from(mesh.geometry.getAttribute('skinWeight').array);
 const child=rig.data.points[1];rig.insertJoint(child);rig.insertJoint(child);rig.reset();assert.equal(mesh.skeleton.bones.length,4);
 const packed=JSON.parse(zooPackage(project(rig),'edited').project);assert.deepEqual(packed.studio.boneInsertions,rig.data.boneInsertions);parseProject(packed);
 const weights=mesh.geometry.getAttribute('skinWeight');for(let i=0;i<weights.count;i++)assert.ok(Math.abs([0,1,2,3].reduce((s,k)=>s+weights.getComponent(i,k),0)-1)<1e-6);
 rig.restoreSource();assert.deepEqual(Array.from(mesh.geometry.getAttribute('skinIndex').array),sourceIndices);assert.deepEqual(Array.from(mesh.geometry.getAttribute('skinWeight').array),sourceWeights);
});
