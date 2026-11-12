import * as THREE from 'three';
import type { ClusterForm, ClusterManifest, ClusterMeshSource } from './cluster-architecture.ts';

export interface ClusterMeshInventory {
  schemaVersion: 1;
  sourceAssetSha256: string;
  meshes: ClusterMeshSource[];
  totals: { meshes: number; vertices: number; triangles: number };
}

/**
 * Creates a read-only inventory of the primitive meshes exposed by Three.js GLTFLoader.
 * GLTFLoader expands glTF primitives into mesh objects; each resulting object is one
 * inventory entry. The source asset hash plus traversal index scopes its stable ID.
 * No geometry, materials, transforms, skinning data or morph targets are modified.
 */
export function collectClusterMeshInventory(
  root: THREE.Object3D,
  sourceAssetSha256: string,
): ClusterMeshInventory {
  if (!/^[a-f0-9]{64}$/.test(sourceAssetSha256)) {
    throw new Error('Cluster inventory requires a lowercase SHA-256 asset hash.');
  }

  root.updateMatrixWorld(true);
  const meshes: ClusterMeshSource[] = [];
  let vertices = 0;
  let triangles = 0;

  root.traverse((node) => {
    if (!(node as THREE.Object3D & { isMesh?: boolean }).isMesh) return;
    const mesh = node as THREE.Mesh;
    const position = mesh.geometry.getAttribute('position');
    if (!position || !Number.isSafeInteger(position.count) || position.count < 3) {
      throw new Error(`Mesh "${mesh.name || meshes.length}" has no usable position attribute.`);
    }

    const elementCount = mesh.geometry.index?.count ?? position.count;
    if (!Number.isSafeInteger(elementCount) || elementCount < 3 || elementCount % 3 !== 0) {
      throw new Error(`Mesh "${mesh.name || meshes.length}" does not contain complete triangles.`);
    }

    const sourceMeshIndex = meshes.length;
    const triangleCount = elementCount / 3;
    meshes.push({
      id: `mesh-${sourceAssetSha256}-${sourceMeshIndex}`,
      sourceMeshIndex,
      sourceMeshName: mesh.name.trim() || `Mesh ${sourceMeshIndex + 1}`,
      primitiveIndex: 0,
      vertexCount: position.count,
      triangleCount,
    });
    vertices += position.count;
    triangles += triangleCount;
  });

  if (meshes.length === 0) throw new Error('GLB contains no triangle meshes.');
  return {
    schemaVersion: 1,
    sourceAssetSha256,
    meshes,
    totals: { meshes: meshes.length, vertices, triangles },
  };
}

/**
 * Wraps an inventory in a valid, deliberately unclassified manifest.
 * Every source triangle remains visible as unresolved instead of being guessed
 * into an anatomical region before a classifier has supplied evidence.
 */
export function createUnclassifiedClusterManifest(
  inventory: ClusterMeshInventory,
  form: ClusterForm = 'imported',
  generatedAt = new Date().toISOString(),
): ClusterManifest {
  if (inventory.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(inventory.sourceAssetSha256)) {
    throw new Error('Unsupported or invalid cluster inventory.');
  }
  const assignments = inventory.meshes.flatMap((mesh) =>
    Array.from({ length: mesh.triangleCount }, (_, triangleIndex) => ({
      meshId: mesh.id,
      triangleIndex,
      partId: null,
      surfaceLayerId: null,
      origin: 'imported' as const,
      policy: 'recomputable' as const,
      confidence: 0,
      reason: 'Unclassified source triangle; anatomical evidence is pending.',
    })),
  );
  return {
    schemaVersion: 1,
    form,
    sourceAssetSha256: inventory.sourceAssetSha256,
    algorithmId: 'unclassified-gltf-inventory',
    algorithmVersion: '1.0.0',
    generatedAt,
    revision: 0,
    parts: [],
    layers: [],
    meshes: inventory.meshes.map((mesh) => ({ ...mesh })),
    assignments,
    overrides: [],
  };
}
