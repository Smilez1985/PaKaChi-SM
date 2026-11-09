import * as T from 'three';
/** Fit existing/edge-neighbor influences to rest edge lengths in unchanged poses. */
export function optimizeSkinWeights(geometry,matrixSets,{iterations=160,step=.5}={}){
 const p=geometry.attributes.position,si=geometry.attributes.skinIndex,sw=geometry.attributes.skinWeight,index=geometry.index;
 if(!p||!index||!si||!sw||p.itemSize!==3||si.itemSize!==4||sw.itemSize!==4||si.count!==p.count||sw.count!==p.count||index.count%3||!Array.isArray(matrixSets)||!matrixSets.length||matrixSets.length>12||matrixSets.length*p.count*12>20_000_000||!Number.isInteger(iterations)||iterations<1||iterations>512||!Number.isFinite(step)||step<=0||step>1)throw Error('Unsupported skin optimization input.');
 const count=p.count,boneCount=matrixSets[0].length;if(!boneCount||boneCount>256||matrixSets.some(set=>set.length!==boneCount||set.some(m=>!m||m.elements.some(v=>!Number.isFinite(v)))))throw Error('Invalid pose matrices.');
 for(let v=0;v<count;v++){let sum=0;for(let k=0;k<4;k++){const id=si.getComponent(v,k),w=sw.getComponent(v,k);if(!Number.isInteger(id)||id<0||id>=boneCount||!Number.isFinite(w)||w<0)throw Error('Invalid skin influences.');sum+=w;}if(Math.abs(sum-1)>1e-4||![p.getX(v),p.getY(v),p.getZ(v)].every(Number.isFinite))throw Error('Invalid skin vertex.');}
 for(let i=0;i<index.count;i++)if(!Number.isInteger(index.getX(i))||index.getX(i)<0||index.getX(i)>=count)throw Error('Invalid triangle index.');
 const edges=new Map(),adj=Array.from({length:count},()=>new Set());
 for(let i=0;i<index.count;i+=3)for(let k=0;k<3;k++){const a=index.getX(i+k),b=index.getX(i+(k+1)%3);if(a===b)continue;const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*count+hi;if(edges.has(key))continue;const length=new T.Vector3().fromBufferAttribute(p,a).distanceTo(new T.Vector3().fromBufferAttribute(p,b));if(length<1e-8)continue;edges.set(key,{a:lo,b:hi,length,weight:1/(length*length)});adj[a].add(b);adj[b].add(a);}
 const originalIndices=Uint16Array.from({length:count*4},(_,i)=>si.getComponent(Math.floor(i/4),i%4)),palette=originalIndices.slice(),initial=Float64Array.from({length:count*4},(_,i)=>sw.getComponent(Math.floor(i/4),i%4)),current=initial.slice(),allowed=new Uint8Array(count*4),q=matrixSets.map(()=>new Float64Array(count*3)),t=matrixSets.map(()=>new Float64Array(count*12)),point=new T.Vector3();
 const fillTransforms=()=>matrixSets.forEach((matrices,s)=>{for(let v=0;v<count;v++)for(let k=0;k<4;k++)point.fromBufferAttribute(p,v).applyMatrix4(matrices[palette[v*4+k]]).toArray(t[s],v*12+k*3);});fillTransforms();
 const updatePositions=()=>{q.forEach((positions,s)=>{for(let v=0;v<count;v++)for(let axis=0;axis<3;axis++){let value=0;for(let k=0;k<4;k++)value+=current[v*4+k]*t[s][v*12+k*3+axis];positions[v*3+axis]=value;}});};updatePositions();
 const selected=new Set();for(const e of edges.values())if(q.some(a=>{const len=Math.hypot(a[e.a*3]-a[e.b*3],a[e.a*3+1]-a[e.b*3+1],a[e.a*3+2]-a[e.b*3+2]);return len/e.length>1.5||len/e.length<.5;})){selected.add(e.a);selected.add(e.b);}
 for(let ring=0;ring<4;ring++)for(const v of [...selected])for(const n of adj[v])selected.add(n);
 const keys=new Map(),groups=matrixSets[0].map((_,b)=>{const key=matrixSets.map(set=>set[b].elements.map(n=>Math.round(n*1e8)).join(',')).join(';');if(!keys.has(key))keys.set(key,keys.size);return keys.get(key);}),shares=new Float64Array(count*4);
 const active=[...selected],mask=new Uint8Array(count);for(const v of active){mask[v]=1;const original=new Map(),neighbor=new Map();for(let k=0;k<4;k++)if(initial[v*4+k]>1e-8)original.set(originalIndices[v*4+k],(original.get(originalIndices[v*4+k])??0)+initial[v*4+k]);for(const n of adj[v])for(let k=0;k<4;k++){const b=originalIndices[n*4+k],w=initial[n*4+k];if(w>1e-8)neighbor.set(b,(neighbor.get(b)??0)+w);}
  const slots=[...original.keys()],present=new Set(slots.map(b=>groups[b]));for(const [b]of [...neighbor].sort((a,b)=>b[1]-a[1]))if(!present.has(groups[b])&&slots.length<4){slots.push(b);present.add(groups[b]);}for(let k=0;k<4;k++){palette[v*4+k]=slots[k]??0;current[v*4+k]=original.get(slots[k])??0;allowed[v*4+k]=k<slots.length?1:0;}
  const masses=new Map();for(const b of slots)masses.set(groups[b],(masses.get(groups[b])??0)+(original.get(b)??0));for(let k=0;k<slots.length;k++)shares[v*4+k]=masses.get(groups[slots[k]])?current[v*4+k]/masses.get(groups[slots[k]]):1;

 }
 fillTransforms();updatePositions();
 const relevant=[...edges.values()].filter(e=>mask[e.a]||mask[e.b]),force=new Float64Array(count*3),gradient=new Float64Array(count*4),denom=new Float64Array(count),sums=new Float64Array(count);for(const e of relevant){sums[e.a]+=2*e.weight;sums[e.b]+=2*e.weight;}
 for(const v of active)for(let s=0;s<t.length;s++){let max=0;for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){if(!allowed[v*4+a]||!allowed[v*4+b])continue;let d=0;for(let k=0;k<3;k++)d+=(t[s][v*12+a*3+k]-t[s][v*12+b*3+k])**2;max=Math.max(max,d);}denom[v]+=sums[v]*max;}
 for(let pass=0;pass<iterations;pass++){
  gradient.fill(0);
  for(let s=0;s<q.length;s++){
   force.fill(0);const positions=q[s];
   for(const e of relevant){const a=e.a*3,b=e.b*3,dx=positions[a]-positions[b],dy=positions[a+1]-positions[b+1],dz=positions[a+2]-positions[b+2],len=Math.hypot(dx,dy,dz),factor=2*e.weight*(1-e.length/Math.max(len,1e-12));for(const [axis,d]of [[0,dx],[1,dy],[2,dz]]){force[a+axis]+=factor*d;force[b+axis]-=factor*d;}}
   for(const v of active)for(let k=0;k<4;k++)if(allowed[v*4+k]){let value=0;for(let axis=0;axis<3;axis++)value+=(t[s][v*12+k*3+axis]-positions[v*3+axis])*force[v*3+axis];gradient[v*4+k]+=value;}
  }
  for(const v of active){if(denom[v]<1e-12)continue;const candidates=[];for(let k=0;k<4;k++)if(allowed[v*4+k])candidates.push({k,value:current[v*4+k]-step*gradient[v*4+k]/denom[v]});candidates.sort((a,b)=>b.value-a.value);let sum=0,theta=0;for(let i=0;i<candidates.length;i++){sum+=candidates[i].value;const next=(sum-1)/(i+1);if(candidates[i].value>next)theta=next;}for(const c of candidates)current[v*4+c.k]=Math.max(0,c.value-theta);
   const masses=new Map();for(const c of candidates){const g=groups[palette[v*4+c.k]];masses.set(g,(masses.get(g)??0)+current[v*4+c.k]);}for(const c of candidates)current[v*4+c.k]=masses.get(groups[palette[v*4+c.k]])*shares[v*4+c.k];}
  updatePositions();
 }
 return {indices:palette,weights:Float32Array.from(current),activeVertices:active.length};
}
