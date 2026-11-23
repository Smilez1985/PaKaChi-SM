import * as THREE from 'three';
import type { ClusterForm, ClusterManifest } from './cluster-architecture.ts';
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
  return createUnclassifiedClusterManifest(inventory, form as ClusterForm, generatedAt);
}
