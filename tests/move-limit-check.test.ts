import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {checkMoveBends,moveCheckTimes} from '../src/move-limit-check.ts';
function fixture(){const root=new T.Group(),a=new T.Bone(),b=new T.Bone(),c=new T.Bone();root.add(a);a.add(b);b.add(c);b.position.x=1;c.position.x=1;const rig=new StudioRig(root);rig.data.points[1].bendLimit={min:40,max:90};rig.data.poses=[60,-60].map((angle,i)=>{const values=rig.capture();values[rig.data.points[1].id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),T.MathUtils.degToRad(angle)).toArray();return {id:'p'+i,name:'P'+i,seconds:i?2:1,values};});const move={id:'test',name:'Test',loop:false,poses:['p0','p1']};rig.data.moves=[move];return {rig,move};}
test('sampling finds intermediate violations between valid key poses and preserves the rig',async()=>{
 const {rig,move}=fixture();for(const pose of rig.data.poses)assert.equal(rig.checkPoseBends(pose).results[0].status,'within');const data=JSON.stringify(rig.data),live=rig.capture(),matrices=rig.bones.map(b=>b.matrixWorld.toArray());const report=await checkMoveBends(rig,move,new AbortController().signal);assert.equal(report.samples,17);assert.ok(report.joints[0].violations>0);assert.ok(report.joints[0].minimum!<.001);assert.ok(report.joints[0].firstIssue!>0);assert.equal(JSON.stringify(rig.data),data);assert.deepEqual(rig.capture(),live);assert.deepEqual(rig.bones.map(b=>b.matrixWorld.toArray()),matrices);
});
test('sampling includes unequal transition boundaries, repeated poses and loop closure within a fixed bound',()=>{
 const {rig,move}=fixture();move.poses=['p0','p1','p0'];move.loop=true;const times=moveCheckTimes(rig,move);assert.equal(times.length,49);assert.ok(times.includes(2));assert.ok(times.includes(3));assert.equal(times.at(-1),4);move.poses=Array.from({length:100},(_,i)=>'p'+i%2);assert.equal(moveCheckTimes(rig,move).length,1601);
});
test('abort and invalidated studio stop sampling; disconnected constraints never produce a passing joint',async()=>{
 const {rig,move}=fixture(),controller=new AbortController();const pending=checkMoveBends(rig,move,controller.signal);controller.abort();await assert.rejects(()=>pending,{name:'AbortError'});let valid=true;const stale=checkMoveBends(rig,move,new AbortController().signal,()=>valid);valid=false;await assert.rejects(()=>stale,/geändert/);rig.data.links=[];const result=await checkMoveBends(rig,move,new AbortController().signal);assert.equal(result.joints.length,0);assert.equal(result.unmatched.length,1);
});
function editorFixture(){const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const el=w.document.createElement('option');el.textContent=text;el.value=value;return el;}});const f=fixture(),host=document.createElement('div'),view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};const editor=new StudioEditor(f.rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();return {...f,w,host,editor};}
test('editor motion check is read-only and cancel/edits/leave prevent publication',async()=>{
 for(const action of ['none','cancel','edit','leave']){const f=editorFixture(),before=f.editor.exportProject(),revision=f.editor.inspect().revision;const pending=f.editor.checkMoveLimits('test');assert.equal(f.host.querySelector<HTMLButtonElement>('#move-check-limits')!.disabled,true);
 if(action==='cancel')f.host.querySelector<HTMLButtonElement>('#move-check-cancel')!.click();if(action==='edit')f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();if(action==='leave')f.editor.leave();
 if(action==='none'){assert.equal((await pending).samples,17);assert.deepEqual(f.editor.exportProject(),before);assert.equal(f.editor.inspect().revision,revision);assert.equal(f.editor.dirty,false);}else await assert.rejects(()=>pending);
 assert.equal(f.host.querySelector<HTMLButtonElement>('#move-check-cancel')!.disabled,true);f.editor.dispose();f.w.happyDOM.abort();}
});
test('UI displays bounded sampling results, literal names and clears report after edits',async()=>{
 const f=editorFixture();f.rig.data.points[1].name='<img src=x>';f.host.querySelector<HTMLButtonElement>('#move-check-limits')!.click();for(let i=0;i<100&&!f.host.querySelector('#move-limit-result')!.textContent;i++)await new Promise(r=>setTimeout(r,5));const output=f.host.querySelector('#move-limit-result')!;assert.match(output.textContent!,/Grenze verletzt/);assert.match(output.textContent!,/Stichprobe/);assert.match(output.textContent!,/<img src=x>/);assert.equal(output.querySelector('img'),null);f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();assert.equal(f.host.querySelector('#move-limit-result')!.textContent,'');f.editor.dispose();f.w.happyDOM.abort();
});
