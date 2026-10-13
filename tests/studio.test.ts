import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { readFileSync } from 'node:fs';
import { parseModel, disposeModel } from '../src/viewer.ts';
import { StudioRig } from '../src/studio-rig.ts';
import { connectedPoints, parseProject, StudioHistory } from '../src/studio-data.ts';
import type { StudioProject, Transform } from '../src/studio-data.ts';
if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{constructor(type:string,init:Record<string,unknown>={}){super(type);Object.assign(this,init);}}});
async function fixture(){const bytes=readFileSync(new URL('../public/model-zoo/mika/model.gltf',import.meta.url));const gltf=await parseModel(Uint8Array.from(bytes).buffer);const holder=new T.Group();holder.scale.setScalar(1.1);holder.position.set(.2,-.1,.4);holder.add(gltf.scene);holder.updateMatrixWorld(true);return {root:gltf.scene,bytes};}
function vertices(mesh:T.Mesh){mesh.updateWorldMatrix(true,true);return Array.from({length:mesh.geometry.getAttribute('position').count},(_,i)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));}
function maxDistance(a:T.Vector3[],b:T.Vector3[]){return Math.max(...a.map((v,i)=>v.distanceTo(b[i])));}
test('editing a skeleton pivot preserves the skinned surface; posing rotates actual vertices; source binding restores',async()=>{
  const {root}=await fixture();const mesh=root.getObjectsByProperty('isSkinnedMesh',true)[0] as T.SkinnedMesh;const original=vertices(mesh);
  const rig=new StudioRig(root);assert.ok(maxDistance(original,vertices(mesh))<1e-6,'normalization must not change skin binding');
  const head=rig.data.points.find(p=>p.name==='Head')!;const position=rig.position(head).add(new T.Vector3(.05,0,0));
  rig.setPoint(head,position,rig.rotation(head),true);assert.ok(maxDistance(original,vertices(mesh))<1e-6,'rest-pivot edit preserves surface');
  rig.setPoint(head,position,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.5),false);
  assert.ok(maxDistance(original,vertices(mesh))>.1,'posing must visibly deform the mesh');
  rig.restoreSource();assert.ok(maxDistance(original,vertices(mesh))<1e-6);disposeModel(root);
});
test('independent facial points deform only their surface within their own radius, regardless of display size',()=>{
  const root=new T.Group();for(let i=0;i<2;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,.05,0,0,.8,0,0],3));root.add(new T.Mesh(g));}
  root.updateMatrixWorld(true);const rig=new StudioRig(root);const point={id:'mouth',name:'Mundwinkel',kind:'surface' as const,mesh:0,rest:[0,0,0] as [number,number,number],size:.003,radius:.2};rig.data.points.push(point);rig.reset();
  rig.setPoint(point,new T.Vector3(0,.1,0),new T.Quaternion(),false);
  const attr=rig.surfaces[0].mesh.geometry.getAttribute('position');assert.ok(Math.abs(attr.getY(0)-.1)<1e-6);assert.ok(attr.getY(1)>0);assert.equal(attr.getY(2),0);
  assert.equal(rig.surfaces[1].mesh.geometry.getAttribute('position').getY(0),0);
  point.size=.15;rig.apply(rig.capture());assert.ok(Math.abs(attr.getY(0)-.1)<1e-6);rig.reset();assert.equal(attr.getY(0),0);disposeModel(root);
});
test('poses interpolate real transforms, retain independent groups and survive a self-contained project round trip',async()=>{
  const {root,bytes}=await fixture();const rig=new StudioRig(root);const head=rig.data.points.find(p=>p.name==='Head')!;
  const first=rig.capture();rig.setPoint(head,rig.position(head),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.6),false);const last=rig.capture();
  rig.data.poses=[{id:'pose-a',name:'Ruhe',seconds:1,values:first},{id:'pose-b',name:'Neigen',seconds:2,values:last}];rig.data.moves=[{id:'neigen',name:'Neigen',loop:false,poses:['pose-a','pose-b']}];
  const mid=rig.sample(rig.data.moves[0],1)[head.id];assert.ok(Math.abs(new T.Quaternion().fromArray(first[head.id].rotation).angleTo(new T.Quaternion().fromArray(mid.rotation))-.3)<1e-6);
  assert.deepEqual(rig.sample(rig.data.moves[0],2)[head.id],last[head.id]);
  const project:StudioProject={format:'pakachi-studio',version:1,model:bytes.toString('base64'),avatar:{id:'mika',name:'Mika',description:'Test',moves:[]},studio:rig.data};
  const restored=parseProject(JSON.parse(JSON.stringify(project)));const second=await parseModel(Uint8Array.from(Buffer.from(restored.model,'base64')).buffer);const holder=new T.Group();holder.scale.setScalar(1.1);holder.position.set(.2,-.1,.4);holder.add(second.scene);holder.updateMatrixWorld(true);const loaded=new StudioRig(second.scene,restored.studio);
  loaded.apply(loaded.sample(loaded.data.moves[0],1));assert.ok(Math.abs(loaded.bones[head.bone!].quaternion.angleTo(new T.Quaternion().fromArray(mid.rotation)))<1e-6);
  const ids=rig.data.points.slice(0,4).map(p=>p.id);rig.data.links=[[ids[0],ids[1]],[ids[2],ids[3]]];assert.deepEqual([...connectedPoints(rig.data,ids[0])],[ids[0],ids[1]]);
  disposeModel(root);disposeModel(second.scene);
});
test('project validator rejects dangling links, malformed poses, duplicate moves and nonfinite values',()=>{
  const transform:Transform={position:[0,0,0],rotation:[0,0,0,1]};
  const base:StudioProject={format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:{points:[{id:'a',name:'A',kind:'surface',rest:[0,0,0],size:.01,radius:.1}],links:[],boneRest:[],poses:[{id:'pose-a',name:'A',seconds:1,values:{a:transform}},{id:'pose-b',name:'B',seconds:1,values:{a:transform}}],moves:[{id:'move',name:'Move',loop:false,poses:['pose-a','pose-b']}]}};
  assert.deepEqual(parseProject(base),base);
  for(const mutate of [(p:StudioProject)=>p.studio.links.push(['a','missing']),(p:StudioProject)=>p.studio.points[0].rest[0]=Infinity,(p:StudioProject)=>delete p.studio.poses[0].values.a,(p:StudioProject)=>p.studio.moves.push({...p.studio.moves[0]}),(p:StudioProject)=>p.studio.poses[0].values.a.rotation=[0,0,0,0]]){const copy=structuredClone(base);mutate(copy);assert.throws(()=>parseProject(copy));}
  const history=new StudioHistory<number[]>();history.push([1]);assert.deepEqual(history.undo([2]),[1]);assert.deepEqual(history.redo([1]),[2]);history.push([3]);assert.equal(history.canRedo,false);
});

test('a facial control follows the head skin and accepts displacement in the posed view',async()=>{
  const {root}=await fixture();const rig=new StudioRig(root);const mesh=rig.surfaces[0].mesh as T.SkinnedMesh;
  const head=rig.data.points.find(p=>p.name==='Head')!;const indices=mesh.geometry.getAttribute('skinIndex');const headBone=mesh.skeleton.bones.indexOf(rig.bones[head.bone!]);let index=0;while(indices.getX(index)!==headBone)index++;
  const rest=mesh.getVertexPosition(index,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
  const point={id:'eye',name:'Auge',kind:'surface' as const,mesh:0,rest:rest.toArray(),size:.005,radius:.05};rig.data.points.push(point);rig.reset();
  rig.setPoint(head,rig.position(head),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.5),false);
  const vertex=mesh.getVertexPosition(index,new T.Vector3()).applyMatrix4(mesh.matrixWorld);assert.ok(rig.position(point).distanceTo(vertex)<1e-6);
  const target=vertex.clone().add(new T.Vector3(.01,.02,0));rig.setPoint(point,target,new T.Quaternion(),false);assert.ok(rig.position(point).distanceTo(target)<1e-6);
  assert.ok(mesh.getVertexPosition(index,new T.Vector3()).applyMatrix4(mesh.matrixWorld).distanceTo(target)<1e-6);
  disposeModel(root);
});

test('whole-figure track translates skinned geometry and face controls exactly once and restores source clips',async()=>{
 const {root}=await fixture();const rig=new StudioRig(root),mesh=rig.surfaces[0].mesh as T.SkinnedMesh;const original=vertices(mesh);const head=rig.data.points.find(p=>p.name==='Head')!,headPosition=rig.position(head);
 const point={id:'free',name:'Frei',kind:'surface' as const,rest:[0,0,0] as [number,number,number],size:.01,radius:.1};rig.data.points.push(point);const attached={...point,id:'attached',mesh:0,rest:original[0].toArray()};rig.data.points.push(attached);rig.reset();
 const offset=new T.Vector3(.4,.8,-.2);rig.setPoint(rig.figure,rig.position(rig.figure).add(offset),new T.Quaternion(),false);
 assert.ok(maxDistance(original.map(v=>v.clone().add(offset)),vertices(mesh))<1e-6);assert.ok(rig.position(head).distanceTo(headPosition.clone().add(offset))<1e-6);assert.ok(rig.position(point).distanceTo(offset)<1e-6);assert.ok(rig.position(attached).distanceTo(original[0].clone().add(offset))<1e-6);
 const snapshot=rig.capture();rig.reset();rig.apply(snapshot);assert.ok(maxDistance(original.map(v=>v.clone().add(offset)),vertices(mesh))<1e-6);
 rig.restoreSource();assert.ok(maxDistance(original,vertices(mesh))<1e-6);assert.deepEqual(rig.capture()['$figure'].position,[0,0,0]);disposeModel(root);
});
test('boneless model track interpolates, persists, validates and reads pre-track projects',()=>{
 const holder=new T.Group();holder.rotation.z=.3;holder.scale.set(2,3,1);const root=new T.Group();root.position.set(.1,.2,0);holder.add(root);root.add(new T.Mesh(new T.BoxGeometry()));holder.updateMatrixWorld(true);const rig=new StudioRig(root);const first=rig.capture();rig.setFigureOffset(new T.Vector3(1,2,0));const last=rig.capture();
 rig.data.poses=[{id:'a',name:'A',seconds:1,values:first},{id:'b',name:'B',seconds:2,values:last}];rig.data.moves=[{id:'slide',name:'Slide',loop:false,poses:['a','b']}];rig.apply(rig.sample(rig.data.moves[0],1));assert.deepEqual(rig.capture()['$figure'].position,[.5,1,0]);
 const expected=new T.Vector3(.1,.2,0).applyMatrix4(holder.matrixWorld).add(new T.Vector3(.5,1,0));assert.ok(root.getWorldPosition(new T.Vector3()).distanceTo(expected)<1e-6);
 const project:StudioProject={format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data};assert.deepEqual(parseProject(JSON.parse(JSON.stringify(project))),project);
 const old=structuredClone(project);old.studio.poses.forEach(p=>delete p.values['$figure']);assert.doesNotThrow(()=>parseProject(old));rig.data=old.studio;rig.apply(rig.sample(rig.data.moves[0],1));assert.deepEqual(rig.capture()['$figure'].position,[0,0,0]);
 for(const bad of [Infinity,NaN]){const copy=structuredClone(project);copy.studio.poses[0].values['$figure'].position[0]=bad;assert.throws(()=>parseProject(copy));}
 const invalid=structuredClone(project);invalid.studio.poses[0].values['$figure'].rotation=[0,2,0,0];assert.throws(()=>parseProject(invalid));disposeModel(root);
});

test('whole rotation moves skinned vertices and attached controls around the model center and restores original clips',async()=>{
 const {root}=await fixture();const rig=new StudioRig(root),mesh=rig.surfaces[0].mesh as T.SkinnedMesh;const initial=vertices(mesh),center=rig.position(rig.figure);const face={id:'attached',name:'Face',kind:'surface' as const,mesh:0,rest:initial[0].toArray(),size:.01,radius:.1};rig.data.points.push(face);const free={...face,id:'free'};delete (free as {mesh?:number}).mesh;rig.data.points.push(free);rig.reset();
 const angle=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2),offset=new T.Vector3(.3,.2,-.1);rig.setPoint(rig.figure,center.clone().add(offset),angle,false);
 const expected=initial.map(v=>v.clone().sub(center).applyQuaternion(angle).add(center).add(offset));assert.ok(maxDistance(expected,vertices(mesh))<1e-6);assert.ok(rig.position(face).distanceTo(expected[0])<1e-6);assert.ok(rig.position(free).distanceTo(expected[0])<1e-6);assert.ok(rig.rotation(rig.figure).angleTo(angle)<1e-6);
 const target=expected[0].clone().add(new T.Vector3(0,.03,0));rig.setPoint(face,target,new T.Quaternion(),false);assert.ok(rig.position(face).distanceTo(target)<1e-6,'face control remains editable after full-body rotation');
 rig.restoreSource();assert.equal(root.matrixAutoUpdate,true);assert.ok(maxDistance(initial,vertices(mesh))<1e-6);assert.deepEqual(rig.capture()['$figure'].rotation,[0,0,0,1]);disposeModel(root);
});
test('whole rotation retains exact geometry under nonuniform parents and round-trips interpolated poses',()=>{
 const holder=new T.Group();holder.scale.set(2,3,1);holder.rotation.z=.4;const root=new T.Group();root.position.set(.2,.3,.1);root.rotation.x=.2;holder.add(root);const mesh=new T.Mesh(new T.BoxGeometry());root.add(mesh);holder.updateMatrixWorld(true);const rig=new StudioRig(root),initial=vertices(mesh),center=rig.position(rig.figure),first=rig.capture();
 const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2);rig.setFigureTransform(new T.Vector3(),q);assert.ok(maxDistance(initial.map(v=>v.clone().sub(center).applyQuaternion(q).add(center)),vertices(mesh))<1e-6);
 rig.data.poses=[{id:'a',name:'A',seconds:1,values:first},{id:'b',name:'B',seconds:2,values:rig.capture()}];rig.data.moves=[{id:'turn',name:'Turn',loop:false,poses:['a','b']}];
 const project:StudioProject={format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data};const saved=parseProject(JSON.parse(JSON.stringify(project)));rig.data=saved.studio;rig.reset();rig.apply(rig.sample(rig.data.moves[0],1));const half=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/4);assert.ok(rig.rotation(rig.figure).angleTo(half)<1e-6);assert.ok(maxDistance(initial.map(v=>v.clone().sub(center).applyQuaternion(half).add(center)),vertices(mesh))<1e-6);
 rig.reset();assert.ok(maxDistance(initial,vertices(mesh))<1e-6);disposeModel(root);
});
