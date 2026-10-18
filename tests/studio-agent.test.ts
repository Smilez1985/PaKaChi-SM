import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {parseStudioCommand} from '../src/studio-command.ts';
import {parseProject} from '../src/studio-data.ts';
function fixture(){const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const option=w.document.createElement('option');option.textContent=text;option.value=value;return option;}});const root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry()));const rig=new StudioRig(root),host=document.createElement('div');const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onStart:()=>{},onEnd:()=>{}};const project={format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]}};const editor=new StudioEditor(rig,view as unknown as StudioView,host,project,{suspend(){},resume(){},changed(){},feedback(){}});const grant=(enabled=true)=>{const checkbox=host.querySelector<HTMLInputElement>('#studio-agent-edit')!;checkbox.checked=enabled;checkbox.dispatchEvent(new w.Event('change') as unknown as Event);};const command=(extra:Record<string,unknown>)=>{const s=editor.inspect();return {session:s.session,expectedRevision:s.revision,...extra};};return {w,rig,host,view,project,editor,grant,command,run:(extra:Record<string,unknown>)=>editor.execute(command(extra))};}
test('studio agent builds editable facial controls and a playable move; each edit is undoable',()=>{
 const f=fixture(),{editor,rig,run}=f;editor.enter();f.grant();run({action:'set_mode',mode:'rig'});const a=run({action:'add_point',name:'Mund links',position:[0,0,0],mesh:0,size:.005}).id!,b=run({action:'add_point',name:'Mund rechts',position:[.1,0,0],mesh:0}).id!;
 run({action:'connect_points',id:a,target:b});assert.deepEqual(rig.data.links,[[a,b]]);run({action:'disconnect_points',id:a,target:b});assert.equal(rig.data.links.length,0);run({action:'undo'});assert.equal(rig.data.links.length,1);
 run({action:'set_mode',mode:'pose'});const first=run({action:'save_pose',name:'Neutral'}).id!;run({action:'update_point',id:a,position:[0,.1,0]});const second=run({action:'save_pose',name:'Lächeln',seconds:2}).id!;run({action:'create_move',id:'smile',name:'Smile',poses:[first,second],loop:false});assert.equal(rig.data.moves.length,1);assert.doesNotThrow(()=>parseProject({...f.project,studio:rig.data}));assert.equal(editor.play('smile',true),true);editor.update(1);assert.ok(Math.abs(rig.position(rig.data.points[0]).y-.05)<1e-6);editor.stopPreview();
 run({action:'apply_pose',id:first});assert.equal(rig.position(rig.data.points[0]).y,0);run({action:'update_point',id:'$figure',position:[.2,.2,.2],rotation:[0,0,1,0]});run({action:'replace_pose',id:first});assert.deepEqual(rig.data.poses[0].values.$figure.rotation,[0,0,1,0]);editor.dispose();f.w.happyDOM.abort();
});
test('studio agent denies stale sessions, manual races, disabled editing and busy gestures atomically',()=>{
 const f=fixture(),{editor,run}=f;assert.throws(()=>run({action:'set_mode',mode:'rig'}),/nicht freigegeben/);editor.enter();assert.throws(()=>run({action:'set_mode',mode:'rig'}),/nicht freigegeben/);f.grant();const stale=f.command({action:'set_mode',mode:'rig'});run({action:'set_mode',mode:'pose'});assert.throws(()=>editor.execute(stale),/Stand hat sich geändert/);assert.throws(()=>editor.execute({...f.command({action:'undo'}),session:'other'}),/Stand hat sich geändert/);
 const manual=f.command({action:'save_pose'});f.host.querySelector<HTMLButtonElement>('#pose-add')!.click();assert.throws(()=>editor.execute(manual),/Stand hat sich geändert/);f.view.onStart();assert.throws(()=>run({action:'save_pose'}),/beschäftigt/);f.view.onEnd();f.grant(false);assert.throws(()=>run({action:'save_pose'}),/nicht freigegeben/);f.grant();editor.leave();editor.enter();assert.equal(editor.inspect().editable,false,'permission resets when leaving');editor.dispose();f.w.happyDOM.abort();
});
test('invalid studio commands cannot change data or revision and snapshots stay bounded',()=>{
 const f=fixture();f.editor.enter();f.grant();f.run({action:'set_mode',mode:'rig'});const before=JSON.stringify(f.rig.data),revision=f.editor.inspect().revision;
 for(const extra of [{action:'add_point',position:[NaN,0,0]},{action:'add_point',position:[0,0,0],mesh:999},{action:'save_pose'},{action:'delete_point',id:'missing'},{action:'update_point',id:'$figure',position:[0,0,0]},{action:'set_mode',mode:'rig',path:'/tmp/file'},{action:'add_point',position:[0,0,0],rotation:[0,0,0,0]}]){assert.throws(()=>f.run(extra));assert.equal(JSON.stringify(f.rig.data),before);assert.equal(f.editor.inspect().revision,revision);}
 for(let i=0;i<35;i++)f.run({action:'add_point',position:[0,0,0],name:'顔'.repeat(100)});const first=f.editor.inspect({section:'points',limit:32});assert.ok('items' in first);assert.equal(first.items.length,32);assert.equal(first.nextOffset,32);assert.ok(new TextEncoder().encode(JSON.stringify(first)).length<65536);assert.throws(()=>f.editor.inspect({limit:33}));assert.throws(()=>parseStudioCommand(null));f.editor.dispose();f.w.happyDOM.abort();
});

test('mouse scale is one undoable gesture, blocks racing MCP, persists poses and is editable through MCP',()=>{
 const f=fixture(),{editor,rig,host,run}=f;editor.enter();f.grant();host.querySelector<HTMLButtonElement>('#figure-select')!.click();
 const slider=host.querySelector<HTMLInputElement>('#figure-scale')!,revision=editor.inspect().revision;
 for(const scale of ['1.5','2']){slider.value=scale;slider.dispatchEvent(new f.w.Event('input') as unknown as Event);}
 assert.equal(rig.scale,2);assert.equal(editor.inspect().revision,revision);assert.equal(host.querySelector('#figure-scale-value')!.textContent,'200 %');assert.throws(()=>run({action:'save_pose'}),/beschäftigt/);
 slider.dispatchEvent(new f.w.Event('change') as unknown as Event);assert.equal(editor.inspect().revision,revision+1);run({action:'undo'});assert.equal(rig.scale,1);run({action:'redo'});assert.equal(rig.scale,2);
 const a=run({action:'save_pose'}).id!;run({action:'update_point',id:'$figure',scale:.5});assert.equal(editor.inspect().figure.scale,.5);const b=run({action:'save_pose',seconds:2}).id!;run({action:'create_move',id:'shrink',name:'Shrink',poses:[a,b]});editor.play('shrink',true);editor.update(1);assert.equal(rig.scale,1.25);editor.stopPreview();
 editor.leave();editor.enter();assert.equal(rig.scale,1.25,'draft persists');f.grant();assert.doesNotThrow(()=>parseProject({...f.project,studio:rig.data}));
 for(const scale of [0,-1,6,NaN,Infinity,'2']){const before=rig.capture(),rev=editor.inspect().revision;assert.throws(()=>run({action:'update_point',id:'$figure',scale}));assert.deepEqual(rig.capture(),before);assert.equal(editor.inspect().revision,rev);}
 run({action:'set_mode',mode:'rig'});const id=run({action:'add_point',position:[0,0,0]}).id!;run({action:'set_mode',mode:'pose'});assert.throws(()=>run({action:'update_point',id,scale:2}));editor.dispose();f.w.happyDOM.abort();
});

test('move import is a single undoable editor action with no automatic playback or changed pose',async()=>{
 const f=fixture(),{editor,run,rig,host}=f;editor.enter();f.grant();const a=run({action:'save_pose'}).id!,b=run({action:'save_pose'}).id!;run({action:'create_move',id:'wave',name:'Wave',poses:[a,b]});
 const file=await editor.exportMove('wave'),before=structuredClone(rig.data),pose=rig.capture(),revision=editor.inspect().revision;
 assert.ok(host.querySelector('#move-export'));assert.ok(host.querySelector('#move-import'));await editor.importMove(file);assert.equal(editor.inspect().revision,revision+1);assert.equal(rig.data.moves[1].id,'wave-2');assert.equal(host.querySelector<HTMLSelectElement>('#studio-moves')!.value,'wave-2');assert.equal(editor.playing,false);assert.deepEqual(rig.capture(),pose);assert.equal(editor.dirty,true);
 run({action:'undo'});assert.deepEqual(rig.data,before);run({action:'redo'});assert.equal(rig.data.moves.length,2);editor.dispose();f.w.happyDOM.abort();
});
test('manual edits, gestures, leaving or disposal invalidate an asynchronous move import',async()=>{
 for(const action of ['edit','gesture','leave','dispose']){
  const f=fixture(),{editor,run,rig}=f;editor.enter();f.grant();const a=run({action:'save_pose'}).id!,b=run({action:'save_pose'}).id!;run({action:'create_move',id:'wave',name:'Wave',poses:[a,b]});const file=await editor.exportMove('wave');
  const pending=editor.importMove(file);if(action==='edit')run({action:'save_pose'});else if(action==='gesture')f.view.onStart();else if(action==='leave')editor.leave();else editor.dispose();
  await assert.rejects(()=>pending,/Stand hat sich geändert/);assert.equal(rig.data.moves.length,1);if(action!=='dispose')editor.dispose();f.w.happyDOM.abort();
 }
});
