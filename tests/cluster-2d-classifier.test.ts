import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPaKaChiSemanticCatalog,imageReferenceLandmarksToCluster2DSeeds,proposeCluster2DRegionAssignments,removeCluster2DSemanticPart,removeCluster2DSurfaceLayer,upsertCluster2DSemanticPart,upsertCluster2DSurfaceLayer,validateCluster2DSemanticCatalog} from '../src/cluster-2d-classifier.ts';
import type {ImageReferenceDocument} from '../src/image-reference.ts';

const document=():ImageReferenceDocument=>({
 format:'pakachi-image-reference',version:1,source:{sha256:'a'.repeat(64),width:400,height:300},
 regions:[
  {id:'r-head',label:'Head crop',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:20,y:20,width:100,height:100}},
  {id:'r-body',label:'Body crop',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:180,y:80,width:100,height:120}},
  {id:'r-work',label:'Work head',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:20,y:20,width:100,height:100}}
 ],
 views:[{id:'v-animal',label:'Animal front',regionIds:['r-head','r-body']},{id:'v-work',label:'Work front',regionIds:['r-work']}],
 forms:[{id:'f-animal',label:'Animal',viewIds:['v-animal']},{id:'f-work',label:'Work',viewIds:['v-work']}],
 avatars:[{id:'a-pakachi',label:'PaKaChi',formIds:['f-animal','f-work']}]
});
const catalog={schemaVersion:1 as const,characterId:'pakachi',parts:[
 {id:'head',label:'Head',parentPartId:null},{id:'torso',label:'Torso',parentPartId:null}
],surfaceLayers:[{id:'fur',label:'Fur',partId:null}]};

test('classifies confirmed 2D regions per view and pose without mixing animal and work forms',()=>{
 const d=document();
 const result=proposeCluster2DRegionAssignments(d,catalog,[
  {id:'lm-head-a',partId:'head',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'front-neutral',x:70,y:70,radiusPx:80,surfaceLayerId:'fur'},
  {id:'lm-torso-a',partId:'torso',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'front-neutral',x:230,y:140,radiusPx:80},
  {id:'lm-head-w',partId:'head',avatarId:'a-pakachi',formId:'f-work',viewId:'v-work',poseId:'front-neutral',x:70,y:70,radiusPx:80}
 ]);
 assert.equal(result.classified,3);
 assert.deepEqual(result.assignments.map(a=>a.partId),['head','torso','head']);
 assert.ok(result.assignments.every(a=>a.reviewStatus==='suggested'&&a.origin==='automatic'&&a.policy==='recomputable'));
 assert.equal(result.assignments[0]!.poseId,'front-neutral');
});

test('keeps ambiguous and unsupported regions unresolved and ignores unconfirmed regions',()=>{
 const d=document();d.regions.push({id:'r-pending',label:'Pending',kind:'view',status:'suggested',geometry:{type:'rectangle',x:300,y:10,width:50,height:50}});
 const seeds=[
  {id:'lm-a',partId:'head',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'p1',x:60,y:60,radiusPx:200},
  {id:'lm-b',partId:'torso',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'p1',x:61,y:60,radiusPx:200}
 ];
 const result=proposeCluster2DRegionAssignments(d,catalog,seeds);
 assert.equal(result.assignments.length,3);
 assert.equal(result.ambiguous,1);assert.equal(result.outsideEvidence,2);
 assert.ok(result.assignments.every(a=>a.partId===null&&a.reviewStatus==='unresolved'));
});

test('rejects source-outside, mismatched provenance, invalid catalog and duplicate landmark IDs',()=>{
 const d=document();
 const base={id:'lm',partId:'head',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'p1',x:50,y:50,radiusPx:20};
 assert.throws(()=>proposeCluster2DRegionAssignments(d,catalog,[{...base,x:401}]),/outside/);
 assert.throws(()=>proposeCluster2DRegionAssignments(d,catalog,[{...base,formId:'f-work'}]),/provenance/);
 assert.ok(validateCluster2DSemanticCatalog({...catalog,parts:[...catalog.parts,{id:'head',label:'duplicate',parentPartId:null}]}).includes('catalog.part-ids'));
 assert.throws(()=>proposeCluster2DRegionAssignments(d,catalog,[base,base]),/Duplicate/);
});

test('does not treat 2D source coordinates as 3D or fuse different poses',()=>{
 const d=document();
 const result=proposeCluster2DRegionAssignments(d,catalog,[
  {id:'lm-one',partId:'head',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'frame-001',x:60,y:60,radiusPx:100},
  {id:'lm-two',partId:'torso',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'frame-002',x:60,y:60,radiusPx:100}
 ]);
 assert.equal(result.assignments[0]!.partId,null);
 assert.equal(result.assignments[0]!.poseId,'unresolved');
 assert.match(result.assignments[0]!.reason,/different poses/);
});


test('adapts editor-persisted landmarks to classifier seeds using explicit avatar/form/view ancestry',()=>{
 const d=document();
 d.landmarks=[{id:'lm-persisted',regionId:'r-head',partId:'head',surfaceLayerId:'fur',poseId:'front-neutral',x:70,y:70,radiusPx:80}];
 const seeds=imageReferenceLandmarksToCluster2DSeeds(d);
 assert.deepEqual(seeds,[{id:'lm-persisted',partId:'head',surfaceLayerId:'fur',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'front-neutral',x:70,y:70,radiusPx:80}]);
});

test('keeps composite crops unresolved when they contain distinct anatomical targets',()=>{
 const d=document();
 const result=proposeCluster2DRegionAssignments(d,catalog,[
  {id:'lm-torso-center',partId:'torso',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'front-neutral',x:230,y:140,radiusPx:200},
  {id:'lm-head-edge',partId:'head',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'front-neutral',x:185,y:85,radiusPx:200}
 ]);
 const body=result.assignments.find(item=>item.regionId==='r-body')!;
 assert.equal(body.partId,null);assert.equal(body.reviewStatus,'unresolved');
 assert.match(body.reason,/multiple anatomical or surface-layer targets/);
 assert.equal(body.landmarkIds.length,0);
});

test('keeps a crop unresolved when one anatomical part has multiple surface-layer targets',()=>{
 const d=document();
 const mixedCatalog={...catalog,surfaceLayers:[...catalog.surfaceLayers,{id:'armor',label:'Armor',partId:'head'}]};
 const mixed=proposeCluster2DRegionAssignments(d,mixedCatalog,[
  {id:'lm-fur',partId:'head',surfaceLayerId:'fur',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'front-neutral',x:70,y:70,radiusPx:200},
  {id:'lm-armor',partId:'head',surfaceLayerId:'armor',avatarId:'a-pakachi',formId:'f-animal',viewId:'v-animal',poseId:'front-neutral',x:25,y:25,radiusPx:200}
 ]);
 const head=mixed.assignments.find(item=>item.regionId==='r-head')!;
 assert.equal(head.partId,null);assert.equal(head.surfaceLayerId,null);
 assert.equal(head.reviewStatus,'unresolved');
});

test('provides a validated shared PaKaChi anatomy and surface catalog for both forms',()=>{
 const value=createPaKaChiSemanticCatalog();
 assert.deepEqual(validateCluster2DSemanticCatalog(value),[]);
 assert.equal(value.characterId,'pakachi');
 assert.ok(value.parts.some(part=>part.id==='paws'));
 assert.ok(value.parts.some(part=>part.id==='hands'));
 assert.ok(value.surfaceLayers.some(layer=>layer.id==='fur'));
 assert.ok(value.surfaceLayers.some(layer=>layer.id==='mechanics'));
});

test('does not use landmarks attached to unconfirmed regions as classifier evidence',()=>{
 const d=document();
 d.regions.find(region=>region.id==='r-body')!.status='suggested';
 d.landmarks=[
  {id:'lm-confirmed',regionId:'r-head',partId:'head',poseId:'front',x:50,y:50,radiusPx:30},
  {id:'lm-unconfirmed',regionId:'r-body',partId:'torso',poseId:'front',x:220,y:120,radiusPx:30}
 ];
 const seeds=imageReferenceLandmarksToCluster2DSeeds(d);
 assert.deepEqual(seeds.map(seed=>seed.id),['lm-confirmed']);
});

test('supports safe immutable edits of the shared character semantic catalog',()=>{
 const original=createPaKaChiSemanticCatalog();
 const withPart=upsertCluster2DSemanticPart(original,{id:'ear-inner',label:'Inner ear',parentPartId:'ears'});
 assert.ok(withPart.parts.some(part=>part.id==='ear-inner'));
 assert.equal(original.parts.some(part=>part.id==='ear-inner'),false);
 assert.throws(()=>upsertCluster2DSemanticPart(withPart,{id:'ears',label:'Ears',parentPartId:'ear-inner'}),/catalog.part-cycle/);
 assert.throws(()=>removeCluster2DSemanticPart(withPart,'ears'),/child parts/);
 const withAttachedLayer=upsertCluster2DSurfaceLayer(original,{id:'chest-armor',label:'Chest armor',partId:'chest'});
 assert.throws(()=>removeCluster2DSemanticPart(withAttachedLayer,'chest'),/surface layer/);
 const withReferencedPart=upsertCluster2DSemanticPart(original,{id:'test-anchor',label:'Test anchor',parentPartId:null});
 assert.throws(()=>removeCluster2DSemanticPart(withReferencedPart,'test-anchor',['test-anchor']),/landmarks or mesh bindings/);
 const withLayer=upsertCluster2DSurfaceLayer(original,{id:'inner-ear',label:'Inner ear surface',partId:'ears'});
 assert.ok(withLayer.surfaceLayers.some(layer=>layer.id==='inner-ear'));
 assert.throws(()=>removeCluster2DSurfaceLayer(withLayer,'inner-ear',['inner-ear']),/still referenced/);
 const clean=removeCluster2DSurfaceLayer(withLayer,'inner-ear');
 assert.equal(clean.surfaceLayers.some(layer=>layer.id==='inner-ear'),false);
 assert.deepEqual(validateCluster2DSemanticCatalog(clean),[]);
});

test('separates fingers and toes in the shared anatomy tree',()=>{
 const value=createPaKaChiSemanticCatalog();
 assert.equal(value.parts.find(part=>part.id==='digits')?.parentPartId,'hands');
 assert.equal(value.parts.find(part=>part.id==='toes')?.parentPartId,'feet');
});
