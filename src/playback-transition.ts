import {Matrix4,Quaternion,Vector3} from 'three';
import type {Object3D} from 'three';
interface Pose {
 node:Object3D;parent:Object3D|null;position:Vector3;rotation:Quaternion;scale:Vector3;
 matrix:Matrix4;auto:boolean;morphs?:number[];
}
/** Temporary display pose; restore the animation's exact target before its next update. */
export class PlaybackTransition {
 private source:Pose[]|null=null;
 private target:Pose[]|null=null;
 private elapsed=0;
 constructor(privateRoot:Object3D){this.root=privateRoot;}
 private readonly root:Object3D;
 get active(){return this.source!==null;}
 private capture():Pose[]{
  const poses:Pose[]=[];
  this.root.traverse(node=>{
   if(node.matrixAutoUpdate)node.updateMatrix();
   const morphs=(node as Object3D&{morphTargetInfluences?:number[]}).morphTargetInfluences;
   poses.push({node,parent:node.parent,position:node.position.clone(),rotation:node.quaternion.clone(),scale:node.scale.clone(),matrix:node.matrix.clone(),auto:node.matrixAutoUpdate,...(morphs?{morphs:[...morphs]}:{})});
  });return poses;
 }
 private compatible(poses:Pose[]){
  const matrix=new Matrix4();return poses.every(p=>{
   matrix.compose(p.position,p.rotation,p.scale);
   return p.matrix.elements.every((v,i)=>Number.isFinite(v)&&Math.abs(v-matrix.elements[i])<1e-6);
  });
 }
 begin(){
  // A new command during a fade starts at the currently displayed pose.
  const source=this.capture();this.source=null;this.target=null;this.elapsed=0;
  if(this.compatible(source))this.source=source;
 }
 beforeFrame(){
  if(!this.target)return;
  for(const p of this.target){p.node.position.copy(p.position);p.node.quaternion.copy(p.rotation);p.node.scale.copy(p.scale);p.node.matrix.copy(p.matrix);p.node.matrixAutoUpdate=p.auto;p.node.matrixWorldNeedsUpdate=true;
   const morphs=(p.node as Object3D&{morphTargetInfluences?:number[]}).morphTargetInfluences;if(morphs&&p.morphs)for(let i=0;i<morphs.length;i++)morphs[i]=p.morphs[i];
  }
  this.target=null;this.root.updateMatrixWorld(true);
 }
 afterFrame(delta:number){
  if(!this.source)return;
  this.beforeFrame();
  const target=this.capture();
  if(target.length!==this.source.length||!this.compatible(target)||target.some((p,i)=>p.node!==this.source![i].node||p.parent!==this.source![i].parent||p.morphs?.length!==this.source![i].morphs?.length)){this.source=null;this.target=null;return;}
  this.elapsed+=Number.isFinite(delta)&&delta>0?delta:0;
  const alpha=Math.min(1,this.elapsed/.18);
  if(alpha===1){this.source=null;this.target=null;return;}
  this.target=target;
  for(let i=0;i<target.length;i++){
   const to=target[i],from=this.source[i],node=to.node;
   node.position.lerpVectors(from.position,to.position,alpha);node.quaternion.slerpQuaternions(from.rotation,to.rotation,alpha);node.scale.lerpVectors(from.scale,to.scale,alpha);node.updateMatrix();
   const morphs=(node as Object3D&{morphTargetInfluences?:number[]}).morphTargetInfluences;
   if(morphs&&from.morphs&&to.morphs)for(let j=0;j<morphs.length;j++)morphs[j]=from.morphs[j]+(to.morphs[j]-from.morphs[j])*alpha;
  }
  this.root.updateMatrixWorld(true);
 }
 cancel(){this.beforeFrame();this.source=null;this.elapsed=0;}
}

/** Keep a display fade advancing after natural completion or without a base clip. */
export function playbackTransitionDelta(transport:{current:unknown;paused:boolean;speed:number;finished?:boolean}|null|undefined,delta:number):number {
 if(!Number.isFinite(delta)||delta<=0)return 0;
 if(transport?.current&&transport.paused&&!transport.finished)return 0;
 const speed=transport?.speed??1;
 return Number.isFinite(speed)&&speed>0?delta*speed:0;
}
