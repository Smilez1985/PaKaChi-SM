import type {StudioRig} from './studio-rig.ts';
import type {Pose} from './studio-data.ts';
import type {StudioCorrectiveShape} from './studio-corrective-shapes.ts';
import {validCorrectiveShapes} from './studio-corrective-shapes.ts';
import type {EdgeWorkBudget} from './skin-edge-fit.ts';
import {correctiveMorphBlend,poseSkinMatrices,poseSurfacePositions} from './pose-surface-check.ts';
import {checkSurfaceIntersections,SURFACE_INTERSECTION_PAIR_BUDGET,SURFACE_INTERSECTION_SPATIAL_MULTIPLIER} from './surface-intersections.ts';

/** Exact canonical values; nearby rotations are never rounded into one sample. */
export function distinctIntersectionPoses(poses:readonly Pose[]){
 const seen=new Set<string>();return poses.filter(pose=>{const key=JSON.stringify(Object.keys(pose.values).sort().map(id=>{const v=pose.values[id];return [id,v.position,v.rotation,v.scale??1];}));if(seen.has(key))return false;seen.add(key);return true;});
}
/** Keep distinct poses where the extra driver contributes; zero is exact. */
export function activeCorrectiveIntersectionPoses(rig:StudioRig,poses:readonly Pose[],shape:StudioCorrectiveShape){
 return distinctIntersectionPoses(poses.filter(pose=>shape.meshes.some(part=>correctiveMorphBlend(rig,pose.values,part.mesh,shape).amount!==0)));
}

/** Attenuate only tested sparse shifts implicated in new triangle pairs.
 * Local two-face trials choose a small tested change, followed by complete scoped
 * queries of every supplied pose. This is not continuous or cross-mesh clearance. */
export async function attenuateCorrectiveIntersections(rig:StudioRig,input:StudioCorrectiveShape,poses:readonly Pose[],signal:AbortSignal,budget:EdgeWorkBudget,valid:()=>boolean=()=>true,measure:()=>void=()=>{}){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert.');};ensure();
 if(!poses.length||poses.length>4||!Number.isSafeInteger(budget.used)||!Number.isSafeInteger(budget.limit)||budget.used<0||budget.limit<0)throw Error('Ungültige Schnitt-Gegenprüfung.');
 if(!validCorrectiveShapes([input]))return null;
 const charge=(cost:number)=>{ensure();if(cost>budget.limit-budget.used){budget.exhausted=true;return false;}budget.used+=cost;return true;};
 const shape=structuredClone(input),states=[];
 for(const part of shape.meshes){
  const surface=rig.surfaces[part.mesh],index=surface?.mesh.geometry.index?.array;
  if(!index||part.indices.some(v=>v>=surface.base.length/3))return null;
  const selected=new Map(part.indices.map((v,i)=>[v,i])),seams=new Map<string,number[]>();
  for(const v of part.indices){const key=Array.from(surface.base.slice(v*3,v*3+3)).join(':'),group=seams.get(key)??[];group.push(v);seams.set(key,group);}
  const seamFor=new Map<number,number[]>();for(const group of seams.values())for(const v of group)seamFor.set(v,group);
  // Reserve retained position/transform storage and selected-vertex preparation.
  if(!charge(poses.length*(surface.base.length/3+part.indices.length*40)))return null;
  const frames=[];
  for(const pose of poses){
   await new Promise<void>(r=>setTimeout(r,0));ensure();
   const original=rig.correctionWeights(pose.values).get(surface.mesh)??surface.mesh.morphTargetInfluences??[],blend=correctiveMorphBlend(rig,pose.values,part.mesh,shape);
   if(Array.from({length:Math.max(original.length,blend.weights.length)},(_,i)=>Math.abs((original[i]??0)-(blend.weights[i]??0))).some(d=>d>1e-12))return null;
   const matrices=poseSkinMatrices(rig,pose.values,part.mesh);if(!matrices)return null;
   const si=surface.mesh.geometry.getAttribute('skinIndex'),sw=surface.mesh.geometry.getAttribute('skinWeight'),transforms=new Float64Array(part.indices.length*9);
   for(let i=0;i<part.indices.length;i++)for(let slot=0;slot<4;slot++){
    const v=part.indices[i],weight=sw.getComponent(v,slot)*blend.amount;if(!weight)continue;const matrix=matrices[si.getComponent(v,slot)];if(!matrix)return null;
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)transforms[i*9+row*3+col]+=weight*matrix.elements[col*4+row];
   }
   measure();const base=poseSurfacePositions(rig,pose.values,part.mesh),pairs=new Set<string>(),triangles=index.length/3;
   const inspect=(positions:ArrayLike<number>,found:Set<string>)=>{
    const available=budget.limit-budget.used-triangles,pairsLimit=Math.min(SURFACE_INTERSECTION_PAIR_BUDGET,Math.floor(available/(SURFACE_INTERSECTION_SPATIAL_MULTIPLIER+1)));
    if(pairsLimit<1){budget.exhausted=true;return false;}
    const report=checkSurfaceIntersections(positions,index,pairsLimit,{affectedVertices:new Set(part.indices),onIntersection:(a,b)=>found.add(a+':'+b)});
    budget.used+=triangles+report.broadphasePairs+report.testedPairs;if(!report.checked&&report.reason==='budget')budget.exhausted=true;return report.checked;
   };
   if(!inspect(base,pairs))return null;
   frames.push({pose,base,transforms,pairs,inspect});
  }
  states.push({part,index,selected,seamFor,frames});
 }
 for(let pass=0;pass<=8;pass++){
  let hasNew=false,changed=false;
  for(const {part,index,selected,seamFor,frames} of states)for(const frame of frames){
   await new Promise<void>(r=>setTimeout(r,0));ensure();measure();const after=poseSurfacePositions(rig,frame.pose.values,part.mesh,undefined,shape),pairs=new Set<string>();if(!frame.inspect(after,pairs))return null;
   const at=(v:number,group:ReadonlySet<number>,alpha:number)=>{
    const p=[frame.base[v*3],frame.base[v*3+1],frame.base[v*3+2]],i=selected.get(v);if(i===undefined)return p;
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){const d=group.has(v)?Math.fround(part.deltas[i*3+col]*alpha):part.deltas[i*3+col];p[row]+=frame.transforms[i*9+row*3+col]*d;}return p;
   };
   for(const pair of pairs)if(!frame.pairs.has(pair)){
    hasNew=true;if(pass===8)return null;
    await new Promise<void>(r=>setTimeout(r,0));ensure();const faces=pair.split(':').map(Number).map(t=>[index[t*3],index[t*3+1],index[t*3+2]]);
    const vertices=[...new Set(faces.flat().flatMap(v=>seamFor.get(v)??[]))].filter(v=>{const i=selected.get(v)!;return part.deltas.slice(i*3,i*3+3).some(d=>d!==0);});
    if(!vertices.length)return null;
    const groups:number[][]=[],keys=new Set<string>(),add=(ids:number[])=>{const values=[...new Set(ids)].sort((a,b)=>a-b);if(!values.length)return;const key=values.join(':');if(!keys.has(key)){keys.add(key);groups.push(values);}};
    if(!charge(vertices.length*8))return null;const vertexSet=new Set(vertices);
    // Enumerate the at most six face aliases, never once per alias vertex.
    // A large imported seam must not turn group construction quadratic.
    for(const v of faces.flat())add((seamFor.get(v)??[]).filter(u=>vertexSet.has(u)));for(const face of faces)add(face.flatMap(v=>seamFor.get(v)??[]).filter(v=>vertexSet.has(v)));add(vertices);
    const clear=(group:Set<number>,alpha:number)=>{if(!charge(64+group.size))return null;const r=checkSurfaceIntersections(faces.flatMap(face=>face.flatMap(v=>at(v,group,alpha))),null,1);return r.checked&&r.intersections===0;};
    const empty=new Set<number>(),current=clear(empty,1);if(current===null)return null;if(current)continue;
    let best:{group:Set<number>;alpha:number;cost:number}|null=null;
    for(const values of pass===7?[vertices]:groups){
     const group=new Set(values),zero=clear(group,0);if(zero===null)return null;if(!zero)continue;
     let low=0,high=1;
     if(pass!==7)for(let step=0;step<14;step++){const middle=(low+high)/2,result=clear(group,middle);if(result===null)return null;if(result)low=middle;else high=middle;}
     // A separately tested retreat avoids choosing the last near-contact value.
     const margin=low*.999,result=clear(group,margin);if(result===null)return null;const alpha=result?margin:low;
     let cost=0;for(const v of group){const a=at(v,empty,1),b=at(v,group,alpha);for(let k=0;k<3;k++)cost+=(a[k]-b[k])**2;}
     if(!best||cost<best.cost)best={group,alpha,cost};
    }
    if(!best||!charge(best.group.size*3))return null;
    for(const v of best.group){const i=selected.get(v)!;for(let k=0;k<3;k++){const d=Math.fround(part.deltas[i*3+k]*best.alpha);if(d!==part.deltas[i*3+k]){part.deltas[i*3+k]=d;changed=true;}}}
   }
  }
  if(!hasNew)break;if(!changed)return null;
 }
 for(const part of shape.meshes){const keep=part.indices.map((_,i)=>i).filter(i=>part.deltas.slice(i*3,i*3+3).some(d=>d!==0));part.deltas=keep.flatMap(i=>part.deltas.slice(i*3,i*3+3));part.indices=keep.map(i=>part.indices[i]);}
 shape.meshes=shape.meshes.filter(p=>p.indices.length);ensure();return shape.meshes.length?shape:null;
}
