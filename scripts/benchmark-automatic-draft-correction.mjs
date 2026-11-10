/** Generic Studio search on existing raw reconstructions; no inference or source writes. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {bindDraftRig} from '../src/draft-rig.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {findAutomaticSkinCorrection,skinCorrectionOverrides} from '../src/automatic-skin-correction.ts';
import {createPoseSurfaceChecker} from '../src/pose-surface-check.ts';
import {noMeasuredRegression} from '../src/pose-weight-correction.ts';
const hash=b=>createHash('sha256').update(b).digest('hex'),withMove=process.argv.includes('--moves'),runs=[];
if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event{};
for(const [form,template] of [['humanoid','biped-relaxed'],['animal','quadruped']]){
 const source=`public/model-zoo/pakachi-drafts/${form}.glb`,bytes=await readFile(source),model=await parseModel(Uint8Array.from(bytes).buffer);await bindDraftRig(model.scene,template,new AbortController().signal);
 const rig=new StudioRig(model.scene),neutral=rig.capture(),inspect=createPoseSurfaceChecker(rig);
 for(const suffix of ['LeftElbow','LeftKnee','RightElbow','RightKnee']){const point=rig.data.points.find(p=>p.name==='Draft_'+suffix),values=structuredClone(neutral);values[point.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/6).toArray();rig.data.poses.push({id:suffix.toLowerCase(),name:suffix,seconds:1,values});}
 const initial=rig.data.poses.map(p=>inspect(p));
 if(withMove){rig.data.poses.push({id:'rest',name:'Rest',seconds:1,values:neutral});const worst=initial.reduce((a,b)=>b.issues>a.issues?b:a);rig.data.moves.push({id:'probe-move',name:'Probe loop',loop:true,poses:['rest',worst.poseId]});}
 const snapshot=JSON.stringify(rig.data),started=performance.now();let progress;
 try{
  const p=await findAutomaticSkinCorrection(rig,new AbortController().signal,()=>true,{progress:value=>{progress=value;}}),overrides=p&&p.kind!=='geometry'?skinCorrectionOverrides(rig,p):undefined;
  const checks=rig.data.poses.map(pose=>{const before=inspect(pose),after=p?inspect(pose,overrides,p.shape):before;return {pose:pose.id,before:{issues:before.issues,volumeIssues:before.volumeIssues},after:{issues:after.issues,volumeIssues:after.volumeIssues},noRegression:noMeasuredRegression(before,after)};});
  runs.push({form,source,sha256:hash(bytes),seconds:(performance.now()-started)/1000,sourceUnchanged:JSON.stringify(rig.data)===snapshot,proposal:p?{kind:p.kind??'weights',geometryMethod:p.geometryMethod,joint:rig.data.points.find(point=>point.id===p.jointId).name,center:p.region.center,radius:p.region.radius,before:p.before.issues,after:p.after.issues,beforeVolume:p.before.volumeIssues,afterVolume:p.after.volumeIssues,affectedVertices:p.affectedVertices,checkedCandidates:p.checkedCandidates,checkedMoves:p.checkedMoves,motionSamples:p.motionSamples,edgeOperations:p.edgeOperations,edgeBudgetExhausted:p.edgeBudgetExhausted}:null,checks,progress});
 }catch(error){runs.push({form,source,error:error.message,progress,seconds:(performance.now()-started)/1000});}
 rig.dispose();disposeModel(model.scene);
}
console.log(JSON.stringify({format:'pakachi-automatic-draft-correction',version:1,date:new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Berlin'}),withMove,scope:'Existing CPU reconstructions with generic initial rigs. Four saved 30-degree bends; optional rest-to-worst loop. No new inference or anatomy/collision approval.',runs},null,2));
