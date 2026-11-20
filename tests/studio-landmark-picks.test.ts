import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validStudioLandmarkSurfacePicks } from '../src/studio-data.ts';

const pick = () => ({
  landmarkId: 'left-eye', sourceImageSha256: 'a'.repeat(64), avatarId: 'pakachi',
  formId: 'animal-form', viewId: 'front', poseId: 'neutral', meshId: 'mesh-head',
  triangleIndex: 0, barycentric: [0.2, 0.3, 0.5] as const,
  partId: 'head', surfaceLayerId: 'fur', radiusLocal: 0.15, confirmed: true as const,
});

test('accepts a confirmed, source-bound barycentric surface pick', () => {
  assert.equal(validStudioLandmarkSurfacePicks([pick()], 'a'.repeat(64)), true);
  assert.equal(validStudioLandmarkSurfacePicks([pick()]), true);
});

test('rejects mismatched image provenance, duplicate landmarks and unconfirmed picks', () => {
  assert.equal(validStudioLandmarkSurfacePicks([pick()], 'b'.repeat(64)), false);
  assert.equal(validStudioLandmarkSurfacePicks([pick(), pick()]), false);
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), confirmed: false }]), false);
});

test('rejects invalid barycentric weights, triangle indices, IDs and radii', () => {
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), barycentric: [0.2, 0.2, 0.2] }]), false);
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), barycentric: [1.1, -0.1, 0] }]), false);
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), triangleIndex: -1 }]), false);
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), meshId: '../mesh' }]), false);
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), radiusLocal: 0 }]), false);
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), radiusLocal: 11 }]), false);
});

test('bounds collection size and rejects unknown fields', () => {
  assert.equal(validStudioLandmarkSurfacePicks(Array.from({ length: 10001 }, pick)), false);
  assert.equal(validStudioLandmarkSurfacePicks([{ ...pick(), guessedDepth: 0.4 }]), false);
});
