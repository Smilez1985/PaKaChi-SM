import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditMeshTopology,proposeDegenerateFaceRemoval} from '../src/mesh-topology-audit.ts';
const tri=(a:number[],b:number[],c:number[])=>[...a,...b,...c];
test('classifies isolated zero-area triangles without modifying geometry',()=>{
 const data=[...tri([0,0,0],[1,0,0],[0,1,0]),...tri([10,0,0],[11,0,0],[12,0,0])],copy=[...data];
 const r=auditMeshTopology(data);
 assert.equal(r.zeroAreaTriangles,1);assert.deepEqual(r.examples.degenerate,[1]);
 assert.equal(r.boundaryEdges,3);assert.deepEqual(data,copy);
});
test('tracks duplicate faces and non-manifold edges without removing them',()=>{
 const positions=[0,0,0,1,0,0,0,1,0,0,-1,0,0,0,1];
 const r=auditMeshTopology(positions,[0,1,2,1,0,3,0,1,4,0,1,2]);
 assert.equal(r.duplicateFaces,1);assert.equal(r.nonManifoldEdges,1);
 // The duplicate face repeats edges 1-2 and 0-2 in the same direction.
 assert.equal(r.inconsistentWindingEdges,2);
});
test('detects exact duplicate vertex positions as advisory not a weld instruction',()=>{
 const p=[...tri([0,0,0],[1,0,0],[0,1,0]),...tri([0,0,0],[0,0,1],[0,1,0])];
 const r=auditMeshTopology(p);
 assert.equal(r.coincidentVertexGroups,2);assert.equal(r.coincidentVertices,4);
 assert.ok(r.advice.some(s=>s.includes('NICHT blind')));
});
test('reports opposite winding, invalid indices, and nonfinite triangles',()=>{
 const p=[0,0,0,1,0,0,0,1,0,0,-1,0];
 assert.equal(auditMeshTopology(p,[0,1,2,0,1,3]).inconsistentWindingEdges,1);
 assert.equal(auditMeshTopology(p,[0,1,99]).invalidIndices,1);
 assert.equal(auditMeshTopology([0,0,0,1,0,0,0,NaN,0]).nonFiniteTriangles,1);
});

test('degenerate removal proposal preserves original buffers and indexed vertex identity',()=>{
 const p=[0,0,0,1,0,0,0,1,0,2,0,0];
 const idx=[0,1,2,0,1,3,0,0,1],beforeP=[...p],beforeI=[...idx];
 const proposal=proposeDegenerateFaceRemoval(p,idx);
 assert.equal(proposal.safeToPreview,true);
 assert.deepEqual(proposal.removedFaces,[1,2]);
 assert.deepEqual(proposal.proposedIndices,[0,1,2]);
 assert.equal(proposal.after?.zeroAreaTriangles,0);
 assert.equal(proposal.keptTriangles,1);
 assert.deepEqual(p,beforeP);assert.deepEqual(idx,beforeI);
});
test('nonindexed proposal uses original corner ids and does not weld UV seams',()=>{
 const p=[...tri([0,0,0],[1,0,0],[0,1,0]),...tri([0,0,0],[0,0,0],[1,0,0])];
 const out=proposeDegenerateFaceRemoval(p);
 assert.deepEqual(out.proposedIndices,[0,1,2]);
 assert.deepEqual(out.removedFaces,[1]);
 assert.equal(out.after?.triangles,1);
});
test('invalid indices and nonfinite coordinates fail closed without a repair preview',()=>{
 const p=[0,0,0,1,0,0,0,1,0];
 const i=proposeDegenerateFaceRemoval(p,[0,1,12]);
 assert.equal(i.safeToPreview,false);assert.equal(i.reason,'invalid-indices');
 assert.deepEqual(i.proposedIndices,[]);assert.equal(i.after,null);
 const n=proposeDegenerateFaceRemoval([0,0,0,1,0,0,0,NaN,0]);
 assert.equal(n.safeToPreview,false);assert.equal(n.reason,'nonfinite-positions');
});
test('duplicate valid faces remain unchanged: never auto-remove material layers',()=>{
 const p=[0,0,0,1,0,0,0,1,0];
 const r=proposeDegenerateFaceRemoval(p,[0,1,2,0,1,2]);
 assert.equal(r.before.duplicateFaces,1);
 assert.deepEqual(r.removedFaces,[]);
 assert.deepEqual(r.proposedIndices,[0,1,2,0,1,2]);
});
