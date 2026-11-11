import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

export function weldSource(geometry){
 const source=geometry.clone();source.deleteAttribute('normal');const welded=mergeVertices(source,.00001);source.dispose();
 const index=[],seen=new Set(),ix=welded.index;
 for(let i=0;i<ix.count;i+=3){const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)],key=[...ids].sort((a,b)=>a-b).join(':');if(new Set(ids).size!==3||seen.has(key))continue;seen.add(key);index.push(...ids);}
 welded.setIndex(index);return welded;
}

/** Close only simple boundary loops; fail visibly on a branch or a non-manifold edge. */
export function sealBoundaries(geometry){
 const index=Array.from(geometry.index.array),edges=new Map();
 for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){const a=index[i+k],b=index[i+(k+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;const edge=edges.get(key);if(edge)edge.count++;else edges.set(key,{a,b,count:1});}
 if([...edges.values()].some(e=>e.count>2))throw Error('Non-manifold PaKaChi surface after paw replacement');
 const boundary=[...edges.values()].filter(e=>e.count===1),adjacent=new Map();
 for(const {a,b} of boundary){if(!adjacent.has(a))adjacent.set(a,[]);if(!adjacent.has(b))adjacent.set(b,[]);adjacent.get(a).push(b);adjacent.get(b).push(a);}
 if([...adjacent.values()].some(n=>n.length!==2))throw Error('Branched PaKaChi surface boundary');
 const positions=Array.from(geometry.attributes.position.array),c=geometry.attributes.color,colors=Array.from({length:c.count*3},(_,i)=>c.getComponent(Math.floor(i/3),i%3)),visited=new Set();let loops=0;
 for(const seed of adjacent.keys()){
  if(visited.has(seed))continue;const queue=[seed];visited.add(seed);
  for(let k=0;k<queue.length;k++)for(const n of adjacent.get(queue[k]))if(!visited.has(n)){visited.add(n);queue.push(n);}
  const middle=positions.length/3,members=new Set(queue);for(let k=0;k<3;k++){positions.push(queue.reduce((sum,i)=>sum+positions[i*3+k],0)/queue.length);colors.push(queue.reduce((sum,i)=>sum+colors[i*3+k],0)/queue.length);}
  for(const {a,b} of boundary)if(members.has(a))index.push(b,a,middle);loops++;
 }
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(index);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return {sealedLoops:loops,sealedEdges:boundary.length};
}

/** One named digit hierarchy in both forms; separate solids leave real finger gaps. */
export const digitHierarchy=[];
for(const side of ['Left','Right']){
 for(const digit of ['Index','Middle','Ring','Thumb'])digitHierarchy.push([side+digit+'1',side+'Hand'],[side+digit+'2',side+digit+'1']);
 for(let i=1;i<=3;i++)digitHierarchy.push([`${side}Toe${i}Base`,side+'Foot'],[`${side}Toe${i}Tip`,`${side}Toe${i}Base`]);
}
const vec=a=>new T.Vector3().fromArray(a);
export function pawLayout(form,landmarks){
 const paws=[];
 for(const side of ['Left','Right'])for(const kind of ['Hand','Foot']){
  const name=side+kind,hand=kind==='Hand',standing=hand&&form==='humanoid',center=vec(landmarks[name]);
  const width=standing?.060:hand?.112:.112,depth=standing?.075:.195,height=standing?.045:.055;
  // Wrist/ankle rims overlap the unchanged proximal reconstruction. All coordinates
  // are in the preserved source's Y-up frame, before viewer normalization.
  const cut=center.clone();if(standing)cut.y+=.023;else{cut.y-=.002;cut.z+=depth*.34;}
  const paw={name,standing,center:center.toArray(),width,depth,height,cut:cut.toArray(),radiusX:standing?.052:.085,radiusZ:standing?.092:.045,cutDepth:standing?.085:.13,digits:[]};
  if(standing)landmarks[name]=cut.toArray(); // Palm rotates at its wrist seam, not at its center.
  for(let i=0;i<3;i++){
   const label=hand?side+['Index','Middle','Ring'][i]:`${side}Toe${i+1}`;
   const root=center.clone().add(new T.Vector3((i-1)*width*.30,standing?-height*.35:-.002,standing?.004:depth*.28));
   const direction=new T.Vector3(0,standing?-.019:-.002,standing?.008:.019);
   const middle=root.clone().add(direction),end=middle.clone().add(new T.Vector3(0,standing?-.014:.001,standing?.012:.017));
   const first=label+(hand?'1':'Base'),second=label+(hand?'2':'Tip');
   landmarks[first]=root.toArray();landmarks[second]=middle.toArray();
   paw.digits.push({first,second,end:end.toArray(),radius:standing?.0065:.011});
  }
  if(hand){
   const sign=side==='Left'?-1:1,root=center.clone().add(new T.Vector3(sign*width*.40,standing?.001:.002,standing?.003:depth*.20));
   const middle=root.clone().add(new T.Vector3(sign*.014,standing?-.012:-.002,.014)),end=middle.clone().add(new T.Vector3(sign*.005,standing?-.013:-.002,.013));
   const first=side+'Thumb1',second=side+'Thumb2';landmarks[first]=root.toArray();landmarks[second]=middle.toArray();paw.digits.push({first,second,end:end.toArray(),radius:standing?.007:.009});
  }
  paws.push(paw);
 }
 return paws;
}

/** Clip distal mitts/toe tips, share edge intersections, close each cut loop.
 * Caps are under the palm/toe covers. Sources and unrelated vertices survive.
 */
export function trimPaws(geometry,paws){
 let current=geometry,removedTriangles=0,capTriangles=0;
 for(const paw of paws){
  const p=current.attributes.position,c=current.attributes.color,positions=Array.from(p.array),colors=Array.from({length:c.count*3},(_,i)=>c.getComponent(Math.floor(i/3),i%3)),indices=[],cuts=new Map(),rim=[];
  const center=vec(paw.cut),signed=i=>{const q=new T.Vector3().fromArray(positions,i*3).sub(center),along=paw.standing?q.y:-q.z,radial=paw.standing?q.z:q.y;return Math.max(along,(Math.hypot(q.x/paw.radiusX,radial/paw.radiusZ)-1)*Math.min(paw.radiusX,paw.radiusZ),-along-paw.cutDepth);};
  const intersection=(a,b,sa,sb)=>{
   const key=a<b?`${a}:${b}`:`${b}:${a}`;if(cuts.has(key))return cuts.get(key);
   const t=sa/(sa-sb),i=positions.length/3;
   for(let k=0;k<3;k++){positions.push(positions[a*3+k]+(positions[b*3+k]-positions[a*3+k])*t);colors.push(colors[a*3+k]+(colors[b*3+k]-colors[a*3+k])*t);}
   cuts.set(key,i);return i;
  };
  const ix=current.index;
  for(let j=0;j<ix.count;j+=3){
   const triangle=[ix.getX(j),ix.getX(j+1),ix.getX(j+2)],s=triangle.map(signed);
   if(s.every(v=>v>=0)){indices.push(...triangle);continue;}
   removedTriangles++;const polygon=[],boundary=[];
   for(let k=0;k<3;k++){
    const next=(k+1)%3,a=triangle[k],b=triangle[next];if(s[k]>=0)polygon.push(a);
    if((s[k]>=0)!==(s[next]>=0)){const i=intersection(a,b,s[k],s[next]);polygon.push(i);boundary.push(i);}
   }
   for(let k=1;k<polygon.length-1;k++)indices.push(polygon[0],polygon[k],polygon[k+1]);
   if(boundary.length===2)rim.push(boundary);
  }
  // Orient each cap opposite its retained surface edge; this also closes multiple
  // disconnected surface islands without joining one paw to another body part.
  const edges=new Map();for(const [a,b] of rim){if(!edges.has(a))edges.set(a,[]);if(!edges.has(b))edges.set(b,[]);edges.get(a).push(b);edges.get(b).push(a);}
  const orientedEdges=new Set();for(let k=0;k<indices.length;k+=3)for(let n=0;n<3;n++)orientedEdges.add(`${indices[k+n]}:${indices[k+(n+1)%3]}`);
  const visited=new Set();
  for(const seed of edges.keys()){
   if(visited.has(seed))continue;const loop=[],queue=[seed];visited.add(seed);
   for(let k=0;k<queue.length;k++){const i=queue[k];loop.push(i);for(const n of edges.get(i))if(!visited.has(n)){visited.add(n);queue.push(n);}}
   const middle=positions.length/3;for(let k=0;k<3;k++){positions.push(loop.reduce((sum,i)=>sum+positions[i*3+k],0)/loop.length);colors.push(loop.reduce((sum,i)=>sum+colors[i*3+k],0)/loop.length);}
   const members=new Set(loop);
   for(const [a,b] of rim)if(members.has(a)){
    // Find which orientation belongs to the retained clipped polygon.
    // The reversed retained edge closes the surface with consistent winding.
    const forward=orientedEdges.has(`${a}:${b}`);
    indices.push(...(forward?[b,a,middle]:[a,b,middle]));capTriangles++;
   }
  }
  const next=new T.BufferGeometry();next.setAttribute('position',new T.Float32BufferAttribute(positions,3));next.setAttribute('color',new T.Float32BufferAttribute(colors,3));next.setIndex(indices);if(current!==geometry)current.dispose();current=next;
 }
 // Drop vertices from the removed mitten surfaces; fur sampling must never visit them.
 const used=[...new Set(current.index.array)],mapping=new Map(used.map((old,i)=>[old,i])),compact=new T.BufferGeometry();
 for(const name of ['position','color']){const a=current.attributes[name];compact.setAttribute(name,new T.Float32BufferAttribute(used.flatMap(i=>[a.getX(i),a.getY(i),a.getZ(i)]),3));}
 compact.setIndex(Array.from(current.index.array,i=>mapping.get(i)));current.dispose();compact.computeVertexNormals();compact.computeBoundingBox();compact.computeBoundingSphere();
 return {geometry:compact,report:{removedTriangles,capTriangles,bodyVertices:used.length}};
}

/** Remove only zero-area faces from newly generated rigid capsule geometry.
 * Index-only cleanup: vertex attributes, UVs, normals and bone attachments stay fixed.
 * Never apply this to an arbitrary imported, skinned or morph-target mesh. */
export function pruneDegenerateCapsuleFaces(geometry){
 const position=geometry.getAttribute('position'),index=geometry.getIndex();
 if(!position||!index)throw Error('Indexed capsule geometry required');
 const kept=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 const e1=new T.Vector3(),e2=new T.Vector3(),e3=new T.Vector3(),normal=new T.Vector3();
 let removed=0;
 for(let i=0;i<index.count;i+=3){
  const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
  a.fromBufferAttribute(position,ids[0]);b.fromBufferAttribute(position,ids[1]);c.fromBufferAttribute(position,ids[2]);
  e1.subVectors(b,a);e2.subVectors(c,a);e3.subVectors(c,b);
  const scale=Math.max(e1.length(),e2.length(),e3.length());
  const area2=normal.crossVectors(e1,e2).length();
  if(!Number.isFinite(scale)||!Number.isFinite(area2)||!scale||area2<=1e-12*scale*scale){removed++;continue;}
  kept.push(...ids);
 }
 if(removed)geometry.setIndex(kept);
 return removed;
}

/** Rigid bone attachments use ordinary GLB geometry, including the distal tips. */
export function attachPaws(root,map,paws,landmarks){
 const shell=new T.MeshStandardMaterial({color:0x18201b,roughness:.88,metalness:0}),mechanism=new T.MeshStandardMaterial({color:0x252e28,roughness:.48,metalness:.45}),pad=new T.MeshStandardMaterial({color:0x080e0a,roughness:1,metalness:0}),green=new T.MeshStandardMaterial({color:0x69e248,roughness:.42,metalness:.15,emissive:0x236609,emissiveIntensity:.32});
 function shape(parent,name,world,scale,material){const mesh=new T.Mesh(new T.SphereGeometry(1,16,12),material);mesh.name=name;mesh.position.copy(world).sub(vec(landmarks[parent.name]));mesh.scale.fromArray(scale);parent.add(mesh);return mesh;}
 function segment(bone,end,radius,name){
  const parent=map.get(bone),start=vec(landmarks[bone]),delta=end.clone().sub(start),length=delta.length();
  const g=new T.CapsuleGeometry(radius,Math.max(.0001,length-2*radius),6,12);pruneDegenerateCapsuleFaces(g);
  const mesh=new T.Mesh(g,mechanism);mesh.name=name;mesh.position.copy(delta).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());parent.add(mesh);
  shape(parent,name+'_knuckle',start,[radius*1.06,radius*1.06,radius*1.06],pad);
 }
 for(const paw of paws){
  const bone=map.get(paw.name),center=vec(paw.center),cut=vec(paw.cut);
  const palm=shape(bone,paw.name+'_palm',paw.standing?center:vec(paw.cut),[paw.width*.49,paw.standing?paw.height*.53:.020,paw.standing?paw.depth*.49:.018],shell);palm.userData.pawPart='palm';
  shape(bone,paw.name+'_pad',center.clone().add(new T.Vector3(0,paw.standing?0:-paw.height*.46,paw.standing?paw.depth*.43:0)),[paw.width*.31,paw.standing?paw.height*.32:.004,paw.standing?.003:paw.depth*.29],pad);
  if(paw.standing){const cuff=new T.Mesh(new T.CylinderGeometry(.029,.029,.017,24,1,false),mechanism);cuff.name=paw.name+'_wrist_rim';cuff.scale.z=1.55;cuff.position.copy(cut).sub(vec(landmarks[paw.name]));bone.add(cuff);}
  for(const digit of paw.digits){
   const end=vec(digit.end),middle=vec(landmarks[digit.second]);segment(digit.first,middle,digit.radius,digit.first+'_shell');segment(digit.second,end,digit.radius*.88,digit.second+'_shell');
   const tip=shape(map.get(digit.second),digit.second+'_green_tip',end,[digit.radius*.66,digit.radius*.55,digit.radius*.7],green);tip.userData.pawPart='tip';
  }
 }
 root.userData.paws={version:1,digits:paws.reduce((n,p)=>n+p.digits.length,0),joints:digitHierarchy.length};
}
