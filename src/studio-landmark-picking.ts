import type { ImageReferenceDocument } from './image-reference.ts';
import { imageReferenceLandmarksToCluster2DSeeds } from './cluster-2d-classifier.ts';
import type { ClusterMeshInventory } from './cluster-inventory.ts';
import type { StudioLandmarkSurfacePick } from './studio-data.ts';

export interface StudioSurfacePickHit {
  meshIndex: number;
  triangleIndex: number;
  barycentric: readonly [number, number, number];
}

export interface CreateStudioLandmarkSurfacePickInput {
  document: ImageReferenceDocument;
  inventory: ClusterMeshInventory;
  landmarkId: string;
  hit: StudioSurfacePickHit;
  radiusLocal: number;
  /** True only after the user explicitly confirms the selected 3D surface point. */
  confirmed: boolean;
}

/**
 * Bind a ray-picked 3D triangle to one explicitly selected, confirmed 2D landmark.
 * The inventory index is resolved immediately to its source-hash-bound stable mesh ID.
 */
export function createStudioLandmarkSurfacePick(
  input: CreateStudioLandmarkSurfacePickInput,
): StudioLandmarkSurfacePick {
  if (!input || input.confirmed !== true) throw new Error('A surface correspondence requires explicit user confirmation.');
  const { document, inventory, hit } = input;
  if (!inventory || inventory.schemaVersion !== 1 ||
      !/^[a-f0-9]{64}$/.test(inventory.sourceAssetSha256) ||
      !Array.isArray(inventory.meshes) || !inventory.meshes.length) {
    throw new Error('A valid source-bound mesh inventory is required.');
  }
  if (!document || !/^[a-f0-9]{64}$/.test(document.source?.sha256)) {
    throw new Error('A valid source image hash is required.');
  }
  if (!hit || !Number.isSafeInteger(hit.meshIndex) || hit.meshIndex < 0 ||
      hit.meshIndex >= inventory.meshes.length ||
      !Number.isSafeInteger(hit.triangleIndex) || hit.triangleIndex < 0) {
    throw new Error('The selected mesh or triangle is outside the source inventory.');
  }
  const mesh = inventory.meshes[hit.meshIndex]!;
  if (!mesh || typeof mesh.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(mesh.id) ||
      hit.triangleIndex >= mesh.triangleCount) {
    throw new Error('The selected triangle does not belong to the source mesh.');
  }
  const weights = hit.barycentric;
  if (!Array.isArray(weights) || weights.length !== 3 ||
      !weights.every(value => Number.isFinite(value) && value >= 0 && value <= 1) ||
      Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) > 1e-5) {
    throw new Error('The selected surface point has invalid barycentric coordinates.');
  }
  if (!Number.isFinite(input.radiusLocal) || input.radiusLocal <= 0 || input.radiusLocal > 10) {
    throw new Error('The local surface influence radius must be greater than zero and at most 10.');
  }
  const seed = imageReferenceLandmarksToCluster2DSeeds(document).find(item => item.id === input.landmarkId);
  if (!seed) throw new Error('Select a landmark belonging to a confirmed image region.');
  return {
    landmarkId: seed.id,
    sourceImageSha256: document.source.sha256,
    avatarId: seed.avatarId,
    formId: seed.formId,
    viewId: seed.viewId,
    poseId: seed.poseId,
    meshId: mesh.id,
    triangleIndex: hit.triangleIndex,
    barycentric: [weights[0], weights[1], weights[2]],
    partId: seed.partId,
    surfaceLayerId: seed.surfaceLayerId ?? null,
    radiusLocal: input.radiusLocal,
    confirmed: true,
  };
}
