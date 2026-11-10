import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {twistFixture} from './helpers/twist-fixture.ts';
import {findAutomaticSkinCorrection,skinCorrectionOverrides,checkCandidateIntersectionRegression} from '../src/automatic-skin-correction.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {moveCheckTimes} from '../src/move-limit-check.ts';
import {noMeasuredRegression,searchWeightCorrection} from '../src/pose-weight-correction.ts';
import {Window} from 'happy-dom';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';

test('automatic job finds a joint from faulty skin, validates every move sample and stays read-only',async()=>{
 const f=twistFixture(),data=structuredClone(f.rig.data),live=f.rig.capture(),weights=Array.from(f.mesh.geometry.attributes.skinWeight.array),progress:string[]=[];
 const p=await findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>true,{progress:s=>progress.push(s.phase)});assert.ok(p);assert.equal(p.jointId,f.joint.id);assert.equal(p.checkedMoves,1);assert.equal(p.motionSamples,17);assert.ok(p.after.issues<p.before.issues);assert.ok(progress.includes('diagnosis')&&progress.includes('search')&&progress.includes('validation'));
 const inspect=createPoseSurfaceChecker(f.rig),overrides=skinCorrectionOverrides(f.rig,p);for(const time of moveCheckTimes(f.rig,f.rig.data.moves[0])){const pose={id:'sample',name:'sample',seconds:1,values:f.rig.sample(f.rig.data.moves[0],time)};assert.ok(noMeasuredRegression(inspect(pose),inspect(pose,overrides)));}
 assert.deepEqual(f.rig.data,data);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(Array.from(f.mesh.geometry.attributes.skinWeight.array),weights);f.rig.dispose();
});
test('preview matches pure candidate vertices and restores original weights and pose without persistence',async()=>{
 const f=twistFixture(),p=await findAutomaticSkinCorrection(f.rig,new AbortController().signal);assert.ok(p);const data=structuredClone(f.rig.data),live=f.rig.capture(),indices=f.mesh.geometry.getAttribute('skinIndex'),weights=f.mesh.geometry.getAttribute('skinWeight'),overrides=skinCorrectionOverrides(f.rig,p),expected=poseSurfacePositions(f.rig,p.target.values,0,overrides);
 const restore=f.rig.previewSkin(p.target.values,overrides);assert.equal(f.rig.skinPreviewActive,true);for(let v=0;v<expected.length/3;v++){const actual=f.mesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(f.mesh.matrixWorld);assert.ok(actual.distanceTo(new T.Vector3().fromArray(expected,v*3))<1e-7);}
 restore();restore();assert.equal(f.rig.skinPreviewActive,false);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(f.rig.data,data);assert.equal(f.mesh.geometry.getAttribute('skinIndex'),indices);assert.equal(f.mesh.geometry.getAttribute('skinWeight'),weights);f.rig.dispose();
});
test('rejected candidates do not prevent later candidates, and automatic jobs respect cancellation and revision',async()=>{
 const f=twistFixture();let candidates=0;const p=await searchWeightCorrection(f.rig,f.pose,f.joint,1.2,new AbortController().signal,()=>true,{accept:async()=>++candidates>1});assert.ok(p);assert.ok(candidates>1);
 const abort=new AbortController(),pending=findAutomaticSkinCorrection(f.rig,abort.signal);abort.abort();await assert.rejects(()=>pending,{name:'AbortError'});
 let valid=true;const stale=findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>valid);valid=false;await assert.rejects(()=>stale,/geändert/);f.rig.dispose();
});
test('a locally valid correction is refused when a real move interpolation regresses between safe stored endpoints',async()=>{
 const f=twistFixture();for(const [id,angle]of [['guard-a',0],['guard-b',Math.PI]] as const){const values=f.rig.capture();values[f.joint.id]={position:[-2,-4,0],rotation:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle).toArray()};f.rig.data.poses.push({id,name:id,seconds:1,values});}
 f.rig.data.moves=[{id:'guard',name:'Guard',poses:['guard-a','guard-b'],loop:false}];
 const local=await searchWeightCorrection(f.rig,f.pose,f.joint,1.2,new AbortController().signal);assert.ok(local,'all stored poses and old neutral-target probes accept the local candidate');
 const inspect=createPoseSurfaceChecker(f.rig),mid={id:'mid',name:'Mid',seconds:1,values:f.rig.sample(f.rig.data.moves[0],.5)},overrides=skinCorrectionOverrides(f.rig,local);assert.equal(noMeasuredRegression(inspect(mid),inspect(mid,overrides)),false);
 const before=structuredClone(f.rig.data);assert.equal(await findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>true,{poseId:f.pose.id,radius:1.2}),null);assert.deepEqual(f.rig.data,before);f.rig.dispose();
});
test('job refuses excessive sampling before starting and does not invent a correction for a neutral target',async()=>{
 const f=twistFixture();assert.equal(await findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>true,{poseId:'neutral'}),null);f.rig.data.moves=Array.from({length:40},(_,i)=>({...f.rig.data.moves[0],id:'move-'+i}));await assert.rejects(()=>findAutomaticSkinCorrection(f.rig,new AbortController().signal),/zu groß/);assert.equal(f.rig.data.weightTransfers?.length??0,0);f.rig.dispose();
});

function editorFixture(){
 const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const el=w.document.createElement('option');el.textContent=text;el.value=value;return el;}});
 const f=twistFixture(),host=document.createElement('div'),view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
 const editor=new StudioEditor(f.rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();return {...f,w,host,editor};
}
test('one automatic editor job previews both alternatives, applies once, and undoes without changing moves',async()=>{
 const f=editorFixture(),before=f.editor.exportProject(),revision=f.editor.inspect().revision,p=await f.editor.startAutomaticSkinCorrection();assert.ok(p);assert.equal(f.editor.inspect().revision,revision);assert.equal(f.editor.dirty,false);assert.deepEqual(f.editor.exportProject(),before);
 f.editor.previewAutomaticSkinCorrection(p.id,false);assert.equal(f.rig.skinPreviewActive,true);f.editor.previewAutomaticSkinCorrection(p.id,true);assert.throws(()=>f.editor.exportProject(),/beenden/);f.host.querySelector<HTMLButtonElement>('#skin-auto-stop')!.click();assert.deepEqual(f.editor.exportProject(),before);
 f.editor.previewAutomaticSkinCorrection(p.id,true);f.editor.applyAutomaticSkinCorrection(p.id);assert.equal(f.rig.skinPreviewActive,false);assert.equal(f.rig.data.weightTransfers!.length,1);assert.equal(f.editor.dirty,true);assert.deepEqual(f.rig.data.poses.map(p=>p.values),before.studio.poses.map(p=>p.values));assert.deepEqual(f.rig.data.moves,before.studio.moves);
 assert.equal(createPoseSurfaceChecker(f.rig)(f.pose).issues,p.afterIssues);f.host.querySelector<HTMLButtonElement>('#studio-undo')!.click();assert.deepEqual(f.editor.exportProject(),before);f.host.querySelector<HTMLButtonElement>('#studio-redo')!.click();assert.equal(f.rig.data.weightTransfers!.length,1);assert.throws(()=>f.editor.applyAutomaticSkinCorrection(p.id),/geändert/);f.editor.dispose();await f.w.happyDOM.abort();
});
test('automatic proposal requires the actual current token and KI permission; cancellation/edits/leave discard work',async()=>{
 for(const action of ['cancel','edit','leave']){
  const f=editorFixture(),pending=f.editor.startAutomaticSkinCorrection();if(action==='cancel')f.host.querySelector<HTMLButtonElement>('#skin-auto-cancel')!.click();if(action==='edit')f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();if(action==='leave')f.editor.leave();await assert.rejects(()=>pending);assert.equal(f.editor.inspect().automaticSkinCorrection,null);assert.equal(f.rig.data.weightTransfers?.length??0,0);f.editor.dispose();await f.w.happyDOM.abort();
 }
 const f=editorFixture();const unapproved=await f.editor.startAutomaticSkinCorrection();assert.ok(unapproved);assert.throws(()=>f.editor.execute(unapproved.command),/nicht freigegeben/);const permission=f.host.querySelector<HTMLInputElement>('#studio-agent-edit')!;permission.checked=true;permission.dispatchEvent(new Event('change'));const state=f.editor.inspect(),p=await f.editor.proposeSkinCorrection({session:state.session,expectedRevision:state.revision});assert.ok(p);const command=p.command;
 assert.throws(()=>f.editor.execute({...command,id:'skin-invented'}));assert.throws(()=>f.editor.execute({...command,expectedRevision:state.revision-1}));assert.equal(f.rig.data.weightTransfers?.length??0,0);f.editor.execute(command);assert.equal(f.rig.data.weightTransfers!.length,1);assert.throws(()=>f.editor.execute(command));f.editor.dispose();await f.w.happyDOM.abort();
});

test('automatic intersection guard reports coverage and leaves source state intact',()=>{
 const f=twistFixture(),before=JSON.stringify(f.rig.data),live=f.rig.capture();
 const result=checkCandidateIntersectionRegression(f.rig,f.pose,[0]);
 assert.equal(result.newIntersections,0);
 assert.equal(result.checkedMeshes+result.unmeasurableMeshes,1);
 assert.equal(result.complete,result.unmeasurableMeshes===0);
 assert.deepEqual(f.rig.capture(),live);
 assert.equal(JSON.stringify(f.rig.data),before);
 assert.throws(()=>checkCandidateIntersectionRegression(f.rig,f.pose,[999]),/Teilmodell/);
 f.rig.dispose();
});
