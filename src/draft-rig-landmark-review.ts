import * as THREE from 'three';
import type { ClusterManifest } from './cluster-architecture.ts';
import { collectClusterMeshInventory, resolveClusterMeshBindings } from './cluster-inventory.ts';
import type { DraftRigTemplate } from './draft-rig.ts';
import {
  resolveDraftRigLandmarkAnchors,
} from './draft-rig-landmark-anchors.ts';
import type {
  DraftRigLandmarkAnchor,
  DraftRigLandmarkAssignment,
  DraftRigLandmarkTransform,
  DraftRigLandmarkAnchorReport,
} from './draft-rig-landmark-anchors.ts';
import type { StudioLandmarkEvidenceBundle } from './studio-landmark-evidence.ts';

export interface DraftRigLandmarkReview {
  format: 'pakachi-draft-rig-landmark-review';
  version: 1;
  avatarId: string;
  formId: string;
  sourceAssetSha256: string;
  sourceImageSha256: string;
  template: DraftRigTemplate;
  report: DraftRigLandmarkAnchorReport;
  status: 'review-required';
}
export interface DraftRigLandmarkCorrection {
  landmarkId: string;
  /** Explicit side/joint selection; never inferred from image left/right. */
  jointName: string;
  /** Optional user-adjusted avatar-root-local joint candidate. */
  position?: readonly [number, number, number];
}
export interface ConfirmedDraftRigLandmarkPlan {
  format: 'pakachi-confirmed-draft-rig-landmark-plan';
  version: 1;
  avatarId: string;
  formId: string;
  sourceAssetSha256: string;
  sourceImageSha256: string;
  template: DraftRigTemplate;
  status: 'user-confirmed';
  anchors: DraftRigLandmarkAnchor[];
}
const idPattern = /^[a-z0-9][a-z0-9_-]{0,127}$/;

/** Capture exact mesh-local -> avatar-root-local transforms from the current scene. */
export function captureDraftRigLandmarkTransforms(
  root: THREE.Object3D,
  manifest: ClusterManifest,
): DraftRigLandmarkTransform[] {
  if (!root || !manifest || !/^[a-f0-9]{64}$/.test(manifest.sourceAssetSha256)) {
    throw new Error('draft-rig-landmark-source');
  }
  root.updateWorldMatrix(true, true);
  const inventory = collectClusterMeshInventory(root, manifest.sourceAssetSha256);
  const manifestIds = new Set(manifest.meshes.map(mesh => mesh.id));
  if (manifestIds.size !== manifest.meshes.length ||
      inventory.meshes.length !== manifest.meshes.length ||
      inventory.meshes.some(mesh => !manifestIds.has(mesh.id))) {
    throw new Error('draft-rig-landmark-mesh-inventory');
  }
  const bindings = resolveClusterMeshBindings(root, inventory);
  const avatarInverse = root.matrixWorld.clone().invert();
  return bindings.map(binding => ({
    meshId: binding.meshId,
    meshToAvatar: avatarInverse.clone().multiply(binding.mesh.matrixWorld).toArray(),
  }));
}

/** Build a read-only candidate review. No rig, mesh, or evidence is mutated. */
export function createDraftRigLandmarkReview(
  evidence: StudioLandmarkEvidenceBundle,
  root: THREE.Object3D,
  manifest: ClusterManifest,
  template: DraftRigTemplate,
  assignments: readonly DraftRigLandmarkAssignment[] = [],
): DraftRigLandmarkReview {
  if (evidence.sourceAssetSha256 !== manifest.sourceAssetSha256 ||
      evidence.form !== manifest.form ||
      (evidence.form === 'animal' ? template !== 'quadruped' : template === 'quadruped')) {
    throw new Error('draft-rig-landmark-source-form');
  }
  const transforms = captureDraftRigLandmarkTransforms(root, manifest);
  const report = resolveDraftRigLandmarkAnchors(evidence, transforms, template, assignments);
  return {
    format: 'pakachi-draft-rig-landmark-review',
    version: 1,
    avatarId: evidence.avatarId,
    formId: evidence.formId,
    sourceAssetSha256: evidence.sourceAssetSha256,
    sourceImageSha256: evidence.sourceImageSha256,
    template,
    report,
    status: 'review-required',
  };
}

/**
 * Explicitly confirm candidate anchors after optional position correction.
 * Every supplied candidate must resolve to one unique joint; unresolved picks
 * stay unresolved until the caller supplies an explicit assignment and rebuilds
 * the review. Confirmation creates a plan only; it does not edit the rig.
 */
export function confirmDraftRigLandmarkReview(
  review: DraftRigLandmarkReview,
  corrections: readonly DraftRigLandmarkCorrection[],
): ConfirmedDraftRigLandmarkPlan {
  if (!review || review.format !== 'pakachi-draft-rig-landmark-review' ||
      review.version !== 1 || review.status !== 'review-required' ||
      !Array.isArray(corrections) || corrections.length !== review.report.anchors.length ||
      review.report.unresolved.length > 0) {
    throw new Error('draft-rig-landmark-review-incomplete');
  }
  const byId = new Map<string, DraftRigLandmarkCorrection>();
  for (const correction of corrections) {
    if (!correction || !idPattern.test(correction.landmarkId) ||
        !(typeof correction.jointName === 'string' && /^[A-Z][A-Za-z0-9]{0,63}$/.test(correction.jointName)) || byId.has(correction.landmarkId) ||
        (correction.position !== undefined &&
          (!Array.isArray(correction.position) || correction.position.length !== 3 ||
           !correction.position.every(value => Number.isFinite(value) && Math.abs(value) <= 1e6)))) {
      throw new Error('draft-rig-landmark-correction');
    }
    byId.set(correction.landmarkId, correction);
  }
  const usedJoints = new Set<string>();
  const anchors = review.report.anchors.map(anchor => {
    const correction = byId.get(anchor.landmarkId);
    if (!correction || correction.jointName !== anchor.jointName ||
        usedJoints.has(correction.jointName)) {
      throw new Error('draft-rig-landmark-joint-review');
    }
    usedJoints.add(correction.jointName);
    return {
      ...structuredClone(anchor),
      ...(correction.position ? { position: [...correction.position] as [number, number, number] } : {}),
    };
  });
  return {
    format: 'pakachi-confirmed-draft-rig-landmark-plan',
    version: 1,
    avatarId: review.avatarId,
    formId: review.formId,
    sourceAssetSha256: review.sourceAssetSha256,
    sourceImageSha256: review.sourceImageSha256,
    template: review.template,
    status: 'user-confirmed',
    anchors,
  };
}
