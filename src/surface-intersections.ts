/** Conservative, bounded triangle-triangle self-intersection diagnostics.
 * Adjacent faces are skipped, coplanar overlaps remain explicitly unresolved.
 * This is not a continuous collision or anatomical clearance certificate. */
export const SURFACE_INTERSECTION_PAIR_BUDGET=100_000;
export const SURFACE_INTERSECTION_TRIANGLE_LIMIT=200_000;
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
export interface SurfaceIntersectionReport {
 checked:boolean; reason?:'budget'|'invalid'|'coplanar-or-touching';
 triangles:number; candidatePairs:number; testedPairs:number; broadphasePairs:number; intersections:number; examples:[number,number][];
}
/** Detect transverse internal triangle crossings, never silently claim exhaustive coverage. */
export function checkSurfaceIntersections(positions:Numbers,index:Numbers|null=null,budget= SURFACE_INTERSECTION_PAIR_BUDGET):SurfaceIntersectionReport {
 const count=index?.length??positions.length/3,vertices=positions.length/3,triangles=count/3;
 if(!Number.isInteger(triangles)||!Number.isInteger(vertices)||!Number.isInteger(budget)||budget<0)throw Error('Ungültige Schnittprüfung.');
 const report:SurfaceIntersectionReport={checked:true,triangles,candidatePairs:0,testedPairs:0,broadphasePairs:0,intersections:0,examples:[]};
 // The spatial sweep can process larger meshes, with bounded memory and candidate work.
 if(triangles>SURFACE_INTERSECTION_TRIANGLE_LIMIT){report.checked=false;report.reason='budget';return report;}
 const at=(i:number)=>index?index[i]:i;
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
  refs.push(ids);faces.push(pts);
  bounds.push({lo:[0,1,2].map(k=>Math.min(...pts.map(p=>p[k]))) as V,hi:[0,1,2].map(k=>Math.max(...pts.map(p=>p[k]))) as V});
 }
 // Sweep X-sorted triangle boxes. Cross-chunk pairs are naturally included:
 // each candidate is visited when the triangle with later X-start enters the sweep.
 // A separate broad-phase budget prevents densely overlapping boxes from exploding.
 const order=Array.from({length:triangles},(_,i)=>i).sort((a,b)=>bounds[a].lo[0]-bounds[b].lo[0]||a-b);
 const active:number[]=[],broadphaseLimit=Math.max(1,budget*4);
 for(const b of order){
  const x=bounds[b].lo[0];
  for(let i=active.length-1;i>=0;i--)if(bounds[active[i]].hi[0]<x)active.splice(i,1);
  for(const a of active){
   if(report.broadphasePairs>=broadphaseLimit){report.checked=false;report.reason='budget';return report;}
   report.broadphasePairs++;
   if([1,2].some(k=>bounds[a].hi[k]<bounds[b].lo[k]||bounds[b].hi[k]<bounds[a].lo[k]))continue;
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
   if(hits.includes(1)){report.intersections++;if(report.examples.length<12)report.examples.push([Math.min(a,b),Math.max(a,b)]);}
   // A strict piercing does not resolve a separate boundary contact in the same pair.
   if(hits.includes(2)){report.checked=false;report.reason=report.reason??'coplanar-or-touching';}
  }
  active.push(b);
 }
 return report;
}
