import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import type {ControlPoint,Pose} from './studio-data.ts';
import type {StudioCorrectiveShape} from './studio-corrective-shapes.ts';
import {MAX_STUDIO_SHAPES,MAX_CORRECTIVE_VERTICES} from './studio-corrective-shapes.ts';
import {poseSkinMatrices,poseSurfaceInputs,poseSurfacePositions,correctiveMorphBlend,neutralPoseValues} from './pose-surface-check.ts';
import {fitSkinEdges} from './skin-edge-fit.ts';
import {relaxSurfaceEdges} from './surface-edge-relaxation.ts';
import {checkSurfaceShape} from './surface-check.ts';
import type {EdgeWorkBudget} from './skin-edge-fit.ts';
/** Rigid dual-quaternion blend. Scaling, shear and reflections are deliberately unsupported. */
export function dualQuaternionPoint(point:T.Vector3,matrices:T.Matrix4[],weights:number[]){
 const rotations:T.Quaternion[]=[],duals:T.Quaternion[]=[];
 for(const matrix of matrices){const p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();matrix.decompose(p,q,s);const rebuilt=new T.Matrix4().compose(p,q,new T.Vector3(1,1,1));if(s.distanceTo(new T.Vector3(1,1,1))>1e-6||matrix.elements.some((v,i)=>Math.abs(v-rebuilt.elements[i])>1e-6*Math.max(1,Math.abs(v))))return null;rotations.push(q);const d=new T.Quaternion(p.x,p.y,p.z,0).multiply(q);duals.push(new T.Quaternion(d.x*.5,d.y*.5,d.z*.5,d.w*.5));}
 const anchor=rotations[weights.indexOf(Math.max(...weights))],real=[0,0,0,0],dual=[0,0,0,0];
 rotations.forEach((q,i)=>{const sign=q.dot(anchor)<0?-1:1;q.toArray().forEach((v,k)=>real[k]+=v*weights[i]*sign);duals[i].toArray().forEach((v,k)=>dual[k]+=v*weights[i]*sign);});
 const norm=Math.hypot(...real);if(norm<1e-8)return null;for(let k=0;k<4;k++){real[k]/=norm;dual[k]/=norm;}const dot=real.reduce((n,v,k)=>n+v*dual[k],0);for(let k=0;k<4;k++)dual[k]-=real[k]*dot;
 const rotation=new T.Quaternion().fromArray(real),translation=new T.Quaternion().fromArray(dual).multiply(rotation.clone().conjugate());return point.clone().applyQuaternion(rotation).add(new T.Vector3(translation.x,translation.y,translation.z).multiplyScalar(2));
}
/** A local DQ-derived morph, inverse-fitted to the existing linear skin at this pose.
 * Never modifies mesh, pose, weights or rig. Singular linear bindings are rejected. */
export function buildGeometricCorrection(rig:StudioRig,target:Pose,joint:ControlPoint,radius:number,strength=1,desiredPositions?:ReadonlyMap<number,Float64Array>,centerOverride?:readonly number[]):StudioCorrectiveShape|null {
 if(joint.kind!=='bone'||!Number.isFinite(radius)||radius<.005||radius>2||strength<=0||strength>1||(rig.data.correctiveShapes?.length??0)>=MAX_STUDIO_SHAPES||!rig.poseCorrectionsCompatible||rig.data.poseCorrections===false)return null;
 if(rig.data.points.some(p=>p.kind==='bone'&&new T.Vector3().fromArray(target.values[p.id].position).distanceTo(new T.Vector3().fromArray(rig.data.boneRest[p.bone!].position))>1e-6))return null;
 const bone=rig.bones[joint.bone!];if(!bone.name||rig.bones.filter(b=>b.name===bone.name).length!==1)return null;
 const rest=new T.Quaternion().fromArray(rig.data.boneRest[joint.bone!].rotation),pose=new T.Quaternion().fromArray(target.values[joint.id].rotation),angle=rest.angleTo(pose);if(angle<.01||angle>Math.PI-1e-4)return null;
 if(centerOverride&&(centerOverride.length!==3||centerOverride.some(n=>!Number.isFinite(n)||Math.abs(n)>100)))return null;
 const id='shape-'+crypto.randomUUID(),shape:StudioCorrectiveShape={id,group:id,joint:bone.name,rest:rest.toArray(),pose:pose.toArray(),radius:Math.min(angle,Math.PI/3),meshes:[]},context=new Set<T.Bone>(),center=new T.Vector3().fromArray(centerOverride??joint.rest);let affected=0;
 const existing=(rig.data.correctiveShapes??[]).reduce((n,s)=>n+s.meshes.reduce((n,m)=>n+m.indices.length,0),0);
 for(let m=0;m<rig.surfaces.length;m++){
  const surface=rig.surfaces[m],mesh=surface.mesh;if(!(mesh instanceof T.SkinnedMesh)||desiredPositions&&!desiredPositions.has(m))continue;const matrices=poseSkinMatrices(rig,target.values,m)!,positions=poseSurfacePositions(rig,target.values,m),si=mesh.geometry.getAttribute('skinIndex'),sw=mesh.geometry.getAttribute('skinWeight'),index=mesh.skeleton.bones.indexOf(bone);if(index<0&&!desiredPositions)continue;
  const driven=new Set<number>();if(desiredPositions)mesh.skeleton.bones.forEach((b,i)=>{for(let n:T.Object3D|null=b;n;n=n.parent)if(n===bone){driven.add(i);break;}});
  if(mesh.geometry.morphAttributes.position?.length&&!mesh.geometry.morphTargetsRelative)continue;
  // Factor the fixed mesh/rest frame out before rigid blending. Viewer normalization
  // or an imported uniform model scale is not an animated bone scale.
  const restMatrices=poseSkinMatrices(rig,neutralPoseValues(rig),m)!,restFrame=restMatrices[0],inverseRest=restFrame.clone().invert();
  if(Math.abs(restFrame.determinant())<1e-10||restMatrices.some(matrix=>matrix.elements.some((v,k)=>Math.abs(v-restFrame.elements[k])>1e-6*Math.max(1,Math.abs(v)))))continue;
  const rigidMatrices=matrices.map(matrix=>matrix.clone().multiply(inverseRest));
  const originalWeights=rig.correctionWeights(target.values).get(mesh)??mesh.morphTargetInfluences??[],combined=correctiveMorphBlend(rig,target.values,m,shape);if(combined.amount<1e-6)continue;
  const indices:number[]=[],deltas:number[]=[];
  for(let v=0;v<surface.base.length/3;v++){
   const u=T.MathUtils.clamp(1-surface.world[v].distanceTo(center)/radius,0,1);if(!u)continue;
   const ids:number[]=[],weights:number[]=[];let influence=0;for(let k=0;k<4;k++){const w=sw.getComponent(v,k);if(!w)continue;const i=si.getComponent(v,k);ids.push(i);weights.push(w);if(i===index||desiredPositions&&driven.has(i))influence+=w;}
   if(influence<.01||ids.length<2)continue;
   const blend=new T.Matrix4();blend.elements.fill(0);ids.forEach((id,k)=>matrices[id].elements.forEach((x,j)=>blend.elements[j]+=x*weights[k]));
   const linear=new T.Matrix3().setFromMatrix4(blend);if(Math.abs(linear.determinant())<1e-5)return null;
   const current=new T.Vector3().fromArray(positions,v*3),input=current.clone().applyMatrix4(blend.clone().invert()).applyMatrix4(restFrame),desired=desiredPositions?new T.Vector3().fromArray(desiredPositions.get(m)!,v*3):dualQuaternionPoint(input,ids.map(i=>rigidMatrices[i]),weights);if(!desired)return null;
   const delta=desired.sub(current).multiplyScalar(strength*u*u*(3-2*u)).applyMatrix3(linear.invert());
   for(let k=0;k<originalWeights.length;k++){const lost=originalWeights[k]-(combined.weights[k]??0);if(lost){const target=mesh.geometry.morphAttributes.position?.[k];if(target)delta.addScaledVector(new T.Vector3().fromBufferAttribute(target,v),lost);}}
   delta.divideScalar(combined.amount);if(delta.lengthSq()<1e-14)continue;if(delta.toArray().some(x=>!Number.isFinite(x)||Math.abs(x)>2))return null;
   indices.push(v);deltas.push(...delta.toArray());for(const i of ids)if(mesh.skeleton.bones[i]!==bone)context.add(mesh.skeleton.bones[i]);if(++affected+existing>MAX_CORRECTIVE_VERTICES)return null;
  }
  if(indices.length)shape.meshes.push({mesh:m,indices,deltas});
 }
 if(!affected||context.size>8||shape.meshes.length>128)return null;
 shape.constraints=[...context].map(b=>{const p=rig.data.points.find(p=>p.kind==='bone'&&rig.bones[p.bone!]===b);if(!p||!b.name||rig.bones.filter(q=>q.name===b.name).length!==1)throw Error('Korrekturkontext nicht eindeutig.');return {joint:b.name,rest:[...target.values[p.id].rotation],radius:Math.PI/12};});
 return shape;
}
/** Virtual edge-length weight fits become ordinary pose-driven correction shapes. */
export async function buildEdgeFitCorrection(rig:StudioRig,target:Pose,joint:ControlPoint,radius:number,signal:AbortSignal,budget:EdgeWorkBudget,valid:()=>boolean=()=>true,centerOverride?:readonly number[]){
 signal.throwIfAborted();if(!rig.poseCorrectionsCompatible||rig.data.poseCorrections===false||joint.kind!=='bone'||!Number.isFinite(radius)||radius<.005||radius>2||(rig.data.correctiveShapes?.length??0)>=MAX_STUDIO_SHAPES)return null;
 const q=target.values[joint.id]?.rotation,restRotation=rig.data.boneRest[joint.bone!]?.rotation;if(!q||!restRotation)return null;const angle=new T.Quaternion().fromArray(q).angleTo(new T.Quaternion().fromArray(restRotation));if(angle<.01||angle>Math.PI-1e-4)return null;
 if(centerOverride&&(centerOverride.length!==3||centerOverride.some(n=>!Number.isFinite(n)||Math.abs(n)>100)))return null;
 const desired=new Map<number,Float64Array>(),rest=neutralPoseValues(rig),center=new T.Vector3().fromArray(centerOverride??joint.rest);let active=0;
 for(let m=0;m<rig.surfaces.length;m++){
  const surface=rig.surfaces[m],mesh=surface.mesh,g=mesh.geometry;
  if(!(mesh instanceof T.SkinnedMesh)||!g.index||g.morphAttributes.position?.length&&!g.morphTargetsRelative||Object.keys(g.morphAttributes).some(k=>!['position','normal'].includes(k)))continue;
  const region=Uint8Array.from(surface.world,p=>p.distanceToSquared(center)<radius*radius?1:0);
  const result=await fitSkinEdges({base:poseSurfaceInputs(rig,target.values,m),rest:poseSurfacePositions(rig,rest,m),index:g.index.array,indices:g.getAttribute('skinIndex'),weights:g.getAttribute('skinWeight'),matrices:poseSkinMatrices(rig,target.values,m)!,region},signal,budget,valid);
  if(!result)continue;active+=result.activeVertices;if(active>MAX_CORRECTIVE_VERTICES)return null;desired.set(m,result.positions);
 }
 signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert.');return desired.size?buildGeometricCorrection(rig,target,joint,radius,1,desired,centerOverride):null;
}


/** Positional edge projections fitted back to the original skin as an ordinary shape. */
export async function buildEdgeRelaxationCorrection(rig:StudioRig,target:Pose,joint:ControlPoint,radius:number,signal:AbortSignal,budget:EdgeWorkBudget,valid:()=>boolean=()=>true,centerOverride?:readonly number[]){
 signal.throwIfAborted();if(!rig.poseCorrectionsCompatible||rig.data.poseCorrections===false||joint.kind!=='bone'||!Number.isFinite(radius)||radius<.005||radius>2||(rig.data.correctiveShapes?.length??0)>=MAX_STUDIO_SHAPES)return null;
 if(centerOverride&&(centerOverride.length!==3||centerOverride.some(n=>!Number.isFinite(n)||Math.abs(n)>100)))return null;
 const bone=rig.bones[joint.bone!],center=new T.Vector3().fromArray(centerOverride??joint.rest),rest=neutralPoseValues(rig),desired=new Map<number,Float64Array>();let active=0;
 for(let m=0;m<rig.surfaces.length;m++){
  const surface=rig.surfaces[m],mesh=surface.mesh,g=mesh.geometry;
  if(!(mesh instanceof T.SkinnedMesh)||!g.index||g.morphAttributes.position?.length&&!g.morphTargetsRelative||Object.keys(g.morphAttributes).some(k=>!['position','normal'].includes(k)))continue;
  const driven=new Set<number>();mesh.skeleton.bones.forEach((b,i)=>{for(let n:T.Object3D|null=b;n;n=n.parent)if(n===bone){driven.add(i);break;}});if(!driven.size)continue;
  const si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight');
  const mobility=Float64Array.from(surface.world,(p,v)=>{let influence=0,slots=0;for(let k=0;k<4;k++){const w=sw.getComponent(v,k);if(w){slots++;if(driven.has(si.getComponent(v,k)))influence+=w;}}return slots>1&&influence>=.01?Math.max(0,1-p.distanceTo(center)/radius):0;});
  const reference=poseSurfacePositions(rig,rest,m),posed=poseSurfacePositions(rig,target.values,m);if(!checkSurfaceShape(reference,posed,g.index.array).issues)continue;
  const result=await relaxSurfaceEdges({rest:reference,positions:posed,index:g.index.array,mobility},signal,budget,valid);
  if(!result)continue;active+=result.activeVertices;if(active>MAX_CORRECTIVE_VERTICES)return null;desired.set(m,result.positions);
 }
 signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert.');return desired.size?buildGeometricCorrection(rig,target,joint,radius,1,desired,centerOverride):null;
}
