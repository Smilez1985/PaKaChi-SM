import {test} from 'node:test';
import assert from 'node:assert/strict';
import {relaxSurfaceEdges} from '../src/surface-edge-relaxation.ts';
const fixture=()=>({rest:[0,0,0,1,0,0,0,1,0],positions:[0,0,0,2,0,0,0,1,0],index:[0,1,2],mobility:[0,1,0]});
const budget=()=>({used:0,limit:10000,exhausted:false});
const signal=()=>new AbortController().signal;
test('positional edge relaxation restores a stretched surface while pins and input arrays stay exact',async()=>{
 const input=fixture(),before=structuredClone(input),work=budget(),result=await relaxSurfaceEdges(input,signal(),work);assert.ok(result);
 assert.ok(Math.abs(result.positions[3]-1)<1e-4);assert.ok(Math.abs(result.positions[4])<1e-4);
 assert.deepEqual([...result.positions.slice(0,3)],input.positions.slice(0,3));assert.deepEqual([...result.positions.slice(6)],input.positions.slice(6));assert.deepEqual(input,before);
 assert.equal(work.used,result.operations);assert.equal(result.activeVertices,1);
});
test('duplicate UV seam positions stay tied and a pinned alias pins the complete seam',async()=>{
 const f=fixture(),input={rest:[...f.rest,1,0,0],positions:[...f.positions,2,0,0],index:[0,1,2,0,3,2],mobility:[0,1,0,1]};
 const r=await relaxSurfaceEdges(input,signal(),budget());assert.ok(r);assert.deepEqual([...r.positions.slice(3,6)],[...r.positions.slice(9,12)]);
 input.mobility[3]=0;assert.equal(await relaxSurfaceEdges(input,signal(),budget()),null);
});
test('no rigid correction is invented and unsupported input never produces partial positions',async()=>{
 const f=fixture(),rigid={...f,positions:[3,4,5,3,5,5,2,4,5],mobility:[1,1,1]};assert.equal(await relaxSurfaceEdges(rigid,signal(),budget()),null);
 for(const input of [{...f,index:[0,1,99]},{...f,positions:[...f.positions.slice(0,8),NaN]},{...f,mobility:[0,-1,0]},{...f,rest:[0]}])assert.equal(await relaxSurfaceEdges(input,signal(),budget()),null);
 assert.equal(await relaxSurfaceEdges({rest:new Float64Array(8193*3),positions:new Float64Array(8193*3),index:[],mobility:new Float64Array(8193).fill(1)},signal(),budget()),null);
});
test('the operation budget is reserved before optimization and exhaustion cannot return a candidate',async()=>{
 const work={used:0,limit:1,exhausted:false};assert.equal(await relaxSurfaceEdges(fixture(),signal(),work),null);assert.equal(work.used,0);assert.equal(work.exhausted,true);
 await assert.rejects(relaxSurfaceEdges(fixture(),signal(),{used:-1,limit:10,exhausted:false}),/Kantenbudget/);
});
test('abort and revision changes cancel yielded positional work without editing inputs',async()=>{
 const f=fixture(),before=structuredClone(f),controller=new AbortController(),pending=relaxSurfaceEdges(f,controller.signal,budget());controller.abort();await assert.rejects(pending);assert.deepEqual(f,before);
 let current=true;const stale=relaxSurfaceEdges(f,signal(),budget(),()=>current);current=false;await assert.rejects(stale,/geändert/);assert.deepEqual(f,before);
});
