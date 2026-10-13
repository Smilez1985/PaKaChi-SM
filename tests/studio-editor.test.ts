import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import * as T from 'three';
import { StudioRig } from '../src/studio-rig.ts';
import { StudioEditor,encodeModel,decodeModel } from '../src/studio-editor.ts';
import type { StudioView } from '../src/studio-view.ts';

test('studio DOM workflow adds, sizes, connects, undoes, poses and plays a real surface move',()=>{
  const window=new Window();Object.assign(globalThis,{document:window.document,Option:function(text="",value=""){const o=window.document.createElement("option");o.textContent=text;o.value=value;return o;}});
  const host=window.document.createElement('div');window.document.body.append(host);
  const root=new T.Group();root.add(new T.Mesh(new T.SphereGeometry(.5,10,10)));root.updateMatrixWorld(true);
  const rig=new StudioRig(root);let resumed=0;let feedback='';
  const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onAdd:(_p:T.Vector3,_mesh?:number)=>{},onSelect:(_id:string)=>{},onConnect:(_id:string)=>{}};
  const editor=new StudioEditor(rig,view as unknown as StudioView,host as unknown as HTMLElement,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]}},{suspend(){},resume(){resumed++;},changed(){},feedback(s){feedback=s;}});
  const click=(id:string)=>(host.querySelector(`#${id}`) as unknown as HTMLButtonElement).click();
  const value=(id:string,text:string,change=true)=>{const e=host.querySelector(`#${id}`) as unknown as HTMLInputElement;e.value=text;if(change)e.dispatchEvent(new window.Event('change') as unknown as Event);};
  editor.enter();click('mode-rig');view.onAdd(new T.Vector3(0,.5,0),0);const a=rig.data.points[0].id;
  value('point-name','Mund links');value('point-size','.006');assert.equal(rig.data.points[0].size,.006);
  view.onAdd(new T.Vector3(.1,.45,0),0);const b=rig.data.points[1].id;view.onConnect(a);assert.equal(rig.data.links.length,1);
  click('studio-undo');assert.equal(rig.data.links.length,0);click('studio-redo');assert.equal(rig.data.links.length,1);
  click('mode-pose');value('pose-name','Neutral',false);click('pose-add');view.onSelect(b);value('point-y','.55');value('pose-name','Lächeln',false);click('pose-add');
  value('move-name','Lächeln',false);value('move-id','laecheln',false);click('move-add');assert.equal(editor.data.moves.length,1);assert.equal(editor.data.poses.length,2);assert.equal(feedback.includes('Schlagwort'),false);
  assert.ok(editor.play('laecheln'));editor.update(.5);const p=editor.data.points.find(p=>p.id===b)!;assert.ok(Math.abs(rig.position(p).y-.5)<1e-6);
  editor.update(.6);assert.equal(editor.playing,false);assert.equal(resumed,1);
  editor.enter();click('mode-rig');view.onSelect(a);click('point-delete');assert.equal(editor.data.points.length,1);assert.equal(editor.data.links.length,0);assert.ok(editor.data.poses.every(p=>!p.values[a]));click('studio-undo');assert.equal(editor.data.points.length,2);
  const bytes=new Uint8Array([0,255,128,10]);assert.deepEqual(new Uint8Array(decodeModel(encodeModel(bytes.buffer))),bytes);
  editor.dispose();window.happyDOM.abort();
});
