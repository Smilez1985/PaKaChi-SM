import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import type {Pose} from './studio-data.ts';
import type {StudioCorrectiveShape} from './studio-corrective-shapes.ts';
import type {EdgeWorkBudget} from './skin-edge-fit.ts';
import {checkSurfaceShape,SURFACE_LIMITS} from './surface-check.ts';
import {correctiveMorphBlend,neutralPoseValues,poseSkinMatrices,poseSurfacePositions} from './pose-surface-check.ts';

/** Freeze sparse corrective vertices that introduce local strain regressions in probe poses.
 * A candidate still needs the ordinary whole-mesh volume, strain and collision gates. */
export async function limitCorrectiveStrain(rig:StudioRig,input:StudioCorrectiveShape,poses:readonly Pose[],signal:AbortSignal,budget:EdgeWorkBudget,valid:()=>boolean=()=>true,measure:()=>void=()=>{}){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert.');};ensure();
 if(!poses.length||poses.length>8||!Number.isSafeInteger(budget.used)||!Number.isSafeInteger(budget.limit)||budget.used<0||budget.limit<0)throw Error('Ungültige Korrektur-Gegenprüfung.');
 const shape=structuredClone(input),restValues=neutralPoseValues(rig);
 const states=[];
 for(const part of shape.meshes){
  const surface=rig.surfaces[part.mesh],mesh=surface?.mesh;if(!(mesh instanceof T.SkinnedMesh)||!mesh.geometry.index)return null;
  const selected=new Map(part.indices.map((v,i)=>[v,i])),index=mesh.geometry.index.array,faces:number[][]=[];
  for(let t=0;t<index.length;t+=3)if([index[t],index[t+1],index[t+2]].some(v=>selected.has(v)))faces.push([index[t],index[t+1],index[t+2]]);
  if(faces.length>12000)return null;const reserved=faces.length*poses.length*9;
  if(budget.used+reserved>budget.limit){budget.exhausted=true;return null;}budget.used+=reserved;
  measure();const rest=poseSurfacePositions(rig,restValues,part.mesh),si=mesh.geometry.getAttribute('skinIndex'),sw=mesh.geometry.getAttribute('skinWeight');
  const seams=new Map<string,number[]>();for(let v=0;v<surface.base.length/3;v++){const key=[surface.base[v*3],surface.base[v*3+1],surface.base[v*3+2]].join(':'),group=seams.get(key)??[];group.push(v);seams.set(key,group);}
  const seamFor=new Map<number,number[]>();for(const group of seams.values())if(group.some(v=>selected.has(v)))for(const v of group)seamFor.set(v,group);
  const frames=[];
  for(const pose of poses){
   await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();
   const blend=correctiveMorphBlend(rig,pose.values,part.mesh,shape),original=rig.correctionWeights(pose.values).get(mesh)??mesh.morphTargetInfluences??[];
   // The sparse displacement cache is exact only when no existing driver is reweighted.
   if(Array.from({length:Math.max(original.length,blend.weights.length)},(_,i)=>Math.abs((original[i]??0)-(blend.weights[i]??0))).some(d=>d>1e-12))return null;
   if(blend.amount<1e-12)continue;
   measure();const base=poseSurfacePositions(rig,pose.values,part.mesh),matrices=poseSkinMatrices(rig,pose.values,part.mesh)!;
   const transforms=new Float64Array(part.indices.length*9);
   for(let i=0;i<part.indices.length;i++)for(let slot=0;slot<4;slot++){
    const v=part.indices[i],weight=sw.getComponent(v,slot)*blend.amount;if(!weight)continue;const matrix=matrices[si.getComponent(v,slot)];if(!matrix)return null;
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)transforms[i*9+row*3+col]+=weight*matrix.elements[col*4+row];
   }
   frames.push({base,transforms,before:faces.map(face=>checkSurfaceShape(rest,base,face))});
  }
  states.push({part,selected,faces,rest,seamFor,frames});
 }
 for(let pass=0;pass<8;pass++){
  await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();let changed=false;
  for(const {part,selected,faces,rest,seamFor,frames} of states){
   const frozen=new Set<number>();
   for(const frame of frames){
    const after=frame.base.slice();for(let i=0;i<part.indices.length;i++)for(let row=0;row<3;row++)for(let col=0;col<3;col++)after[part.indices[i]*3+row]+=frame.transforms[i*9+row*3+col]*part.deltas[i*3+col];
    for(let t=0;t<faces.length;t++){
     const b=frame.before[t],a=checkSurfaceShape(rest,after,faces[t]);
     if(a.invalid||a.stretched>b.stretched||a.compressed>b.compressed||a.collapsed>b.collapsed||(a.minimumStretch??0)<Math.min(SURFACE_LIMITS.minimumStretch,b.minimumStretch??0)-1e-6||(a.maximumStretch??0)>Math.max(SURFACE_LIMITS.maximumStretch,b.maximumStretch??0)+1e-6)for(const v of faces[t])for(const u of seamFor.get(v)??[v])if(selected.has(u))frozen.add(u);
    }
   }
   for(const v of frozen){const i=selected.get(v)!;for(let k=0;k<3;k++)if(part.deltas[i*3+k]!==0){part.deltas[i*3+k]=0;changed=true;}}
  }
  if(!changed)break;
 }
 for(const part of shape.meshes){const keep=part.indices.map((_,i)=>i).filter(i=>part.deltas.slice(i*3,i*3+3).some(n=>n!==0));part.deltas=keep.flatMap(i=>part.deltas.slice(i*3,i*3+3));part.indices=keep.map(i=>part.indices[i]);}
 shape.meshes=shape.meshes.filter(m=>m.indices.length);ensure();return shape.meshes.length?shape:null;
}
