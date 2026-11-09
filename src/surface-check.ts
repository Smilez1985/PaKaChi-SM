/** Rotation-invariant triangle strain. A geometric warning, not an anatomy verdict. */
export interface SurfaceLimits {minimumStretch:number;maximumStretch:number;minimumAreaRatio:number}
export const SURFACE_LIMITS:Readonly<SurfaceLimits>=Object.freeze({minimumStretch:.25,maximumStretch:3,minimumAreaRatio:.1});
export interface SurfaceShapeReport {
  vertices:number;triangles:number;compared:number;referenceDegenerate:number;invalid:number;
  stretched:number;compressed:number;collapsed:number;issues:number;
  minimumStretch:number|null;maximumStretch:number|null;
  worst:{triangle:number;minimumStretch:number;maximumStretch:number;areaRatio:number}[];
  status:'within'|'outside'|'unmeasurable';
}
type Numbers=ArrayLike<number>;
function gram(p:Numbers,a:number,b:number,c:number){
  const x=p[b*3]-p[a*3],y=p[b*3+1]-p[a*3+1],z=p[b*3+2]-p[a*3+2];
  const u=p[c*3]-p[a*3],v=p[c*3+1]-p[a*3+1],w=p[c*3+2]-p[a*3+2];
  return [x*x+y*y+z*z,x*u+y*v+z*w,u*u+v*v+w*w];
}
export function checkSurfaceShape(rest:Numbers,posed:Numbers,index:Numbers|null=null,limits:SurfaceLimits=SURFACE_LIMITS):SurfaceShapeReport {
  if(rest.length!==posed.length||!rest.length||rest.length%3)throw Error('Oberflächenpositionen passen nicht zusammen.');
  if(!Number.isFinite(limits.minimumStretch)||!Number.isFinite(limits.maximumStretch)||!Number.isFinite(limits.minimumAreaRatio)||limits.minimumStretch<=0||limits.minimumStretch>=1||limits.maximumStretch<=1||limits.minimumAreaRatio<=0||limits.minimumAreaRatio>=1)throw Error('Ungültige Verformungsgrenzen.');
  const count=index?.length??rest.length/3;if(count%3)throw Error('Dreiecksfolge ist unvollständig.');
  const report:SurfaceShapeReport={vertices:rest.length/3,triangles:count/3,compared:0,referenceDegenerate:0,invalid:0,stretched:0,compressed:0,collapsed:0,issues:0,minimumStretch:null,maximumStretch:null,worst:[],status:'unmeasurable'};
  for(let t=0;t<count;t+=3){
    const a=index?index[t]:t,b=index?index[t+1]:t+1,c=index?index[t+2]:t+2;
    if([a,b,c].some(i=>!Number.isInteger(i)||i<0||i>=report.vertices))throw Error('Dreiecksindex außerhalb der Oberfläche.');
    if([a,b,c].some(i=>[0,1,2].some(k=>!Number.isFinite(rest[i*3+k])||!Number.isFinite(posed[i*3+k])))){report.invalid++;report.issues++;continue;}
    const [r,s,u]=gram(rest,a,b,c),det=r*u-s*s;
    if(!(det>1e-12*Math.max(r*u,1e-300))){report.referenceDegenerate++;continue;}
    const [v,w,x]=gram(posed,a,b,c),areaSquared=Math.max(0,(v*x-w*w)/det),trace=(u*v+r*x-2*s*w)/det;
    const high=Math.max(0,(trace+Math.sqrt(Math.max(0,trace*trace-4*areaSquared)))/2);
    const maximumStretch=Math.sqrt(high),minimumStretch=high>0?Math.sqrt(areaSquared/high):0,areaRatio=Math.sqrt(areaSquared);
    if(![minimumStretch,maximumStretch,areaRatio].every(Number.isFinite)){report.invalid++;report.issues++;continue;}
    report.compared++;report.minimumStretch=Math.min(report.minimumStretch??Infinity,minimumStretch);report.maximumStretch=Math.max(report.maximumStretch??0,maximumStretch);
    const stretched=maximumStretch>limits.maximumStretch,compressed=minimumStretch<limits.minimumStretch,collapsed=areaRatio<limits.minimumAreaRatio;
    if(stretched)report.stretched++;if(compressed)report.compressed++;if(collapsed)report.collapsed++;
    if(stretched||compressed||collapsed){
      report.issues++;report.worst.push({triangle:t/3,minimumStretch,maximumStretch,areaRatio});
      report.worst.sort((a,b)=>Math.max(b.maximumStretch,1/Math.max(b.minimumStretch,1e-12))-Math.max(a.maximumStretch,1/Math.max(a.minimumStretch,1e-12)));report.worst.length=Math.min(report.worst.length,12);
    }
  }
  report.status=report.issues?'outside':report.compared?'within':'unmeasurable';return report;
}
