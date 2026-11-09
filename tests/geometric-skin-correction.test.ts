import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Window} from 'happy-dom';
import {twistFixture} from './helpers/twist-fixture.ts';
import {buildGeometricCorrection,dualQuaternionPoint} from '../src/geometric-skin-correction.ts';
import {validCorrectiveShapes,MAX_CORRECTIVE_VERTICES} from '../src/studio-corrective-shapes.ts';
import {createPoseSurfaceChecker,neutralPoseValues,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {findAutomaticSkinCorrection} from '../src/automatic-skin-correction.ts';
import {noMeasuredRegression} from '../src/pose-weight-correction.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {StudioEditor} from '../src/studio-editor.ts';
import type {StudioView} from '../src/studio-view.ts';
import {parseProject} from '../src/studio-data.ts';
import {poseMorphBindings} from '../src/pose-morphs.ts';
import {captureMoveGLB} from '../src/move-glb.ts';
import {disposeStaticFigure,exportRiggedFigureGLB} from '../src/figure-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
// @ts-expect-error Node's existing package export utility is JavaScript.
import {zooPackage} from '../scripts/export-zoo.mjs';
import {exportMoveFile,importMoveFile} from '../src/move-file.ts';
function fixture(){const f=twistFixture(false,true);f.pose.values[f.joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2).toArray();return f;}
function project(rig:StudioRig){return {format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]},studio:structuredClone(rig.data)};}
test('dual quaternion blend reproduces rigid motion and rejects scale and reflection',()=>{
 const p=new T.Vector3(.2,1,.3),a=new T.Matrix4(),b=new T.Matrix4().compose(new T.Vector3(1,2,3),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),new T.Vector3(1,1,1));
 assert.ok(dualQuaternionPoint(p,[b],[1])!.distanceTo(p.clone().applyMatrix4(b))<1e-12);const mid=dualQuaternionPoint(new T.Vector3(1,0,0),[a,new T.Matrix4().makeRotationY(Math.PI/2)],[.5,.5])!;assert.ok(Math.abs(mid.length()-1)<1e-12);assert.equal(dualQuaternionPoint(p,[new T.Matrix4().makeScale(2,1,1)],[1]),null);assert.equal(dualQuaternionPoint(p,[new T.Matrix4().makeScale(-1,1,1)],[1]),null);
});
test('read-only geometric candidate restores measured volume without changing pose angles or skin',()=>{
 const f=fixture(),before=JSON.stringify(f.rig.data),live=f.rig.capture(),weights=Array.from(f.mesh.geometry.attributes.skinWeight.array),inspect=createPoseSurfaceChecker(f.rig),shape=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;assert.ok(shape);assert.equal(validCorrectiveShapes([shape]),true);
 const a=inspect(f.pose),b=inspect(f.pose,undefined,shape);assert.equal(a.volumeIssues,1);assert.equal(b.volumeIssues,0);assert.ok(b.meshes[0].volume.minimumRatio!>.8);assert.equal(noMeasuredRegression(a,b),true);assert.equal(JSON.stringify(f.rig.data),before);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(Array.from(f.mesh.geometry.attributes.skinWeight.array),weights);
 const rest={...f.pose,values:neutralPoseValues(f.rig)};assert.deepEqual(poseSurfacePositions(f.rig,rest.values,0),poseSurfacePositions(f.rig,rest.values,0,undefined,shape));f.rig.dispose();
});
test('live geometric preview agrees with pure evaluation, restores native arrays and source pose, and replays after save',()=>{
 const f=fixture(),shape=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!,before=project(f.rig),live=f.rig.capture(),predicted=poseSurfacePositions(f.rig,f.pose.values,0,undefined,shape),original=f.mesh.geometry.morphAttributes.position;
 const stop=f.rig.previewCorrective(f.pose.values,shape);for(let i=0;i<predicted.length/3;i++)assert.ok(f.mesh.getVertexPosition(i,new T.Vector3()).distanceTo(new T.Vector3().fromArray(predicted,i*3))<1e-6);assert.deepEqual(project(f.rig),before);stop();stop();assert.deepEqual(f.rig.capture(),live);assert.deepEqual(f.mesh.geometry.morphAttributes.position,original);assert.equal(poseMorphBindings(f.root).length,0);
 f.rig.addCorrective(shape);f.rig.apply(f.pose.values);const actual=poseSurfacePositions(f.rig,f.pose.values,0);for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-predicted[i])<1e-6);const saved=parseProject(project(f.rig));f.rig.restoreSource();f.rig.dispose();const replay=new StudioRig(f.root,saved.studio);assert.equal(createPoseSurfaceChecker(replay)(f.pose).volumeIssues,0);assert.equal(replay.data.correctiveShapes?.length,1);replay.reset();assert.equal(poseMorphBindings(f.root)[0].entries.length,1);replay.dispose();
});
test('reset and geometric previews preserve unrelated ordinary morph influences',()=>{
 const f=fixture();f.rig.dispose();f.mesh.geometry.morphAttributes.position=[new T.Float32BufferAttribute(new Float32Array(f.mesh.geometry.attributes.position.count*3),3)];f.mesh.geometry.morphTargetsRelative=true;f.mesh.updateMorphTargets();const rig=new StudioRig(f.root,f.rig.data);f.mesh.morphTargetInfluences![0]=.37;rig.reset();assert.equal(f.mesh.morphTargetInfluences![0],.37);const joint=rig.data.points.find(p=>p.name==='Forearm')!,shape=buildGeometricCorrection(rig,f.pose,joint,2)!;assert.ok(shape);const stop=rig.previewCorrective(f.pose.values,shape);assert.equal(f.mesh.morphTargetInfluences![0],.37);stop();assert.equal(f.mesh.morphTargetInfluences![0],.37);rig.dispose();
});
test('automatic job selects a geometric candidate and checks all stored pose/move samples',async()=>{
 const f=fixture(),before=project(f.rig),p=await findAutomaticSkinCorrection(f.rig,new AbortController().signal);assert.ok(p);assert.equal(p.kind,'geometry');assert.ok(p.shape);assert.equal(p.after.volumeIssues,0);assert.deepEqual(project(f.rig),before);const inspect=createPoseSurfaceChecker(f.rig);for(let k=0;k<=16;k++){const pose={...f.pose,values:f.rig.sample(f.rig.data.moves[0],k/16)};assert.equal(noMeasuredRegression(inspect(pose),inspect(pose,undefined,p.shape)),true);}f.rig.dispose();
});
test('ranking prefers the sampled whole movement over a better isolated target frame',async()=>{
 const f=twistFixture(true,true);f.rig.data.moves[0].loop=true;const target={...f.pose,values:f.rig.sample(f.rig.data.moves[0],15/16)},shape=buildGeometricCorrection(f.rig,target,f.joint,2)!,inspect=createPoseSurfaceChecker(f.rig);assert.ok(shape);assert.equal(inspect(target,undefined,shape).issues,0);assert.ok(inspect(f.pose,undefined,shape).issues>0);
 const p=await findAutomaticSkinCorrection(f.rig,new AbortController().signal);assert.ok(p);assert.notEqual(p.kind,'geometry');assert.equal(p.sampledIssues,0);f.rig.dispose();
});
test('editor previews and commits one geometric shape with unchanged pose/move values and one undo step',async()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document,Event:w.Event,Option:function(text='',value=''){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;}});const f=fixture(),host=document.createElement('div'),view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
 const editor=new StudioEditor(f.rig,view as unknown as StudioView,host,project(f.rig),{suspend(){},resume(){},changed(){},feedback(){}});editor.enter();const before=editor.exportProject(),p=await editor.startAutomaticSkinCorrection();assert.ok(p);assert.equal(p.kind,'geometry');editor.previewAutomaticSkinCorrection(p.id,true);assert.throws(()=>editor.exportProject());editor.applyAutomaticSkinCorrection(p.id);assert.equal(f.rig.data.correctiveShapes?.length,1);assert.equal(f.rig.data.weightTransfers?.length??0,0);assert.deepEqual(f.rig.data.poses.map(p=>p.values),before.studio.poses.map(p=>p.values));assert.deepEqual(f.rig.data.moves,before.studio.moves);assert.equal(createPoseSurfaceChecker(f.rig)(f.pose).volumeIssues,0);
 host.querySelector<HTMLButtonElement>('#studio-undo')!.click();assert.deepEqual(editor.exportProject(),before);host.querySelector<HTMLButtonElement>('#studio-redo')!.click();assert.equal(f.rig.data.correctiveShapes?.length,1);assert.equal(createPoseSurfaceChecker(f.rig)(f.pose).volumeIssues,0);assert.throws(()=>editor.applyAutomaticSkinCorrection(p.id));editor.dispose();await w.happyDOM.abort();
});
test('malformed sparse targets, duplicates, limits and incompatible binding never silently apply',()=>{
 const f=fixture(),s=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;for(const edit of [(s:any)=>s.meshes[0].indices.push(s.meshes[0].indices[0]),(s:any)=>s.meshes[0].deltas[0]=NaN,(s:any)=>s.extra=true,(s:any)=>s.radius=0]){const copy=structuredClone(s);edit(copy);assert.equal(validCorrectiveShapes([copy]),false);}assert.equal(validCorrectiveShapes(Array.from({length:5},()=>s)),false);
 const large=structuredClone(s);large.meshes[0].indices=Array.from({length:MAX_CORRECTIVE_VERTICES+1},(_,i)=>i);large.meshes[0].deltas=Array(large.meshes[0].indices.length*3).fill(0);assert.equal(validCorrectiveShapes([large]),false);
 const missing=structuredClone(s);missing.meshes[0].indices[0]=99999;assert.throws(()=>f.rig.addCorrective(missing));assert.equal(poseMorphBindings(f.root).length,0);assert.equal(f.rig.data.correctiveShapes,undefined);
 f.pose.values[f.joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI).toArray();assert.equal(buildGeometricCorrection(f.rig,f.pose,f.joint,2),null);f.rig.dispose();
});
test('zoo packages retain shapes and move binding rejects mismatched geometry corrections',async()=>{
 const f=fixture(),s=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;f.rig.addCorrective(s);const p=project(f.rig),zoo=JSON.parse(zooPackage(p,'copy').project);assert.deepEqual(zoo.studio.correctiveShapes,p.studio.correctiveShapes);const file=await exportMoveFile(p,'twist-move');await importMoveFile(file,p);const different=structuredClone(p);delete different.studio.correctiveShapes;await assert.rejects(()=>importMoveFile(file,different),/passt nicht/);f.rig.dispose();
});
test('ordinary GLB animation carries the actual generated geometric correction through intermediate frames',()=>{
 const f=fixture(),shape=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;f.rig.addCorrective(shape);f.rig.apply(f.pose.values);const capture=captureMoveGLB(f.rig,f.rig.data.moves[0]),mixer=new T.AnimationMixer(capture.scene),action=mixer.clipAction(capture.clip);action.play();let mesh:T.SkinnedMesh;capture.scene.traverse(n=>{if(n instanceof T.SkinnedMesh)mesh=n;});
 for(const time of [0,.25,.5,.75,1]){mixer.setTime(time===1?1-1e-7:time);capture.scene.updateMatrixWorld(true);const values=f.rig.sample(f.rig.data.moves[0],time),expected=poseSurfacePositions(f.rig,values,0);for(let v=0;v<expected.length/3;v++){const p=mesh!.getVertexPosition(v,new T.Vector3()).applyMatrix4(mesh!.matrixWorld);assert.ok(p.distanceTo(new T.Vector3().fromArray(expected,v*3))<.0002);}}disposeStaticFigure(capture.scene);f.rig.dispose();
});
test('a second geometric shape preserves existing drivers and matches pure and live normalized targets',()=>{
 const f=fixture(),one=buildGeometricCorrection(f.rig,f.pose,f.joint,1,.1)!;f.rig.addCorrective(one);const first=poseMorphBindings(f.root)[0].entries[0],weight=f.rig.correctionWeights(f.pose.values).get(f.mesh)![first.index],two=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;assert.ok(two);const predicted=poseSurfacePositions(f.rig,f.pose.values,0,undefined,two);f.rig.addCorrective(two);assert.equal(f.rig.correctionWeights(f.pose.values).get(f.mesh)![first.index],weight);const actual=poseSurfacePositions(f.rig,f.pose.values,0);for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-predicted[i])<1e-6);f.rig.apply(f.pose.values);for(let i=0;i<actual.length/3;i++)assert.ok(f.mesh.getVertexPosition(i,new T.Vector3()).distanceTo(new T.Vector3().fromArray(actual,i*3))<1e-6);f.rig.dispose();
});
test('rigged GLB round-trip retains shape metadata and independent target attributes',async()=>{
 class Reader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(b:Blob){void b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}}Object.assign(globalThis,{FileReader:Reader,ProgressEvent:class extends Event{}});
 const f=fixture(),s=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;f.rig.addCorrective(s);const bytes=await exportRiggedFigureGLB(f.root),loaded=await parseModel(bytes),rig=new StudioRig(loaded.scene);assert.equal(poseMorphBindings(rig.root)[0].entries.length,1);const values=rig.capture(),joint=rig.data.points.find(p=>p.name==='Forearm')!;values[joint.id].rotation=[...s.pose] as [number,number,number,number];assert.ok(createPoseSurfaceChecker(rig)({...f.pose,values}).meshes[0].volume.minimumRatio!>.8);rig.dispose();disposeModel(loaded.scene);f.rig.dispose();
});
