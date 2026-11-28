import type { ImageReferenceDocument } from './image-reference.ts';
import { createCalibratedLandmarkObservations } from './studio-landmark-projection.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { Landmark2DObservation, LandmarkTriangulationOptions, LandmarkTriangulationReport } from './cluster-landmark-projection.ts';
import { proposeClusterManifestFrom2DObservations } from './cluster-landmark-pipeline.ts';

export interface ImageReferenceClusterPipelineInput {
  current: ClusterManifest;
  sourceAssetSha256: string;
  /** Explicit mapping from the selected reference form to the opened model form. */
  targetForm: 'animal' | 'humanoid';
  meshId: string;
  positions: ArrayLike<number>;
  indices: ArrayLike<number> | null;
  meshWorld: readonly number[];
  /** Explicitly identifies the coordinate frame represented by meshWorld. */
  meshCoordinateFrameId: string;
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
  if ((input.targetForm !== 'animal' && input.targetForm !== 'humanoid') || input.current.form !== input.targetForm) {
    throw new Error('The explicitly selected image-reference form does not match the target model form.');
  }
  if (!/^[a-z0-9][a-z0-9_-]{0,127}$/.test(input.meshCoordinateFrameId)) {
    throw new Error('An explicit target mesh coordinate-frame ID is required.');
  }
  const observations = createCalibratedLandmarkObservations(input.imageReference, input.identity);
  if (observations.some(item => item.camera.coordinateFrameId !== input.meshCoordinateFrameId)) {
    throw new Error('Camera and target mesh coordinate frames are missing or do not match. Calibrate every view in the target model frame.');
  }
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

export interface ImageReferenceClusterMeshInput {
  meshId: string;
  positions: ArrayLike<number>;
  indices: ArrayLike<number> | null;
  /** Mesh-local to the explicitly named model coordinate frame. */
  meshWorld: readonly number[];
}

export interface ImageReferenceClusterBatchPipelineInput {
  current: ClusterManifest;
  sourceAssetSha256: string;
  /** Explicit mapping from the selected reference form to the opened model form. */
  targetForm: 'animal' | 'humanoid';
  meshes: readonly ImageReferenceClusterMeshInput[];
  meshCoordinateFrameId: string;
  imageReference: ImageReferenceDocument;
  identity: { avatarId: string; formId: string; poseId: string; radiusWorld: number };
  triangulationOptions?: LandmarkTriangulationOptions;
}

export interface ImageReferenceClusterBatchPipelineResult {
  candidate: ClusterManifest | null;
  observations: Landmark2DObservation[];
  meshResults: Array<{
    meshId: string;
    triangulation: LandmarkTriangulationReport;
    classifiedTriangles: number;
    unresolvedTriangles: number;
  }>;
}

/**
 * Runs the source-bound image-reference pipeline over an exact, caller-verified
 * set of mesh bindings. All camera transforms and mesh matrices must use the
 * same explicitly named model-root coordinate frame. The aggregate candidate
 * remains review-only and is never applied to the source manifest.
 */
export function proposeClusterManifestsFromImageReference(
  input: ImageReferenceClusterBatchPipelineInput,
  generatedAt = new Date().toISOString(),
): ImageReferenceClusterBatchPipelineResult {
  if (!input || !Array.isArray(input.meshes) || input.meshes.length === 0 || input.meshes.length > 64) {
    throw new Error('A bounded, non-empty set of exact target mesh bindings is required.');
  }
  if ((input.targetForm !== 'animal' && input.targetForm !== 'humanoid') || input.current.form !== input.targetForm) {
    throw new Error('The explicitly selected image-reference form does not match the target model form.');
  }
  if (!/^[a-z0-9][a-z0-9_-]{0,127}$/.test(input.meshCoordinateFrameId)) {
    throw new Error('An explicit target mesh coordinate-frame ID is required.');
  }
  const meshIds = input.meshes.map(item => item?.meshId);
  if (meshIds.some(id => typeof id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(id)) ||
      new Set(meshIds).size !== meshIds.length) {
    throw new Error('Target mesh bindings contain an invalid or duplicate mesh ID.');
  }
  if (input.current.sourceAssetSha256 !== input.sourceAssetSha256) {
    throw new Error('Target mesh bindings do not belong to the current source asset.');
  }
  const observations = createCalibratedLandmarkObservations(input.imageReference, input.identity);
  if (!observations.length) {
    throw new Error('No confirmed landmarks have matching source-bound camera calibrations for the selected avatar, form and pose.');
  }
  if (observations.some(item => item.camera.coordinateFrameId !== input.meshCoordinateFrameId)) {
    throw new Error('Camera and target mesh coordinate frames are missing or do not match. Calibrate every view in the target model frame.');
  }
  let candidate = structuredClone(input.current);
  const meshResults: ImageReferenceClusterBatchPipelineResult['meshResults'] = [];
  for (const mesh of input.meshes) {
    const result = proposeClusterManifestFrom2DObservations({
      current: candidate,
      sourceAssetSha256: input.sourceAssetSha256,
      meshId: mesh.meshId,
      positions: mesh.positions,
      indices: mesh.indices,
      meshWorld: mesh.meshWorld,
      avatarId: input.identity.avatarId,
      formId: input.identity.formId,
      poseId: input.identity.poseId,
      observations,
      triangulationOptions: input.triangulationOptions,
    }, generatedAt);
    if (result.candidate) candidate = result.candidate;
    meshResults.push({
      meshId: mesh.meshId,
      triangulation: result.triangulation,
      classifiedTriangles: result.classifiedTriangles,
      unresolvedTriangles: result.unresolvedTriangles,
    });
  }
  const hasTriangulatedSeeds = meshResults.some(result => result.triangulation.seeds.length > 0);
  return { candidate: hasTriangulatedSeeds ? candidate : null, observations, meshResults };
}

