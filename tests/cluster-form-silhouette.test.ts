import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createUnclassifiedClusterManifest } from '../src/cluster-inventory.ts';
import type { ClusterMeshBinding, ClusterMeshInventory } from '../src/cluster-inventory.ts';
import { compareClusterFormSilhouette } from '../src/cluster-form-silhouette.ts';

const frame='avatar-root';
const camera={coordinateFrameId:frame,fx:.25,fy:.25,cx:.5,cy:.5,cameraToWorld:[
  1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,
]};
function fixture(){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,0,1,0],3));
 geometry.setIndex([0,1,2]);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());
 mesh.position.z=2;mesh.updateMatrixWorld(true);
 const inventory:ClusterMeshInventory={schemaVersion:1,sourceAssetSha256:'a'.repeat(64),meshes:[
  {id:'body-mesh',sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:3,triangleCount:1},
 ],totals:{meshes:1,vertices:3,triangles:1}};
 const manifest=createUnclassifiedClusterManifest(inventory,'animal','2026-11-28T00:00:00.000Z');
 const binding:ClusterMeshBinding={meshId:'body-mesh',mesh,geometry,positions:new Float64Array([-1,-1,0,1,-1,0,0,1,0]),indices:new Uint32Array([0,1,2]),meshWorld:mesh.matrixWorld.toArray()};
 const region={type:'polygon' as const,points:[{x:6,y:10},{x:10,y:10},{x:8,y:6}]};
 return {geometry,mesh,manifest,binding,region};
}

test('projects exact source mesh triangles into the calibrated image and reports pixel overlap',()=>{
 const f=fixture(),before=Array.from(f.geometry.getAttribute('position').array);
 const report=compareClusterFormSilhouette({manifest:f.manifest,bindings:[f.binding],camera,meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region:f.region});
 assert.equal(report.sourceAssetSha256,'a'.repeat(64));
 assert.equal(report.regionPixelCount,report.modelPixelCount);
 assert.equal(report.intersectionOverUnion,1);
 assert.equal(report.precision,1);
 assert.equal(report.recall,1);
 assert.equal(report.falsePositivePixelCount,0);
 assert.equal(report.falseNegativePixelCount,0);
 assert.deepEqual(Array.from(f.geometry.getAttribute('position').array),before);
 assert.equal(f.mesh.position.z,2);
});

test('rejects camera/model coordinate-frame mismatch and incomplete or foreign mesh bindings',()=>{
 const f=fixture();
 assert.throws(()=>compareClusterFormSilhouette({manifest:f.manifest,bindings:[f.binding],camera:{...camera,coordinateFrameId:'other'},meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region:f.region}),/coordinate frame/i);
 assert.throws(()=>compareClusterFormSilhouette({manifest:f.manifest,bindings:[],camera,meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region:f.region}),/missing/i);
 assert.throws(()=>compareClusterFormSilhouette({manifest:f.manifest,bindings:[{...f.binding,meshId:'foreign'}],camera,meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region:f.region}),/outside|missing/i);
 assert.throws(()=>compareClusterFormSilhouette({manifest:f.manifest,bindings:[f.binding,f.binding],camera,meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region:f.region}),/duplicate/i);
});

test('clips geometry behind the camera and reports a fully missed source silhouette',()=>{
 const f=fixture();f.mesh.position.z=-2;f.mesh.updateMatrixWorld(true);
 const report=compareClusterFormSilhouette({manifest:f.manifest,bindings:[f.binding],camera,meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region:f.region});
 assert.equal(report.modelPixelCount,0);
 assert.equal(report.intersectionOverUnion,0);
 assert.equal(report.recall,0);
});

test('supports polygon holes and rejects malformed source regions',()=>{
 const f=fixture();
 const region={type:'polygon' as const,points:[{x:0,y:0},{x:16,y:0},{x:16,y:16},{x:0,y:16}],holes:[[{x:7,y:7},{x:9,y:7},{x:9,y:9},{x:7,y:9}]]};
 const report=compareClusterFormSilhouette({manifest:f.manifest,bindings:[f.binding],camera,meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region});
 assert.ok(report.regionPixelCount>report.modelPixelCount);
 assert.throws(()=>compareClusterFormSilhouette({manifest:f.manifest,bindings:[f.binding],camera,meshCoordinateFrameId:frame,imageWidth:16,imageHeight:16,region:{type:'rectangle',x:15,y:0,width:2,height:2}}),/rectangle/i);
});
