import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {searchWeightCorrection,correctionSamples} from '../src/pose-weight-correction.ts';
import {checkPoseSurface,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {twistFixture} from './helpers/twist-fixture.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {parseProject} from '../src/studio-data.ts';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {Window} from 'happy-dom';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';

test('local skin correction preserves the full target rotation, rest and distal vertices and replays exactly',async()=>{
 const f=twistFixture(),data=structuredClone(f.rig.data),live=f.rig.capture(),weights=Array.from(f.mesh.geometry.attributes.skinWeight.array),matrices=f.rig.bones.map(b=>b.matrixWorld.toArray()),before=checkPoseSurface(f.rig,f.pose),targetBefore=poseSurfacePositions(f.rig,f.pose.values,0),restBefore=poseSurfacePositions(f.rig,f.rig.data.poses[1].values,0);
 assert.equal(before.status,'outside');const result=await searchWeightCorrection(f.rig,f.pose,f.joint,1,new AbortController().signal);assert.ok(result);assert.ok(result.after.issues<result.before.issues);assert.equal(result.after.status,'within');assert.ok(result.amount<=.35);assert.equal(result.checkedPoses,2);assert.equal(result.intermediateSamples,3);assert.deepEqual(f.rig.data,data);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(f.rig.bones.map(b=>b.matrixWorld.toArray()),matrices);assert.deepEqual(Array.from(f.mesh.geometry.attributes.skinWeight.array),weights);
 const sourceRoot=clone(f.root),from=f.rig.data.points.find(p=>p.id===result.from)!,to=f.rig.data.points.find(p=>p.id===result.to)!;sourceRoot.traverse(n=>{if(n instanceof T.Mesh)n.geometry=n.geometry.clone();});
 f.rig.transferWeights(from,to,result.amount,result.region);f.rig.apply(f.pose.values);assert.deepEqual(f.rig.capture(),f.pose.values);assert.deepEqual(f.rig.data.poses.map(p=>p.values),data.poses.map(p=>p.values));assert.deepEqual(f.rig.data.moves,data.moves);
 const after=checkPoseSurface(f.rig,f.pose);assert.equal(after.issues,result.after.issues);assert.ok(Math.abs(after.meshes[0].minimumStretch!-result.after.meshes[0].minimumStretch!)<1e-7);
 const restAfter=poseSurfacePositions(f.rig,f.rig.data.poses[1].values,0),targetAfter=poseSurfacePositions(f.rig,f.pose.values,0);restAfter.forEach((v,i)=>assert.ok(Math.abs(v-restBefore[i])<1e-6));assert.deepEqual(targetAfter.slice(0,48),targetBefore.slice(0,48));assert.deepEqual(targetAfter.slice(96),targetBefore.slice(96));
 const project=parseProject({format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]},studio:structuredClone(f.rig.data)}),reloaded=new StudioRig(sourceRoot,project.studio);assert.deepEqual(poseSurfacePositions(reloaded,project.studio.poses[0].values,0),targetAfter);reloaded.dispose();f.rig.dispose();
});
test('correction search respects cancellation, stale state, unsupported roots and unneeded corrections',async()=>{
 const f=twistFixture(),before=structuredClone(f.rig.data),abort=new AbortController(),pending=searchWeightCorrection(f.rig,f.pose,f.joint,1,abort.signal);abort.abort();await assert.rejects(()=>pending,{name:'AbortError'});
 let valid=true;const stale=searchWeightCorrection(f.rig,f.pose,f.joint,1,new AbortController().signal,()=>valid);valid=false;await assert.rejects(()=>stale,/geändert/);
 await assert.rejects(()=>searchWeightCorrection(f.rig,f.pose,f.rig.data.points[0],1,new AbortController().signal),/Elternknochen/);
 assert.equal(await searchWeightCorrection(f.rig,f.rig.data.poses[1],f.joint,1,new AbortController().signal),null);assert.equal(await searchWeightCorrection(f.rig,f.pose,f.joint,.005,new AbortController().signal),null);assert.deepEqual(f.rig.data,before);f.rig.dispose();
});
test('a correction that worsens a second stored pose is rejected rather than optimizing just the chosen pose',async()=>{
 const f=twistFixture();const conflict=structuredClone(f.pose);conflict.id='conflict';conflict.values[f.joint.id]={position:[10,0,0],rotation:[0,0,0,1]};f.rig.data.poses.push(conflict);
 const result=await searchWeightCorrection(f.rig,f.pose,f.joint,1,new AbortController().signal);
 assert.equal(result,null);f.rig.dispose();
});
test('intermediate comparison samples retain the target figure transform and interpolate the actual joint path',()=>{
 const f=twistFixture();f.pose.values.$figure={position:[3,2,1],rotation:[0,0,0,1],scale:2};const samples=correctionSamples(f.rig,f.pose);assert.equal(samples.length,3);for(let i=0;i<3;i++){assert.deepEqual(samples[i].values.$figure,f.pose.values.$figure);assert.ok(Math.abs(new T.Quaternion().fromArray(samples[i].values[f.joint.id].rotation).angleTo(new T.Quaternion())-Math.PI*(i+1)/4)<1e-8);}f.rig.dispose();
});
function editorFixture(){
 const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const el=w.document.createElement('option');el.textContent=text;el.value=value;return el;}});
 const f=twistFixture(),host=document.createElement('div'),view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
 const editor=new StudioEditor(f.rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();const select=host.querySelector<HTMLSelectElement>('#studio-points')!;select.value=f.joint.id;select.dispatchEvent(new Event('change'));const radius=host.querySelector<HTMLInputElement>('#pose-weight-radius')!;radius.value='1';radius.dispatchEvent(new Event('change'));return {...f,host,editor,w};
}
test('editor publishes a read-only proposal, requires explicit apply, preserves poses, and undoes/replays skin changes',async()=>{
 const f=editorFixture(),before=f.editor.exportProject(),revision=f.editor.inspect().revision,result=await f.editor.findWeightCorrection(f.pose.id);assert.ok(result);assert.equal(f.editor.inspect().revision,revision);assert.equal(f.editor.dirty,false);assert.deepEqual(f.editor.exportProject(),before);assert.equal(f.editor.inspect().weightCorrection!.requiresVisualReview,true);
 f.editor.applyWeightCorrection();assert.equal(f.editor.dirty,true);assert.equal(f.rig.data.weightTransfers!.length,1);assert.deepEqual(f.rig.data.poses.map(p=>p.values),before.studio.poses.map(p=>p.values));assert.deepEqual(f.rig.data.moves,before.studio.moves);assert.equal(checkPoseSurface(f.rig,f.pose).status,'within');assert.equal(f.rig.data.poses[0].review?.includes('skin-weights'),true);
 f.host.querySelector<HTMLButtonElement>('#studio-undo')!.click();assert.deepEqual(f.editor.exportProject(),before);f.host.querySelector<HTMLButtonElement>('#studio-redo')!.click();assert.equal(checkPoseSurface(f.rig,f.rig.data.poses[0]).status,'within');assert.throws(()=>f.editor.applyWeightCorrection(),/geändert/);f.editor.dispose();f.w.happyDOM.abort();
});
test('editor cancels stale searches and invalidates proposals on project changes and selection changes',async()=>{
 for(const action of ['cancel','edit','select','leave']){
  const f=editorFixture(),before=structuredClone(f.rig.data),pending=f.editor.findWeightCorrection(f.pose.id);
  if(action==='cancel')f.host.querySelector<HTMLButtonElement>('#pose-surface-cancel')!.click();
  if(action==='edit')f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();
  if(action==='select'){const select=f.host.querySelector<HTMLSelectElement>('#studio-points')!;select.value='bone-0';select.dispatchEvent(new Event('change'));}
  if(action==='leave')f.editor.leave();
  await assert.rejects(()=>pending);assert.deepEqual(f.rig.data.weightTransfers,before.weightTransfers);assert.equal(f.editor.inspect().weightCorrection,null);f.editor.dispose();f.w.happyDOM.abort();
 }
 const f=editorFixture();await f.editor.findWeightCorrection(f.pose.id);f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();assert.throws(()=>f.editor.applyWeightCorrection(),/geändert/);f.editor.dispose();f.w.happyDOM.abort();
});
