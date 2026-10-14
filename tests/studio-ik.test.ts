import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import {StudioView} from '../src/studio-view.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {parseProject} from '../src/studio-data.ts';
if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{constructor(type:string,init:Record<string,unknown>={}){super(type);Object.assign(this,init);}}});

test('panda hand targets bend the arm, preserve lengths and shoulder, and never detach beyond reach',async()=>{
 const bytes=readFileSync(new URL('../public/model-zoo/mika/model.gltf',import.meta.url));const {scene}=await parseModel(Uint8Array.from(bytes).buffer);const rig=new StudioRig(scene);
 const hand=rig.data.points.find(p=>p.name==='LeftHand')!,elbow=rig.data.points.find(p=>p.name==='LeftElbow')!,shoulder=rig.data.points.find(p=>p.name==='LeftShoulder')!;
 assert.ok(hand);assert.equal(rig.poseChain(hand).length,2);const initial=rig.capture(),anchor=rig.position(shoulder),l1=anchor.distanceTo(rig.position(elbow)),l2=rig.position(elbow).distanceTo(rig.position(hand));
 const mesh=rig.surfaces[0].mesh,vertices=()=>Array.from({length:mesh.geometry.getAttribute('position').count},(_,i)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));const before=vertices();
 for(const offset of [new T.Vector3(.15,.4,.1),new T.Vector3(0,5,0),new T.Vector3(0,0,0),new T.Vector3(0,-.3,.1)]){
  const target=anchor.clone().add(offset);rig.setPoint(hand,target,rig.rotation(hand),false,'translate');
  assert.ok(rig.position(shoulder).distanceTo(anchor)<1e-8);assert.ok(Math.abs(rig.position(shoulder).distanceTo(rig.position(elbow))-l1)<1e-6);assert.ok(Math.abs(rig.position(elbow).distanceTo(rig.position(hand))-l2)<1e-6);
  for(const p of rig.data.points)assert.deepEqual(rig.capture()[p.id].position,initial[p.id].position,'local bone offsets never change');
  if(offset.length()<l1+l2&&offset.length()>Math.abs(l1-l2))assert.ok(rig.position(hand).distanceTo(target)<1e-5);
 }
 assert.ok(vertices().some((v,i)=>v.distanceTo(before[i])>.05),'actual skinned surface follows joints');
 const pose=rig.capture();rig.data.poses=[{id:'a',name:'A',seconds:1,values:initial},{id:'b',name:'B',seconds:1,values:pose}];rig.data.moves=[{id:'reach',name:'Reach',loop:false,poses:['a','b']}];
 const project=parseProject({format:'pakachi-studio',version:1,model:bytes.toString('base64'),avatar:{id:'mika',name:'Mika',description:'',moves:[]},studio:rig.data});rig.data=project.studio;
 rig.apply(rig.sample(rig.data.moves[0],.5));assert.ok(Math.abs(rig.position(elbow).distanceTo(rig.position(hand))-l2)<1e-6);
 rig.reset();const locked=rig.position(hand);rig.data.links=rig.data.links.filter(l=>!l.includes(hand.id));rig.setPoint(hand,locked.clone().addScalar(5),rig.rotation(hand),false,'translate');assert.ok(rig.position(hand).distanceTo(locked)<1e-8,'removing a link disables IK, never detaches skin');rig.restoreSource();disposeModel(scene);
});

test('straight limbs fold towards nearby targets; joint rotation and scaled figure retain attachment',()=>{
 const root=new T.Group(),body=new T.Bone(),shoulder=new T.Bone(),elbow=new T.Bone(),hand=new T.Bone();root.add(body);body.add(shoulder,new T.Bone());shoulder.add(elbow);elbow.add(hand);elbow.position.x=1;hand.position.x=1;
 const rig=new StudioRig(root),point=rig.data.points.find(p=>rig.bones[p.bone!]===hand)!;
 rig.setPoint(point,new T.Vector3(1,0,0),new T.Quaternion(),false,'translate');assert.ok(rig.position(point).distanceTo(new T.Vector3(1,0,0))<1e-5,'straight-chain singularity folds');
 const fixed=rig.position(point);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),1);rig.setPoint(point,new T.Vector3(8,8,8),q,false,'rotate');assert.ok(rig.position(point).distanceTo(fixed)<1e-8);assert.ok(rig.rotation(point).angleTo(q)<1e-6);
 rig.reset();rig.setFigureTransform(new T.Vector3(.2,.3,.4),q,2);const anchor=shoulder.getWorldPosition(new T.Vector3()),target=anchor.clone().add(new T.Vector3(1,1,1));rig.setPoint(point,target,rig.rotation(point),false,'translate');assert.ok(rig.position(point).distanceTo(target)<1e-5);assert.equal(elbow.position.x,1);assert.equal(hand.position.x,1);
});

test('real mouse point gestures bend then orient the arm and undo as complete gestures',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const root=new T.Group(),body=new T.Bone(),shoulder=new T.Bone(),elbow=new T.Bone(),hand=new T.Bone();root.add(body);body.add(shoulder,new T.Bone());shoulder.add(elbow);elbow.add(hand);elbow.position.x=1;hand.position.x=1;const rig=new StudioRig(root);
 const canvas=document.createElement('canvas');canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:400} as DOMRect);canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
 const camera=new T.PerspectiveCamera(45,1,.1,100);camera.position.set(0,0,8);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);const scene=new T.Scene();scene.add(root);
 const view=new StudioView(rig,camera,canvas,{enabled:true,target:new T.Vector3()},scene),host=document.createElement('div');const editor=new StudioEditor(rig,view,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();
 const screen=(v:T.Vector3)=>{const p=v.clone().project(camera);return {x:(p.x+1)*200,y:(1-p.y)*200};};
 const pointer=(type:string,p:{x:number;y:number})=>canvas.dispatchEvent(new w.PointerEvent(type,{button:0,pointerId:7,clientX:p.x,clientY:p.y,bubbles:true,cancelable:true}) as unknown as Event);
 const point=rig.data.points.find(p=>rig.bones[p.bone!]===hand)!,first=rig.capture(),target=new T.Vector3(1,1,0);pointer('pointerdown',screen(rig.position(point)));pointer('pointermove',screen(target));pointer('pointerup',screen(target));assert.ok(rig.position(point).distanceTo(target)<1e-5);
 host.querySelector<HTMLButtonElement>('#studio-undo')!.click();assert.deepEqual(rig.capture(),first);host.querySelector<HTMLButtonElement>('#studio-redo')!.click();assert.ok(rig.position(point).distanceTo(target)<1e-5);
 const select=host.querySelector<HTMLSelectElement>('#point-transform')!;select.value='rotate';select.dispatchEvent(new w.Event('change') as unknown as Event);const position=rig.position(point),rotation=rig.rotation(point),start=screen(position),end={x:start.x+50,y:start.y+25};pointer('pointerdown',start);pointer('pointermove',end);pointer('pointerup',end);assert.ok(rig.rotation(point).angleTo(rotation)>.3);assert.ok(rig.position(point).distanceTo(position)<1e-8);editor.dispose();w.happyDOM.abort();
});

test('automatic detection covers torso, both limbs and head; feet bend legs and torso carries the whole body',async()=>{
 const {detectConnections}=await import('../src/studio-detection.ts');
 for(const avatar of ['mika','nori']){
  const bytes=readFileSync(new URL(`../public/model-zoo/${avatar}/model.gltf`,import.meta.url)),{scene}=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(scene);
  assert.equal(rig.data.links.length,rig.bones.length-1,'entire tree visible by default');rig.data.links=[];rig.data.links=detectConnections(rig);assert.equal(rig.data.links.length,rig.bones.length-1);
  const p=(name:string)=>rig.data.points.find(p=>p.name===name)!;
  for(const side of ['Left','Right']){
   rig.reset();const foot=p(side+'Foot'),knee=p(side+'Knee'),hip=p(side+'Hip');assert.equal(rig.poseChain(foot).length,2);
   const anchor=rig.position(hip),upper=anchor.distanceTo(rig.position(knee)),lower=rig.position(knee).distanceTo(rig.position(foot)),target=anchor.clone().add(new T.Vector3(.15,-.25,.15));
   rig.setPoint(foot,target,rig.rotation(foot),false,'translate');assert.ok(rig.position(foot).distanceTo(target)<1e-5);assert.ok(rig.position(hip).distanceTo(anchor)<1e-8);assert.ok(Math.abs(rig.position(knee).distanceTo(rig.position(foot))-lower)<1e-6);assert.ok(Math.abs(rig.position(hip).distanceTo(rig.position(knee))-upper)<1e-6);
  }
  rig.reset();const head=p('Head'),neck=p('Neck'),neckPos=rig.position(neck),headLength=neckPos.distanceTo(rig.position(head));rig.setPoint(head,neckPos.clone().add(new T.Vector3(.1,.1,0)),rig.rotation(head),false,'translate');assert.ok(Math.abs(rig.position(head).distanceTo(neckPos)-headLength)<1e-6);assert.ok(rig.position(neck).distanceTo(neckPos)<1e-8);
  const positions=rig.data.points.map(p=>rig.position(p)),offset=new T.Vector3(.3,.2,.1),torso=p('Root');rig.setPoint(torso,rig.position(torso).add(offset),rig.rotation(torso),false,'translate');for(const [i,p] of rig.data.points.entries())assert.ok(rig.position(p).distanceTo(positions[i].clone().add(offset))<1e-6,'torso carries every joint');
  assert.throws(()=>rig.validateConnection(p('LeftHand'),p('RightFoot')),/benachbarte/);rig.restoreSource();disposeModel(scene);
 }
});
