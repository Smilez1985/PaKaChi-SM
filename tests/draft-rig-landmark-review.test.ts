import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { collectClusterMeshInventory } from '../src/cluster-inventory.ts';
import {
  captureDraftRigLandmarkTransforms,
  createDraftRigLandmarkReview,
  confirmDraftRigLandmarkReview,
} from '../src/draft-rig-landmark-review.ts';
import type { ClusterManifest } from '../src/cluster-architecture.ts';
import type { StudioLandmarkEvidenceBundle } from '../src/studio-landmark-evidence.ts';

const hash = 'a'.repeat(64);
function scene() {
  const root = new THREE.Group();
  root.position.set(10, 2, -3);
  root.rotation.y = Math.PI / 2;
  const parent = new THREE.Group();
  parent.position.set(1, 0, 0);
  root.add(parent);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
  mesh.position.set(0, 3, 0);
  parent.add(mesh);
  root.updateMatrixWorld(true);
  const inventory = collectClusterMeshInventory(root, hash);
  const manifest = {
    schemaVersion: 1, form: 'humanoid', sourceAssetSha256: hash,
    algorithmId: 'test', algorithmVersion: '1', generatedAt: '2026-11-25T00:00:00.000Z',
    parts: [], layers: [], meshes: inventory.meshes, assignments: [], overrides: [], revision: 0,
  } as ClusterManifest;
  return { root, manifest, meshId: inventory.meshes[0]!.id };
}
function evidence(meshId: string, partId = 'head'): StudioLandmarkEvidenceBundle {
  return {
    format: 'pakachi-cluster-landmark-evidence', version: 1,
    sourceAssetSha256: hash, sourceImageSha256: 'b'.repeat(64),
    avatarId: 'pakachi', formId: 'work-form', form: 'humanoid', formMappingConfirmed: true,
    correspondences: [{
      landmarkId: 'head-pick', viewId: 'front', poseId: 'rest', meshId,
      triangleIndex: 0, barycentric: [1, 0, 0], partId, surfaceLayerId: null,
      position: [0, 0, 0], radius: .05, origin: 'user', policy: 'locked',
    }],
  };
}

test('capture stores exact mesh-local to avatar-root-local transforms', () => {
  const { root, manifest, meshId } = scene();
  const transform = captureDraftRigLandmarkTransforms(root, manifest)[0]!;
  assert.equal(transform.meshId, meshId);
  const local = new THREE.Vector3(0, 0, 0).applyMatrix4(new THREE.Matrix4().fromArray([...transform.meshToAvatar]));
  assert.ok(Math.abs(local.x - 1) < 1e-6);
  assert.ok(Math.abs(local.y - 3) < 1e-6);
  assert.ok(Math.abs(local.z) < 1e-6);
});

test('review binds evidence to the current source form and creates candidates without changing the scene', () => {
  const { root, manifest, meshId } = scene();
  const before = root.position.toArray();
  const review = createDraftRigLandmarkReview(evidence(meshId), root, manifest, 'biped');
  assert.equal(review.status, 'review-required');
  assert.equal(review.report.anchors[0]!.jointName, 'Head');
  assert.deepEqual(root.position.toArray(), before);
  assert.throws(() => createDraftRigLandmarkReview(evidence(meshId), root,
    { ...manifest, sourceAssetSha256: 'c'.repeat(64) }, 'biped'), /source-form/);
});

test('confirmation requires all candidates and preserves explicit manual position correction', () => {
  const { root, manifest, meshId } = scene();
  const review = createDraftRigLandmarkReview(evidence(meshId), root, manifest, 'biped');
  const plan = confirmDraftRigLandmarkReview(review, [{
    landmarkId: 'head-pick', jointName: 'Head', position: [0.1, 2.4, -0.2],
  }]);
  assert.equal(plan.status, 'user-confirmed');
  assert.deepEqual(plan.anchors[0]!.position, [0.1, 2.4, -0.2]);
  assert.throws(() => confirmDraftRigLandmarkReview(review, []), /review-incomplete/);
  assert.throws(() => confirmDraftRigLandmarkReview(review, [{
    landmarkId: 'head-pick', jointName: 'LeftElbow',
  }]), /joint-review/);
});

test('unresolved bilateral evidence cannot be confirmed without explicit mapping', () => {
  const { root, manifest, meshId } = scene();
  const report = createDraftRigLandmarkReview(evidence(meshId, 'forearms'), root, manifest, 'biped');
  assert.equal(report.report.unresolved.length, 1);
  assert.throws(() => confirmDraftRigLandmarkReview(report, []), /review-incomplete/);
});
