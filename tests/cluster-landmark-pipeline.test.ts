import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { createUnclassifiedClusterManifest } from '../src/cluster-inventory.ts';
import { proposeClusterManifestFrom2DObservations } from '../src/cluster-landmark-pipeline.ts';
import type { Landmark2DObservation, LandmarkCameraCalibration } from '../src/cluster-landmark-projection.ts';

function camera(viewId:string,position:Vector3,target:Vector3):LandmarkCameraCalibration {
 const rotation=new Quaternion().setFromUnitVectors(new Vector3(0,0,1),target.clone().sub(position).normalize());
 return {viewId,fx:1,fy:1,cx:.5,cy:.5,cameraToWorld:new Matrix4().compose(position,rotation,new Vector3(1,1,1)).toArray()};
}
function observe(point:Vector3,c:LandmarkCameraCalibration):Landmark2DObservation {
 const p=point.clone().applyMatrix4(new Matrix4().fromArray([...c.cameraToWorld]).invert());
 return {avatarId:'pakachi',formId:'animal-form',poseId:'front-neutral',landmarkId:'torso-center',partId:'torso',x:c.fx*p.x/p.z+c.cx,y:c.fy*p.y/p.z+c.cy,confidence:.95,camera:c,radiusWorld:1};
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
  meshWorld:new Matrix4().toArray(),avatarId:'pakachi',formId:'animal-form',poseId:'front-neutral',observations,
 },'2026-11-12T21:01:00.000Z');
 assert.ok(result.candidate);
 assert.equal(result.triangulation.seeds.length,1, JSON.stringify(result.triangulation));
 assert.equal(result.classifiedTriangles,1);
 assert.equal(result.unresolvedTriangles,0);
 assert.equal(result.candidate.assignments[0].partId,'torso');
});

test('refuses to classify one mesh from mixed avatar, form or pose observations',()=>{
 const {hash,meshId,current,positions}=fixture();
 const point=new Vector3(0,0,4);
 const a=camera('front',new Vector3(-1,0,0),point),b=camera('side',new Vector3(1,0,0),point);
 const observations=[observe(point,a),{...observe(point,b),poseId:'side-pose'}];
 assert.throws(()=>proposeClusterManifestFrom2DObservations({
  current,sourceAssetSha256:hash,meshId,positions,indices:null,
  meshWorld:new Matrix4().toArray(),avatarId:'pakachi',formId:'animal-form',poseId:'front-neutral',observations,
 }),/exactly one explicit avatar, form and pose/);
});

test('does not create a manifest candidate when 2D depth evidence is insufficient',()=>{
 const {hash,meshId,current,positions}=fixture();
 const point=new Vector3(0,0,4);
 const observations=[observe(point,camera('front',new Vector3(-1,0,0),point))];
 const result=proposeClusterManifestFrom2DObservations({
  current,sourceAssetSha256:hash,meshId,positions,indices:null,
  meshWorld:new Matrix4().toArray(),avatarId:'pakachi',formId:'animal-form',poseId:'front-neutral',observations,
 });
 assert.equal(result.candidate,null);
 assert.equal(result.classifiedTriangles,0);
 assert.equal(result.unresolvedTriangles,1);
 assert.match(result.triangulation.rejected[0].reason,/two calibrated views/);
});


test('maps triangulated world points through translated rotated non-uniform mesh transforms and encloses world evidence radius',()=>{
 const {hash,meshId,current,positions}=fixture();
 const meshWorld=new Matrix4().compose(
  new Vector3(3,-2,1),
  new Quaternion().setFromEuler(new Euler(.2,.4,.1)),
  new Vector3(2,1,.5),
 );
 const localPoint=new Vector3(0,0,4);
 const worldPoint=localPoint.clone().applyMatrix4(meshWorld);
 const observations=[
  observe(worldPoint,camera('front',worldPoint.clone().add(new Vector3(-1,0,0)),worldPoint)),
  observe(worldPoint,camera('side',worldPoint.clone().add(new Vector3(1,0,0)),worldPoint)),
 ];
 const result=proposeClusterManifestFrom2DObservations({
  current,sourceAssetSha256:hash,meshId,positions,indices:null,meshWorld:meshWorld.toArray(),
  avatarId:'pakachi',formId:'animal-form',poseId:'front-neutral',observations,
 });
 assert.equal(result.triangulation.seeds.length,1, JSON.stringify(result.triangulation));
 const seed=result.triangulation.seeds[0]!;
 assert.ok(Math.abs(seed.position[0]-localPoint.x)<1e-6);
 assert.ok(Math.abs(seed.position[1]-localPoint.y)<1e-6);
 assert.ok(Math.abs(seed.position[2]-localPoint.z)<1e-6);
 assert.ok(Math.abs(seed.radius-2)<1e-6,'radius must use the smallest mesh scale (0.5)');
});

test('rejects projective matrices as mesh world transforms',()=>{
 const {hash,meshId,current,positions}=fixture();
 const point=new Vector3(0,0,4);
 const observations=[
  observe(point,camera('front',new Vector3(-1,0,0),point)),
  observe(point,camera('side',new Vector3(1,0,0),point)),
 ];
 const projective=new Matrix4(); projective.elements[3]=.01;
 assert.throws(()=>proposeClusterManifestFrom2DObservations({
  current,sourceAssetSha256:hash,meshId,positions,indices:null,meshWorld:projective.toArray(),
  avatarId:'pakachi',formId:'animal-form',poseId:'front-neutral',observations,
 }),/must be affine/);
});
