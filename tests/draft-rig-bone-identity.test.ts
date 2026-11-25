import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bindDraftRig} from '../src/draft-rig.ts';
import {draftFigure} from './helpers/draft-rig-fixture.ts';
import {collectClusterMeshInventory,createUnclassifiedClusterManifest} from '../src/cluster-inventory.ts';
import {applyDraftRigBoneIdentitiesToManifest,collectDraftRigBoneIdentityMap,draftRigBoneIdentityForJoint} from '../src/draft-rig-bone-identity.ts';

const signal=()=>new AbortController().signal;

test('draft rig writes explicit stable semantic IDs and part ownership onto every generated bone',async()=>{
  const root=draftFigure();
  await bindDraftRig(root,'quadruped',signal(),'bounds');
  const mapping=collectDraftRigBoneIdentityMap(root);
  const bones:THREE.Bone[]=[];
  root.traverse(node=>{if(node instanceof THREE.Bone)bones.push(node);});
  assert.equal(mapping.size,bones.length);
  assert.equal(new Set(mapping.values()).size,bones.length);
  for(const bone of bones){
    assert.equal(mapping.get(bone.name),bone.userData.pakachiRigBoneId);
    assert.equal(typeof bone.userData.pakachiClusterPartId,'string');
  }
  assert.equal(draftRigBoneIdentityForJoint('quadruped','LeftShoulder').partId,'forelimbs');
  assert.equal(draftRigBoneIdentityForJoint('quadruped','LeftWrist').partId,'paws');
  assert.equal(draftRigBoneIdentityForJoint('quadruped','RightHip').partId,'hindlimbs');
});

test('bone metadata populates a form-local manifest without inferring from generated bone names',async()=>{
  const root=draftFigure().root;
  const hash='a'.repeat(64);
  const inventory=collectClusterMeshInventory(root,hash);
  const manifest=createUnclassifiedClusterManifest(inventory,'animal','2026-11-25T00:00:00.000Z');
  const ids=['body','torso','chest','pelvis','neck','head','muzzle','ears','eyes','eyelids','mouth','shoulders','forelimbs','upper-arms','forearms','hands','paws','digits','hips','hindlimbs','thighs','lower-legs','feet','toes','tail','tail-tip'];
  manifest.parts=ids.map((id,index)=>({id,name:id,parentPartId:null,orderKey:[index+1],rigBoneIds:[]}));
  await bindDraftRig(root,'quadruped',signal(),'bounds');
  const result=applyDraftRigBoneIdentitiesToManifest(manifest,root);
  assert.equal(result.rigBoneIdByName.size,23);
  assert.ok(result.manifest.parts.find(part=>part.id==='forelimbs')!.rigBoneIds.includes('left_shoulder'));
  assert.ok(result.manifest.parts.find(part=>part.id==='paws')!.rigBoneIds.includes('right_wrist'));
  assert.equal(result.manifest.parts.find(part=>part.id==='hindlimbs')!.rigBoneIds.includes('left_hip'),true);
  assert.ok(result.manifest.parts.every(part=>part.rigBoneIds.every(id=>/^[a-z0-9][a-z0-9_-]*$/.test(id))));
});

test('unknown joint names and form mismatches are rejected instead of guessed',()=>{
  assert.throws(()=>draftRigBoneIdentityForJoint('biped','LeftTail'),/explicit semantic identity/);
  assert.throws(()=>draftRigBoneIdentityForJoint('biped','TailTip'),/not valid/);
});
