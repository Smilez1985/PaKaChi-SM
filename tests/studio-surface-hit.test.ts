import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { studioSurfaceHitBarycentric } from '../src/studio-surface-hit.ts';

function triangle() {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial());
  mesh.position.set(2, 3, 4);
  mesh.rotation.set(.2, -.3, .1);
  mesh.scale.set(2, 1.5, .75);
  mesh.updateMatrixWorld(true);
  return mesh;
}

test('converts a transformed world-space hit to mesh-local barycentric coordinates', () => {
  const mesh = triangle();
  const local = new T.Vector3(.2, .3, 0);
  const world = mesh.localToWorld(local.clone());
  const weights = studioSurfaceHitBarycentric(mesh, {a:0,b:1,c:2}, world);
  assert.ok(weights);
  assert.ok(Math.abs(weights[0] - .5) < 1e-6);
  assert.ok(Math.abs(weights[1] - .2) < 1e-6);
  assert.ok(Math.abs(weights[2] - .3) < 1e-6);
  mesh.geometry.dispose();
  (mesh.material as T.Material).dispose();
});

test('rejects points outside the picked triangle and degenerate triangles', () => {
  const mesh = triangle();
  const outside = mesh.localToWorld(new T.Vector3(1.2, .3, 0));
  assert.equal(studioSurfaceHitBarycentric(mesh, {a:0,b:1,c:2}, outside), null);
  mesh.geometry.setAttribute('position', new T.Float32BufferAttribute([0,0,0, 1,0,0, 2,0,0], 3));
  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.updateMatrixWorld(true);
  const onLine = mesh.localToWorld(new T.Vector3(.5, 0, 0));
  assert.equal(studioSurfaceHitBarycentric(mesh, {a:0,b:1,c:2}, onLine), null);
  mesh.geometry.dispose();
  (mesh.material as T.Material).dispose();
});
