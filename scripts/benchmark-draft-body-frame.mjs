/** Evaluation only: measured PaKaChi landmarks never enter the generic estimator. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {bindDraftRig} from '../src/draft-rig.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {characterForms} from './pakachi-rig-config.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event{};
const runs=[];
for(const [form,templates] of [['humanoid',['biped','biped-relaxed']],['animal',['quadruped']]])for(const template of templates)for(const mode of ['bounds','support']){
 const source=`public/model-zoo/pakachi-drafts/${form}.glb`,bytes=await readFile(source),model=await parseModel(Uint8Array.from(bytes).buffer),before=[];
 model.scene.updateMatrixWorld(true);model.scene.traverse(n=>{if(n instanceof T.Mesh)for(let i=0;i<n.geometry.attributes.position.count;i++)before.push(...n.getVertexPosition(i,new T.Vector3()).applyMatrix4(n.matrixWorld).toArray());});
 const started=performance.now(),report=await bindDraftRig(model.scene,template,new AbortController().signal,mode),placement=[];
 for(const [name,target] of Object.entries(characterForms[form].landmarks)){
  if(!/Shoulder|Elbow|Wrist|Hand|Hip|Knee|Ankle|Foot/.test(name))continue;
  const actual=model.scene.getObjectByName('Draft_'+name).getWorldPosition(new T.Vector3());placement.push({joint:name,reference:target,actual:actual.toArray(),distance:actual.distanceTo(new T.Vector3(...target))});
 }
 const rig=new StudioRig(model.scene),neutral=rig.capture(),check=createPoseSurfaceChecker(rig),rest=rig.surfaces.flatMap((_,i)=>Array.from(poseSurfacePositions(rig,neutral,i)));let neutralMaximumDisplacement=0;
 for(let i=0;i<before.length;i+=3)neutralMaximumDisplacement=Math.max(neutralMaximumDisplacement,Math.hypot(...before.slice(i,i+3).map((n,k)=>n-rest[i+k])));
 const probes=[];
 for(const suffix of ['LeftElbow','LeftKnee','RightElbow','RightKnee']){
  const point=rig.data.points.find(p=>p.name==='Draft_'+suffix),values=structuredClone(neutral);values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/6).toArray();const result=check({id:'probe',name:suffix,seconds:1,values});
  probes.push({joint:suffix,axis:'X',degrees:30,status:result.status,surfaceIssues:result.issues,volumeIssues:result.volumeIssues,unmeasurableVolumeComponents:result.meshes.reduce((sum,m)=>sum+m.volume.unmeasurableComponents,0)});
 }
 runs.push({form,template,mode,source,sha256:hash(bytes),report,seconds:(performance.now()-started)/1000,neutralMaximumDisplacement,placement:{count:placement.length,rmsDistance:Math.hypot(...placement.map(p=>p.distance))/Math.sqrt(placement.length),joints:placement},probes});rig.dispose();disposeModel(model.scene);
}
console.log(JSON.stringify({format:'pakachi-standing-frame-evidence',version:1,date:new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Berlin'}),measuredAt:new Date().toISOString(),runtimeSourcesSha256:hash(Buffer.concat(await Promise.all(['../src/draft-rig.ts','../src/draft-body-frame.ts'].map(p=>readFile(new URL(p,import.meta.url)))))),evaluationLandmarksSha256:hash(await readFile(new URL('./pakachi-rig-config.mjs',import.meta.url))),scope:'Six initial-rig variants on existing CPU reconstruction drafts. No new inference. Generic occupancy estimator; character landmarks used only to evaluate placement. Probes remain independent 30-degree bends, not anatomy/collision/move approval. Bounds and support use identical probe rotations per template.',runs},null,2));
