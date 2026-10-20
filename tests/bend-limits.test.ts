import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {parseProject} from '../src/studio-data.ts';
import {parseStudioCommand} from '../src/studio-command.ts';
import {exportMoveFile,importMoveFile} from '../src/move-file.ts';
import {flagAffectedPoses} from '../src/studio-review.ts';
function fixture(){const root=new T.Group(),body=new T.Bone(),anchor=new T.Bone(),middle=new T.Bone(),end=new T.Bone();root.add(body);body.add(anchor,new T.Bone());anchor.add(middle);middle.add(end);middle.position.x=1;end.position.x=1;const rig=new StudioRig(root),point=(bone:T.Bone)=>rig.data.points.find(p=>rig.bones[p.bone!]===bone)!;return {root,rig,anchor,middle,end,mid:point(middle),tip:point(end)};}
function flexion(f:ReturnType<typeof fixture>){const a=f.anchor.getWorldPosition(new T.Vector3()),b=f.middle.getWorldPosition(new T.Vector3()),c=f.end.getWorldPosition(new T.Vector3());return T.MathUtils.radToDeg(b.clone().sub(a).angleTo(c.sub(b)));}
function project(rig:StudioRig){return {format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]},studio:rig.data};}
test('two-segment IK clamps near/far targets to flexion range without changing anchor or bone offsets',()=>{
 const f=fixture();f.mid.bendLimit={min:30,max:100};const anchor=f.anchor.getWorldPosition(new T.Vector3());
 for(const [distance,expected] of [[4,30],[0,100],[1,100],[Math.sqrt(2),90]]){f.rig.setPoint(f.tip,new T.Vector3(distance,0,0),new T.Quaternion(),false,'translate');assert.ok(Math.abs(flexion(f)-expected)<1e-5);assert.ok(f.anchor.getWorldPosition(new T.Vector3()).distanceTo(anchor)<1e-8);assert.equal(f.middle.position.x,1);assert.equal(f.end.position.x,1);}
 f.mid.bendLimit={min:0,max:0};f.rig.setPoint(f.tip,new T.Vector3(1,0,0),new T.Quaternion(),false,'translate');assert.ok(flexion(f)<1e-5,`straight flexion: ${flexion(f)}`);
});
test('limits survive figure rotation and scale; removing limit restores reachable targets',()=>{
 const f=fixture();f.mid.bendLimit={min:30,max:100};f.rig.setFigureTransform(new T.Vector3(.3,.2,.1),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.7),2);const a=f.anchor.getWorldPosition(new T.Vector3());f.rig.setPoint(f.tip,a.clone().add(new T.Vector3(10,0,0)),new T.Quaternion(),false,'translate');assert.ok(Math.abs(flexion(f)-30)<1e-5);
 delete f.mid.bendLimit;f.rig.reset();const target=new T.Vector3(.1,0,0);f.rig.setPoint(f.tip,target,new T.Quaternion(),false,'translate');assert.ok(f.rig.position(f.tip).distanceTo(target)<1e-5);
});
test('project validation and MCP commands reject malformed limits; move binding detects changed limits',async()=>{
 const f=fixture();f.mid.bendLimit={min:10,max:100};f.rig.data.poses=[{id:'a',name:'A',seconds:1,values:f.rig.capture()}];f.rig.data.moves=[{id:'wave',name:'Wave',loop:true,poses:['a','a']}];const source=project(f.rig),file=await exportMoveFile(source,'wave');assert.deepEqual(parseProject(source).studio.points.find(p=>p.id===f.mid.id)!.bendLimit,f.mid.bendLimit);
 f.mid.bendLimit.max=120;await assert.rejects(()=>importMoveFile(file,source),/passt nicht/);
 for(const value of [{min:-1,max:100},{min:50,max:20},{min:0,max:180},{min:NaN,max:90},{min:0,max:90,other:1}]){const copy=structuredClone(source);copy.studio.points[0].bendLimit=value;assert.throws(()=>parseProject(copy));assert.throws(()=>parseStudioCommand({session:'s',expectedRevision:0,action:'update_point',id:f.mid.id,bendLimit:value}));}
 assert.equal(parseStudioCommand({session:'s',expectedRevision:0,action:'update_point',id:f.mid.id,bendLimit:null}).bendLimit,null);
});
test('changing or removing flexion limits flags stored poses without altering motion',()=>{
 const f=fixture();f.rig.data.poses=[{id:'a',name:'A',seconds:1,values:f.rig.capture()}];const before=structuredClone(f.rig.data);f.mid.bendLimit={min:0,max:100};flagAffectedPoses(before,f.rig.data);assert.deepEqual(f.rig.data.poses[0].review,['bend-limit']);assert.deepEqual(f.rig.data.poses[0].values,before.poses[0].values);
 const changed=structuredClone(f.rig.data);delete f.mid.bendLimit;delete f.rig.data.poses[0].review;flagAffectedPoses(changed,f.rig.data);assert.deepEqual(f.rig.data.poses[0].review,['bend-limit']);
});
test('mouse controls and permitted MCP changes are undoable; pose mode rejects limit edits',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});const f=fixture(),host=document.createElement('div');const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
 const editor=new StudioEditor(f.rig,view as unknown as StudioView,host,project(f.rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();host.querySelector<HTMLButtonElement>('#mode-rig')!.click();const select=host.querySelector<HTMLSelectElement>('#studio-points')!;select.value=f.mid.id;select.dispatchEvent(new w.Event('change') as unknown as Event);
 const enabled=host.querySelector<HTMLInputElement>('#bend-enabled')!;enabled.checked=true;enabled.dispatchEvent(new w.Event('change') as unknown as Event);const max=host.querySelector<HTMLInputElement>('#bend-max')!;max.value='110';max.dispatchEvent(new w.Event('change') as unknown as Event);assert.equal(f.rig.data.points.find(p=>p.id===f.mid.id)!.bendLimit!.max,110);host.querySelector<HTMLButtonElement>('#studio-undo')!.click();assert.equal(f.rig.data.points.find(p=>p.id===f.mid.id)!.bendLimit!.max,175);host.querySelector<HTMLButtonElement>('#studio-redo')!.click();
 const grant=host.querySelector<HTMLInputElement>('#studio-agent-edit')!;grant.checked=true;grant.dispatchEvent(new w.Event('change') as unknown as Event);const command=(extra:object)=>({session:editor.session,expectedRevision:editor.inspect().revision,...extra});editor.execute(command({action:'update_point',id:f.mid.id,bendLimit:null}));assert.equal(f.rig.data.points.find(p=>p.id===f.mid.id)!.bendLimit,undefined);editor.execute(command({action:'set_mode',mode:'pose'}));assert.throws(()=>editor.execute(command({action:'update_point',id:f.mid.id,bendLimit:{min:0,max:90}})));editor.dispose();w.happyDOM.abort();
});

test('Mika and Nori elbows and knees respect configured limits while their skinned vertices follow',async()=>{
 const {readFileSync}=await import('node:fs'),{parseModel,disposeModel}=await import('../src/viewer.ts');if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{constructor(type:string,init:Record<string,unknown>={}){super(type);Object.assign(this,init);}}});
 for(const avatar of ['mika','nori']){const bytes=readFileSync(new URL(`../public/model-zoo/${avatar}/model.gltf`,import.meta.url)),{scene}=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(scene);const p=(name:string)=>rig.data.points.find(p=>p.name===name)!;
  for(const [anchorName,midName,tipName] of [['LeftShoulder','LeftElbow','LeftHand'],['RightHip','RightKnee','RightFoot']]){rig.reset();const a=p(anchorName),b=p(midName),c=p(tipName);b.bendLimit={min:20,max:90};const mesh=rig.surfaces[0].mesh,vertices=()=>Array.from({length:mesh.geometry.getAttribute('position').count},(_,i)=>mesh.getVertexPosition(i,new T.Vector3()));const before=vertices();rig.setPoint(c,rig.position(a),rig.rotation(c),false,'translate');const angle=T.MathUtils.radToDeg(rig.position(b).sub(rig.position(a)).angleTo(rig.position(c).sub(rig.position(b))));assert.ok(Math.abs(angle-90)<1e-4);assert.ok(vertices().some((v,i)=>v.distanceTo(before[i])>.001));}
  rig.restoreSource();disposeModel(scene);
 }
});
