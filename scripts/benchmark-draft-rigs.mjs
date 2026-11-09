/** Read-only evaluation on existing raw image reconstructions. No inference or publication. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {bindDraftRig} from '../src/draft-rig.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event{};
const runs=[];
for(const [form,template] of [['humanoid','biped'],['animal','quadruped']]){
 const path=`public/model-zoo/pakachi-drafts/${form}.glb`,bytes=await readFile(path),model=await parseModel(Uint8Array.from(bytes).buffer),before=[];
 model.scene.updateMatrixWorld(true);model.scene.traverse(n=>{if(n instanceof T.Mesh)for(let i=0;i<n.geometry.attributes.position.count;i++)before.push(...n.getVertexPosition(i,new T.Vector3()).applyMatrix4(n.matrixWorld).toArray());});
 const started=performance.now(),report=await bindDraftRig(model.scene,template,new AbortController().signal),rig=new StudioRig(model.scene),neutral=rig.capture(),check=createPoseSurfaceChecker(rig),rest=rig.surfaces.flatMap((_,i)=>Array.from(poseSurfacePositions(rig,neutral,i)));
 let neutralMaximumDisplacement=0;for(let i=0;i<before.length;i+=3)neutralMaximumDisplacement=Math.max(neutralMaximumDisplacement,Math.hypot(...before.slice(i,i+3).map((n,k)=>n-rest[i+k])));
 const probes=[];
 for(const name of ['Draft_LeftElbow','Draft_LeftKnee','Draft_RightElbow','Draft_RightKnee']){
  const point=rig.data.points.find(p=>p.name===name),values=structuredClone(neutral);values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/6).toArray();
  const measurement=check({id:'probe',name,seconds:1,values});probes.push({joint:name,axis:'X',degrees:30,surfaceIssues:measurement.issues,volumeIssues:measurement.volumeIssues,unmeasurableVolumeComponents:measurement.meshes.reduce((sum,m)=>sum+m.volume.unmeasurableComponents,0)});
 }
 const baseline=check({id:'rest',name:'Rest',seconds:1,values:neutral});
 runs.push({form,source:path,sha256:createHash('sha256').update(bytes).digest('hex'),report,seconds:(performance.now()-started)/1000,neutralMaximumDisplacement,baseline:{surfaceIssues:baseline.issues,volumeIssues:baseline.volumeIssues},probes});
 rig.dispose();disposeModel(model.scene);
}
console.log(JSON.stringify({format:'pakachi-template-rig-evidence',version:1,date:'2026-11-09',scope:'Existing CPU-generated GLBs; proportional templates, no new inference. No visual/anatomical or collision approval. No source model overwritten.',runs},null,2));
