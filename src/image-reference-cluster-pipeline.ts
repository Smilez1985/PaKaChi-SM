import type { ImageReferenceDocument } from './image-reference.ts';
import { createCalibratedLandmarkObservations } from './studio-landmark-projection.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { LandmarkTriangulationOptions } from './cluster-landmark-projection.ts';
import { proposeClusterManifestFrom2DObservations } from './cluster-landmark-pipeline.ts';

export interface ImageReferenceClusterPipelineInput {
  current: ClusterManifest;
  sourceAssetSha256: string;
  meshId: string;
  positions: ArrayLike<number>;
  indices: ArrayLike<number> | null;
  meshWorld: readonly number[];
  imageReference: ImageReferenceDocument;
  /** All identity fields are explicit; no avatar, form, pose or view is inferred. */
  identity: { avatarId: string; formId: string; poseId: string; radiusWorld: number };
  triangulationOptions?: LandmarkTriangulationOptions;
}

/**
 * End-to-end, review-only bridge from a source-bound image-reference document
 * to a cluster-manifest candidate. Only confirmed regions with matching
 * explicit camera calibrations contribute. No candidate is applied or saved.
 */
export function proposeClusterManifestFromImageReference(
  input: ImageReferenceClusterPipelineInput,
  generatedAt = new Date().toISOString(),
) {
  if (!input?.imageReference || !input.identity) {
    throw new Error('An image-reference document and explicit avatar/form/pose identity are required.');
  }
  const observations = createCalibratedLandmarkObservations(input.imageReference, input.identity);
  if (!observations.length) {
    throw new Error('No confirmed landmarks have matching source-bound camera calibrations for the selected avatar, form and pose.');
  }
  const result = proposeClusterManifestFrom2DObservations({
    current: input.current,
    sourceAssetSha256: input.sourceAssetSha256,
    meshId: input.meshId,
    positions: input.positions,
    indices: input.indices,
    meshWorld: input.meshWorld,
    avatarId: input.identity.avatarId,
    formId: input.identity.formId,
    poseId: input.identity.poseId,
    observations,
    triangulationOptions: input.triangulationOptions,
  }, generatedAt);
  return { ...result, observations };
}
