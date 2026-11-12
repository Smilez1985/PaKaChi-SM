import type {ClusterAssignment} from './cluster-architecture.ts';

export interface ClusterLandmarkSeed {
  partId: string;
  position: readonly [number, number, number];
  radius: number;
  surfaceLayerId?: string | null;
}
export interface LandmarkClassificationOptions {
  /** Minimum relative separation between the best and second-best region. */
  ambiguityMargin?: number;
  maxTriangles?: number;
}
export interface LandmarkClassificationReport {
  assignments: ClusterAssignment[];
  classified: number;
  ambiguous: number;
  outsideEvidence: number;
}

/**
 * Proposes triangle ownership from caller-supplied semantic landmark seeds.
 * Coordinates must already use the same space as the supplied positions.
 * No character-specific coordinates, rig, geometry mutation or mesh splitting.
 * A triangle is left unresolved when it exceeds every seed radius or competing
 * regions are too close to distinguish safely.
 */
export function proposeLandmarkClusterAssignments(
  meshId: string,
  positions: ArrayLike<number>,
  indices: ArrayLike<number> | null,
  seeds: readonly ClusterLandmarkSeed[],
  options: LandmarkClassificationOptions = {},
): LandmarkClassificationReport {
  if (!/^[a-z0-9][a-z0-9_-]{0,127}$/.test(meshId)) throw new Error('Invalid cluster mesh ID.');
  if (!positions || positions.length < 9 || positions.length % 3 !== 0) throw new Error('Positions must contain complete XYZ vertices.');
  const vertexCount = positions.length / 3;
  const elementCount = indices?.length ?? vertexCount;
  const triangleCount = elementCount / 3;
  const maxTriangles = options.maxTriangles ?? 500_000;
  const ambiguityMargin = options.ambiguityMargin ?? 0.15;
  if (!Number.isSafeInteger(elementCount) || elementCount < 3 || elementCount % 3 !== 0 ||
      !Number.isSafeInteger(triangleCount) || triangleCount > maxTriangles) throw new Error('Invalid or excessive triangle inventory.');
  if (!Number.isFinite(ambiguityMargin) || ambiguityMargin < 0 || ambiguityMargin >= 1) throw new Error('Invalid ambiguity margin.');
  if (!seeds.length || seeds.length > 256) throw new Error('Landmark seeds must contain 1–256 entries.');
  for (const seed of seeds) {
    if (!/^[a-z0-9][a-z0-9_-]{0,127}$/.test(seed.partId) ||
        seed.position.length !== 3 || !seed.position.every(Number.isFinite) ||
        !Number.isFinite(seed.radius) || seed.radius <= 0 ||
        (seed.surfaceLayerId != null && !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(seed.surfaceLayerId))) {
      throw new Error('Invalid anatomical landmark seed.');
    }
  }
  const vertex = (element: number) => {
    const index = indices ? indices[element] : element;
    if (!Number.isSafeInteger(index) || index < 0 || index >= vertexCount) throw new Error('Triangle index is outside the position buffer.');
    const offset = index * 3;
    const point = [positions[offset], positions[offset + 1], positions[offset + 2]];
    if (!point.every(Number.isFinite)) throw new Error('Position buffer contains non-finite coordinates.');
    return point as [number, number, number];
  };
  const assignments: ClusterAssignment[] = [];
  let classified = 0, ambiguous = 0, outsideEvidence = 0;
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const a = vertex(triangle * 3), b = vertex(triangle * 3 + 1), c = vertex(triangle * 3 + 2);
    const samples = [a, b, c, [
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3,
    ] as [number, number, number]];
    const byPart = new Map<string, { score: number; layer: string | null }>();
    for (const seed of seeds) {
      let score = 0;
      for (const point of samples) {
        const distance = Math.hypot(point[0] - seed.position[0], point[1] - seed.position[1], point[2] - seed.position[2]);
        score = Math.max(score, distance / seed.radius);
      }
      const prior = byPart.get(seed.partId);
      if (!prior || score < prior.score) byPart.set(seed.partId, { score, layer: seed.surfaceLayerId ?? null });
    }
    const ranked = [...byPart.entries()].map(([partId, value]) => ({ partId, ...value }))
      .sort((x, y) => x.score - y.score || x.partId.localeCompare(y.partId));
    const best = ranked[0], second = ranked[1];
    const separated = !second || second.score - best.score >= ambiguityMargin * Math.max(best.score, 1e-9);
    const accepted = best.score <= 1 && separated;
    const confidence = accepted ? Math.max(0, Math.min(1, (1 - best.score) * (second ? (second.score - best.score) / Math.max(second.score, 1e-9) : 1))) : 0;
    if (accepted) classified++; else if (best.score > 1) outsideEvidence++; else ambiguous++;
    assignments.push({
      meshId, triangleIndex: triangle,
      partId: accepted ? best.partId : null,
      surfaceLayerId: accepted ? best.layer : null,
      origin: 'automatic', policy: 'recomputable', confidence,
      reason: accepted ? 'Landmark-seed proximity proposal; review required.' :
        best.score > 1 ? 'No anatomical landmark seed covers this triangle.' :
          'Competing anatomical landmark seeds are insufficiently separated.',
    });
  }
  return { assignments, classified, ambiguous, outsideEvidence };
}


import { recomputeClusterAssignments, validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';

export interface ClusterMeshLandmarkEvidence {
  meshId: string;
  positions: ArrayLike<number>;
  indices: ArrayLike<number> | null;
  seeds: readonly ClusterLandmarkSeed[];
}

/**
 * Builds a complete, validated manifest candidate from per-mesh landmark
 * evidence. Evidence is accepted only for the exact source asset and mesh
 * inventory already represented by the manifest. Untouched meshes retain
 * their existing assignments; locked manual assignments are preserved by
 * recomputeClusterAssignments().
 *
 * Positions and seed coordinates must already share one mesh-local 3D space.
 * This adapter deliberately does not infer a 2D-to-3D projection.
 */
export function proposeClusterManifestFromLandmarkEvidence(
  current: ClusterManifest,
  sourceAssetSha256: string,
  evidence: readonly ClusterMeshLandmarkEvidence[],
  generatedAt = new Date().toISOString(),
): ClusterManifest {
  const currentIssues = validateClusterManifest(current);
  if (currentIssues.length) {
    throw new Error('Invalid source cluster manifest: ' + currentIssues.map(issue => issue.code).join(', '));
  }
  if (sourceAssetSha256 !== current.sourceAssetSha256) {
    throw new Error('Landmark evidence belongs to a different source asset.');
  }
  if (!Array.isArray(evidence) || evidence.length === 0) {
    throw new Error('At least one mesh landmark evidence set is required.');
  }
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error('Invalid candidate timestamp.');

  const meshById = new Map(current.meshes.map(mesh => [mesh.id, mesh]));
  const seen = new Set<string>();
  const proposedByMesh = new Map<string, ClusterAssignment[]>();
  const partIds = new Set(current.parts.map(part => part.id));
  const layerIds = new Set(current.layers.map(layer => layer.id));

  for (const item of evidence) {
    if (!item || typeof item.meshId !== 'string' || seen.has(item.meshId)) {
      throw new Error('Landmark evidence contains an invalid or duplicate mesh ID.');
    }
    seen.add(item.meshId);
    const source = meshById.get(item.meshId);
    if (!source) throw new Error('Landmark evidence references a mesh outside the source inventory.');
    if (item.positions.length / 3 !== source.vertexCount) {
      throw new Error('Landmark evidence vertex count does not match the source mesh inventory.');
    }
    const elementCount = item.indices?.length ?? item.positions.length / 3;
    if (elementCount / 3 !== source.triangleCount) {
      throw new Error('Landmark evidence triangle count does not match the source mesh inventory.');
    }
    for (const seed of item.seeds) {
      if (!partIds.has(seed.partId)) throw new Error('Landmark seed references an unknown anatomical part.');
      if (seed.surfaceLayerId != null && !layerIds.has(seed.surfaceLayerId)) {
        throw new Error('Landmark seed references an unknown surface layer.');
      }
    }
    const result = proposeLandmarkClusterAssignments(
      item.meshId, item.positions, item.indices, item.seeds,
    );
    if (result.assignments.length !== source.triangleCount) {
      throw new Error('Landmark classifier did not cover the complete source mesh.');
    }
    proposedByMesh.set(item.meshId, result.assignments);
  }

  const candidate: ClusterManifest = {
    ...structuredClone(current),
    algorithmId: 'landmark-seed-proximity',
    algorithmVersion: '0.1.0',
    generatedAt,
    assignments: current.assignments
      .filter(assignment => !proposedByMesh.has(assignment.meshId))
      .concat(...proposedByMesh.values()),
  };
  const candidateIssues = validateClusterManifest(candidate);
  if (candidateIssues.length) {
    throw new Error('Invalid landmark cluster candidate: ' + candidateIssues.map(issue => issue.code).join(', '));
  }
  return recomputeClusterAssignments(current, candidate);
}
