import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {PlaybackTransition,playbackTransitionDelta} from '../src/playback-transition.ts';
import {Playback} from '../src/playback.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('display fade interpolates transforms and morphs, restores exact target and freezes with zero delta',()=>{
 const root=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());root.add(mesh);mesh.morphTargetInfluences=[0];
 const fade=new PlaybackTransition(root);fade.begin();root.position.x=4;root.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2);root.scale.setScalar(2);root.updateMatrix();root.matrixAutoUpdate=false;mesh.morphTargetInfluences[0]=1;const matrix=root.matrix.clone();
 fade.afterFrame(.09);near(root.position.x,2);near(root.scale.x,1.5);near(mesh.morphTargetInfluences[0],.5);near(root.quaternion.angleTo(new T.Quaternion()),Math.PI/4);
 fade.beforeFrame();assert.deepEqual(root.matrix.elements,matrix.elements);assert.equal(root.matrixAutoUpdate,false);near(mesh.morphTargetInfluences[0],1);
 fade.afterFrame(0);near(root.position.x,2);fade.afterFrame(0);near(root.position.x,2);fade.beforeFrame();fade.afterFrame(.09);near(root.position.x,4);assert.equal(fade.active,false);
 fade.begin();root.position.x=8;root.updateMatrix();fade.afterFrame(.09);near(root.position.x,6);fade.begin();root.position.x=10;root.updateMatrix();fade.afterFrame(0);near(root.position.x,6);fade.cancel();near(root.position.x,10);
 mesh.geometry.dispose();(mesh.material as T.Material).dispose();
});
test('changed hierarchy and sheared transforms bypass display blending',()=>{
 const root=new T.Group(),fade=new PlaybackTransition(root);fade.begin();root.add(new T.Group());root.position.x=4;fade.afterFrame(.05);assert.equal(fade.active,false);near(root.position.x,4);
 root.matrixAutoUpdate=false;root.matrix.elements[4]=.5;fade.begin();assert.equal(fade.active,false);
});
test('original and studio playback blend both ways without changing project data, including automatic return',t=>{
 const window=new Window();Object.assign(globalThis,{document:window.document,Option:function(text="",value=""){const option=window.document.createElement("option");option.text=text;option.value=value;return option;}});
 const root=new T.Group();root.name='Model';const bone=new T.Bone();bone.name='Joint';root.add(bone);const geometry=new T.BoxGeometry(),count=geometry.getAttribute('position').count;geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(count*4),4));const weights=new Float32Array(count*4);for(let i=0;i<count;i++)weights[i*4]=1;geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));const skin=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(skin);root.updateMatrixWorld(true);skin.bind(new T.Skeleton([bone]));
 const rig=new StudioRig(root),point=rig.data.points[0],a=rig.capture(),b=rig.capture();a[point.id].position=[0,4,0];b[point.id].position=[0,6,0];
 rig.data.poses=[{id:'a',name:'A',seconds:.5,values:a},{id:'b',name:'B',seconds:.5,values:b}];rig.data.moves=[{id:'own',name:'Own',loop:false,poses:['a','b']}];
 const clip=new T.AnimationClip('idle',1,[new T.NumberKeyframeTrack('Joint.position[y]',[0,1],[2,2]),new T.NumberKeyframeTrack('Model.position[x]',[0,1],[3,3])]);
 const playback=new Playback(root,[clip],[{id:'idle',name:'Idle',clip:'idle',loop:true}],'idle');
 const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}} as unknown as StudioView;
 const editor=new StudioEditor(rig,view,window.document.createElement('div') as unknown as HTMLElement,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]}},{suspend:()=>playback.suspend(),resume:()=>{playback.setBaseMove('idle');},changed(){},feedback(){}});
 t.after(()=>{editor.dispose();playback.dispose();window.happyDOM.abort();});
 const frame=(delta:number)=>{editor.playbackTransition.beforeFrame();if(editor.playing)editor.update(delta);else playback.update(delta);editor.playbackTransition.afterFrame(playbackTransitionDelta(editor.playing?editor:playback,delta));};
 const data=structuredClone(editor.data);rig.restoreSource();playback.play('idle');playback.update(.1);near(bone.position.y,2);near(root.position.x,3);
 root.updateMatrixWorld(true);const originalVertex=skin.localToWorld(skin.getVertexPosition(0,new T.Vector3()));
 assert.equal(editor.play('own'),true);assert.ok(skin.localToWorld(skin.getVertexPosition(0,new T.Vector3())).distanceTo(originalVertex)<1e-6);near(bone.position.y,2);near(root.position.x,3);frame(.09);assert.ok(bone.position.y>2&&bone.position.y<4.5);near(root.position.x,1.5);
 editor.togglePause();const paused=bone.position.y;frame(.1);near(bone.position.y,paused);editor.togglePause();frame(.09);assert.equal(editor.playbackTransition.active,false);near(root.position.x,0);
 editor.seek(.5);assert.equal(editor.playbackTransition.active,false);const from=bone.position.y;
 editor.beginPlaybackTransition();editor.stopMove();rig.restoreSource();playback.setBaseMove('idle');editor.playbackTransition.afterFrame(0);near(bone.position.y,from);frame(.09);near(bone.position.y,(from+2)/2);frame(.09);near(bone.position.y,2);near(root.position.x,3);
 editor.play('own');frame(.2);frame(.4);assert.equal(editor.playing,false);assert.equal(playback.current?.id,'idle');frame(.2);near(bone.position.y,2);assert.deepEqual(editor.data,data);assert.equal(editor.dirty,false);
 editor.play('own');editor.enter();assert.equal(editor.playbackTransition.active,false);
 editor.leave();editor.data.points.push({id:'surface',name:'Surface',kind:'surface',rest:[0,0,0],size:.01,radius:.1});editor.beginPlaybackTransition();assert.equal(editor.playbackTransition.active,false);editor.data.points.pop();
 editor.data.boneRest[0].position[0]+=1;editor.beginPlaybackTransition();assert.equal(editor.playbackTransition.active,false);
});

test('short one-shot completes its display fade while manual pause freezes and replay clears completion',()=>{
 const root=new T.Group();root.name='Model';root.position.x=10;
 const clip=new T.AnimationClip('short',.05,[new T.NumberKeyframeTrack('Model.position[x]',[0,.05],[0,2])]);
 const player=new Playback(root,[clip],[{id:'short',name:'Short',clip:'short',loop:false}]);
 const fade=new PlaybackTransition(root);fade.begin();player.play('short');fade.afterFrame(0);near(root.position.x,10);
 const frame=(delta:number)=>{fade.beforeFrame();player.update(delta);fade.afterFrame(playbackTransitionDelta(player,delta));};
 player.togglePause();frame(.1);near(root.position.x,10);assert.equal(player.finished,false);player.togglePause();
 frame(.06);assert.equal(player.finished,true);assert.equal(player.paused,true);assert.equal(fade.active,true);assert.ok(root.position.x>2);
 frame(.12);near(root.position.x,2);assert.equal(fade.active,false);assert.equal(player.finished,true);
 player.togglePause();assert.equal(player.finished,false);assert.equal(player.paused,false);frame(.06);assert.equal(player.finished,true);
 player.seek(.5);assert.equal(player.finished,false);assert.equal(playbackTransitionDelta(player,.1),0);player.dispose();
});
test('missing base clip, speed and invalid frame times have explicit transition timing',()=>{
 const root=new T.Group(),fade=new PlaybackTransition(root);root.position.x=4;fade.begin();root.position.x=0;
 const idle={current:null,paused:true,speed:2};fade.afterFrame(playbackTransitionDelta(idle,.045));near(root.position.x,2);
 fade.beforeFrame();fade.afterFrame(playbackTransitionDelta(idle,.045));near(root.position.x,0);assert.equal(fade.active,false);
 for(const delta of [NaN,Infinity,-1,0])assert.equal(playbackTransitionDelta(idle,delta),0);
 assert.equal(playbackTransitionDelta({current:{},paused:true,speed:2},.1),0);
 assert.equal(playbackTransitionDelta({current:{},paused:false,speed:NaN},.1),0);
});
