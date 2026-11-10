import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {twistFixture} from './helpers/twist-fixture.ts';
import {findAutomaticSkinCorrection,skinCorrectionOverrides,checkCandidateIntersectionRegression,checkCandidateIntersectionFrames,selectCollisionMotionFrames,newProvenIntersectionCount} from '../src/automatic-skin-correction.ts';
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

test('bounded intersection screening checks target and three move frames without changing sources',()=>{
 const f=twistFixture(),before=JSON.stringify(f.rig.data),live=f.rig.capture();
 const poses=[f.pose,...[0,.5,1].map(time=>({id:'motion',name:'Motion',seconds:1,values:f.rig.sample(f.rig.data.moves[0],time)}))];
 const result=checkCandidateIntersectionFrames(f.rig,poses,[0]);
 assert.equal(result.checkedFrames,4);assert.equal(result.checkedMeshes+result.unmeasurableMeshes,4);
 assert.equal(result.complete,result.unmeasurableFrames===0);
 assert.deepEqual(f.rig.capture(),live);assert.equal(JSON.stringify(f.rig.data),before);
 assert.throws(()=>checkCandidateIntersectionFrames(f.rig,[...poses,f.pose],[0]),/Schnitt-Stichproben/);
 const abort=new AbortController();abort.abort();assert.throws(()=>checkCandidateIntersectionFrames(f.rig,poses,[0],undefined,undefined,()=>abort.signal.throwIfAborted()),{name:'AbortError'});
 f.rig.dispose();
});

test('collision motion selector preserves bounds and prioritizes the measured deformation peak',()=>{
 const f=twistFixture(),report=createPoseSurfaceChecker(f.rig)(f.pose);
 const severity=[0,1,9,2,4,0];
 const frames=severity.map((issues,i)=>({time:i,before:{...report,issues}}));
 assert.deepEqual(selectCollisionMotionFrames(frames).map(f=>f.time),[0,2,5]);
 assert.deepEqual(selectCollisionMotionFrames(frames.slice(0,2)).map(f=>f.time),[0,1]);
 assert.deepEqual(selectCollisionMotionFrames(frames.slice(0,3)).map(f=>f.time),[0,1,2]);
 assert.deepEqual(selectCollisionMotionFrames([]),[]);
 assert.deepEqual(severity,[0,1,9,2,4,0]);
 f.rig.dispose();
});

test('real skinned 180-degree twist selects a measured high-risk motion frame, not arbitrary midpoint',()=>{
 const f=twistFixture(),inspect=createPoseSurfaceChecker(f.rig),move=f.rig.data.moves[0];
 const frames=Array.from({length:17},(_,i)=>{const time=i/16,pose={id:'measured',name:'Measured',seconds:1,values:f.rig.sample(move,time)};return {time,before:inspect(pose)};});
 const risk=(r:typeof frames[number]['before'])=>r.issues+r.volumeIssues*2+r.meshes.reduce((n,m)=>n+m.volume.components.reduce((s,c)=>s+(c.ratio===null?1:Math.max(0,.8-c.ratio)+Math.max(0,c.ratio-1.2)),0),0);
 const selected=selectCollisionMotionFrames(frames),maxRisk=Math.max(...frames.slice(1,-1).map(f=>risk(f.before)));
 assert.equal(selected.length,3);assert.equal(selected[0].time,0);assert.equal(selected[2].time,1);
 assert.equal(risk(selected[1].before),maxRisk);
 assert.deepEqual(selected,selectCollisionMotionFrames(frames));
 f.rig.dispose();
});

test('collision regression rejects a proven new cut even when the modified mesh has unresolved contacts',()=>{
 const complete={checked:true,triangles:2,candidatePairs:1,testedPairs:1,broadphasePairs:1,intersections:0,examples:[] as [number,number][]};
 const partial={...complete,checked:false,reason:'coplanar-or-touching' as const,intersections:1};
 assert.equal(newProvenIntersectionCount(complete,partial),1);
 assert.equal(newProvenIntersectionCount(partial,complete),0,'an incomplete baseline cannot prove an increase');
 assert.equal(newProvenIntersectionCount(complete,{...complete,intersections:0}),0);
});

test('search exhaustion retains only an earlier fully validated proposal and never changes the source',async()=>{
 const f=twistFixture(),data=structuredClone(f.rig.data),live=f.rig.capture();
 try{
  const full=await findAutomaticSkinCorrection(f.rig,new AbortController().signal);assert.ok(full);assert.equal(full.vertexBudgetExhausted,false);
  const vertices=f.rig.surfaces.reduce((n,s)=>n+s.base.length/3,0),limit=full.vertexSamples!-vertices;
  const limited=await findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>true,{vertexBudget:limit});assert.ok(limited);assert.equal(limited.vertexBudgetExhausted,true);assert.ok(limited.vertexSamples!<=limit);assert.ok(limited.after.issues<limited.before.issues);
  const inspect=createPoseSurfaceChecker(f.rig),overrides=skinCorrectionOverrides(f.rig,limited);
  for(const pose of [...f.rig.data.poses,...moveCheckTimes(f.rig,f.rig.data.moves[0]).map(time=>({id:'independent',name:'Independent',seconds:1,values:f.rig.sample(f.rig.data.moves[0],time)}))])assert.equal(noMeasuredRegression(inspect(pose),inspect(pose,overrides)),true);
  const abort=new AbortController();await assert.rejects(()=>findAutomaticSkinCorrection(f.rig,abort.signal,()=>true,{vertexBudget:limit,progress:s=>{if(s.vertexSamples>=limit)abort.abort();}}),{name:'AbortError'});
  let valid=true;await assert.rejects(()=>findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>valid,{vertexBudget:limit,progress:s=>{if(s.vertexSamples>=limit)valid=false;}}),/geändert/);
  assert.deepEqual(f.rig.data,data);assert.deepEqual(f.rig.capture(),live);
 }finally{f.rig.dispose();}
});
test('a budget without a completely checked proposal rejects, and custom budgets cannot exceed the global cap',async()=>{
 const f=twistFixture(),before=structuredClone(f.rig.data);
 try{
  for(const vertexBudget of [0,-1,1.5,NaN,100000001])await assert.rejects(()=>findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>true,{vertexBudget}),/Korrekturbudget/);
  await assert.rejects(()=>findAutomaticSkinCorrection(f.rig,new AbortController().signal,()=>true,{vertexBudget:1104}),/zu groß/);
  assert.deepEqual(f.rig.data,before);
 }finally{f.rig.dispose();}
});
