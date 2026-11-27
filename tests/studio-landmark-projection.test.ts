import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCalibratedLandmarkObservations, createLandmarkCalibrationCoverageReport, createLandmarkTriangulationQualityReport } from '../src/studio-landmark-projection.ts';
import { validateImageReferenceDocument, type ImageReferenceDocument } from '../src/image-reference.ts';

const hash='a'.repeat(64);
function fixture():ImageReferenceDocument {
 return {
  format:'pakachi-image-reference',version:1,source:{sha256:hash,width:1000,height:500},
  regions:[{id:'front-region',label:'Front',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:0,y:0,width:400,height:500}},
   {id:'side-region',label:'Side',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:500,y:0,width:400,height:500}}],
  views:[{id:'front',label:'Front',regionIds:['front-region']},{id:'side',label:'Side',regionIds:['side-region']}],
  forms:[{id:'animal-form',label:'Animal',viewIds:['front','side']},{id:'work-form',label:'Work',viewIds:[]}],
  avatars:[{id:'pakachi',label:'PaKaChi',formIds:['animal-form','work-form']}],
  landmarks:[{id:'eye-left-front',correspondenceId:'eye-left',regionId:'front-region',partId:'head',poseId:'neutral',x:200,y:100,radiusPx:8},
   {id:'eye-left-side',correspondenceId:'eye-left',regionId:'side-region',partId:'head',poseId:'neutral',x:600,y:100,radiusPx:8}],
  cameraCalibrations:[
   {id:'cal-front',sourceImageSha256:hash,avatarId:'pakachi',formId:'animal-form',poseId:'neutral',viewId:'front',fx:1,fy:1,cx:.5,cy:.5,cameraToWorld:[1,0,0,0,0,1,0,0,0,0,1,0,-1,0,0,1]},
   {id:'cal-side',sourceImageSha256:hash,avatarId:'pakachi',formId:'animal-form',poseId:'neutral',viewId:'side',fx:1,fy:1,cx:.5,cy:.5,cameraToWorld:[1,0,0,0,0,1,0,0,0,0,1,0,1,0,0,1]},
  ],
 };
}

test('maps confirmed source-pixel landmarks only through matching image-bound view calibrations',()=>{
 const doc=fixture();
 const observations=createCalibratedLandmarkObservations(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:.12});
 assert.equal(observations.length,2);
 assert.deepEqual(observations.map(item=>[item.camera.viewId,item.x,item.y]),[['front',.2,.2],['side',.6,.2]]);
 assert.ok(observations.every(item=>item.confidence===1&&item.avatarId==='pakachi'&&item.formId==='animal-form'&&item.radiusWorld===.12));
});

test('does not borrow another form or pose calibration and rejects foreign image hashes',()=>{
 const doc=fixture();
 doc.regions.push({id:'work-region',label:'Work view',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:0,y:0,width:400,height:500}});
 doc.views.push({id:'work-front',label:'Work front',regionIds:['work-region']});
 doc.forms.find(item=>item.id==='work-form')!.viewIds.push('work-front');
 doc.cameraCalibrations=[{...doc.cameraCalibrations![0]!,formId:'work-form',viewId:'work-front'}];
 assert.equal(createCalibratedLandmarkObservations(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:.12}).length,0);
 doc.cameraCalibrations=fixture().cameraCalibrations!.map(item=>({...item,sourceImageSha256:'b'.repeat(64)}));
 assert.throws(()=>createCalibratedLandmarkObservations(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:.12}),/invalid-image-reference-document:cameraCalibrations/);
});

test('requires an explicit world-space evidence radius instead of converting pixel radii',()=>{
 const doc=fixture();
 assert.throws(()=>createCalibratedLandmarkObservations(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:0}),/explicit avatar, form and pose/);
});

test('image-reference validation rejects calibration outside its explicit hierarchy or with bad intrinsics',()=>{
 const doc=fixture();
 doc.cameraCalibrations![0]!.viewId='not-a-view';
 assert.ok(validateImageReferenceDocument(doc).some(issue=>issue.path==='cameraCalibrations[0].viewId'));
 const bad=fixture();bad.cameraCalibrations![0]!.fx=0;
 assert.ok(validateImageReferenceDocument(bad).some(issue=>issue.path==='cameraCalibrations[0].intrinsics'));
});

test('blocks reconstruction when any landmark or camera calibration violates document validation',()=>{
 const badLandmark=fixture();
 badLandmark.landmarks![0]!.x=1001;
 assert.throws(()=>createCalibratedLandmarkObservations(badLandmark,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:.12}),/invalid-image-reference-document:landmarks/);
 const badCamera=fixture();
 badCamera.cameraCalibrations![0]!.cameraToWorld[0]=2;
 assert.throws(()=>createCalibratedLandmarkObservations(badCamera,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:.12}),/invalid-image-reference-document:cameraCalibrations/);
});


test('reports per-landmark calibrated view coverage without claiming a valid depth solution',()=>{
 const doc=fixture();
 const report=createLandmarkCalibrationCoverageReport(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:.12});
 assert.equal(report.policy,'read-only');
 assert.equal(report.automaticCalibrationApplied,false);
 assert.equal(report.landmarkCount,1);
 assert.equal(report.calibratedViewCount,2);
 assert.equal(report.landmarksWithMultiViewCalibration,1);
 assert.deepEqual(report.items[0],{
  landmarkId:'eye-left',partId:'head',viewIds:['front','side'],
  calibratedViewIds:['front','side'],missingCalibrationViewIds:[],hasMultiViewCalibration:true,
 });
 doc.cameraCalibrations=doc.cameraCalibrations!.slice(0,1);
 const partial=createLandmarkCalibrationCoverageReport(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral',radiusWorld:.12});
 assert.equal(partial.calibratedViewCount,1);
 assert.equal(partial.landmarksWithOneCalibratedView,1);
 assert.equal(partial.landmarksWithMultiViewCalibration,0);
 assert.deepEqual(partial.items[0]!.missingCalibrationViewIds,['side']);
});

test('reports read-only triangulation quality, low view coverage and missing observations',()=>{
 const doc=fixture();
 doc.cameraCalibrations![1]!.fx=.5;
 doc.cameraCalibrations![1]!.cx=.8;
 const quality=createLandmarkTriangulationQualityReport(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral'});
 assert.equal(quality.policy,'read-only');
 assert.equal(quality.automaticCalibrationApplied,false);
 assert.equal(quality.triangulatedPositionsExported,false);
 assert.equal(quality.readyCount,1);
 assert.equal(quality.rejectedCount,0);
 assert.equal(quality.items[0]!.status,'ready');
 assert.ok(quality.items[0]!.parallaxDegrees!>=quality.thresholds.minParallaxDegrees);
 assert.ok(quality.items[0]!.rayErrorWorld!<=quality.thresholds.maxRayErrorWorld);
 assert.equal(quality.items[0]!.viewIds.length,2);
 const oneView=fixture();oneView.cameraCalibrations=oneView.cameraCalibrations!.slice(0,1);
 const rejected=createLandmarkTriangulationQualityReport(oneView,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral'});
 assert.equal(rejected.rejectedCount,1);
 assert.equal(rejected.items[0]!.status,'rejected');
 assert.match(rejected.items[0]!.reason!,/At least two calibrated views/);
 const none=fixture();none.cameraCalibrations=[];
 const missing=createLandmarkTriangulationQualityReport(none,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral'});
 assert.equal(missing.missingObservationCount,1);
 assert.equal(missing.items[0]!.status,'missing-observations');
});

