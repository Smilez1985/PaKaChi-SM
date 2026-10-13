import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {detectJoints,detectConnections} from '../src/studio-detection.ts';
import {MouseNavigation} from '../src/mouse-navigation.ts';
import {readOptions,translateRoot,updateOptions} from '../src/options.ts';
const setup=()=>{const w=new Window();Object.assign(globalThis,{window:w,document:w.document,MutationObserver:w.MutationObserver,Event:w.Event,localStorage:w.localStorage,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});return w;};
test('detection preserves manual groups; individual removal and restoration survive undo',()=>{
 const w=setup(),root=new T.Group(),a=new T.Bone(),b=new T.Bone();a.name='Kopf';b.name='Kiefer';root.add(a);a.add(b);b.position.y=.2;const rig=new StudioRig(root);
 const view={setEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onAdd:(_p:T.Vector3)=>{},onSelect:(_id:string)=>{}};const host=document.createElement('div');let feedback='';
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(s){feedback=s;}});
 const click=(id:string)=>host.querySelector<HTMLButtonElement>(`#${id}`)!.click();editor.enter();click('mode-rig');view.onAdd(new T.Vector3(1,0,0));const manual=structuredClone(rig.data.points[2]);
 click('detect-links');assert.deepEqual(rig.data.links,[['bone-0','bone-1']]);click('detect-links');assert.equal(rig.data.links.length,1);assert.match(feedback,/Keine zusätzlichen/);
 host.querySelector<HTMLButtonElement>('#studio-links button')!.click();assert.equal(rig.data.links.length,0);click('studio-undo');assert.equal(rig.data.links.length,1);
 view.onSelect('bone-1');click('point-delete');assert.equal(rig.data.points.length,2);click('detect-joints');assert.equal(rig.data.points.length,3);assert.deepEqual(rig.data.points.find(p=>p.id===manual.id),manual);assert.equal(detectJoints(rig).length,0);click('detect-links');assert.equal(rig.data.links.length,1);
 const empty=new StudioRig(new T.Group());assert.deepEqual(detectJoints(empty),[]);assert.deepEqual(detectConnections(empty),[]);editor.dispose();w.happyDOM.abort();
});
test('middle drag rotates, inversion reverses direction, release restores navigation',()=>{
 const w=setup(),canvas=document.createElement('canvas');canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:400} as DOMRect);let captured=false;canvas.setPointerCapture=()=>{captured=true;};canvas.hasPointerCapture=()=>captured;canvas.releasePointerCapture=()=>{captured=false;};
 const camera=new T.PerspectiveCamera();const target=new T.Vector3(0,1,0);let inverted=false,suspended=false,syncs=0;const reset=()=>{camera.up.set(0,1,0);camera.position.set(0,1,5);camera.lookAt(target);camera.updateMatrixWorld(true);};reset();
 const nav=new MouseNavigation(canvas,camera,()=>target,active=>{suspended=active;},()=>{syncs++;},()=>inverted);
 const pointer=(type:string,x:number,y:number,button=1)=>canvas.dispatchEvent(new w.PointerEvent(type,{button,pointerId:3,clientX:x,clientY:y,bubbles:true,cancelable:true}) as unknown as Event);
 pointer('pointerdown',200,200);assert.equal(suspended,true);pointer('pointermove',250,200);const normal=camera.position.clone();assert.ok(Math.abs(normal.x)>.1);assert.ok(Math.abs(camera.position.distanceTo(target)-5)<1e-10);pointer('pointerup',250,200);assert.equal(suspended,false);assert.equal(captured,false);
 reset();inverted=true;pointer('pointerdown',200,200);pointer('pointermove',250,200);assert.ok(Math.abs(normal.x+camera.position.x)<1e-10);pointer('pointercancel',250,200);assert.equal(suspended,false);assert.equal(syncs,2);nav.dispose();w.happyDOM.abort();
});
test('language switches back and forth, translates new controls, preserves user names and saves options',async()=>{
 const w=setup();assert.deepEqual(readOptions({getItem:()=>'{broken'}),{language:'de',invertMiddleRotation:false});const host=document.createElement('div');host.innerHTML='<button>Gelenke bearbeiten</button><input placeholder="z. B. Hand oben"><span data-user-text>Gelenke bearbeiten</span>';document.body.append(host);const dispose=translateRoot(host);
 updateOptions({language:'en',invertMiddleRotation:true});assert.equal(host.querySelector('button')!.textContent,'Edit joints');assert.equal(host.querySelector('input')!.placeholder,'e.g. Hand up');assert.equal(host.querySelector('span')!.textContent,'Gelenke bearbeiten');assert.equal(readOptions().invertMiddleRotation,true);
 const fresh=document.createElement('button');fresh.textContent='Verbindung entfernen';host.append(fresh);await w.happyDOM.whenAsyncComplete();assert.equal(fresh.textContent,'Remove connection');updateOptions({language:'de',invertMiddleRotation:false});assert.equal(fresh.textContent,'Verbindung entfernen');assert.equal(host.querySelector('button')!.textContent,'Gelenke bearbeiten');dispose();w.happyDOM.abort();
});
test('direct point drag changes a real rig and records one undo gesture',async()=>{
 const {StudioView}=await import('../src/studio-view.ts');const w=setup(),canvas=document.createElement('canvas');document.body.append(canvas);canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:400} as DOMRect);canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
 const root=new T.Group(),bone=new T.Bone();root.add(bone);const rig=new StudioRig(root),camera=new T.PerspectiveCamera(45,1,.1,100);camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);const orbit={enabled:true,target:new T.Vector3()};const view=new StudioView(rig,camera,canvas,orbit,new T.Scene());view.onSelect=id=>view.select(id);let starts=0,ends=0;view.onStart=()=>{starts++;};view.onMove=(p,q)=>rig.setPoint(rig.data.points[0],p,q,true);view.onEnd=()=>{ends++;};view.setEnabled(true);
 const pointer=(type:string,x:number)=>canvas.dispatchEvent(new w.PointerEvent(type,{button:0,pointerId:5,clientX:x,clientY:200,bubbles:true,cancelable:true}) as unknown as Event);
 pointer('pointerdown',200);pointer('pointermove',240);pointer('pointerup',240);assert.ok(rig.position(rig.data.points[0]).x>.1);assert.equal(starts,1);assert.equal(ends,1);assert.equal(orbit.enabled,true);view.dispose();w.happyDOM.abort();
});
