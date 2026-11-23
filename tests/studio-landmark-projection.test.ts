import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCalibratedLandmarkObservations } from '../src/studio-landmark-projection.ts';
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
  landmarks:[{id:'eye-left',regionId:'front-region',partId:'head',poseId:'neutral',x:200,y:100,radiusPx:8},
   {id:'eye-left',regionId:'side-region',partId:'head',poseId:'neutral',x:600,y:100,radiusPx:8}],
  cameraCalibrations:[
   {id:'cal-front',sourceImageSha256:hash,avatarId:'pakachi',formId:'animal-form',poseId:'neutral',viewId:'front',fx:1,fy:1,cx:.5,cy:.5,cameraToWorld:[1,0,0,0,0,1,0,0,0,0,1,0,-1,0,0,1]},
   {id:'cal-side',sourceImageSha256:hash,avatarId:'pakachi',formId:'animal-form',poseId:'neutral',viewId:'side',fx:1,fy:1,cx:.5,cy:.5,cameraToWorld:[1,0,0,0,0,1,0,0,0,0,1,0,1,0,0,1]},
  ],
 };
}

test('maps confirmed source-pixel landmarks only through matching image-bound view calibrations',()=>{
 const doc=fixture();
 const observations=createCalibratedLandmarkObservations(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral'});
 assert.equal(observations.length,2);
 assert.deepEqual(observations.map(item=>[item.camera.viewId,item.x,item.y]),[['front',.2,.2],['side',.6,.2]]);
 assert.ok(observations.every(item=>item.confidence===1&&item.avatarId==='pakachi'&&item.formId==='animal-form'));
});

test('does not borrow another form or pose calibration and rejects foreign image hashes',()=>{
 const doc=fixture();
 doc.cameraCalibrations=doc.cameraCalibrations!.map(item=>({...item,formId:'work-form'}));
 assert.equal(createCalibratedLandmarkObservations(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral'}).length,0);
 doc.cameraCalibrations=fixture().cameraCalibrations!.map(item=>({...item,sourceImageSha256:'b'.repeat(64)}));
 assert.throws(()=>createCalibratedLandmarkObservations(doc,{avatarId:'pakachi',formId:'animal-form',poseId:'neutral'}),/different source image/);
});

test('image-reference validation rejects calibration outside its explicit hierarchy or with bad intrinsics',()=>{
 const doc=fixture();
 doc.cameraCalibrations![0]!.viewId='not-a-view';
 assert.ok(validateImageReferenceDocument(doc).some(issue=>issue.path==='cameraCalibrations[0].viewId'));
 const bad=fixture();bad.cameraCalibrations![0]!.fx=0;
 assert.ok(validateImageReferenceDocument(bad).some(issue=>issue.path==='cameraCalibrations[0].intrinsics'));
});
