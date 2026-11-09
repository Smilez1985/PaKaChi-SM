/** Algebraic volume estimates, per closed orientable component. No intersection test. */
export const VOLUME_LIMITS=Object.freeze({minimumRatio:.8,maximumRatio:1.2});
type Reason='open'|'non-manifold'|'orientation'|'degenerate'|'zero-reference'|'invalid'|'split-seam';
export interface VolumeComponent {id:number;reference:number;ratio:number|null;reason?:Reason;sampleVertices:number[]}
export interface SurfaceVolumeReport {
 status:'within'|'outside'|'partial'|'unmeasurable';components:VolumeComponent[];measuredComponents:number;unmeasurableComponents:number;issues:number;
 minimumRatio:number|null;maximumRatio:number|null;reasons:Partial<Record<Reason,number>>;limits:typeof VOLUME_LIMITS;selfIntersectionsChecked:false;
}
type Component={id:number;faces:number[];vertices:number[];reference:number;tolerance:number};
/** Exact rest-position welding accommodates UV seams, without editing geometry. */
export function createSurfaceVolumeChecker(reference:ArrayLike<number>,index:ArrayLike<number>|null=null){
 const count=reference.length/3,n=index?.length??count,at=(i:number)=>index?index[i]:i;
 const reasons:Partial<Record<Reason,number>>={},reject=(r:Reason)=>{reasons[r]=(reasons[r]??0)+1;};
 const bad=reference.length%3!==0||n%3!==0||Array.from(reference).some(x=>!Number.isFinite(x))||Array.from({length:n},(_,i)=>at(i)).some(x=>!Number.isInteger(x)||x<0||x>=count);
 const groups:number[][]=[],weld=new Map<string,number>(),ids:number[]=[];
 if(!bad)for(let i=0;i<count;i++){const key=`${reference[i*3]},${reference[i*3+1]},${reference[i*3+2]}`;let id=weld.get(key);if(id===undefined){id=groups.length;weld.set(key,id);groups.push([]);}groups[id].push(i);ids.push(id);}
 const triangles:number[][]=[],edges=new Map<string,{faces:number[];direction:number}>(),incident:number[][]=groups.map(()=>[]),adjacent:number[][]=[];
 if(!bad)for(let f=0;f<n/3;f++){
  const tri=[ids[at(f*3)],ids[at(f*3+1)],ids[at(f*3+2)]];triangles.push(tri);adjacent.push([]);for(const v of new Set(tri))incident[v].push(f);
  for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`,e=edges.get(key)??{faces:[],direction:0};e.faces.push(f);e.direction+=a<b?1:-1;edges.set(key,e);}
 }
 const faults=new Map<number,Reason>();
 for(const e of edges.values()){
  for(let k=1;k<e.faces.length;k++){adjacent[e.faces[0]].push(e.faces[k]);adjacent[e.faces[k]].push(e.faces[0]);}
  const reason:Reason|undefined=e.faces.length<2?'open':e.faces.length>2?'non-manifold':e.direction!==0?'orientation':undefined;
  if(reason)for(const f of e.faces)faults.set(f,reason);
 }
 // The vertex link must be a single fan. Edge incidence alone misses pinched vertices.
 for(let v=0;v<incident.length;v++){
  const faces=incident[v];if(!faces.length)continue;const visited=new Set<number>(),stack=[faces[0]];
  while(stack.length){const f=stack.pop()!;if(visited.has(f))continue;visited.add(f);for(const q of adjacent[f])if(triangles[q].includes(v))stack.push(q);}
  if(visited.size!==faces.length)for(const f of faces)faults.set(f,'non-manifold');
 }
 function signedVolume(positions:ArrayLike<number>,faces:number[],vertices:number[]){
  const anchor=groups[vertices[0]][0]*3,ox=positions[anchor],oy=positions[anchor+1],oz=positions[anchor+2];let sum=0,compensation=0;
  for(const f of faces){const [a,b,c]=triangles[f].map(v=>groups[v][0]*3),ax=positions[a]-ox,ay=positions[a+1]-oy,az=positions[a+2]-oz,bx=positions[b]-ox,by=positions[b+1]-oy,bz=positions[b+2]-oz,cx=positions[c]-ox,cy=positions[c+1]-oy,cz=positions[c+2]-oz;
   const term=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6,y=term-compensation,t=sum+y;compensation=(t-sum)-y;sum=t;
  }return sum;
 }
 const components:Component[]=[],seen=new Set<number>();let componentCount=0;
 if(bad)reject('invalid');else for(let seed=0;seed<triangles.length;seed++){
  if(seen.has(seed))continue;const faces:number[]=[],vertices=new Set<number>(),stack=[seed];let reason:Reason|undefined;
  while(stack.length){const f=stack.pop()!;if(seen.has(f))continue;seen.add(f);faces.push(f);for(const v of triangles[f])vertices.add(v);reason=faults.get(f)??reason;for(const q of adjacent[f])if(!seen.has(q))stack.push(q);}
  const id=componentCount++,vs=[...vertices],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const v of vs)for(let k=0;k<3;k++){const x=reference[groups[v][0]*3+k];min[k]=Math.min(min[k],x);max[k]=Math.max(max[k],x);}
  const size=Math.hypot(...min.map((x,k)=>max[k]-x)),epsilon=Math.max(size*1e-6,Number.EPSILON*Math.max(...min.map(Math.abs),...max.map(Math.abs))*16);
  for(const f of faces){const [a,b,c]=triangles[f].map(v=>groups[v][0]*3),u=[0,1,2].map(k=>reference[b+k]-reference[a+k]),v=[0,1,2].map(k=>reference[c+k]-reference[a+k]);if(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])<=size*size*1e-12)reason='degenerate';}
  const volume=signedVolume(reference,faces,vs);if(!Number.isFinite(volume))reason='invalid';else if(Math.abs(volume)<=size**3*1e-12)reason=reason??'zero-reference';
  if(reason)reject(reason);else components.push({id,faces,vertices:vs,reference:volume,tolerance:epsilon});
 }
 return (positions:ArrayLike<number>):SurfaceVolumeReport=>{
  const why={...reasons},out:VolumeComponent[]=[];let issues=0,measured=0,minimumRatio:number|null=null,maximumRatio:number|null=null;
  for(const c of components){
   let reason:Reason|undefined=positions.length!==reference.length?'invalid':undefined;
   for(const v of c.vertices){const copies=groups[v],a=copies[0]*3;for(const copy of copies){const b=copy*3;if(![positions[b],positions[b+1],positions[b+2]].every(Number.isFinite))reason='invalid';else if(Math.hypot(positions[b]-positions[a],positions[b+1]-positions[a+1],positions[b+2]-positions[a+2])>c.tolerance)reason=reason??'split-seam';}}
   const volume=reason?NaN:signedVolume(positions,c.faces,c.vertices),ratio=volume===0?0:volume/c.reference;
   if(!reason&&!Number.isFinite(ratio))reason='invalid';
   if(reason){why[reason]=(why[reason]??0)+1;issues++;}else{measured++;minimumRatio=Math.min(minimumRatio??Infinity,ratio);maximumRatio=Math.max(maximumRatio??-Infinity,ratio);if(ratio<VOLUME_LIMITS.minimumRatio-1e-6||ratio>VOLUME_LIMITS.maximumRatio+1e-6)issues++;}
   out.push({id:c.id,reference:Math.abs(c.reference),ratio:reason?null:ratio,...reason?{reason}:{},sampleVertices:Array.from({length:Math.min(32,c.vertices.length)},(_,k)=>groups[c.vertices[Math.floor(k*c.vertices.length/Math.min(32,c.vertices.length))]][0])});
  }
  const unavailable=Object.values(why).reduce((n,c)=>n+c,0);
  return {status:issues?'outside':!measured?'unmeasurable':unavailable?'partial':'within',components:out,measuredComponents:measured,unmeasurableComponents:unavailable,issues,minimumRatio,maximumRatio,reasons:why,limits:VOLUME_LIMITS,selfIntersectionsChecked:false};
 };
}
/** Preserve coverage and compare each component's threshold excess, never totals. */
export function noVolumeRegression(before:SurfaceVolumeReport,after:SurfaceVolumeReport){
 if(before.components.length!==after.components.length||after.measuredComponents<before.measuredComponents||after.unmeasurableComponents>before.unmeasurableComponents)return false;
 const excess=(r:number)=>Math.max(0,VOLUME_LIMITS.minimumRatio-r)+Math.max(0,r-VOLUME_LIMITS.maximumRatio);
 return before.components.every((b,i)=>{const a=after.components[i];return a.id===b.id&&(b.ratio===null?a.ratio!==null||a.reason===b.reason:a.ratio!==null&&!(b.ratio>=0&&a.ratio<0)&&excess(a.ratio)<=excess(b.ratio)+1e-6);});
}
export function volumeSeverity(report:SurfaceVolumeReport){return report.components.reduce((n,c)=>n+(c.ratio===null?1:Math.max(0,VOLUME_LIMITS.minimumRatio-c.ratio)+Math.max(0,c.ratio-VOLUME_LIMITS.maximumRatio)),0);}
/** Compact API/UI summary; component arrays remain internal to regression guards. */
export function summarizeVolume(report:SurfaceVolumeReport){const {components,...summary}=report;return summary;}
