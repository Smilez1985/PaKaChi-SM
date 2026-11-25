import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createUnclassifiedClusterManifest} from '../src/cluster-inventory.ts';
import {attachClusterMeshIdentity,collectRiggedSkinWeightEvidenceFromRoot} from '../src/cluster-skin-anatomy-identity.ts';
import {bindDraftRig} from '../src/draft-rig.ts';
import {draftFigure} from './helpers/draft-rig-fixture.ts';
import type {ClusterMeshBinding} from '../src/cluster-inventory.ts';

const hash='c'.repeat(64);
function fixture(){
 const root=draftFigure();root.updateMatrixWorld(true);
 const meshes:THREE.Mesh[]=[];root.traverse(node=>{if(node instanceof THREE.Mesh)meshes.push(node);});
 const inventory={schemaVersion:1 as const,sourceAssetSha256:hash,meshes:meshes.map((mesh,i)=>({id:`mesh-${hash}-walk${i}-mesh0-primitive0`,sourceMeshIndex:0,sourceMeshName:mesh.name,primitiveIndex:0,vertexCount:mesh.geometry.getAttribute('position').count,triangleCount:(mesh.geometry.index?.count??mesh.geometry.getAttribute('position').count)/3})),totals:{meshes:meshes.length,vertices:meshes.reduce((n,m)=>n+m.geometry.getAttribute('position').count,0),triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3,0)}};
 const manifest=createUnclassifiedClusterManifest(inventory,'humanoid','2026-11-25T00:00:00.000Z');
 manifest.parts=[{id:'left_arm',name:'Left arm',parentPartId:null,orderKey:[1],rigBoneIds:['left_elbow']},{id:'right_arm',name:'Right arm',parentPartId:null,orderKey:[2],rigBoneIds:['right_elbow']}];
 const bindings:ClusterMeshBinding[]=meshes.map((mesh,i)=>{const p=mesh.geometry.getAttribute('position'),indices=mesh.geometry.index?Uint32Array.from(mesh.geometry.index.array):null,positions=new Float64Array(p.count*3);for(let v=0;v<p.count;v++){positions[v*3]=p.getX(v);positions[v*3+1]=p.getY(v);positions[v*3+2]=p.getZ(v);}return {meshId:inventory.meshes[i]!.id,mesh,geometry:mesh.geometry,positions,indices,meshWorld:mesh.matrixWorld.toArray()};});
 return {root,manifest,bindings,meshCount:meshes.length};
}

test('source inventory IDs survive actual DraftRig Mesh to SkinnedMesh replacement',async()=>{
 const {root,manifest,bindings,meshCount}=fixture();
 attachClusterMeshIdentity(root,manifest,bindings);
 await bindDraftRig(root,'biped',new AbortController().signal,'bounds');
 const evidence=collectRiggedSkinWeightEvidenceFromRoot(root,manifest,new Map([['Draft_LeftElbow','left_elbow'],['Draft_RightElbow','right_elbow']]));
 assert.equal(evidence.length,meshCount);
 assert.deepEqual(new Set(evidence.map(item=>item.meshId)),new Set(manifest.meshes.map(item=>item.id)));
 assert.ok(evidence.every(item=>item.bonePartIds.includes('left_arm')&&item.bonePartIds.includes('right_arm')));
});

test('identity handoff rejects incomplete or foreign source bindings before mutation',()=>{
 const {root,manifest,bindings}=fixture();
 assert.throws(()=>attachClusterMeshIdentity(root,manifest,bindings.slice(1)),/exactly one identity binding/);
 assert.ok(bindings.every(binding=>binding.mesh.userData.pakachiClusterMeshId===undefined));
});

test('rigged evidence rejects a missing transferred identity rather than inferring by mesh order',async()=>{
 const {root,manifest,bindings}=fixture();
 attachClusterMeshIdentity(root,manifest,bindings);
 await bindDraftRig(root,'biped',new AbortController().signal,'bounds');
 const first:THREE.SkinnedMesh[]=[];root.traverse(node=>{if(node instanceof THREE.SkinnedMesh)first.push(node);});
 delete first[0]!.userData.pakachiClusterMeshId;
 assert.throws(()=>collectRiggedSkinWeightEvidenceFromRoot(root,manifest),/missing, stale, or duplicate/);
});
