import * as THREE from 'three';
import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { SkinWeightMeshEvidence } from './cluster-skin-anatomy.ts';

/** Explicit bridge from a source inventory ID to the exact skinned primitive. */
export interface RiggedClusterMeshBinding {
  meshId: string;
  mesh: THREE.SkinnedMesh;
}

/**
 * Reads skin weights from an already-rigged model without guessing identity.
 * Mesh IDs come from the source inventory binding captured before rigging.
 * Bone names are resolved only through an explicit bone-name -> rigBoneId map;
 * rigBoneIds remain stable semantic IDs, not display names.
 */
export function collectRiggedSkinWeightEvidence(
  manifest: ClusterManifest,
  sourceAssetSha256: string,
  bindings: readonly RiggedClusterMeshBinding[],
  rigBoneIdByName: ReadonlyMap<string, string> = new Map(),
): SkinWeightMeshEvidence[] {
  const issues = validateClusterManifest(manifest);
  if (issues.length) throw new Error('Invalid source cluster manifest: ' + issues.map(issue => issue.code).join(', '));
  if (sourceAssetSha256 !== manifest.sourceAssetSha256) throw new Error('Rigged model belongs to a different source asset.');
  if (!Array.isArray(bindings) || bindings.length === 0 || bindings.length > manifest.meshes.length) {
    throw new Error('Rigged mesh bindings must be a bounded, non-empty source selection.');
  }
  const inventory = new Map(manifest.meshes.map(mesh => [mesh.id, mesh]));
  const boneOwners = new Map<string, string[]>();
  for (const part of manifest.parts) for (const boneId of part.rigBoneIds) {
    const owners = boneOwners.get(boneId) ?? [];
    owners.push(part.id);
    boneOwners.set(boneId, owners);
  }
  for (const [boneName, rigBoneId] of rigBoneIdByName) {
    if (!boneName || typeof rigBoneId !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(rigBoneId)) {
      throw new Error('Explicit bone identity mapping contains an invalid entry.');
    }
  }

  const seenMeshes = new Set<string>();
  const result: SkinWeightMeshEvidence[] = [];
  for (const binding of bindings) {
    if (!binding || typeof binding.meshId !== 'string' || seenMeshes.has(binding.meshId)) {
      throw new Error('Rigged mesh binding contains an invalid or duplicate source mesh ID.');
    }
    seenMeshes.add(binding.meshId);
    const source = inventory.get(binding.meshId);
    const mesh = binding.mesh;
    if (!source || !(mesh instanceof THREE.SkinnedMesh)) throw new Error('Rigged mesh binding does not resolve to a source inventory primitive.');
    const geometry = mesh.geometry;
    const position = geometry.getAttribute('position');
    const skinIndex = geometry.getAttribute('skinIndex');
    const skinWeight = geometry.getAttribute('skinWeight');
    const elementCount = geometry.index?.count ?? position?.count ?? 0;
    if (!position || position.itemSize !== 3 || position.count !== source.vertexCount ||
        !skinIndex || !skinWeight || skinIndex.itemSize !== 4 || skinWeight.itemSize !== 4 ||
        skinIndex.count !== source.vertexCount || skinWeight.count !== source.vertexCount ||
        elementCount !== source.triangleCount * 3 || mesh.skeleton.bones.length === 0 || mesh.skeleton.bones.length > 256) {
      throw new Error('Rigged primitive topology or skin attributes do not match the source inventory.');
    }
    const nameCounts = new Map<string, number>();
    for (const bone of mesh.skeleton.bones) nameCounts.set(bone.name, (nameCounts.get(bone.name) ?? 0) + 1);
    const bonePartIds = mesh.skeleton.bones.map(bone => {
      if (!bone.name || nameCounts.get(bone.name) !== 1) return null;
      const rigBoneId = rigBoneIdByName.get(bone.name);
      if (!rigBoneId) return null;
      const owners = boneOwners.get(rigBoneId);
      return owners?.length === 1 ? owners[0]! : null;
    });
    const indices = new Uint32Array(elementCount);
    if (geometry.index) for (let i = 0; i < elementCount; i++) indices[i] = geometry.index.getX(i);
    const skinIndices = new Uint16Array(source.vertexCount * 4);
    const skinWeights = new Float32Array(source.vertexCount * 4);
    for (let vertex = 0; vertex < source.vertexCount; vertex++) for (let slot = 0; slot < 4; slot++) {
      const offset = vertex * 4 + slot;
      skinIndices[offset] = skinIndex.getComponent(vertex, slot);
      skinWeights[offset] = skinWeight.getComponent(vertex, slot);
    }
    result.push({meshId:binding.meshId,vertexCount:source.vertexCount,triangleCount:source.triangleCount,skinIndices,skinWeights,bonePartIds,indices:geometry.index?indices:null});
  }
  return result;
}
