import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createImageReferenceFormPairCropPlan,createImageReferenceGenerationManifest,planImageReferenceCrop} from '../src/image-reference-crop.ts';
import type {ImageReferenceDocument} from '../src/image-reference.ts';
import type {ImageReferenceRegion} from '../src/image-reference.ts';
const region=(geometry:ImageReferenceRegion['geometry']):ImageReferenceRegion=>({id:'region-1',label:'Test',kind:'view',status:'confirmed',geometry});
test('rectangle crop plan uses source pixel coordinates and rounds outward',()=>{
 assert.deepEqual(planImageReferenceCrop(region({type:'rectangle',x:10.2,y:20.8,width:30.1,height:40.1}),100,100),{x:10,y:20,width:31,height:41});
});
test('polygon crop plan preserves polygon points relative to its crop origin',()=>{
 assert.deepEqual(planImageReferenceCrop(region({type:'polygon',points:[{x:10.5,y:12.5},{x:40,y:15},{x:20,y:50}]}),100,100),{x:10,y:12,width:30,height:38,polygon:[{x:.5,y:.5},{x:30,y:3},{x:10,y:38}]});
});
test('crop planning rejects invalid image sizes and geometry outside the source',()=>{
 assert.throws(()=>planImageReferenceCrop(region({type:'rectangle',x:0,y:0,width:10,height:10}),0,100),/invalid-source-size/);
 assert.throws(()=>planImageReferenceCrop(region({type:'rectangle',x:90,y:0,width:20,height:10}),100,100),/invalid-region-geometry/);
 assert.throws(()=>planImageReferenceCrop(region({type:'polygon',points:[{x:1,y:1},{x:1,y:1},{x:1,y:1}]}),100,100),/invalid-region-geometry/);
});


test('polygon crop plans preserve interior rings in crop-local coordinates',()=>{
 const shape=region({type:'polygon',points:[{x:10,y:10},{x:90,y:10},{x:90,y:90},{x:10,y:90}],holes:[[{x:30,y:30},{x:30,y:50},{x:50,y:50},{x:50,y:30}]]});
 assert.deepEqual(planImageReferenceCrop(shape,100,100),{x:10,y:10,width:80,height:80,polygon:[{x:0,y:0},{x:80,y:0},{x:80,y:80},{x:0,y:80}],holes:[[{x:20,y:20},{x:20,y:40},{x:40,y:40},{x:40,y:20}]]});
});
test('crop planning rejects a hole outside the outer contour',()=>{
 const shape=region({type:'polygon',points:[{x:10,y:10},{x:90,y:10},{x:90,y:90},{x:10,y:90}],holes:[[{x:80,y:20},{x:100,y:20},{x:100,y:40},{x:80,y:40}]]});
 assert.throws(()=>planImageReferenceCrop(shape,100,100),/invalid-region-geometry/);
});
test('crop planning rejects self-intersecting polygon contours',()=>{
 assert.throws(()=>planImageReferenceCrop(region({type:'polygon',points:[{x:10,y:10},{x:80,y:80},{x:10,y:80},{x:80,y:10}]}),100,100),/invalid-region-geometry/);
});

test('generation manifest binds one confirmed crop to its explicit avatar, form and view',()=>{
 const document:ImageReferenceDocument={format:'pakachi-image-reference',version:1,source:{sha256:'a'.repeat(64),width:100,height:100},regions:[{id:'region-1',label:'Panda face',kind:'detail',status:'confirmed',geometry:{type:'polygon',points:[{x:10,y:10},{x:60,y:10},{x:60,y:60},{x:10,y:60}],holes:[[{x:25,y:25},{x:25,y:35},{x:35,y:35},{x:35,y:25}]]}}],views:[{id:'view-1',label:'Front',regionIds:['region-1']}],forms:[{id:'form-1',label:'Animal',viewIds:['view-1']}],avatars:[{id:'avatar-1',label:'PaKaChi',formIds:['form-1']}]};
 assert.deepEqual(createImageReferenceGenerationManifest(document,'region-1','b'.repeat(64)),{format:'pakachi-image-reference-generation',version:1,source:{sha256:'a'.repeat(64),width:100,height:100},selection:{regionId:'region-1',label:'Panda face',kind:'detail',avatar:{id:'avatar-1',label:'PaKaChi'},form:{id:'form-1',label:'Animal'},view:{id:'view-1',label:'Front'},crop:{x:10,y:10,width:50,height:50,sha256:'b'.repeat(64)},mask:{type:'polygon',vertices:4,holes:1}}});
 assert.throws(()=>createImageReferenceGenerationManifest(document,'missing','b'.repeat(64)),/image-reference-not-ready|image-reference-region-not-confirmed/);
});


function pairDocument():ImageReferenceDocument {
 return {
  format:'pakachi-image-reference',version:1,
  source:{sha256:'a'.repeat(64),width:400,height:200},
  regions:[
   {id:'animal-region',label:'Animal silhouette',kind:'view',status:'confirmed',geometry:{type:'polygon',points:[{x:10,y:10},{x:180,y:10},{x:180,y:190},{x:10,y:190}]}},
   {id:'work-region',label:'Work silhouette',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:210,y:10,width:180,height:180}},
  ],
  views:[
   {id:'animal-view',label:'Animal front',regionIds:['animal-region']},
   {id:'work-view',label:'Work front',regionIds:['work-region']},
  ],
  forms:[
   {id:'animal-form',label:'Tierform',viewIds:['animal-view']},
   {id:'work-form',label:'Arbeitsform',viewIds:['work-view']},
  ],
  avatars:[{id:'pakachi',label:'PaKaChi',formIds:['animal-form','work-form']}],
 };
}
test('composite reference produces two independently bounded form crops with explicit identities',()=>{
 const document=pairDocument();
 assert.deepEqual(createImageReferenceFormPairCropPlan(document,'pakachi',[
  {formId:'animal-form',regionId:'animal-region'},
  {formId:'work-form',regionId:'work-region'},
 ]),{
  format:'pakachi-image-reference-form-pair',version:1,
  source:{sha256:'a'.repeat(64),width:400,height:200},avatar:{id:'pakachi',label:'PaKaChi'},
  forms:[
   {region:{id:'animal-region',label:'Animal silhouette',kind:'view'},form:{id:'animal-form',label:'Tierform'},view:{id:'animal-view',label:'Animal front'},crop:{x:10,y:10,width:170,height:180,polygon:[{x:0,y:0},{x:170,y:0},{x:170,y:180},{x:0,y:180}]}},
   {region:{id:'work-region',label:'Work silhouette',kind:'view'},form:{id:'work-form',label:'Arbeitsform'},view:{id:'work-view',label:'Work front'},crop:{x:210,y:10,width:180,height:180}},
  ],
 });
});
test('composite split requires two distinct explicitly selected forms of the same avatar',()=>{
 const document=pairDocument();
 assert.throws(()=>createImageReferenceFormPairCropPlan(document,'pakachi',[
  {formId:'animal-form',regionId:'animal-region'},{formId:'animal-form',regionId:'work-region'},
 ]),/distinct-form-selections-required/);
 assert.throws(()=>createImageReferenceFormPairCropPlan(document,'missing',[
  {formId:'animal-form',regionId:'animal-region'},{formId:'work-form',regionId:'work-region'},
 ]),/unknown-image-reference-avatar/);
});
test('composite split rejects unconfirmed, detail-only and ambiguous regions',()=>{
 const document=pairDocument();
 document.regions[1]!.status='suggested';
 assert.throws(()=>createImageReferenceFormPairCropPlan(document,'pakachi',[
  {formId:'animal-form',regionId:'animal-region'},{formId:'work-form',regionId:'work-region'},
 ]),/invalid-image-reference-document/);
 document.regions[1]!.status='confirmed';document.regions[1]!.kind='detail';
 assert.throws(()=>createImageReferenceFormPairCropPlan(document,'pakachi',[
  {formId:'animal-form',regionId:'animal-region'},{formId:'work-form',regionId:'work-region'},
 ]),/form-region-must-be-main-view/);
 document.regions[1]!.kind='view';document.views[0]!.regionIds.push('work-region');
 assert.throws(()=>createImageReferenceFormPairCropPlan(document,'pakachi',[
  {formId:'animal-form',regionId:'animal-region'},{formId:'work-form',regionId:'work-region'},
 ]),/invalid-image-reference-document/);
});
