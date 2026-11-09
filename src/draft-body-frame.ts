import * as T from 'three';

export interface DraftBodyFrame {
 mode:'support'|'bounds';reason:'separated-supports'|'insufficient-supports'|'ambiguous-supports'|'manual-bounds';
 center:[number,number,number];right:[number,number,number];forward:[number,number,number];
 width:number;depth:number;height:number;floor:number;
 torsoHeight?:number;
 upperCenter?:[number,number,number];
 supports:[number,number,number][];
}
const quantile=(values:number[],fraction:number)=>{values.sort((a,b)=>a-b);return values[Math.floor((values.length-1)*fraction)];};
/** Geometric standing-frame estimate, not anatomy or a learned pose detector. */
export function estimateDraftBodyFrame(cloud:readonly number[],bounds:T.Box3,feet:2|4):DraftBodyFrame{
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),cell=size.y/48;
 const fallback=(reason:DraftBodyFrame['reason']):DraftBodyFrame=>({mode:'bounds',reason,center:center.toArray(),right:[1,0,0],forward:[0,0,1],width:size.x,depth:size.z,height:size.y,floor:bounds.min.y,supports:[]});
 if(!Number.isFinite(cell)||cell<1e-8)return fallback('insufficient-supports');
 // Occupancy, rather than vertex counts, prevents tessellation density bias.
 const occupied=new Map<string,T.Vector2>();
 for(let i=0;i<cloud.length;i+=3)if(cloud[i+1]<=bounds.min.y+size.y*.12){
  const x=Math.floor((cloud[i]-bounds.min.x)/cell),z=Math.floor((cloud[i+2]-bounds.min.z)/cell);
  occupied.set(`${x}:${z}`,new T.Vector2(bounds.min.x+(x+.5)*cell,bounds.min.z+(z+.5)*cell));
  if(occupied.size>4096)return fallback('ambiguous-supports');
 }
 const points=[...occupied.values()].sort((a,b)=>a.x-b.x||a.y-b.y);
 if(points.length<feet*6)return fallback('insufficient-supports');
 const centers=[points[0].clone()];
 while(centers.length<feet){let far=0,best=-1;points.forEach((p,i)=>{const distance=Math.min(...centers.map(c=>p.distanceToSquared(c)));if(distance>best){best=distance;far=i;}});centers.push(points[far].clone());}
 let owner:number[]=[];
 for(let iteration=0;iteration<24;iteration++){
  owner=points.map(p=>{let best=0;for(let k=1;k<feet;k++)if(p.distanceToSquared(centers[k])<p.distanceToSquared(centers[best]))best=k;return best;});
  const counts=centers.map(()=>0),sums=centers.map(()=>new T.Vector2());points.forEach((p,i)=>{counts[owner[i]]++;sums[owner[i]].add(p);});
  if(counts.some(n=>n<4))return fallback('insufficient-supports');
  let change=0;centers.forEach((c,k)=>{sums[k].divideScalar(counts[k]);change+=c.distanceToSquared(sums[k]);c.copy(sums[k]);});if(change<cell*cell*1e-8)break;
 }
 // Distinct supports need a low-occupancy valley. Small contact seams are tolerated.
 const groups=centers.map((_,k)=>points.filter((_,i)=>owner[i]===k));
 for(let a=0;a<feet;a++)for(let b=a+1;b<feet;b++){
  if(centers[a].distanceTo(centers[b])<size.y*.09)return fallback('ambiguous-supports');
  if(groups[a].some(p=>p.distanceTo(centers[a])>size.y*.22)||groups[b].some(p=>p.distanceTo(centers[b])>size.y*.22))return fallback('ambiguous-supports');
  const axis=centers[b].clone().sub(centers[a]).normalize(),middle=centers[a].clone().add(centers[b]).multiplyScalar(.5),hist=new Map<number,number>();
  for(const p of [...groups[a],...groups[b]]){const bin=Math.round(p.clone().sub(middle).dot(axis)/cell);hist.set(bin,(hist.get(bin)??0)+1);}
  if(Math.min(hist.get(-1)??0,hist.get(0)??0,hist.get(1)??0)>Math.max(...hist.values())*.55)return fallback('ambiguous-supports');
 }
 const origin=centers.reduce((sum,c)=>sum.add(c),new T.Vector2()).divideScalar(feet);
 let right:T.Vector3,forward:T.Vector3,upperCenter:[number,number,number]|undefined;
 if(feet===2){
  centers.sort((a,b)=>a.x-b.x||a.y-b.y);right=new T.Vector3(centers[1].x-centers[0].x,0,centers[1].y-centers[0].y).normalize();forward=new T.Vector3(-right.z,0,right.x);
 }else{
  let xx=0,zz=0,xz=0;for(const c of centers){const x=c.x-origin.x,z=c.y-origin.y;xx+=x*x;zz+=z*z;xz+=x*z;}
  const angle=.5*Math.atan2(2*xz,xx-zz),axes=[new T.Vector3(Math.cos(angle),0,Math.sin(angle)),new T.Vector3(-Math.sin(angle),0,Math.cos(angle))];
  const radius=Math.max(...centers.map(c=>c.distanceTo(origin)))+cell,highX:number[]=[],highY:number[]=[],highZ:number[]=[],seen=new Set<string>();
  for(let i=0;i<cloud.length;i+=3){
   if(cloud[i+1]<bounds.min.y+size.y*.70||Math.hypot(cloud[i]-origin.x,cloud[i+2]-origin.y)>radius)continue;
   const key=[cloud[i],cloud[i+1],cloud[i+2]].map((n,k)=>Math.floor((n-bounds.min.getComponent(k))/cell)).join(':');if(seen.has(key))continue;seen.add(key);highX.push(cloud[i]);highY.push(cloud[i+1]);highZ.push(cloud[i+2]);
  }
  if(highX.length<8)return fallback('ambiguous-supports');
  upperCenter=[quantile(highX,.5),quantile(highY,.5),quantile(highZ,.5)];const upper=new T.Vector3(upperCenter[0]-origin.x,0,upperCenter[2]-origin.y);
  if(upper.length()<size.y*.04)return fallback('ambiguous-supports');upper.normalize();
  forward=axes.sort((a,b)=>Math.abs(b.dot(upper))-Math.abs(a.dot(upper)))[0];if(forward.dot(upper)<0)forward.negate();
  if(forward.z<.2)return fallback('ambiguous-supports');right=new T.Vector3(forward.z,0,-forward.x);
 }
 const projected=centers.map(c=>{const p=new T.Vector3(c.x-origin.x,0,c.y-origin.y);return {x:p.dot(right),z:p.dot(forward)};});
 if(feet===4&&new Set(projected.map(p=>`${p.x>0}:${p.z>0}`)).size!==4)return fallback('ambiguous-supports');
 const spanX=Math.max(...projected.map(p=>p.x))-Math.min(...projected.map(p=>p.x)),spanZ=Math.max(...projected.map(p=>p.z))-Math.min(...projected.map(p=>p.z));
 const width=spanX/(feet===2?.26:.5),depth=feet===4?spanZ/.46:size.z;
 if(width<size.y*.15||width>size.y*2||depth<size.y*.1||depth>size.y*2)return fallback('ambiguous-supports');
 const mid=new T.Vector3(origin.x,center.y,origin.y);
 if(feet===2){
  const depths:number[]=[],seen=new Set<string>();
  for(let i=0;i<cloud.length;i+=3){
   if(cloud[i+1]<bounds.min.y+size.y*.35||cloud[i+1]>bounds.min.y+size.y*.72)continue;
   const p=new T.Vector3(cloud[i]-origin.x,0,cloud[i+2]-origin.y);if(Math.abs(p.dot(right))>spanX*.75)continue;
   const key=[cloud[i],cloud[i+1],cloud[i+2]].map((n,k)=>Math.floor((n-bounds.min.getComponent(k))/cell)).join(':');if(seen.has(key))continue;seen.add(key);depths.push(p.dot(forward));
  }
  if(depths.length>=8){const offset=quantile(depths,.5);if(Math.abs(offset)<size.y*.2)mid.addScaledVector(forward,offset);}
 }
 let torsoHeight:number|undefined;
 if(feet===4){
  const frontX:number[]=[],frontY:number[]=[],frontZ:number[]=[],frontSeen=new Set<string>();
  for(let i=0;i<cloud.length;i+=3){
   const p=new T.Vector3(cloud[i]-origin.x,0,cloud[i+2]-origin.y),z=p.dot(forward);
   if(cloud[i+1]<bounds.min.y+size.y*.70||z<0||z>spanZ*.9||Math.abs(p.dot(right))>spanX*.7)continue;
   const key=[cloud[i],cloud[i+1],cloud[i+2]].map((n,k)=>Math.floor((n-bounds.min.getComponent(k))/cell)).join(':');if(frontSeen.has(key))continue;frontSeen.add(key);frontX.push(cloud[i]);frontY.push(cloud[i+1]);frontZ.push(cloud[i+2]);
  }
  if(frontX.length>=8)upperCenter=[quantile(frontX,.5),quantile(frontY,.5),quantile(frontZ,.5)];
  const heights:number[]=[],seen=new Set<string>();
  for(let i=0;i<cloud.length;i+=3){
   const p=new T.Vector3(cloud[i]-origin.x,0,cloud[i+2]-origin.y),z=p.dot(forward);
   if(Math.abs(p.dot(right))>spanX*.55||z>0||z<-spanZ*.5||cloud[i+1]<bounds.min.y+size.y*.2||cloud[i+1]>bounds.min.y+size.y*.7)continue;
   const grid=[cloud[i],cloud[i+1],cloud[i+2]].map((n,k)=>Math.floor((n-bounds.min.getComponent(k))/cell)),key=grid.join(':');if(seen.has(key))continue;seen.add(key);heights.push(bounds.min.y+(grid[1]+.5)*cell);
  }
  if(heights.length>=8)torsoHeight=quantile(heights,.5);
 }
 return {mode:'support',reason:'separated-supports',center:mid.toArray(),right:right.toArray(),forward:forward.toArray(),width,depth,height:size.y,floor:bounds.min.y,...torsoHeight===undefined?{}:{torsoHeight},...upperCenter?{upperCenter}:{},supports:centers.map(c=>[c.x,bounds.min.y+size.y*.05,c.y])};
}
