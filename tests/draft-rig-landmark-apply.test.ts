import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { writeFigureGLB } from '../src/figure-glb.ts';
import { parseModel, disposeModel } from '../src/viewer.ts';
import { prepareDraftRigWithConfirmedLandmarks, sha256DraftRigSource } from '../src/draft-rig-landmark-apply.ts';
import { draftFigure } from './helpers/draft-rig-fixture.ts';

const signal = () => new AbortController().signal;
async function source() {
  return new Uint8Array(await writeFigureGLB(draftFigure(false)));
}
async function planFor(bytes: Uint8Array) {
  const hash = await sha256DraftRigSource(bytes);
  return {
    format: 'pakachi-confirmed-draft-rig-landmark-plan' as const,
    version: 1 as const,
    avatarId: 'pakachi',
    formId: 'work-form',
    sourceAssetSha256: hash,
    sourceImageSha256: 'b'.repeat(64),
    template: 'biped-relaxed' as const,
    status: 'user-confirmed' as const,
    anchors: [{
      jointName: 'Head',
      position: [0.12, 1.1, 0.08] as [number, number, number],
      landmarkId: 'head',
      partId: 'head',
      meshId: 'head-mesh',
      radius: .05,
      origin: 'user' as const,
      policy: 'locked' as const,
    }],
  };
}

test('confirmed anchors enter the draft rest pose before skinning and bind matrices are built', async () => {
  const bytes = await source();
  const original = bytes.slice();
  const plan = await planFor(bytes);
  const prepared = await prepareDraftRigWithConfirmedLandmarks(bytes, plan, {
    avatarId: 'pakachi', formId: 'work-form',
    sourceAssetSha256: plan.sourceAssetSha256, template: 'biped-relaxed',
  }, signal());
  assert.deepEqual(bytes, original);
  const model = await parseModel(prepared.bytes.buffer.slice(
    prepared.bytes.byteOffset, prepared.bytes.byteOffset + prepared.bytes.byteLength,
  ));
  try {
    model.scene.updateMatrixWorld(true);
    const head = model.scene.getObjectByName('Draft_Head');
    assert.ok(head instanceof THREE.Bone);
    const world = head.getWorldPosition(new THREE.Vector3());
    const rootLocal = model.scene.worldToLocal(world.clone());
    assert.ok(rootLocal.distanceTo(new THREE.Vector3(...plan.anchors[0]!.position)) < 1e-5);
    assert.equal(prepared.report.review, 'required');
  } finally {
    disposeModel(model.scene);
  }
});

test('landmark handover rejects wrong avatar, form, template and source bytes before rigging', async () => {
  const bytes = await source();
  const plan = await planFor(bytes);
  const target = {
    avatarId: 'pakachi', formId: 'work-form',
    sourceAssetSha256: plan.sourceAssetSha256, template: 'biped-relaxed' as const,
  };
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, plan, { ...target, avatarId: 'other' }, signal()), /target-mismatch/);
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, plan, { ...target, formId: 'animal-form' }, signal()), /target-mismatch/);
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, plan, { ...target, template: 'biped' }, signal()), /target-mismatch/);
  const changed = bytes.slice(); changed[changed.length - 1] ^= 1;
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(changed, plan, target, signal()), /source-hash-mismatch/);
});

test('duplicate or unknown joint anchors are rejected without changing source bytes', async () => {
  const bytes = await source();
  const plan = await planFor(bytes);
  const target = {
    avatarId: 'pakachi', formId: 'work-form',
    sourceAssetSha256: plan.sourceAssetSha256, template: 'biped-relaxed' as const,
  };
  const duplicate = { ...plan, anchors: [...plan.anchors, { ...plan.anchors[0]!, landmarkId: 'head-2' }] };
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, duplicate, target, signal()), /plan-anchor/);
  const unknown = { ...plan, anchors: [{ ...plan.anchors[0]!, jointName: 'TailTip' }] };
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, unknown, target, signal()), /anchor-joint/);
  assert.equal(await sha256DraftRigSource(bytes), plan.sourceAssetSha256);
});
