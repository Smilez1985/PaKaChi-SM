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
import { writeFigureGLB } from '../src/figure-glb.ts';
import { collectClusterMeshInventory } from '../src/cluster-inventory.ts';
import { createDraftRigLandmarkReview } from '../src/draft-rig-landmark-review.ts';
import type { ClusterManifest } from '../src/cluster-architecture.ts';
import type { StudioLandmarkEvidenceBundle } from '../src/studio-landmark-evidence.ts';
import { draftFigure } from './helpers/draft-rig-fixture.ts';

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
  const reviewState=editor as unknown as {landmarkReviewManifest:unknown;landmarkReviewPreview:unknown};
  reviewState.landmarkReviewManifest={overrides:[]};
  reviewState.landmarkReviewPreview={items:[{meshId:inventory().meshes[0]!.id,triangleIndex:0,status:'single-evidence',evidenceCount:1,landmarkIds:['left-eye'],proposedPartId:'head',proposedSurfaceLayerId:'fur',reasons:[]}]};
  button('#mode-rig').click();
  assert.match(host.textContent??'',/Einzelprüfung der Dreieck-Vorschläge/);
  assert.match(host.textContent??'',/Diesen Vorschlag übernehmen/);
  button('#studio-new').click();
  assert.match(host.textContent??'',/Noch keine Klassifikationsvorschläge geladen/);
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

test('creates a review-only triangle preview from exact confirmed evidence without changing the manifest', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  const root = new T.Group();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  root.add(new T.Mesh(geometry));
  const manifest = await createStudioFormManifest(root, Buffer.from('preview source').toString('base64'), 'animal', new Date().toISOString(), createPaKaChiSemanticCatalog());
  const pick = createStudioLandmarkSurfacePick(input());
  pick.meshId = manifest.meshes[0]!.id;
  const evidence = createStudioLandmarkEvidenceBundle(root, manifest, document(), [pick], true);
  const { createClusterLandmarkClassificationPreview, acceptClusterLandmarkPreviewItem } = await import('../src/cluster-landmark-preview.ts');
  const before = structuredClone(manifest.assignments);
  const preview = createClusterLandmarkClassificationPreview(manifest, evidence);
  assert.equal(preview.policy, 'review-only');
  assert.equal(preview.automaticAssignmentsApplied, false);
  assert.equal(preview.items.length, 1);
  assert.equal(preview.items[0]!.status, 'single-evidence');
  assert.equal(preview.items[0]!.proposedPartId, 'head');
  assert.equal(preview.items[0]!.proposedSurfaceLayerId, 'fur');
  assert.deepEqual(manifest.assignments, before);
  const accepted = acceptClusterLandmarkPreviewItem(manifest, preview, preview.items[0]!.meshId, 0);
  assert.equal(accepted.assignments.find(item => item.meshId === preview.items[0]!.meshId && item.triangleIndex === 0)!.partId, 'head');
  assert.equal(accepted.assignments[0]!.origin, 'user');
  assert.equal(accepted.assignments[0]!.policy, 'locked');
  assert.equal(accepted.overrides[0]!.operation.type, 'assign-triangle');
  assert.deepEqual(manifest.assignments, before);
  const duplicate = { ...evidence, correspondences: [evidence.correspondences[0]!, { ...evidence.correspondences[0]!, landmarkId: 'right-eye' }] };
  const corroborated = createClusterLandmarkClassificationPreview(manifest, duplicate);
  assert.equal(corroborated.items[0]!.status, 'corroborated');
  const conflict = { ...duplicate, correspondences: [duplicate.correspondences[0]!, { ...duplicate.correspondences[1]!, partId: 'body' }] };
  const otherPartManifest = { ...manifest, parts: [...manifest.parts, { id: 'body', name: 'Body', parentPartId: null, orderKey: [2], rigBoneIds: [] }] };
  const conflicted = createClusterLandmarkClassificationPreview(otherPartManifest, conflict);
  assert.equal(conflicted.items[0]!.status, 'conflict');
  assert.equal(conflicted.items[0]!.proposedPartId, null);
});


test('restores reviewed triangle manifests only for the exact model, form, catalog and image', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  const root = new T.Group();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  root.add(new T.Mesh(geometry));
  const manifest = await createStudioFormManifest(root, Buffer.from('reviewed manifest roundtrip').toString('base64'), 'animal', new Date().toISOString(), createPaKaChiSemanticCatalog());
  const pick = createStudioLandmarkSurfacePick(input()); pick.meshId = manifest.meshes[0]!.id;
  const evidence = createStudioLandmarkEvidenceBundle(root, manifest, document(), [pick], true);
  const { createClusterLandmarkClassificationPreview, acceptClusterLandmarkPreviewItem, restoreReviewedClusterManifest } = await import('../src/cluster-landmark-preview.ts');
  const preview = createClusterLandmarkClassificationPreview(manifest, evidence);
  const accepted = acceptClusterLandmarkPreviewItem(manifest, preview, preview.items[0]!.meshId, 0);
  const restored = restoreReviewedClusterManifest(manifest, JSON.parse(JSON.stringify(accepted)), document().source.sha256);
  assert.deepEqual(restored.assignments, accepted.assignments);
  assert.equal(restored.overrides.length, 1);
  assert.equal(restored.overrides[0]!.operation.type, 'assign-triangle');
  assert.equal(restored.overrides[0]!.operation.type === 'assign-triangle' ? restored.overrides[0]!.operation.avatarId : null, evidence.avatarId);
  assert.equal(restored.overrides[0]!.operation.type === 'assign-triangle' ? restored.overrides[0]!.operation.formId : null, evidence.formId);
  assert.throws(() => restoreReviewedClusterManifest(manifest, accepted, 'c'.repeat(64)), /anderen Bildreferenz-Beleg/);
  assert.throws(() => restoreReviewedClusterManifest({ ...manifest, form: 'humanoid' }, accepted, document().source.sha256), /anderen Quellmodell/);
  const tampered = structuredClone(accepted);
  tampered.assignments[0]!.origin = 'imported';
  assert.throws(() => restoreReviewedClusterManifest(manifest, tampered, document().source.sha256), /Zuweisungen stimmen nicht mit .*Override-Protokoll/);
  const mixedIdentity = structuredClone(accepted);
  const originalOverride = mixedIdentity.overrides[0]!;
  if (originalOverride.operation.type !== 'assign-triangle') throw new Error('Expected triangle override.');
  mixedIdentity.overrides.push({ ...originalOverride, id: 'second-override', operation: { ...originalOverride.operation, avatarId: 'another-avatar' } });
  mixedIdentity.revision++;
  assert.throws(() => restoreReviewedClusterManifest(manifest, mixedIdentity, document().source.sha256), /unterschiedlichen Avatar- oder Formreferenzen/);
  const extraOperation = structuredClone(accepted);
  extraOperation.overrides[0]!.operation = { type: 'assign-mesh', meshId: manifest.meshes[0]!.id, partId: null };
  assert.throws(() => restoreReviewedClusterManifest(manifest, extraOperation, document().source.sha256), /ungültig|nicht unterstützte Änderungen/i);
});

test('landmark review acceptance rejects conflicts and stale preview provenance', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  const root = new T.Group();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  root.add(new T.Mesh(geometry));
  const manifest = await createStudioFormManifest(root, Buffer.from('review guard').toString('base64'), 'animal', new Date().toISOString(), createPaKaChiSemanticCatalog());
  const pick = createStudioLandmarkSurfacePick(input()); pick.meshId = manifest.meshes[0]!.id;
  const evidence = createStudioLandmarkEvidenceBundle(root, manifest, document(), [pick], true);
  const { createClusterLandmarkClassificationPreview, acceptClusterLandmarkPreviewItem } = await import('../src/cluster-landmark-preview.ts');
  const preview = createClusterLandmarkClassificationPreview(manifest, evidence);
  const conflict = { ...preview, items: [{ ...preview.items[0]!, status: 'conflict' as const }] };
  assert.throws(() => acceptClusterLandmarkPreviewItem(manifest, conflict, preview.items[0]!.meshId, 0), /nicht eindeutig/);
  assert.throws(() => acceptClusterLandmarkPreviewItem({ ...manifest, sourceAssetSha256: 'c'.repeat(64) }, preview, preview.items[0]!.meshId, 0), /passt nicht/);
});


test('Studio confirms reviewed anchors and exports a bound GLB without replacing the active avatar', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  class Reader {
    result: ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;
    readAsArrayBuffer(blob: Blob) {
      void blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); });
    }
  }
  Object.assign(globalThis, { FileReader: Reader, ProgressEvent: class extends Event {} });
  const w = new Window();
  Object.assign(globalThis, {
    window: w, document: w.document, Event: w.Event,
    Option: function (label = '', value = '') {
      const option = w.document.createElement('option');
      option.textContent = label; option.value = value; return option;
    },
  });
  const root = draftFigure(false);
  root.updateMatrixWorld(true);
  const sourceBytes = new Uint8Array(await writeFigureGLB(root));
  const sourceBase64 = Buffer.from(sourceBytes).toString('base64');
  const image = document();
  image.forms = [{ id: 'work-form', label: 'Work form', viewIds: ['view-front'] }];
  image.avatars = [{ id: 'pakachi', label: 'PaKaChi', formIds: ['work-form'] }];
  const manifest = await createStudioFormManifest(root, sourceBase64, 'humanoid', new Date().toISOString(), createPaKaChiSemanticCatalog());
  const meshInventory = collectClusterMeshInventory(root, manifest.sourceAssetSha256);
  const pick = createStudioLandmarkSurfacePick({
    document: image, inventory: meshInventory, landmarkId: 'left-eye',
    hit: { meshIndex: 1, triangleIndex: 0, barycentric: [0.2, 0.3, 0.5] },
    radiusLocal: 0.05, confirmed: true,
  });
  const evidence = createStudioLandmarkEvidenceBundle(root, manifest, image, [pick], true);
  const review = createDraftRigLandmarkReview(evidence, root, manifest, 'biped-relaxed');
  assert.equal(review.report.unresolved.length, 0);
  assert.equal(review.report.anchors[0]?.jointName, 'Head');

  const rig = new StudioRig(root);
  const view = new Proxy({}, {
    get(_target, key) { return key === 'onSurfacePick' ? () => {} : () => {}; },
    set() { return true; },
  }) as unknown as StudioView;
  const host = w.document.createElement('div');
  const project = {
    format: 'pakachi-studio' as const, version: 1 as const, model: sourceBase64,
    avatar: { id: 'pakachi', name: 'PaKaChi', description: '', moves: [] },
    imageReference: image,
  };
  const editor = new StudioEditor(rig, view, host as unknown as HTMLElement, project, {
    suspend() {}, resume() {}, changed() {}, feedback() {},
  });
  editor.enter();
  const internal = editor as unknown as {
    landmarkReviewManifest: ClusterManifest | null;
    draftRigLandmarkEvidence: StudioLandmarkEvidenceBundle | null;
    draftRigLandmarkReview: ReturnType<typeof createDraftRigLandmarkReview> | null;
    renderDraftRigLandmarkReview(): void;
    confirmedDraftRigLandmarkPlan: unknown;
  };
  internal.landmarkReviewManifest = manifest;
  internal.draftRigLandmarkEvidence = evidence;
  internal.draftRigLandmarkReview = review;
  internal.renderDraftRigLandmarkReview();

  const panel = host.querySelector('#draft-rig-landmark-review-panel')!;
  const buttons = panel.querySelectorAll('button');
  assert.equal(buttons.length, 3);
  const confirm = [...buttons].find(button => button.textContent?.includes('ausdrücklich bestätigen')) as unknown as HTMLButtonElement;
  const apply = host.querySelector('#draft-rig-landmark-plan-apply') as unknown as HTMLButtonElement;
  assert.equal(apply.disabled, true);
  confirm.click();
  assert.ok(internal.confirmedDraftRigLandmarkPlan);
  assert.equal(apply.disabled, false);

  const blobs: Blob[] = [];
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalAnchorClick = w.HTMLAnchorElement.prototype.click;
  let downloaded = '';
  URL.createObjectURL = (blob: Blob | MediaSource) => { blobs.push(blob as Blob); return 'blob:pakachi-test'; };
  URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () { downloaded = this.download; };
  try {
    apply.click();
    for (let i = 0; i < 300 && !panel.textContent?.includes('Draft-Rig erzeugt und GLB exportiert'); i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.match(panel.textContent ?? '', /Draft-Rig erzeugt und GLB exportiert/);
    assert.equal(downloaded, 'pakachi-avatar-landmark-rig.glb');
    assert.equal(blobs.length, 1);
    assert.ok(blobs[0]!.size > 0);
    assert.equal(root.getObjectByName('Draft_Head'), undefined);
    assert.equal(root.children.some(child => child instanceof T.SkinnedMesh), false);
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    w.HTMLAnchorElement.prototype.click = originalAnchorClick;
    editor.dispose();
    w.happyDOM.abort();
  }
});
