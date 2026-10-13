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
