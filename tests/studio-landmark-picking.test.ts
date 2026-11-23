import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStudioLandmarkSurfacePick } from '../src/studio-landmark-picking.ts';
import { createStudioLandmarkEvidenceBundle } from '../src/studio-landmark-evidence.ts';
import { createStudioFormManifest } from '../src/studio-form-manifest.ts';
import { webcrypto } from 'node:crypto';
import { createPaKaChiSemanticCatalog } from '../src/cluster-2d-classifier.ts';
import type { ImageReferenceDocument } from '../src/image-reference.ts';
import type { ClusterMeshInventory } from '../src/cluster-inventory.ts';
import { Window } from 'happy-dom';
import * as T from 'three';
import { StudioRig } from '../src/studio-rig.ts';
import { StudioEditor } from '../src/studio-editor.ts';
import type { StudioView } from '../src/studio-view.ts';

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


test('studio UI previews a 3D hit and persists it only after explicit confirmation; undo removes it', () => {
  const w = new Window();
  Object.assign(globalThis, {
    document: w.document,
    Event: w.Event,
    Option: function (label = '', value = '') {
      const option = w.document.createElement('option');
      option.textContent = label;
      option.value = value;
      return option;
    },
  });
  const root = new T.Group();
  root.add(new T.Mesh(new T.BoxGeometry(1, 1, 1)));
  const rig = new StudioRig(root);
  const view = new Proxy({ onSurfacePick: (_hit: unknown) => {} }, {
    get(target, key) { return key in target ? target[key as keyof typeof target] : () => {}; },
    set(target, key, value) { Reflect.set(target, key, value); return true; },
  }) as unknown as StudioView;
  const host = w.document.createElement('div');
  const project = {
    format: 'pakachi-studio' as const, version: 1 as const, model: 'AAAA',
    avatar: { id: 'pakachi', name: 'PaKaChi', description: '', moves: [] },
    imageReference: document(),
  };
  const button = (selector: string) => host.querySelector(selector) as unknown as HTMLButtonElement;
  const editor = new StudioEditor(rig, view, host as unknown as HTMLElement, project, {
    suspend() {}, resume() {}, changed() {}, feedback() {},
  });
  editor.configureLandmarkPicking(project.imageReference, inventory());
  editor.enter();
  button('#mode-rig').click();
  assert.ok(host.querySelector('#landmark-pick-select'));
  assert.equal(button('#landmark-surface-confirm').disabled, true);
  button('#landmark-surface-pick').click();
  view.onSurfacePick({ meshIndex: 0, triangleIndex: 1, barycentric: [0.2, 0.3, 0.5] });
  assert.equal(button('#landmark-surface-confirm').disabled, true);
  assert.equal(editor.exportProject().studio.landmarkSurfacePicks, undefined);
  view.onSurfacePick({ meshIndex: 0, triangleIndex: 0, barycentric: [0.2, 0.3, 0.5] });
  assert.equal(editor.exportProject().studio.landmarkSurfacePicks, undefined);
  assert.equal(button('#landmark-surface-confirm').disabled, false);
  button('#landmark-surface-confirm').click();
  assert.equal(editor.exportProject().studio.landmarkSurfacePicks?.[0]?.meshId, inventory().meshes[0]!.id);
  button('#studio-undo').click();
  editor.dispose();
  w.happyDOM.abort();
});


test('exports confirmed 2D/3D landmark evidence separately without assigning source triangles', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  const root = new T.Group();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  root.add(new T.Mesh(geometry));
  const source = Buffer.from('original source asset').toString('base64');
  const manifest = await createStudioFormManifest(root, source, 'animal', new Date().toISOString(), createPaKaChiSemanticCatalog());
  const picks = [createStudioLandmarkSurfacePick(input())];
  // Rebind the test pick to the exact inventory ID generated from these source bytes.
  picks[0]!.meshId = manifest.meshes[0]!.id;
  const evidence = createStudioLandmarkEvidenceBundle(root, manifest, document(), picks, true);
  assert.equal(evidence.format, 'pakachi-cluster-landmark-evidence');
  assert.equal(evidence.sourceAssetSha256, manifest.sourceAssetSha256);
  assert.equal(evidence.sourceImageSha256, document().source.sha256);
  assert.equal(evidence.formMappingConfirmed, true);
  assert.throws(() => createStudioLandmarkEvidenceBundle(root, manifest, document(), picks, false), /Form.*ausdrücklich bestätigt/);
  assert.equal(evidence.correspondences.length, 1);
  assert.equal(evidence.correspondences[0]!.origin, 'user');
  assert.equal(evidence.correspondences[0]!.policy, 'locked');
  assert.equal(manifest.assignments[0]!.partId, null);
  assert.equal(manifest.assignments[0]!.surfaceLayerId, null);
});

test('rejects evidence export for mismatched form and image provenance', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  const root = new T.Group();
  root.add(new T.Mesh(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3))));
  const manifest = await createStudioFormManifest(root, Buffer.from('source').toString('base64'), 'animal', new Date().toISOString(), createPaKaChiSemanticCatalog());
  const pick = createStudioLandmarkSurfacePick(input());
  pick.meshId = manifest.meshes[0]!.id;
  assert.throws(() => createStudioLandmarkEvidenceBundle(root, manifest, document(), [{...pick,formId:'other-form'}], true), /Bildreferenz|same image reference/);
  assert.throws(() => createStudioLandmarkEvidenceBundle(root, manifest, document(), [{...pick,sourceImageSha256:'c'.repeat(64)}], true), /Bildreferenz|same image reference/);
});

test('round-trips a landmark evidence sidecar only when model, image, form and geometry still match', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  const root = new T.Group();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  root.add(new T.Mesh(geometry));
  const manifest = await createStudioFormManifest(root, Buffer.from('roundtrip source').toString('base64'), 'animal', new Date().toISOString(), createPaKaChiSemanticCatalog());
  const pick = createStudioLandmarkSurfacePick(input());
  pick.meshId = manifest.meshes[0]!.id;
  const exported = createStudioLandmarkEvidenceBundle(root, manifest, document(), [pick], true);
  const { validateStudioLandmarkEvidenceBundle } = await import('../src/studio-landmark-evidence.ts');
  const imported = validateStudioLandmarkEvidenceBundle(root, manifest, document(), JSON.parse(JSON.stringify(exported)), true);
  assert.deepEqual(imported, exported);
  assert.throws(() => validateStudioLandmarkEvidenceBundle(root, manifest, document(), exported, false), /ausdrücklich bestätigt/);
  assert.throws(() => validateStudioLandmarkEvidenceBundle(root, {...manifest, sourceAssetSha256:'c'.repeat(64)}, document(), exported, true), /anderen Quellmodell/);
  const changed = JSON.parse(JSON.stringify(exported));
  changed.correspondences[0].position[0] += 0.1;
  assert.throws(() => validateStudioLandmarkEvidenceBundle(root, manifest, document(), changed, true), /Mesh-Geometrie/);
});
