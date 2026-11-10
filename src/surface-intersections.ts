/** Conservative, bounded triangle-triangle self-intersection diagnostics.
 * Adjacent faces are skipped, coplanar overlaps remain explicitly unresolved.
 * This is not a continuous collision or anatomical clearance certificate. */
export const SURFACE_INTERSECTION_PAIR_BUDGET=100_000;
export const SURFACE_INTERSECTION_TRIANGLE_LIMIT=200_000;
/** Includes rejected node-box pairs; separate from exact triangle-test work. */
export const SURFACE_INTERSECTION_SPATIAL_MULTIPLIER=64;
type Numbers=ArrayLike<number>;
type V=[number,number,number];
const sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const point=(p:Numbers,i:number):V=>[p[i*3],p[i*3+1],p[i*3+2]];
/** 0 = none, 1 = strict transverse piercing, 2 = edge/vertex contact.
 * Coplanar ambiguity is handled by the caller. */
function segmentPierces(a:V,b:V,tri:[V,V,V],tolerance:number):0|1|2{
 const [p,q,r]=tri,d=sub(b,a),e1=sub(q,p),e2=sub(r,p),normal=cross(e1,e2);
 const denom=dot(normal,d),scale=Math.hypot(...normal)*Math.hypot(...d);
 if(Math.abs(denom)<=1e-12*scale)return 0;
 const t=dot(normal,sub(p,a))/denom;
 if(t< -tolerance||t>1+tolerance)return 0;
 const v:[number,number,number]=[a[0]+t*d[0],a[1]+t*d[1],a[2]+t*d[2]];
 const u=sub(v,p),uu=dot(e1,e1),uv=dot(e1,e2),vv=dot(e2,e2),wu=dot(u,e1),wv=dot(u,e2),det=uu*vv-uv*uv;
 if(det<=1e-24)return 0;
 const s=(wu*vv-wv*uv)/det,w=(wv*uu-wu*uv)/det;
 if(s< -tolerance||w< -tolerance||s+w>1+tolerance)return 0;
 return t>tolerance&&t<1-tolerance&&s>tolerance&&w>tolerance&&s+w<1-tolerance?1:2;
}
export interface SurfaceIntersectionOptions {
 /** Enumerate every detected pair within the chosen scope; bounded by the pair budget. */
 onIntersection?:(first:number,second:number)=>void;
 /** Only pairs with a face incident to these vertices. Diagnostic refinement only. */
 affectedVertices?:ReadonlySet<number>;
}
export interface SurfaceIntersectionReport {
 scope?:'affected-vertices';affectedTriangles?:number;
 checked:boolean; reason?:'budget'|'invalid'|'coplanar-or-touching';
 triangles:number; candidatePairs:number; testedPairs:number; broadphasePairs:number; intersections:number; examples:[number,number][];
}
/** Detect transverse internal triangle crossings, never silently claim exhaustive coverage. */
export function checkSurfaceIntersections(positions:Numbers,index:Numbers|null=null,budget= SURFACE_INTERSECTION_PAIR_BUDGET,options:SurfaceIntersectionOptions={}):SurfaceIntersectionReport {
 const count=index?.length??positions.length/3,vertices=positions.length/3,triangles=count/3;
 if(!Number.isInteger(triangles)||!Number.isInteger(vertices)||!Number.isInteger(budget)||budget<0)throw Error('Ungültige Schnittprüfung.');
 const report:SurfaceIntersectionReport={checked:true,triangles,candidatePairs:0,testedPairs:0,broadphasePairs:0,intersections:0,examples:[]};
 // Memory is bounded independently of both spatial and exact-test work.
 if(triangles>SURFACE_INTERSECTION_TRIANGLE_LIMIT){report.checked=false;report.reason='budget';return report;}
 if(options.affectedVertices){if([...options.affectedVertices].some(v=>!Number.isInteger(v)||v<0||v>=vertices))throw Error('Ungültiger Schnittbereich.');report.scope='affected-vertices';report.affectedTriangles=0;}
 const at=(i:number)=>index?index[i]:i;
 const active:boolean[]=[];
 const refs:number[][]=[],faces:[V,V,V][]=[],bounds:{lo:V;hi:V}[]=[];
 for(let t=0;t<triangles;t++){
  const ids=[at(t*3),at(t*3+1),at(t*3+2)];
  if(ids.some(i=>!Number.isInteger(i)||i<0||i>=vertices)||ids.some(i=>[0,1,2].some(k=>!Number.isFinite(positions[i*3+k])))){
   report.checked=false;report.reason='invalid';return report;
  }
  const pts=ids.map(i=>point(positions,i)) as [V,V,V];
  // Every triangle must be valid, including isolated or nonoverlapping faces.
  const edge1=sub(pts[1],pts[0]),edge2=sub(pts[2],pts[0]),area2=Math.hypot(...cross(edge1,edge2));
  const scale=Math.max(Math.hypot(...edge1),Math.hypot(...edge2),Math.hypot(...sub(pts[2],pts[1])));
  if(!Number.isFinite(area2)||!Number.isFinite(scale)||scale===0||area2<=1e-12*scale*scale){
   report.checked=false;report.reason='invalid';return report;
  }
  const affected=!options.affectedVertices||ids.some(v=>options.affectedVertices!.has(v));active.push(affected);if(options.affectedVertices&&affected)report.affectedTriangles!++;
  refs.push(ids);faces.push(pts);
  bounds.push({lo:[0,1,2].map(k=>Math.min(...pts.map(p=>p[k]))) as V,hi:[0,1,2].map(k=>Math.max(...pts.map(p=>p[k]))) as V});
 }
 // A balanced 3D bounds tree retains cross-partition pairs without materializing
 // all candidates. A one-axis sweep can exhaust its budget on X-overlapping faces
 // that are far apart in Y/Z. Every tree pair is unique, including split boundaries.
 type Node={active:boolean;lo:V;hi:V;start:number;end:number;left:number;right:number};
 const order=Array.from({length:triangles},(_,i)=>i),nodes:Node[]=[];
 const build=(start:number,end:number):number=>{
  const lo:V=[Infinity,Infinity,Infinity],hi:V=[-Infinity,-Infinity,-Infinity];
  const centerLo:V=[Infinity,Infinity,Infinity],centerHi:V=[-Infinity,-Infinity,-Infinity];let hasActive=false;
  for(let i=start;i<end;i++){hasActive ||= active[order[i]];for(let k=0;k<3;k++){
   const box=bounds[order[i]],center=box.lo[k]/2+box.hi[k]/2;
   lo[k]=Math.min(lo[k],box.lo[k]);hi[k]=Math.max(hi[k],box.hi[k]);
   centerLo[k]=Math.min(centerLo[k],center);centerHi[k]=Math.max(centerHi[k],center);
  }}
  const id=nodes.length,node:Node={active:hasActive,lo,hi,start,end,left:-1,right:-1};nodes.push(node);
  if(end-start>1){
   let axis=0;for(let k=1;k<3;k++)if(centerHi[k]-centerLo[k]>centerHi[axis]-centerLo[axis])axis=k;
   const sorted=order.slice(start,end).sort((a,b)=>(bounds[a].lo[axis]/2+bounds[a].hi[axis]/2)-(bounds[b].lo[axis]/2+bounds[b].hi[axis]/2)||a-b);
   for(let i=0;i<sorted.length;i++)order[start+i]=sorted[i];
   const middle=start+Math.floor((end-start)/2);node.left=build(start,middle);node.right=build(middle,end);
  }
  return id;
 };
 if(!triangles)return report;
 const root=build(0,triangles),pending:[number,number][]=[[root,root]];
 const broadphaseLimit=Math.max(1,budget*SURFACE_INTERSECTION_SPATIAL_MULTIPLIER);
 while(pending.length){
  const [first,second]=pending.pop()!,oneNode=nodes[first],twoNode=nodes[second];
  if(!oneNode.active&&!twoNode.active)continue;
  if(first===second){
   if(oneNode.left>=0)pending.push([oneNode.right,oneNode.right],[oneNode.left,oneNode.right],[oneNode.left,oneNode.left]);
   continue;
  }
  if(report.broadphasePairs>=broadphaseLimit){report.checked=false;report.reason='budget';return report;}
  report.broadphasePairs++;
  if([0,1,2].some(k=>oneNode.hi[k]<twoNode.lo[k]||twoNode.hi[k]<oneNode.lo[k]))continue;
  if(oneNode.left>=0&&(twoNode.left<0||oneNode.end-oneNode.start>=twoNode.end-twoNode.start)){
   pending.push([oneNode.right,second],[oneNode.left,second]);continue;
  }
  if(twoNode.left>=0){pending.push([first,twoNode.right],[first,twoNode.left]);continue;}
  const a=order[oneNode.start],b=order[twoNode.start];
  if(refs[a].some(i=>refs[b].includes(i)))continue;
  report.candidatePairs++;
  if(report.testedPairs>=budget){report.checked=false;report.reason='budget';return report;}
  report.testedPairs++;
  const one=faces[a],two=faces[b],n1=cross(sub(one[1],one[0]),sub(one[2],one[0])),n2=cross(sub(two[1],two[0]),sub(two[2],two[0]));
  const norm1=Math.hypot(...n1),norm2=Math.hypot(...n2);
  if(norm1<=1e-12||norm2<=1e-12){report.checked=false;report.reason='invalid';continue;}
  const parallel=Math.hypot(...cross(n1,n2))<=1e-10*norm1*norm2;
  if(parallel){
   if(Math.abs(dot(n1,sub(two[0],one[0])))<=1e-10*norm1){report.checked=false;report.reason=report.reason??'coplanar-or-touching';}
   continue;
  }
  const contacts=(p:[V,V,V],q:[V,V,V])=>[0,1,2].map(k=>segmentPierces(p[k],p[(k+1)%3],q,1e-9));
  const hits=[...contacts(one,two),...contacts(two,one)];
  if(hits.includes(1)){report.intersections++;options.onIntersection?.(Math.min(a,b),Math.max(a,b));if(report.examples.length<12)report.examples.push([Math.min(a,b),Math.max(a,b)]);}
  // A strict piercing does not resolve a separate boundary contact in the same pair.
  if(hits.includes(2)){report.checked=false;report.reason=report.reason??'coplanar-or-touching';}
 }
 return report;
}
