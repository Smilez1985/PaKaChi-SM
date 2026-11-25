import * as THREE from 'three';
import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { ClusterMeshBinding } from './cluster-inventory.ts';
import { collectRiggedSkinWeightEvidence } from './cluster-skin-anatomy-rig.ts';
import type { SkinWeightMeshEvidence } from './cluster-skin-anatomy.ts';

const MESH_ID_KEY = 'pakachiClusterMeshId';
const SOURCE_HASH_KEY = 'pakachiClusterSourceAssetSha256';

/**
 * Transfers exact source inventory identity onto the source Mesh objects before
 * rigging. bindDraftRig copies userData to each replacement SkinnedMesh, so the
 * identity survives the Mesh -> SkinnedMesh conversion without name/order guesses.
 */
export function attachClusterMeshIdentity(
  root: THREE.Object3D,
  manifest: ClusterManifest,
  bindings: readonly ClusterMeshBinding[],
): void {
  const issues = validateClusterManifest(manifest);
  if (issues.length) throw new Error('Invalid source cluster manifest: ' + issues.map(issue => issue.code).join(', '));
  if (!Array.isArray(bindings) || bindings.length !== manifest.meshes.length) {
    throw new Error('Every source inventory mesh must have exactly one identity binding.');
  }
  const sceneMeshes = new Set<THREE.Mesh>();
  root.traverse(node => { if ((node as THREE.Mesh).isMesh) sceneMeshes.add(node as THREE.Mesh); });
  const expected = new Map(manifest.meshes.map(mesh => [mesh.id, mesh]));
  const seenIds = new Set<string>();
  const seenMeshes = new Set<THREE.Mesh>();
  const updates: { mesh: THREE.Mesh; id: string }[] = [];
  for (const binding of bindings) {
    const source = expected.get(binding.meshId);
    if (!source || !(binding.mesh instanceof THREE.Mesh) || !sceneMeshes.has(binding.mesh) ||
        seenIds.has(binding.meshId) || seenMeshes.has(binding.mesh) ||
        binding.geometry !== binding.mesh.geometry) {
      throw new Error('Source identity binding is missing, duplicate, foreign, or stale.');
    }
    const position = binding.mesh.geometry.getAttribute('position');
    const count = binding.mesh.geometry.index?.count ?? position?.count ?? 0;
    if (!position || position.count !== source.vertexCount || count !== source.triangleCount * 3) {
      throw new Error('Source identity binding no longer matches inventory topology.');
    }
    const existingId = binding.mesh.userData[MESH_ID_KEY];
    const existingHash = binding.mesh.userData[SOURCE_HASH_KEY];
    if ((existingId !== undefined && existingId !== binding.meshId) ||
        (existingHash !== undefined && existingHash !== manifest.sourceAssetSha256)) {
      throw new Error('Source mesh already carries a conflicting inventory identity.');
    }
    updates.push({ mesh: binding.mesh, id: binding.meshId });
    seenIds.add(binding.meshId);
    seenMeshes.add(binding.mesh);
  }
  if (seenMeshes.size !== sceneMeshes.size) {
    throw new Error('Source identity bindings do not cover every scene mesh exactly once.');
  }
  for (const update of updates) {
    update.mesh.userData[MESH_ID_KEY] = update.id;
    update.mesh.userData[SOURCE_HASH_KEY] = manifest.sourceAssetSha256;
  }
}

/** Collects all rigged mesh evidence only from identities transferred before rigging. */
export function collectRiggedSkinWeightEvidenceFromRoot(
  root: THREE.Object3D,
  manifest: ClusterManifest,
): SkinWeightMeshEvidence[] {
  const bindings: { meshId: string; mesh: THREE.SkinnedMesh }[] = [];
  const seen = new Set<string>();
  root.traverse(node => {
    if (!(node instanceof THREE.SkinnedMesh)) return;
    const meshId = node.userData[MESH_ID_KEY];
    const sourceHash = node.userData[SOURCE_HASH_KEY];
    if (typeof meshId !== 'string' || sourceHash !== manifest.sourceAssetSha256 || seen.has(meshId)) {
      throw new Error('Rigged mesh has missing, stale, or duplicate transferred source identity.');
    }
    seen.add(meshId);
    bindings.push({ meshId, mesh: node });
  });
  if (bindings.length !== manifest.meshes.length) {
    throw new Error('Rigged scene does not contain exactly the source inventory mesh set.');
  }
  return collectRiggedSkinWeightEvidence(manifest, manifest.sourceAssetSha256, bindings);
}
