import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {parseProject} from '../src/studio-data.ts';
import {parseStudioCommand} from '../src/studio-command.ts';
import {exportMoveFile,importMoveFile} from '../src/move-file.ts';
function fixture(attachment=false){
 const root=new T.Group(),hip=new T.Bone(),left=new T.Bone(),foot=new T.Bone(),right=new T.Bone();hip.name='Hip';left.name='Left';foot.name='Foot';right.name='Right';
 hip.add(left,right);left.add(foot);left.position.set(-1,1,0);foot.position.set(0,1,0);right.position.set(1,1,0);root.add(hip);root.scale.setScalar(.7);
 const accessory=new T.Group(),ornament=new T.Mesh(new T.BoxGeometry(.2,.2,.2),new T.MeshBasicMaterial());accessory.name='Accessory';accessory.position.set(.2,.3,.1);accessory.rotation.set(.1,.2,.3);accessory.scale.set(1,2,.5);accessory.add(ornament);ornament.position.x=.1;if(attachment)foot.add(accessory);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,1,0,-1,2,0,1,1,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([1,0,0,0,2,0,0,0,3,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([hip,left,foot,right]));const rig=new StudioRig(root);
 const point=(name:string)=>rig.data.points.find(p=>p.name===name)!;
 const vertices=()=>[0,1,2].map(i=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));
 return {root,hip,left,foot,right,mesh,rig,point,vertices,accessory,ornament};
}
const project=(rig:StudioRig)=>({format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data});
const near=(a:T.Vector3[],b:T.Vector3[])=>a.forEach((v,i)=>assert.ok(v.distanceTo(b[i])<1e-6,`${i}: ${v.distanceTo(b[i])}`));
test('reparent preserves rest, rotated saved pose, draft, current skin and source restoration',()=>{
 const f=fixture(),{rig,left,right,foot,mesh}=f,rest=f.vertices(),weights=Array.from(mesh.geometry.getAttribute('skinWeight').array);
 left.quaternion.setFromAxisAngle(new T.Vector3(0,0,1),.4);right.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),-.3);rig.root.updateMatrixWorld(true);
 rig.setFigureTransform(new T.Vector3(.2,.1,0),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.5),1.3);
 const posed=f.vertices(),values=rig.capture();rig.data.poses=[{id:'a',name:'A',seconds:1,values:structuredClone(values)}];rig.data.draft=structuredClone(values);
 rig.reparentBone(f.point('Left'),f.point('Right'));assert.equal(left.parent,right);assert.equal(foot.parent,left);near(f.vertices(),posed);
 assert.deepEqual(Array.from(mesh.geometry.getAttribute('skinWeight').array),weights);
 rig.reset();near(f.vertices(),rest);rig.apply(rig.data.poses[0].values);near(f.vertices(),posed);rig.reset();rig.apply(rig.data.draft!);near(f.vertices(),posed);
 const other=fixture();other.rig.data=parseProject(project(rig)).studio;other.rig.reset();near(other.vertices(),rest);other.rig.apply(other.rig.data.poses[0].values);near(other.vertices(),posed);
 rig.restoreSource();assert.equal(left.parent,f.hip);near(f.vertices(),rest);rig.reset();assert.equal(left.parent,right);
});
test('reparent interleaves with insert/delete, catalog export and move binding',async()=>{
 // @ts-expect-error CLI module has no declarations.
 const {zooPackage}=await import('../scripts/export-zoo.mjs');
 const f=fixture(),{rig}=f,rest=f.vertices();rig.data.poses=[{id:'a',name:'A',seconds:1,values:rig.capture()},{id:'b',name:'B',seconds:1,values:rig.capture()}];rig.data.moves=[{id:'m',name:'M',loop:false,poses:['a','b']}];const old=await exportMoveFile(project(rig),'m');
 rig.reparentBone(f.point('Foot'),f.point('Right'));const inserted=rig.insertJoint(f.point('Foot'),.3);rig.reparentBone(inserted,f.point('Left'));rig.deleteBone(f.point('Right'));rig.reparentBone(f.point('Foot'),f.point('Hip'));rig.insertJoint(f.point('Foot'));
 near(f.vertices(),rest);const packed=JSON.parse(zooPackage(project(rig),'moved').project);assert.deepEqual(packed.studio.boneReparents,rig.data.boneReparents);
 const other=fixture();other.rig.data=parseProject(packed).studio;other.rig.reset();near(other.vertices(),rest);assert.deepEqual(Array.from(other.mesh.geometry.getAttribute('skinWeight').array),Array.from(f.mesh.geometry.getAttribute('skinWeight').array));
 assert.deepEqual(other.rig.bones.map(b=>other.rig.bones.indexOf(b.parent as T.Bone)),rig.bones.map(b=>rig.bones.indexOf(b.parent as T.Bone)));
 await assert.rejects(importMoveFile(old,project(rig)),/passt nicht/);
});
test('invalid reparent operations leave data, hierarchy and skin unchanged',()=>{
 const f=fixture(),{rig}=f,before=structuredClone(rig.data),rest=f.vertices();
 for(const [bone,parent] of [['Hip','Right'],['Left','Left'],['Left','Foot'],['Foot','Left']]){assert.throws(()=>rig.reparentBone(f.point(bone),f.point(parent)));assert.deepEqual(rig.data,before);near(f.vertices(),rest);}
 f.right.scale.setScalar(2);assert.throws(()=>rig.reparentBone(f.point('Foot'),f.point('Right')),/Skalierte/);f.right.scale.setScalar(1);
 const nested=new T.Group();nested.add(new T.Bone());f.foot.add(nested);assert.throws(()=>rig.reparentBone(f.point('Foot'),f.point('Right')),/eigenem Skelett/);f.foot.clear();
 const skinned=new T.SkinnedMesh();f.foot.add(skinned);assert.throws(()=>rig.reparentBone(f.point('Foot'),f.point('Right')),/eigenem Skelett/);f.foot.clear();
 f.hip.remove(f.right);f.root.add(f.right);assert.throws(()=>rig.reparentBone(f.point('Foot'),f.point('Right')),/Skelettbaum/);f.hip.add(f.right);rig.reset();assert.deepEqual(rig.data,before);near(f.vertices(),rest);
 for(const entry of [{bone:1,parent:1,after:0},{bone:2,parent:3,after:1},{bone:999,parent:3,after:0},{bone:2,parent:3,after:-1}]){const bad=project(rig);bad.studio={...structuredClone(before),boneReparents:[entry]};assert.throws(()=>parseProject(bad));}
 const cycle=structuredClone(before);cycle.boneReparents=[{bone:1,parent:2,after:0}];const other=fixture();other.rig.data=cycle;assert.throws(()=>other.rig.reset(),/Nachfahren/);
 const c={session:'test',expectedRevision:0,action:'reparent_bone',id:'bone-2',target:'bone-3'};assert.equal(parseStudioCommand(c).target,'bone-3');for(const target of [undefined,'$figure','bone-2'])assert.throws(()=>parseStudioCommand({...c,target}));
});
test('UI and guarded agent reparent are independent undo steps with pose review',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const f=fixture(true),{rig}=f,host=document.createElement('div'),view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onSelect:(_id:string)=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,project(rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();
 const click=(id:string)=>host.querySelector<HTMLButtonElement>('#'+id)!.click(),command=(id:string,target:string)=>({session:editor.session,expectedRevision:editor.inspect().revision,action:'reparent_bone',id,target});
 const foot=f.point('Foot').id,right=f.point('Right').id;assert.throws(()=>editor.execute(command(foot,right)),/freigegeben/);
 const grant=host.querySelector<HTMLInputElement>('#studio-agent-edit')!;grant.checked=true;grant.dispatchEvent(new w.Event('change') as unknown as Event);assert.throws(()=>editor.execute(command(foot,right)),/Modus/);
 click('pose-add');click('mode-rig');view.onSelect(foot);host.querySelector<HTMLSelectElement>('#bone-parent')!.value=right;click('bone-reparent');assert.equal(f.foot.parent,f.right);assert.ok(rig.data.poses[0].review?.includes('bone-rest'));click('studio-undo');assert.equal(f.foot.parent,f.left);click('studio-redo');assert.equal(f.foot.parent,f.right);
 const stale=command(foot,f.point('Hip').id);editor.execute(stale);assert.equal(f.foot.parent,f.hip);assert.throws(()=>editor.execute(stale),/Stand/);click('studio-undo');assert.equal(f.foot.parent,f.right);click('studio-undo');assert.equal(f.foot.parent,f.left);assert.equal(rig.data.poses[0].review,undefined);editor.dispose();w.happyDOM.abort();
});
test('Mika and Nori source bones retain all skinned vertices after reparent and reload',async()=>{
 const {readFileSync}=await import('node:fs');const {parseModel,disposeModel}=await import('../src/viewer.ts');
 if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{constructor(type:string,init:Record<string,unknown>={}){super(type);Object.assign(this,init);}}});
 for(const name of ['mika','nori']){
  const bytes=readFileSync(new URL('../public/model-zoo/'+name+'/model.gltf',import.meta.url)),{scene}=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(scene);
  const vertices=(r:StudioRig)=>r.surfaces.filter(s=>s.mesh instanceof T.SkinnedMesh).flatMap(s=>Array.from({length:s.mesh.geometry.getAttribute('position').count},(_,i)=>(s.mesh as T.SkinnedMesh).getVertexPosition(i,new T.Vector3()).applyMatrix4(s.mesh.matrixWorld)));
  const before=vertices(rig),foot=rig.data.points.find(p=>p.name==='LeftFoot')!,hip=rig.data.points.find(p=>p.name==='LeftHip')!;rig.reparentBone(foot,hip);near(vertices(rig),before);
  const loaded=await parseModel(Uint8Array.from(bytes).buffer),again=new StudioRig(loaded.scene,parseProject(project(rig)).studio);near(vertices(again),before);assert.equal(again.bones[foot.bone!].parent,again.bones[hip.bone!]);
  rig.dispose();again.dispose();disposeModel(scene);disposeModel(loaded.scene);
 }
});

test('rigid nested attachments retain world transforms in rest, poses, reload and source restoration',()=>{
 const f=fixture(true),{rig}=f;
 const matrices=()=>[f.accessory,f.ornament].map(n=>n.matrixWorld.clone());
 const close=(actual:T.Matrix4[],expected:T.Matrix4[])=>actual.forEach((m,i)=>m.elements.forEach((v,k)=>assert.ok(Math.abs(v-expected[i].elements[k])<1e-6)));
 const rest=matrices();f.left.rotation.z=.5;f.right.rotation.y=.3;rig.root.updateMatrixWorld(true);const posed=matrices();rig.data.poses=[{id:'a',name:'A',seconds:1,values:rig.capture()}];
 rig.reparentBone(f.point('Foot'),f.point('Right'));assert.equal(f.accessory.parent,f.foot);close(matrices(),posed);rig.reset();close(matrices(),rest);rig.apply(rig.data.poses[0].values);close(matrices(),posed);
 const other=fixture(true);other.rig.data=parseProject(project(rig)).studio;other.rig.reset();close([other.accessory.matrixWorld,other.ornament.matrixWorld],rest);other.rig.apply(other.rig.data.poses[0].values);close([other.accessory.matrixWorld,other.ornament.matrixWorld],posed);
 rig.reset();const old=f.ornament.getWorldPosition(new T.Vector3());f.right.rotation.z=.7;rig.root.updateMatrixWorld(true);assert.ok(f.ornament.getWorldPosition(new T.Vector3()).distanceTo(old)>.1);assert.equal(f.accessory.parent,f.foot);
 rig.restoreSource();close(matrices(),rest);assert.equal(f.foot.parent,f.left);rig.reset();assert.equal(f.foot.parent,f.right);assert.throws(()=>rig.deleteBone(f.point('Foot')),/Anbauteile/);
});

test('imported rigid glTF attachment is a plain mesh and survives reparenting and reconstruction',async()=>{
 const {readFileSync}=await import('node:fs');const {parseModel,disposeModel}=await import('../src/viewer.ts');
 const model=JSON.parse(readFileSync(new URL('../public/model-zoo/mika/model.gltf',import.meta.url),'utf8'));
 const mesh=structuredClone(model.meshes[0]);for(const p of mesh.primitives){delete p.attributes.JOINTS_0;delete p.attributes.WEIGHTS_0;}const meshIndex=model.meshes.length;model.meshes.push(mesh);
 const nodeIndex=model.nodes.length;model.nodes.push({name:'RigidAccessory',mesh:meshIndex,translation:[.08,.05,0],scale:[.1,.1,.1]});const foot=model.nodes.find((n:{name:string})=>n.name==='LeftFoot');foot.children=[...(foot.children??[]),nodeIndex];
 const bytes=new TextEncoder().encode(JSON.stringify(model)).buffer,{scene}=await parseModel(bytes),rig=new StudioRig(scene),accessory=scene.getObjectByName('RigidAccessory')!;
 let rigidMeshes=0;accessory.traverse(node=>{assert.ok(!(node instanceof T.SkinnedMesh));if(node instanceof T.Mesh)rigidMeshes++;});assert.ok(rigidMeshes>0);const before=accessory.matrixWorld.clone();
 rig.reparentBone(rig.data.points.find(p=>p.name==='LeftFoot')!,rig.data.points.find(p=>p.name==='LeftHip')!);accessory.matrixWorld.elements.forEach((v,i)=>assert.ok(Math.abs(v-before.elements[i])<1e-6));
 const loaded=await parseModel(bytes),again=new StudioRig(loaded.scene,parseProject(project(rig)).studio);loaded.scene.getObjectByName('RigidAccessory')!.matrixWorld.elements.forEach((v,i)=>assert.ok(Math.abs(v-before.elements[i])<1e-6));
 rig.dispose();again.dispose();disposeModel(scene);disposeModel(loaded.scene);
});
