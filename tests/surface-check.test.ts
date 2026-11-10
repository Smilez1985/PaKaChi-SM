import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {checkSurfaceShape} from '../src/surface-check.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {checkPoseSurface,poseSurfacePositions,suggestGentlerPose,neutralPoseValues} from '../src/pose-surface-check.ts';
import {Window} from 'happy-dom';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';

const triangle=[0,0,0,1,0,0,0,1,0];
test('triangle strain ignores rigid motion and measures principal stretches, shear and collapse',()=>{
  const rigid=[4,2,3,4,2,4,4,3,3],report=checkSurfaceShape(triangle,rigid);assert.equal(report.status,'within');assert.equal(report.maximumStretch,1);assert.equal(report.minimumStretch,1);
  const stretched=checkSurfaceShape(triangle,[0,0,0,4,0,0,0,1,0]);assert.equal(stretched.stretched,1);assert.equal(stretched.maximumStretch,4);assert.equal(stretched.minimumStretch,1);
  const shear=checkSurfaceShape(triangle,[0,0,0,1,0,0,4,1,0]);assert.ok(shear.maximumStretch!>4);assert.ok(shear.minimumStretch!<.25);assert.equal(shear.compressed,1);
  const flat=checkSurfaceShape(triangle,[0,0,0,1,0,0,2,0,0]);assert.equal(flat.collapsed,1);assert.equal(flat.issues,1);assert.equal(flat.minimumStretch,0);
});
test('invalid or degenerate references never silently pass and topology must match',()=>{
  const degenerate=checkSurfaceShape([0,0,0,1,0,0,2,0,0],triangle);assert.equal(degenerate.referenceDegenerate,1);assert.equal(degenerate.status,'unmeasurable');
  const invalid=checkSurfaceShape(triangle,[NaN,0,0,1,0,0,0,1,0]);assert.equal(invalid.invalid,1);assert.equal(invalid.status,'outside');
  assert.throws(()=>checkSurfaceShape(triangle,triangle,[0,1,3]));assert.throws(()=>checkSurfaceShape(triangle,triangle,[0,1]));assert.throws(()=>checkSurfaceShape(triangle,[0,0,0]));
  const tiny=triangle.map(v=>v*1e-9);assert.equal(checkSurfaceShape(tiny,tiny).status,'within');
});
function fixture(){
  const root=new T.Group(),a=new T.Bone(),b=new T.Bone();b.position.y=1;a.add(b);root.add(a);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,0,0,1,0,0,-1,1,0,1,1,0],3));geometry.setIndex([0,1,2,2,1,3]);geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],4));
  const body=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());body.name='Body';root.add(body);root.updateMatrixWorld(true);body.bind(new T.Skeleton([a,b]));
  const prop=new T.Mesh(new T.BoxGeometry(.1,.1,.1),new T.MeshBasicMaterial());prop.name='Attached prop';b.add(prop);prop.position.x=.2;
  const rig=new StudioRig(root),point=rig.data.points.find(p=>p.bone===1)!;const pose={id:'stretched',name:'Stretched',seconds:1,values:rig.capture()};pose.values[point.id].position[1]=8;
  return {root,rig,body,point,pose,bodyIndex:rig.surfaces.findIndex(s=>s.mesh===body)};
}
test('pure pose evaluation agrees with actual skinned and bone-attached geometry and preserves the live model',()=>{
  const f=fixture(),live=f.rig.capture(),data=JSON.stringify(f.rig.data),matrices=f.rig.bones.map(b=>b.matrixWorld.toArray());
  const predicted=f.rig.surfaces.map((_,i)=>poseSurfacePositions(f.rig,f.pose.values,i));assert.deepEqual(f.rig.capture(),live);assert.equal(JSON.stringify(f.rig.data),data);assert.deepEqual(f.rig.bones.map(b=>b.matrixWorld.toArray()),matrices);
  f.rig.apply(f.pose.values);const inverse=f.root.matrixWorld.clone().invert();
  f.rig.surfaces.forEach(({mesh},m)=>{const point=new T.Vector3();for(let i=0;i<predicted[m].length/3;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);assert.ok(point.distanceTo(new T.Vector3().fromArray(predicted[m],i*3))<1e-6);}});
  f.rig.apply(live);f.rig.dispose();
});
test('figure motion is excluded, surface controls are included, and real skin defects produce warnings',()=>{
  const f=fixture(),report=checkPoseSurface(f.rig,f.pose);assert.equal(report.status,'outside');assert.ok(report.meshes.every(m=>typeof m.intersections.checked==='boolean'));assert.equal(report.meshes[f.bodyIndex].stretched,2);assert.equal(report.meshes[f.bodyIndex].maximumStretch,8);assert.equal(report.meshes.find(m=>m.name==='Attached prop')!.issues,0);
  const rest=neutralPoseValues(f.rig);rest.$figure={position:[10,20,30],rotation:[0,0,Math.sin(.5),Math.cos(.5)],scale:4};assert.equal(checkPoseSurface(f.rig,{...f.pose,values:rest}).status,'within');
  const point={id:'face',name:'Face',kind:'surface' as const,mesh:f.bodyIndex,rest:[-1,0,0] as [number,number,number],radius:.2,size:.02};f.rig.data.points.push(point);const values=neutralPoseValues(f.rig);values.face.position=[-10,0,0];assert.equal(checkPoseSurface(f.rig,{...f.pose,values}).status,'outside');f.rig.dispose();
});
test('gentler proposal reduces measured strain without modifying stored poses, bone rest or current geometry',async()=>{
  const f=fixture(),data=JSON.stringify(f.rig.data),live=f.rig.capture(),positions=Array.from(f.body.geometry.attributes.position.array),proposal=await suggestGentlerPose(f.rig,f.pose,new AbortController().signal);
  assert.ok(proposal);assert.equal(proposal.fraction,.25);assert.equal(proposal.report.status,'within');assert.equal(proposal.report.meshes[f.bodyIndex].maximumStretch,2.75);assert.equal(JSON.stringify(f.rig.data),data);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(Array.from(f.body.geometry.attributes.position.array),positions);assert.equal(f.pose.values[f.point.id].position[1],8);f.rig.dispose();
});
test('aborted/stale proposals and nonmeasurable surfaces cannot return a correction',async()=>{
  const f=fixture(),controller=new AbortController(),pending=suggestGentlerPose(f.rig,f.pose,controller.signal);controller.abort();await assert.rejects(()=>pending,{name:'AbortError'});
  let valid=true;const stale=suggestGentlerPose(f.rig,f.pose,new AbortController().signal,()=>valid);valid=false;await assert.rejects(()=>stale,/geändert/);
  assert.equal(await suggestGentlerPose(f.rig,{...f.pose,values:neutralPoseValues(f.rig)},new AbortController().signal),null);f.rig.dispose();
});
test('existing morph targets, detached skins and edited bind frames use the actual skinning equation',()=>{
  const f=fixture(),geometry=f.body.geometry;geometry.morphAttributes.position=[new T.Float32BufferAttribute([0,0,0,0,0,0,0,.5,0,0,.5,0],3)];geometry.morphTargetsRelative=true;f.body.updateMorphTargets();f.body.morphTargetInfluences![0]=.6;
  f.rig.setPoint(f.point,new T.Vector3(0,1.2,.1),new T.Quaternion(),true);const values=f.rig.capture();values[f.point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.4).toArray();const predicted=poseSurfacePositions(f.rig,values,f.bodyIndex);f.rig.apply(values);const inv=f.root.matrixWorld.clone().invert();
  for(let i=0;i<4;i++){const actual=f.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(f.body.matrixWorld).applyMatrix4(inv);assert.ok(actual.distanceTo(new T.Vector3().fromArray(predicted,i*3))<1e-6);}
  f.body.bindMode='detached';f.body.position.x=.3;f.body.updateMatrix();f.root.updateMatrixWorld(true);const detached=poseSurfacePositions(f.rig,values,f.bodyIndex);f.rig.apply(values);
  for(let i=0;i<4;i++){const actual=f.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(f.body.matrixWorld).applyMatrix4(inv);assert.ok(actual.distanceTo(new T.Vector3().fromArray(detached,i*3))<1e-6);}f.rig.dispose();
});
function editorFixture(){
  const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const el=w.document.createElement('option');el.textContent=text;el.value=value;return el;}});
  const f=fixture();f.rig.data.poses=[f.pose];f.rig.data.moves=[{id:'move',name:'Move',loop:false,poses:[f.pose.id,f.pose.id]}];const host=document.createElement('div'),feedback:string[]=[],view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
  const editor=new StudioEditor(f.rig,view as unknown as StudioView,host,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback:s=>feedback.push(s)});editor.enter();return {...f,w,host,editor,feedback};
}
test('surface report is read-only and a proposed pose is an explicit new undoable pose',async()=>{
  const f=editorFixture(),before=f.editor.exportProject(),revision=f.editor.inspect().revision;f.host.querySelector<HTMLButtonElement>('#pose-check-surface')!.click();assert.match(f.host.querySelector('#pose-surface-result')!.textContent!,/Auffällige/);assert.deepEqual(f.editor.exportProject(),before);assert.equal(f.editor.inspect().revision,revision);assert.equal(f.editor.dirty,false);
  const result=await f.editor.createGentlerPose(f.pose.id);assert.ok(result);assert.equal(f.rig.data.poses.length,2);assert.deepEqual(f.rig.data.poses[0],before.studio.poses[0]);assert.deepEqual(f.rig.data.moves,before.studio.moves);assert.equal(f.editor.checkPoseSurface(result.id).status,'within');assert.equal(f.rig.capture()[f.point.id].position[1],2.75);
  f.host.querySelector<HTMLButtonElement>('#studio-undo')!.click();assert.deepEqual(f.editor.exportProject().studio.poses,before.studio.poses);f.host.querySelector<HTMLButtonElement>('#studio-redo')!.click();assert.equal(f.rig.data.poses.length,2);f.editor.dispose();f.w.happyDOM.abort();
});
test('editing, cancellation, pose selection and leaving prevent stale correction publication',async()=>{
  for(const action of ['edit','cancel','select','leave']){
    const f=editorFixture();f.rig.data.poses.push({...structuredClone(f.pose),id:'other'});f.editor.restoreDirty(false);const before=structuredClone(f.rig.data.poses),pending=f.editor.createGentlerPose(f.pose.id);
    if(action==='edit')f.host.querySelector<HTMLButtonElement>('#pose-reset')!.click();
    if(action==='cancel')f.host.querySelector<HTMLButtonElement>('#pose-surface-cancel')!.click();
    if(action==='select'){const list=f.host.querySelector<HTMLSelectElement>('#pose-list')!;list.value='other';list.dispatchEvent(new f.w.Event('change') as unknown as Event);}
    if(action==='leave')f.editor.leave();
    await assert.rejects(()=>pending);assert.deepEqual(f.rig.data.poses,before);assert.equal(f.host.querySelector<HTMLButtonElement>('#pose-surface-cancel')!.disabled,true);f.editor.dispose();f.w.happyDOM.abort();
  }
});
