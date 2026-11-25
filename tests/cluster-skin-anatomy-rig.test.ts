import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createUnclassifiedClusterManifest} from '../src/cluster-inventory.ts';
import {collectRiggedSkinWeightEvidence} from '../src/cluster-skin-anatomy-rig.ts';
import type {ClusterManifest} from '../src/cluster-architecture.ts';

const hash='a'.repeat(64),meshId='mesh-'+hash+'-walk0-mesh0-primitive0';
function fixture():ClusterManifest{
 const inventory={schemaVersion:1 as const,sourceAssetSha256:hash,meshes:[{id:meshId,sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:6,triangleCount:2}],totals:{meshes:1,vertices:6,triangles:2}};
 const manifest=createUnclassifiedClusterManifest(inventory,'animal','2026-11-25T00:00:00.000Z');
 manifest.parts=[
  {id:'left_arm',name:'Left arm',parentPartId:null,orderKey:[1],rigBoneIds:['left-elbow']},
  {id:'right_arm',name:'Right arm',parentPartId:null,orderKey:[2],rigBoneIds:['right-elbow']},
 ];
 return manifest;
}
function riggedMesh(names=['left-elbow','right-elbow']):THREE.SkinnedMesh{
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,1,1,0,2,1,0,1,2,0],3));
 const skinIndices=new Uint16Array(24),skinWeights=new Float32Array(24);
 for(let vertex=0;vertex<6;vertex++){skinIndices[vertex*4]=vertex<3?0:1;skinWeights[vertex*4]=1;}
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
 geometry.setIndex([0,1,2,3,4,5]);
 const bones=names.map(name=>{const bone=new THREE.Bone();bone.name=name;return bone;});
 const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshBasicMaterial());
 mesh.add(...bones);mesh.bind(new THREE.Skeleton(bones));
 return mesh;
}

test('collects skin weights through explicit source mesh IDs and exact unique bone names',()=>{
 const manifest=fixture(),mesh=riggedMesh(),before=Array.from(mesh.geometry.getAttribute('skinWeight').array);
 const [evidence]=collectRiggedSkinWeightEvidence(manifest,hash,[{meshId,mesh}]);
 assert.deepEqual(evidence?.bonePartIds,['left_arm','right_arm']);
 assert.deepEqual(Array.from(evidence!.skinWeights),before);
 assert.equal(evidence?.meshId,meshId);
});

test('leaves duplicate bone names and bones claimed by multiple parts unmapped',()=>{
 const manifest=fixture();
 manifest.parts.push({id:'left_hand',name:'Left hand',parentPartId:null,orderKey:[3],rigBoneIds:['right-elbow']});
 const mesh=riggedMesh(['left-elbow','right-elbow','right-elbow']);
 const [evidence]=collectRiggedSkinWeightEvidence(manifest,hash,[{meshId,mesh}]);
 assert.deepEqual(evidence?.bonePartIds,['left_arm',null,null]);
});

test('rejects stale source, guessed mesh IDs and topology mismatches',()=>{
 const manifest=fixture(),mesh=riggedMesh();
 assert.throws(()=>collectRiggedSkinWeightEvidence(manifest,'b'.repeat(64),[{meshId,mesh}]),/different source asset/);
 assert.throws(()=>collectRiggedSkinWeightEvidence(manifest,hash,[{meshId:'unknown-mesh',mesh}]),/source inventory/);
 const changed=riggedMesh();
 changed.geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
 assert.throws(()=>collectRiggedSkinWeightEvidence(manifest,hash,[{meshId,mesh:changed}]),/topology or skin attributes/);
});
