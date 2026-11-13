import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planImageReferenceCrop} from '../src/image-reference-crop.ts';
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
 assert.throws(()=>planImageReferenceCrop(region({type:'polygon',points:[{x:1,y:1},{x:1,y:1},{x:1,y:1}]}),100,100),/empty-region/);
});
