import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveReviewedLandmarkSurfacePicks } from '../src/cluster-landmark-correspondence.ts';
import type { ClusterManifest } from '../src/cluster-architecture.ts';
import type { ReviewedLandmarkSurfacePick } from '../src/cluster-landmark-correspondence.ts';

const manifest = (): ClusterManifest => ({
  schemaVersion: 1, form: 'animal', sourceAssetSha256: 'a'.repeat(64),
  algorithmId: 'test', algorithmVersion: '1.0.0', generatedAt: '2026-11-19T00:00:00.000Z',
  revision: 0,
  parts: [{ id: 'head', name: 'Head', parentPartId: null, orderKey: [1], rigBoneIds: [] }],
  layers: [{ id: 'fur', name: 'Fur', partId: 'head', orderKey: [1] }],
  meshes: [{ id: 'mesh-head', sourceMeshIndex: 0, sourceMeshName: 'Head', primitiveIndex: 0, vertexCount: 3, triangleCount: 1 }],
  assignments: [{ meshId: 'mesh-head', triangleIndex: 0, partId: null, surfaceLayerId: null, origin: 'imported', policy: 'recomputable', confidence: 0, reason: 'unclassified' }],
  overrides: [],
});
const input = () => ({
  current: manifest(), sourceAssetSha256: 'a'.repeat(64), sourceImageSha256: 'b'.repeat(64),
  avatarId: 'pakachi', formId: 'animal-form', form: 'animal' as const,
  picks: [{
    landmarkId: 'left-eye', sourceImageSha256: 'b'.repeat(64), avatarId: 'pakachi',
    formId: 'animal-form', viewId: 'front', poseId: 'neutral',
    meshId: 'mesh-head', triangleIndex: 0, barycentric: [0.2, 0.3, 0.5],
    partId: 'head', surfaceLayerId: 'fur', radiusLocal: 0.15, confirmed: true,
  }] as ReviewedLandmarkSurfacePick[],
  geometry: [{ meshId: 'mesh-head', positions: [0,0,0, 1,0,0, 0,1,0], indices: [0,1,2] }],
});

test('resolves an explicitly reviewed 2D landmark to a barycentric mesh-local surface point', () => {
  const result = resolveReviewedLandmarkSurfacePicks(input());
  assert.deepEqual(result.seeds, [{ partId: 'head', position: [0.3, 0.5, 0], radius: 0.15, surfaceLayerId: 'fur' }]);
  assert.equal(result.correspondences[0]!.origin, 'user');
  assert.equal(result.correspondences[0]!.policy, 'locked');
  assert.equal(result.correspondences[0]!.viewId, 'front');
});

test('rejects unconfirmed picks and mismatched source or form provenance', () => {
  const unconfirmed = input(); unconfirmed.picks[0] = { ...unconfirmed.picks[0]!, confirmed: false as unknown as true };
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(unconfirmed), /unconfirmed/);
  const wrongImage = input(); wrongImage.picks[0] = { ...wrongImage.picks[0]!, sourceImageSha256: 'c'.repeat(64) };
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(wrongImage), /provenance/);
  const wrongAsset = input(); wrongAsset.sourceAssetSha256 = 'c'.repeat(64);
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(wrongAsset), /different source 3D asset/);
  const wrongForm = input(); wrongForm.current.form = 'humanoid';
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(wrongForm), /form provenance/);
});

test('rejects invalid triangle indices, barycentric coordinates, and duplicate landmarks', () => {
  const outOfRange = input(); outOfRange.picks[0] = { ...outOfRange.picks[0]!, triangleIndex: 1 };
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(outOfRange), /outside the source mesh/);
  const invalidBarycentric = input(); invalidBarycentric.picks[0] = { ...invalidBarycentric.picks[0]!, barycentric: [0.2, 0.2, 0.2] as const };
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(invalidBarycentric), /barycentric/);
  const duplicate = input(); duplicate.picks.push({ ...duplicate.picks[0]! });
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(duplicate), /only one reviewed/);
});

test('rejects unknown parts, incompatible layers, and malformed mesh geometry', () => {
  const unknownPart = input(); unknownPart.picks[0] = { ...unknownPart.picks[0]!, partId: 'tail' };
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(unknownPart), /unknown anatomical part/);
  const wrongLayer = input(); wrongLayer.picks[0] = { ...wrongLayer.picks[0]!, surfaceLayerId: 'metal' };
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(wrongLayer), /incompatible surface layer/);
  const broken = input(); broken.geometry[0]!.positions = [0,0,0];
  assert.throws(() => resolveReviewedLandmarkSurfacePicks(broken), /position buffer/);
});
