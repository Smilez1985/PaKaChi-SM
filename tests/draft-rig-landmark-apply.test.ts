import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { writeFigureGLB } from '../src/figure-glb.ts';
import { parseModel, disposeModel } from '../src/viewer.ts';
import { prepareDraftRigWithConfirmedLandmarks, sha256DraftRigSource } from '../src/draft-rig-landmark-apply.ts';
import { draftFigure } from './helpers/draft-rig-fixture.ts';

class Reader {
  result: ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); });
  }
}
Object.assign(globalThis, { FileReader: Reader, ProgressEvent: class extends Event {} });
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
    avatarId: 'pakachi', formId: 'work-form', form: 'humanoid' as const,
    sourceAssetSha256: plan.sourceAssetSha256, template: 'biped-relaxed',
  }, signal());
  assert.deepEqual(bytes, original);
  const modelBytes = Uint8Array.from(prepared.bytes);
  const model = await parseModel(modelBytes.buffer as ArrayBuffer);
  try {
    model.scene.updateMatrixWorld(true);
    const head = model.scene.getObjectByName('Draft_Head') as THREE.Bone;
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
    avatarId: 'pakachi', formId: 'work-form', form: 'humanoid' as const,
    sourceAssetSha256: plan.sourceAssetSha256, template: 'biped-relaxed' as const,
  };
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, plan, { ...target, avatarId: 'other' }, signal()), /target-mismatch/);
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, plan, { ...target, formId: 'animal-form', form: 'animal' }, signal()), /target-mismatch/);
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, plan, { ...target, template: 'biped', form: 'animal' }, signal()), /target-mismatch/);
  const changed = bytes.slice(); changed[changed.length - 1] = changed[changed.length - 1]! ^ 1;
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(changed, plan, target, signal()), /source-hash-mismatch/);
});

test('duplicate or unknown joint anchors are rejected without changing source bytes', async () => {
  const bytes = await source();
  const plan = await planFor(bytes);
  const target = {
    avatarId: 'pakachi', formId: 'work-form', form: 'humanoid' as const,
    sourceAssetSha256: plan.sourceAssetSha256, template: 'biped-relaxed' as const,
  };
  const duplicate = { ...plan, anchors: [...plan.anchors, { ...plan.anchors[0]!, landmarkId: 'head-2' }] };
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, duplicate, target, signal()), /plan-anchor/);
  const unknown = { ...plan, anchors: [{ ...plan.anchors[0]!, jointName: 'TailTip' }] };
  await assert.rejects(prepareDraftRigWithConfirmedLandmarks(bytes, unknown, target, signal()), /anchor-joint/);
  assert.equal(await sha256DraftRigSource(bytes), plan.sourceAssetSha256);
});


test('confirmed head anchors bind into the quadruped template without losing its tail chain', async () => {
  const bytes = new Uint8Array(await writeFigureGLB(draftFigure(true)));
  const plan = {
    ...await planFor(bytes),
    formId: 'animal-form',
    template: 'quadruped' as const,
    anchors: [{
      ...((await planFor(bytes)).anchors[0]!),
      position: [-0.08, 0.92, 0.12] as [number, number, number],
    }],
  };
  const prepared = await prepareDraftRigWithConfirmedLandmarks(bytes, plan, {
    avatarId: 'pakachi', formId: 'animal-form', form: 'animal',
    sourceAssetSha256: plan.sourceAssetSha256, template: 'quadruped',
  }, signal());
  const modelBytes = Uint8Array.from(prepared.bytes);
  const model = await parseModel(modelBytes.buffer as ArrayBuffer);
  try {
    model.scene.updateMatrixWorld(true);
    const head = model.scene.getObjectByName('Draft_Head') as THREE.Bone;
    const tail = model.scene.getObjectByName('Draft_TailTip') as THREE.Bone;
    assert.ok(head instanceof THREE.Bone);
    assert.ok(tail instanceof THREE.Bone);
    const headRootLocal = model.scene.worldToLocal(head.getWorldPosition(new THREE.Vector3()));
    assert.ok(headRootLocal.distanceTo(new THREE.Vector3(...plan.anchors[0]!.position)) < 1e-5);
    assert.equal(prepared.report.template, 'quadruped');
    assert.equal(prepared.report.bones, 23);
    assert.equal(prepared.report.review, 'required');
  } finally {
    disposeModel(model.scene);
  }
});

test('confirmed elbow anchors preserve independent arm deformation after GLB export and reload', async () => {
  const bytes = await source();
  const plan = {
    ...await planFor(bytes),
    anchors: [{
      jointName: 'LeftElbow',
      position: [0.31, 0.58, 0.04] as [number, number, number],
      landmarkId: 'left-elbow',
      partId: 'left-arm',
      meshId: 'left-upper-arm',
      radius: .04,
      origin: 'user' as const,
      policy: 'locked' as const,
    }],
  };
  const prepared = await prepareDraftRigWithConfirmedLandmarks(bytes, plan, {
    avatarId: 'pakachi', formId: 'work-form', form: 'humanoid',
    sourceAssetSha256: plan.sourceAssetSha256, template: 'biped-relaxed',
  }, signal());
  const model = await parseModel(Uint8Array.from(prepared.bytes).buffer as ArrayBuffer);
  const rig = new (await import('../src/studio-rig.ts')).StudioRig(model.scene);
  try {
    const elbow = model.scene.getObjectByName('Draft_LeftElbow') as THREE.Bone;
    assert.ok(elbow instanceof THREE.Bone);
    model.scene.updateMatrixWorld(true);
    const elbowPosition = model.scene.worldToLocal(elbow.getWorldPosition(new THREE.Vector3()));
    assert.ok(elbowPosition.distanceTo(new THREE.Vector3(...plan.anchors[0]!.position)) < 1e-5);

    const leftHand = model.scene.getObjectByName('LeftHand') as THREE.SkinnedMesh;
    const rightHand = model.scene.getObjectByName('RightHand') as THREE.SkinnedMesh;
    assert.ok(leftHand instanceof THREE.SkinnedMesh);
    assert.ok(rightHand instanceof THREE.SkinnedMesh);
    const snapshot = (mesh: THREE.SkinnedMesh) => {
      model.scene.updateMatrixWorld(true);
      return Array.from({ length: mesh.geometry.getAttribute('position').count }, (_, i) =>
        mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
    };
    const beforeLeft = snapshot(leftHand);
    const beforeRight = snapshot(rightHand);
    const values = rig.capture();
    const elbowPoint = rig.data.points.find(point => point.name === 'Draft_LeftElbow');
    assert.ok(elbowPoint);
    values[elbowPoint.id]!.rotation = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 0, 1), .65).toArray();
    rig.apply(values);
    const afterLeft = snapshot(leftHand);
    const afterRight = snapshot(rightHand);
    const maxDelta = (before: THREE.Vector3[], after: THREE.Vector3[]) =>
      Math.max(...before.map((point, i) => point.distanceTo(after[i]!)));
    assert.ok(maxDelta(beforeLeft, afterLeft) > .02, 'left hand must follow its anchored elbow');
    assert.ok(maxDelta(beforeRight, afterRight) < .005, 'right hand must remain independent');
    assert.ok(prepared.report.probes?.length === 4);
    assert.equal(prepared.report.review, 'required');
  } finally {
    rig.dispose();
    disposeModel(model.scene);
  }
});

test('confirmed quadruped tail anchors retain tail deformation independently from the torso after GLB reload', async () => {
  const bytes = new Uint8Array(await writeFigureGLB(draftFigure(true)));
  const base = await planFor(bytes);
  const plan = {
    ...base,
    formId: 'animal-form',
    template: 'quadruped' as const,
    anchors: [{
      ...base.anchors[0]!,
      jointName: 'TailTip',
      position: [0, 0.72, -0.49] as [number, number, number],
      landmarkId: 'tail-tip',
      partId: 'tail',
      meshId: 'tail-mesh',
    }],
  };
  const prepared = await prepareDraftRigWithConfirmedLandmarks(bytes, plan, {
    avatarId: 'pakachi', formId: 'animal-form', form: 'animal',
    sourceAssetSha256: plan.sourceAssetSha256, template: 'quadruped',
  }, signal());
  const model = await parseModel(Uint8Array.from(prepared.bytes).buffer as ArrayBuffer);
  const rig = new (await import('../src/studio-rig.ts')).StudioRig(model.scene);
  try {
    const tailTip = model.scene.getObjectByName('Draft_TailTip') as THREE.Bone;
    const tailBase = model.scene.getObjectByName('Draft_TailBase') as THREE.Bone;
    const skinnedMeshes: THREE.SkinnedMesh[] = [];\n    model.scene.traverse(node => { if (node instanceof THREE.SkinnedMesh) skinnedMeshes.push(node); });\n    // GLTFLoader may normalize display names; the fixture's sphere is the only high-resolution mesh.\n    const tail = skinnedMeshes.find(mesh => mesh.geometry.getAttribute('position').count > 200);
    const body = model.scene.getObjectByName('Body') as THREE.SkinnedMesh;
    assert.ok(tailTip instanceof THREE.Bone);
    assert.ok(tailBase instanceof THREE.Bone);
    assert.ok(tail instanceof THREE.SkinnedMesh);
    assert.ok(body instanceof THREE.SkinnedMesh);
    const snapshot = (mesh: THREE.SkinnedMesh) => {
      model.scene.updateMatrixWorld(true);
      return Array.from({ length: mesh.geometry.getAttribute('position').count }, (_, i) =>
        mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
    };
    const beforeTail = snapshot(tail);
    const beforeBody = snapshot(body);
    const point = rig.data.points.find(candidate => candidate.name === 'Draft_TailBase');
    assert.ok(point);
    const pose = rig.capture();
    pose[point.id]!.rotation = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(1, 0, 0), .7).toArray();
    rig.apply(pose);
    const afterTail = snapshot(tail);
    const afterBody = snapshot(body);
    const maxDelta = (before: THREE.Vector3[], after: THREE.Vector3[]) =>
      Math.max(...before.map((value, index) => value.distanceTo(after[index]!)));
    assert.ok(maxDelta(beforeTail, afterTail) > .01, 'tail surface must follow its tail chain');
    assert.ok(maxDelta(beforeBody, afterBody) < .005, 'torso must remain independent from tail motion');
    assert.equal(prepared.report.template, 'quadruped');
    assert.equal(prepared.report.bones, 23);
    assert.equal(prepared.report.review, 'required');
  } finally {
    rig.dispose();
    disposeModel(model.scene);
  }
});
