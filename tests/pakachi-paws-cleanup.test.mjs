import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {pruneDegenerateCapsuleFaces} from '../scripts/pakachi-paws.mjs';
import {auditMeshTopology} from '../src/mesh-topology-audit.ts';

test('generated paw capsule removes only its degenerate pole faces',()=>{
 for(const [radius,height] of [[.0065,.004],[.011,.014],[.009,.0001]]){
  const mesh=new T.CapsuleGeometry(radius,height,6,12);
  const initial=auditMeshTopology(mesh.attributes.position.array,mesh.index.array);
  assert.equal(initial.zeroAreaTriangles,24);
  const positions=Float32Array.from(mesh.attributes.position.array);
  const uv=Float32Array.from(mesh.attributes.uv.array);
  const normals=Float32Array.from(mesh.attributes.normal.array);
  const removed=pruneDegenerateCapsuleFaces(mesh);
  const after=auditMeshTopology(mesh.attributes.position.array,mesh.index.array);
  assert.equal(removed,initial.zeroAreaTriangles);
  assert.equal(after.zeroAreaTriangles,0);
  assert.equal(after.triangles,initial.triangles-removed);
  assert.deepEqual(mesh.attributes.position.array,positions);
  assert.deepEqual(mesh.attributes.uv.array,uv);
  assert.deepEqual(mesh.attributes.normal.array,normals);
  assert.equal(pruneDegenerateCapsuleFaces(mesh),0);
  mesh.dispose();
 }
});
