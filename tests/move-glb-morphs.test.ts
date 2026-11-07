import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import {FIGURE_TRACK} from '../src/studio-data.ts';
import type {StudioMove} from '../src/studio-data.ts';
import {exportMoveGLB,captureMoveGLB} from '../src/move-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
class BinaryReader {result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}}
Object.assign(globalThis,{FileReader:BinaryReader});
if(typeof globalThis.ProgressEvent==='undefined')Object.assign(globalThis,{ProgressEvent:class extends Event{constructor(type:string,options={}){super(type);Object.assign(this,options);}}});
const triangle=()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));g.computeVertexNormals();return g;};
function fixture(skinned:boolean,relative:boolean){
 const holder=new T.Group(),root=new T.Group(),base=new T.Bone(),tip=new T.Bone();holder.position.set(.2,-.1,.3);holder.scale.setScalar(.7);holder.add(root);tip.position.y=.5;base.add(tip);if(skinned)root.add(base);else{const hidden=new T.Bone();hidden.name='Hidden';hidden.visible=false;root.add(hidden);}
 const geometry=triangle();geometry.morphTargetsRelative=relative;geometry.morphAttributes.position=[new T.Float32BufferAttribute(relative?[.05,0,0,.05,0,0,.05,0,0]:[.05,0,0,1.05,0,0,.05,1,0],3)];
 if(skinned){const nz=Math.sqrt(.96);geometry.morphAttributes.normal=[new T.Float32BufferAttribute(relative?[.2,0,nz-1,.2,0,nz-1,.2,0,nz-1]:[.2,0,nz,.2,0,nz,.2,0,nz],3)];geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));}
 const mesh=skinned?new T.SkinnedMesh(geometry,new T.MeshStandardMaterial()):new T.Mesh(geometry,new T.MeshStandardMaterial());mesh.name='Face';mesh.morphTargetDictionary={'Native face':0};mesh.morphTargetInfluences![0]=.25;root.add(mesh);const other=new T.Mesh(triangle(),new T.MeshBasicMaterial());other.name='Other';other.position.z=.15;root.add(other);holder.updateMatrixWorld(true);if(mesh instanceof T.SkinnedMesh)mesh.bind(new T.Skeleton([base,tip]));const rig=new StudioRig(root);
 const rest=rig.surfaces[0].world[0].toArray(),globalRest=rig.surfaces[0].world[1].toArray();rig.data.points.push({id:'face',name:'Face',kind:'surface',mesh:0,rest:[...rest],size:.01,radius:1.5},{id:'global',name:'Global',kind:'surface',rest:[...globalRest],size:.01,radius:1.5});const a=rig.capture(),b=structuredClone(a);a.face.position[2]+=.03;b.face.position[0]+=.1;b.face.position[2]+=.15;b.global.position[1]-=.04;b[FIGURE_TRACK].position[0]=.2;b[FIGURE_TRACK].scale=1.2;if(skinned)b[rig.data.points.find(p=>p.bone===1)!.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.6).toArray();const c=structuredClone(b);if(skinned)c[rig.data.points.find(p=>p.bone===1)!.id].rotation=[0,0,0,1];
 rig.data.poses=[{id:'a',name:'A',seconds:.5,values:a},{id:'b',name:'B',seconds:1,values:b},{id:'c',name:'C',seconds:.5,values:c}];const move:StudioMove={id:'face-move',name:'Face move',loop:true,poses:['a','b','c','a']};rig.data.moves=[move];return {rig,mesh,other,move};
}
const normal=(mesh:T.Mesh,i:number)=>{const base=new T.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('normal'),i),value=base.clone();for(const [k,attr] of (mesh.geometry.morphAttributes.normal??[]).entries()){const target=new T.Vector3().fromBufferAttribute(attr,i);if(!mesh.geometry.morphTargetsRelative)target.sub(base);value.addScaledVector(target,mesh.morphTargetInfluences?.[k]??0);}return value.normalize();};
const vertices=(mesh:T.Mesh)=>[0,1,2].map(i=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));
test('surface GLB morphs reproduce scoped/global points with skinning, native morphs, repeated poses and loop closure',async()=>{
 for(const skinned of [false,true])for(const relative of [false,true]){
  const {rig,mesh,other,move}=fixture(skinned,relative);rig.apply(rig.data.poses[2].values);const values=rig.capture(),data=structuredClone(rig.data),before=[mesh,other].map(m=>Array.from(m.geometry.getAttribute('position').array)),native=[...mesh.morphTargetInfluences!];
  const bytes=await exportMoveGLB(rig,move);assert.deepEqual(rig.capture(),values);assert.deepEqual(rig.data,data);assert.deepEqual([mesh,other].map(m=>Array.from(m.geometry.getAttribute('position').array)),before);assert.deepEqual(mesh.morphTargetInfluences,native);
  const {scene,animations}=await parseModel(bytes),face=scene.getObjectByName('Face') as T.Mesh,second=scene.getObjectByName('Other') as T.Mesh;assert.equal(face.geometry.morphAttributes.position!.length,3);assert.equal(second.geometry.morphAttributes.position!.length,1);assert.equal(face.morphTargetDictionary!['Native face'],0);assert.equal(face instanceof T.SkinnedMesh,skinned);assert.equal(scene.getObjectByName('Hidden'),undefined);
  const mixer=new T.AnimationMixer(scene);mixer.clipAction(animations[0]).setLoop(T.LoopOnce,1).play();for(const time of [0,.25,.5,.75,1,1.25,1.5,1.75,2,2.5]){rig.apply(rig.sample(move,time));mixer.setTime(time);scene.updateMatrixWorld(true);for(const [source,target] of [[mesh,face],[other,second]])vertices(source).forEach((v,i)=>assert.ok(v.distanceTo(vertices(target)[i])<1e-5,`${skinned}, ${relative}, ${time}, ${i}: ${v.distanceTo(vertices(target)[i])}`));if(time===0||time===1)for(const [source,target] of [[mesh,face],[other,second]])for(let i=0;i<3;i++)assert.ok(normal(source,i).distanceTo(normal(target,i))<1e-5);assert.ok(Math.abs(face.morphTargetInfluences![0]-.25)<1e-6);}
  mixer.stopAllAction();rig.dispose();disposeModel(scene);
 }
});
test('morph budgets reject excessive target counts and memory before copying the figure',()=>{
 for(const [vertices,count,expected] of [[3,70,/Morph-Ziele/],[99999,32,/umfangreich/]] as const){
  const root=new T.Group(),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(vertices*3),3));const mesh=new T.Mesh(g,new T.MeshBasicMaterial());root.add(mesh);const rig=new StudioRig(root);rig.data.points=[{id:'face',name:'Face',kind:'surface',rest:[0,0,0],size:.01,radius:1}];rig.data.poses=Array.from({length:count},(_,i)=>({id:'p'+i,name:'P'+i,seconds:.1,values:{face:{position:[i/100,0,0] as [number,number,number],rotation:[0,0,0,1] as [number,number,number,number]}}}));const move:StudioMove={id:'large',name:'Large',loop:false,poses:rig.data.poses.map(p=>p.id)};const before=mesh.geometry.getAttribute('position');assert.throws(()=>captureMoveGLB(rig,move),expected);assert.equal(mesh.geometry.getAttribute('position'),before);rig.dispose();
 }
});
