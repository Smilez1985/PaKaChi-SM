import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import {StudioView} from '../src/studio-view.ts';
function fixture(){
 const root=new T.Group(),hip=new T.Bone(),foot=new T.Bone();hip.name='Hip';foot.name='Foot';foot.position.y=2;hip.add(foot);root.add(hip);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([.1,0,0,.1,1.5,0,.1,2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh:T.SkinnedMesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([hip,foot]));const rig=new StudioRig(root);
 return {root,hip,foot,mesh,rig};
}
const project=(rig:StudioRig)=>({format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data});
import {StudioWeightColors} from '../src/studio-weight-colors.ts';
test('weight colors read skin palettes and restore original materials and color attributes exactly',()=>{
 const {rig,mesh}=fixture(),original=mesh.material,colors=new T.Float32BufferAttribute([.1,.2,.3,.4,.5,.6,.7,.8,.9],3);mesh.geometry.setAttribute('color',colors);const data=structuredClone(rig.data),weights=Array.from(mesh.geometry.getAttribute('skinWeight').array),display=new StudioWeightColors();
 display.show([mesh],rig.bones[0]);assert.notEqual(mesh.material,original);const attr=mesh.geometry.getAttribute('color');assert.deepEqual([attr.getX(0),attr.getY(0),attr.getZ(0)],[1,0,0]);assert.ok(Math.abs(attr.getX(2))+Math.abs(attr.getY(2))+Math.abs(attr.getZ(2)-1)<1e-6);
 rig.transferWeights(rig.data.points[0],rig.data.points[1],.5);display.show([mesh],rig.bones[0]);assert.ok(attr.getY(0)>.99);display.show([mesh],rig.bones[1]);assert.ok(attr.getX(2)>.99);
 const overlay=mesh.material as T.Material;let freed=0;overlay.addEventListener('dispose',()=>freed++);display.clear();assert.equal(mesh.material,original);assert.equal(mesh.geometry.getAttribute('color'),colors);assert.equal(freed,1);display.clear();assert.equal(freed,1);
 rig.data=data;rig.reset();assert.deepEqual(Array.from(mesh.geometry.getAttribute('skinWeight').array),weights);mesh.geometry.deleteAttribute('color');mesh.material=[original as T.Material,(original as T.Material).clone()];const materials=mesh.material;display.show([mesh],rig.bones[1]);assert.equal((mesh.material as T.Material[]).length,2);display.dispose();assert.equal(mesh.material,materials);assert.equal(mesh.geometry.getAttribute('color'),undefined);display.show([mesh],rig.bones[0]);assert.equal(mesh.material,materials);
});
test('editor weight view is transient, follows selection and brush/undo, and restores materials on mode change and exit',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const {rig,mesh}=fixture(),original=mesh.material,canvas=document.createElement('canvas');canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:400} as DOMRect);canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.1,100);camera.position.z=5;camera.updateMatrixWorld(true);const view=new StudioView(rig,camera,canvas,{enabled:true,target:new T.Vector3()},scene),host=document.createElement('div'),editor=new StudioEditor(rig,view,host,project(rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();const click=(id:string)=>host.querySelector<HTMLButtonElement>('#'+id)!.click();click('mode-rig');view.onSelect(rig.data.points[0].id);
 const before=structuredClone(rig.data),revision=editor.inspect().revision,box=host.querySelector<HTMLInputElement>('#weight-colors')!;box.checked=true;box.dispatchEvent(new w.Event('change') as unknown as Event);assert.notEqual(mesh.material,original);assert.deepEqual(rig.data,before);assert.equal(editor.inspect().revision,revision);assert.equal(editor.dirty,false);
 host.querySelector<HTMLSelectElement>('#weight-target')!.value=rig.data.points[1].id;assert.ok(view.onBrushStart());view.onBrushSample(new T.Vector3(.1,0,0));view.onBrushEnd(false);assert.ok(mesh.geometry.getAttribute('color').getY(0)>.99);click('studio-undo');assert.ok(mesh.geometry.getAttribute('color').getX(0)>.99);click('studio-redo');assert.ok(mesh.geometry.getAttribute('color').getY(0)>.99);
 view.onSelect(rig.data.points[1].id);assert.ok(mesh.geometry.getAttribute('color').getX(2)>.99);click('mode-pose');assert.equal(mesh.material,original);click('mode-rig');assert.notEqual(mesh.material,original);editor.leave();assert.equal(mesh.material,original);assert.equal(mesh.geometry.getAttribute('color'),undefined);editor.enter();assert.notEqual(mesh.material,original);editor.dispose();assert.equal(mesh.material,original);w.happyDOM.abort();
});
