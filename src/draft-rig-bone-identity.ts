import * as THREE from 'three';
import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { DraftRigTemplate } from './draft-rig.ts';

export interface DraftRigBoneIdentity { rigBoneId: string; partId: string }

const central: Readonly<Record<string, DraftRigBoneIdentity>> = {
  Hips: {rigBoneId:'pelvis',partId:'pelvis'},
  Spine: {rigBoneId:'spine',partId:'torso'},
  Chest: {rigBoneId:'chest',partId:'chest'},
  Neck: {rigBoneId:'neck',partId:'neck'},
  Head: {rigBoneId:'head',partId:'head'},
  TailBase: {rigBoneId:'tail_base',partId:'tail'},
  TailTip: {rigBoneId:'tail_tip',partId:'tail-tip'},
};
const bilateral: Readonly<Record<string, {biped:string;quadruped:string}>> = {
  Shoulder:{biped:'shoulders',quadruped:'forelimbs'},
  Elbow:{biped:'forearms',quadruped:'forelimbs'},
  Wrist:{biped:'hands',quadruped:'paws'},
  Hand:{biped:'hands',quadruped:'paws'},
  Hip:{biped:'hips',quadruped:'hindlimbs'},
  Knee:{biped:'lower-legs',quadruped:'lower-legs'},
  Ankle:{biped:'feet',quadruped:'feet'},
  Foot:{biped:'feet',quadruped:'paws'},
};

/** Explicit semantic contract for the names emitted by the draft-rig generator. */
export function draftRigBoneIdentityForJoint(template: DraftRigTemplate, jointName: string): DraftRigBoneIdentity {
  const base = central[jointName];
  if (base) {
    if (template !== 'quadruped' && (jointName === 'TailBase' || jointName === 'TailTip')) throw new Error('Tail bones are not valid for a biped draft rig.');
    return {...base};
  }
  const match = /^(Left|Right)(Shoulder|Elbow|Wrist|Hand|Hip|Knee|Ankle|Foot)$/.exec(jointName);
  if (!match) throw new Error('Draft rig joint has no explicit semantic identity: ' + jointName);
  const side = match[1]!.toLowerCase(), segment = match[2]!, mapping = bilateral[segment];
  if (!mapping) throw new Error('Draft rig joint has no semantic part mapping: ' + jointName);
  const partId = template === 'quadruped' ? mapping.quadruped : mapping.biped;
  return {rigBoneId:side+'_'+segment.replace(/[A-Z]/g,c=>'_'+c.toLowerCase()).replace(/^_/,'').replace(/-/g,'_'),partId};
}

/** Reads the generator-authored metadata; never derives identity from a display name. */
export function collectDraftRigBoneIdentityMap(root: THREE.Object3D): Map<string,string> {
  const result = new Map<string,string>(), seenIds = new Set<string>();
  root.traverse(node => {
    if (!(node instanceof THREE.Bone)) return;
    const id = node.userData.pakachiRigBoneId;
    if (typeof id !== 'string') throw new Error('Draft rig bone is missing its stable semantic ID.');
    if (!node.name || result.has(node.name) || seenIds.has(id)) throw new Error('Draft rig bone identity is duplicated.');
    result.set(node.name,id);seenIds.add(id);
  });
  if (!result.size) throw new Error('No identified draft rig bones were found.');
  return result;
}

/** Produces a form-local manifest with explicit bone ownership from generator metadata. */
export function applyDraftRigBoneIdentitiesToManifest(manifest: ClusterManifest, root: THREE.Object3D): {
  manifest: ClusterManifest; rigBoneIdByName: Map<string,string>
} {
  const issues=validateClusterManifest(manifest);
  if(issues.length)throw new Error('Invalid source cluster manifest: '+issues.map(issue=>issue.code).join(', '));
  const metadata=root.userData.pakachiDraftRig;
  const template=metadata&&typeof metadata==='object'?(metadata as {template?:unknown}).template:null;
  if(template!=='biped'&&template!=='biped-relaxed'&&template!=='quadruped')throw new Error('Draft rig template metadata is missing.');
  if((manifest.form==='animal')!==(template==='quadruped')||manifest.form==='imported')throw new Error('Draft rig and cluster manifest forms do not match.');
  const next=structuredClone(manifest);
  for(const part of next.parts)part.rigBoneIds=[];
  const map=new Map<string,string>(),seenIds=new Set<string>();
  root.traverse(node=>{
    if(!(node instanceof THREE.Bone))return;
    const id=node.userData.pakachiRigBoneId,partId=node.userData.pakachiClusterPartId;
    if(typeof id!=='string'||typeof partId!=='string'||!node.name||map.has(node.name)||seenIds.has(id))throw new Error('Draft rig bone metadata is missing or duplicated.');
    const part=next.parts.find(candidate=>candidate.id===partId);
    if(!part)throw new Error('Draft rig bone references a part absent from the character catalog: '+partId);
    part.rigBoneIds.push(id);map.set(node.name,id);seenIds.add(id);
  });
  if(!map.size)throw new Error('No draft rig bone identities were transferred.');
  const after=validateClusterManifest(next);
  if(after.length)throw new Error('Draft rig bone identity manifest is invalid: '+after.map(issue=>issue.code).join(', '));
  return {manifest:next,rigBoneIdByName:map};
}
