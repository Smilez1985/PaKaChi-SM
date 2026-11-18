import {test} from 'node:test';
import assert from 'node:assert/strict';
import {detectTransparentImageComponents} from '../src/image-reference-detection.ts';
function pixels(width:number,height:number,rects:Array<[number,number,number,number]>){const data=new Uint8ClampedArray(width*height*4);for(const [x,y,w,h] of rects)for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)data[(py*width+px)*4+3]=255;return {width,height,data};}
test('finds separate transparent foreground components without merging their identities',()=>{const result=detectTransparentImageComponents(pixels(100,60,[[5,5,20,30],[60,10,25,40]]));assert.equal(result.length,2);assert.deepEqual(result.map(({x,y,width,height})=>({x,y,width,height})),[{x:60,y:10,width:25,height:40},{x:5,y:5,width:20,height:30}]);});
test('ignores tiny alpha noise and transparent background',()=>{const result=detectTransparentImageComponents(pixels(100,100,[[10,10,30,30],[90,90,1,1]]));assert.equal(result.length,1);});
test('downsamples large images and maps bounds back to source pixels',()=>{const result=detectTransparentImageComponents(pixels(4000,2000,[[1000,500,800,600]]),{maxDimension:1000});assert.equal(result.length,1);assert.ok(Math.abs(result[0]!.x-1000)<=4);assert.ok(Math.abs(result[0]!.width-800)<=8);});
test('does not mistake an opaque full-frame background or edge-touching component for a figure',()=>{const opaque=pixels(40,30,[[0,0,40,30]]);assert.deepEqual(detectTransparentImageComponents(opaque),[]);assert.deepEqual(detectTransparentImageComponents(pixels(40,30,[[0,5,20,20]])),[]);});
test('validates image data and options',()=>{assert.throws(()=>detectTransparentImageComponents({width:2,height:2,data:new Uint8ClampedArray(3)}),/invalid-image-data/);assert.throws(()=>detectTransparentImageComponents(pixels(2,2,[]),{maxDimension:0}),/invalid-detection-options/);});

import {detectSolidBackgroundImageComponents} from '../src/image-reference-detection.ts';
function rgbPixels(width:number,height:number,bg:[number,number,number],rects:Array<{box:[number,number,number,number];color:[number,number,number]}>){const data=new Uint8ClampedArray(width*height*4);for(let i=0;i<width*height;i++){data[i*4]=bg[0];data[i*4+1]=bg[1];data[i*4+2]=bg[2];data[i*4+3]=255;}for(const {box:[x,y,w,h],color} of rects)for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){const i=(py*width+px)*4;data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];}return {width,height,data};}
test('proposes separate figures against a uniform opaque background',()=>{const result=detectSolidBackgroundImageComponents(rgbPixels(120,90,[245,245,245],[{box:[12,12,25,55],color:[20,30,40]},{box:[75,18,30,48],color:[10,120,80]}]));assert.equal(result.length,2);assert.deepEqual(result.map(({x,y,width,height})=>({x,y,width,height})),[{x:75,y:18,width:30,height:48},{x:12,y:12,width:25,height:55}]);});
test('rejects inconsistent borders and foreground touching the image edge',()=>{const mixed=rgbPixels(80,60,[245,245,245],[{box:[0,0,25,60],color:[20,20,20]}]);assert.deepEqual(detectSolidBackgroundImageComponents(mixed),[]);const gradient={...rgbPixels(80,60,[245,245,245],[])};for(let y=0;y<60;y++)for(let x=0;x<80;x++){const i=(y*80+x)*4;gradient.data[i]=x*3;gradient.data[i+1]=x*3;gradient.data[i+2]=x*3;}assert.deepEqual(detectSolidBackgroundImageComponents(gradient),[]);});
test('filters isolated foreground noise and downsamples source coordinates',()=>{const result=detectSolidBackgroundImageComponents(rgbPixels(4000,2000,[250,250,250],[{box:[1000,500,800,600],color:[0,0,0]},{box:[3000,1700,1,1],color:[0,0,0]}]),{maxDimension:1000});assert.equal(result.length,1);assert.ok(Math.abs(result[0]!.x-1000)<=4);assert.ok(Math.abs(result[0]!.width-800)<=8);});
test('rejects invalid solid-background options',()=>{assert.throws(()=>detectSolidBackgroundImageComponents(rgbPixels(10,10,[255,255,255],[]),{minBorderConsistency:0.2}),/invalid-detection-options/);});

import {assessImageComponent} from '../src/image-reference-detection.ts';
test('scores segmentation geometry separately from semantic identity and explains the evidence',()=>{
 const assessment=assessImageComponent({x:20,y:20,width:40,height:60,area:2200},{width:100,height:120});
 assert.equal(assessment.confidence,1);
 assert.deepEqual(assessment.evidence,['compact-foreground','usable-relative-area','separated-from-image-edge','measurable-box-size']);
});
test('does not give sparse or tiny edge-adjacent components a high geometry score',()=>{
 const assessment=assessImageComponent({x:0,y:2,width:80,height:90,area:500},{width:100,height:100});
 assert.ok(assessment.confidence<=0.7);
 assert.ok(assessment.evidence.includes('sparse-or-irregular-foreground'));
 assert.ok(assessment.evidence.includes('close-to-image-edge'));
});
test('rejects invalid component assessment geometry',()=>{
 assert.throws(()=>assessImageComponent({x:-1,y:0,width:10,height:10,area:20},{width:100,height:100}),/invalid-component-assessment-input/);
});


import {imageComponentPerceptualHash,compareImageComponentHashes} from '../src/image-reference-detection.ts';
test('perceptual crop hash recognizes identical visual patterns as a review cue',()=>{
 const image={width:90,height:40,data:new Uint8ClampedArray(90*40*4)};
 for(let y=0;y<40;y++)for(let x=0;x<90;x++){const i=(y*90+x)*4;image.data[i+3]=255;const inside=(x>=5&&x<35)||(x>=55&&x<85);const stripe=(x%10)<5;const value=inside&&stripe?230:inside?20:0;image.data[i]=value;image.data[i+1]=value;image.data[i+2]=value;}
 const left=imageComponentPerceptualHash(image,{x:5,y:0,width:30,height:40,area:1200});
 const right=imageComponentPerceptualHash(image,{x:55,y:0,width:30,height:40,area:1200});
 assert.equal(compareImageComponentHashes(left,right),1);
});
test('perceptual crop hash validates bounds and hash format',()=>{
 const image=pixels(20,20,[[2,2,10,10]]);
 assert.throws(()=>imageComponentPerceptualHash(image,{x:-1,y:0,width:10,height:10,area:100}),/invalid-component-hash-input/);
 assert.throws(()=>compareImageComponentHashes('bad','0'.repeat(16)),/invalid-component-hash/);
});

import {findSimilarImageComponentHashes} from '../src/image-reference-detection.ts';
test('similarity review compares only the newest 64 crops and returns the best 12 deterministically',()=>{
 const entries=Array.from({length:70},(_,index)=>({id:'region-'+String(index).padStart(2,'0'),hash:'0'.repeat(16)}));
 const first=findSimilarImageComponentHashes(entries);
 const second=findSimilarImageComponentHashes(entries);
 assert.equal(first.length,12);
 assert.deepEqual(first,second);
 assert.ok(first.every(pair=>Number(pair.leftId.slice(-2))>=6&&Number(pair.rightId.slice(-2))>=6));
 assert.ok(first.every(pair=>pair.score===1));
});
test('similarity review validates thresholds and workload bounds',()=>{
 assert.throws(()=>findSimilarImageComponentHashes([],{threshold:2}),/invalid-similarity-options/);
 assert.throws(()=>findSimilarImageComponentHashes([],{maxCandidates:1}),/invalid-similarity-options/);
 assert.throws(()=>findSimilarImageComponentHashes([],{maxResults:0}),/invalid-similarity-options/);
});

import {filterOverlappingImageComponents} from '../src/image-reference-detection.ts';
test('duplicate filtering preserves manual geometry and skips only strongly overlapping proposals',()=>{
 const candidates=[
  {x:11,y:11,width:39,height:59,area:2300},
  {x:70,y:10,width:20,height:30,area:600},
  {x:10,y:70,width:20,height:20,area:400}
 ];
 const existing=[{x:10,y:10,width:40,height:60}];
 assert.deepEqual(filterOverlappingImageComponents(candidates,existing),[candidates[1],candidates[2]]);
});
test('duplicate filtering validates overlap threshold and keeps non-overlapping regions',()=>{
 const candidate={x:10,y:10,width:20,height:20,area:400};
 assert.deepEqual(filterOverlappingImageComponents([candidate],[]),[candidate]);
 assert.throws(()=>filterOverlappingImageComponents([candidate],[],0),/invalid-overlap-threshold/);
 assert.throws(()=>filterOverlappingImageComponents([candidate],[],1.1),/invalid-overlap-threshold/);
});

import {imageReferenceGeometryBounds} from '../src/image-reference-detection.ts';
test('computes stable outer bounds for rectangles and polygon outlines',()=>{
 assert.deepEqual(imageReferenceGeometryBounds({type:'rectangle',x:4,y:8,width:20,height:30}),{x:4,y:8,width:20,height:30});
 assert.deepEqual(imageReferenceGeometryBounds({type:'polygon',points:[{x:8,y:12},{x:30,y:10},{x:25,y:44},{x:3,y:38}]}),{x:3,y:10,width:27,height:34});
});
test('rejects invalid geometry bounds instead of silently disabling duplicate filtering',()=>{
 assert.throws(()=>imageReferenceGeometryBounds({type:'rectangle',x:0,y:0,width:0,height:4}),/invalid-image-reference-geometry/);
 assert.throws(()=>imageReferenceGeometryBounds({type:'polygon',points:[{x:1,y:1},{x:2,y:2}]}),/invalid-image-reference-geometry/);
});
