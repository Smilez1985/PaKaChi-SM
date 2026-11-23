import * as THREE from 'three';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { ImageReferenceDocument } from './image-reference.ts';
import type { StudioLandmarkSurfacePick } from './studio-data.ts';
import { collectClusterMeshInventory, resolveClusterMeshBindings } from './cluster-inventory.ts';
import { resolveReviewedLandmarkSurfacePicks } from './cluster-landmark-correspondence.ts';

/** A separate evidence sidecar: point correspondences never become triangle assignments. */
export interface StudioLandmarkEvidenceBundle {
  format: 'pakachi-cluster-landmark-evidence';
  version: 1;
  sourceAssetSha256: string;
  sourceImageSha256: string;
  avatarId: string;
  formId: string;
  form: 'animal' | 'humanoid';
  correspondences: ReturnType<typeof resolveReviewedLandmarkSurfacePicks>['correspondences'];
}

/**
 * Resolve saved, explicitly confirmed Studio picks against the exact current
 * source inventory and mesh-local geometry. The manifest is not modified.
 */
export function createStudioLandmarkEvidenceBundle(
  root: THREE.Object3D,
  manifest: ClusterManifest,
  document: ImageReferenceDocument,
  picks: readonly StudioLandmarkSurfacePick[],
): StudioLandmarkEvidenceBundle {
  if (!picks.length) throw new Error('Für einen Landmarken-Beleg müssen bestätigte 2D/3D-Zuordnungen vorhanden sein.');
  const first = picks[0]!;
  if (picks.some(pick => pick.avatarId !== first.avatarId || pick.formId !== first.formId ||
      pick.sourceImageSha256 !== document.source.sha256)) {
    throw new Error('Die gespeicherten Landmarken gehören nicht zu derselben Bildreferenz, Avatar- und Formauswahl.');
  }
  const inventory = collectClusterMeshInventory(root, manifest.sourceAssetSha256);
  const inventoryManifest = {
    ...manifest,
    meshes: inventory.meshes,
  };
  const bindings = resolveClusterMeshBindings(root, inventory);
  const report = resolveReviewedLandmarkSurfacePicks({
    current: inventoryManifest,
    sourceAssetSha256: manifest.sourceAssetSha256,
    sourceImageSha256: document.source.sha256,
    avatarId: first.avatarId,
    formId: first.formId,
    form: manifest.form,
    picks,
    geometry: bindings.map(binding => ({
      meshId: binding.meshId,
      positions: binding.positions,
      indices: binding.indices,
    })),
  });
  return {
    format: 'pakachi-cluster-landmark-evidence',
    version: 1,
    sourceAssetSha256: manifest.sourceAssetSha256,
    sourceImageSha256: document.source.sha256,
    avatarId: first.avatarId,
    formId: first.formId,
    form: manifest.form,
    correspondences: report.correspondences,
  };
}
