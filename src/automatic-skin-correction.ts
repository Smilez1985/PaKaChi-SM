import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import type {Pose,ControlPoint} from './studio-data.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from './pose-surface-check.ts';
import {checkSurfaceIntersections,SURFACE_INTERSECTION_PAIR_BUDGET} from './surface-intersections.ts';
import type {SurfaceIntersectionReport} from './surface-intersections.ts';
import type {SkinOverrides} from './pose-surface-check.ts';
import {moveCheckTimes} from './move-limit-check.ts';
import {transferSkinInfluences} from './studio-weight-transfer.ts';
import {volumeSeverity} from './surface-volume.ts';
import {buildGeometricCorrection,buildEdgeFitCorrection,buildEdgeRelaxationCorrection} from './geometric-skin-correction.ts';
import {activeCorrectiveIntersectionPoses,attenuateCorrectiveIntersections} from './corrective-intersection-attenuation.ts';
import {limitCorrectiveStrain} from './corrective-strain-guard.ts';
import {MAX_CORRECTIVE_VERTICES} from './studio-corrective-shapes.ts';
import type {StudioCorrectiveShape} from './studio-corrective-shapes.ts';
import {MAX_SURFACE_RELAXATION_ACTIVE_VERTICES,SURFACE_RELAXATION_ITERATIONS} from './surface-edge-relaxation.ts';
import {searchWeightCorrection,noMeasuredRegression,betterSurfaceReport,correctionSamples} from './pose-weight-correction.ts';
import type {SurfaceReport,WeightCorrectionProposal} from './pose-weight-correction.ts';
/** Aggregate-count diagnostic; the correction gate below compares pair identities.
 * Only a complete baseline permits a proven increase comparison.
 * An incomplete after-report still supplies a safe lower bound of detected crossings. */
export function newProvenIntersectionCount(before:SurfaceIntersectionReport,after:SurfaceIntersectionReport){
 return before.checked?Math.max(0,after.intersections-before.intersections):0;
}
/** Extra target-frame gate: reject newly measured transverse self-intersections.
 * Unmeasurable meshes are explicitly reported and NEVER certified as collision-free.
 * The routine does not check contacts, other meshes, or motion between samples. */
export function checkCandidateIntersectionRegression(rig:StudioRig,pose:Pose,affected:readonly number[],overrides?:SkinOverrides,shape?:StudioCorrectiveShape){
 let checkedMeshes=0,unmeasurableMeshes=0,newIntersections=0;
 for(const i of [...new Set(affected)]){
  if(!Number.isInteger(i)||i<0||i>=rig.surfaces.length)throw Error('Ungültiges Teilmodell in der Schnittprüfung.');
  const index=rig.surfaces[i].mesh.geometry.index?.array??null;
  const beforePairs=new Set<string>();let foundNew=0;
  const before=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,i),index,SURFACE_INTERSECTION_PAIR_BUDGET,{onIntersection:(a,b)=>beforePairs.add(a+':'+b)});
  const after=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,i,overrides,shape),index,SURFACE_INTERSECTION_PAIR_BUDGET,{onIntersection:(a,b)=>{if(before.checked&&!beforePairs.has(a+':'+b))foundNew++;}});
  // Removing an old crossing cannot compensate for introducing a different pair.
  // A complete baseline still permits proof from a partial after-report.
  newIntersections+=foundNew;
  if(!before.checked||!after.checked){unmeasurableMeshes++;continue;}
  checkedMeshes++;
 }
 return {accepted:newIntersections===0,checkedMeshes,unmeasurableMeshes,newIntersections,complete:unmeasurableMeshes===0&&checkedMeshes===new Set(affected).size};
}
/** Additional bounded target and motion frame screening, not continuous collision clearance. */
export function checkCandidateIntersectionFrames(rig:StudioRig,poses:readonly Pose[],affected:readonly number[],overrides?:SkinOverrides,shape?:StudioCorrectiveShape,ensure:()=>void=()=>{}){
 if(!poses.length||poses.length>4)throw Error('Ungültige Anzahl Schnitt-Stichproben.');
 let checkedFrames=0,unmeasurableFrames=0,checkedMeshes=0,unmeasurableMeshes=0,newIntersections=0;
 for(const pose of poses){
  ensure();
  const result=checkCandidateIntersectionRegression(rig,pose,affected,overrides,shape);
  checkedFrames++;checkedMeshes+=result.checkedMeshes;unmeasurableMeshes+=result.unmeasurableMeshes;
  if(!result.complete)unmeasurableFrames++;
  newIntersections+=result.newIntersections;
  if(newIntersections)break;
 }
 return {accepted:newIntersections===0,checkedFrames,unmeasurableFrames,checkedMeshes,unmeasurableMeshes,newIntersections,complete:unmeasurableFrames===0&&checkedFrames===poses.length};
}
/** Retain motion boundaries and spend the remaining collision probe at the worst measured frame.
 * Input is ordered by move and sample time. This is not a replacement for full sampling. */
export function selectCollisionMotionFrames<T extends {before:SurfaceReport}>(frames:readonly T[]):T[]{
 if(frames.length<=3)return [...frames];
 const chosen=new Set<number>([0,frames.length-1]);
 const risk=(r:SurfaceReport)=>r.issues+r.volumeIssues*2+r.meshes.reduce((sum,m)=>sum+volumeSeverity(m.volume),0);
 const interior=Array.from({length:frames.length-2},(_,k)=>k+1);
 interior.sort((a,b)=>risk(frames[b].before)-risk(frames[a].before)||a-b);
 chosen.add(interior[0]);
 return [...chosen].sort((a,b)=>a-b).map(i=>frames[i]);
}
export const AUTOMATIC_SKIN_VERTEX_BUDGET=100_000_000;
export const AUTOMATIC_SKIN_SAMPLE_LIMIT=512;
class AutomaticSkinBudgetError extends Error {}
export type SkinProgress={phase:'diagnosis'|'search'|'validation';samples:number;joints:number;candidates:number;vertexSamples:number;edgeOperations:number};
export interface AutomaticSkinProposal extends WeightCorrectionProposal {kind?:'geometry';geometryMethod?:'dual-quaternion'|'edge-fit'|'edge-relaxation';shape?:StudioCorrectiveShape;edgeOperations?:number;edgeBudgetExhausted?:boolean;vertexSamples?:number;vertexBudgetExhausted?:boolean;sampledIssues:number;sampledVolumeExcess:number;target:Pose;targetOrigin:{kind:'pose'|'move';id:string;time?:number};jointId:string;motionSamples:number;checkedMoves:number;checkedJoints:number;checkedCandidates:number}
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
export function correctionJoints(rig:StudioRig,report:SurfaceReport,pose:Pose){
 const byBone=new Map(rig.data.points.filter(p=>p.kind==='bone').map(p=>[rig.bones[p.bone!],p]));
 const active=new Set(rig.data.points.filter(p=>p.kind==='bone'&&(new T.Quaternion().fromArray(pose.values[p.id].rotation).angleTo(new T.Quaternion().fromArray(rig.data.boneRest[p.bone!].rotation))>.01||new T.Vector3().fromArray(pose.values[p.id].position).distanceTo(new T.Vector3().fromArray(rig.data.boneRest[p.bone!].position))>1e-6)));
 const scores=new Map<ControlPoint,{score:number;distance:number;severity:number;center?:number[];spread:number}>();
 for(const m of report.meshes){const s=rig.surfaces[m.mesh],mesh=s.mesh;if(!(mesh instanceof T.SkinnedMesh))continue;const si=mesh.geometry.getAttribute('skinIndex'),sw=mesh.geometry.getAttribute('skinWeight');
  const vertices=new Set(m.worst.flatMap(triangle=>[0,1,2].map(k=>mesh.geometry.index?.getX(triangle.triangle*3+k)??triangle.triangle*3+k))),hotspots=new Map<number,{severity:number;center:number[];spread:number}>();
  for(const triangle of m.worst){const ids=[0,1,2].map(k=>mesh.geometry.index?.getX(triangle.triangle*3+k)??triangle.triangle*3+k),center=ids.reduce((sum,v)=>sum.add(s.world[v]),new T.Vector3()).multiplyScalar(1/3),severity=Math.max(triangle.maximumStretch,1/Math.max(triangle.minimumStretch,1e-12)),hot={severity,center:center.toArray(),spread:Math.max(...ids.map(v=>s.world[v].distanceTo(center)))};for(const v of ids)if(!hotspots.has(v)||hotspots.get(v)!.severity<severity)hotspots.set(v,hot);}
  for(const c of m.volume.components)if(!m.worst.length&&(c.ratio===null||c.ratio<m.volume.limits.minimumRatio||c.ratio>m.volume.limits.maximumRatio))for(const v of c.sampleVertices)vertices.add(v);
  for(const v of vertices){
   for(let influence=0;influence<4;influence++){
    const weight=sw.getComponent(v,influence);if(weight<=0)continue;const bone=mesh.skeleton.bones[si.getComponent(v,influence)];let p:ControlPoint|undefined;
    for(let current:T.Object3D|null=bone;current instanceof T.Bone;current=current.parent){const candidate=byBone.get(current);if(candidate&&active.has(candidate)){p=candidate;break;}}
    p??=active.size?undefined:byBone.get(bone);
    if(!p||!rig.data.points.some(q=>q.kind==='bone'&&rig.bones[q.bone!]===bone.parent))continue;
    const score=scores.get(p)??{score:0,distance:0,severity:0,spread:0};score.score+=weight;score.distance=Math.max(score.distance,s.world[v].distanceTo(new T.Vector3().fromArray(p.rest)));const hot=hotspots.get(v);if(hot&&hot.severity>score.severity){score.severity=hot.severity;score.center=hot.center;score.spread=hot.spread;}scores.set(p,score);
   }
  }
 }
 return [...scores].sort((a,b)=>b[1].score-a[1].score||a[0].id.localeCompare(b[0].id)).slice(0,4).map(([joint,score])=>{const parent=byBone.get(rig.bones[joint.bone!].parent as T.Bone)!,length=new T.Vector3().fromArray(parent.rest).distanceTo(new T.Vector3().fromArray(joint.rest)),center=score.center&&length>1e-5&&new T.Vector3().fromArray(score.center).distanceTo(new T.Vector3().fromArray(joint.rest))>length*.75?score.center:[...joint.rest];return {joint,center,radius:T.MathUtils.clamp(length>1e-5?Math.max(length*.9,score.spread*4,.05):Math.max(score.distance*2,.05),.005,2)};});
}
/** One bounded local repair job. It only returns a fully sampled proposal; live data stay intact. */
export async function findAutomaticSkinCorrection(rig:StudioRig,signal:AbortSignal,valid:()=>boolean=()=>true,options:{poseId?:string;radius?:number;vertexBudget?:number;progress?:(value:SkinProgress)=>void}={}){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');};ensure();
 const vertexBudget=options.vertexBudget??AUTOMATIC_SKIN_VERTEX_BUDGET;
 if(!Number.isSafeInteger(vertexBudget)||vertexBudget<1||vertexBudget>AUTOMATIC_SKIN_VERTEX_BUDGET)throw Error('Ungültiges Korrekturbudget.');
 let vertexBudgetExhausted=false;
 if(options.radius!==undefined&&(!Number.isFinite(options.radius)||options.radius<.005||options.radius>2))throw Error('Ungültiger Korrekturradius.');
 if(options.poseId!==undefined&&!rig.data.poses.some(p=>p.id===options.poseId))throw Error('Pose nicht gefunden.');
 if(!rig.data.poses.length)throw Error('Zuerst mindestens eine Pose speichern.');
 const state:SkinProgress={phase:'diagnosis',samples:0,joints:0,candidates:0,vertexSamples:0,edgeOperations:0},vertices=rig.surfaces.reduce((n,s)=>n+s.base.length/3,0),edgeBudget={used:0,limit:12_000_000,exhausted:false};
 if(!vertices)throw Error('Keine auswertbare Oberfläche.');
 const motions=rig.data.moves.map(move=>({move,times:moveCheckTimes(rig,move)})),sampleCount=rig.data.poses.length+motions.reduce((n,m)=>n+m.times.length,0);
 if(sampleCount>AUTOMATIC_SKIN_SAMPLE_LIMIT||vertices*(sampleCount+1)>vertexBudget)throw Error('Korrekturauftrag zu groß. Kürzere Bewegungen oder kleineres Modell prüfen.');
 const measure=()=>{ensure();if(state.vertexSamples+vertices>vertexBudget){vertexBudgetExhausted=true;throw new AutomaticSkinBudgetError('Korrekturauftrag zu groß. Kürzere Bewegungen oder kleineres Modell prüfen.');}state.vertexSamples+=vertices;};
 const tick=async()=>{await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();options.progress?.({...state});};
 measure();const inspect=createPoseSurfaceChecker(rig),frames:{pose:Pose;origin:AutomaticSkinProposal['targetOrigin'];before:SurfaceReport}[]=[];
 const add=async(pose:Pose,origin:AutomaticSkinProposal['targetOrigin'])=>{await tick();measure();const before=inspect(pose);if(before.meshes.some(m=>m.invalid||!m.compared))throw Error('Oberfläche ist nicht vollständig auswertbar.');frames.push({pose,origin,before});state.samples++;};
 for(const p of rig.data.poses)await add(p,{kind:'pose',id:p.id});
 let motionSamples=0;for(const {move,times}of motions)for(const time of times){await add({id:'motion-sample',name:move.name,seconds:1,values:rig.sample(move,time)},{kind:'move',id:move.id,time});motionSamples++;}
 const target=frames.filter(f=>options.poseId===undefined||f.origin.kind==='pose'&&f.origin.id===options.poseId).sort((a,b)=>betterSurfaceReport(a.before,b.before)?1:betterSurfaceReport(b.before,a.before)?-1:0)[0];
 if(!target||target.before.status!=='outside'){ensure();return null;}
 const motionFrames=frames.filter(f=>f.origin.kind==='move');
 const selectedMotion=selectCollisionMotionFrames(motionFrames);
 const intersectionPoses=[target.pose,...selectedMotion.map(f=>f.pose)];
 const joints=correctionJoints(rig,target.before,target.pose);let best:AutomaticSkinProposal|null=null;
 const emptyScore=()=>({sampledIssues:0,sampledVolumeExcess:0}),scoreReport=(score:ReturnType<typeof emptyScore>,report:SurfaceReport)=>{score.sampledIssues+=report.issues;score.sampledVolumeExcess+=report.meshes.reduce((n,m)=>n+volumeSeverity(m.volume),0);},beats=(score:ReturnType<typeof emptyScore>,report:SurfaceReport)=>!best||score.sampledIssues<best.sampledIssues||score.sampledIssues===best.sampledIssues&&(score.sampledVolumeExcess<best.sampledVolumeExcess-1e-6||Math.abs(score.sampledVolumeExcess-best.sampledVolumeExcess)<=1e-6&&betterSurfaceReport(report,best.after));
 try{for(const {joint,radius,center}of joints){
  state.phase='search';state.joints++;await tick();
  let radii=[...new Set(options.radius===undefined?[Math.min(2,radius*2),radius,Math.max(.005,radius/2)]:[options.radius])];
  if(options.radius===undefined){
   // Reserve a share of the edge work for each radius. Estimate from incident
   // indexed edges before any candidate is built; this only changes search order.
   measure();const centers=new T.Vector3().fromArray(center).distanceToSquared(new T.Vector3().fromArray(joint.rest))>1e-12?[center,joint.rest]:[center];
   const mobile=target.before.meshes.filter(m=>m.issues>0).map(m=>{
    const surface=rig.surfaces[m.mesh],mesh=surface.mesh;if(!(mesh instanceof T.SkinnedMesh)||!mesh.geometry.index)return null;
    const driven=new Set<number>();mesh.skeleton.bones.forEach((bone,i)=>{for(let n:T.Object3D|null=bone;n;n=n.parent)if(n===rig.bones[joint.bone!]){driven.add(i);break;}});
    const si=mesh.geometry.getAttribute('skinIndex'),sw=mesh.geometry.getAttribute('skinWeight'),eligible=Uint8Array.from(surface.world,(_p,v)=>{let influence=0,slots=0;for(let k=0;k<4;k++){const w=sw.getComponent(v,k);if(w){slots++;if(driven.has(si.getComponent(v,k)))influence+=w;}}return Number(slots>1&&influence>=.01);});
    return {surface,index:mesh.geometry.index.array,eligible};
   }).filter(m=>m!==null);
   const fits=new Map(radii.map(r=>{let work=0;const eligible=centers.every(c=>{measure();const origin=new T.Vector3().fromArray(c);let total=0;for(const {surface,index,eligible} of mobile){const selected=Uint8Array.from(surface.world,(p,v)=>Number(eligible[v]&&p.distanceToSquared(origin)<r*r)),count=selected.reduce((a,b)=>a+b,0);if(count>MAX_SURFACE_RELAXATION_ACTIVE_VERTICES||(total+=count)>MAX_CORRECTIVE_VERTICES)return false;const edges=new Set<number>(),vertices=selected.length;for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){let a=index[i+k],b=index[i+(k+1)%3];if(a>b)[a,b]=[b,a];if(a!==b&&(selected[a]||selected[b]))edges.add(a*vertices+b);}work+=edges.size*SURFACE_RELAXATION_ITERATIONS;}return true;});return [r,eligible&&work<=(edgeBudget.limit-edgeBudget.used)/radii.length] as const;}));
   radii=radii.sort((a,b)=>Number(fits.get(b))-Number(fits.get(a)));
  }
  for(const chosenRadius of radii){
  const scores=new Map<string,ReturnType<typeof emptyScore>>(),key=(p:WeightCorrectionProposal)=>[p.from,p.to,p.amount,p.region.radius].join(':');
  const proposal=await searchWeightCorrection(rig,target.pose,joint,chosenRadius,signal,valid,{center,measure,candidate:()=>{state.candidates++;},accept:async(_candidate,overrides)=>{
   state.phase='validation';const score=emptyScore();
   for(const frame of frames){await tick();measure();const report=inspect(frame.pose,overrides);if(!noMeasuredRegression(frame.before,report)){state.phase='search';return false;}scoreReport(score,report);}
   const intersection=checkCandidateIntersectionFrames(rig,intersectionPoses,[...overrides.keys()],overrides,undefined,()=>{ensure();measure();});
   if(!intersection.accepted){state.phase='search';return false;}
   scores.set(key(_candidate),score);state.phase='search';return true;
  }});
  if(proposal&&beats(scores.get(key(proposal))!,proposal.after))best={...proposal,...scores.get(key(proposal))!,target:structuredClone(target.pose),targetOrigin:{...target.origin},jointId:joint.id,motionSamples,checkedMoves:rig.data.moves.length,checkedJoints:state.joints,checkedCandidates:state.candidates};
  for(const method of ['dual-quaternion','edge-fit','edge-relaxation'] as const){
  const centers=method==='edge-relaxation'&&new T.Vector3().fromArray(center).distanceToSquared(new T.Vector3().fromArray(joint.rest))>1e-12?[center,joint.rest]:[center];
  for(const fitCenter of centers){
  let edgeShape:StudioCorrectiveShape|null=null;
  if(method==='edge-fit'){for(let k=0;k<4;k++)measure();edgeShape=await buildEdgeFitCorrection(rig,target.pose,joint,chosenRadius,signal,edgeBudget,valid,fitCenter);state.edgeOperations=edgeBudget.used;}
  if(method==='edge-relaxation'){for(let k=0;k<4;k++)measure();edgeShape=await buildEdgeRelaxationCorrection(rig,target.pose,joint,chosenRadius,signal,edgeBudget,valid,fitCenter);if(edgeShape)edgeShape=await limitCorrectiveStrain(rig,edgeShape,[...correctionSamples(rig,target.pose,8),target.pose],signal,edgeBudget,valid,measure);state.edgeOperations=edgeBudget.used;}
  for(const strength of [.5,1]){
   await tick();measure();state.candidates++;let shape=method==='dual-quaternion'?buildGeometricCorrection(rig,target.pose,joint,chosenRadius,strength,undefined,fitCenter):edgeShape?{...structuredClone(edgeShape),meshes:edgeShape.meshes.map(m=>({...m,indices:[...m.indices],deltas:m.deltas.map(n=>n*strength)}))}:null;if(!shape)continue;
   const evaluate=async(candidate:StudioCorrectiveShape)=>{
    measure();const after=inspect(target.pose,undefined,candidate);if(!betterSurfaceReport(after,target.before)||!noMeasuredRegression(target.before,after))return null;
    state.phase='validation';const score=emptyScore();
    for(const frame of frames){await tick();measure();const report=inspect(frame.pose,undefined,candidate);if(!noMeasuredRegression(frame.before,report)){state.phase='search';return null;}scoreReport(score,report);}
    for(const pose of correctionSamples(rig,target.pose,method==='edge-relaxation'?8:4)){await tick();measure();const before=inspect(pose);measure();if(!noMeasuredRegression(before,inspect(pose,undefined,candidate))){state.phase='search';return null;}}
    state.phase='search';return beats(score,after)?{after,score}:null;
   };
   let evaluation=await evaluate(shape);if(!evaluation)continue;
   const collisionGate=(candidate:StudioCorrectiveShape)=>checkCandidateIntersectionFrames(rig,intersectionPoses,candidate.meshes.map(m=>m.mesh),undefined,candidate,()=>{ensure();measure();}).accepted&&(method!=='edge-relaxation'||checkCandidateIntersectionFrames(rig,correctionSamples(rig,target.pose),candidate.meshes.map(m=>m.mesh),undefined,candidate,()=>{ensure();measure();}).accepted);
   if(!collisionGate(shape)){
    // Refine only the full-strength positional candidate. Every yielded diagnostic
    // shares the existing work/revision reserve; the half-strength variant remains
    // an independent candidate. Attenuation is followed by ALL ordinary gates again.
    if(method!=='edge-relaxation'||strength!==1)continue;
    // Include the measured motion peak that actually caused rejection. Neutral
    // and duplicate values spend no refinement query; every gate is repeated below.
    const refinePoses=activeCorrectiveIntersectionPoses(rig,[...intersectionPoses,...correctionSamples(rig,target.pose)],shape);
    for(let offset=0;shape&&offset<refinePoses.length;offset+=4)shape=await attenuateCorrectiveIntersections(rig,shape,refinePoses.slice(offset,offset+4),signal,edgeBudget,valid,measure);
    if(shape)shape=await limitCorrectiveStrain(rig,shape,[...correctionSamples(rig,target.pose,8),target.pose],signal,edgeBudget,valid,measure);
    state.edgeOperations=edgeBudget.used;if(!shape)continue;
    evaluation=await evaluate(shape);if(!evaluation||!collisionGate(shape))continue;
   }
   const {after,score}=evaluation;
   const parent=rig.data.points.find(p=>p.kind==='bone'&&rig.bones[p.bone!]===rig.bones[joint.bone!].parent)!;
   best={kind:'geometry',geometryMethod:method,shape,...score,from:joint.id,to:parent.id,amount:strength,region:{center:[...fitCenter] as [number,number,number],radius:chosenRadius},poseId:target.pose.id,before:target.before,after,affectedVertices:shape.meshes.reduce((n,m)=>n+m.indices.length,0),checkedPoses:rig.data.poses.length,intermediateSamples:method==='edge-relaxation'?7:3,target:structuredClone(target.pose),targetOrigin:{...target.origin},jointId:joint.id,motionSamples,checkedMoves:rig.data.moves.length,checkedJoints:state.joints,checkedCandidates:state.candidates};
  }
  }
  }

  }
 }
 }catch(error){
  // Keep only an earlier fully validated proposal. A candidate interrupted in any
  // gate is discarded; aborts, stale revisions and other errors still propagate.
  if(!(error instanceof AutomaticSkinBudgetError)||!best)throw error;
 }
 await tick();ensure();if(best){best.vertexSamples=state.vertexSamples;best.vertexBudgetExhausted=vertexBudgetExhausted;best.checkedJoints=state.joints;best.checkedCandidates=state.candidates;best.edgeOperations=edgeBudget.used;best.edgeBudgetExhausted=edgeBudget.exhausted;}return best;
}
