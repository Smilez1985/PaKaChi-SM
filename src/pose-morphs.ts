import * as T from 'three';
export const POSE_MORPHS='pakachiPoseMorphs';
export const POSE_MORPH_BIND='pakachiPoseMorphBind';
export interface PoseMorphShape {joint:string;rest:number[];pose:number[];radius?:number;constraints?:{joint:string;rest:number[];radius:number}[];axisCone?:{inner:number;outer:number}}
interface Binding {mesh:T.Mesh;entries:{bone:T.Bone;index:number;pose:T.Quaternion;radius:number;shape:PoseMorphShape;lookup:Map<string,T.Bone>}[]}
const cubic=(t:number)=>{const x=T.MathUtils.clamp(t,0,1);return x*x*(3-2*x);};
/** Shared by preparation, live playback, pure geometry checks and animation export. */
export function poseMorphAmount(rotation:T.Quaternion,shape:PoseMorphShape,rotationFor:(joint:string)=>T.Quaternion){
 const rest=new T.Quaternion().fromArray(shape.rest),pose=new T.Quaternion().fromArray(shape.pose),radius=shape.radius??rest.angleTo(pose);let value=cubic(1-rotation.angleTo(pose)/radius);if(!value)return 0;
 for(const constraint of shape.constraints??[])value*=cubic(1-rotationFor(constraint.joint).angleTo(new T.Quaternion().fromArray(constraint.rest))/constraint.radius);
 if(shape.axisCone){const inverse=rest.clone().invert(),actual=inverse.clone().multiply(rotation),target=inverse.multiply(pose);if(actual.w<0)actual.set(-actual.x,-actual.y,-actual.z,-actual.w);if(target.w<0)target.set(-target.x,-target.y,-target.z,-target.w);const axis=new T.Vector3(actual.x,actual.y,actual.z),expected=new T.Vector3(target.x,target.y,target.z);if(axis.lengthSq()<1e-16||expected.lengthSq()<1e-16)return 0;const angle=axis.angleTo(expected);value*=cubic((shape.axisCone.outer-angle)/(shape.axisCone.outer-shape.axisCone.inner));}
 return value;
}
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
   const rest=new T.Quaternion().fromArray(item.rest),pose=new T.Quaternion().fromArray(item.pose),distance=rest.angleTo(pose),radius=item.radius??distance;if(!Number.isFinite(radius)||radius<.01||radius>distance+1e-8)throw Error('Korrekturform benötigt Abstand zur Grundpose.');
   if(item.constraints!==undefined&&(!Array.isArray(item.constraints)||item.constraints.length>8||item.constraints.some((c:any)=>!c||typeof c.joint!=='string'||bones.filter(b=>b.name===c.joint).length!==1||!quaternion(c.rest)||!Number.isFinite(c.radius)||c.radius<=1e-6||c.radius>Math.PI)))throw Error('Ungültiger Bewegungskontext der Korrekturform.');
   if(item.axisCone&&(!Number.isFinite(item.axisCone.inner)||!Number.isFinite(item.axisCone.outer)||item.axisCone.inner<0||item.axisCone.outer<=item.axisCone.inner||item.axisCone.outer>Math.PI))throw Error('Ungültiger Achsenbereich der Korrekturform.');
   return {bone:matches[0],index,pose,radius,shape:structuredClone(item),lookup:new Map(bones.map(b=>[b.name,b]))};
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
  const weights=[...(mesh.morphTargetInfluences??[])],sums=new Map<T.Bone,number>();
  for(const entry of entries){const value=enabled&&poseMorphsEnabled(mesh)?poseMorphAmount(rotation(entry.bone),entry.shape,name=>rotation(entry.lookup.get(name)!)):0;weights[entry.index]=value;sums.set(entry.bone,(sums.get(entry.bone)??0)+value);}
  for(const e of entries){const sum=sums.get(e.bone)!;if(sum>1)weights[e.index]/=sum;}result.set(mesh,weights);
 }return result;
}
export function updatePoseMorphs(root:T.Object3D){for(const [mesh,weights]of poseMorphWeights(root))mesh.morphTargetInfluences=weights;}
