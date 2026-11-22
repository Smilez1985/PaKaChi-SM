import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { mountClusterFormComparison } from '../src/cluster-form-comparison-panel.ts';
import { createPaKaChiSemanticCatalog } from '../src/cluster-2d-classifier.ts';
import type { ClusterManifest } from '../src/cluster-architecture.ts';

function manifest(form: 'animal' | 'humanoid', meshId: string): ClusterManifest {
  return {
    schemaVersion: 1, form, sourceAssetSha256: (form === 'animal' ? 'a' : 'b').repeat(64),
    algorithmId: 'panel-test', algorithmVersion: '1.0.0', generatedAt: '2026-11-22T00:00:00.000Z',
    revision: 0,
    parts: [{ id: 'body', name: 'Body', parentPartId: null, orderKey: [1], rigBoneIds: [] }],
    layers: [{ id: 'fur', name: 'Fur', partId: null, orderKey: [1] }],
    meshes: [{ id: meshId, sourceMeshIndex: 0, sourceMeshName: 'Body', primitiveIndex: 0, vertexCount: 3, triangleCount: 1 }],
    assignments: [{ meshId, triangleIndex: 0, partId: 'body', surfaceLayerId: 'fur', origin: 'user', policy: 'locked', confidence: 1, reason: 'reviewed' }],
    overrides: [],
  };
}

function installFile(input: HTMLInputElement, value: unknown) {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [{ size: JSON.stringify(value).length, text: async () => JSON.stringify(value) }],
  });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

test('Studio comparison panel validates both form files and renders the shared semantic report', async () => {
  const window = new Window();
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousEvent = Object.getOwnPropertyDescriptor(globalThis, 'Event');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: window.document });
  Object.defineProperty(globalThis, 'Event', { configurable: true, value: window.Event });
  try {
    const host = window.document.createElement('div');
    const catalog = createPaKaChiSemanticCatalog();
    const panel = mountClusterFormComparison(host, () => catalog);
    const inputs = host.querySelectorAll('input');
    installFile(inputs[0], manifest('animal', 'animal-mesh'));
    installFile(inputs[1], manifest('humanoid', 'humanoid-mesh'));
    const button = host.querySelector('button')!;
    assert.equal((button as HTMLButtonElement).disabled, false);
    button.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.match(host.textContent ?? '', /Vergleich erfolgreich/);
    assert.match(host.textContent ?? '', /Anatomische Abdeckung/);
    assert.match(host.textContent ?? '', /Oberflächen-Layer/);
    assert.match(host.textContent ?? '', /animal-mesh/);
    assert.match(host.textContent ?? '', /humanoid-mesh/);
    panel.dispose();
    assert.equal(host.childElementCount, 0);
  } finally {
    window.happyDOM.abort();
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete (globalThis as { document?: Document }).document;
    if (previousEvent) Object.defineProperty(globalThis, 'Event', previousEvent);
    else delete (globalThis as { Event?: typeof Event }).Event;
  }
});

test('Studio comparison panel reports invalid form files without producing a report', async () => {
  const window = new Window();
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousEvent = Object.getOwnPropertyDescriptor(globalThis, 'Event');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: window.document });
  Object.defineProperty(globalThis, 'Event', { configurable: true, value: window.Event });
  try {
    const host = window.document.createElement('div');
    const panel = mountClusterFormComparison(host, () => createPaKaChiSemanticCatalog());
    const inputs = host.querySelectorAll('input');
    installFile(inputs[0], manifest('humanoid', 'wrong-form'));
    installFile(inputs[1], manifest('humanoid', 'humanoid-mesh'));
    host.querySelector('button')!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.match(host.textContent ?? '', /kein Tierform-Manifest/);
    assert.equal(host.querySelector('.form-comparison-report')?.childElementCount, 0);
    panel.dispose();
  } finally {
    window.happyDOM.abort();
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete (globalThis as { document?: Document }).document;
    if (previousEvent) Object.defineProperty(globalThis, 'Event', previousEvent);
    else delete (globalThis as { Event?: typeof Event }).Event;
  }
});
