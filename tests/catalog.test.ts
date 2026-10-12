import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { availableMoves, importedAvatar, parseCatalog } from '../src/catalog.ts';

const data = JSON.parse(readFileSync(new URL('../public/model-zoo/catalog.json', import.meta.url), 'utf8'));
test('each catalog capability has a real clip and a skinned model', () => {
  for (const avatar of parseCatalog(data)) {
    const gltf = JSON.parse(readFileSync(new URL(`../public/${avatar.model}`, import.meta.url), 'utf8'));
    assert.ok(gltf.skins.length > 0);
    assert.equal(availableMoves(avatar, gltf.animations.map((a: { name: string }) => a.name)).length, avatar.moves.length);
    assert.ok(gltf.buffers.every((b: { uri: string }) => b.uri.startsWith('data:')));
  }
});
test('catalog rejects duplicate IDs, external paths and unknown schema', () => {
  assert.throws(() => parseCatalog({ ...data, avatars: [data.avatars[0], data.avatars[0]] }));
  assert.throws(() => parseCatalog({ ...data, avatars: [{ ...data.avatars[0], model: 'https://example.com/model.glb' }] }));
  assert.throws(() => parseCatalog({ ...data, schemaVersion: 999 }));
});
test('missing clips are never advertised', () => {
  assert.equal(availableMoves(parseCatalog(data)[0], []).length, 0);
  assert.deepEqual(availableMoves(parseCatalog(data)[0], ['nicken']).map(m => m.id), ['nicken']);
});
test('import IDs are distinct and static models have no invented moves', () => {
  assert.deepEqual(importedAvatar('static.glb', []).moves, []);
  assert.equal(new Set(importedAvatar('a.glb', ['wave', 'wave']).moves.map(m => m.id)).size, 2);
});
