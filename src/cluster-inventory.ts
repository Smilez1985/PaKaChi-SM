import * as THREE from 'three';
import type { ClusterForm, ClusterManifest, ClusterMeshSource } from './cluster-architecture.ts';

interface GLTFAssociationLike { nodes?: number; meshes?: number; primitives?: number }
interface GLTFParserLike { associations?: { get(object: THREE.Object3D): unknown } }
interface GLTFDocumentLike { scene: THREE.Object3D; parser?: GLTFParserLike }

export interface ClusterMeshInventory {
  schemaVersion: 1;
  sourceAssetSha256: string;
  meshes: ClusterMeshSource[];
  totals: { meshes: number; vertices: number; triangles: number };
}

/** A verified bridge from one inventory ID to its exact parsed GLTF primitive. */
export interface ClusterMeshBinding {
  meshId: string;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  /** Base geometry positions in mesh-local coordinates, expanded to XYZ triples. */
  positions: Float64Array;
  /** Triangle indices; null means the source geometry is non-indexed. */
  indices: Uint32Array | null;
  /** Exact mesh world matrix, column-major, at binding time. */
  meshWorld: number[];
}

function isGLTFDocument(value: THREE.Object3D | GLTFDocumentLike): value is GLTFDocumentLike {
  return 'scene' in value && value.scene instanceof THREE.Object3D;
}

function associationOf(parser: GLTFParserLike | undefined, object: THREE.Object3D): GLTFAssociationLike {
  const value = parser?.associations?.get(object);
  if (!value || typeof value !== 'object') return {};
  const source = value as Record<string, unknown>;
  const result: GLTFAssociationLike = {};
  for (const key of ['nodes', 'meshes', 'primitives'] as const) {
    const index = source[key];
    if (typeof index === 'number' && Number.isSafeInteger(index) && index >= 0) result[key] = index;
  }
  return result;
}

function nodePath(object: THREE.Object3D): string {
  const segments: string[] = [];
  let current: THREE.Object3D | null = object;
  while (current) {
    const parent: THREE.Object3D | null = current.parent;
    const siblingIndex = parent ? parent.children.indexOf(current) : 0;
    const label = (current.name.trim() || current.type || 'Object').replace(/[\\/]/g, '_').slice(0, 64);
    segments.push(`${label}[${siblingIndex}]`);
    current = parent;
  }
  return segments.reverse().join('/').slice(0, 512);
}

/**
 * Creates a read-only inventory from a parsed GLTF document or a plain Object3D.
 * When GLTFLoader associations are available, original glTF node/mesh/primitive
 * indices are retained. A plain Object3D remains supported as a fallback.
 */
export function collectClusterMeshInventory(
  input: THREE.Object3D | GLTFDocumentLike,
  sourceAssetSha256: string,
): ClusterMeshInventory {
  if (!/^[a-f0-9]{64}$/.test(sourceAssetSha256)) {
    throw new Error('Cluster inventory requires a lowercase SHA-256 asset hash.');
  }

  const root = isGLTFDocument(input) ? input.scene : input;
  const parser = isGLTFDocument(input) ? input.parser : undefined;
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

    const traversalIndex = meshes.length;
    const meshAssociation = associationOf(parser, mesh);
    let nodeObject: THREE.Object3D | null = mesh;
    let nodeAssociation: GLTFAssociationLike = {};
    while (nodeObject && nodeObject !== root.parent) {
      const candidate = associationOf(parser, nodeObject);
      if (candidate.nodes !== undefined) {
        nodeAssociation = candidate;
        break;
      }
      nodeObject = nodeObject.parent;
    }

    const sourceMeshIndex = meshAssociation.meshes ?? traversalIndex;
    const primitiveIndex = meshAssociation.primitives ?? 0;
    const sourceNodeIndex = nodeAssociation.nodes;
    const stableNodeKey = sourceNodeIndex === undefined ? `walk${traversalIndex}` : `node${sourceNodeIndex}`;
    const id = `mesh-${sourceAssetSha256}-${stableNodeKey}-mesh${sourceMeshIndex}-primitive${primitiveIndex}`;
    const triangleCount = elementCount / 3;
    const sourceNodeName = nodeObject?.name.trim() || undefined;

    meshes.push({
      id,
      sourceMeshIndex,
      sourceMeshName: mesh.name.trim() || sourceNodeName || `Mesh ${traversalIndex + 1}`,
      primitiveIndex,
      vertexCount: position.count,
      triangleCount,
      ...(sourceNodeIndex !== undefined ? { sourceNodeIndex } : {}),
      ...(sourceNodeName ? { sourceNodeName } : {}),
      sourceNodePath: nodePath(mesh),
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
 * Resolves every inventory ID to its exact parsed GLTF mesh primitive.
 * Source associations are used whenever available; the fallback identity is
 * only valid for the same unassociated scene traversal used to build inventory.
 * Returned arrays are safe copies and source geometry is never mutated.
 */
export function resolveClusterMeshBindings(
  input: THREE.Object3D | GLTFDocumentLike,
  inventory: ClusterMeshInventory,
): ClusterMeshBinding[] {
  if (inventory.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(inventory.sourceAssetSha256)) {
    throw new Error('A valid source-bound cluster inventory is required.');
  }
  const expected = new Map(inventory.meshes.map(item => [item.id, item]));
  if (expected.size !== inventory.meshes.length) throw new Error('Inventory contains duplicate mesh IDs.');
  const root = isGLTFDocument(input) ? input.scene : input;
  const parser = isGLTFDocument(input) ? input.parser : undefined;
  root.updateMatrixWorld(true);
  const bindings: ClusterMeshBinding[] = [];
  const seen = new Set<string>();
  let traversalIndex = 0;

  root.traverse(node => {
    if (!(node as THREE.Object3D & { isMesh?: boolean }).isMesh) return;
    const mesh = node as THREE.Mesh;
    const meshAssociation = associationOf(parser, mesh);
    let nodeObject: THREE.Object3D | null = mesh;
    let nodeAssociation: GLTFAssociationLike = {};
    while (nodeObject && nodeObject !== root.parent) {
      const candidate = associationOf(parser, nodeObject);
      if (candidate.nodes !== undefined) {
        nodeAssociation = candidate;
        break;
      }
      nodeObject = nodeObject.parent;
    }
    const sourceMeshIndex = meshAssociation.meshes ?? traversalIndex;
    const primitiveIndex = meshAssociation.primitives ?? 0;
    const sourceNodeIndex = nodeAssociation.nodes;
    const stableNodeKey = sourceNodeIndex === undefined ? `walk${traversalIndex}` : `node${sourceNodeIndex}`;
    const meshId = `mesh-${inventory.sourceAssetSha256}-${stableNodeKey}-mesh${sourceMeshIndex}-primitive${primitiveIndex}`;
    traversalIndex++;

    const expectedMesh = expected.get(meshId);
    if (!expectedMesh) throw new Error(`Parsed GLTF contains a mesh not present in the inventory: ${meshId}`);
    if (seen.has(meshId)) throw new Error(`Parsed GLTF resolves a duplicate mesh ID: ${meshId}`);
    if ((mesh as THREE.Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh || mesh.geometry.morphAttributes.position?.length) {
      throw new Error(`Mesh "${mesh.name || meshId}" is deformed by skinning or morph targets; bind a rest-pose geometry explicitly.`);
    }
    const position = mesh.geometry.getAttribute('position');
    const elementCount = mesh.geometry.index?.count ?? position?.count ?? 0;
    if (!position || position.count !== expectedMesh.vertexCount || elementCount % 3 !== 0 || elementCount / 3 !== expectedMesh.triangleCount) {
      throw new Error(`Parsed geometry no longer matches inventory counts for ${meshId}.`);
    }
    const positions = new Float64Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
      if (![x, y, z].every(Number.isFinite)) throw new Error(`Mesh ${meshId} has non-finite vertex data.`);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    let indices: Uint32Array | null = null;
    if (mesh.geometry.index) {
      const source = mesh.geometry.index;
      indices = new Uint32Array(source.count);
      for (let i = 0; i < source.count; i++) {
        const index = source.getX(i);
        if (!Number.isSafeInteger(index) || index < 0 || index >= position.count) {
          throw new Error(`Mesh ${meshId} contains an out-of-range vertex index.`);
        }
        indices[i] = index;
      }
    }
    const meshWorld = mesh.matrixWorld.toArray();
    if (!meshWorld.every(Number.isFinite)) throw new Error(`Mesh ${meshId} has an invalid world transform.`);
    bindings.push({ meshId, mesh, geometry: mesh.geometry, positions, indices, meshWorld });
    seen.add(meshId);
  });
  if (seen.size !== expected.size) {
    const missing = [...expected.keys()].filter(id => !seen.has(id));
    throw new Error(`Parsed GLTF is missing inventory mesh binding(s): ${missing.slice(0, 5).join(', ')}`);
  }
  return bindings;
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

/** Convenience entry point for the exact GLTF document returned by parseModel(). */
export function createClusterManifestFromGLTF(
  gltf: GLTFDocumentLike,
  sourceAssetSha256: string,
  form: ClusterForm = 'imported',
  generatedAt = new Date().toISOString(),
): ClusterManifest {
  return createUnclassifiedClusterManifest(
    collectClusterMeshInventory(gltf, sourceAssetSha256),
    form,
    generatedAt,
  );
}
