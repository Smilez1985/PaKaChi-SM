import * as T from 'three';
export interface BoneInsertion {child:number;ratio:number}
/** Reversible topology overlay. Source skeletons and vertex weights remain recoverable. */
export class StudioTopology {
 private parents:{bone:T.Bone;parent:T.Object3D;position:T.Vector3}[];
 private skins:{mesh:T.SkinnedMesh;skeleton:T.Skeleton;indices:T.BufferAttribute;weights:T.BufferAttribute}[]=[];
 private added:T.Bone[]=[];
 private generated:T.Skeleton[]=[];
 private source:T.Bone[];
 constructor(source:T.Bone[],root:T.Object3D){
  this.source=source;
  this.parents=source.map(bone=>({bone,parent:bone.parent!,position:bone.position.clone()}));
  root.traverse(n=>{if(n instanceof T.SkinnedMesh)this.skins.push({mesh:n,skeleton:n.skeleton,indices:n.geometry.getAttribute('skinIndex').clone() as T.BufferAttribute,weights:n.geometry.getAttribute('skinWeight').clone() as T.BufferAttribute});});
 }
 restore(){
  for(const {bone,parent,position} of this.parents){if(bone.parent!==parent)parent.add(bone);bone.position.copy(position);}
  for(const bone of this.added)bone.removeFromParent();this.added=[];
  for(const s of this.skins){s.mesh.skeleton=s.skeleton;s.mesh.geometry.setAttribute('skinIndex',s.indices.clone());s.mesh.geometry.setAttribute('skinWeight',s.weights.clone());}
  this.generated.forEach(s=>s.dispose());this.generated=[];
 }
 build(edits:BoneInsertion[],rest:{position:[number,number,number];rotation:[number,number,number,number]}[]):T.Bone[]{
  this.restore();const bones=[...this.source],splits:{parent:T.Bone;child:T.Bone;added:T.Bone;ratio:number}[]=[];
  for(const edit of edits){
   const child=bones[edit.child],parent=child?.parent;
   if(!(parent instanceof T.Bone)||child.position.lengthSq()<1e-12)throw Error('Zwischengelenk benötigt eine vorhandene Knochenstrecke.');
   const added=new T.Bone();added.name='StudioJoint'+bones.length;added.position.copy(child.position).multiplyScalar(edit.ratio);parent.add(added);added.add(child);child.position.multiplyScalar(1-edit.ratio);this.added.push(added);bones.push(added);
   splits.push({parent,child,added,ratio:edit.ratio});
  }
  if(rest.length!==bones.length)throw Error('Knochenhierarchie passt nicht zur Grundstellung.');
  bones.forEach((bone,i)=>{bone.position.fromArray(rest[i].position);bone.quaternion.fromArray(rest[i].rotation);});
  for(const {parent,child,added,ratio} of splits){
   for(const s of this.skins){
    const skeleton=s.mesh.skeleton,pi=skeleton.bones.indexOf(parent),ci=skeleton.bones.indexOf(child);if(pi<0||ci<0)continue;
    const next=new T.Skeleton([...skeleton.bones,added], [...skeleton.boneInverses.map(m=>m.clone()),new T.Matrix4()]);this.generated.push(next);s.mesh.skeleton=next;
    parent.updateWorldMatrix(true,true);s.mesh.updateWorldMatrix(true,false);
    const start=parent.getWorldPosition(new T.Vector3()),end=child.getWorldPosition(new T.Vector3()),axis=end.clone().sub(start),length=axis.lengthSq();
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
  }
  return bones;
 }
}
