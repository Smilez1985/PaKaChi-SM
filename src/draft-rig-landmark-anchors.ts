import * as THREE from 'three';
import type { DraftRigTemplate } from './draft-rig.ts';
import type { StudioLandmarkEvidenceBundle } from './studio-landmark-evidence.ts';

export interface DraftRigLandmarkTransform {
  meshId: string;
  /** Column-major mesh-local to avatar-root-local transform captured at review time. */
  meshToAvatar: readonly number[];
}
export interface DraftRigLandmarkAssignment {
  landmarkId: string;
  jointName: string;
}
export interface DraftRigLandmarkAnchor {
  jointName: string;
  position: [number, number, number];
  landmarkId: string;
  partId: string;
  meshId: string;
  radius: number;
  origin: 'user';
  policy: 'locked';
}
export interface DraftRigLandmarkAnchorReport {
  template: DraftRigTemplate;
  anchors: DraftRigLandmarkAnchor[];
  unresolved: { landmarkId: string; partId: string; reason: 'no-unambiguous-joint' | 'missing-mesh-transform' }[];
}

/** Semantic part compatibility is a guardrail, not a learned anatomy classifier. */
const compatibleParts: Record<string, readonly string[]> = {
  Hips: ['pelvis', 'hips'],
  Spine: ['torso'],
  Chest: ['chest', 'torso'],
  Neck: ['neck'],
  Head: ['head'],
  TailBase: ['tail'],
  TailTip: ['tail-tip'],
  LeftShoulder: ['shoulders', 'forelimbs', 'upper-arms'],
  RightShoulder: ['shoulders', 'forelimbs', 'upper-arms'],
  LeftElbow: ['upper-arms', 'forearms'],
  RightElbow: ['upper-arms', 'forearms'],
  LeftWrist: ['forearms', 'hands', 'paws'],
  RightWrist: ['forearms', 'hands', 'paws'],
  LeftHand: ['hands', 'paws', 'digits'],
  RightHand: ['hands', 'paws', 'digits'],
  LeftHip: ['hips', 'hindlimbs', 'thighs'],
  RightHip: ['hips', 'hindlimbs', 'thighs'],
  LeftKnee: ['thighs', 'lower-legs'],
  RightKnee: ['thighs', 'lower-legs'],
  LeftAnkle: ['lower-legs', 'feet'],
  RightAnkle: ['lower-legs', 'feet'],
  LeftFoot: ['feet', 'toes', 'paws'],
  RightFoot: ['feet', 'toes', 'paws'],
};
const idPattern = /^[a-z0-9][a-z0-9_-]{0,127}$/;

/**
 * Converts reviewed surface picks into candidate joint anchors. Centerline
 * semantic parts have a conservative one-to-one mapping. Bilateral joints
 * require an explicit landmarkId -> jointName assignment; image left/right is
 * never guessed. Positions are transformed from mesh-local to avatar-root-local.
 */
export function resolveDraftRigLandmarkAnchors(
  evidence: StudioLandmarkEvidenceBundle,
  transforms: readonly DraftRigLandmarkTransform[],
  template: DraftRigTemplate,
  assignments: readonly DraftRigLandmarkAssignment[] = [],
): DraftRigLandmarkAnchorReport {
  if (!evidence || evidence.format !== 'pakachi-cluster-landmark-evidence' ||
      evidence.version !== 1 || evidence.formMappingConfirmed !== true ||
      !Array.isArray(evidence.correspondences) || evidence.correspondences.length === 0) {
    throw new Error('draft-rig-landmark-evidence');
  }
  if ((evidence.form === 'animal') !== (template === 'quadruped')) {
    throw new Error('draft-rig-landmark-form-template');
  }
  if (!Array.isArray(transforms) || transforms.length > 64 ||
      !Array.isArray(assignments) || assignments.length > evidence.correspondences.length) {
    throw new Error('draft-rig-landmark-input');
  }
  const matrices = new Map<string, THREE.Matrix4>();
  for (const item of transforms) {
    if (!item || !idPattern.test(item.meshId) || matrices.has(item.meshId) ||
        !Array.isArray(item.meshToAvatar) || item.meshToAvatar.length !== 16 ||
        !item.meshToAvatar.every(Number.isFinite)) throw new Error('draft-rig-landmark-transform');
    const matrix = new THREE.Matrix4().fromArray([...item.meshToAvatar]);
    if (!Number.isFinite(matrix.determinant()) || Math.abs(matrix.determinant()) < 1e-12) {
      throw new Error('draft-rig-landmark-transform');
    }
    matrices.set(item.meshId, matrix);
  }
  const assignmentMap = new Map<string, string>();
  for (const item of assignments) {
    if (!item || !idPattern.test(item.landmarkId) || !Object.hasOwn(compatibleParts, item.jointName) ||
        assignmentMap.has(item.landmarkId)) throw new Error('draft-rig-landmark-assignment');
    assignmentMap.set(item.landmarkId, item.jointName);
  }
  const knownLandmarks = new Set<string>();
  const usedJoints = new Set<string>();
  const anchors: DraftRigLandmarkAnchor[] = [];
  const unresolved: DraftRigLandmarkAnchorReport['unresolved'] = [];
  for (const item of evidence.correspondences) {
    if (!item || !idPattern.test(item.landmarkId) || knownLandmarks.has(item.landmarkId) ||
        !idPattern.test(item.meshId) || !idPattern.test(item.partId) ||
        !Array.isArray(item.position) || item.position.length !== 3 ||
        !item.position.every(Number.isFinite) || !Number.isFinite(item.radius) || item.radius <= 0 ||
        item.origin !== 'user' || item.policy !== 'locked') {
      throw new Error('draft-rig-landmark-correspondence');
    }
    knownLandmarks.add(item.landmarkId);
    const matrix = matrices.get(item.meshId);
    if (!matrix) {
      unresolved.push({ landmarkId: item.landmarkId, partId: item.partId, reason: 'missing-mesh-transform' });
      continue;
    }
    const explicit = assignmentMap.get(item.landmarkId);
    const candidates = explicit ? [explicit] : Object.entries(compatibleParts)
      .filter(([, parts]) => parts.length === 1 && parts[0] === item.partId)
      .map(([joint]) => joint);
    if (candidates.length !== 1 || !compatibleParts[candidates[0]!]?.includes(item.partId)) {
      unresolved.push({ landmarkId: item.landmarkId, partId: item.partId, reason: 'no-unambiguous-joint' });
      continue;
    }
    const jointName = candidates[0]!;
    if (usedJoints.has(jointName)) throw new Error('draft-rig-landmark-joint-conflict:' + jointName);
    usedJoints.add(jointName);
    const position = new THREE.Vector3(...item.position).applyMatrix4(matrix);
    if (![position.x, position.y, position.z].every(Number.isFinite)) {
      throw new Error('draft-rig-landmark-position');
    }
    anchors.push({
      jointName,
      position: [position.x, position.y, position.z],
      landmarkId: item.landmarkId,
      partId: item.partId,
      meshId: item.meshId,
      radius: item.radius,
      origin: 'user',
      policy: 'locked',
    });
  }
  for (const landmarkId of assignmentMap.keys()) {
    if (!knownLandmarks.has(landmarkId)) throw new Error('draft-rig-landmark-unknown-assignment');
  }
  return { template, anchors, unresolved };
}
