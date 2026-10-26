import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioWeightPreview} from '../src/studio-weight-preview.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioView} from '../src/studio-view.ts';
import {StudioEditor} from '../src/studio-editor.ts';

test('region guide matches center, radius and half-strength boundary and releases resources',()=>{
 const preview=new StudioWeightPreview();assert.equal(preview.group.visible,false);preview.setRegion({center:[1,2,3],radius:.8});assert.deepEqual(preview.group.position.toArray(),[1,2,3]);assert.deepEqual(preview.group.scale.toArray(),[.8,.8,.8]);
 const lines=preview.group.children.filter(n=>n instanceof T.LineLoop);assert.equal(lines.length,6);assert.equal(lines.filter(l=>l.scale.x===.5).length,3);assert.equal(lines.filter(l=>l.scale.x===1).length,3);
 const geometry=lines[0].geometry,material=lines[0].material as T.Material;let disposed=0;geometry.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
 preview.setRegion(null);assert.equal(preview.group.visible,false);preview.setRegion({center:[1,2,3],radius:NaN});assert.equal(preview.group.visible,false);preview.dispose();preview.dispose();assert.equal(disposed,2);preview.setRegion({center:[0,0,0],radius:.5});assert.equal(preview.group.visible,false);
});
test('editor guide follows radius, selection, pivot gestures and undo without editing project data',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const root=new T.Group(),a=new T.Bone(),b=new T.Bone();root.add(a);a.add(b);b.position.y=1;const rig=new StudioRig(root);
 const canvas=document.createElement('canvas');canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:400} as DOMRect);canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.1,100);camera.position.z=5;camera.updateMatrixWorld(true);const view=new StudioView(rig,camera,canvas,{enabled:true,target:new T.Vector3()},scene),host=document.createElement('div');
 const editor=new StudioEditor(rig,view,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();const click=(id:string)=>host.querySelector<HTMLButtonElement>('#'+id)!.click();click('mode-rig');view.onSelect(rig.data.points[1].id);
 const guide=scene.getObjectByName('studio-weight-region')!,before=structuredClone(rig.data),revision=editor.inspect().revision;
 const local=host.querySelector<HTMLInputElement>('#weight-local')!;local.checked=true;local.dispatchEvent(new w.Event('change') as unknown as Event);assert.equal(guide.visible,true);assert.deepEqual(guide.position.toArray(),rig.data.points[1].rest);
 const radius=host.querySelector<HTMLInputElement>('#weight-radius')!;radius.value='.45';radius.dispatchEvent(new w.Event('input') as unknown as Event);assert.equal(guide.scale.x,.45);assert.deepEqual(rig.data,before);assert.equal(editor.inspect().revision,revision);assert.equal(editor.dirty,false);
 view.onStart();view.onMove(new T.Vector3(.3,1,0),new T.Quaternion(),'translate');assert.deepEqual(guide.position.toArray(),[.3,1,0]);view.onEnd();click('studio-undo');assert.deepEqual(guide.position.toArray(),[0,1,0]);click('studio-redo');assert.deepEqual(guide.position.toArray(),[.3,1,0]);
 view.onSelect(rig.data.points[0].id);assert.deepEqual(guide.position.toArray(),[0,0,0]);click('mode-pose');assert.equal(guide.visible,false);click('mode-rig');view.onSelect(rig.data.points[1].id);assert.equal(guide.visible,true);editor.leave();assert.equal(view.group.visible,false);editor.enter();assert.equal(guide.visible,true);editor.dispose();assert.equal(scene.getObjectByName('studio-weight-region'),undefined);w.happyDOM.abort();
});
