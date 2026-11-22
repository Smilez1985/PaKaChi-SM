import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import { validateCluster2DSemanticCatalog } from './cluster-2d-classifier.ts';
import type { Cluster2DSemanticCatalog } from './cluster-2d-classifier.ts';

export interface ClusterFormSemanticCoverage {
  form: 'animal' | 'humanoid';
  sourceAssetSha256: string;
  totalTriangles: number;
  unassignedTriangles: number;
  parts: Array<{ id: string; triangleCount: number; meshIds: string[] }>;
  surfaceLayers: Array<{ id: string; triangleCount: number; meshIds: string[] }>;
}

export interface ClusterFormComparison {
  characterId: string;
  animal: ClusterFormSemanticCoverage;
  humanoid: ClusterFormSemanticCoverage;
  parts: Array<{
    id: string;
    label: string;
    animalTriangles: number;
    humanoidTriangles: number;
    triangleDelta: number;
  }>;
  surfaceLayers: Array<{
    id: string;
    label: string;
    animalTriangles: number;
    humanoidTriangles: number;
    triangleDelta: number;
  }>;
}

/**
 * Compare semantic coverage across the two forms of one character.
 * Mesh IDs and source assets remain form-local; only validated semantic
 * part/layer IDs are shared. Triangle counts are coverage, not geometry
 * equivalence or evidence that the two meshes are morph-compatible.
 */
export function compareClusterCharacterForms(
  catalog: Cluster2DSemanticCatalog,
  animal: ClusterManifest,
  humanoid: ClusterManifest,
): ClusterFormComparison {
  const catalogIssues = validateCluster2DSemanticCatalog(catalog);
  if (catalogIssues.length) throw new Error('Invalid shared character catalog: ' + catalogIssues.join(', '));
  for (const [name, manifest, expectedForm] of [
    ['animal', animal, 'animal'],
    ['humanoid', humanoid, 'humanoid'],
  ] as const) {
    const issues = validateClusterManifest(manifest);
    if (issues.length) throw new Error('Invalid ' + name + ' cluster manifest: ' + issues.map(issue => issue.code).join(', '));
    if (manifest.form !== expectedForm) throw new Error('Expected a ' + expectedForm + ' form manifest.');
  }

  const partIds = new Set(catalog.parts.map(part => part.id));
  const layerIds = new Set(catalog.surfaceLayers.map(layer => layer.id));
  for (const manifest of [animal, humanoid]) {
    if (manifest.parts.some(part => !partIds.has(part.id))) {
      throw new Error('A form manifest contains an anatomical ID outside the shared character catalog.');
    }
    if (manifest.layers.some(layer => !layerIds.has(layer.id))) {
      throw new Error('A form manifest contains a surface-layer ID outside the shared character catalog.');
    }
  }

  const coverage = (manifest: ClusterManifest): ClusterFormSemanticCoverage => {
    const partCounts = new Map<string, { count: number; meshes: Set<string> }>();
    const layerCounts = new Map<string, { count: number; meshes: Set<string> }>();
    let unassignedTriangles = 0;
    for (const assignment of manifest.assignments) {
      if (assignment.partId === null) unassignedTriangles++;
      else {
        const current = partCounts.get(assignment.partId) ?? { count: 0, meshes: new Set<string>() };
        current.count++;
        current.meshes.add(assignment.meshId);
        partCounts.set(assignment.partId, current);
      }
      if (assignment.surfaceLayerId !== null) {
        const current = layerCounts.get(assignment.surfaceLayerId) ?? { count: 0, meshes: new Set<string>() };
        current.count++;
        current.meshes.add(assignment.meshId);
        layerCounts.set(assignment.surfaceLayerId, current);
      }
    }
    const rows = (ids: string[], counts: Map<string, { count: number; meshes: Set<string> }>) =>
      ids.map(id => {
        const value = counts.get(id);
        return { id, triangleCount: value?.count ?? 0, meshIds: [...(value?.meshes ?? [])].sort() };
      });
    return {
      form: manifest.form as 'animal' | 'humanoid',
      sourceAssetSha256: manifest.sourceAssetSha256,
      totalTriangles: manifest.assignments.length,
      unassignedTriangles,
      parts: rows(catalog.parts.map(part => part.id), partCounts),
      surfaceLayers: rows(catalog.surfaceLayers.map(layer => layer.id), layerCounts),
    };
  };

  const animalCoverage = coverage(animal);
  const humanoidCoverage = coverage(humanoid);
  const compareRows = (
    entries: Array<{ id: string; label: string }>,
    left: Array<{ id: string; triangleCount: number }>,
    right: Array<{ id: string; triangleCount: number }>,
  ) => entries.map(entry => {
    const animalTriangles = left.find(item => item.id === entry.id)?.triangleCount ?? 0;
    const humanoidTriangles = right.find(item => item.id === entry.id)?.triangleCount ?? 0;
    return {
      id: entry.id, label: entry.label, animalTriangles, humanoidTriangles,
      triangleDelta: humanoidTriangles - animalTriangles,
    };
  });

  return {
    characterId: catalog.characterId,
    animal: animalCoverage,
    humanoid: humanoidCoverage,
    parts: compareRows(catalog.parts, animalCoverage.parts, humanoidCoverage.parts),
    surfaceLayers: compareRows(catalog.surfaceLayers, animalCoverage.surfaceLayers, humanoidCoverage.surfaceLayers),
  };
}
