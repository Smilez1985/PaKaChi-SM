import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AnimationClip, Group, NumberKeyframeTrack } from 'three';
import { Playback } from '../src/playback.ts';

function player(withDefault = true) {
  const root = new Group(); root.name = 'Root';
  const clips = ['idle', 'wave'].map(name => new AnimationClip(name, 1, [new NumberKeyframeTrack('Root.position[x]', [0, 1], [0, 1])]));
  return new Playback(root, clips, [{ id: 'idle', name: 'Idle', clip: 'idle', loop: true },
    { id: 'wave', name: 'Wave', clip: 'wave', loop: false }], withDefault ? 'idle' : undefined);
}
test('one-shot returns to default; repeating default stays active', () => {
  const p = player(); p.play('wave'); p.update(1.1); assert.equal(p.current?.id, 'idle');
  p.update(3); assert.equal(p.current?.id, 'idle'); assert.equal(p.paused, false); p.dispose();
});
test('pause, seek, speed and invalid command preserve a valid action', () => {
  const p = player(); p.play('idle'); p.togglePause(); p.update(.4); assert.equal(p.progress, 0);
  p.seek(.5); assert.equal(p.progress, .5); p.togglePause(); p.setSpeed(2); p.update(.1);
  assert.ok(Math.abs(p.progress - .7) < 1e-6); assert.equal(p.play('missing'), false); assert.equal(p.current?.id, 'idle');
  p.setSpeed(NaN); p.seek(NaN); assert.ok(Number.isFinite(p.progress)); p.dispose();
});
test('imported one-shot holds its final pose and can replay', () => {
  const p = player(false); p.play('wave'); p.update(1.1); assert.equal(p.paused, true); assert.equal(p.progress, 1);
  p.togglePause(); assert.equal(p.paused, false); assert.equal(p.progress, 0); p.dispose();
});
