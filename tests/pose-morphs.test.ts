import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {twistFixture} from './helpers/twist-fixture.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {POSE_MORPHS,POSE_MORPH_BIND,poseMorphBindings} from '../src/pose-morphs.ts';
import {poseSurfacePositions} from '../src/pose-surface-check.ts';
import {captureMoveGLB,exportMoveGLB} from '../src/move-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {captureRiggedFigure,disposeStaticFigure} from '../src/figure-glb.ts';
import {parseProject} from '../src/studio-data.ts';
import {optimizeSkinWeights} from '../scripts/pakachi-skin-optimization.mjs';

function fixture(){
 const f=twistFixture();f.rig.dispose();const g=f.mesh.geometry,delta=new Float32Array(g.attributes.position.array.length);for(let v=16;v<32;v++)delta[v*3]=.08;
 const native=new T.Float32BufferAttribute(new Float32Array(delta.length),3),corrective=new T.Float32BufferAttribute(delta,3);native.name='Native';corrective.name='Corrective';g.morphTargetsRelative=true;g.morphAttributes.position=[native,corrective];f.mesh.updateMorphTargets();f.mesh.morphTargetInfluences![0]=.2;
 f.mesh.userData[POSE_MORPHS]=[{joint:'Forearm',target:'Corrective',rest:[0,0,0,1],pose:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2).toArray(),radius:Math.PI/4}];
 f.mesh.userData[POSE_MORPH_BIND]=f.mesh.skeleton.boneInverses.map(m=>m.clone().multiply(f.mesh.bindMatrix).toArray());const root=new T.Group();root.add(f.root);const rig=new StudioRig(root),joint=rig.data.points.find(p=>p.name==='Forearm')!;
 const values=(degrees:number)=>{const values=rig.capture();values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),degrees*Math.PI/180).toArray();return values;};return {...f,root,rig,joint,values};
}
test('pose-space weights are neutral outside the authored range, smooth, sign-invariant and read-only',()=>{
 const f=fixture(),live=f.rig.capture();for(const [angle,expected]of [[0,0],[45,0],[67.5,.5],[90,1],[112.5,.5],[135,0],[180,0]]){const weights=f.rig.correctionWeights(f.values(angle)).get(f.mesh)!;assert.ok(Math.abs(weights[1]-expected)<1e-7);assert.equal(weights[0],.2);}const values=f.values(90);values[f.joint.id].rotation=values[f.joint.id].rotation.map(v=>-v) as [number,number,number,number];assert.equal(f.rig.correctionWeights(values).get(f.mesh)![1],1);assert.deepEqual(f.rig.capture(),live);assert.deepEqual(f.mesh.morphTargetInfluences,[.2,0]);f.rig.dispose();
});
test('pure surface evaluation agrees with actual corrected skin and preserves full target transforms',()=>{
 const f=fixture(),values=f.values(90),predicted=poseSurfacePositions(f.rig,values,0);f.rig.apply(values);assert.equal(f.mesh.morphTargetInfluences![1],1);assert.deepEqual(f.rig.capture(),values);const inverse=f.root.matrixWorld.clone().invert();for(let v=0;v<predicted.length/3;v++){const actual=f.mesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(f.mesh.matrixWorld).applyMatrix4(inverse);assert.ok(actual.distanceTo(new T.Vector3().fromArray(predicted,v*3))<1e-7);}f.rig.dispose();
});
test('project setting and edited bindings disable authored shapes; rig export strips incompatible drivers',()=>{
 const f=fixture();f.rig.data.poseCorrections=false;f.rig.apply(f.values(90));assert.equal(f.mesh.morphTargetInfluences![1],0);
 const data={format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]},studio:f.rig.data};assert.equal(parseProject(data).studio.poseCorrections,false);assert.throws(()=>parseProject({...data,studio:{...f.rig.data,poseCorrections:'false'}}));
 const root=clone(f.root),loaded=new StudioRig(root,parseProject(data).studio);loaded.apply(f.values(90));assert.equal(poseMorphBindings(root)[0].mesh.morphTargetInfluences![1],0);loaded.dispose();
 f.rig.data.poseCorrections=true;f.rig.transferWeights(f.rig.data.points[0],f.joint,.1);f.rig.apply(f.values(90));assert.equal(f.rig.poseCorrectionsCompatible,false);assert.equal(f.mesh.morphTargetInfluences![1],0);const exported=captureRiggedFigure(f.root);assert.equal(exported.getObjectByName('Arm skin')!.userData[POSE_MORPHS],undefined);disposeStaticFigure(exported);f.rig.dispose();
});
test('move GLB combines corrective and free surface tracks through a real binary roundtrip without live drivers',async()=>{
 const f=fixture();f.rig.data.points.push({id:'face',name:'Free point',kind:'surface',mesh:0,rest:[.2,0,0],size:.01,radius:.3});f.rig.data.poses=[{id:'start',name:'Start',seconds:1,values:f.values(0)},{id:'end',name:'End',seconds:1,values:f.values(90)}];f.rig.data.poses[1].values.face.position[1]+=.05;const move={id:'test',name:'Test',poses:['start','end'],loop:false},exported=captureMoveGLB(f.rig,move),mesh=exported.scene.getObjectByName('Arm skin') as T.SkinnedMesh;assert.equal(mesh.userData[POSE_MORPHS],undefined);assert.equal(mesh.morphTargetInfluences!.length,3);assert.ok(exported.clip.tracks.some(t=>t.name.endsWith('.morphTargetInfluences')));const mixer=new T.AnimationMixer(exported.scene);const action=mixer.clipAction(exported.clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
 for(const time of [0,8/30,.5,.75,.99,1]){const values=f.rig.sample(move,time),expected=poseSurfacePositions(f.rig,values,0);mixer.setTime(time);exported.scene.updateMatrixWorld(true);for(let v=0;v<expected.length/3;v++){const actual=mesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(mesh.matrixWorld);const error=actual.distanceTo(new T.Vector3().fromArray(expected,v*3));assert.ok(error<5e-4,`${time} vertex ${v}: ${error}`);}}disposeStaticFigure(exported.scene);
 class Reader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}}
 const previousReader=globalThis.FileReader;Object.assign(globalThis,{FileReader:Reader});if(typeof ProgressEvent==='undefined')Object.assign(globalThis,{ProgressEvent:class extends Event{}});
 try{const bytes=await exportMoveGLB(f.rig,move),loaded=await parseModel(bytes),loadedMesh=loaded.scene.getObjectByProperty('isSkinnedMesh',true) as T.SkinnedMesh;assert.equal(loaded.animations.length,1);assert.equal(loadedMesh.userData[POSE_MORPHS],undefined);const player=new T.AnimationMixer(loaded.scene);player.clipAction(loaded.animations[0]).play();player.setTime(.75);loaded.scene.updateMatrixWorld(true);const expected=poseSurfacePositions(f.rig,f.rig.sample(move,.75),0);for(let v=0;v<expected.length/3;v++)assert.ok(loadedMesh.getVertexPosition(v,new T.Vector3()).applyMatrix4(loadedMesh.matrixWorld).distanceTo(new T.Vector3().fromArray(expected,v*3))<5e-4);disposeModel(loaded.scene);}finally{Object.assign(globalThis,{FileReader:previousReader});f.rig.dispose();}
});
test('weight fitting never alters its input and rigid transforms need no optimization',()=>{
 const f=twistFixture(),before=Array.from(f.mesh.geometry.attributes.skinWeight.array),matrix=new T.Matrix4().makeRotationY(.8).setPosition(3,2,1),result=optimizeSkinWeights(f.mesh.geometry,[[matrix,matrix]],{iterations:2});assert.equal(result.activeVertices,0);assert.deepEqual(Array.from(result.weights),before);assert.deepEqual(Array.from(f.mesh.geometry.attributes.skinWeight.array),before);assert.throws(()=>optimizeSkinWeights(f.mesh.geometry,[],{iterations:2}));f.rig.dispose();
});
test('authored bind checks survive viewer normalization and reject a different neutral skeleton',()=>{
 const f=fixture(),source=clone(f.root);source.traverse(n=>{if(n instanceof T.Mesh)n.geometry=n.geometry.clone();});
 const parent=new T.Group();parent.scale.set(1.5,.8,2);parent.position.set(2,3,4);parent.add(source);parent.updateMatrixWorld(true);const normalized=new StudioRig(source);assert.equal(normalized.poseCorrectionsCompatible,true);normalized.dispose();
 const changed=clone(f.root);changed.getObjectByName('Forearm')!.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),.5);changed.updateMatrixWorld(true);const incompatible=new StudioRig(changed);assert.equal(incompatible.poseCorrectionsCompatible,false);assert.equal(incompatible.poseCorrectionsActive,false);incompatible.dispose();f.rig.dispose();
});
