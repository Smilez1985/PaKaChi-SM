import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { triangulateLandmarkSeeds, type Landmark2DObservation, type LandmarkCameraCalibration } from '../src/cluster-landmark-projection.ts';

function camera(viewId:string, position:Vector3, target:Vector3):LandmarkCameraCalibration {
  const direction=target.clone().sub(position).normalize();
  const rotation=new Quaternion().setFromUnitVectors(new Vector3(0,0,1),direction);
  const transform=new Matrix4().compose(position,rotation,new Vector3(1,1,1));
  return {viewId,fx:1,fy:1,cx:0.5,cy:0.5,cameraToWorld:transform.toArray()};
}
function project(point:Vector3, calibration:LandmarkCameraCalibration) {
  const worldToCamera=new Matrix4().fromArray([...calibration.cameraToWorld]).invert();
  const p=point.clone().applyMatrix4(worldToCamera);
  return {x:calibration.fx*p.x/p.z+calibration.cx,y:calibration.fy*p.y/p.z+calibration.cy};
}
function observation(landmarkId:string,partId:string,point:Vector3,calibration:LandmarkCameraCalibration):Landmark2DObservation {
  return {...project(point,calibration),landmarkId,partId,confidence:0.98,camera:calibration,radiusWorld:0.4};
}

test('triangulates calibrated multi-view 2D landmarks into mesh-local 3D seeds',()=>{
  const point=new Vector3(0.2,0.1,4);
  const a=camera('front',new Vector3(-1,0,0),point);
  const b=camera('side',new Vector3(1,0,0),point);
  const meshWorld=new Matrix4().makeTranslation(0.1,-0.2,0.3).toArray();
  const report=triangulateLandmarkSeeds([
    observation('shoulder-left','left_arm',point,a),
    observation('shoulder-left','left_arm',point,b),
  ],meshWorld);
  assert.equal(report.rejected.length,0);
  assert.equal(report.seeds.length,1);
  const seed=report.seeds[0];
  assert.ok(Math.abs(seed.position[0]-0.1)<1e-6);
  assert.ok(Math.abs(seed.position[1]-0.3)<1e-6);
  assert.ok(Math.abs(seed.position[2]-3.7)<1e-6);
  assert.ok(seed.parallaxDegrees>3);
  assert.ok(seed.confidence>0.5);
  assert.equal(seed.viewCount,2);
});

test('rejects single-view, low-parallax and inconsistent multi-view evidence',()=>{
  const point=new Vector3(0,0,5);
  const a=camera('front',new Vector3(-0.01,0,0),point);
  const b=camera('nearby',new Vector3(0.01,0,0),point);
  const c=camera('side',new Vector3(1,0,0),point);
  const d=camera('top',new Vector3(0,1,0),point);
  const single=triangulateLandmarkSeeds([observation('eye','head',point,a)],new Matrix4().toArray());
  assert.match(single.rejected[0].reason,/two calibrated views/);
  const low=triangulateLandmarkSeeds([observation('nose','head',point,a),observation('nose','head',point,b)],new Matrix4().toArray());
  assert.match(low.rejected[0].reason,/baseline is too small/);
  const inconsistent=observation('ear','head',point,d);
  inconsistent.x=Math.min(1,inconsistent.x+0.2);
  const bad=triangulateLandmarkSeeds([
    observation('ear','head',point,a),observation('ear','head',point,c),inconsistent,
  ],new Matrix4().toArray(),{maxRayErrorWorld:0.001});
  assert.match(bad.rejected[0].reason,/residual/);
});

test('rejects intersections behind a calibrated camera',()=>{
  const point=new Vector3(0,0,5);
  const facingAway=camera('backwards',new Vector3(0,0,6),new Vector3(0,0,7));
  const facingPoint=camera('front',new Vector3(-1,0,0),point);
  const report=triangulateLandmarkSeeds([
    observation('eye','head',point,facingAway),
    observation('eye','head',point,facingPoint),
  ],new Matrix4().toArray());
  assert.equal(report.seeds.length,0);
  assert.match(report.rejected[0].reason,/behind at least one camera/);
});

test('rejects malformed calibration, duplicate views and singular mesh transforms',()=>{
  const point=new Vector3(0,0,3);
  const a=camera('front',new Vector3(-1,0,0),point);
  const b=camera('side',new Vector3(1,0,0),point);
  assert.throws(()=>triangulateLandmarkSeeds([
    observation('eye','head',point,a),observation('eye','head',point,{...b,viewId:'front'})
  ],new Matrix4().toArray()),/one observation per calibrated view/);
  assert.throws(()=>triangulateLandmarkSeeds([
    observation('eye','head',point,{...a,fx:0}),observation('eye','head',point,b)
  ],new Matrix4().toArray()),/intrinsics/);
  assert.throws(()=>triangulateLandmarkSeeds([
    observation('eye','head',point,a),observation('eye','head',point,b)
  ],new Matrix4().makeScale(0,1,1).toArray()),/singular/);
});
