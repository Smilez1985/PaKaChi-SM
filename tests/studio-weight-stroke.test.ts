import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {parseProject} from '../src/studio-data.ts';
function fixture(){
 const root=new T.Group(),hip=new T.Bone(),foot=new T.Bone();hip.name='Hip';foot.name='Foot';foot.position.y=2;hip.add(foot);root.add(hip);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([.1,0,0,.1,1.5,0,.1,2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([hip,foot]));const rig=new StudioRig(root);
 return {root,hip,foot,mesh,rig};
}
const project=(rig:StudioRig)=>({format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data});
const vertex=(mesh:T.SkinnedMesh,i:number)=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
import {StudioWeightStroke} from '../src/studio-weight-stroke.ts';
import {StudioWeightPointer} from '../src/studio-weight-pointer.ts';
test('weight brush uses spatial sampling, preserves rest skin and rolls back cancelled or over-budget strokes',()=>{
 const run=(steps:number)=>{const {rig,mesh}=fixture(),before=[0,1,2].map(i=>vertex(mesh,i)),stroke=new StudioWeightStroke(rig,rig.data.points[0],rig.data.points[1],.2,1);
 for(let i=0;i<=steps;i++)stroke.sample(new T.Vector3(.1,i/steps,0));assert.ok(stroke.finish());before.forEach((v,i)=>assert.ok(vertex(mesh,i).distanceTo(v)<1e-6));parseProject(project(rig));return {rig,mesh};};
 const a=run(2),b=run(40);assert.equal(a.rig.data.weightTransfers!.length,b.rig.data.weightTransfers!.length);const aw=a.mesh.geometry.getAttribute('skinWeight'),bw=b.mesh.geometry.getAttribute('skinWeight');for(let i=0;i<aw.array.length;i++)assert.ok(Math.abs(aw.array[i]-bw.array[i])<1e-6);
 const before=structuredClone(a.rig.data),stroke=new StudioWeightStroke(a.rig,a.rig.data.points[0],a.rig.data.points[1],.2,1);stroke.sample(new T.Vector3(.1,0,0));stroke.cancel();assert.deepEqual(a.rig.data,before);
 const limited=fixture();limited.rig.data.weightTransfers=Array.from({length:1023},()=>({from:0,to:1,amount:.01,after:0}));limited.rig.reset();const snapshot=structuredClone(limited.rig.data),full=new StudioWeightStroke(limited.rig,limited.rig.data.points[0],limited.rig.data.points[1],.2,1);full.sample(new T.Vector3(.1,0,0));assert.throws(()=>full.sample(new T.Vector3(.1,.5,0)));assert.deepEqual(limited.rig.data,snapshot);
});
test('empty brush regions and surface gaps do not bridge disconnected surfaces or dirty the project',()=>{
 const {rig}=fixture(),before=structuredClone(rig.data),empty=new StudioWeightStroke(rig,rig.data.points[0],rig.data.points[1],.2,.2);empty.sample(new T.Vector3(4,4,0));assert.equal(empty.finish(),false);assert.deepEqual(rig.data,before);
 const stroke=new StudioWeightStroke(rig,rig.data.points[0],rig.data.points[1],.2,.2);stroke.sample(new T.Vector3(.1,0,0));stroke.sample(null);stroke.sample(new T.Vector3(.1,1.5,0));assert.ok(stroke.finish());assert.equal(rig.data.weightTransfers!.length,2);
});
test('captured weight pointer handles release, cancellation, navigation and listener cleanup',()=>{
 const w=new Window(),canvas=w.document.createElement('canvas');let capture=false;canvas.setPointerCapture=()=>{capture=true;};canvas.hasPointerCapture=()=>capture;canvas.releasePointerCapture=()=>{capture=false;};const navigation={enabled:true},ends:boolean[]=[],samples:(T.Vector3|null)[]=[];
 const pointer=new StudioWeightPointer(canvas as unknown as HTMLCanvasElement,(x,y)=>new T.Vector3(x,y,0),()=>true,p=>samples.push(p),c=>ends.push(c),navigation);pointer.enabled=true;
 const fire=(type:string,button=0)=>canvas.dispatchEvent(new w.PointerEvent(type,{pointerId:1,button,clientX:1,clientY:2,bubbles:true}));
 fire('pointerdown',1);assert.equal(samples.length,0);fire('pointerdown');assert.equal(navigation.enabled,false);fire('pointermove');fire('pointerup');assert.deepEqual(ends,[false]);assert.equal(navigation.enabled,true);assert.equal(capture,false);
 fire('pointerdown');fire('pointercancel');assert.deepEqual(ends,[false,true]);fire('pointerdown');pointer.dispose();assert.deepEqual(ends,[false,true,true]);fire('pointerdown');assert.equal(ends.length,3);w.happyDOM.abort();
});
test('editor groups a complete brush stroke into one undo step and blocks concurrent agent edits',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const {rig}=fixture(),host=document.createElement('div');const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onSelect:(_id:string)=>{},onBrushStart:()=>false,onBrushSample:(_p:T.Vector3|null)=>{},onBrushEnd:(_c:boolean)=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,project(rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();const click=(id:string)=>host.querySelector<HTMLButtonElement>('#'+id)!.click();click('mode-rig');view.onSelect(rig.data.points[0].id);host.querySelector<HTMLSelectElement>('#weight-target')!.value=rig.data.points[1].id;
 const before=structuredClone(rig.data),revision=editor.inspect().revision;assert.ok(view.onBrushStart());assert.equal(editor.interactionActive,true);view.onBrushSample(new T.Vector3(.1,0,0));view.onBrushSample(new T.Vector3(.1,.1,0));assert.equal(editor.inspect().revision,revision);assert.equal(editor.inspect().editable,false);view.onBrushEnd(false);assert.equal(editor.inspect().revision,revision+1);assert.ok(rig.data.weightTransfers!.length>1);parseProject(editor.exportProject());click('studio-undo');assert.deepEqual(rig.data,before);click('studio-redo');assert.ok(rig.data.weightTransfers!.length>1);editor.dispose();w.happyDOM.abort();
});
