import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioView} from '../src/studio-view.ts';

test('studio topology marker points to a synthetic rest-space null face and clears without editing source geometry',()=>{
 const w=new Window();
 Object.assign(globalThis,{window:w,document:w.document});
 const source=new T.BufferGeometry();
 source.setAttribute('position',new T.Float32BufferAttribute([
  0,0,0, 1,0,0, 2,0,0,
  0,1,0, 1,1,0, 0,2,0
 ],3));
 source.setIndex([0,1,2, 3,4,5]);
 const originalPositions=Array.from(source.getAttribute('position').array);
 const originalIndices=Array.from(source.index!.array);
 const root=new T.Group();
 root.add(new T.Mesh(source,new T.MeshBasicMaterial()));
 root.updateMatrixWorld(true);
 const rig=new StudioRig(root);
 const canvas=document.createElement('canvas') as unknown as HTMLCanvasElement;
 const camera=new T.PerspectiveCamera(35,1,.01,100);
 const scene=new T.Scene();
 const orbit={enabled:true,target:new T.Vector3()};
 const view=new StudioView(rig,camera,canvas,orbit,scene);
 try{
  assert.equal(view.markRestTopology([{mesh:0,triangles:[0]}]),1);
  const markers=(view as unknown as {topologyMarkers:T.Group}).topologyMarkers;
  assert.equal(markers.children.length,1);
  const points=(markers.children[0] as T.Points).geometry.getAttribute('position');
  assert.equal(points.count,1);
  assert.deepEqual([points.getX(0),points.getY(0),points.getZ(0)],[1,0,0]);
  assert.deepEqual(Array.from(source.getAttribute('position').array),originalPositions);
  assert.deepEqual(Array.from(source.index!.array),originalIndices);
  view.clearTopologyMarkers();
  assert.equal(markers.children.length,0);
  assert.deepEqual(Array.from(source.getAttribute('position').array),originalPositions);
  assert.deepEqual(Array.from(source.index!.array),originalIndices);
 }finally{
  view.dispose();
  rig.dispose();
  w.happyDOM.abort();
 }
});
