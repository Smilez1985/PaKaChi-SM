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

test('short original one-shot finishes crossfade after its final frame without advancing the held clip',()=>{
 const root=new Group();root.name='Root';
 const clips=[new AnimationClip('idle',1,[new NumberKeyframeTrack('Root.position[x]',[0,1],[10,10])]),new AnimationClip('short',.05,[new NumberKeyframeTrack('Root.position[x]',[0,.05],[0,2])])];
 const p=new Playback(root,clips,[{id:'idle',name:'Idle',clip:'idle',loop:true},{id:'short',name:'Short',clip:'short',loop:false}]);
 try{
  p.play('idle');p.update(.1);p.play('short');p.update(.06);assert.equal(p.finished,true);assert.equal(p.paused,true);assert.ok(root.position.x>2);
  p.update(.2);assert.ok(Math.abs(root.position.x-2)<1e-6);assert.equal(p.progress,1);p.update(1);assert.ok(Math.abs(root.position.x-2)<1e-6);
  p.togglePause();assert.equal(p.finished,false);assert.equal(p.paused,false);assert.equal(p.progress,0);
 }finally{p.dispose();}
});
test('manual pause freezes original crossfade and seeking removes previous clip influence',()=>{
 const root=new Group();root.name='Root';
 const clips=[new AnimationClip('idle',1,[new NumberKeyframeTrack('Root.position[x]',[0,1],[10,10])]),new AnimationClip('target',1,[new NumberKeyframeTrack('Root.position[x]',[0,1],[0,4])])];
 const p=new Playback(root,clips,[{id:'idle',name:'Idle',clip:'idle',loop:true},{id:'target',name:'Target',clip:'target',loop:false}]);
 try{
  p.play('idle');p.update(.1);p.play('target');p.update(.04);p.togglePause();const paused=root.position.x;p.update(1);assert.equal(root.position.x,paused);
  p.seek(.5);assert.ok(Math.abs(root.position.x-2)<1e-6);assert.equal(p.paused,true);p.update(1);assert.ok(Math.abs(root.position.x-2)<1e-6);
  p.togglePause();p.update(.1);assert.ok(Math.abs(root.position.x-2.4)<1e-6);
 }finally{p.dispose();}
});
