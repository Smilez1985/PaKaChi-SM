import {transferSkinInfluences} from './studio-weight-transfer.ts';
import {StudioWeightVisibility} from './studio-weight-visibility.ts';
import * as T from 'three';
import {validWeightRegion} from './studio-data.ts';
import type {WeightRegion} from './studio-data.ts';
import type {BoneInsertion} from './studio-data.ts';
export interface WeightTransfer {from:number;to:number;amount:number;after:number;region?:WeightRegion}
export interface BoneReparent {bone:number;parent:number;after:number}
/** Positive uniform branch scales admit a fixed compensation on the moved bone. */
export function validateReparent(bone:T.Bone|undefined,parent:T.Bone|undefined){
 if(!bone||!parent||!(bone.parent instanceof T.Bone)||bone.parent===parent)throw Error('Einen Knochen und einen anderen Elternknochen auswählen. Wurzeln können nicht umgehängt werden.');
 const chain=(start:T.Bone)=>{const result:T.Bone[]=[];let node:T.Object3D|null=start;while(node instanceof T.Bone){if(result.includes(node))throw Error('Kreis im Skelett.');result.push(node);node=node.parent;}return result;};
 const a=chain(bone),b=chain(parent);
 if(b.includes(bone))throw Error('Ein Knochen kann nicht unter sich selbst oder einem Nachfahren hängen.');
 if(a.at(-1)!==b.at(-1))throw Error('Umhängen ist nur innerhalb desselben Skelettbaums möglich.');
 const common=a.find(n=>b.includes(n))!;
 const uniformProduct=(nodes:T.Bone[])=>nodes.reduce((product,n)=>{const {x,y,z}=n.scale;
  if(![x,y,z].every(Number.isFinite)||x<=1e-8||Math.abs(y-x)>1e-10*Math.max(1,x)||Math.abs(z-x)>1e-10*Math.max(1,x))return NaN;
  return product*x;
 },1);
 if(bone.scale.toArray().some(v=>!Number.isFinite(v)||Math.abs(v)<1e-8))throw Error('Knochenskalierung ist nicht invertierbar.');
 const from=uniformProduct(a.slice(1,a.indexOf(common))),to=uniformProduct(b.slice(0,b.indexOf(common)));
 if(!Number.isFinite(from)||!Number.isFinite(to)||Math.min(from,to)<=1e-8)throw Error('Skalierte Knochenketten benötigen positive gleichmäßige Astskalierungen.');
 // Preserve the exact old interpretation of already supported equal-scale edits.
 const ratio=Math.abs(from-to)<=1e-10*Math.max(from,to)?1:from/to;
 if(!Number.isFinite(ratio)||ratio<=0||bone.scale.toArray().some(v=>!Number.isFinite(v*ratio)||Math.abs(v*ratio)<1e-8))throw Error('Ausgeglichene Knochenskalierung ist nicht invertierbar.');
 if(a.slice(a.indexOf(common)).some(n=>n.scale.toArray().some(v=>!Number.isFinite(v)||Math.abs(v)<1e-8)))throw Error('Gemeinsame Elternskalierung ist nicht invertierbar.');
 // Rigid attachment subtrees follow the bone unchanged. Nested rigs need separate conversion.
 for(const child of bone.children)if(!(child instanceof T.Bone))child.traverse(node=>{if(node instanceof T.Bone||node instanceof T.SkinnedMesh)throw Error('Anbauteile mit eigenem Skelett können nicht umgehängt werden.');});
 return {common,ratio};
}
/** Reversible topology overlay. Source skeletons and vertex weights remain recoverable. */
export class StudioTopology {
 private parents:{bone:T.Bone;parent:T.Object3D;position:T.Vector3;scale:T.Vector3}[];
 private skins:{mesh:T.SkinnedMesh;skeleton:T.Skeleton;indices:T.BufferAttribute;weights:T.BufferAttribute;worldPositions:Float64Array}[]=[];
 private added:T.Bone[]=[];
 private generated:T.Skeleton[]=[];
 private source:T.Bone[];
 private visibility:StudioWeightVisibility;
 private viewKey='';
 private visibilityCache=new Map<T.SkinnedMesh,Int8Array>();
 constructor(source:T.Bone[],root:T.Object3D){
  this.source=source;const surfaces:T.Mesh[]=[];root.traverse(n=>{if(n instanceof T.Mesh)surfaces.push(n);});this.visibility=new StudioWeightVisibility(surfaces);
  this.parents=source.map(bone=>({bone,parent:bone.parent!,position:bone.position.clone(),scale:bone.scale.clone()}));
  root.traverse(n=>{if(n instanceof T.SkinnedMesh){
   const positions=n.geometry.getAttribute('position'),worldPositions=new Float64Array(positions.count*3),point=new T.Vector3();
   for(let v=0;v<positions.count;v++)point.fromBufferAttribute(positions,v).applyMatrix4(n.matrixWorld).toArray(worldPositions,v*3);
   this.skins.push({mesh:n,skeleton:n.skeleton,indices:n.geometry.getAttribute('skinIndex').clone() as T.BufferAttribute,weights:n.geometry.getAttribute('skinWeight').clone() as T.BufferAttribute,worldPositions});
  }});
 }
 restore(){
  for(const {bone,parent,position,scale} of this.parents){if(bone.parent!==parent)parent.add(bone);bone.position.copy(position);bone.scale.copy(scale);}
  for(const bone of this.added)bone.removeFromParent();this.added=[];
  for(const s of this.skins){s.mesh.skeleton=s.skeleton;s.mesh.geometry.setAttribute('skinIndex',s.indices.clone());s.mesh.geometry.setAttribute('skinWeight',s.weights.clone());}
  this.generated.forEach(s=>s.dispose());this.generated=[];
 }
 /** Stage all affected palettes before committing: failure never leaves partial weights. */
 transfer(edit:WeightTransfer,from:T.Bone,to:T.Bone){
  const view=edit.region?.view,matrix=view?new T.Matrix4().fromArray(view.projection):null;const key=view?JSON.stringify(view):'';if(key!==this.viewKey){this.viewKey=key;this.visibilityCache.clear();}
  let affected=0;const commits:(()=>void)[]=[];
    for(const s of this.skins){const skeleton=s.mesh.skeleton,source=skeleton.bones.indexOf(from),target=skeleton.bones.indexOf(to);if(source<0)continue;
     const originalIndices=s.mesh.geometry.getAttribute('skinIndex'),originalWeights=s.mesh.geometry.getAttribute('skinWeight');
     const result=transferSkinInfluences(originalIndices,originalWeights,source,target,v=>{
      let amount=edit.amount;
      if(edit.region){const offset=v*3,dx=s.worldPositions[offset]-edit.region.center[0],dy=s.worldPositions[offset+1]-edit.region.center[1],dz=s.worldPositions[offset+2]-edit.region.center[2];const u=T.MathUtils.clamp(1-Math.sqrt(dx*dx+dy*dy+dz*dz)/edit.region.radius,0,1);amount*=u*u*(3-2*u);if(amount<=0)return 0;}
      if(view){let cache=this.visibilityCache.get(s.mesh);if(!cache){cache=new Int8Array(originalIndices.count);this.visibilityCache.set(s.mesh,cache);}if(cache[v]===0)cache[v]=this.visibility.visible(new T.Vector3().fromArray(s.worldPositions,v*3),view,matrix!)?1:-1;if(cache[v]<0)return 0;}
      return amount;
     });
     const {indices,weights:values}=result,changed=result.affected>0;affected+=result.affected;
     if(changed)commits.push(()=>{
      if(originalIndices instanceof T.BufferAttribute&&indices instanceof T.BufferAttribute)originalIndices.array.set(indices.array);
      else for(let v=0;v<indices.count;v++)for(let k=0;k<4;k++)originalIndices.setComponent(v,k,indices.getComponent(v,k));
      if(originalWeights instanceof T.BufferAttribute&&values instanceof T.BufferAttribute)originalWeights.array.set(values.array);
      else for(let v=0;v<values.count;v++)for(let k=0;k<4;k++)originalWeights.setComponent(v,k,values.getComponent(v,k));
      originalIndices.needsUpdate=true;originalWeights.needsUpdate=true;
     });
    }
    if(!affected)throw Error('Der Quellknochen hat keinen übertragbaren Oberflächen-Einfluss.');
  for(const commit of commits)commit();
 }
 build(edits:BoneInsertion[],rest:{position:[number,number,number];rotation:[number,number,number,number]}[],deletions:number[]=[],reparents:BoneReparent[]=[],transfers:WeightTransfer[]=[]):T.Bone[]{
  this.restore();const bones=[...this.source],weights:(()=>void)[]=[],detachedParents=new Map<T.Bone,T.Object3D>();
  // Weight operations run after the final rest transforms are installed. Deleted
  // anchors still need their former ancestry to reconstruct the same rest axis.
  const weightMatrices=new Map<T.Bone,T.Matrix4>();
  const weightWorld=(bone:T.Bone):T.Matrix4=>{
   const cached=weightMatrices.get(bone);if(cached)return cached;
   const parent=bone.parent??detachedParents.get(bone);let matrix:T.Matrix4;
   if(parent instanceof T.Bone)matrix=weightWorld(parent).clone();
   else if(parent){parent.updateWorldMatrix(true,false);matrix=parent.matrixWorld.clone();}
   else matrix=new T.Matrix4();
   matrix.multiply(new T.Matrix4().compose(bone.position,bone.quaternion,bone.scale));weightMatrices.set(bone,matrix);return matrix;
  };
  let changes=0,reparented=0,transferred=0;
  const queueTransfers=()=>{while(transferred<transfers.length&&transfers[transferred].after===changes){const edit=transfers[transferred++],from=bones[edit.from],to=bones[edit.to];
   if(!from||!to||from===to||!from.parent||!to.parent||!Number.isFinite(edit.amount)||edit.amount<=0||edit.amount>1||(edit.region!==undefined&&!validWeightRegion(edit.region)))throw Error('Ungültige Hautgewichtsübertragung.');
   weights.push(()=>this.transfer(edit,from,to));
  }};

  const applyReparents=()=>{queueTransfers();while(reparented<reparents.length&&reparents[reparented].after===changes){const edit=reparents[reparented++],bone=bones[edit.bone],parent=bones[edit.parent],{ratio}=validateReparent(bone,parent);bone.scale.multiplyScalar(ratio);parent.add(bone);}};
  const remove=(index:number)=>{
   applyReparents();
   const bone=bones[index],parent=bone?.parent;
   if(!(parent instanceof T.Bone)||bone.children.some(n=>!(n instanceof T.Bone))||(bone.children.length>0&&bone.scale.distanceTo(new T.Vector3(1,1,1))>1e-8))throw Error('Dieser Knochen kann nicht sicher entfernt werden.');
   weights.push(()=>{
   for(const s of this.skins){
    const old=s.mesh.skeleton,removed=old.bones.indexOf(bone);if(removed<0)continue;
    const parentIndex=old.bones.indexOf(parent);if(parentIndex<0)throw Error('Elternknochen fehlt in der Skinning-Palette.');
    const kept=old.bones.filter(b=>b!==bone),next=new T.Skeleton(kept,old.boneInverses.filter((_,i)=>i!==removed).map(m=>m.clone()));this.generated.push(next);s.mesh.skeleton=next;
    const indices=s.mesh.geometry.getAttribute('skinIndex'),weights=s.mesh.geometry.getAttribute('skinWeight');
    for(let v=0;v<indices.count;v++){
     const merged=new Map<number,number>();
     for(let k=0;k<4;k++){let i=indices.getComponent(v,k);const w=weights.getComponent(v,k);if(!w)continue;if(i===removed)i=parentIndex;const n=i>removed?i-1:i;merged.set(n,(merged.get(n)??0)+w);}
     const entries=[...merged],sum=entries.reduce((s,[,w])=>s+w,0);
     for(let k=0;k<4;k++){indices.setComponent(v,k,entries[k]?.[0]??0);weights.setComponent(v,k,(entries[k]?.[1]??0)/(sum||1));}
    }
    indices.needsUpdate=true;weights.needsUpdate=true;
   }
   });
   detachedParents.set(bone,parent);for(const child of [...bone.children])parent.add(child);bone.removeFromParent();changes++;
  };
  let removed=0;
  for(const edit of edits){
   const stage=edit.afterDeletions??0;
   if(!Number.isInteger(stage)||stage<removed||stage>deletions.length)throw Error('Ungültige Reihenfolge der Knochenänderungen.');
   while(removed<stage)remove(deletions[removed++]);
   applyReparents();
   if(edit.parent!==undefined){
    const parent=bones[edit.parent];
    if(!parent?.parent)throw Error('Elternknochen fehlt.');
    const added=new T.Bone();added.name='StudioJoint'+bones.length;parent.add(added);this.added.push(added);bones.push(added);changes++;
    weights.push(()=>{for(const s of this.skins){const old=s.mesh.skeleton;if(!old.bones.includes(parent))continue;
     const next=new T.Skeleton([...old.bones,added],[...old.boneInverses.map(m=>m.clone()),new T.Matrix4()]);this.generated.push(next);s.mesh.skeleton=next;
    }});
    continue;
   }
   const child=bones[edit.child],parent=child?.parent;
   if(!(parent instanceof T.Bone))throw Error('Zwischengelenk benötigt eine vorhandene Knochenstrecke.');
   const added=new T.Bone();added.name='StudioJoint'+bones.length;parent.add(added);added.add(child);this.added.push(added);bones.push(added);changes++;
   const ratio=edit.ratio;
   weights.push(()=>{
   for(const s of this.skins){
    const skeleton=s.mesh.skeleton,pi=skeleton.bones.indexOf(parent),ci=skeleton.bones.indexOf(child);if(pi<0||ci<0)continue;
    const next=new T.Skeleton([...skeleton.bones,added], [...skeleton.boneInverses.map(m=>m.clone()),new T.Matrix4()]);this.generated.push(next);s.mesh.skeleton=next;
    s.mesh.updateWorldMatrix(true,false);
    const start=new T.Vector3().setFromMatrixPosition(weightWorld(parent)),end=new T.Vector3().setFromMatrixPosition(weightWorld(child)),axis=end.clone().sub(start),length=axis.lengthSq();
    const indices=s.mesh.geometry.getAttribute('skinIndex'),weights=s.mesh.geometry.getAttribute('skinWeight'),positions=s.mesh.geometry.getAttribute('position');
    for(let v=0;v<positions.count;v++){
     const point=new T.Vector3().fromBufferAttribute(positions,v).applyMatrix4(s.mesh.matrixWorld);
     const share=T.MathUtils.clamp(point.sub(start).dot(axis)/Math.max(length,1e-12)/ratio,0,1);
     const influences=new Map<number,number>();
     for(let k=0;k<4;k++){const index=indices.getComponent(v,k),weight=weights.getComponent(v,k);if(!weight)continue;influences.set(index,(influences.get(index)??0)+weight*(index===pi?1-share:1));if(index===pi)influences.set(next.bones.length-1,(influences.get(next.bones.length-1)??0)+weight*share);}
     const sorted=[...influences].filter(([,w])=>w>0).sort((a,b)=>b[1]-a[1]).slice(0,4),sum=sorted.reduce((s,[,w])=>s+w,0);
     for(let k=0;k<4;k++){indices.setComponent(v,k,sorted[k]?.[0]??0);weights.setComponent(v,k,(sorted[k]?.[1]??0)/(sum||1));}
    }
    indices.needsUpdate=true;weights.needsUpdate=true;
   }
   });
  }
  while(removed<deletions.length)remove(deletions[removed++]);
  applyReparents();if(transferred!==transfers.length)throw Error('Ungültige Reihenfolge der Hautgewichte.');if(reparented!==reparents.length)throw Error('Ungültige Reihenfolge der Knochenzuordnungen.');
  if(rest.length!==bones.length)throw Error('Knochenhierarchie passt nicht zur Grundstellung.');
  bones.forEach((bone,i)=>{bone.position.fromArray(rest[i].position);bone.quaternion.fromArray(rest[i].rotation);});
  for(const apply of weights)apply();
  return bones;
 }
}
