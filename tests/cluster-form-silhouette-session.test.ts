import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createUnclassifiedClusterManifest } from '../src/cluster-inventory.ts';
import type { ClusterMeshBinding, ClusterMeshInventory } from '../src/cluster-inventory.ts';
import type { ImageReferenceDocument } from '../src/image-reference.ts';
import { compareSelectedClusterFormSilhouette } from '../src/cluster-form-silhouette-session.ts';

const frame='avatar-root';
const cameraToWorld=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function fixture(){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,0,1,0],3));
 geometry.setIndex([0,1,2]);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.position.z=2;mesh.updateMatrixWorld(true);
 const inventory:ClusterMeshInventory={schemaVersion:1,sourceAssetSha256:'a'.repeat(64),meshes:[
  {id:'body-mesh',sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:3,triangleCount:1},
 ],totals:{meshes:1,vertices:3,triangles:1}};
 const manifest=createUnclassifiedClusterManifest(inventory,'animal','2026-11-28T00:00:00.000Z');
 const binding:ClusterMeshBinding={meshId:'body-mesh',mesh,geometry,positions:new Float64Array([-1,-1,0,1,-1,0,0,1,0]),indices:new Uint32Array([0,1,2]),meshWorld:mesh.matrixWorld.toArray()};
 const document:ImageReferenceDocument={
  format:'pakachi-image-reference',version:1,
  source:{sha256:'b'.repeat(64),width:16,height:16},
  regions:[{id:'region-animal',label:'Tierform',kind:'form',status:'confirmed',geometry:{type:'polygon',points:[{x:6,y:10},{x:10,y:10},{x:8,y:6}]}}],
  views:[{id:'view-front',label:'Front',regionIds:['region-animal']}],
  forms:[{id:'form-animal',label:'Tierform',viewIds:['view-front']}],
  avatars:[{id:'avatar-pakachi',label:'PaKaChi',formIds:['form-animal']}],
  cameraCalibrations:[{id:'cal-front',sourceImageSha256:'b'.repeat(64),avatarId:'avatar-pakachi',formId:'form-animal',poseId:'pose-neutral',viewId:'view-front',coordinateFrameId:frame,fx:.25,fy:.25,cx:.5,cy:.5,cameraToWorld}],
 };
 const selection={avatarId:'avatar-pakachi',formId:'form-animal',viewId:'view-front',regionId:'region-animal',poseId:'pose-neutral',targetForm:'animal' as const,meshCoordinateFrameId:frame};
 return {geometry,mesh,manifest,binding,document,selection};
}

test('resolves an exact confirmed avatar/form/view/region/pose calibration before comparing',()=>{
 const f=fixture();
 const report=compareSelectedClusterFormSilhouette({document:f.document,selection:f.selection,manifest:f.manifest,bindings:[f.binding]});
 assert.equal(report.sourceAssetSha256,f.manifest.sourceAssetSha256);
 assert.equal(report.coordinateFrameId,frame);
 assert.equal(report.intersectionOverUnion,1);
});

test('rejects unconfirmed, unlinked and helper regions',()=>{
 const f=fixture();
 f.document.regions[0]!.status='suggested';
 assert.throws(()=>compareSelectedClusterFormSilhouette({document:f.document,selection:f.selection,manifest:f.manifest,bindings:[f.binding]}),/confirmed/i);
 f.document.regions[0]!.status='confirmed';f.document.regions[0]!.kind='helper';
 assert.throws(()=>compareSelectedClusterFormSilhouette({document:f.document,selection:f.selection,manifest:f.manifest,bindings:[f.binding]}),/confirmed|helper/i);
 f.document.regions[0]!.kind='form';f.document.views[0]!.regionIds=[];
 assert.throws(()=>compareSelectedClusterFormSilhouette({document:f.document,selection:f.selection,manifest:f.manifest,bindings:[f.binding]}),/hierarchy/i);
});

test('rejects mismatched target form, missing or ambiguous calibration and coordinate frame',()=>{
 const f=fixture();
 assert.throws(()=>compareSelectedClusterFormSilhouette({document:f.document,selection:{...f.selection,targetForm:'humanoid'},manifest:f.manifest,bindings:[f.binding]}),/manifest form/i);
 const noCalibration={...f.document,cameraCalibrations:[]};
 assert.throws(()=>compareSelectedClusterFormSilhouette({document:noCalibration,selection:f.selection,manifest:f.manifest,bindings:[f.binding]}),/No exact camera calibration/i);
 const duplicate={...f.document,cameraCalibrations:[...f.document.cameraCalibrations!,{...f.document.cameraCalibrations![0]!,id:'cal-duplicate'}]};
 assert.throws(()=>compareSelectedClusterFormSilhouette({document:duplicate,selection:f.selection,manifest:f.manifest,bindings:[f.binding]}),/Invalid image reference document/i);
 assert.throws(()=>compareSelectedClusterFormSilhouette({document:f.document,selection:{...f.selection,meshCoordinateFrameId:'different'},manifest:f.manifest,bindings:[f.binding]}),/coordinate frame/i);
});
