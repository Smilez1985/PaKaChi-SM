import type { ClusterManifest } from './cluster-architecture.ts';
import { proposeClusterManifestFromLandmarkEvidence } from './cluster-landmark-classifier.ts';
import type { Landmark2DObservation, LandmarkTriangulationOptions, LandmarkTriangulationReport } from './cluster-landmark-projection.ts';
import { triangulateLandmarkSeeds } from './cluster-landmark-projection.ts';

export interface Cluster2DLandmarkPipelineInput {
  current: ClusterManifest;
  sourceAssetSha256: string;
  meshId: string;
  positions: ArrayLike<number>;
  indices: ArrayLike<number> | null;
  /** World transform of the exact mesh whose position buffer is supplied. */
  meshWorld: readonly number[];
  observations: readonly Landmark2DObservation[];
  triangulationOptions?: LandmarkTriangulationOptions;
}

export interface Cluster2DLandmarkPipelineResult {
  candidate: ClusterManifest | null;
  triangulation: LandmarkTriangulationReport;
  classifiedTriangles: number;
  unresolvedTriangles: number;
}

/**
 * End-to-end bridge from calibrated 2D observations to a validated manifest
 * candidate for one source mesh. Rejected 2D landmarks stay out of the
 * classifier; when none triangulate, no candidate is created or applied.
 */
export function proposeClusterManifestFrom2DObservations(
  input: Cluster2DLandmarkPipelineInput,
  generatedAt = new Date().toISOString(),
): Cluster2DLandmarkPipelineResult {
  if (!input || !input.current || typeof input.meshId !== 'string') {
    throw new Error('A source manifest and target mesh ID are required.');
  }
  const mesh = input.current.meshes.find(item => item.id === input.meshId);
  if (!mesh) throw new Error('Target mesh is not part of the source manifest inventory.');
  if (input.positions.length / 3 !== mesh.vertexCount) {
    throw new Error('Position buffer does not match the target mesh vertex inventory.');
  }
  const triangulation = triangulateLandmarkSeeds(
    input.observations,
    input.meshWorld,
    input.triangulationOptions,
  );
  if (triangulation.seeds.length === 0) {
    return {
      candidate: null,
      triangulation,
      classifiedTriangles: 0,
      unresolvedTriangles: mesh.triangleCount,
    };
  }
  const candidate = proposeClusterManifestFromLandmarkEvidence(
    input.current,
    input.sourceAssetSha256,
    [{
      meshId: input.meshId,
      positions: input.positions,
      indices: input.indices,
      seeds: triangulation.seeds,
    }],
    generatedAt,
  );
  const assignments = candidate.assignments.filter(item => item.meshId === input.meshId);
  const classifiedTriangles = assignments.filter(item => item.partId !== null).length;
  return {
    candidate,
    triangulation,
    classifiedTriangles,
    unresolvedTriangles: assignments.length - classifiedTriangles,
  };
}
