import { recomputeClusterAssignments, validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterAssignment, ClusterManifest } from './cluster-architecture.ts';

export interface SkinWeightMeshEvidence {
  meshId: string;
  vertexCount: number;
  triangleCount: number;
  /** Four skin indices and four normalized weights per source vertex. */
  skinIndices: ArrayLike<number>;
  skinWeights: ArrayLike<number>;
  /** Explicit bone-index -> semantic part mapping; null means deliberately unmapped. */
  bonePartIds: readonly (string | null)[];
  /** Source triangle indices; null means sequential non-indexed triangles. */
  indices: ArrayLike<number> | null;
}
export interface SkinWeightClassificationOptions {
  minConfidence?: number;
  ambiguityMargin?: number;
  generatedAt?: string;
}
export interface SkinWeightClassificationReport {
  manifest: ClusterManifest;
  classified: number;
  ambiguous: number;
  unmapped: number;
}

/**
 * Conservatively proposes anatomical triangle ownership from an existing rig.
 * Per-vertex skin weights are aggregated by explicitly supplied semantic part
 * IDs. Triangles crossing a part boundary remain unassigned for review.
 * No geometry, skin weights, source assets or locked user assignments mutate.
 */
export function proposeSkinWeightClusterAssignments(
  current: ClusterManifest,
  sourceAssetSha256: string,
  evidence: readonly SkinWeightMeshEvidence[],
  options: SkinWeightClassificationOptions = {},
): SkinWeightClassificationReport {
  const issues = validateClusterManifest(current);
  if (issues.length) throw new Error('Invalid source cluster manifest: ' + issues.map(issue => issue.code).join(', '));
  if (sourceAssetSha256 !== current.sourceAssetSha256) throw new Error('Skin-weight evidence belongs to a different source asset.');
  if (!Array.isArray(evidence) || evidence.length === 0 || evidence.length > current.meshes.length) {
    throw new Error('Skin-weight evidence must contain a bounded, non-empty mesh selection.');
  }
  const minConfidence = options.minConfidence ?? .65;
  const ambiguityMargin = options.ambiguityMargin ?? .15;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  if (!Number.isFinite(minConfidence) || minConfidence <= 0 || minConfidence > 1 ||
      !Number.isFinite(ambiguityMargin) || ambiguityMargin < 0 || ambiguityMargin >= 1 ||
      !Number.isFinite(Date.parse(generatedAt))) throw new Error('Invalid skin-weight classification options.');

  const meshes = new Map(current.meshes.map(mesh => [mesh.id, mesh]));
  const parts = new Set(current.parts.map(part => part.id));
  const seen = new Set<string>();
  const proposed = new Map<string, ClusterAssignment[]>();
  let classified = 0, ambiguous = 0, unmapped = 0;

  for (const item of evidence) {
    if (!item || typeof item.meshId !== 'string' || seen.has(item.meshId)) throw new Error('Invalid or duplicate skin-weight mesh ID.');
    seen.add(item.meshId);
    const mesh = meshes.get(item.meshId);
    if (!mesh || item.vertexCount !== mesh.vertexCount || item.triangleCount !== mesh.triangleCount ||
        !Number.isSafeInteger(item.vertexCount) || item.vertexCount < 3 ||
        !Number.isSafeInteger(item.triangleCount) || item.triangleCount < 1 ||
        !item.skinIndices || !item.skinWeights ||
        item.skinIndices.length !== item.vertexCount * 4 || item.skinWeights.length !== item.vertexCount * 4 ||
        !Array.isArray(item.bonePartIds) || item.bonePartIds.length === 0 || item.bonePartIds.length > 256 ||
        item.bonePartIds.some((partId: string | null) => partId !== null && (typeof partId !== 'string' || !parts.has(partId)))) {
      throw new Error('Skin-weight evidence does not match the source mesh inventory or semantic catalog.');
    }
    const elementCount = item.indices?.length ?? item.vertexCount;
    if (!Number.isSafeInteger(elementCount) || elementCount !== item.triangleCount * 3) {
      throw new Error('Skin-weight triangle indices do not match the source mesh inventory.');
    }

    const vertexParts: Map<string, number>[] = [];
    for (let vertex = 0; vertex < item.vertexCount; vertex++) {
      const contributions = new Map<string, number>();
      let total = 0;
      for (let slot = 0; slot < 4; slot++) {
        const offset = vertex * 4 + slot;
        const bone = item.skinIndices[offset]!;
        const weight = item.skinWeights[offset]!;
        if (!Number.isSafeInteger(bone) || bone < 0 || bone >= item.bonePartIds.length ||
            !Number.isFinite(weight) || weight < 0 || weight > 1) {
          throw new Error('Invalid skin index or weight in source mesh.');
        }
        total += weight;
        const partId = item.bonePartIds[bone];
        if (weight > 0 && partId) contributions.set(partId, (contributions.get(partId) ?? 0) + weight);
      }
      if (Math.abs(total - 1) > 1e-4) throw new Error('Source skin weights are not normalized.');
      vertexParts.push(contributions);
    }

    const assignments: ClusterAssignment[] = [];
    for (let triangle = 0; triangle < item.triangleCount; triangle++) {
      const scores = new Map<string, number>();
      for (let corner = 0; corner < 3; corner++) {
        const element = triangle * 3 + corner;
        const vertex = item.indices ? item.indices[element]! : element;
        if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= item.vertexCount) {
          throw new Error('Skin-weight triangle references an invalid source vertex.');
        }
        for (const [partId, weight] of vertexParts[vertex]!) {
          scores.set(partId, (scores.get(partId) ?? 0) + weight / 3);
        }
      }
      const ranked = [...scores].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const best = ranked[0];
      const second = ranked[1];
      const confidence = best?.[1] ?? 0;
      const margin = confidence - (second?.[1] ?? 0);
      const accepted = !!best && confidence >= minConfidence && margin >= ambiguityMargin;
      if (accepted) classified++;
      else if (confidence > 0) ambiguous++;
      else unmapped++;
      assignments.push({
        meshId: item.meshId,
        triangleIndex: triangle,
        partId: accepted ? best[0] : null,
        surfaceLayerId: null,
        origin: 'automatic',
        policy: 'recomputable',
        confidence: accepted ? Math.max(0, Math.min(1, confidence)) : 0,
        reason: accepted
          ? 'Skin-weight anatomy proposal; explicit bone-to-part mapping, review required.'
          : confidence > 0
            ? 'Triangle spans multiple anatomical parts or lacks a decisive skin-weight majority.'
            : 'No mapped anatomical bone influence covers this triangle.',
      });
    }
    proposed.set(item.meshId, assignments);
  }

  const candidate: ClusterManifest = {
    ...structuredClone(current),
    algorithmId: 'skin-weight-anatomy',
    algorithmVersion: '0.1.0',
    generatedAt,
    assignments: current.assignments
      .filter(assignment => !proposed.has(assignment.meshId))
      .concat(...proposed.values()),
  };
  const manifest = recomputeClusterAssignments(current, candidate);
  return { manifest, classified, ambiguous, unmapped };
}
