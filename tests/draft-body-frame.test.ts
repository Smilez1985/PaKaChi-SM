import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {bindDraftRig} from '../src/draft-rig.ts';
import {draftFigure} from './helpers/draft-rig-fixture.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
// Evaluation-only landmarks must never be imported by the generic runtime estimator.
import {characterForms} from '../scripts/pakachi-rig-config.mjs';
function tail(root:T.Group){const mesh=new T.Mesh(new T.SphereGeometry(.26,24,16),new T.MeshBasicMaterial());mesh.name='Large asymmetric attachment';mesh.position.set(-.72,.47,-.12);root.add(mesh);}
function foot(root:T.Group,x:number,z:number){const m=new T.Mesh(new T.BoxGeometry(.15,.1,.18,4,2,4),new T.MeshBasicMaterial());m.position.set(x,.05,z);root.add(m);}
function quad(){const root=new T.Group();for(const x of [-.22,.22])for(const z of [-.28,.28])foot(root,x,z);const body=new T.Mesh(new T.BoxGeometry(.42,.30,.65,8,6,12),new T.MeshBasicMaterial());body.position.set(0,.52,0);root.add(body);const head=new T.Mesh(new T.BoxGeometry(.28,.25,.28,6,6,6),new T.MeshBasicMaterial());head.position.set(0,.85,.40);root.add(head);tail(root);return root;}
test('standing-frame estimate ignores a large asymmetric attachment and follows translated/scaled/yawed feet',async()=>{
 for(const yaw of [0,.35]){
  const root=draftFigure();tail(root);root.rotation.y=yaw;root.position.set(2,-1,3);root.scale.setScalar(1.7);
  const expected=root.localToWorld(new T.Vector3(0,0,0)),report=await bindDraftRig(root,'biped-relaxed',new AbortController().signal);assert.equal(report.frame?.mode,'support');assert.equal(report.frame?.supports.length,2);
  const pelvis=root.getObjectByName('Draft_Hips')!.getWorldPosition(new T.Vector3());assert.ok(Math.hypot(pelvis.x-expected.x,pelvis.z-expected.z)<.07);
  const right=new T.Vector3().fromArray(report.frame!.right);assert.ok(right.dot(new T.Vector3(1,0,0).applyAxisAngle(new T.Vector3(0,1,0),yaw))>.98);disposeModel(root);
 }
});
test('four supports and the elevated front establish the quadruped frame without following its side attachment',async()=>{
 const root=quad(),report=await bindDraftRig(root,'quadruped',new AbortController().signal);assert.equal(report.frame?.mode,'support');assert.equal(report.frame?.supports.length,4);assert.ok(Math.abs(report.frame!.center[0])<.025);assert.ok(report.frame!.forward[2]>.95);assert.ok(report.frame!.torsoHeight!>.35&&report.frame!.torsoHeight!<.65);
 const head=root.getObjectByName('Draft_Head')!.getWorldPosition(new T.Vector3());assert.ok(Math.hypot(head.x,head.z-.4)<.05,JSON.stringify({head:head.toArray(),frame:report.frame}));
 for(const side of ['Left','Right'])for(const suffix of ['Hand','Foot']){const bone=root.getObjectByName('Draft_'+side+suffix)!;const position=bone.getWorldPosition(new T.Vector3());assert.ok(Math.abs(Math.abs(position.x)-.22)<.03);assert.ok(Math.abs(Math.abs(position.z)-.28)<.03);}disposeModel(root);
});
test('continuous ground platforms fall back explicitly; manual bounds reproduce the previous template',async()=>{
 const root=draftFigure(),platform=new T.Mesh(new T.BoxGeometry(1,.1,.6,40,2,30),new T.MeshBasicMaterial());platform.position.y=.05;root.add(platform);
 const report=await bindDraftRig(root,'biped',new AbortController().signal);assert.equal(report.frame?.mode,'bounds');assert.equal(report.frame?.reason,'ambiguous-supports');disposeModel(root);
 const raw=draftFigure();tail(raw);const bounds=new T.Box3().setFromObject(raw),before=bounds.getCenter(new T.Vector3()).x,manual=await bindDraftRig(raw,'biped',new AbortController().signal,'bounds');assert.equal(manual.frame?.reason,'manual-bounds');assert.equal(raw.getObjectByName('Draft_Hips')!.getWorldPosition(new T.Vector3()).x,before);disposeModel(raw);
});
test('both real reconstruction drafts improve measured limb placement while keeping anatomy review open',async()=>{
 if(typeof globalThis.ProgressEvent==='undefined')Object.assign(globalThis,{ProgressEvent:class extends Event{}});
 for(const [form,template] of [['humanoid','biped-relaxed'],['animal','quadruped']] as const){
  const bytes=await readFile(new URL(`../public/model-zoo/pakachi-drafts/${form}.glb`,import.meta.url)),errors:number[]=[];
  for(const mode of ['bounds','support'] as const){const model=await parseModel(Uint8Array.from(bytes).buffer),report=await bindDraftRig(model.scene,template,new AbortController().signal,mode);const distances:number[]=[];
   for(const [name,target] of Object.entries(characterForms[form].landmarks)){if(!/Shoulder|Elbow|Wrist|Hand|Hip|Knee|Ankle|Foot/.test(name))continue;const node=model.scene.getObjectByName('Draft_'+name);assert.ok(node);distances.push(node.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3().fromArray(target as number[])));}
   assert.equal(distances.length,16);errors.push(Math.hypot(...distances)/4);assert.equal(report.review,'required');if(mode==='support')assert.equal(report.frame?.mode,'support');disposeModel(model.scene);
  }
  assert.ok(errors[1]<errors[0]*.65,`${form}: ${errors}`);
 }
});
