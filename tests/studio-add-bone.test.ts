import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {parseStudioCommand} from '../src/studio-command.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {parseProject} from '../src/studio-data.ts';
function fixture(){
 const root=new T.Group(),hip=new T.Bone(),foot=new T.Bone();hip.name='Hip';foot.name='Foot';foot.position.y=2;hip.add(foot);root.add(hip);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([.1,0,0,.1,1.5,0,.1,2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([hip,foot]));const rig=new StudioRig(root);
 return {root,hip,foot,mesh,rig};
}
const project=(rig:StudioRig)=>({format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data});
const vertex=(mesh:T.SkinnedMesh,i:number)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
test('free branches preserve weights, gain explicit influence, and survive mixed edits and catalog reload',async()=>{
 const {rig,mesh}=fixture(),source=rig.data.points[0],weights=Array.from(mesh.geometry.getAttribute('skinWeight').array),before=[0,1,2].map(i=>vertex(mesh,i));
 rig.data.poses=[{id:'pose',name:'Pose',seconds:1,values:rig.capture()}];
 const branch=rig.addBone(source,new T.Vector3(1,1,0));assert.equal(rig.bones[branch.bone!].parent,rig.bones[0]);assert.deepEqual(Array.from(mesh.geometry.getAttribute('skinWeight').array),weights);before.forEach((v,i)=>assert.ok(vertex(mesh,i).distanceTo(v)<1e-6));
 const tip=rig.addBone(branch,new T.Vector3(2,1,0));assert.ok(rig.position(tip).distanceTo(new T.Vector3(2,1,0))<1e-6);assert.equal(mesh.skeleton.bones.length,4);
 rig.transferWeights(source,branch,.5);rig.setPoint(branch,rig.position(branch),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.5),false,'rotate');assert.ok(vertex(mesh,0).distanceTo(before[0])>.1);
 rig.reset();rig.insertJoint(tip,.3);rig.deleteBone(branch);const extra=rig.addBone(source,new T.Vector3(-1,1,0));assert.equal(rig.data.boneInsertions!.at(-1)!.afterDeletions,1);
 // @ts-expect-error JavaScript CLI module
 const {zooPackage}=await import('../scripts/export-zoo.mjs');const packed=JSON.parse(zooPackage(project(rig),'branches').project);parseProject(packed);
 const loaded=fixture();loaded.rig.data=packed.studio;loaded.rig.reset();assert.deepEqual(Array.from(loaded.mesh.geometry.getAttribute('skinWeight').array),Array.from(mesh.geometry.getAttribute('skinWeight').array));assert.ok(loaded.rig.position(loaded.rig.data.points.find(p=>p.id===extra.id)!).distanceTo(new T.Vector3(-1,1,0))<1e-6);
 rig.restoreSource();assert.equal(mesh.skeleton.bones.length,2);assert.deepEqual(Array.from(mesh.geometry.getAttribute('skinWeight').array),weights);
});
test('free bone placement validates parent and position atomically, including transformed parents',()=>{
 const {rig}=fixture(),p=rig.data.points[1];rig.data.boneRest[1].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.7).toArray();rig.reset();
 const child=rig.addBone(p,new T.Vector3(1,3,.4));assert.ok(rig.position(child).distanceTo(new T.Vector3(1,3,.4))<1e-6);
 for(const pos of [new T.Vector3(NaN,1,0),new T.Vector3(101,0,0),new T.Vector3().fromArray(p.rest)]){const data=structuredClone(rig.data),values=rig.capture();assert.throws(()=>rig.addBone(p,pos));assert.deepEqual(rig.data,data);assert.deepEqual(rig.capture(),values);}
 const bad=structuredClone(project(rig));Object.assign(bad.studio.boneInsertions![0],{child:1,ratio:.5});assert.throws(()=>parseProject(bad));
 for(const parent of [-1,99,1.5]){const bad=structuredClone(project(rig));bad.studio.boneInsertions![0]={parent};assert.throws(()=>parseProject(bad));}
});
test('mouse placement and agent addition each undo completely; agent requires permission and fresh revision',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const {rig,mesh}=fixture(),host=document.createElement('div');let action='';const view={setEnabled(){},setFigureEnabled(){},setAction(a:string){action=a;},setRotation(){},select(){},refresh(){},dispose(){},onSelect:(_id:string)=>{},onAdd:(_p:T.Vector3)=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,project(rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();const click=(id:string)=>host.querySelector<HTMLButtonElement>('#'+id)!.click();click('pose-add');click('mode-rig');view.onSelect(rig.data.points[0].id);click('bone-add');assert.equal(action,'add');view.onAdd(new T.Vector3(1,1,0));assert.equal(action,'select');assert.equal(rig.data.points.length,3);assert.ok(rig.data.poses[0].review?.includes('bone-rest'));parseProject(editor.exportProject());click('studio-undo');assert.equal(mesh.skeleton.bones.length,2);click('studio-redo');assert.equal(mesh.skeleton.bones.length,3);
 const command=()=>({session:editor.session,expectedRevision:editor.inspect().revision,action:'add_bone',id:rig.data.points[0].id,position:[-1,1,0]});assert.throws(()=>editor.execute(command()),/freigegeben/);
 const grant=host.querySelector<HTMLInputElement>('#studio-agent-edit')!;grant.checked=true;grant.dispatchEvent(new w.Event('change') as unknown as Event);const stale=command();const result=editor.execute(stale);assert.ok(result.id);assert.throws(()=>editor.execute(stale),/Stand/);click('studio-undo');assert.equal(mesh.skeleton.bones.length,3);
 assert.throws(()=>parseStudioCommand({...command(),position:undefined}));assert.throws(()=>parseStudioCommand({...command(),id:'$figure'}));editor.dispose();w.happyDOM.abort();
});
