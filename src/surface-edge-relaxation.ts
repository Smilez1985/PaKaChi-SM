import type {EdgeWorkBudget} from './skin-edge-fit.ts';
type Numbers=ArrayLike<number>;
export const MAX_SURFACE_RELAXATION_ACTIVE_VERTICES=8192;
export const SURFACE_RELAXATION_ITERATIONS=128;
/** Bounded positional edge-length projections with fixed boundaries and tied UV seams.
 * Returns virtual posed coordinates, never edits geometry or certifies collision freedom. */
export async function relaxSurfaceEdges(input:{rest:Numbers;positions:Numbers;index:Numbers;mobility:Numbers},signal:AbortSignal,budget:EdgeWorkBudget,valid:()=>boolean=()=>true){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert.');};ensure();
 if(!Number.isSafeInteger(budget.used)||!Number.isSafeInteger(budget.limit)||budget.used<0||budget.limit<0)throw Error('Ungültiges Kantenbudget.');
 const {rest,positions,index,mobility}=input,count=positions.length/3;
 if(!Number.isInteger(count)||!count||count>200000||rest.length!==positions.length||mobility.length!==count||index.length%3||index.length>600000)return null;
 const out=Float64Array.from(positions),canonical=new Uint32Array(count),groups=new Map<string,number[]>(),mass=new Float64Array(count);
 for(let v=0;v<count;v++){
  if(!Number.isFinite(mobility[v])||mobility[v]<0||mobility[v]>1)return null;
  const values=[rest[v*3],rest[v*3+1],rest[v*3+2],positions[v*3],positions[v*3+1],positions[v*3+2]];if(values.some(n=>!Number.isFinite(n)))return null;
  const key=values.join(':'),group=groups.get(key);
  if(group){canonical[v]=group[0];group.push(v);mass[group[0]]=Math.min(mass[group[0]],mobility[v]);}
  else{canonical[v]=v;groups.set(key,[v]);mass[v]=mobility[v];}
 }
 const active=[...groups.values()].filter(g=>mass[g[0]]>0),activeVertices=active.reduce((n,g)=>n+g.length,0);
 if(!activeVertices||activeVertices>MAX_SURFACE_RELAXATION_ACTIVE_VERTICES)return null;
 const edges:{a:number;b:number;length:number}[]=[],seen=new Set<number>();let energy=0;
 for(let i=0;i<index.length;i++)if(!Number.isInteger(index[i])||index[i]<0||index[i]>=count)return null;
 for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){
  let a=canonical[index[i+k]],b=canonical[index[i+(k+1)%3]];if(a>b)[a,b]=[b,a];
  if(a===b||!mass[a]&&!mass[b])continue;const key=a*count+b;if(seen.has(key))continue;seen.add(key);
  const length=Math.hypot(rest[b*3]-rest[a*3],rest[b*3+1]-rest[a*3+1],rest[b*3+2]-rest[a*3+2]);if(!Number.isFinite(length)||length<1e-8)continue;
  const current=Math.hypot(out[b*3]-out[a*3],out[b*3+1]-out[a*3+1],out[b*3+2]-out[a*3+2]);energy+=(current/length-1)**2;
  edges.push({a,b,length});if(edges.length>30000)return null;
 }
 if(!edges.length||energy<1e-16)return null;
 const iterations=SURFACE_RELAXATION_ITERATIONS,operations=edges.length*iterations;
 if(budget.used+operations>budget.limit){budget.exhausted=true;return null;}budget.used+=operations;
 for(let iteration=0;iteration<iterations;iteration++){
  if(iteration%4===0){await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();}
  for(const {a,b,length} of edges){
   const x=b*3,y=a*3,dx=out[x]-out[y],dy=out[x+1]-out[y+1],dz=out[x+2]-out[y+2],current=Math.hypot(dx,dy,dz);
   if(current<1e-10)continue;const factor=.5*(current-length)/current/(mass[a]+mass[b]);
   for(let k=0;k<3;k++){const delta=factor*(k===0?dx:k===1?dy:dz);out[y+k]+=mass[a]*delta;out[x+k]-=mass[b]*delta;}
  }
 }
 for(const group of active)for(const v of group)for(let k=0;k<3;k++)out[v*3+k]=out[group[0]*3+k];
 ensure();if(out.some(n=>!Number.isFinite(n)))return null;
 return {positions:out,activeVertices,operations};
}
