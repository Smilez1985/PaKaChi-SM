import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import * as T from 'three';
import {installAtomically,checkpointElements} from '../src/avatar-installation.ts';
import {prepareAvatar} from '../src/avatar-candidate.ts';
import {StateMachine} from '../src/control.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {glb} from './generation-fixture.mjs';
import type {StudioView} from '../src/studio-view.ts';

function dom(){const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});return w;}

test('failed publication restores original DOM nodes, event handlers and exact state-machine binding',()=>{
 const w=dom(),host=document.createElement('div'),button=document.createElement('button'),select=document.createElement('select');let clicks=0,oldCalls=0,oldDisposed=0,newDisposed=0;
 button.onclick=()=>clicks++;host.append(button);host.hidden=true;select.add(new Option('A','a'));select.value='a';
 const machine=new StateMachine();machine.bind({capability:{id:'old',name:'old',states:['idle'],moves:[]},setState:()=>oldCalls++,playMove(){}},null);
 const restoreUI=checkpointElements([host,select]),restoreBinding=machine.checkpointBinding();
 assert.throws(()=>installAtomically(()=>{host.replaceChildren(document.createElement('span'));host.hidden=false;select.replaceChildren();machine.bind({capability:{id:'new',name:'new',states:[],moves:[]},setState(){},playMove(){}});throw new Error('publish-failed');},()=>{restoreBinding();restoreUI();},()=>newDisposed++,()=>oldDisposed++),/publish-failed/);
 assert.equal(host.firstChild,button);assert.equal(host.hidden,true);assert.equal(select.value,'a');button.click();assert.equal(clicks,1);machine.execute({state:'idle'});assert.equal(oldCalls,1);assert.equal(machine.capability!.id,'old');assert.equal(oldDisposed,0);assert.equal(newDisposed,1);w.happyDOM.abort();
});
test('successful publication disposes previous resources only after commit; cleanup failure keeps the new avatar',()=>{
 const order:string[]=[];const errors=installAtomically(()=>order.push('install'),()=>order.push('rollback'),()=>order.push('candidate'),()=>{order.push('previous');throw new Error('dispose-failed');});assert.deepEqual(order,['install','previous']);assert.equal(errors.length,1);
});
test('candidate cleanup still runs if rollback itself reports a failure',()=>{
 let cleaned=false;assert.throws(()=>installAtomically(()=>{throw new Error('install');},()=>{throw new Error('rollback');},()=>{cleaned=true;},()=>assert.fail('old disposal')),AggregateError);assert.ok(cleaned);
});
async function candidateFixture(failAt?:'show'|'view'|'editor'){
 const model=await parseModel(Uint8Array.from(glb()).buffer),holder=new T.Group();let releases=0,viewReleases=0,notifications=0;
 const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){if(failAt==='editor')throw new Error('editor');},refresh(){},dispose(){viewReleases++;}} as unknown as StudioView;
 const fakeViewer={onFrame:(_delta:number)=>{},show(root:T.Object3D){holder.scale.setScalar(2.4);holder.add(root);if(failAt==='show')throw new Error('show');},createStudioView(){if(failAt==='view')throw new Error('view');return view;},setStudio(){},showSkeleton(){},dispose(){releases++;disposeModel(model.scene);model.scene.removeFromParent();}};
 const avatar={id:'test',name:'Test',description:'',model:'',rigVersion:'1',moves:[]};
 const opts={model,avatar,moves:[],source:{format:'pakachi-studio' as const,version:1 as const,model:Buffer.from(glb()).toString('base64'),avatar},studio:true,speed:1,dirty:true,skeleton:false,resume(){},changed(){notifications++;},feedback(){notifications++;},playbackChanged(){notifications++;}};
 return {opts,fakeViewer,get releases(){return releases;},get viewReleases(){return viewReleases;},get notifications(){return notifications;}};
}
test('candidate preparation failures release staged resources without mounting UI or firing active callbacks',async()=>{
 const w=dom();for(const step of ['show','view','editor'] as const){const f=await candidateFixture(step);const before=document.body.innerHTML;assert.throws(()=>prepareAvatar(f.opts,()=>f.fakeViewer));assert.equal(document.body.innerHTML,before);assert.equal(f.releases,1);assert.equal(f.viewReleases,step==='editor'?1:0);assert.equal(f.notifications,0);}w.happyDOM.abort();
});
test('prepared avatar remains isolated until publication, builds rig in normalized coordinates and disposes once',async()=>{
 const w=dom(),f=await candidateFixture();const candidate=prepareAvatar(f.opts,()=>f.fakeViewer);
 assert.equal(candidate.stage.isConnected,false);assert.equal(candidate.editorHost.isConnected,false);assert.equal(candidate.editor.dirty,true);assert.equal(f.notifications,0);
 assert.ok(Math.abs(candidate.editor.rig.surfaces[0].world[1].x-2.4)<1e-6);
 candidate.activate();candidate.editor.leave();candidate.dispose();candidate.dispose();assert.equal(f.releases,1);assert.equal(f.viewReleases,1);w.happyDOM.abort();
});
