import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 applyClusterOperation,clusterAssetHash,recomputeClusterAssignments,validateClusterManifest,
 type ClusterManifest,
} from '../src/cluster-architecture.ts';

const fixture=():ClusterManifest=>({
 schemaVersion:1,form:'imported',sourceAssetSha256:'a'.repeat(64),algorithmId:'test-segmenter',algorithmVersion:'1.0.0',generatedAt:'2026-11-12T14:00:00.000Z',revision:0,
 parts:[
  {id:'body',name:'Body',parentPartId:null,orderKey:[1],rigBoneIds:[]},
  {id:'head',name:'Head',parentPartId:'body',orderKey:[1,1],rigBoneIds:[]},
 ],
 layers:[{id:'fur',name:'Fur',partId:'body',orderKey:[1]}],
 meshes:[{id:'mesh-main',sourceMeshIndex:0,sourceMeshName:'Unified',primitiveIndex:0,vertexCount:4,triangleCount:2}],
 assignments:[
  {meshId:'mesh-main',triangleIndex:0,partId:'body',surfaceLayerId:'fur',origin:'automatic',policy:'recomputable',confidence:.7,reason:'synthetic geometry'},
  {meshId:'mesh-main',triangleIndex:1,partId:'head',surfaceLayerId:'fur',origin:'automatic',policy:'recomputable',confidence:.8,reason:'synthetic landmark'},
 ],
});
test('validates a segmented or unified mesh manifest without requiring a rig',()=>{
 const m=fixture();assert.deepEqual(validateClusterManifest(m),[]);
 assert.equal(m.parts.every(p=>p.rigBoneIds.length===0),true);
});
test('rejects duplicate triangle assignments and invalid references',()=>{
 const m=fixture();m.assignments.push({...m.assignments[0],partId:'missing'});
 const codes=validateClusterManifest(m).map(x=>x.code);
 assert.ok(codes.includes('assignment.duplicate'));assert.ok(codes.includes('assignment.part'));
});
test('rejects missing parents and anatomical cycles',()=>{
 const missing=fixture();missing.parts[1].parentPartId='missing';assert.ok(validateClusterManifest(missing).some(x=>x.code==='part.parent.missing'));
 const cycle=fixture();cycle.parts[0].parentPartId='head';assert.ok(validateClusterManifest(cycle).some(x=>x.code==='part.cycle'));
});
test('applies user and LLM edits immutably and protects the source manifest',()=>{
 const source=fixture();const renamed=applyClusterOperation(source,{type:'rename-part',partId:'head',name:'Kopf'},'user');
 assert.equal(source.parts[1].name,'Head');assert.equal(renamed.parts[1].name,'Kopf');assert.equal(renamed.revision,1);
 const moved=applyClusterOperation(renamed,{type:'reorder-part',partId:'head',orderKey:[1,2]},'llm');
 assert.deepEqual(moved.parts[1].orderKey,[1,2]);assert.equal(moved.revision,2);
});
test('rejects cyclic reparenting and unsafe deletion without mutating source',()=>{
 const source=fixture();assert.throws(()=>applyClusterOperation(source,{type:'reparent-part',partId:'body',parentPartId:'head'}),/Invalid cluster manifest/);
 assert.throws(()=>applyClusterOperation(source,{type:'remove-part',partId:'body'}),/still referenced/);
 assert.equal(source.parts[0].parentPartId,null);
});
test('recalculation preserves locked user assignments and replaces automatic ones',()=>{
 const current=fixture();current.assignments[0].origin='user';current.assignments[0].policy='locked';
 const proposed=[
  {...current.assignments[0],partId:'head',origin:'automatic' as const,policy:'recomputable' as const,confidence:.2},
  {...current.assignments[1],partId:'body',origin:'automatic' as const,policy:'recomputable' as const,confidence:.9},
 ];
 const next=recomputeClusterAssignments(current,proposed);
 assert.equal(next.assignments[0].partId,'body');assert.equal(next.assignments[0].origin,'user');assert.equal(next.assignments[1].partId,'body');
 assert.equal(current.assignments[1].partId,'head');assert.equal(next.revision,1);
});
test('recalculation refuses to silently drop a locked source triangle',()=>{
 const current=fixture();current.assignments[0].origin='llm';current.assignments[0].policy='locked';
 assert.throws(()=>recomputeClusterAssignments(current,[current.assignments[1]]),/omitted 1 locked/);
});
test('uses deterministic SHA-256 asset identity without Node-only dependencies',async()=>{
 assert.equal(await clusterAssetHash(new TextEncoder().encode('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
