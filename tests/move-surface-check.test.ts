import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {twistFixture} from './helpers/twist-fixture.ts';
import {checkMoveSurface} from '../src/move-surface-check.ts';
import {checkPoseSurface} from '../src/pose-surface-check.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';

function fixture(){
 const f=twistFixture();
 for(const [i,degrees]of [120,240].entries())f.rig.data.poses[i].values[f.joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),degrees*Math.PI/180).toArray();
 f.rig.data.moves[0].poses=f.rig.data.poses.map(p=>p.id);return {...f,move:f.rig.data.moves[0]};
}
test('motion surface check catches an intermediate collapse when both stored poses pass, without mutations',async()=>{
 const f=fixture();for(const p of f.rig.data.poses)assert.equal(checkPoseSurface(f.rig,p).issues,0);
 const before=JSON.stringify(f.rig.data),live=f.rig.capture(),positions=Array.from(f.mesh.geometry.attributes.position.array),weights=Array.from(f.mesh.geometry.attributes.skinWeight.array);
 const report=await checkMoveSurface(f.rig,f.move,new AbortController().signal);assert.ok(report.samples>17&&report.samples<=81);assert.equal(report.adaptiveSamples,report.samples-17);assert.equal(report.continuous,false);const mesh=report.meshes[0];assert.equal(mesh.intersections.checkedFrames,1);assert.equal(mesh.intersections.totalFrames,report.samples);assert.ok(mesh.maximumIssues>0);assert.equal(mesh.worstTime,.5);assert.ok(mesh.firstIssue!>0&&mesh.firstIssue!<1);
 assert.equal(JSON.stringify(f.rig.data),before);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(Array.from(f.mesh.geometry.attributes.position.array),positions);assert.deepEqual(Array.from(f.mesh.geometry.attributes.skinWeight.array),weights);f.rig.dispose();
});
test('loop closure is sampled, abort and invalidation stop work, and excessive or empty geometry never passes',async()=>{
 const f=fixture();f.move.loop=true;const report=await checkMoveSurface(f.rig,f.move,new AbortController().signal);assert.ok(report.samples>33&&report.samples<=97);assert.equal(report.duration,2);
 const abort=new AbortController(),pending=checkMoveSurface(f.rig,f.move,abort.signal);abort.abort();await assert.rejects(()=>pending,{name:'AbortError'});
 let valid=true;const stale=checkMoveSurface(f.rig,f.move,new AbortController().signal,()=>valid);valid=false;await assert.rejects(()=>stale,/geändert/);
 f.move.poses=Array.from({length:100},(_,i)=>f.rig.data.poses[i%2].id);f.rig.surfaces[0].base=new Float32Array(60000);await assert.rejects(()=>checkMoveSurface(f.rig,f.move,new AbortController().signal),/zu groß/);
 f.rig.surfaces.length=0;await assert.rejects(()=>checkMoveSurface(f.rig,f.move,new AbortController().signal),/Keine auswertbare/);f.rig.dispose();
});
function editorFixture(){
 const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const el=w.document.createElement('option');el.textContent=text;el.value=value;return el;}});
 const f=fixture(),host=document.createElement('div'),view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
 const editor=new StudioEditor(f.rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();return {...f,w,host,editor};
}
test('agent diagnostic uses the same measured geometry, rejects stale requests and propagates abort',async()=>{
 const f=editorFixture(),state=f.editor.inspect(),args={session:state.session,expectedRevision:state.revision,kind:'move',id:f.move.id},before=f.editor.exportProject();
 const report=await f.editor.analyzeSurface(args);assert.ok(report.samples>17&&report.samples<=81);assert.ok(report.maximumIssues>0);assert.equal(report.truncated,false);assert.equal(report.continuous,false);assert.deepEqual(f.editor.exportProject(),before);
 await assert.rejects(()=>f.editor.analyzeSurface({...args,expectedRevision:state.revision-1}));await assert.rejects(()=>f.editor.analyzeSurface({...args,extra:true}));
 const abort=new AbortController(),pending=f.editor.analyzeSurface(args,abort.signal);abort.abort();await assert.rejects(()=>pending,{name:'AbortError'});assert.deepEqual(f.editor.exportProject(),before);f.editor.dispose();await f.w.happyDOM.abort();
});
test('editor surface checks reject concurrent work and cancel after edits, selection change or leaving',async()=>{
 for(const action of ['none','cancel','edit','select','leave']){
  const f=editorFixture(),before=f.editor.exportProject(),revision=f.editor.inspect().revision,pending=f.editor.checkMoveSurface(f.move.id);
  assert.equal(f.host.querySelector<HTMLButtonElement>('#move-check-surface')!.disabled,true);assert.equal(f.host.querySelector<HTMLButtonElement>('#move-check-limits')!.disabled,true);await assert.rejects(()=>f.editor.checkMoveLimits(f.move.id),/beschäftigt/);
  if(action==='cancel')f.host.querySelector<HTMLButtonElement>('#move-check-cancel')!.click();if(action==='edit')f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();if(action==='leave')f.editor.leave();
  if(action==='select'){const select=f.host.querySelector<HTMLSelectElement>('#studio-moves')!;select.value='';select.dispatchEvent(new Event('change'));}
  if(action==='none'){assert.ok((await pending).samples>17);assert.deepEqual(f.editor.exportProject(),before);assert.equal(f.editor.inspect().revision,revision);assert.equal(f.editor.dirty,false);}else await assert.rejects(()=>pending);
  assert.equal(f.host.querySelector<HTMLButtonElement>('#move-check-cancel')!.disabled,true);f.editor.dispose();await f.w.happyDOM.abort();
 }
});
test('surface report displays literal names, opens the worst frame paused, and clears after edits',async()=>{
 const f=editorFixture();f.mesh.name='<img src=x>';f.host.querySelector<HTMLButtonElement>('#move-check-surface')!.click();
 for(let i=0;i<100&&!f.host.querySelector('#move-surface-result button');i++)await new Promise(r=>setTimeout(r,5));
 const output=f.host.querySelector('#move-surface-result')!;assert.match(output.textContent!,/Oberfläche auffällig/);assert.match(output.textContent!,/<img src=x>/);assert.equal(output.querySelector('img'),null);output.querySelector<HTMLButtonElement>('button')!.click();assert.equal(f.editor.paused,true);assert.equal(f.editor.playing,true);assert.deepEqual(f.rig.capture(),f.rig.sample(f.move,.5));f.editor.stopPreview();f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();assert.equal(f.host.querySelector('#move-surface-result')!.textContent,'');f.editor.dispose();await f.w.happyDOM.abort();
});

test('adaptive surface sampling is skipped on a stable safe movement',async()=>{
 const f=fixture();f.rig.data.poses[1].values[f.joint.id].rotation=[...f.rig.data.poses[0].values[f.joint.id].rotation];
 const report=await checkMoveSurface(f.rig,f.move,new AbortController().signal);
 assert.equal(report.samples,17);assert.equal(report.adaptiveSamples,0);assert.equal(report.continuous,false);f.rig.dispose();
});
