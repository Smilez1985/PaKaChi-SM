import * as T from 'three';
export const POSE_MORPHS='pakachiPoseMorphs';
export const POSE_MORPH_BIND='pakachiPoseMorphBind';
interface Binding {mesh:T.Mesh;entries:{bone:T.Bone;index:number;pose:T.Quaternion;radius:number}[]}
const cache=new WeakMap<T.Object3D,Binding[]>(),disabled=new WeakSet<T.Mesh>();
export function poseMorphBindings(root:T.Object3D):Binding[]{
 const previous=cache.get(root);if(previous)return previous;
 const bones:T.Bone[]=[];root.traverse(n=>{if(n instanceof T.Bone)bones.push(n);});const bindings:Binding[]=[];
 const quaternion=(v:unknown)=>Array.isArray(v)&&v.length===4&&v.every(n=>typeof n==='number'&&Number.isFinite(n))&&Math.abs(v.reduce((s,n)=>s+n*n,0)-1)<1e-5;
 root.traverse(mesh=>{if(!(mesh instanceof T.Mesh)||mesh.userData[POSE_MORPHS]===undefined)return;
  const raw=mesh.userData[POSE_MORPHS];if(!Array.isArray(raw)||raw.length>16)throw Error('Ungültige poseabhängige Korrekturformen.');const used=new Set<number>();
  const entries=raw.map(item=>{
   if(!item||typeof item.joint!=='string'||item.joint.length>100||typeof item.target!=='string'||item.target.length>100||!quaternion(item.rest)||!quaternion(item.pose))throw Error('Ungültige poseabhängige Korrekturformen.');
   const matches=bones.filter(b=>b.name===item.joint),index=mesh.morphTargetDictionary?.[item.target];if(matches.length!==1||index===undefined||used.has(index)||!mesh.geometry.morphAttributes.position?.[index])throw Error('Korrekturform passt nicht zum Modell.');used.add(index);
   const rest=new T.Quaternion().fromArray(item.rest),pose=new T.Quaternion().fromArray(item.pose),distance=rest.angleTo(pose),radius=item.radius??distance;if(!Number.isFinite(radius)||radius<.01||radius>distance+1e-8)throw Error('Korrekturform benötigt Abstand zur Grundpose.');return {bone:matches[0],index,pose,radius};
  });bindings.push({mesh,entries});
 });cache.set(root,bindings);return bindings;
}
export function poseMorphsEnabled(mesh:T.Mesh){return !disabled.has(mesh);}
export function poseMorphBindingCompatible(root:T.Object3D){return poseMorphBindings(root).every(({mesh})=>{
 if(!(mesh instanceof T.SkinnedMesh))return true;const reference=mesh.userData[POSE_MORPH_BIND];if(!Array.isArray(reference)||reference.length!==mesh.skeleton.bones.length)return false;
 return mesh.skeleton.boneInverses.every((inverse,i)=>{const expected=reference[i],actual=inverse.clone().multiply(mesh.bindMatrix).elements;return Array.isArray(expected)&&expected.length===16&&expected.every((v:number,k:number)=>Number.isFinite(v)&&Math.abs(v-actual[k])<=1e-6*Math.max(1,Math.abs(v)));});
});}
export function enablePoseMorphs(root:T.Object3D,enabled:boolean){for(const {mesh}of poseMorphBindings(root)){if(enabled)disabled.delete(mesh);else disabled.add(mesh);}}
/** Pure weights, shared by the live renderer, pose checks and sampled GLB export. */
export function poseMorphWeights(root:T.Object3D,rotation:(bone:T.Bone)=>T.Quaternion=bone=>bone.quaternion,enabled=true){
 const result=new Map<T.Mesh,number[]>();
 for(const {mesh,entries}of poseMorphBindings(root)){
  const weights=[...(mesh.morphTargetInfluences??[])];let sum=0;
  for(const entry of entries){const t=enabled&&poseMorphsEnabled(mesh)?T.MathUtils.clamp(1-rotation(entry.bone).angleTo(entry.pose)/entry.radius,0,1):0;const value=t*t*(3-2*t);weights[entry.index]=value;sum+=value;}
  if(sum>1)for(const e of entries)weights[e.index]/=sum;result.set(mesh,weights);
 }return result;
}
export function updatePoseMorphs(root:T.Object3D){for(const [mesh,weights]of poseMorphWeights(root))mesh.morphTargetInfluences=weights;}
