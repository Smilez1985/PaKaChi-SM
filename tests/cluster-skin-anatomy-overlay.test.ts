import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { collectClusterSkinOverlay, collectClusterSkinOverlayFromBindings } from '../src/cluster-skin-anatomy-overlay.ts';
import type { ClusterManifest } from '../src/cluster-architecture.ts';

const hash='a'.repeat(64);
function fixture(indexed=true): {root:THREE.Group;manifest:ClusterManifest;mesh:THREE.Mesh}{
  const root=new THREE.Group(),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
  if(indexed)geometry.setIndex([0,1,2]);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());
  mesh.userData.pakachiClusterMeshId='mesh-a';mesh.userData.pakachiClusterSourceAssetSha256=hash;
  root.add(mesh);
  const manifest:ClusterManifest={schemaVersion:1,form:'animal',sourceAssetSha256:hash,algorithmId:'test',algorithmVersion:'1.0.0',generatedAt:new Date().toISOString(),revision:0,
    parts:[{id:'torso',name:'Torso',parentPartId:null,orderKey:[1],rigBoneIds:[]}],layers:[],meshes:[{id:'mesh-a',sourceMeshIndex:0,sourceMeshName:'not-an-identity',primitiveIndex:0,vertexCount:3,triangleCount:1,sourceNodePath:'root/mesh'}],
    assignments:[{meshId:'mesh-a',triangleIndex:0,partId:'torso',surfaceLayerId:null,origin:'automatic',policy:'recomputable',confidence:.8,reason:'clear'}],overrides:[]};
  return {root,manifest,mesh};
}
test('collects indexed and non-indexed triangles by stable identity without mutating source geometry',()=>{
  for(const indexed of [true,false]){
    const {root,manifest,mesh}=fixture(indexed),before=mesh.geometry.getAttribute('position').array.slice();
    const report=collectClusterSkinOverlay(root,manifest);
    assert.equal(report.triangles.length,1);assert.equal(report.triangles[0].state,'automatic');
    assert.deepEqual([...mesh.geometry.getAttribute('position').array],[...before]);
    assert.equal(report.missingMeshIds.length,0);
  }
});
test('reports missing stable identities instead of guessing by mesh name or order',()=>{
  const {root,manifest}=fixture();root.children[0].userData={};
  const report=collectClusterSkinOverlay(root,manifest);
  assert.deepEqual(report.missingMeshIds,['mesh-a']);assert.equal(report.triangles.length,0);
});
test('rejects stale source hashes and duplicate mesh identities',()=>{
  const stale=fixture();stale.mesh.userData.pakachiClusterSourceAssetSha256='b'.repeat(64);
  assert.throws(()=>collectClusterSkinOverlay(stale.root,stale.manifest),/stale|identity/i);
  const duplicate=fixture(),copy=duplicate.mesh.clone();duplicate.root.add(copy);
  assert.throws(()=>collectClusterSkinOverlay(duplicate.root,duplicate.manifest),/duplicate|identity/i);
});
test('transforms indexed triangle vertices into current world space',()=>{
  const {root,manifest,mesh}=fixture();mesh.position.set(2,3,4);
  const report=collectClusterSkinOverlay(root,manifest);
  assert.deepEqual(report.triangles[0].positions,[2,3,4,3,3,4,2,4,4]);
});


test('builds a candidate overlay from resolved source bindings without live identity markers',()=>{
  const {root,manifest,mesh}=fixture();
  mesh.userData={};
  mesh.position.set(2,3,4);
  root.updateMatrixWorld(true);
  const position=mesh.geometry.getAttribute('position');
  const binding={
    meshId:'mesh-a',mesh,geometry:mesh.geometry,
    positions:new Float64Array([0,0,0,1,0,0,0,1,0]),
    indices:new Uint32Array([0,1,2]),meshWorld:mesh.matrixWorld.toArray(),
  };
  const report=collectClusterSkinOverlayFromBindings([binding],manifest);
  assert.equal(report.triangles.length,1);
  assert.deepEqual(report.missingMeshIds,[]);
  assert.equal(report.triangles[0].meshId,'mesh-a');
  assert.deepEqual(report.triangles[0].positions,[2,3,4,3,3,4,2,4,4]);
  assert.equal(mesh.userData.pakachiClusterMeshId,undefined);
  assert.equal(position.count,3);
});

test('binding overlay rejects duplicate, foreign and incomplete source bindings',()=>{
  const {mesh,manifest}=fixture();
  const binding={meshId:'mesh-a',mesh,geometry:mesh.geometry,positions:new Float64Array(9),indices:new Uint32Array([0,1,2]),meshWorld:mesh.matrixWorld.toArray()};
  assert.throws(()=>collectClusterSkinOverlayFromBindings([binding,binding],manifest),/duplicate/i);
  assert.throws(()=>collectClusterSkinOverlayFromBindings([{...binding,meshId:'foreign'}],manifest),/outside|missing/i);
  assert.deepEqual(collectClusterSkinOverlayFromBindings([],manifest).missingMeshIds,['mesh-a']);
});
