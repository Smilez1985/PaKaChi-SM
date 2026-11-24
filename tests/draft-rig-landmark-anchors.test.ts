import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDraftRigLandmarkAnchors } from '../src/draft-rig-landmark-anchors.ts';
import type { StudioLandmarkEvidenceBundle } from '../src/studio-landmark-evidence.ts';

function landmarkEvidence(form: 'animal' | 'humanoid', parts: { id: string; partId: string; position: [number, number, number] }[]): StudioLandmarkEvidenceBundle {
  return {
    format: 'pakachi-cluster-landmark-evidence', version: 1,
    sourceAssetSha256: 'a'.repeat(64), sourceImageSha256: 'b'.repeat(64),
    avatarId: 'pakachi', formId: form === 'animal' ? 'animal-form' : 'work-form',
    form, formMappingConfirmed: true,
    correspondences: parts.map(item => ({
      landmarkId: item.id, viewId: 'front', poseId: 'rest', meshId: 'body-mesh',
      triangleIndex: 0, barycentric: [1, 0, 0] as const, partId: item.partId,
      surfaceLayerId: null, position: item.position, radius: .05,
      origin: 'user' as const, policy: 'locked' as const,
    })),
  };
}
const identity = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

test('reviewed centerline landmarks map only to unambiguous joints and transform into avatar space', () => {
  const evidence = landmarkEvidence('humanoid', [
    { id: 'landmark-pelvis', partId: 'pelvis', position: [0, 0, 0] },
    { id: 'landmark-chest', partId: 'chest', position: [0, 1, 0] },
    { id: 'landmark-neck', partId: 'neck', position: [0, 2, 0] },
    { id: 'landmark-head', partId: 'head', position: [0, 3, 0] },
  ]);
  const translated = [...identity]; translated[12] = 4; translated[13] = -2; translated[14] = 7;
  const report = resolveDraftRigLandmarkAnchors(evidence, [
    { meshId: 'body-mesh', meshToAvatar: translated },
  ], 'biped');
  assert.deepEqual(report.anchors.map(anchor => anchor.jointName), ['Hips', 'Chest', 'Neck', 'Head']);
  assert.deepEqual(report.anchors[0]!.position, [4, -2, 7]);
  assert.deepEqual(report.anchors[1]!.position, [4, -1, 7]);
  assert.equal(report.unresolved.length, 0);
});

test('bilateral landmarks are not assigned a left/right joint without explicit user mapping', () => {
  const evidence = landmarkEvidence('humanoid', [
    { id: 'left-elbow-pick', partId: 'forearms', position: [1, 1, 0] },
  ]);
  const transforms = [{ meshId: 'body-mesh', meshToAvatar: identity }];
  const unresolved = resolveDraftRigLandmarkAnchors(evidence, transforms, 'biped');
  assert.equal(unresolved.anchors.length, 0);
  assert.deepEqual(unresolved.unresolved, [
    { landmarkId: 'left-elbow-pick', partId: 'forearms', reason: 'no-unambiguous-joint' },
  ]);
  const assigned = resolveDraftRigLandmarkAnchors(evidence, transforms, 'biped', [
    { landmarkId: 'left-elbow-pick', jointName: 'LeftElbow' },
  ]);
  assert.equal(assigned.anchors[0]!.jointName, 'LeftElbow');
});

test('explicit side assignment cannot contradict semantic part compatibility', () => {
  const evidence = landmarkEvidence('humanoid', [
    { id: 'head-pick', partId: 'head', position: [0, 3, 0] },
  ]);
  assert.equal(resolveDraftRigLandmarkAnchors(evidence, [
    { meshId: 'body-mesh', meshToAvatar: identity },
  ], 'biped', [{ landmarkId: 'head-pick', jointName: 'LeftKnee' }]).anchors.length, 0);
});

test('missing mesh transforms stay unresolved and incompatible forms are rejected', () => {
  const evidence = landmarkEvidence('animal', [
    { id: 'tail-tip-pick', partId: 'tail-tip', position: [0, 1, 0] },
  ]);
  const report = resolveDraftRigLandmarkAnchors(evidence, [], 'quadruped');
  assert.equal(report.anchors.length, 0);
  assert.equal(report.unresolved[0]!.reason, 'missing-mesh-transform');
  assert.throws(() => resolveDraftRigLandmarkAnchors(evidence, [
    { meshId: 'body-mesh', meshToAvatar: identity },
  ], 'biped'), /form-template/);
});

test('two reviewed landmarks cannot silently compete for the same joint', () => {
  const evidence = landmarkEvidence('humanoid', [
    { id: 'head-a', partId: 'head', position: [0, 3, 0] },
    { id: 'head-b', partId: 'head', position: [0, 3.1, 0] },
  ]);
  assert.throws(() => resolveDraftRigLandmarkAnchors(evidence, [
    { meshId: 'body-mesh', meshToAvatar: identity },
  ], 'biped'), /joint-conflict/);
});
