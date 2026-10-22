import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AnimationClip,NumberKeyframeTrack,Object3D} from 'three';
import {Playback} from '../src/playback.ts';
import {AnimationClock} from '../src/animation-clock.ts';
test('one-shot clips return to the base move after elapsed time even at two frames per second',()=>{
 const root=new Object3D(),clips=[new AnimationClip('idle',1,[new NumberKeyframeTrack('.position[x]',[0,1],[0,0])]),new AnimationClip('wave',2,[new NumberKeyframeTrack('.position[x]',[0,2],[0,1])])];
 for(const step of [16,250,500]){const playback=new Playback(root,clips,[{id:'idle',name:'Idle',clip:'idle',loop:true},{id:'wave',name:'Wave',clip:'wave',loop:false}],'idle'),clock=new AnimationClock(0);playback.play('wave');for(let now=step;now<=2100;now+=step)playback.update(clock.tick(now));assert.equal(playback.current?.id,'idle',`frame interval ${step} ms`);playback.dispose();}
});
test('visibility resets exclude background time and invalid timestamps do not poison the clock',()=>{
 const clock=new AnimationClock(1000);assert.equal(clock.tick(1500),.5);clock.reset(60000);assert.equal(clock.tick(60500),.5);assert.equal(clock.tick(NaN),0);assert.equal(clock.tick(59000),0);assert.equal(clock.tick(61000),.5);clock.reset(Infinity);assert.equal(clock.tick(62000),1);
});
