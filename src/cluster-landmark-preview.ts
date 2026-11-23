import type { ClusterManifest } from './cluster-architecture.ts';
import type { StudioLandmarkEvidenceBundle } from './studio-landmark-evidence.ts';

export interface ClusterLandmarkPreviewItem {
  meshId: string;
  triangleIndex: number;
  status: 'single-evidence' | 'corroborated' | 'conflict';
  evidenceCount: number;
  landmarkIds: string[];
  proposedPartId: string | null;
  proposedSurfaceLayerId: string | null;
  reasons: string[];
}

export interface ClusterLandmarkClassificationPreview {
  format: 'pakachi-cluster-landmark-classification-preview';
  version: 1;
  sourceAssetSha256: string;
  sourceImageSha256: string;
  avatarId: string;
  formId: string;
  form: 'animal' | 'humanoid';
  policy: 'review-only';
  automaticAssignmentsApplied: false;
  items: ClusterLandmarkPreviewItem[];
}

/**
 * Groups explicit surface hits by exact source triangle. A proposal is emitted
 * only as review metadata; this function never writes or mutates a manifest.
 * No spatial propagation, neighboring-triangle inference, or mesh-wide label
 * is performed.
 */
export function createClusterLandmarkClassificationPreview(
  manifest: ClusterManifest,
  evidence: StudioLandmarkEvidenceBundle,
): ClusterLandmarkClassificationPreview {
  if (!manifest || !evidence || manifest.sourceAssetSha256 !== evidence.sourceAssetSha256 ||
      manifest.form !== evidence.form || (manifest.form !== 'animal' && manifest.form !== 'humanoid') ||
      evidence.format !== 'pakachi-cluster-landmark-evidence' || evidence.version !== 1 ||
      evidence.formMappingConfirmed !== true || !Array.isArray(evidence.correspondences) ||
      evidence.correspondences.length === 0 || evidence.correspondences.length > 10000) {
    throw new Error('Landmarken-Beleg und Form-Manifest passen nicht zusammen oder sind unvollständig.');
  }
  const meshes = new Map(manifest.meshes.map(mesh => [mesh.id, mesh]));
  const parts = new Set(manifest.parts.map(part => part.id));
  const layers = new Map(manifest.layers.map(layer => [layer.id, layer]));
  const groups = new Map<string, typeof evidence.correspondences>();
  for (const item of evidence.correspondences) {
    const mesh = meshes.get(item.meshId);
    if (!mesh || !Number.isSafeInteger(item.triangleIndex) || item.triangleIndex < 0 ||
        item.triangleIndex >= mesh.triangleCount || !parts.has(item.partId) ||
        (item.surfaceLayerId !== null && !layers.has(item.surfaceLayerId)) ||
        item.origin !== 'user' || item.policy !== 'locked') {
      throw new Error('Landmarken-Beleg enthält eine ungültige Mesh-, Dreiecks- oder Semantikreferenz.');
    }
    const key = item.meshId + ':' + item.triangleIndex;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  const items: ClusterLandmarkPreviewItem[] = [...groups.values()].map(group => {
    const first = group[0]!;
    const partIds = new Set(group.map(item => item.partId));
    const layerIds = new Set(group.map(item => item.surfaceLayerId));
    const conflict = partIds.size !== 1 || layerIds.size !== 1;
    return {
      meshId: first.meshId,
      triangleIndex: first.triangleIndex,
      status: conflict ? 'conflict' : group.length > 1 ? 'corroborated' : 'single-evidence',
      evidenceCount: group.length,
      landmarkIds: group.map(item => item.landmarkId).sort(),
      proposedPartId: partIds.size === 1 ? first.partId : null,
      proposedSurfaceLayerId: layerIds.size === 1 ? first.surfaceLayerId : null,
      reasons: conflict
        ? ['Mehrere bestätigte Landmarken widersprechen sich für dasselbe Dreieck; keine Semantik vorgeschlagen.']
        : group.length > 1
          ? ['Mehrere bestätigte Landmarken stimmen für dasselbe Dreieck überein; manuelle Prüfung erforderlich.']
          : ['Ein einzelner bestätigter Oberflächenpunkt; nur lokaler Hinweis, keine Flächenklassifizierung.'],
    };
  }).sort((a, b) => a.meshId.localeCompare(b.meshId) || a.triangleIndex - b.triangleIndex);
  return {
    format: 'pakachi-cluster-landmark-classification-preview',
    version: 1,
    sourceAssetSha256: manifest.sourceAssetSha256,
    sourceImageSha256: evidence.sourceImageSha256,
    avatarId: evidence.avatarId,
    formId: evidence.formId,
    form: evidence.form,
    policy: 'review-only',
    automaticAssignmentsApplied: false,
    items,
  };
}
