import { StudioRig } from '../../../src/studio-rig.ts';
import { StudioEditor } from '../../../src/studio-editor.ts';
import type { StudioView } from '../../../src/studio-view.ts';
import { writeFigureGLB } from '../../../src/figure-glb.ts';
import { createStudioFormManifest } from '../../../src/studio-form-manifest.ts';
import { collectClusterMeshInventory } from '../../../src/cluster-inventory.ts';
import { createStudioLandmarkSurfacePick } from '../../../src/studio-landmark-picking.ts';
import { createStudioLandmarkEvidenceBundle } from '../../../src/studio-landmark-evidence.ts';
import { createDraftRigLandmarkReview } from '../../../src/draft-rig-landmark-review.ts';
import { createPaKaChiSemanticCatalog } from '../../../src/cluster-2d-classifier.ts';
import type { ImageReferenceDocument } from '../../../src/image-reference.ts';
import type { ClusterManifest } from '../../../src/cluster-architecture.ts';
import type { StudioLandmarkEvidenceBundle } from '../../../src/studio-landmark-evidence.ts';
import { draftFigure } from '../../helpers/draft-rig-fixture.ts';

export async function mountStudioLandmarkExportFixture(host: HTMLElement) {
  const root = draftFigure(false);
  root.updateMatrixWorld(true);
  const sourceBytes = new Uint8Array(await writeFigureGLB(root));
  const sourceBase64 = btoa(Array.from(sourceBytes, byte => String.fromCharCode(byte)).join(''));
  const image: ImageReferenceDocument = {
    format: 'pakachi-image-reference', version: 1,
    source: { sha256: 'b'.repeat(64), width: 100, height: 100 },
    regions: [{ id: 'region-head', label: 'Head', kind: 'view', status: 'confirmed',
      geometry: { type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } }],
    views: [{ id: 'view-front', label: 'Front', regionIds: ['region-head'] }],
    forms: [{ id: 'work-form', label: 'Work form', viewIds: ['view-front'] }],
    avatars: [{ id: 'pakachi', label: 'PaKaChi', formIds: ['work-form'] }],
    landmarks: [{ id: 'left-eye', regionId: 'region-head', partId: 'head', surfaceLayerId: 'fur',
      poseId: 'front-neutral', x: 20, y: 20, radiusPx: 8 }],
  };
  const catalog = createPaKaChiSemanticCatalog();
  const manifest = await createStudioFormManifest(root, sourceBase64, 'humanoid', new Date().toISOString(), catalog);
  const inventory = collectClusterMeshInventory(root, manifest.sourceAssetSha256);
  const meshIndex = inventory.meshes.findIndex(mesh => mesh.sourceMeshName === 'Head');
  if (meshIndex < 0) throw new Error('Fixture head mesh missing from source inventory.');
  const pick = createStudioLandmarkSurfacePick({
    document: image, inventory, landmarkId: 'left-eye',
    hit: { meshIndex, triangleIndex: 0, barycentric: [0.2, 0.3, 0.5] },
    radiusLocal: 0.05, confirmed: true,
  });
  const evidence = createStudioLandmarkEvidenceBundle(root, manifest, image, [pick], true);
  const review = createDraftRigLandmarkReview(evidence, root, manifest, 'biped-relaxed');
  if (review.report.unresolved.length || review.report.anchors.length !== 1) {
    throw new Error('Fixture landmark did not resolve to one confirmed review candidate.');
  }
  const rig = new StudioRig(root);
  const view = new Proxy({}, {
    get(_target, key) { return key === 'onSurfacePick' ? () => {} : () => {}; },
    set() { return true; },
  }) as unknown as StudioView;
  const project = {
    format: 'pakachi-studio' as const, version: 1 as const, model: sourceBase64,
    avatar: { id: 'pakachi', name: 'PaKaChi', description: '', moves: [] },
    imageReference: image,
  };
  const editor = new StudioEditor(rig, view, host, project, {
    suspend() {}, resume() {}, changed() {}, feedback() {},
  });
  editor.enter();
  const internal = editor as unknown as {
    landmarkReviewManifest: ClusterManifest | null;
    draftRigLandmarkEvidence: StudioLandmarkEvidenceBundle | null;
    draftRigLandmarkReview: ReturnType<typeof createDraftRigLandmarkReview> | null;
    renderDraftRigLandmarkReview(): void;
  };
  internal.landmarkReviewManifest = manifest;
  internal.draftRigLandmarkEvidence = evidence;
  internal.draftRigLandmarkReview = review;
  internal.renderDraftRigLandmarkReview();
  return { editor, root };
}
