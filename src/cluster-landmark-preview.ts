import { applyClusterOperation, validateClusterManifest } from './cluster-architecture.ts';
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
    const status: ClusterLandmarkPreviewItem['status'] = conflict ? 'conflict' : group.length > 1 ? 'corroborated' : 'single-evidence';
    return {
      meshId: first.meshId,
      triangleIndex: first.triangleIndex,
      status,
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


/**
 * Applies one explicitly reviewed, non-conflicting triangle proposal.
 * Only the exact source triangle is changed; the user decision is stored as a
 * locked assignment with image/landmark provenance in the manifest override log.
 */
export function acceptClusterLandmarkPreviewItem(
  manifest: ClusterManifest,
  preview: ClusterLandmarkClassificationPreview,
  meshId: string,
  triangleIndex: number,
): ClusterManifest {
  if (!manifest || !preview || preview.format !== 'pakachi-cluster-landmark-classification-preview' ||
      preview.version !== 1 || preview.policy !== 'review-only' || preview.automaticAssignmentsApplied !== false ||
      preview.sourceAssetSha256 !== manifest.sourceAssetSha256 || preview.form !== manifest.form) {
    throw new Error('Klassifikationsvorschau passt nicht zum aktuellen Manifest oder ist nicht review-only.');
  }
  if (!/^[a-f0-9]{64}$/.test(preview.sourceImageSha256)) {
    throw new Error('Bildreferenz-Hash der Vorschau ist ungültig.');
  }
  const item = preview.items.find(candidate => candidate.meshId === meshId && candidate.triangleIndex === triangleIndex);
  if (!item || item.status === 'conflict' || !item.proposedPartId || !item.landmarkIds.length) {
    throw new Error('Dieser Vorschlag ist nicht eindeutig und kann nicht übernommen werden.');
  }
  return applyClusterOperation(manifest, {
    type: 'assign-triangle',
    meshId: item.meshId,
    triangleIndex: item.triangleIndex,
    partId: item.proposedPartId,
    surfaceLayerId: item.proposedSurfaceLayerId,
    sourceImageSha256: preview.sourceImageSha256,
    avatarId: preview.avatarId,
    formId: preview.formId,
    landmarkIds: item.landmarkIds,
  }, 'user', 'locked');
}


/**
 * Restores a previously reviewed landmark manifest onto a freshly generated
 * manifest for the currently open model. Only the exact triangle-review
 * operations are replayed; all source geometry and semantic catalog data must
 * still match. The current image hash is required to prevent stale evidence.
 */
export function restoreReviewedClusterManifest(
  current: ClusterManifest,
  candidate: unknown,
  expectedImageSha256: string,
): ClusterManifest {
  if (!/^[a-f0-9]{64}$/.test(expectedImageSha256)) {
    throw new Error('Aktueller Bildreferenz-Hash ist ungültig.');
  }
  const issues = validateClusterManifest(candidate);
  if (issues.length) throw new Error('Importiertes Manifest ist ungültig: ' + issues.map(issue => issue.code).join(', '));
  const imported = candidate as ClusterManifest;
  const inventoryKey = (manifest: ClusterManifest) => manifest.meshes
    .map(({ id, sourceMeshIndex, sourceMeshName, primitiveIndex, vertexCount, triangleCount, sourceNodeIndex, sourceNodeName, sourceNodePath }) =>
      ({ id, sourceMeshIndex, sourceMeshName, primitiveIndex, vertexCount, triangleCount, sourceNodeIndex, sourceNodeName, sourceNodePath }))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (current.sourceAssetSha256 !== imported.sourceAssetSha256 || current.form !== imported.form ||
      JSON.stringify(inventoryKey(current)) !== JSON.stringify(inventoryKey(imported))) {
    throw new Error('Manifest gehört zu einem anderen Quellmodell, einer anderen Form oder einem veralteten Meshinventar.');
  }
  if (JSON.stringify(current.parts) !== JSON.stringify(imported.parts) ||
      JSON.stringify(current.layers) !== JSON.stringify(imported.layers)) {
    throw new Error('Anatomie- oder Oberflächenkatalog stimmt nicht mit dem aktuellen Studio überein.');
  }
  if (imported.overrides.length > 10000 || imported.revision !== current.revision + imported.overrides.length) {
    throw new Error('Manifest-Revision oder Anzahl der Review-Änderungen ist ungültig.');
  }
  let restored = structuredClone(current);
  let evidenceIdentity: { avatarId: string; formId: string } | null = null;
  for (const entry of imported.overrides) {
    if (entry.origin !== 'user' || entry.policy !== 'locked' || entry.operation.type !== 'assign-triangle' ||
        entry.operation.sourceImageSha256 !== expectedImageSha256) {
      throw new Error('Manifest enthält nicht unterstützte Änderungen oder einen anderen Bildreferenz-Beleg.');
    }
    const identity = { avatarId: entry.operation.avatarId, formId: entry.operation.formId };
    if (evidenceIdentity && (evidenceIdentity.avatarId !== identity.avatarId || evidenceIdentity.formId !== identity.formId)) {
      throw new Error('Manifest mischt Landmarken aus unterschiedlichen Avatar- oder Formreferenzen.');
    }
    evidenceIdentity = identity;
    restored = applyClusterOperation(restored, entry.operation, 'user', 'locked');
  }
  if (JSON.stringify(restored.assignments) !== JSON.stringify(imported.assignments)) {
    throw new Error('Dreieck-Zuweisungen stimmen nicht mit dem nachvollziehbaren Override-Protokoll überein.');
  }
  return restored;
}
