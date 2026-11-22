import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareClusterCharacterForms } from '../src/cluster-form-comparison.ts';
import type { ClusterManifest } from '../src/cluster-architecture.ts';
import { createPaKaChiSemanticCatalog } from '../src/cluster-2d-classifier.ts';

function manifest(form: 'animal' | 'humanoid', hash: string, assignments: ClusterManifest['assignments']): ClusterManifest {
  return {
    schemaVersion: 1, form, sourceAssetSha256: hash.repeat(64), algorithmId: 'test',
    algorithmVersion: '1.0.0', generatedAt: '2026-11-22T00:00:00.000Z', revision: 0,
    parts: [{ id: 'body', name: 'Body', parentPartId: null, orderKey: [1], rigBoneIds: [] },
      { id: 'head', name: 'Head', parentPartId: 'body', orderKey: [1, 1], rigBoneIds: [] }],
    layers: [{ id: 'fur', name: 'Fur', partId: null, orderKey: [1] },
      { id: 'mechanics', name: 'Mechanics', partId: null, orderKey: [2] }],
    meshes: [
      { id: form + '-mesh-body', sourceMeshIndex: 0, sourceMeshName: 'Body', primitiveIndex: 0, vertexCount: 6, triangleCount: 2 },
      { id: form + '-mesh-head', sourceMeshIndex: 1, sourceMeshName: 'Head', primitiveIndex: 0, vertexCount: 3, triangleCount: 1 },
    ],
    assignments, overrides: [],
  };
}
const assignments = (form: 'animal' | 'humanoid', bodyPart: string, headPart: string): ClusterManifest['assignments'] => [
  { meshId: form + '-mesh-body', triangleIndex: 0, partId: bodyPart, surfaceLayerId: 'fur', origin: 'user', policy: 'locked', confidence: 1, reason: 'reviewed' },
  { meshId: form + '-mesh-body', triangleIndex: 1, partId: bodyPart, surfaceLayerId: 'mechanics', origin: 'user', policy: 'locked', confidence: 1, reason: 'reviewed' },
  { meshId: form + '-mesh-head', triangleIndex: 0, partId: headPart, surfaceLayerId: 'fur', origin: 'user', policy: 'locked', confidence: 1, reason: 'reviewed' },
];

test('compares animal and humanoid semantic coverage using shared IDs and form-local mesh identities', () => {
  const catalog = createPaKaChiSemanticCatalog();
  const animal = manifest('animal', 'a', assignments('animal', 'body', 'head'));
  const humanoid = manifest('humanoid', 'b', assignments('humanoid', 'body', 'head'));
  const result = compareClusterCharacterForms(catalog, animal, humanoid);
  assert.equal(result.characterId, 'pakachi');
  assert.equal(result.parts.find(item => item.id === 'head')?.animalTriangles, 1);
  assert.equal(result.parts.find(item => item.id === 'head')?.humanoidTriangles, 1);
  assert.deepEqual(result.animal.parts.find(item => item.id === 'body')?.meshIds, ['animal-mesh-body']);
  assert.deepEqual(result.humanoid.parts.find(item => item.id === 'body')?.meshIds, ['humanoid-mesh-body']);
  assert.notDeepEqual(result.animal.sourceAssetSha256, result.humanoid.sourceAssetSha256);
});

test('reports missing semantic coverage and unresolved triangles without inventing a mesh match', () => {
  const catalog = createPaKaChiSemanticCatalog();
  const animal = manifest('animal', 'a', assignments('animal', 'body', 'head'));
  const humanoid = manifest('humanoid', 'b', [
    { meshId: 'humanoid-mesh-body', triangleIndex: 0, partId: null, surfaceLayerId: null, origin: 'imported', policy: 'recomputable', confidence: 0, reason: 'unresolved' },
    { meshId: 'humanoid-mesh-body', triangleIndex: 1, partId: 'body', surfaceLayerId: 'mechanics', origin: 'user', policy: 'locked', confidence: 1, reason: 'reviewed' },
    { meshId: 'humanoid-mesh-head', triangleIndex: 0, partId: 'head', surfaceLayerId: 'fur', origin: 'user', policy: 'locked', confidence: 1, reason: 'reviewed' },
  ]);
  const result = compareClusterCharacterForms(catalog, animal, humanoid);
  assert.equal(result.humanoid.unassignedTriangles, 1);
  assert.equal(result.parts.find(item => item.id === 'body')?.triangleDelta, -1);
  assert.equal(result.humanoid.parts.find(item => item.id === 'body')?.meshIds[0], 'humanoid-mesh-body');
  assert.equal(result.humanoid.parts.find(item => item.id === 'tail')?.triangleCount, 0);
});

test('rejects swapped forms, invalid manifests and semantic IDs outside the shared catalog', () => {
  const catalog = createPaKaChiSemanticCatalog();
  const animal = manifest('animal', 'a', assignments('animal', 'body', 'head'));
  const humanoid = manifest('humanoid', 'b', assignments('humanoid', 'body', 'head'));
  assert.throws(() => compareClusterCharacterForms(catalog, humanoid, animal), /Expected a animal/);
  const unknown = manifest('animal', 'c', assignments('animal', 'body', 'head'));
  unknown.parts.push({ id: 'extra-part', name: 'Extra', parentPartId: null, orderKey: [3], rigBoneIds: [] });
  assert.throws(() => compareClusterCharacterForms(catalog, unknown, humanoid), /outside the shared character catalog/);
  assert.throws(() => compareClusterCharacterForms({ ...catalog, characterId: 'BAD ID' }, animal, humanoid), /Invalid shared character catalog/);
});
