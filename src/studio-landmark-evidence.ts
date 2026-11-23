import * as THREE from 'three';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { ImageReferenceDocument } from './image-reference.ts';
import type { StudioLandmarkSurfacePick } from './studio-data.ts';
import { imageReferenceLandmarksToCluster2DSeeds } from './cluster-2d-classifier.ts';
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
  formMappingConfirmed: true;
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
  formMappingConfirmed: boolean,
): StudioLandmarkEvidenceBundle {
  if (formMappingConfirmed !== true) throw new Error('Die Zuordnung der Bildreferenz-Form zur Tier- oder Arbeitsform muss ausdrücklich bestätigt werden.');
  if (!picks.length) throw new Error('Für einen Landmarken-Beleg müssen bestätigte 2D/3D-Zuordnungen vorhanden sein.');
  const form = manifest.form;
  if (form !== 'animal' && form !== 'humanoid') throw new Error('Ein Landmarken-Beleg benötigt ein explizites Form-Manifest.');
  const first = picks[0]!;
  if (picks.some(pick => pick.avatarId !== first.avatarId || pick.formId !== first.formId ||
      pick.sourceImageSha256 !== document.source.sha256)) {
    throw new Error('Die gespeicherten Landmarken gehören nicht zu derselben Bildreferenz, Avatar- und Formauswahl.');
  }
  const sourceSeeds = new Map(imageReferenceLandmarksToCluster2DSeeds(document).map(seed => [seed.id, seed]));
  for (const pick of picks) {
    const seed = sourceSeeds.get(pick.landmarkId);
    if (!seed || seed.avatarId !== pick.avatarId || seed.formId !== pick.formId ||
        seed.viewId !== pick.viewId || seed.poseId !== pick.poseId || seed.partId !== pick.partId ||
        (seed.surfaceLayerId ?? null) !== (pick.surfaceLayerId ?? null)) {
      throw new Error('Eine gespeicherte Landmarke stimmt nicht mehr mit der bestätigten Bildreferenz überein.');
    }
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
    form,
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
    form,
    formMappingConfirmed: true,
    correspondences: report.correspondences,
  };
}


/**
 * Validate an imported evidence sidecar against the currently open model and
 * image reference. Re-resolves every triangle hit from barycentric coordinates;
 * imported evidence is returned for review and never mutates the manifest.
 */
export function validateStudioLandmarkEvidenceBundle(
  root: THREE.Object3D,
  manifest: ClusterManifest,
  document: ImageReferenceDocument,
  value: unknown,
  formMappingConfirmed: boolean,
): StudioLandmarkEvidenceBundle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Der Landmarken-Beleg ist kein JSON-Objekt.');
  const candidate = value as Partial<StudioLandmarkEvidenceBundle>;
  if (candidate.format !== 'pakachi-cluster-landmark-evidence' || candidate.version !== 1 ||
      candidate.formMappingConfirmed !== true || !Array.isArray(candidate.correspondences) ||
      candidate.correspondences.length === 0 || candidate.correspondences.length > 10000) {
    throw new Error('Unbekanntes, unvollständiges oder nicht bestätigtes Landmarken-Belegformat.');
  }
  if (candidate.sourceAssetSha256 !== manifest.sourceAssetSha256 ||
      candidate.sourceImageSha256 !== document.source.sha256 ||
      candidate.form !== manifest.form) {
    throw new Error('Landmarken-Beleg gehört zu einem anderen Quellmodell, Bild oder Form-Manifest.');
  }
  const picks = candidate.correspondences.map(item => {
    if (!item || typeof item !== 'object') throw new Error('Ungültiger Landmarken-Eintrag im Beleg.');
    const correspondence = item as StudioLandmarkEvidenceBundle['correspondences'][number];
    return {
      landmarkId: correspondence.landmarkId,
      sourceImageSha256: candidate.sourceImageSha256!,
      avatarId: candidate.avatarId!,
      formId: candidate.formId!,
      viewId: correspondence.viewId,
      poseId: correspondence.poseId,
      meshId: correspondence.meshId,
      triangleIndex: correspondence.triangleIndex,
      barycentric: correspondence.barycentric,
      partId: correspondence.partId,
      surfaceLayerId: correspondence.surfaceLayerId,
      radiusLocal: correspondence.radius,
      confirmed: true as const,
    };
  });
  const rebuilt = createStudioLandmarkEvidenceBundle(root, manifest, document, picks, formMappingConfirmed);
  if (candidate.avatarId !== rebuilt.avatarId || candidate.formId !== rebuilt.formId ||
      candidate.correspondences.length !== rebuilt.correspondences.length) {
    throw new Error('Landmarken-Beleg hat eine abweichende Avatar-/Formzuordnung oder Anzahl.');
  }
  for (let index = 0; index < rebuilt.correspondences.length; index++) {
    const actual = candidate.correspondences[index] as Record<string, unknown>;
    const expected = rebuilt.correspondences[index]!;
    const keys = ['landmarkId','viewId','poseId','meshId','triangleIndex','partId','surfaceLayerId','radius','origin','policy'];
    if (keys.some(key => actual[key] !== (expected as unknown as Record<string, unknown>)[key]) ||
        !Array.isArray(actual.barycentric) || actual.barycentric.length !== 3 ||
        actual.barycentric.some((v, i) => v !== expected.barycentric[i]) ||
        !Array.isArray(actual.position) || actual.position.length !== 3 ||
        actual.position.some((v, i) => typeof v !== 'number' || Math.abs(v - expected.position[i]!) > 1e-6)) {
      throw new Error('Landmarken-Beleg stimmt nicht mit der aktuellen Mesh-Geometrie oder Bildreferenz überein.');
    }
  }
  return rebuilt;
}
