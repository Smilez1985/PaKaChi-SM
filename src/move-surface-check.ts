import type {StudioRig} from './studio-rig.ts';
import type {StudioMove} from './studio-data.ts';
import {moveCheckTimes,MOVE_CHECK_STEPS} from './move-limit-check.ts';
import {createPoseSurfaceChecker} from './pose-surface-check.ts';
import {VOLUME_LIMITS} from './surface-volume.ts';
export const MOVE_SURFACE_VERTEX_BUDGET=20_000_000;
/** Read-only samples include key poses, intermediate skin and loop closure. */
export async function checkMoveSurface(rig:StudioRig,move:StudioMove,signal:AbortSignal,valid:()=>boolean=()=>true){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');};ensure();
 const times=moveCheckTimes(rig,move),vertices=rig.surfaces.reduce((sum,s)=>sum+s.base.length/3,0);
 if(!vertices)throw Error('Keine auswertbare Oberfläche.');
 if(vertices*times.length>MOVE_SURFACE_VERTEX_BUDGET)throw Error('Bewegung für die Oberflächenprüfung zu groß. Kürzere Posenfolge prüfen.');
 await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();const inspect=createPoseSurfaceChecker(rig);
 const meshes=new Map<number,{mesh:number;name:string;compared:number;maximumIssues:number;maximumStretch:number|null;minimumStretch:number|null;invalidSamples:number;firstIssue:number|null;worstTime:number|null;volume:{maximumIssues:number;minimumRatio:number|null;maximumRatio:number|null;minimumMeasuredComponents:number;unmeasurableSamples:number;firstIssue:number|null;worstTime:number|null;limits:typeof VOLUME_LIMITS;selfIntersectionsChecked:false}}>();
 for(const time of times){
  await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();
  const report=inspect({id:'sample',name:'Sample',seconds:1,values:rig.sample(move,time)});
  for(const m of report.meshes){
   let item=meshes.get(m.mesh);if(!item){item={mesh:m.mesh,name:m.name,compared:m.compared,maximumIssues:0,maximumStretch:null,minimumStretch:null,invalidSamples:0,firstIssue:null,worstTime:null,volume:{maximumIssues:0,minimumRatio:null,maximumRatio:null,minimumMeasuredComponents:Infinity,unmeasurableSamples:0,firstIssue:null,worstTime:null,limits:VOLUME_LIMITS,selfIntersectionsChecked:false}};meshes.set(m.mesh,item);}
   if(m.issues&&(m.issues>item.maximumIssues||m.issues===item.maximumIssues&&((m.minimumStretch??Infinity)<(item.minimumStretch??Infinity)||m.minimumStretch===item.minimumStretch&&(m.maximumStretch??0)>(item.maximumStretch??0)))){item.maximumIssues=m.issues;item.worstTime=time;}
   if(m.maximumStretch!==null)item.maximumStretch=Math.max(item.maximumStretch??0,m.maximumStretch);
   if(m.minimumStretch!==null)item.minimumStretch=Math.min(item.minimumStretch??Infinity,m.minimumStretch);
   if(m.invalid||!m.compared)item.invalidSamples++;
   if((m.issues||m.invalid||!m.compared)&&item.firstIssue===null)item.firstIssue=time;
   const v=item.volume,r=m.volume;
   if(r.issues&&(r.issues>v.maximumIssues||r.issues===v.maximumIssues&&((r.minimumRatio??Infinity)<(v.minimumRatio??Infinity)||(r.maximumRatio??0)>(v.maximumRatio??0))))v.worstTime=time;
   v.maximumIssues=Math.max(v.maximumIssues,r.issues);v.minimumMeasuredComponents=Math.min(v.minimumMeasuredComponents,r.measuredComponents);
   if(r.minimumRatio!==null)v.minimumRatio=Math.min(v.minimumRatio??Infinity,r.minimumRatio);
   if(r.maximumRatio!==null)v.maximumRatio=Math.max(v.maximumRatio??-Infinity,r.maximumRatio);
   if(r.unmeasurableComponents||!r.measuredComponents)v.unmeasurableSamples++;
   if(r.issues&&v.firstIssue===null)v.firstIssue=time;
  }
 }
 ensure();return {moveId:move.id,samples:times.length,stepsPerSegment:MOVE_CHECK_STEPS,duration:times.at(-1)!,meshes:[...meshes.values()],continuous:false as const};
}
