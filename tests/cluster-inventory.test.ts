import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {collectClusterMeshInventory,createUnclassifiedClusterManifest,createClusterManifestFromGLTF} from '../src/cluster-inventory.ts';
import {validateClusterManifest} from '../src/cluster-architecture.ts';

const hash='a'.repeat(64);

test('inventories indexed and non-indexed GLTF mesh primitives without changing source geometry',()=>{
  const root=new THREE.Group();
  const indexed=new THREE.BufferGeometry();
  indexed.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, 1,0,0, 0,1,0, 1,1,0,
  ],3));
  indexed.setIndex([0,1,2,1,3,2]);
  const indexedPositions=indexed.getAttribute('position');
  const indexedIndices=indexed.index;
  const first=new THREE.Mesh(indexed,new THREE.MeshBasicMaterial());
  first.name='Body';
  const plain=new THREE.BufferGeometry();
  plain.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, 0,1,0, 0,0,1],3));
  const second=new THREE.Mesh(plain,new THREE.MeshBasicMaterial());
  root.add(first,second);

  const inventory=collectClusterMeshInventory(root,hash);
  assert.deepEqual(inventory.totals,{meshes:2,vertices:7,triangles:3});
  assert.deepEqual(inventory.meshes.map(m=>[m.sourceMeshIndex,m.primitiveIndex,m.vertexCount,m.triangleCount]),[
    [0,0,4,2],[1,0,3,1],
  ]);
  assert.equal(inventory.meshes[0].sourceMeshName,'Body');
  assert.equal(indexed.getAttribute('position'),indexedPositions);
  assert.equal(indexed.index,indexedIndices);
  assert.equal(indexed.index?.count,6);
});

test('inventory IDs are deterministic for the same source asset and traversal order',()=>{
  const make=()=>{const root=new THREE.Group();for(let i=0;i<2;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));root.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial()));}return root;};
  const first=collectClusterMeshInventory(make(),hash);
  const second=collectClusterMeshInventory(make(),hash);
  assert.deepEqual(first.meshes.map(m=>m.id),second.meshes.map(m=>m.id));
  assert.notEqual(first.meshes[0].id,first.meshes[1].id);
});

test('rejects invalid hashes, empty geometry and incomplete triangles',()=>{
  assert.throws(()=>collectClusterMeshInventory(new THREE.Group(),'bad'),/SHA-256/);
  assert.throws(()=>collectClusterMeshInventory(new THREE.Group(),hash),/no triangle meshes/);
  const root=new THREE.Group(),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,1,1,0],3));
  geometry.setIndex([0,1,2,0]);
  root.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()));
  assert.throws(()=>collectClusterMeshInventory(root,hash),/complete triangles/);
});

test('creates a complete manifest without guessing anatomical assignments',()=>{
  const root=new THREE.Group();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, 1,0,0, 0,1,0, 1,1,0,
  ],3));
  geometry.setIndex([0,1,2,1,3,2]);
  root.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()));
  const inventory=collectClusterMeshInventory(root,hash);
  const manifest=createUnclassifiedClusterManifest(inventory,'animal','2026-11-12T14:00:00.000Z');
  assert.deepEqual(validateClusterManifest(manifest),[]);
  assert.equal(manifest.assignments.length,2);
  assert.ok(manifest.assignments.every(a=>a.partId===null&&a.surfaceLayerId===null&&a.confidence===0));
  assert.ok(manifest.assignments.every(a=>a.reason.includes('unclassified')));
  assert.equal(manifest.form,'animal');
});

test('preserves original GLTF node, mesh and primitive associations',()=>{
  const scene=new THREE.Group();
  const sourceNode=new THREE.Group();
  sourceNode.name='CharacterRoot';
  scene.add(sourceNode);
  const associations=new Map<THREE.Object3D,unknown>();
  associations.set(sourceNode,{nodes:12});
  for(const primitiveIndex of [0,1]){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([
      0,0,0, 1,0,0, 0,1,0,
    ],3));
    const primitive=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());
    sourceNode.add(primitive);
    associations.set(primitive,{meshes:7,primitives:primitiveIndex});
  }
  const inventory=collectClusterMeshInventory({
    scene,
    parser:{associations},
  },hash);
  assert.deepEqual(inventory.meshes.map(m=>[m.sourceNodeIndex,m.sourceNodeName,m.sourceMeshIndex,m.primitiveIndex]),[
    [12,'CharacterRoot',7,0],
    [12,'CharacterRoot',7,1],
  ]);
  assert.notEqual(inventory.meshes[0].id,inventory.meshes[1].id);
  assert.ok(inventory.meshes.every(m=>m.sourceNodePath?.includes('CharacterRoot')));
});

test('parsed GLTF entry point combines provenance inventory and unresolved coverage',()=>{
  const scene=new THREE.Group(),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
  scene.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()));
  const manifest=createClusterManifestFromGLTF({scene},hash,'humanoid','2026-11-12T15:00:00.000Z');
  assert.equal(manifest.form,'humanoid');
  assert.equal(manifest.meshes.length,1);
  assert.equal(manifest.assignments.length,1);
  assert.deepEqual(validateClusterManifest(manifest),[]);
});
