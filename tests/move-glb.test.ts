import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import {FIGURE_TRACK} from '../src/studio-data.ts';
import type {StudioMove} from '../src/studio-data.ts';
import {captureMoveGLB,exportMoveGLB,moveGLBTimes} from '../src/move-glb.ts';
import {disposeStaticFigure} from '../src/figure-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
class BinaryReader {result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}}
Object.assign(globalThis,{FileReader:BinaryReader});
if(typeof globalThis.ProgressEvent==='undefined')Object.assign(globalThis,{ProgressEvent:class extends Event{constructor(type:string,options={}){super(type);Object.assign(this,options);}}});
function fixture(shear=false){
 const holder=new T.Group(),root=new T.Group(),base=new T.Bone(),tip=new T.Bone();holder.scale.set(shear?2:.7,shear?1:.7,.7);holder.position.set(.2,-.1,.3);holder.add(root);if(shear)root.rotation.z=.4;base.name='Base';tip.name='Tip';tip.position.y=1;base.add(tip);root.add(base);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,.2,1.2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));const mesh=new T.SkinnedMesh(geometry,new T.MeshStandardMaterial());mesh.name='Skin';root.add(mesh);holder.updateMatrixWorld(true);mesh.bind(new T.Skeleton([base,tip]));const rig=new StudioRig(root);rig.insertJoint(rig.data.points.find(p=>p.name==='Tip')!,.4);
 const a=rig.capture(),b=structuredClone(a),id=rig.data.points.find(p=>p.name==='Tip')!.id;a[FIGURE_TRACK]={position:[.1,.2,0],rotation:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.2).toArray(),scale:1.1};b[FIGURE_TRACK]={position:[.5,.3,0],rotation:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.8).toArray(),scale:1.5};b[id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.7).toArray();
 rig.data.poses=[{id:'a',name:'A',seconds:.7,values:a},{id:'b',name:'B',seconds:1,values:b}];const move:StudioMove={id:'move',name:'Animated move',loop:true,poses:['a','b','a']};rig.data.moves=[move];return {root,mesh,rig,move};
}
const vertices=(mesh:T.SkinnedMesh)=>[0,1,2].map(i=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));
test('animated GLB reproduces bone poses, figure pivot/scale, repeated poses and loop closure after reload',async()=>{
 const {mesh,rig,move}=fixture();rig.apply(rig.data.poses[1].values);const before=rig.capture(),data=structuredClone(rig.data),positions=Array.from(mesh.geometry.getAttribute('position').array),bytes=await exportMoveGLB(rig,move);assert.deepEqual(rig.capture(),before);assert.deepEqual(rig.data,data);assert.deepEqual(Array.from(mesh.geometry.getAttribute('position').array),positions);
 const {scene,animations}=await parseModel(bytes);assert.equal(animations.length,1);assert.equal(animations[0].name,move.name);assert.ok(Math.abs(animations[0].duration-rig.duration(move))<1e-5);const skin=scene.getObjectByName('Skin') as T.SkinnedMesh,mixer=new T.AnimationMixer(scene);mixer.clipAction(animations[0]).setLoop(T.LoopOnce,1).play();
 for(const time of [0,1/30,.5,.515,1,1.2,1.7,2,2.4]){rig.apply(rig.sample(move,time));mixer.setTime(time);scene.updateMatrixWorld(true);vertices(mesh).forEach((v,i)=>assert.ok(v.distanceTo(vertices(skin)[i])<(time===.515?5e-4:1e-5),`${time}, ${i}: ${v.distanceTo(vertices(skin)[i])}`));}
 mixer.stopAllAction();rig.dispose();disposeModel(scene);
});
test('move export rejects missing point data, shear and excessive size without changing source',()=>{
 const {rig,move}=fixture(),values=rig.capture();const point=rig.data.points[0];delete rig.data.poses[1].values[point.id];assert.throws(()=>captureMoveGLB(rig,move),/Gelenkspuren/);assert.deepEqual(rig.capture(),values);rig.dispose();
 const f=fixture(true);assert.throws(()=>captureMoveGLB(f.rig,f.move),/Gescherten/);f.rig.data.poses[0].seconds=30;assert.throws(()=>moveGLBTimes(f.rig,{...f.move,poses:Array(100).fill('a')}),/umfangreich/);assert.throws(()=>moveGLBTimes(f.rig,{...f.move,poses:['a','missing']}),/vorhandene/);f.rig.dispose();
});

test('bones without control handles export their rest pose rather than an unrelated visible pose',()=>{
 const {rig,root,move}=fixture(),point=rig.data.points.find(p=>p.name==='Tip')!,bone=rig.bones[point.bone!],rest=rig.data.boneRest[point.bone!];rig.data.points=rig.data.points.filter(p=>p.id!==point.id);for(const pose of rig.data.poses)delete pose.values[point.id];bone.rotation.z=1.2;root.updateMatrixWorld(true);const before=bone.quaternion.clone();const {scene}=captureMoveGLB(rig,move),copy=scene.getObjectByName('Tip')!;assert.ok(copy.quaternion.angleTo(new T.Quaternion().fromArray(rest.rotation))<1e-7);assert.deepEqual(bone.quaternion.toArray(),before.toArray());disposeStaticFigure(scene);rig.dispose();
});
