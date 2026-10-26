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
function fixture(){
 const root=new T.Group(),hip=new T.Bone(),arm=new T.Bone(),hand=new T.Bone();hip.add(arm);arm.add(hand);root.add(hip);arm.position.y=1;hand.position.y=1;
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([.1,0,0,.1,1.5,0,.1,2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,1,2,0,0,2,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,.8,.2,0,0,1,0,0,0],4));
 const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([hip,arm,hand]));const rig=new StudioRig(root),point=(bone:T.Bone)=>rig.data.points.find(p=>rig.bones[p.bone!]===bone)!;
 const vertices=()=>[0,1,2].map(i=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));return {root,hip,arm,hand,mesh,rig,point,vertices};
}
const project=(rig:StudioRig)=>({format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data});
const arrays=(mesh:T.SkinnedMesh)=>['skinIndex','skinWeight'].map(k=>Array.from(mesh.geometry.getAttribute(k).array));
const weight=(mesh:T.SkinnedMesh,v:number,bone:T.Bone)=>{const indices=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight');let sum=0;for(let k=0;k<4;k++)if(mesh.skeleton.bones[indices.getComponent(v,k)]===bone)sum+=weights.getComponent(v,k);return sum;};
test('weight transfer merges destination, preserves rest, changes posed skin and restores source',()=>{
 const f=fixture(),{rig,arm,hand,mesh}=f,rest=f.vertices(),original=arrays(mesh);rig.transferWeights(f.point(arm),f.point(hand),.5);
 assert.ok(Math.abs(weight(mesh,1,arm)-.4)<1e-6);assert.ok(Math.abs(weight(mesh,1,hand)-.6)<1e-6);assert.equal(weight(mesh,0,f.hip),1);assert.equal(weight(mesh,2,hand),1);
 rest.forEach((v,i)=>assert.ok(f.vertices()[i].distanceTo(v)<1e-6));hand.rotation.z=.8;rig.root.updateMatrixWorld(true);const changed=f.vertices()[1];rig.restoreSource();hand.rotation.z=.8;rig.root.updateMatrixWorld(true);assert.ok(f.vertices()[1].distanceTo(changed)>.05);assert.deepEqual(arrays(mesh),original);
 rig.reset();assert.ok(Math.abs(weight(mesh,1,hand)-.6)<1e-6);const other=fixture();other.rig.data=parseProject(project(rig)).studio;other.rig.reset();assert.deepEqual(arrays(other.mesh),arrays(mesh));
});
test('weight edits survive mixed topology, catalog packaging and invalidate old move binding',async()=>{
 // @ts-expect-error CLI module has no declarations.
 const {zooPackage}=await import('../scripts/export-zoo.mjs');const f=fixture(),{rig}=f;rig.data.poses=[{id:'a',name:'A',seconds:1,values:rig.capture()},{id:'b',name:'B',seconds:1,values:rig.capture()}];rig.data.moves=[{id:'m',name:'M',loop:false,poses:['a','b']}];const old=await exportMoveFile(project(rig),'m');
 rig.transferWeights(f.point(f.arm),f.point(f.hand),.25);const added=rig.insertJoint(f.point(f.hand));rig.transferWeights(f.point(f.hand),added,.2);rig.deleteBone(f.point(f.arm));rig.transferWeights(added,f.point(f.hip),.2);
 const packed=JSON.parse(zooPackage(project(rig),'weights').project);assert.deepEqual(packed.studio.weightTransfers,rig.data.weightTransfers);const other=fixture();other.rig.data=parseProject(packed).studio;other.rig.reset();assert.deepEqual(arrays(other.mesh),arrays(f.mesh));await assert.rejects(importMoveFile(old,project(rig)),/passt nicht/);
});
test('invalid weights or unavailable palettes reject atomically, schemas bound edits',()=>{
 const f=fixture(),{rig}=f,before=structuredClone(rig.data),original=arrays(f.mesh);for(const amount of [0,-.1,1.01,NaN,Infinity])assert.throws(()=>rig.transferWeights(f.point(f.arm),f.point(f.hand),amount));
 assert.throws(()=>rig.transferWeights(f.point(f.arm),f.point(f.arm),.5));assert.deepEqual(rig.data,before);assert.deepEqual(arrays(f.mesh),original);
 const command={session:'test',expectedRevision:0,action:'transfer_weights',id:'bone-1',target:'bone-2',amount:.5};assert.equal(parseStudioCommand(command).amount,.5);for(const amount of [undefined,0,'0.5',Infinity])assert.throws(()=>parseStudioCommand({...command,amount}));
 for(const entry of [{from:1,to:2,amount:0,after:0},{from:1,to:1,amount:.5,after:0},{from:1,to:2,amount:.5,after:1}])assert.throws(()=>parseProject({...project(rig),studio:{...rig.data,weightTransfers:[entry]}}));
 rig.transferWeights(f.point(f.arm),f.point(f.hand),1);const transferred=structuredClone(rig.data),weights=arrays(f.mesh);assert.throws(()=>rig.transferWeights(f.point(f.arm),f.point(f.hand),.5),/keinen/);assert.deepEqual(rig.data,transferred);assert.deepEqual(arrays(f.mesh),weights);
 // A bone can belong to the scene but be absent from one affected mesh palette.
 const g=fixture();g.mesh.skeleton.bones.pop();g.mesh.skeleton.boneInverses.pop();const fresh=new StudioRig(g.root),source=fresh.data.points[1],target=fresh.data.points[2],saved=structuredClone(fresh.data),skin=arrays(g.mesh);
 assert.throws(()=>fresh.transferWeights(source,target,.5),/Palette/);assert.deepEqual(fresh.data,saved);assert.deepEqual(arrays(g.mesh),skin);
});
test('five candidate influences are reduced deterministically to four normalized weights',()=>{
 const root=new T.Group(),bones=Array.from({length:5},()=>new T.Bone());root.add(bones[0]);bones[0].add(...bones.slice(1));const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,1,2,3],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([.4,.3,.2,.1],4));const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));const rig=new StudioRig(root);rig.transferWeights(rig.data.points[0],rig.data.points[4],.5);
 const values=mesh.geometry.getAttribute('skinWeight');assert.ok(Math.abs([0,1,2,3].reduce((n,k)=>n+values.getComponent(0,k),0)-1)<1e-6);assert.equal(weight(mesh,0,bones[3]),0);assert.ok(weight(mesh,0,bones[4])>0);const first=arrays(mesh);rig.reset();assert.deepEqual(arrays(mesh),first);
});
test('UI and agent weight changes are guarded, mark poses, and undo skin arrays exactly',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const f=fixture(),{rig}=f,host=document.createElement('div'),view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onSelect:(_id:string)=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,project(rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();const click=(id:string)=>host.querySelector<HTMLButtonElement>('#'+id)!.click();const command=()=>({session:editor.session,expectedRevision:editor.inspect().revision,action:'transfer_weights',id:f.point(f.arm).id,target:f.point(f.hand).id,amount:.5});const original=arrays(f.mesh);
 assert.throws(()=>editor.execute(command()),/freigegeben/);const grant=host.querySelector<HTMLInputElement>('#studio-agent-edit')!;grant.checked=true;grant.dispatchEvent(new w.Event('change') as unknown as Event);assert.throws(()=>editor.execute(command()),/Modus/);click('pose-add');click('mode-rig');view.onSelect(f.point(f.arm).id);host.querySelector<HTMLSelectElement>('#weight-target')!.value=f.point(f.hand).id;click('weight-transfer');assert.ok(rig.data.poses[0].review?.includes('skin-weights'));assert.ok(Math.abs(weight(f.mesh,1,f.hand)-.6)<1e-6);click('studio-undo');assert.deepEqual(arrays(f.mesh),original);assert.equal(rig.data.poses[0].review,undefined);click('studio-redo');assert.ok(Math.abs(weight(f.mesh,1,f.hand)-.6)<1e-6);const stale=command();editor.execute(stale);assert.throws(()=>editor.execute(stale),/Stand/);click('studio-undo');click('studio-undo');assert.deepEqual(arrays(f.mesh),original);editor.dispose();w.happyDOM.abort();
});
test('Mika weight transfer uses real palettes and retains all rest vertices after reload',async()=>{
 const {readFileSync}=await import('node:fs');const {parseModel,disposeModel}=await import('../src/viewer.ts');
 if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{constructor(type:string,init:Record<string,unknown>={}){super(type);Object.assign(this,init);}}});
 const bytes=Uint8Array.from(readFileSync(new URL('../public/model-zoo/mika/model.gltf',import.meta.url))).buffer,{scene}=await parseModel(bytes),rig=new StudioRig(scene);
 const meshes=rig.surfaces.filter(s=>s.mesh instanceof T.SkinnedMesh).map(s=>s.mesh as T.SkinnedMesh),vertices=()=>meshes.flatMap(m=>Array.from({length:m.geometry.getAttribute('position').count},(_,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld))),before=vertices();
 rig.transferWeights(rig.data.points.find(p=>p.name==='LeftKnee')!,rig.data.points.find(p=>p.name==='LeftFoot')!,.3,{center:[...rig.data.points.find(p=>p.name==='LeftKnee')!.rest],radius:.5});vertices().forEach((v,i)=>assert.ok(v.distanceTo(before[i])<1e-5));
 const loaded=await parseModel(bytes),again=new StudioRig(loaded.scene,parseProject(project(rig)).studio);assert.deepEqual(again.surfaces.filter(s=>s.mesh instanceof T.SkinnedMesh).map(s=>arrays(s.mesh as T.SkinnedMesh)),meshes.map(arrays));rig.dispose();again.dispose();disposeModel(scene);disposeModel(loaded.scene);
});
test('regional weight transfer uses original world-space sphere with smooth falloff and excludes outside vertices',async()=>{
 // @ts-expect-error CLI module has no declarations.
 const {zooPackage}=await import('../scripts/export-zoo.mjs');
 const make=()=>{const root=new T.Group(),a=new T.Bone(),b=new T.Bone();a.add(b);root.add(a);b.position.y=1;root.position.x=3;root.scale.setScalar(2);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,.5,0,0,2,0,0],3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Array(12).fill(0),4));g.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));const mesh=new T.SkinnedMesh(g,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([a,b]));return {rig:new StudioRig(root),mesh,a,b};};
 const {rig,mesh,b}=make(),region={center:[3,0,0] as [number,number,number],radius:2};
 rig.setFigureTransform(new T.Vector3(10,0,0),new T.Quaternion(),1.5);rig.transferWeights(rig.data.points[0],rig.data.points[1],.6,region);
 assert.ok(Math.abs(weight(mesh,0,b)-.6)<1e-6);assert.ok(Math.abs(weight(mesh,1,b)-.3)<1e-6);assert.equal(weight(mesh,2,b),0);assert.equal(rig.capture().$figure.scale,1.5);
 const original=arrays(mesh),packed=JSON.parse(zooPackage(project(rig),'regional').project);assert.deepEqual(packed.studio.weightTransfers[0].region,region);region.center[0]=99;rig.reset();assert.deepEqual(arrays(mesh),original);
 const other=make();other.rig.data=parseProject(packed).studio;other.rig.reset();assert.deepEqual(arrays(other.mesh),original);
});
test('regional transfers reject empty selections and malformed spheres without mutation',()=>{
 const f=fixture(),{rig}=f,before=structuredClone(rig.data),skin=arrays(f.mesh),command={session:'test',expectedRevision:0,action:'transfer_weights',id:'bone-1',target:'bone-2',amount:.5};
 for(const region of [{center:[0,0],radius:1},{center:[0,NaN,0],radius:1},{center:[0,0,0],radius:0},{center:[0,0,0],radius:3},{center:[0,0,0],radius:1,extra:true},null])assert.throws(()=>parseStudioCommand({...command,region}));
 assert.throws(()=>rig.transferWeights(f.point(f.arm),f.point(f.hand),.5,{center:[99,99,99],radius:.1}),/keinen/);assert.deepEqual(rig.data,before);assert.deepEqual(arrays(f.mesh),skin);
 const bad={...project(rig),studio:{...rig.data,weightTransfers:[{from:1,to:2,amount:.5,after:0,region:{center:[0,0,0],radius:-1}}]}};assert.throws(()=>parseProject(bad));
});

test('expanded weight budget applies incrementally without resetting pose and exactly matches replay',async()=>{
 const f=fixture(),{rig,mesh}=f;f.hand.rotation.z=.4;rig.root.updateMatrixWorld(true);const values=rig.capture(),skeleton=mesh.skeleton,indices=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight');
 const reset=rig.reset.bind(rig);let resets=0;rig.reset=()=>{resets++;reset();};
 for(let i=0;i<1024;i++)rig.transferWeights(f.point(f.arm),f.point(f.hand),.001);
 assert.equal(resets,0);assert.deepEqual(rig.capture(),values);assert.equal(mesh.skeleton,skeleton);assert.equal(mesh.geometry.getAttribute('skinIndex'),indices);assert.equal(mesh.geometry.getAttribute('skinWeight'),weights);
 const expected=arrays(mesh),snapshot=structuredClone(rig.data);assert.throws(()=>rig.transferWeights(f.point(f.arm),f.point(f.hand),.001),/1024/);assert.deepEqual(rig.data,snapshot);assert.deepEqual(arrays(mesh),expected);
 // @ts-expect-error JavaScript CLI module
 const {zooPackage}=await import('../scripts/export-zoo.mjs');const packed=JSON.parse(zooPackage(project(rig),'long-weights').project);assert.equal(packed.studio.weightTransfers.length,1024);parseProject(packed);const other=fixture();other.rig.data=packed.studio;other.rig.reset();assert.deepEqual(arrays(other.mesh),expected);
 const bad=structuredClone(packed);bad.studio.weightTransfers.push(bad.studio.weightTransfers[0]);assert.throws(()=>parseProject(bad),/Zu viele/);
});
