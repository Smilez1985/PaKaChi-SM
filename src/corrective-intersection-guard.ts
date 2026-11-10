import {correctiveMorphBlend} from './pose-surface-check.ts';
import type {StudioRig} from './studio-rig.ts';
import type {Pose} from './studio-data.ts';
import type {StudioCorrectiveShape} from './studio-corrective-shapes.ts';
import {validCorrectiveShapes} from './studio-corrective-shapes.ts';
import type {EdgeWorkBudget} from './skin-edge-fit.ts';
import {poseSurfacePositions} from './pose-surface-check.ts';
import {checkSurfaceIntersections,SURFACE_INTERSECTION_PAIR_BUDGET,SURFACE_INTERSECTION_SPATIAL_MULTIPLIER} from './surface-intersections.ts';

/** Freeze sparse shifts on faces that introduce transverse crossings in probe poses.
 * Pair identities, not just totals, distinguish pre-existing crossings. Only complete
 * reports are usable. This refines a candidate; whole-mesh strain/volume/move gates
 * must still pass afterwards. No cross-mesh or continuous collision clearance. */
export async function limitCorrectiveIntersections(rig:StudioRig,input:StudioCorrectiveShape,poses:readonly Pose[],signal:AbortSignal,budget:EdgeWorkBudget,valid:()=>boolean=()=>true,measure:()=>void=()=>{}){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert.');};ensure();
 if(!poses.length||poses.length>4||!Number.isSafeInteger(budget.used)||!Number.isSafeInteger(budget.limit)||budget.used<0||budget.limit<0)throw Error('Ungültige Schnitt-Gegenprüfung.');
 if(!validCorrectiveShapes([input]))return null;
 const shape=structuredClone(input),states=[];
 const inspect=(pose:Pose,mesh:number,pairs:Set<string>,candidate?:StudioCorrectiveShape)=>{
  const surface=rig.surfaces[mesh],geometry=surface.mesh.geometry,index=geometry.index!.array,triangles=index.length/3;
  const part=shape.meshes.find(m=>m.mesh===mesh)!;
  const original=rig.correctionWeights(pose.values).get(surface.mesh)??surface.mesh.morphTargetInfluences??[],blend=correctiveMorphBlend(rig,pose.values,mesh,shape);
  // Sparse support is exact only if adding this driver leaves every imported
  // driver weight unchanged. Otherwise a supposedly fixed face could move.
  if(Array.from({length:Math.max(original.length,blend.weights.length)},(_,i)=>Math.abs((original[i]??0)-(blend.weights[i]??0))).some(d=>d>1e-12))return null;
  // Reserve the worst-case box and exact-pair work of this query, then charge
  // actual work. This prevents even an incomplete diagnostic exceeding the budget.
  const available=budget.limit-budget.used-triangles;
  const pairsLimit=Math.min(SURFACE_INTERSECTION_PAIR_BUDGET,Math.floor(available/(SURFACE_INTERSECTION_SPATIAL_MULTIPLIER+1)));
  if(pairsLimit<1){budget.exhausted=true;return null;}
  ensure();measure();const report=checkSurfaceIntersections(poseSurfacePositions(rig,pose.values,mesh,undefined,candidate),index,pairsLimit,{affectedVertices:new Set(part.indices),onIntersection:(a,b)=>pairs.add(a+':'+b)});
  budget.used+=triangles+report.broadphasePairs+report.testedPairs;
  if(!report.checked&&report.reason==='budget')budget.exhausted=true;
  return report.checked?report:null;
 };
 for(const part of shape.meshes){
  const surface=rig.surfaces[part.mesh],index=surface?.mesh.geometry.index?.array;
  if(!index||part.indices.some(v=>v>=surface.base.length/3))return null;
  const selected=new Map(part.indices.map((v,i)=>[v,i])),seams=new Map<string,number[]>();
  for(const v of part.indices){const key=Array.from(surface.base.slice(v*3,v*3+3)).join(':'),group=seams.get(key)??[];group.push(v);seams.set(key,group);}
  const seamFor=new Map<number,number[]>();for(const group of seams.values())for(const v of group)seamFor.set(v,group);
  const frames=[];
  for(const pose of poses){
   await new Promise<void>(r=>setTimeout(r,0));ensure();const pairs=new Set<string>();
   if(!inspect(pose,part.mesh,pairs))return null;frames.push({pose,pairs});
  }
  states.push({part,index,selected,seamFor,frames});
 }
 // At most eight pruning passes, plus a final complete recheck. Return no partial
 // result if a new crossing persists or the shared work reserve runs out.
 for(let pass=0;pass<=8;pass++){
  let changed=false,hasNew=false;
  for(const {part,index,selected,seamFor,frames} of states){
   const frozen=new Set<number>();
   for(const {pose,pairs} of frames){
    await new Promise<void>(r=>setTimeout(r,0));ensure();const after=new Set<string>();
    if(!inspect(pose,part.mesh,after,shape))return null;
    for(const pair of after)if(!pairs.has(pair)){
     hasNew=true;
     for(const t of pair.split(':').map(Number))for(let k=0;k<3;k++)for(const u of seamFor.get(index[t*3+k])??[])frozen.add(u);
    }
   }
   if(pass===8&&hasNew)return null;
   for(const v of frozen){const i=selected.get(v)!;for(let k=0;k<3;k++)if(part.deltas[i*3+k]!==0){part.deltas[i*3+k]=0;changed=true;}}
  }
  if(!hasNew)break;if(!changed)return null;
 }
 for(const part of shape.meshes){const keep=part.indices.map((_,i)=>i).filter(i=>part.deltas.slice(i*3,i*3+3).some(n=>n!==0));part.deltas=keep.flatMap(i=>part.deltas.slice(i*3,i*3+3));part.indices=keep.map(i=>part.indices[i]);}
 shape.meshes=shape.meshes.filter(m=>m.indices.length);ensure();return shape.meshes.length?shape:null;
}
