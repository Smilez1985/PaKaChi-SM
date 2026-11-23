import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {webcrypto} from 'node:crypto';
import {createStudioFormManifest} from '../src/studio-form-manifest.ts';
import {validateClusterManifest} from '../src/cluster-architecture.ts';

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
