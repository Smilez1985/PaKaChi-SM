import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('all recovered original files including exactly 72 frames retain their bytes', () => {
  const hashes: Record<string, string> = JSON.parse(readFileSync(new URL('../docs/references/original-sha256.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(hashes).filter(name => /^frames\/\d{3}\.png$/.test(name)).length, 72);
  for (let i = 1; i <= 72; i++) assert.ok(hashes[`frames/${String(i).padStart(3, '0')}.png`]);
  for (const [name, expected] of Object.entries(hashes)) {
    const bytes = readFileSync(new URL(`../public/legacy/pakachi/${name}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, name);
  }
});
