import * as THREE from 'three';
import type { ClusterForm, ClusterManifest } from './cluster-architecture.ts';
import type { Cluster2DSemanticCatalog } from './cluster-2d-classifier.ts';
import { validateCluster2DSemanticCatalog } from './cluster-2d-classifier.ts';
import { collectClusterMeshInventory, createUnclassifiedClusterManifest } from './cluster-inventory.ts';

/**
 * Creates an explicitly form-labelled, source-byte-bound manifest for the
 * currently opened model. No anatomy or surface assignments are inferred.
 */
export async function createStudioFormManifest(
  root: THREE.Object3D,
  sourceModelBase64: string,
  form: 'animal' | 'humanoid',
  generatedAt = new Date().toISOString(),
  catalog?: Cluster2DSemanticCatalog,
): Promise<ClusterManifest> {
  if (typeof sourceModelBase64 !== 'string' || sourceModelBase64.length === 0 ||
      sourceModelBase64.length > 100_000_000 || sourceModelBase64.length % 4 !== 0 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(sourceModelBase64)) {
    throw new Error('Das gespeicherte Quellmodell ist kein gültiges Base64-Asset.');
  }
  const binary = atob(sourceModelBase64);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sourceAssetSha256 = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  const inventory = collectClusterMeshInventory(root, sourceAssetSha256);
  const manifest = createUnclassifiedClusterManifest(inventory, form as ClusterForm, generatedAt);
  if (catalog) {
    const issues = validateCluster2DSemanticCatalog(catalog);
    if (issues.length) throw new Error('Der gemeinsame Anatomie-/Oberflächenkatalog ist ungültig: ' + issues.join(', '));
    manifest.parts = catalog.parts.map((part, index) => ({
      id: part.id,
      name: part.label,
      parentPartId: part.parentPartId,
      orderKey: [index + 1],
      rigBoneIds: [],
    }));
    manifest.layers = catalog.surfaceLayers.map((layer, index) => ({
      id: layer.id,
      name: layer.label,
      partId: layer.partId,
      orderKey: [index + 1],
    }));
  }
  return manifest;
}
