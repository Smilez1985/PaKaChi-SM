import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {rotateCamera} from '../src/camera.ts';
test('view rotates around all three axes, including underside and roll, without moving the target',()=>{
  const target=new Vector3(0,1,0),camera=new PerspectiveCamera();camera.position.set(0,1,5);camera.lookAt(target);
  rotateCamera(camera,target,new Vector3(1,0,0),Math.PI/2);assert.ok(camera.position.y<target.y,'underside reachable');assert.ok(Math.abs(camera.position.distanceTo(target)-5)<1e-10);
  rotateCamera(camera,target,new Vector3(1,0,0),-Math.PI/2);rotateCamera(camera,target,new Vector3(0,1,0),Math.PI);assert.ok(camera.position.z<0,'back reachable');
  const position=camera.position.clone(),up=camera.up.clone();rotateCamera(camera,target,camera.getWorldDirection(new Vector3()),Math.PI/2);assert.ok(camera.position.distanceTo(position)<1e-10);assert.ok(Math.abs(up.dot(camera.up))<1e-10,'roll rotates up vector');assert.deepEqual(target.toArray(),[0,1,0]);
});

test('orbit keeps an off-center framing while rotating about the whole model, not the zoom target',async()=>{
 const T=await import('three');const {modelCenter,dragCamera}=await import('../src/camera.ts');
 const root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry(2,4,1)));root.position.set(.3,2,-.4);root.updateMatrixWorld(true);const pivot=modelCenter(root);
 const focus=pivot.clone().add(new Vector3(.7,1,0)),camera=new PerspectiveCamera(34,1,.01,100);camera.position.copy(focus).add(new Vector3(0,0,4));camera.lookAt(focus);camera.updateMatrixWorld(true);
 const before=pivot.clone().project(camera),radius=camera.position.distanceTo(pivot),focusDistance=camera.position.distanceTo(focus),matrix=root.matrixWorld.clone();
 for(let i=0;i<10;i++){const q=dragCamera(camera,pivot,{x:200+i*4,y:200},{x:204+i*4,y:205},{left:0,top:0,width:400,height:400},false)!;focus.sub(pivot).applyQuaternion(q).add(pivot);
  camera.lookAt(focus);camera.updateMatrixWorld(true);assert.ok(pivot.clone().project(camera).distanceTo(before)<1e-9,'panned framing must not snap');assert.ok(Math.abs(camera.position.distanceTo(pivot)-radius)<1e-9);assert.ok(Math.abs(camera.position.distanceTo(focus)-focusDistance)<1e-9);}
 assert.deepEqual(root.matrixWorld.elements,matrix.elements);assert.ok(modelCenter(root).distanceTo(pivot)<1e-9);root.position.x+=2;assert.ok(modelCenter(root).distanceTo(pivot.clone().add(new Vector3(2,0,0)))<1e-9);
});
