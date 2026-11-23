import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {webcrypto} from 'node:crypto';
import {createStudioFormManifest} from '../src/studio-form-manifest.ts';
import {validateClusterManifest} from '../src/cluster-architecture.ts';
import {createPaKaChiSemanticCatalog} from '../src/cluster-2d-classifier.ts';

test('creates a form-labelled manifest bound to exact source bytes without anatomy guesses',async()=>{
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  const root=new THREE.Group();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
  root.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()));
  const source=Buffer.from('original GLB bytes').toString('base64');
  const manifest=await createStudioFormManifest(root,source,'animal','2026-11-23T08:00:00.000Z');
  const expected=await webcrypto.subtle.digest('SHA-256',Buffer.from('original GLB bytes'));
  const hash=Array.from(new Uint8Array(expected),value=>value.toString(16).padStart(2,'0')).join('');
  assert.equal(manifest.form,'animal');
  assert.equal(manifest.sourceAssetSha256,hash);
  assert.equal(manifest.assignments.length,1);
  assert.equal(manifest.assignments[0]?.partId,null);
  assert.equal(manifest.assignments[0]?.surfaceLayerId,null);
  assert.deepEqual(validateClusterManifest(manifest),[]);
});

test('rejects malformed source model encoding before inventory generation',async()=>{
  await assert.rejects(createStudioFormManifest(new THREE.Group(),'not base64','humanoid'),/gültiges Base64/);
});


test('exports the shared semantic taxonomy while keeping every source triangle unclassified',async()=>{
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  const root=new THREE.Group();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
  root.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()));
  const catalog=createPaKaChiSemanticCatalog();
  const manifest=await createStudioFormManifest(root,Buffer.from('catalog-bound model').toString('base64'),'humanoid','2026-11-23T08:25:00.000Z',catalog);
  assert.deepEqual(manifest.parts.map(part=>part.id),catalog.parts.map(part=>part.id));
  assert.deepEqual(manifest.layers.map(layer=>layer.id),catalog.surfaceLayers.map(layer=>layer.id));
  assert.equal(manifest.parts.find(part=>part.id==='head')?.parentPartId,'neck');
  assert.equal(manifest.layers.find(layer=>layer.id==='fur')?.partId,null);
  assert.ok(manifest.assignments.every(assignment=>assignment.partId===null&&assignment.surfaceLayerId===null&&assignment.origin==='imported'));
  assert.deepEqual(validateClusterManifest(manifest),[]);
});
