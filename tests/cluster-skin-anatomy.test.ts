import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createUnclassifiedClusterManifest} from '../src/cluster-inventory.ts';
import {proposeSkinWeightClusterAssignments} from '../src/cluster-skin-anatomy.ts';
import {validateClusterManifest} from '../src/cluster-architecture.ts';

const hash='a'.repeat(64),meshId='mesh-'+hash+'-walk0-mesh0-primitive0';
function fixture(){
 const source={schemaVersion:1 as const,sourceAssetSha256:hash,meshes:[{id:meshId,sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:6,triangleCount:2}],totals:{meshes:1,vertices:6,triangles:2}};
 const manifest=createUnclassifiedClusterManifest(source,'animal','2026-11-25T00:00:00.000Z');
 manifest.parts=[
  {id:'left_arm',name:'Left arm',parentPartId:null,orderKey:[1],rigBoneIds:['left-elbow']},
  {id:'right_arm',name:'Right arm',parentPartId:null,orderKey:[2],rigBoneIds:['right-elbow']},
 ];
 return manifest;
}
function evidence(){
 const skinIndices=new Uint16Array(24),skinWeights=new Float32Array(24);
 for(let vertex=0;vertex<6;vertex++){skinIndices[vertex*4]=vertex<3?0:1;skinWeights[vertex*4]=1;}
 return {meshId,vertexCount:6,triangleCount:2,skinIndices,skinWeights,bonePartIds:['left_arm','right_arm'],indices:null};
}

test('classifies triangles from explicit bone-to-part skin weights',()=>{
 const current=fixture(),input=evidence(),before=Array.from(input.skinWeights);
 const result=proposeSkinWeightClusterAssignments(current,hash,[input],{generatedAt:'2026-11-25T00:01:00.000Z'});
 assert.deepEqual(result.manifest.assignments.map(a=>a.partId),['left_arm','right_arm']);
 assert.equal(result.classified,2);assert.equal(result.ambiguous,0);assert.equal(result.unmapped,0);
 assert.ok(result.manifest.assignments.every(a=>a.origin==='automatic'&&a.policy==='recomputable'&&a.confidence===1));
 assert.deepEqual(Array.from(input.skinWeights),before);
 assert.deepEqual(validateClusterManifest(result.manifest),[]);
 assert.equal(result.manifest.algorithmId,'skin-weight-anatomy');
});

test('keeps boundary triangles and unmapped bone influence unresolved',()=>{
 const current=fixture(),input=evidence();
 // Two corners belong to the left arm, one to the right: below the .75 confidence threshold.
 input.skinIndices[8]=1;
 input.skinWeights[8]=1;
 for(let vertex=3;vertex<6;vertex++){input.skinIndices[vertex*4]=2;input.skinWeights[vertex*4]=1;}
 input.bonePartIds=['left_arm','right_arm',null];
 const result=proposeSkinWeightClusterAssignments(current,hash,[input],{minConfidence:.75,generatedAt:'2026-11-25T00:02:00.000Z'});
 assert.equal(result.manifest.assignments[0]!.partId,null);
 assert.match(result.manifest.assignments[0]!.reason,/spans multiple/);
 assert.equal(result.manifest.assignments[1]!.partId,null);
 assert.equal(result.ambiguous,1);assert.equal(result.unmapped,1);
});

test('preserves locked manual triangle assignments during recomputation',()=>{
 const current=fixture();
 current.assignments[0]!.partId='right_arm';
 current.assignments[0]!.origin='user';
 current.assignments[0]!.policy='locked';
 current.assignments[0]!.confidence=1;
 current.assignments[0]!.reason='Explicit user correction.';
 const result=proposeSkinWeightClusterAssignments(current,hash,[evidence()],{generatedAt:'2026-11-25T00:03:00.000Z'});
 assert.equal(result.manifest.assignments[0]!.partId,'right_arm');
 assert.equal(result.manifest.assignments[0]!.origin,'user');
 assert.equal(result.manifest.assignments[1]!.partId,'right_arm');
});

test('rejects stale source, invalid normalized weights, invalid indices and unknown semantic IDs',()=>{
 const current=fixture(),input=evidence();
 assert.throws(()=>proposeSkinWeightClusterAssignments(current,'b'.repeat(64),[input]),/different source asset/);
 const badWeights=evidence();badWeights.skinWeights[0]=.5;
 assert.throws(()=>proposeSkinWeightClusterAssignments(current,hash,[badWeights]),/not normalized/);
 const badIndices=evidence();badIndices.indices=new Uint16Array([0,1,99,3,4,5]);
 assert.throws(()=>proposeSkinWeightClusterAssignments(current,hash,[badIndices]),/invalid source vertex/);
 const unknown=evidence();unknown.bonePartIds=['missing','right_arm'];
 assert.throws(()=>proposeSkinWeightClusterAssignments(current,hash,[unknown]),/semantic catalog/);
});
