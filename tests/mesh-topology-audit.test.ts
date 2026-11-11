import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditMeshTopology} from '../src/mesh-topology-audit.ts';
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
 assert.equal(r.inconsistentWindingEdges,0);
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
