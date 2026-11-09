import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {bindDraftRig,prepareDraftRig} from '../src/draft-rig.ts';
import {draftFigure} from './helpers/draft-rig-fixture.ts';
import {exportRiggedFigureGLB,writeFigureGLB} from '../src/figure-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {parseProject} from '../src/studio-data.ts';
import {captureMoveGLB} from '../src/move-glb.ts';
import {disposeStaticFigure} from '../src/figure-glb.ts';
class Reader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(b:Blob){void b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}}
Object.assign(globalThis,{FileReader:Reader,ProgressEvent:class extends Event{}});
const signal=()=>new AbortController().signal;
function positions(root:T.Object3D){root.updateMatrixWorld(true);const result=new Map<string,T.Vector3[]>();root.traverse(n=>{if(n instanceof T.Mesh)result.set(n.name,Array.from({length:n.geometry.attributes.position.count},(_,i)=>n.getVertexPosition(i,new T.Vector3()).applyMatrix4(n.matrixWorld)));});return result;}
test('both first-skeleton templates preserve the neutral world surface and all vertex attributes',async()=>{
 for(const template of ['biped','quadruped'] as const){
  const root=draftFigure();root.position.set(2,-1,3);root.rotation.set(.1,.2,.05);root.scale.set(1.4,1.1,.7);
  const before=positions(root),uv=new Map<string,number[]>();root.traverse(n=>{if(n instanceof T.Mesh)uv.set(n.name,Array.from(n.geometry.attributes.uv.array));});
  const report=await bindDraftRig(root,template,signal());assert.equal(report.bones,template==='biped'?21:23);assert.equal(report.review,'required');
  root.updateMatrixWorld(true);const after=positions(root);
  for(const [name,points] of before)for(let i=0;i<points.length;i++)assert.ok(points[i].distanceTo(after.get(name)![i])<2e-6);
  root.traverse(n=>{if(n instanceof T.SkinnedMesh){assert.deepEqual(Array.from(n.geometry.attributes.uv.array),uv.get(n.name));const weights=n.geometry.attributes.skinWeight,indices=n.geometry.attributes.skinIndex;for(let i=0;i<weights.count;i++){let sum=0;for(let k=0;k<4;k++){const w=weights.getComponent(i,k);sum+=w;assert.ok(w>=0&&Number.isFinite(w));assert.ok(indices.getComponent(i,k)<report.bones);}assert.ok(Math.abs(sum-1)<1e-6);}}});
  disposeModel(root);
 }
});
test('the new skeleton actually bends the matching leg without pulling the opposite foot along',async()=>{
 const root=draftFigure();await bindDraftRig(root,'biped',signal());const before=positions(root),knee=root.getObjectByName('Draft_LeftKnee')!;knee.rotation.x=.7;const after=positions(root);
 const max=(name:string)=>Math.max(...before.get(name)!.map((p,i)=>p.distanceTo(after.get(name)![i])));
 assert.ok(max('LeftFoot')>.08);assert.ok(max('RightFoot')<.005);assert.ok(max('Head')<.005);disposeModel(root);
});
test('shared geometry is independently weighted for translated mesh instances',async()=>{
 const root=draftFigure(),a=root.getObjectByName('LeftFoot') as T.Mesh,b=root.getObjectByName('RightFoot') as T.Mesh;b.geometry.dispose();b.geometry=a.geometry;
 await bindDraftRig(root,'biped',signal());const left=root.getObjectByName('LeftFoot') as T.SkinnedMesh,right=root.getObjectByName('RightFoot') as T.SkinnedMesh;assert.notEqual(left.geometry,right.geometry);assert.notDeepEqual(Array.from(left.geometry.attributes.skinIndex.array),Array.from(right.geometry.attributes.skinIndex.array));disposeModel(root);
});
test('GLB preparation retains source bytes and survives project/rigged-GLB replay with editable joints',async()=>{
 const bytes=new Uint8Array(await writeFigureGLB(draftFigure())),source=bytes.slice(),prepared=await prepareDraftRig(bytes,'biped',signal());assert.deepEqual(bytes,source);
 assert.equal(prepared.report.probes?.length,4);assert.ok(prepared.report.probes!.every(p=>p.degrees===30));assert.equal(prepared.report.review,'required');
 const model=await parseModel(Uint8Array.from(prepared.bytes).buffer),rig=new StudioRig(model.scene);assert.equal(rig.bones.length,21);assert.equal(rig.data.links.length,20);
 const joint=rig.data.points.find(p=>p.name==='Draft_LeftKnee')!,values=rig.capture();rig.data.poses.push({id:'rest',name:'Rest',seconds:1,values:structuredClone(values)});values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.5).toArray();rig.apply(values);
 rig.data.poses.push({id:'bent',name:'Bent knee',seconds:1,values});rig.data.moves.push({id:'bend',name:'Bend',loop:false,poses:['rest','bent']});
 const project=parseProject({format:'pakachi-studio',version:1,model:Buffer.from(prepared.bytes).toString('base64'),avatar:{id:'draft',name:'Draft',description:'',moves:[]},studio:rig.data});
 const original=positions(rig.root),again=await parseModel(Uint8Array.from(prepared.bytes).buffer),replay=new StudioRig(again.scene,project.studio);replay.apply(project.studio.poses[1].values);const replayed=positions(replay.root);
 for(const [name,points] of original)for(let i=0;i<points.length;i++)assert.ok(points[i].distanceTo(replayed.get(name)![i])<1e-6);
 const exported=await exportRiggedFigureGLB(rig.root),loaded=await parseModel(exported);let bones=0;loaded.scene.traverse(n=>{if(n instanceof T.Bone)bones++;});assert.equal(bones,21);
 const move=captureMoveGLB(rig,rig.data.moves[0]);assert.ok(move.clip.tracks.some(t=>t.name.endsWith('.quaternion')));disposeStaticFigure(move.scene);
 rig.dispose();replay.dispose();disposeModel(model.scene);disposeModel(again.scene);disposeModel(loaded.scene);
});
test('cancellation and unsupported models never leave half a skeleton or skin attributes',async()=>{
 const root=draftFigure(),controller=new AbortController(),pending=bindDraftRig(root,'biped',controller.signal);controller.abort();await assert.rejects(pending);assert.equal(root.getObjectByName('Draft_Hips'),undefined);root.traverse(n=>{if(n instanceof T.Mesh)assert.equal(n.geometry.getAttribute('skinWeight'),undefined);});disposeModel(root);
 const flat=new T.Group();flat.add(new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial()));await assert.rejects(bindDraftRig(flat,'biped',signal()),/volume/);disposeModel(flat);
 const bound=draftFigure();await bindDraftRig(bound,'biped',signal());await assert.rejects(bindDraftRig(bound,'biped',signal()),/already-bound/);disposeModel(bound);
 const invalid=draftFigure();(invalid.children[0] as T.Mesh).geometry.attributes.position.setX(0,NaN);await assert.rejects(bindDraftRig(invalid,'biped',signal()),/invalid-geometry/);assert.equal(invalid.getObjectByName('Draft_Hips'),undefined);disposeModel(invalid);
});
