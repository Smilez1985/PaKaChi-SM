import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStudioLandmarkSurfacePick } from '../src/studio-landmark-picking.ts';
import type { ImageReferenceDocument } from '../src/image-reference.ts';
import type { ClusterMeshInventory } from '../src/cluster-inventory.ts';

const document = (): ImageReferenceDocument => ({
  format: 'pakachi-image-reference', version: 1,
  source: { sha256: 'b'.repeat(64), width: 100, height: 100 },
  regions: [{ id: 'region-1', label: 'PaKaChi head', kind: 'view', status: 'confirmed',
    geometry: { type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } }],
  views: [{ id: 'view-front', label: 'Front', regionIds: ['region-1'] }],
  forms: [{ id: 'animal-form', label: 'Animal', viewIds: ['view-front'] }],
  avatars: [{ id: 'pakachi', label: 'PaKaChi', formIds: ['animal-form'] }],
  landmarks: [{ id: 'left-eye', regionId: 'region-1', partId: 'head', surfaceLayerId: 'fur',
    poseId: 'front-neutral', x: 20, y: 20, radiusPx: 8 }],
});
const inventory = (): ClusterMeshInventory => ({
  schemaVersion: 1, sourceAssetSha256: 'a'.repeat(64),
  meshes: [{ id: 'mesh-' + 'a'.repeat(64) + '-node0-mesh0-primitive0',
    sourceMeshIndex: 0, sourceMeshName: 'Head', primitiveIndex: 0, vertexCount: 3, triangleCount: 1 }],
  totals: { meshes: 1, vertices: 3, triangles: 1 },
});
interface PickInput { document: ImageReferenceDocument; inventory: ClusterMeshInventory; landmarkId: string; hit: { meshIndex: number; triangleIndex: number; barycentric: readonly [number, number, number] }; radiusLocal: number; confirmed: boolean }
const input = (): PickInput => ({
  document: document(), inventory: inventory(), landmarkId: 'left-eye',
  hit: { meshIndex: 0, triangleIndex: 0, barycentric: [0.2, 0.3, 0.5] },
  radiusLocal: 0.08, confirmed: true,
});

test('binds an explicitly confirmed 3D hit to the selected 2D landmark and stable source mesh ID', () => {
  const pick = createStudioLandmarkSurfacePick(input());
  assert.deepEqual(pick, {
    landmarkId: 'left-eye', sourceImageSha256: 'b'.repeat(64),
    avatarId: 'pakachi', formId: 'animal-form', viewId: 'view-front', poseId: 'front-neutral',
    meshId: inventory().meshes[0]!.id, triangleIndex: 0, barycentric: [0.2, 0.3, 0.5],
    partId: 'head', surfaceLayerId: 'fur', radiusLocal: 0.08, confirmed: true,
  });
});

test('rejects unconfirmed image regions and missing landmarks', () => {
  const unconfirmed = input(); unconfirmed.confirmed = false;
  assert.throws(() => createStudioLandmarkSurfacePick(unconfirmed), /explicit user confirmation/);
  const suggested = input(); suggested.document.regions[0]!.status = 'suggested';
  assert.throws(() => createStudioLandmarkSurfacePick(suggested), /confirmed image region/);
  const missing = input(); missing.landmarkId = 'right-eye';
  assert.throws(() => createStudioLandmarkSurfacePick(missing), /confirmed image region/);
});

test('rejects mesh, triangle, barycentric, and radius values outside the source inventory', () => {
  const mesh = input(); mesh.hit.meshIndex = 1;
  assert.throws(() => createStudioLandmarkSurfacePick(mesh), /outside the source inventory/);
  const triangle = input(); triangle.hit.triangleIndex = 1;
  assert.throws(() => createStudioLandmarkSurfacePick(triangle), /does not belong to the source mesh/);
  const weights = input(); weights.hit.barycentric = [0.2, 0.2, 0.2];
  assert.throws(() => createStudioLandmarkSurfacePick(weights), /barycentric/);
  const radius = input(); radius.radiusLocal = 0;
  assert.throws(() => createStudioLandmarkSurfacePick(radius), /influence radius/);
});

test('rejects invalid source hashes and preserves 2D avatar/form/view/pose provenance', () => {
  const badHash = input(); badHash.document.source.sha256 = 'invalid';
  assert.throws(() => createStudioLandmarkSurfacePick(badHash), /source image hash/);
  const wrongHierarchy = input(); wrongHierarchy.document.views[0]!.regionIds = [];
  assert.throws(() => createStudioLandmarkSurfacePick(wrongHierarchy), /not assigned to an avatar, form, and view/);
});
