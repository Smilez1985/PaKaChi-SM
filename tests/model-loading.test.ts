import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationMixer, SkinnedMesh } from 'three';
import { parseModel, disposeModel } from '../src/viewer.ts';

// Node's fetch works with embedded glTF buffers; only this browser progress event is missing.
if (typeof globalThis.ProgressEvent === 'undefined') {
  Object.defineProperty(globalThis, 'ProgressEvent', { value: class extends Event {
    constructor(type: string, init: Record<string, unknown> = {}) { super(type); Object.assign(this, init); }
  } });
}
test('bundled glTF files load through the production loader and animate real bones', async () => {
  for (const id of ['mika', 'nori']) {
    const bytes = readFileSync(new URL(`../public/model-zoo/${id}/model.gltf`, import.meta.url));
    const gltf = await parseModel(Uint8Array.from(bytes).buffer);
    const meshes: SkinnedMesh[] = [];
    gltf.scene.traverse(node => { if (node instanceof SkinnedMesh) meshes.push(node); });
    assert.ok(meshes.length > 0); assert.equal(gltf.animations.length, 3);
    const head = gltf.scene.getObjectByName('Head'); assert.ok(head);
    const before = head.quaternion.clone();
    const mixer = new AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations.find(c => c.name === 'nicken')!).play(); mixer.update(.3);
    assert.ok(head.quaternion.angleTo(before) > .1);
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene); disposeModel(gltf.scene);
  }
});
