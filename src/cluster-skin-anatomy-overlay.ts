import * as THREE from 'three';
import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { ClusterMeshBinding } from './cluster-inventory.ts';

export type ClusterSkinOverlayState = 'automatic' | 'ambiguous' | 'unmapped' | 'locked';
export interface ClusterSkinOverlayTriangle {
  meshId: string;
  triangleIndex: number;
  state: ClusterSkinOverlayState;
  partId: string | null;
  positions: readonly [number, number, number, number, number, number, number, number, number];
}
export interface ClusterSkinOverlayReport {
  sourceAssetSha256: string;
  triangles: ClusterSkinOverlayTriangle[];
  missingMeshIds: string[];
}

/**
 * Builds a read-only, world-space snapshot of reviewed skin-anatomy triangles.
 * Meshes must carry the stable source identity written by
 * attachClusterMeshIdentity(); names and traversal order are never used.
 */
export function collectClusterSkinOverlay(
  root: THREE.Object3D,
  manifest: ClusterManifest,
): ClusterSkinOverlayReport {
  const issues = validateClusterManifest(manifest);
  if (issues.length) throw new Error('Invalid cluster manifest: ' + issues.map(issue => issue.code).join(', '));
  root.updateMatrixWorld(true);
  const meshes = new Map<string, THREE.Mesh>();
  root.traverse(node => {
    const mesh = node as THREE.Mesh & { isMesh?: boolean };
    if (!mesh.isMesh) return;
    const id = mesh.userData.pakachiClusterMeshId;
    const hash = mesh.userData.pakachiClusterSourceAssetSha256;
    if (id === undefined && hash === undefined) return;
    if (typeof id !== 'string' || hash !== manifest.sourceAssetSha256 || meshes.has(id)) {
      throw new Error('3D overlay contains missing, stale or duplicate source mesh identity.');
    }
    meshes.set(id, mesh);
  });

  const triangles: ClusterSkinOverlayTriangle[] = [];
  const missingMeshIds: string[] = [];
  const inventoryIds = new Set(manifest.meshes.map(mesh => mesh.id));
  for (const meshId of meshes.keys()) if (!inventoryIds.has(meshId)) {
    throw new Error('3D overlay contains a mesh outside the source inventory.');
  }
  for (const source of manifest.meshes) {
    const mesh = meshes.get(source.id);
    if (!mesh) { missingMeshIds.push(source.id); continue; }
    const geometry = mesh.geometry, position = geometry.getAttribute('position');
    const elementCount = geometry.index?.count ?? position?.count ?? 0;
    if (!position || position.count !== source.vertexCount || elementCount !== source.triangleCount * 3) {
      throw new Error('3D overlay geometry no longer matches source inventory for ' + source.id + '.');
    }
    for (const assignment of manifest.assignments) {
      if (assignment.meshId !== source.id) continue;
      const offset = assignment.triangleIndex * 3;
      const vertexIds = [0, 1, 2].map(slot => geometry.index?.getX(offset + slot) ?? offset + slot);
      if (vertexIds.some(index => !Number.isSafeInteger(index) || index < 0 || index >= position.count)) {
        throw new Error('3D overlay triangle index is outside the source geometry.');
      }
      const values: number[] = [];
      for (const index of vertexIds) {
        const point = new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index));
        mesh.localToWorld(point);
        values.push(point.x, point.y, point.z);
      }
      const state: ClusterSkinOverlayState = assignment.partId !== null
        ? assignment.origin === 'user' && assignment.policy === 'locked' ? 'locked' : 'automatic'
        : /multiple|decisive|ambiguous/i.test(assignment.reason) ? 'ambiguous' : 'unmapped';
      triangles.push({ meshId: source.id, triangleIndex: assignment.triangleIndex, state,
        partId: assignment.partId, positions: values as unknown as ClusterSkinOverlayTriangle['positions'] });
    }
  }
  return { sourceAssetSha256: manifest.sourceAssetSha256, triangles, missingMeshIds };
}


/**
 * Builds the same read-only overlay from the exact bindings resolved for a
 * source inventory. Unlike collectClusterSkinOverlay(), this path does not
 * require identity markers on the live meshes: binding IDs were resolved
 * against the manifest inventory immediately before triangulation.
 */
export function collectClusterSkinOverlayFromBindings(
  bindings: readonly ClusterMeshBinding[],
  manifest: ClusterManifest,
): ClusterSkinOverlayReport {
  const issues = validateClusterManifest(manifest);
  if (issues.length) throw new Error('Invalid cluster manifest: ' + issues.map(issue => issue.code).join(', '));
  const byId = new Map<string, ClusterMeshBinding>();
  for (const binding of bindings) {
    if (!binding || typeof binding.meshId !== 'string' || byId.has(binding.meshId)) {
      throw new Error('3D overlay bindings contain a missing or duplicate source mesh ID.');
    }
    byId.set(binding.meshId, binding);
  }
  const inventoryIds = new Set(manifest.meshes.map(mesh => mesh.id));
  for (const id of byId.keys()) if (!inventoryIds.has(id)) {
    throw new Error('3D overlay binding is outside the source inventory.');
  }
  const triangles: ClusterSkinOverlayTriangle[] = [];
  const missingMeshIds: string[] = [];
  for (const source of manifest.meshes) {
    const binding = byId.get(source.id);
    if (!binding) { missingMeshIds.push(source.id); continue; }
    const geometry = binding.geometry;
    const position = geometry.getAttribute('position');
    const elementCount = geometry.index?.count ?? position?.count ?? 0;
    if (!position || position.count !== source.vertexCount || elementCount !== source.triangleCount * 3) {
      throw new Error('3D overlay geometry no longer matches source inventory for ' + source.id + '.');
    }
    binding.mesh.updateWorldMatrix(true, false);
    for (const assignment of manifest.assignments) {
      if (assignment.meshId !== source.id) continue;
      const offset = assignment.triangleIndex * 3;
      const vertexIds = [0, 1, 2].map(slot => geometry.index?.getX(offset + slot) ?? offset + slot);
      if (vertexIds.some(index => !Number.isSafeInteger(index) || index < 0 || index >= position.count)) {
        throw new Error('3D overlay triangle index is outside the source geometry.');
      }
      const values: number[] = [];
      for (const index of vertexIds) {
        const point = new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index));
        binding.mesh.localToWorld(point);
        values.push(point.x, point.y, point.z);
      }
      const state: ClusterSkinOverlayState = assignment.partId !== null
        ? assignment.origin === 'user' && assignment.policy === 'locked' ? 'locked' : 'automatic'
        : /multiple|decisive|ambiguous/i.test(assignment.reason) ? 'ambiguous' : 'unmapped';
      triangles.push({ meshId: source.id, triangleIndex: assignment.triangleIndex, state,
        partId: assignment.partId, positions: values as unknown as ClusterSkinOverlayTriangle['positions'] });
    }
  }
  return { sourceAssetSha256: manifest.sourceAssetSha256, triangles, missingMeshIds };
}
