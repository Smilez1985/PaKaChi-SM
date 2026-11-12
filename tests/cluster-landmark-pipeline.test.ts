import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { createUnclassifiedClusterManifest } from '../src/cluster-inventory.ts';
import { proposeClusterManifestFrom2DObservations } from '../src/cluster-landmark-pipeline.ts';
import type { Landmark2DObservation, LandmarkCameraCalibration } from '../src/cluster-landmark-projection.ts';

function camera(viewId:string,position:Vector3,target:Vector3):LandmarkCameraCalibration {
 const rotation=new Quaternion().setFromUnitVectors(new Vector3(0,0,1),target.clone().sub(position).normalize());
 return {viewId,fx:1,fy:1,cx:.5,cy:.5,cameraToWorld:new Matrix4().compose(position,rotation,new Vector3(1,1,1)).toArray()};
}
function observe(point:Vector3,c:LandmarkCameraCalibration):Landmark2DObservation {
 const p=point.clone().applyMatrix4(new Matrix4().fromArray([...c.cameraToWorld]).invert());
 return {landmarkId:'torso-center',partId:'torso',x:c.fx*p.x/p.z+c.cx,y:c.fy*p.y/p.z+c.cy,confidence:.95,camera:c,radiusWorld:1};
}
function fixture() {
 const hash='c'.repeat(64),meshId='mesh-'+hash+'-walk0-mesh0-primitive0';
 const inventory={schemaVersion:1 as const,sourceAssetSha256:hash,meshes:[{id:meshId,sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:3,triangleCount:1}],totals:{meshes:1,vertices:3,triangles:1}};
 const current=createUnclassifiedClusterManifest(inventory,'animal','2026-11-12T21:00:00.000Z');
 current.parts=[{id:'torso',name:'Torso',parentPartId:null,orderKey:[1],rigBoneIds:[]}];
 return {hash,meshId,current,positions:new Float32Array([-.1,0,4,.1,0,4,0,.1,4])};
}

test('connects calibrated 2D observations through triangulation to a validated cluster manifest',()=>{
 const {hash,meshId,current,positions}=fixture();
 const point=new Vector3(0,0,4);
 const observations=[
  observe(point,camera('front',new Vector3(-1,0,0),point)),
  observe(point,camera('side',new Vector3(1,0,0),point)),
 ];
 const result=proposeClusterManifestFrom2DObservations({
  current,sourceAssetSha256:hash,meshId,positions,indices:null,
  meshWorld:new Matrix4().toArray(),observations,
 },'2026-11-12T21:01:00.000Z');
 assert.ok(result.candidate);
 assert.equal(result.triangulation.seeds.length,1);
 assert.equal(result.classifiedTriangles,1);
 assert.equal(result.unresolvedTriangles,0);
 assert.equal(result.candidate.assignments[0].partId,'torso');
});

test('does not create a manifest candidate when 2D depth evidence is insufficient',()=>{
 const {hash,meshId,current,positions}=fixture();
 const point=new Vector3(0,0,4);
 const observations=[observe(point,camera('front',new Vector3(-1,0,0),point))];
 const result=proposeClusterManifestFrom2DObservations({
  current,sourceAssetSha256:hash,meshId,positions,indices:null,
  meshWorld:new Matrix4().toArray(),observations,
 });
 assert.equal(result.candidate,null);
 assert.equal(result.classifiedTriangles,0);
 assert.equal(result.unresolvedTriangles,1);
 assert.match(result.triangulation.rejected[0].reason,/two calibrated views/);
});
