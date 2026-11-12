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
