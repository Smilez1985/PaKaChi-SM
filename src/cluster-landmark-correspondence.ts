import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterForm, ClusterManifest } from './cluster-architecture.ts';
import type { ClusterLandmarkSeed } from './cluster-landmark-classifier.ts';

export interface ReviewedLandmarkSurfacePick {
  landmarkId: string;
  sourceImageSha256: string;
  avatarId: string;
  formId: string;
  viewId: string;
  poseId: string;
  meshId: string;
  triangleIndex: number;
  barycentric: readonly [number, number, number];
  partId: string;
  surfaceLayerId?: string | null;
  radiusLocal: number;
  confirmed: true;
}

export interface ReviewedLandmarkSurfaceGeometry {
  meshId: string;
  positions: ArrayLike<number>;
  indices: ArrayLike<number> | null;
}

export interface ReviewedLandmarkCorrespondenceInput {
  current: ClusterManifest;
  sourceAssetSha256: string;
  sourceImageSha256: string;
  avatarId: string;
  formId: string;
  form: Exclude<ClusterForm, 'imported'>;
  picks: readonly ReviewedLandmarkSurfacePick[];
  geometry: readonly ReviewedLandmarkSurfaceGeometry[];
}

export interface ReviewedLandmarkCorrespondence {
  landmarkId: string;
  viewId: string;
  poseId: string;
  meshId: string;
  triangleIndex: number;
  partId: string;
  surfaceLayerId: string | null;
  position: readonly [number, number, number];
  radius: number;
  origin: 'user';
  policy: 'locked';
}

export interface ReviewedLandmarkCorrespondenceReport {
  seeds: ClusterLandmarkSeed[];
  correspondences: ReviewedLandmarkCorrespondence[];
}

/**
 * Resolve explicit 2D-to-3D correspondences from user-picked mesh surface
 * triangles. This is a reviewed surface mapping, not camera triangulation:
 * no depth, camera pose, or hidden geometry is inferred from a 2D image.
 */
export function resolveReviewedLandmarkSurfacePicks(
  input: ReviewedLandmarkCorrespondenceInput,
): ReviewedLandmarkCorrespondenceReport {
  if (!input || !input.current) throw new Error('A source cluster manifest is required.');
  const issues = validateClusterManifest(input.current);
  if (issues.length) throw new Error('Invalid source cluster manifest: ' + issues.map(issue => issue.code).join(', '));
  const hash = /^[a-f0-9]{64}$/;
  const id = /^[a-z0-9][a-z0-9_-]{0,127}$/;
  if (!hash.test(input.sourceAssetSha256) || input.sourceAssetSha256 !== input.current.sourceAssetSha256) {
    throw new Error('Reviewed picks belong to a different source 3D asset.');
  }
  if (!hash.test(input.sourceImageSha256) || !id.test(input.avatarId) || !id.test(input.formId) ||
      !['animal', 'humanoid'].includes(input.form) || input.current.form !== input.form) {
    throw new Error('Invalid reviewed source image, avatar, or form provenance.');
  }
  if (!Array.isArray(input.picks) || input.picks.length === 0 || input.picks.length > 10000 ||
      !Array.isArray(input.geometry)) {
    throw new Error('Reviewed correspondence picks and geometry must be bounded arrays.');
  }
  const meshes = new Map(input.current.meshes.map(mesh => [mesh.id, mesh]));
  const parts = new Set(input.current.parts.map(part => part.id));
  const layers = new Map(input.current.layers.map(layer => [layer.id, layer]));
  const geometry = new Map(input.geometry.map(item => [item.meshId, item]));
  if (geometry.size !== input.geometry.length) throw new Error('Duplicate reviewed mesh geometry.');
  const seen = new Set<string>();
  const seeds: ClusterLandmarkSeed[] = [];
  const correspondences: ReviewedLandmarkCorrespondence[] = [];

  for (const pick of input.picks) {
    if (!pick || pick.confirmed !== true || !id.test(pick.landmarkId) ||
        !id.test(pick.viewId) || !id.test(pick.poseId) ||
        pick.sourceImageSha256 !== input.sourceImageSha256 ||
        pick.avatarId !== input.avatarId || pick.formId !== input.formId) {
      throw new Error('A reviewed pick is unconfirmed or has mismatched 2D provenance.');
    }
    if (seen.has(pick.landmarkId)) throw new Error('A 2D landmark may have only one reviewed 3D surface correspondence.');
    seen.add(pick.landmarkId);
    if (!parts.has(pick.partId)) throw new Error('Reviewed pick references an unknown anatomical part.');
    if (pick.surfaceLayerId != null) {
      const layer = layers.get(pick.surfaceLayerId);
      if (!layer || (layer.partId !== null && layer.partId !== pick.partId)) {
        throw new Error('Reviewed pick references an incompatible surface layer.');
      }
    }
    if (!Number.isSafeInteger(pick.triangleIndex) || pick.triangleIndex < 0 ||
        !Array.isArray(pick.barycentric) || pick.barycentric.length !== 3 ||
        !pick.barycentric.every(Number.isFinite) ||
        pick.barycentric.some(value => value < 0 || value > 1) ||
        Math.abs(pick.barycentric.reduce((sum, value) => sum + value, 0) - 1) > 1e-5 ||
        !Number.isFinite(pick.radiusLocal) || pick.radiusLocal <= 0) {
      throw new Error('Invalid triangle, barycentric coordinates, or local evidence radius.');
    }
    const mesh = meshes.get(pick.meshId);
    const buffers = geometry.get(pick.meshId);
    if (!mesh || !buffers) throw new Error('Reviewed pick references a mesh outside the supplied source inventory.');
    if (buffers.positions.length !== mesh.vertexCount * 3) throw new Error('Picked mesh position buffer does not match source inventory.');
    const indexCount = buffers.indices?.length ?? mesh.vertexCount;
    if (indexCount !== mesh.triangleCount * 3 || pick.triangleIndex >= mesh.triangleCount) {
      throw new Error('Picked triangle is outside the source mesh inventory.');
    }
    const vertices = [0, 1, 2].map(corner => {
      const element = pick.triangleIndex * 3 + corner;
      const vertexIndex = buffers.indices ? buffers.indices[element] : element;
      if (!Number.isSafeInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= mesh.vertexCount) {
        throw new Error('Picked triangle contains an invalid vertex index.');
      }
      const offset = vertexIndex * 3;
      const point = [buffers.positions[offset], buffers.positions[offset + 1], buffers.positions[offset + 2]];
      if (!point.every(Number.isFinite)) throw new Error('Picked triangle contains non-finite vertex coordinates.');
      return point as [number, number, number];
    });
    const position = [0, 1, 2].map(axis =>
      vertices[0]![axis]! * pick.barycentric[0] +
      vertices[1]![axis]! * pick.barycentric[1] +
      vertices[2]![axis]! * pick.barycentric[2],
    ) as [number, number, number];
    seeds.push({ partId: pick.partId, position, radius: pick.radiusLocal, surfaceLayerId: pick.surfaceLayerId ?? null });
    correspondences.push({
      landmarkId: pick.landmarkId, viewId: pick.viewId, poseId: pick.poseId,
      meshId: pick.meshId, triangleIndex: pick.triangleIndex, partId: pick.partId,
      surfaceLayerId: pick.surfaceLayerId ?? null, position, radius: pick.radiusLocal,
      origin: 'user', policy: 'locked',
    });
  }
  return { seeds, correspondences };
}
