import {test} from 'node:test';
import assert from 'node:assert/strict';
import {proposeLandmarkClusterAssignments} from '../src/cluster-landmark-classifier.ts';

test('proposes generic landmark regions on a single connected mesh without a rig',()=>{
 const positions=new Float32Array([
  -.2,0,0, .2,0,0, 0,.2,0,
  9.8,0,0, 10.2,0,0, 10,.2,0,
 ]);
 const result=proposeLandmarkClusterAssignments('mesh-main',positions,null,[
  {partId:'left_arm',position:[0,0,0],radius:1},
  {partId:'right_arm',position:[10,0,0],radius:1},
 ]);
 assert.deepEqual(result.assignments.map(a=>a.partId),['left_arm','right_arm']);
 assert.equal(result.classified,2);assert.equal(result.ambiguous,0);assert.equal(result.outsideEvidence,0);
 assert.ok(result.assignments.every(a=>a.origin==='automatic'&&a.policy==='recomputable'&&a.confidence>0));
});
test('keeps triangles unresolved outside evidence and at ambiguous boundaries',()=>{
 const positions=new Float32Array([
  4.9,0,0, 5.1,0,0, 5,.2,0,
  20,0,0, 20.2,0,0, 20,.2,0,
 ]);
 const result=proposeLandmarkClusterAssignments('mesh-main',positions,null,[
  {partId:'left',position:[0,0,0],radius:10},
  {partId:'right',position:[10,0,0],radius:10},
 ]);
 assert.equal(result.assignments[0].partId,null);assert.match(result.assignments[0].reason,/insufficiently separated/);
 assert.equal(result.assignments[1].partId,null);assert.match(result.assignments[1].reason,/No anatomical landmark/);
 assert.equal(result.ambiguous,1);assert.equal(result.outsideEvidence,1);
});
test('supports indexed geometry and rejects invalid or excessive input',()=>{
 const positions=new Float32Array([0,0,0, 1,0,0, 0,1,0, 8,0,0]);
 const result=proposeLandmarkClusterAssignments('mesh-main',positions,new Uint16Array([0,1,2]),[
  {partId:'head',position:[0,0,0],radius:2},
 ]);
 assert.equal(result.assignments.length,1);assert.equal(result.assignments[0].partId,'head');
 assert.throws(()=>proposeLandmarkClusterAssignments('mesh-main',positions,new Uint16Array([0,1,9]),[{partId:'head',position:[0,0,0],radius:2}]),/outside/);
 assert.throws(()=>proposeLandmarkClusterAssignments('mesh-main',positions,null,[]),/1–256/);
 assert.throws(()=>proposeLandmarkClusterAssignments('mesh-main',positions,null,[{partId:'head',position:[0,0,0],radius:2}],{maxTriangles:0}),/excessive/);
});
