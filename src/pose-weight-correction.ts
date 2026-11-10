import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import type {Pose,ControlPoint,WeightRegion,Transform} from './studio-data.ts';
import {MAX_WEIGHT_TRANSFERS,FIGURE_TRACK,neutralFigure} from './studio-data.ts';
import {createPoseSurfaceChecker,neutralPoseValues,poseSurfacePositions} from './pose-surface-check.ts';
import {transferSkinInfluences} from './studio-weight-transfer.ts';
import {noVolumeRegression,volumeSeverity} from './surface-volume.ts';
export type SurfaceReport=ReturnType<ReturnType<typeof createPoseSurfaceChecker>>;
type Report=SurfaceReport;
export interface WeightCorrectionProposal {from:string;to:string;amount:number;region:WeightRegion;poseId:string;before:Report;after:Report;affectedVertices:number;checkedPoses:number;intermediateSamples:number}
/** Compare threshold excesses and counts. Ordinary motion within limits is allowed. */
export function noMeasuredRegression(before:Report,after:Report){
 return before.meshes.length===after.meshes.length&&before.meshes.every((b,i)=>{const a=after.meshes[i];return a.invalid===0&&a.compared===b.compared&&a.referenceDegenerate===b.referenceDegenerate&&a.issues<=b.issues&&a.stretched<=b.stretched&&a.compressed<=b.compressed&&a.collapsed<=b.collapsed&&Math.max(0,before.limits.minimumStretch-(a.minimumStretch??0))<=Math.max(0,before.limits.minimumStretch-(b.minimumStretch??0))+1e-6&&Math.max(0,(a.maximumStretch??0)-before.limits.maximumStretch)<=Math.max(0,(b.maximumStretch??0)-before.limits.maximumStretch)+1e-6&&noVolumeRegression(b.volume,a.volume);});
}
/** Strain count first, then measured volume excess; unmeasurable volumes never count as fixed. */
export function betterSurfaceReport(after:Report,before:Report){return after.issues<before.issues||after.issues===before.issues&&after.meshes.reduce((n,m)=>n+volumeSeverity(m.volume),0)<before.meshes.reduce((n,m)=>n+volumeSeverity(m.volume),0)-1e-6;}
export function correctionSamples(rig:StudioRig,target:Pose,steps=4){
 if(!Number.isInteger(steps)||steps<2||steps>16)throw Error('Ungültige Anzahl Korrektur-Stichproben.');
 const rest=neutralPoseValues(rig),samples:Pose[]=[];
 for(const fraction of Array.from({length:steps-1},(_,i)=>(i+1)/steps)){
  const values:Record<string,Transform>={[FIGURE_TRACK]:structuredClone(target.values[FIGURE_TRACK]??neutralFigure())};
  for(const point of rig.data.points){const a=rest[point.id],b=target.values[point.id];values[point.id]={position:new T.Vector3().fromArray(a.position).lerp(new T.Vector3().fromArray(b.position),fraction).toArray(),rotation:new T.Quaternion().fromArray(a.rotation).slerp(new T.Quaternion().fromArray(b.rotation),fraction).toArray()};}
  samples.push({id:`sample-${fraction}`,name:'Sample',seconds:1,values});
 }
 return samples;
}
/** Six bounded local transfers between a joint and its parent; live data is never modified. */
export async function searchWeightCorrection(rig:StudioRig,target:Pose,joint:ControlPoint,radius:number,signal:AbortSignal,valid:()=>boolean=()=>true,options:{center?:readonly number[];measure?:()=>void;candidate?:()=>void;accept?:(proposal:WeightCorrectionProposal,overrides:import('./pose-surface-check.ts').SkinOverrides)=>Promise<boolean>}={}){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');};ensure();
 if(joint.kind!=='bone'||!rig.data.points.includes(joint)||!Number.isFinite(radius)||radius<.005||radius>2||(rig.data.weightTransfers?.length??0)>=MAX_WEIGHT_TRANSFERS)throw Error('Gelenk und gültigen Korrekturradius wählen.');
 const parent=rig.data.points.find(p=>p.kind==='bone'&&rig.bones[p.bone!]===rig.bones[joint.bone!].parent);if(!parent)throw Error('Einen Gelenkübergang mit vorhandenem Elternknochen wählen.');
 options.measure?.();const checker=createPoseSurfaceChecker(rig),inspect:typeof checker=(...args)=>{options.measure?.();return checker(...args);},before=inspect(target),bends=rig.checkPoseBends(target);
 if(before.status!=='outside'||before.meshes.some(m=>m.invalid)||bends.unmatched.length||bends.results.some(r=>r.status!=='within'))return null;
 options.measure?.();const rest=neutralPoseValues(rig),reference=rig.surfaces.map((_,i)=>poseSurfacePositions(rig,rest,i));
 const poses=[...rig.data.poses.filter(p=>p.id!==target.id),...correctionSamples(rig,target)],baselines:Report[]=[];
 for(const pose of poses){await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();baselines.push(inspect(pose));}
 if(options.center&&(options.center.length!==3||options.center.some(n=>!Number.isFinite(n)||Math.abs(n)>100)))throw Error('Ungültiger Korrekturbereich.');
 const region:WeightRegion={center:options.center?[...options.center] as [number,number,number]:[...joint.rest],radius},center=new T.Vector3().fromArray(region.center);
 let best:WeightCorrectionProposal|null=null;
 for(const amount of [.1,.2,.35])for(const [from,to] of [[joint,parent],[parent,joint]]){
  await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();
  options.candidate?.();
  const overrides=new Map<number,ReturnType<typeof transferSkinInfluences>>();let affectedVertices=0,unsupported=false;
  for(let i=0;i<rig.surfaces.length;i++){
   const s=rig.surfaces[i],mesh=s.mesh;if(!(mesh instanceof T.SkinnedMesh))continue;
   const source=mesh.skeleton.bones.indexOf(rig.bones[from.bone!]),destination=mesh.skeleton.bones.indexOf(rig.bones[to.bone!]);if(source<0)continue;
   try{
    const result=transferSkinInfluences(mesh.geometry.getAttribute('skinIndex'),mesh.geometry.getAttribute('skinWeight'),source,destination,v=>{const u=T.MathUtils.clamp(1-s.world[v].distanceTo(center)/radius,0,1);return amount*(u*u*(3-2*u));});
    if(result.affected){overrides.set(i,result);affectedVertices+=result.affected;}
   }catch{unsupported=true;break;}
  }
  if(unsupported||!affectedVertices)continue;
  // All originally captured rest vertices must stay in place, not merely retain their lengths.
  options.measure?.();let preserved=true;for(const i of overrides.keys()){
   const positions=poseSurfacePositions(rig,rest,i,overrides);if(positions.some((v,k)=>Math.abs(v-reference[i][k])>1e-6*Math.max(1,Math.abs(reference[i][k])))){preserved=false;break;}
  }
  if(!preserved)continue;
  const after=inspect(target,overrides);if(!betterSurfaceReport(after,before)||!noMeasuredRegression(before,after))continue;
  let safe=true;for(let i=0;i<poses.length;i++){
   await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();if(!noMeasuredRegression(baselines[i],inspect(poses[i],overrides))){safe=false;break;}
  }
  const proposal={from:from.id,to:to.id,amount,region:structuredClone(region),poseId:target.id,before,after,affectedVertices,checkedPoses:rig.data.poses.length,intermediateSamples:3};
  if(safe&&(!options.accept||await options.accept(proposal,overrides))&&(!best||betterSurfaceReport(after,best.after)))best=proposal;
 }
 ensure();return best;
}
