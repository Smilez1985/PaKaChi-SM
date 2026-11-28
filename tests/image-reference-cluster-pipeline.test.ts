import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { createUnclassifiedClusterManifest } from '../src/cluster-inventory.ts';
import { proposeClusterManifestFromImageReference, proposeClusterManifestsFromImageReference } from '../src/image-reference-cluster-pipeline.ts';
import type { ImageReferenceDocument, ImageReferenceCameraCalibration } from '../src/image-reference.ts';

const imageHash = 'a'.repeat(64);
const assetHash = 'c'.repeat(64);
const point = new Vector3(0, 0.5, 4);
const cameraAim = new Vector3(0, 0, 4);

function calibration(viewId: string, position: Vector3): ImageReferenceCameraCalibration {
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), cameraAim.clone().sub(position).normalize());
  return {
    id: 'cal-' + viewId, sourceImageSha256: imageHash, avatarId: 'pakachi',
    formId: 'animal-form', poseId: 'neutral', viewId, coordinateFrameId: 'avatar-root', fx: 1, fy: 1, cx: .5, cy: .5,
    cameraToWorld: new Matrix4().compose(position, rotation, new Vector3(1, 1, 1)).toArray(),
  };
}
function fixture() {
  const meshId = 'mesh-' + assetHash + '-walk0-mesh0-primitive0';
  const inventory = {
    schemaVersion: 1 as const, sourceAssetSha256: assetHash,
    meshes: [{ id: meshId, sourceMeshIndex: 0, sourceMeshName: 'Body', primitiveIndex: 0, vertexCount: 3, triangleCount: 1 }],
    totals: { meshes: 1, vertices: 3, triangles: 1 },
  };
  const current = createUnclassifiedClusterManifest(inventory, 'animal', '2026-11-23T13:00:00.000Z');
  current.parts = [{ id: 'torso', name: 'Torso', parentPartId: null, orderKey: [1], rigBoneIds: [] }];
  const front = calibration('front', new Vector3(-1, 0, 0));
  const side = calibration('side', new Vector3(1, 0, 0));
  const pixel = (camera: ImageReferenceCameraCalibration) => {
    const local = point.clone().applyMatrix4(new Matrix4().fromArray(camera.cameraToWorld).invert());
    return { x: (local.x / local.z + .5) * 1000, y: (.5 - local.y / local.z) * 500 };
  };
  const pFront = pixel(front), pSide = pixel(side);
  const imageReference: ImageReferenceDocument = {
    format: 'pakachi-image-reference', version: 1,
    source: { sha256: imageHash, width: 1000, height: 500 },
    regions: [
      { id: 'front-region', label: 'Front', kind: 'view', status: 'confirmed', geometry: { type: 'rectangle', x: 0, y: 0, width: 400, height: 500 } },
      { id: 'side-region', label: 'Side', kind: 'view', status: 'confirmed', geometry: { type: 'rectangle', x: 500, y: 0, width: 400, height: 500 } },
    ],
    views: [{ id: 'front', label: 'Front', regionIds: ['front-region'] }, { id: 'side', label: 'Side', regionIds: ['side-region'] }],
    forms: [{ id: 'animal-form', label: 'Animal', viewIds: ['front', 'side'] }],
    avatars: [{ id: 'pakachi', label: 'PaKaChi', formIds: ['animal-form'] }],
    landmarks: [
      { id: 'front-eye', correspondenceId: 'torso-center', regionId: 'front-region', partId: 'torso', poseId: 'neutral', ...pFront, radiusPx: 8 },
      { id: 'side-eye', correspondenceId: 'torso-center', regionId: 'side-region', partId: 'torso', poseId: 'neutral', ...pSide, radiusPx: 8 },
    ],
    cameraCalibrations: [front, side],
  };
  return { meshId, current, imageReference, positions: new Float32Array([-.1, 0, 4, .1, 0, 4, 0, .1, 4]) };
}

test('bridges confirmed image-reference landmarks through calibrated multi-view triangulation into a candidate', () => {
  const { meshId, current, imageReference, positions } = fixture();
  const result = proposeClusterManifestFromImageReference({
    current, sourceAssetSha256: assetHash, targetForm: 'animal', meshId, positions, indices: null,
    meshWorld: new Matrix4().toArray(), meshCoordinateFrameId: 'avatar-root', imageReference,
    identity: { avatarId: 'pakachi', formId: 'animal-form', poseId: 'neutral', radiusWorld: 1 },
  }, '2026-11-23T13:01:00.000Z');
  assert.equal(result.observations.length, 2);
  assert.equal(result.triangulation.seeds.length, 1);
  assert.equal(result.triangulation.seeds[0]!.viewCount, 2);
  assert.ok(Math.abs(result.triangulation.seeds[0]!.position[1]! - point.y) < 1e-6,
    'image-space downward pixel coordinates must reconstruct positive camera/world Y');
  assert.equal(result.classifiedTriangles, 1);
  assert.equal(result.candidate?.assignments[0]?.partId, 'torso');
  assert.equal(current.assignments[0]?.partId, null, 'source manifest must remain unchanged');
});

test('refuses a one-view source instead of inventing depth or a candidate', () => {
  const { meshId, current, imageReference, positions } = fixture();
  imageReference.cameraCalibrations = imageReference.cameraCalibrations!.slice(0, 1);
  const result = proposeClusterManifestFromImageReference({
    current, sourceAssetSha256: assetHash, targetForm: 'animal', meshId, positions, indices: null,
    meshWorld: new Matrix4().toArray(), meshCoordinateFrameId: 'avatar-root', imageReference,
    identity: { avatarId: 'pakachi', formId: 'animal-form', poseId: 'neutral', radiusWorld: 1 },
  });
  assert.equal(result.candidate, null);
  assert.equal(result.classifiedTriangles, 0);
  assert.match(result.triangulation.rejected[0]!.reason, /two calibrated views/);
});

test('rejects missing explicit avatar/form/pose calibration rather than borrowing another form', () => {
  const { meshId, current, imageReference, positions } = fixture();
  imageReference.cameraCalibrations = imageReference.cameraCalibrations!.map(item => ({ ...item, formId: 'work-form' }));
  assert.throws(() => proposeClusterManifestFromImageReference({
    current, sourceAssetSha256: assetHash, targetForm: 'animal', meshId, positions, indices: null,
    meshWorld: new Matrix4().toArray(), meshCoordinateFrameId: 'avatar-root', imageReference,
    identity: { avatarId: 'pakachi', formId: 'animal-form', poseId: 'neutral', radiusWorld: 1 },
  }), /invalid-image-reference-document:cameraCalibrations/);
});

test('refuses camera-to-mesh triangulation when coordinate-frame identity is missing or different', () => {
  const { meshId, current, imageReference, positions } = fixture();
  assert.throws(() => proposeClusterManifestFromImageReference({
    current, sourceAssetSha256: assetHash, targetForm: 'animal', meshId, positions, indices: null,
    meshWorld: new Matrix4().toArray(), meshCoordinateFrameId: 'scene-root', imageReference,
    identity: { avatarId: 'pakachi', formId: 'animal-form', poseId: 'neutral', radiusWorld: 1 },
  }), /coordinate frames are missing or do not match/);
  imageReference.cameraCalibrations = imageReference.cameraCalibrations!.map(item => ({ ...item, coordinateFrameId: undefined }));
  assert.throws(() => proposeClusterManifestFromImageReference({
    current, sourceAssetSha256: assetHash, targetForm: 'animal', meshId, positions, indices: null,
    meshWorld: new Matrix4().toArray(), meshCoordinateFrameId: 'avatar-root', imageReference,
    identity: { avatarId: 'pakachi', formId: 'animal-form', poseId: 'neutral', radiusWorld: 1 },
  }), /coordinate frames are missing or do not match/);
});

test('builds one review-only candidate across multiple exact mesh bindings without mutating the source manifest', () => {
  const { meshId, current, imageReference, positions } = fixture();
  const secondMeshId = 'mesh-' + assetHash + '-walk1-mesh1-primitive0';
  current.meshes.push({ ...current.meshes[0]!, id: secondMeshId, sourceMeshIndex: 1, sourceMeshName: 'Body detail' });
  current.assignments.push({ ...current.assignments[0]!, meshId: secondMeshId });
  const result = proposeClusterManifestsFromImageReference({
    current, sourceAssetSha256: assetHash, targetForm: 'animal', meshCoordinateFrameId: 'avatar-root', imageReference,
    identity: { avatarId: 'pakachi', formId: 'animal-form', poseId: 'neutral', radiusWorld: 1 },
    meshes: [
      { meshId, positions, indices: null, meshWorld: new Matrix4().toArray() },
      { meshId: secondMeshId, positions, indices: null, meshWorld: new Matrix4().toArray() },
    ],
  });
  assert.equal(result.meshResults.length, 2);
  assert.ok(result.meshResults.every(item => item.triangulation.seeds.length === 1));
  assert.equal(result.candidate?.assignments.filter(item => item.partId === 'torso').length, 2);
  assert.ok(current.assignments.every(item => item.partId === null), 'source manifest must remain unmodified');
});

