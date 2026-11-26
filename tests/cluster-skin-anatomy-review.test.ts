import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createUnclassifiedClusterManifest} from '../src/cluster-inventory.ts';
import {proposeSkinWeightClusterAssignments} from '../src/cluster-skin-anatomy.ts';
import {correctSkinWeightProposal,confirmSkinWeightProposal} from '../src/cluster-skin-anatomy-review.ts';
import type {ClusterManifest} from '../src/cluster-architecture.ts';
import type {SkinWeightMeshEvidence} from '../src/cluster-skin-anatomy.ts';

const hash='a'.repeat(64),meshId='mesh-'+hash+'-walk0-mesh0-primitive0';
function fixture():ClusterManifest{
 const source={schemaVersion:1 as const,sourceAssetSha256:hash,meshes:[{id:meshId,sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:6,triangleCount:2}],totals:{meshes:1,vertices:6,triangles:2}};
 const manifest=createUnclassifiedClusterManifest(source,'animal','2026-11-26T00:00:00.000Z');
 manifest.parts=[{id:'left_arm',name:'Left arm',parentPartId:null,orderKey:[1],rigBoneIds:['left-elbow']},{id:'right_arm',name:'Right arm',parentPartId:null,orderKey:[2],rigBoneIds:['right-elbow']}];
 return manifest;
}
function proposal(){
 const skinIndices=new Uint16Array(24),skinWeights=new Float32Array(24);
 for(let vertex=0;vertex<6;vertex++){skinIndices[vertex*4]=vertex<3?0:1;skinWeights[vertex*4]=1;}
 const evidence:SkinWeightMeshEvidence={meshId,vertexCount:6,triangleCount:2,skinIndices,skinWeights,bonePartIds:['left_arm','right_arm'],indices:null};
 return proposeSkinWeightClusterAssignments(fixture(),hash,[evidence],{generatedAt:'2026-11-26T00:00:00.000Z'});
}

test('manual triangle correction becomes a locked user override without mutating source report',()=>{
 const report=proposal(),before=structuredClone(report);
 const corrected=correctSkinWeightProposal(report,{meshId,triangleIndex:0,partId:'right_arm',reason:'Manually checked against the character reference.'});
 assert.equal(corrected.manifest.assignments[0]!.partId,'right_arm');
 assert.equal(corrected.manifest.assignments[0]!.origin,'user');
 assert.equal(corrected.manifest.assignments[0]!.policy,'locked');
 assert.equal(corrected.manifest.assignments[0]!.confidence,1);
 assert.deepEqual(report,before);
 assert.equal(corrected.classified,2);
});

test('manual correction rejects unknown part, incompatible layer and missing triangle',()=>{
 const report=proposal();
 assert.throws(()=>correctSkinWeightProposal(report,{meshId,triangleIndex:0,partId:'unknown',reason:'manual'}),/correction/);
 assert.throws(()=>correctSkinWeightProposal(report,{meshId,triangleIndex:0,partId:'left_arm',surfaceLayerId:'missing',reason:'manual'}),/Surface layer/);
 assert.throws(()=>correctSkinWeightProposal(report,{meshId,triangleIndex:99,partId:'left_arm',reason:'manual'}),/not part/);
});

test('explicit confirmation locks only classified assignments and leaves unresolved triangles open',()=>{
 const report=proposal();
 report.manifest.assignments[1]!.partId=null;
 report.manifest.assignments[1]!.reason='No mapped anatomical bone influence covers this triangle.';
 const confirmed=confirmSkinWeightProposal(report);
 assert.equal(confirmed.algorithmId,'skin-weight-anatomy-reviewed');
 assert.equal(confirmed.assignments[0]!.origin,'user');
 assert.equal(confirmed.assignments[0]!.policy,'locked');
 assert.equal(confirmed.assignments[1]!.partId,null);
 assert.equal(report.manifest.assignments[0]!.origin,'automatic');
});

test('confirmation refuses proposals with no classified assignments',()=>{
 const report=proposal();
 for(const assignment of report.manifest.assignments){assignment.partId=null;assignment.reason='No mapped anatomical bone influence covers this triangle.';}
 assert.throws(()=>confirmSkinWeightProposal(report),/No classified/);
});
