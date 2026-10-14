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
 const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onAdd:(_p:T.Vector3)=>{},onSelect:(_id:string)=>{}};const host=document.createElement('div');let feedback='';
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
test('boneless editor saves whole-figure poses, undoes translation and plays the persisted move',()=>{
 const w=setup(),root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry()));const rig=new StudioRig(root),host=document.createElement('div');const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'box',name:'Box',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});
 const click=(id:string)=>host.querySelector<HTMLButtonElement>(`#${id}`)!.click();const value=(id:string,text:string)=>{const input=host.querySelector<HTMLInputElement>(`#${id}`)!;input.value=text;input.dispatchEvent(new w.Event('change') as unknown as Event);};
 editor.enter();click('figure-select');assert.equal(rig.data.points.length,0);click('pose-add');value('point-x','1');assert.equal(rig.capture()['$figure'].position[0],1);click('studio-undo');assert.equal(rig.capture()['$figure'].position[0],0);click('studio-redo');assert.equal(rig.capture()['$figure'].position[0],1);click('pose-add');value('move-name','Gleiten');value('move-id','gleiten');click('move-add');assert.equal(rig.data.moves.length,1);
 assert.equal(editor.play('gleiten'),true);editor.update(.5);assert.ok(Math.abs(root.position.x-.5)<1e-8);editor.update(1);assert.equal(root.position.x,0,'return to source resets the global offset');
 editor.enter();click('mode-rig');assert.equal(host.querySelector<HTMLButtonElement>('#figure-select')!.hidden,true);assert.equal(host.querySelector<HTMLSelectElement>('#studio-points')!.querySelector('[value="$figure"]'),null);editor.dispose();w.happyDOM.abort();
});
test('review workflow tracks rig edits, undo, acknowledgement and replacement without losing poses',()=>{
 const w=setup(),root=new T.Group(),bone=new T.Bone();root.add(bone);const rig=new StudioRig(root),host=document.createElement('div');const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onSelect:(_id:string)=>{},onStart:()=>{},onMove:(_p:T.Vector3,_q:T.Quaternion)=>{},onEnd:()=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});
 const click=(id:string)=>host.querySelector<HTMLButtonElement>(`#${id}`)!.click();const change=(id:string,text:string)=>{const input=host.querySelector<HTMLInputElement>(`#${id}`)!;input.value=text;input.dispatchEvent(new w.Event('change') as unknown as Event);};
 editor.enter();click('pose-add');click('pose-add');change('move-id','test');change('move-name','Test');click('move-add');click('mode-rig');view.onSelect('bone-0');view.onStart();view.onMove(new T.Vector3(.1,0,0),new T.Quaternion());view.onEnd();assert.ok(rig.data.poses.every(p=>p.review?.includes('bone-rest')));assert.equal(rig.data.moves.length,1);assert.equal(host.querySelector<HTMLSelectElement>('#studio-moves')!.value,'test');assert.equal(host.querySelector<HTMLElement>('#move-review')!.hidden,false);
 click('studio-undo');assert.ok(rig.data.poses.every(p=>!p.review));click('studio-redo');assert.ok(rig.data.poses.every(p=>p.review?.length));
 click('mode-pose');click('pose-show');click('pose-reviewed');assert.equal(rig.data.poses[0].review,undefined);assert.ok(rig.data.poses[1].review?.length);change('pose-list',rig.data.poses[1].id);click('pose-show');click('pose-replace');assert.ok(rig.data.poses.every(p=>!p.review));assert.equal(host.querySelector<HTMLElement>('#move-review')!.hidden,true);
 click('studio-undo');assert.ok(rig.data.poses[1].review?.length);assert.equal(editor.play('test',true),true,'review does not block preview');editor.dispose();w.happyDOM.abort();
});
test('whole-figure rotation UI supports gestures, undo and stored moves without rig-review warnings',()=>{
 const w=setup(),root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry()));const rig=new StudioRig(root),host=document.createElement('div');let rotating=false;const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(v:boolean){rotating=v;},select(){},refresh(){},dispose(){},onStart:()=>{},onMove:(_p:T.Vector3,_q:T.Quaternion)=>{},onEnd:()=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});const click=(id:string)=>host.querySelector<HTMLButtonElement>(`#${id}`)!.click();editor.enter();click('figure-select');assert.equal(host.querySelector<HTMLElement>('#rotation-label')!.hidden,false);click('pose-add');const select=host.querySelector<HTMLSelectElement>('#point-transform')!;select.value='rotate';select.dispatchEvent(new w.Event('change') as unknown as Event);assert.equal(rotating,true);
 const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2);view.onStart();view.onMove(rig.position(rig.figure),q);view.onEnd();click('pose-add');assert.ok(new T.Quaternion().fromArray(rig.data.poses[1].values['$figure'].rotation).angleTo(q)<1e-6);assert.ok(rig.data.poses.every(p=>!p.review));click('studio-undo');click('studio-undo');assert.ok(rig.rotation(rig.figure).angleTo(new T.Quaternion())<1e-6);click('studio-redo');assert.ok(rig.rotation(rig.figure).angleTo(q)<1e-6);editor.dispose();w.happyDOM.abort();
});

test('middle orbit uses a frozen model center and syncs real Arcball after an off-center zoom/pan',async()=>{
 const {ArcballControls}=await import('three/addons/controls/ArcballControls.js');const w=setup(),canvas=document.createElement('canvas');document.body.append(canvas);canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:400} as DOMRect);canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
 const camera=new T.PerspectiveCamera(34,1,.01,100),pivot=new T.Vector3(0,1.2,0),focus=new T.Vector3(.5,1.7,0);camera.position.copy(focus).add(new T.Vector3(0,0,3));camera.lookAt(focus);camera.updateMatrixWorld(true);
 const controls=new ArcballControls(camera,canvas,new T.Scene()) as InstanceType<typeof ArcballControls> & {target:T.Vector3};controls.unsetMouseAction(1);controls.target.copy(focus);controls.setCamera(camera);camera.updateMatrixWorld(true);const live=controls as typeof controls & {_gizmos:T.Group};let reads=0;
 const nav=new MouseNavigation(canvas,camera,()=>{reads++;return pivot;},active=>{controls.enabled=!active;},(q,center)=>{controls.target.copy(live._gizmos.position).sub(center).applyQuaternion(q).add(center);controls.setCamera(camera);},()=>false);
 const radius=camera.position.distanceTo(pivot),screen=pivot.clone().project(camera),fixed=pivot.clone();
 const pointer=(type:string,x:number,y:number)=>canvas.dispatchEvent(new w.PointerEvent(type,{button:1,pointerId:9,clientX:x,clientY:y,bubbles:true,cancelable:true}) as unknown as Event);
 pointer('pointerdown',200,200);pivot.x=8;pointer('pointermove',220,205);pointer('pointermove',240,210);pointer('pointerup',240,210);controls.update();camera.updateMatrixWorld(true);
 assert.equal(reads,1,'compute model bounds only at gesture start');assert.ok(Math.abs(camera.position.distanceTo(fixed)-radius)<1e-8);const after=fixed.clone().project(camera);assert.ok(Math.hypot(after.x-screen.x,after.y-screen.y)<1e-8,JSON.stringify({before:screen.toArray(),after:after.toArray()}));assert.equal(controls.enabled,true);nav.dispose();controls.dispose();w.happyDOM.abort();
});
