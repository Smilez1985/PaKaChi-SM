import * as T from 'three';
export interface EdgeWorkBudget {used:number;limit:number;exhausted:boolean}
/** A bounded virtual weight fit. Never edits input geometry, skin or joint transforms. */
export async function fitSkinEdges(input:{base:ArrayLike<number>;rest:ArrayLike<number>;index:ArrayLike<number>;indices:T.BufferAttribute|T.InterleavedBufferAttribute;weights:T.BufferAttribute|T.InterleavedBufferAttribute;matrices:readonly T.Matrix4[];region:Uint8Array},signal:AbortSignal,budget:EdgeWorkBudget,valid:()=>boolean=()=>true){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert.');};ensure();
 const {base,rest,index,indices,weights,matrices,region}=input,count=base.length/3;
 if(!Number.isInteger(count)||!count||count>200000||rest.length!==base.length||region.length!==count||indices.count!==count||weights.count!==count||indices.itemSize!==4||weights.itemSize!==4||index.length%3||index.length>600000||!matrices.length||matrices.length>256)return null;
 const transformed=new Float64Array(count*12),current=new Float64Array(count*4),posed=new Float64Array(base.length),point=new T.Vector3();
 const updateVertex=(v:number)=>{for(let axis=0;axis<3;axis++){let sum=0;for(let k=0;k<4;k++)sum+=current[v*4+k]*transformed[v*12+k*3+axis];posed[v*3+axis]=sum;}};
 for(let v=0;v<count;v++){
  let sum=0;for(let k=0;k<4;k++){const id=indices.getComponent(v,k),weight=weights.getComponent(v,k);if(!Number.isInteger(id)||id<0||id>=matrices.length||!Number.isFinite(weight)||weight<0)return null;current[v*4+k]=weight;sum+=weight;point.fromArray(base,v*3).applyMatrix4(matrices[id]).toArray(transformed,v*12+k*3);}
  if(Math.abs(sum-1)>1e-4)return null;
 }
 for(let v=0;v<count;v++)updateVertex(v);const edges=new Map<number,{a:number;b:number;length:number;weight:number}>(),adj=new Map<number,Set<number>>(),selected=new Set<number>();
 const distance=(p:ArrayLike<number>,a:number,b:number)=>Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]);
 for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){
  const a=index[i+k],b=index[i+(k+1)%3];if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=count||b>=count)return null;
  if(a===b||!region[a]&&!region[b])continue;const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*count+hi;if(edges.has(key))continue;
  const length=distance(rest,a,b);if(!Number.isFinite(length)||length<1e-8)continue;edges.set(key,{a:lo,b:hi,length,weight:1/(length*length)});if(edges.size>60000)return null;
  if(!adj.has(a))adj.set(a,new Set());if(!adj.has(b))adj.set(b,new Set());adj.get(a)!.add(b);adj.get(b)!.add(a);
  const ratio=distance(posed,a,b)/length;if(ratio<.8||ratio>1.25){if(region[a])selected.add(a);if(region[b])selected.add(b);}
 }
 for(let ring=0;ring<3;ring++)for(const v of [...selected])for(const n of adj.get(v)??[])if(region[n])selected.add(n);
 if(!selected.size||selected.size>8192)return null;
 // Exact duplicate rest vertices with identical original palettes stay tied at seams.
 const seamKey=(v:number)=>[base[v*3],base[v*3+1],base[v*3+2],...Array.from({length:4},(_,k)=>indices.getComponent(v,k)),...Array.from({length:4},(_,k)=>weights.getComponent(v,k))].join(':'),selectedKeys=new Set([...selected].map(seamKey)),seams=new Map<string,number[]>();for(let v=0;v<count;v++)if(region[v]){const key=seamKey(v);if(!selectedKeys.has(key))continue;const group=seams.get(key)??[];group.push(v);seams.set(key,group);}
 const tied=[...seams.values()].filter(g=>g.length>1&&g.some(v=>selected.has(v)));for(const group of tied)for(const v of group)selected.add(v);
 if(selected.size>8192)return null;const active=[...selected],relevant=[...edges.values()].filter(e=>selected.has(e.a)||selected.has(e.b)),iterations=Math.min(128,Math.floor(1_000_000/Math.max(1,relevant.length))),operations=relevant.length*iterations;
 if(relevant.length>30000)return null;if(budget.used+operations>budget.limit){budget.exhausted=true;return null;}budget.used+=operations;
 const allowed=new Uint8Array(count*4),shares=new Float64Array(count*4),groups=new Map<string,number>(),boneGroups=matrices.map(m=>{const key=m.elements.map(n=>Math.round(n*1e8)).join(',');if(!groups.has(key))groups.set(key,groups.size);return groups.get(key)!;});
 for(const v of active){const mass=new Map<number,number>();for(let k=0;k<4;k++)if(current[v*4+k]>1e-8){allowed[v*4+k]=1;const group=boneGroups[indices.getComponent(v,k)];mass.set(group,(mass.get(group)??0)+current[v*4+k]);}for(let k=0;k<4;k++)if(allowed[v*4+k])shares[v*4+k]=current[v*4+k]/mass.get(boneGroups[indices.getComponent(v,k)])!;}
 const force=new Float64Array(base.length),gradient=new Float64Array(count*4),denom=new Float64Array(count),edgeMass=new Float64Array(count);
 for(const edge of relevant){edgeMass[edge.a]+=2*edge.weight;edgeMass[edge.b]+=2*edge.weight;}
 for(const v of active){let maximum=0;for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)if(allowed[v*4+a]&&allowed[v*4+b]){let sum=0;for(let axis=0;axis<3;axis++)sum+=(transformed[v*12+a*3+axis]-transformed[v*12+b*3+axis])**2;maximum=Math.max(maximum,sum);}denom[v]=edgeMass[v]*maximum;}
 for(let iteration=0;iteration<iterations;iteration++){
  if(iteration%4===0){await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();}
  force.fill(0);gradient.fill(0);
  for(const edge of relevant){const a=edge.a*3,b=edge.b*3,dx=posed[a]-posed[b],dy=posed[a+1]-posed[b+1],dz=posed[a+2]-posed[b+2],length=Math.hypot(dx,dy,dz),factor=2*edge.weight*(1-edge.length/Math.max(length,1e-12));for(let axis=0;axis<3;axis++){const value=axis===0?dx:axis===1?dy:dz;force[a+axis]+=factor*value;force[b+axis]-=factor*value;}}
  for(const v of active){if(denom[v]<1e-12)continue;const candidates:{k:number;value:number}[]=[];
   for(let k=0;k<4;k++)if(allowed[v*4+k]){let value=0;for(let axis=0;axis<3;axis++)value+=(transformed[v*12+k*3+axis]-posed[v*3+axis])*force[v*3+axis];gradient[v*4+k]=value;candidates.push({k,value:current[v*4+k]-.65*value/denom[v]});}
   candidates.sort((a,b)=>b.value-a.value);let sum=0,theta=0;for(let k=0;k<candidates.length;k++){sum+=candidates[k].value;const next=(sum-1)/(k+1);if(candidates[k].value>next)theta=next;}for(const c of candidates)current[v*4+c.k]=Math.max(0,c.value-theta);
   const mass=new Map<number,number>();for(const c of candidates){const group=boneGroups[indices.getComponent(v,c.k)];mass.set(group,(mass.get(group)??0)+current[v*4+c.k]);}for(const c of candidates)current[v*4+c.k]=mass.get(boneGroups[indices.getComponent(v,c.k)])!*shares[v*4+c.k];
  }
  for(const group of tied)for(let k=0;k<4;k++){const average=group.reduce((sum,v)=>sum+current[v*4+k],0)/group.length;for(const v of group)current[v*4+k]=average;}
  for(const v of active)updateVertex(v);
 }
 ensure();if(posed.some(n=>!Number.isFinite(n)))return null;return {positions:posed,activeVertices:active.length,operations};
}
