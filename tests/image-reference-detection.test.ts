import {test} from 'node:test';
import assert from 'node:assert/strict';
import {detectTransparentImageComponents} from '../src/image-reference-detection.ts';
function pixels(width:number,height:number,rects:Array<[number,number,number,number]>){const data=new Uint8ClampedArray(width*height*4);for(const [x,y,w,h] of rects)for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)data[(py*width+px)*4+3]=255;return {width,height,data};}
test('finds separate transparent foreground components without merging their identities',()=>{const result=detectTransparentImageComponents(pixels(100,60,[[5,5,20,30],[60,10,25,40]]));assert.equal(result.length,2);assert.deepEqual(result.map(({x,y,width,height})=>({x,y,width,height})),[{x:60,y:10,width:25,height:40},{x:5,y:5,width:20,height:30}]);});
test('ignores tiny alpha noise and transparent background',()=>{const result=detectTransparentImageComponents(pixels(100,100,[[10,10,30,30],[90,90,1,1]]));assert.equal(result.length,1);});
test('downsamples large images and maps bounds back to source pixels',()=>{const result=detectTransparentImageComponents(pixels(4000,2000,[[1000,500,800,600]]),{maxDimension:1000});assert.equal(result.length,1);assert.ok(Math.abs(result[0]!.x-1000)<=4);assert.ok(Math.abs(result[0]!.width-800)<=8);});
test('validates image data and options',()=>{assert.throws(()=>detectTransparentImageComponents({width:2,height:2,data:new Uint8ClampedArray(3)}),/invalid-image-data/);assert.throws(()=>detectTransparentImageComponents(pixels(2,2,[]),{maxDimension:0}),/invalid-detection-options/);});
