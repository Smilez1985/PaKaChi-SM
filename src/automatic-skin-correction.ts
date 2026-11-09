import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import type {Pose,ControlPoint} from './studio-data.ts';
import {createPoseSurfaceChecker} from './pose-surface-check.ts';
import type {SkinOverrides} from './pose-surface-check.ts';
import {moveCheckTimes} from './move-limit-check.ts';
import {transferSkinInfluences} from './studio-weight-transfer.ts';
import {searchWeightCorrection,noMeasuredRegression,betterSurfaceReport} from './pose-weight-correction.ts';
import type {SurfaceReport,WeightCorrectionProposal} from './pose-weight-correction.ts';
export const AUTOMATIC_SKIN_VERTEX_BUDGET=100_000_000;
export const AUTOMATIC_SKIN_SAMPLE_LIMIT=512;
export type SkinProgress={phase:'diagnosis'|'search'|'validation';samples:number;joints:number;candidates:number;vertexSamples:number};
export interface AutomaticSkinProposal extends WeightCorrectionProposal {target:Pose;targetOrigin:{kind:'pose'|'move';id:string;time?:number};jointId:string;motionSamples:number;checkedMoves:number;checkedJoints:number;checkedCandidates:number}
export function skinCorrectionOverrides(rig:StudioRig,proposal:WeightCorrectionProposal):SkinOverrides{
 // Use the same transfer kernel as committed topology replay.
 const from=rig.data.points.find(p=>p.id===proposal.from),to=rig.data.points.find(p=>p.id===proposal.to);if(!from||!to)throw Error('Korrekturgelenke fehlen.');
 return transferOverrides(rig,from,to,proposal.amount,proposal.region.center,proposal.region.radius);
}
function transferOverrides(rig:StudioRig,from:ControlPoint,to:ControlPoint,amount:number,center:number[],radius:number){
 const overrides=new Map<number,ReturnType<typeof transferSkinInfluences>>(),origin=new T.Vector3().fromArray(center);
 for(let i=0;i<rig.surfaces.length;i++){
  const s=rig.surfaces[i],mesh=s.mesh;if(!(mesh instanceof T.SkinnedMesh))continue;
  const a=mesh.skeleton.bones.indexOf(rig.bones[from.bone!]),b=mesh.skeleton.bones.indexOf(rig.bones[to.bone!]);if(a<0)continue;
  const result=transferSkinInfluences(mesh.geometry.getAttribute('skinIndex'),mesh.geometry.getAttribute('skinWeight'),a,b,v=>{const t=T.MathUtils.clamp(1-s.world[v].distanceTo(origin)/radius,0,1);return amount*(t*t*(3-2*t));});if(result.affected)overrides.set(i,result);
 }return overrides;
}
/** Rank actual skin influences at measured faulty triangles; no anatomical names. */
function correctionJoints(rig:StudioRig,report:SurfaceReport){
 const scores=new Map<ControlPoint,{score:number;distance:number}>();
 for(const m of report.meshes){const s=rig.surfaces[m.mesh],mesh=s.mesh;if(!(mesh instanceof T.SkinnedMesh))continue;const si=mesh.geometry.getAttribute('skinIndex'),sw=mesh.geometry.getAttribute('skinWeight');
  const vertices=new Set(m.worst.flatMap(triangle=>[0,1,2].map(k=>mesh.geometry.index?.getX(triangle.triangle*3+k)??triangle.triangle*3+k)));
  for(const c of m.volume.components)if(!m.worst.length&&(c.ratio===null||c.ratio<m.volume.limits.minimumRatio||c.ratio>m.volume.limits.maximumRatio))for(const v of c.sampleVertices)vertices.add(v);
  for(const v of vertices){
   for(let influence=0;influence<4;influence++){
    const weight=sw.getComponent(v,influence);if(weight<=0)continue;const bone=mesh.skeleton.bones[si.getComponent(v,influence)],p=rig.data.points.find(p=>p.kind==='bone'&&rig.bones[p.bone!]===bone);
    if(!p||!rig.data.points.some(q=>q.kind==='bone'&&rig.bones[q.bone!]===bone.parent))continue;
    const score=scores.get(p)??{score:0,distance:0};score.score+=weight;score.distance=Math.max(score.distance,s.world[v].distanceTo(new T.Vector3().fromArray(p.rest)));scores.set(p,score);
   }
  }
 }
 return [...scores].sort((a,b)=>b[1].score-a[1].score||a[0].id.localeCompare(b[0].id)).slice(0,4).map(([joint,score])=>({joint,radius:T.MathUtils.clamp(Math.max(score.distance*2,.05),.005,2)}));
}
/** One bounded local repair job. It only returns a fully sampled proposal; live data stay intact. */
export async function findAutomaticSkinCorrection(rig:StudioRig,signal:AbortSignal,valid:()=>boolean=()=>true,options:{poseId?:string;radius?:number;progress?:(value:SkinProgress)=>void}={}){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');};ensure();
 if(options.radius!==undefined&&(!Number.isFinite(options.radius)||options.radius<.005||options.radius>2))throw Error('Ungültiger Korrekturradius.');
 if(options.poseId!==undefined&&!rig.data.poses.some(p=>p.id===options.poseId))throw Error('Pose nicht gefunden.');
 if(!rig.data.poses.length)throw Error('Zuerst mindestens eine Pose speichern.');
 const state:SkinProgress={phase:'diagnosis',samples:0,joints:0,candidates:0,vertexSamples:0},vertices=rig.surfaces.reduce((n,s)=>n+s.base.length/3,0);
 if(!vertices)throw Error('Keine auswertbare Oberfläche.');
 const motions=rig.data.moves.map(move=>({move,times:moveCheckTimes(rig,move)})),sampleCount=rig.data.poses.length+motions.reduce((n,m)=>n+m.times.length,0);
 if(sampleCount>AUTOMATIC_SKIN_SAMPLE_LIMIT||vertices*(sampleCount+1)>AUTOMATIC_SKIN_VERTEX_BUDGET)throw Error('Korrekturauftrag zu groß. Kürzere Bewegungen oder kleineres Modell prüfen.');
 const measure=()=>{ensure();state.vertexSamples+=vertices;if(state.vertexSamples>AUTOMATIC_SKIN_VERTEX_BUDGET)throw Error('Korrekturauftrag zu groß. Kürzere Bewegungen oder kleineres Modell prüfen.');};
 const tick=async()=>{await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();options.progress?.({...state});};
 measure();const inspect=createPoseSurfaceChecker(rig),frames:{pose:Pose;origin:AutomaticSkinProposal['targetOrigin'];before:SurfaceReport}[]=[];
 const add=async(pose:Pose,origin:AutomaticSkinProposal['targetOrigin'])=>{await tick();measure();const before=inspect(pose);if(before.meshes.some(m=>m.invalid||!m.compared))throw Error('Oberfläche ist nicht vollständig auswertbar.');frames.push({pose,origin,before});state.samples++;};
 for(const p of rig.data.poses)await add(p,{kind:'pose',id:p.id});
 let motionSamples=0;for(const {move,times}of motions)for(const time of times){await add({id:'motion-sample',name:move.name,seconds:1,values:rig.sample(move,time)},{kind:'move',id:move.id,time});motionSamples++;}
 const target=frames.filter(f=>options.poseId===undefined||f.origin.kind==='pose'&&f.origin.id===options.poseId).sort((a,b)=>betterSurfaceReport(a.before,b.before)?1:betterSurfaceReport(b.before,a.before)?-1:0)[0];
 if(!target||target.before.status!=='outside'){ensure();return null;}
 const joints=correctionJoints(rig,target.before);let best:AutomaticSkinProposal|null=null;
 for(const {joint,radius}of joints){
  state.phase='search';state.joints++;await tick();
  for(const chosenRadius of [...new Set(options.radius===undefined?[Math.max(.005,radius/2),radius,Math.min(2,radius*2)]:[options.radius])]){
  const proposal=await searchWeightCorrection(rig,target.pose,joint,chosenRadius,signal,valid,{measure,candidate:()=>{state.candidates++;},accept:async(_candidate,overrides)=>{
   state.phase='validation';
   for(const frame of frames){await tick();measure();if(!noMeasuredRegression(frame.before,inspect(frame.pose,overrides))){state.phase='search';return false;}}
   state.phase='search';return true;
  }});
  if(proposal&&(!best||betterSurfaceReport(proposal.after,best.after)))best={...proposal,target:structuredClone(target.pose),targetOrigin:{...target.origin},jointId:joint.id,motionSamples,checkedMoves:rig.data.moves.length,checkedJoints:state.joints,checkedCandidates:state.candidates};
  }
 }
 ensure();if(best){best.checkedJoints=state.joints;best.checkedCandidates=state.candidates;}return best;
}
