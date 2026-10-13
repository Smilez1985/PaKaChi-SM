import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, StateMachine } from '../src/control.ts';
import { Playback } from '../src/playback.ts';
import { Group, AnimationClip, NumberKeyframeTrack } from 'three';

test('plain and JSON states, legacy status and moves share validation', () => {
  assert.equal((parseCommand('working') as {state:string}).state,'working');
  assert.equal((parseCommand('{"status":"thinking"}') as {state:string}).state,'thinking');
  for(const invalid of ['{broken', 'nonsense', {state:'idle',move:'wave'}, {state:'idle',extra:true}, {move:'../x'}, 'a'.repeat(2050)]) assert.throws(()=>parseCommand(invalid));
});
test('last valid state wins, repeated state does not restart, invalid command is atomic',()=>{
  const calls:string[]=[]; const sm=new StateMachine();
  sm.bind({capability:{id:'a',name:'A',states:['idle','working'],moves:[{id:'wave',name:'Wave',loop:false}]},setState:s=>calls.push(s),playMove:m=>calls.push(m)},'idle');
  sm.execute({state:'working'}); sm.execute({state:'working'}); assert.deepEqual(calls,['working']);
  sm.execute({move:'wave'}); assert.equal(sm.state,'working');
  for(const bad of [{state:'thinking'},{state:'idle',avatar:'other'},{move:'missing'}]) assert.throws(()=>sm.execute(bad));
  assert.equal(sm.state,'working'); assert.deepEqual(calls,['working','wave']);
  sm.execute('idle'); assert.equal(sm.state,'idle');
  sm.capability!.states.push('error'); assert.throws(()=>sm.execute('error'));
  sm.unbind(); assert.throws(()=>sm.execute('idle'));
});
test('one-shot returns to newly selected persistent state',()=>{
  const root=new Group();root.name='Root';
  const clips=['idle','working','wave'].map(name=>new AnimationClip(name,1,[new NumberKeyframeTrack('Root.position[x]',[0,1],[0,1])]));
  const p=new Playback(root,clips,clips.map(c=>({id:c.name,name:c.name,clip:c.name,loop:c.name!=='wave'})),'idle');
  p.setBaseMove('working');p.play('wave');p.update(1.1);assert.equal(p.current?.id,'working');
  p.play('wave');p.update(.2);p.setBaseMove('idle');p.update(2);assert.equal(p.current?.id,'idle');p.dispose();
});
