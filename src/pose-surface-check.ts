import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import {neutralFigure,FIGURE_TRACK} from './studio-data.ts';
import type {Pose,Transform} from './studio-data.ts';
import {checkSurfaceShape,SURFACE_LIMITS} from './surface-check.ts';
import {poseMorphAmount,poseMorphBindings} from './pose-morphs.ts';
import type {StudioCorrectiveShape} from './studio-corrective-shapes.ts';
import {createSurfaceVolumeChecker} from './surface-volume.ts';
export type SkinOverrides=ReadonlyMap<number,{indices:T.BufferAttribute|T.InterleavedBufferAttribute;weights:T.BufferAttribute|T.InterleavedBufferAttribute}>;

function createPoseWorld(rig:StudioRig,values:Record<string,Transform>){
  const frame=rig.modelWorldMatrix,worlds=new Map<T.Object3D,T.Matrix4>();worlds.set(rig.root,frame);
  const points=new Map(rig.data.points.filter(p=>p.kind==='bone').map(p=>[rig.bones[p.bone!],p]));
  const world=(node:T.Object3D):T.Matrix4=>{
    const cached=worlds.get(node);if(cached)return cached;
    if(!node.parent)throw Error('Modellhierarchie liegt außerhalb des Studios.');
    const point=node instanceof T.Bone?points.get(node):undefined;
    const value=point?values[point.id]:undefined,local=value?new T.Matrix4().compose(new T.Vector3().fromArray(value.position),new T.Quaternion().fromArray(value.rotation),node.scale):node.matrix.clone();
    const result=world(node.parent).clone().multiply(local);worlds.set(node,result);return result;
  };
  return world;
}
export function poseSkinMatrices(rig:StudioRig,values:Record<string,Transform>,meshIndex:number){
 const mesh=rig.surfaces[meshIndex].mesh;if(!(mesh instanceof T.SkinnedMesh))return null;const world=createPoseWorld(rig,values),frame=rig.modelWorldMatrix.invert();
 if(mesh.bindMode==='detached')frame.multiply(world(mesh)).multiply(mesh.bindMatrixInverse);else if(mesh.bindMode!=='attached')throw Error('Unbekannte Hautbindung.');
 return mesh.skeleton.bones.map((bone,i)=>frame.clone().multiply(world(bone)).multiply(mesh.skeleton.boneInverses[i]).multiply(mesh.bindMatrix));
}
/** Compute native and extra driver weights together, including same-joint normalization. */
export function correctiveMorphBlend(rig:StudioRig,values:Record<string,Transform>,meshIndex:number,shape:StudioCorrectiveShape){
 const mesh=rig.surfaces[meshIndex].mesh,weights=[...(rig.correctionWeights(values).get(mesh)??mesh.morphTargetInfluences??[])],rotation=(name:string)=>{const p=rig.data.points.find(p=>p.kind==='bone'&&(rig.bones[p.bone!].name===name||rig.bones[p.bone!].userData.name===name));if(!p)throw Error('Korrekturgelenk fehlt.');return new T.Quaternion().fromArray(values[p.id].rotation);};
 const raw=poseMorphAmount(rotation(shape.joint),shape,rotation),entries=poseMorphBindings(rig.root).find(b=>b.mesh===mesh)?.entries.filter(e=>e.bone.name===shape.joint&&(e.shape.group??'joint')===(shape.group??'joint'))??[],valuesFor=entries.map(e=>poseMorphAmount(rotation(e.bone.name),e.shape,rotation)),sum=valuesFor.reduce((a,b)=>a+b,raw),divisor=Math.max(1,sum);
 entries.forEach((e,i)=>weights[e.index]=valuesFor[i]/divisor);return {weights,amount:raw/divisor};
}

/** Evaluate the actual skinning equation without applying a pose to the live model. */
export function poseSurfacePositions(rig:StudioRig,values:Record<string,Transform>,meshIndex:number,overrides?:SkinOverrides,corrective?:StudioCorrectiveShape):Float64Array {
  const surface=rig.surfaces[meshIndex];if(!surface)throw Error('Oberfläche fehlt.');
  for(const point of rig.data.points){const value=values[point.id];if(!value||![...value.position,...value.rotation].every(Number.isFinite))throw Error('Pose enthält nicht alle gültigen Gelenkspuren.');}
  const world=createPoseWorld(rig,values),inverse=rig.modelWorldMatrix.invert();
  const mesh=surface.mesh,geometry=mesh.geometry,positions=rig.surfacePositions(values,meshIndex),out=new Float64Array(positions.length),vertex=new T.Vector3();
  const isSkin=mesh instanceof T.SkinnedMesh,morphWeights=rig.correctionWeights(values,!overrides&&rig.poseCorrectionsActive).get(mesh)??[...(mesh.morphTargetInfluences??[])];
  const skinFrame=inverse.clone();
  if(isSkin&&mesh.bindMode==='detached')skinFrame.multiply(world(mesh)).multiply(mesh.bindMatrixInverse);
  else if(isSkin&&mesh.bindMode!=='attached')throw Error('Unbekannte Hautbindung.');
  const transforms=isSkin?mesh.skeleton.bones.map((bone,i)=>skinFrame.clone().multiply(world(bone)).multiply(mesh.skeleton.boneInverses[i]).multiply(mesh.bindMatrix)):[];
  const local=isSkin?null:inverse.clone().multiply(world(mesh)),binding=overrides?.get(meshIndex),indices=binding?.indices??geometry.getAttribute('skinIndex'),weights=binding?.weights??geometry.getAttribute('skinWeight');
  if(isSkin&&(!indices||!weights||indices.count!==positions.length/3||weights.count!==indices.count))throw Error('Hautgewichte fehlen oder passen nicht zur Oberfläche.');
  const part=corrective?.meshes.find(m=>m.mesh===meshIndex),extra=new Map(part?.indices.map((v,k)=>[v,part.deltas.slice(k*3,k*3+3)])),blend=corrective&&part?correctiveMorphBlend(rig,values,meshIndex,corrective):null,amount=blend?.amount??0;if(blend&&morphWeights)morphWeights.splice(0,morphWeights.length,...blend.weights);
  for(let i=0;i<out.length/3;i++){
    vertex.fromArray(positions,i*3);
    const base=new T.Vector3().fromArray(surface.base,i*3);
    for(let m=0;m<(morphWeights?.length??0);m++){
      const amount=morphWeights![m],target=geometry.morphAttributes.position?.[m];if(!amount||!target)continue;
      const delta=new T.Vector3().fromBufferAttribute(target,i);if(!geometry.morphTargetsRelative)delta.sub(base);vertex.addScaledVector(delta,amount);
    }
    const correction=extra.get(i);if(correction&&amount)vertex.addScaledVector(new T.Vector3().fromArray(correction),amount);
    if(local){vertex.applyMatrix4(local).toArray(out,i*3);continue;}
    let x=0,y=0,z=0,sum=0;
    for(let k=0;k<4;k++){
      const weight=weights.getComponent(i,k);if(!Number.isFinite(weight)||weight<0)throw Error('Ungültige Hautgewichte.');if(!weight)continue;
      const bone=indices.getComponent(i,k),matrix=transforms[bone];if(!Number.isInteger(bone)||!matrix)throw Error('Ungültige Knochenzuordnung.');
      const e=matrix.elements;x+=(e[0]*vertex.x+e[4]*vertex.y+e[8]*vertex.z+e[12])*weight;y+=(e[1]*vertex.x+e[5]*vertex.y+e[9]*vertex.z+e[13])*weight;z+=(e[2]*vertex.x+e[6]*vertex.y+e[10]*vertex.z+e[14])*weight;sum+=weight;
    }
    if(Math.abs(sum-1)>1e-4)throw Error('Hautgewichte sind nicht normalisiert.');out.set([x,y,z],i*3);
  }
  return out;
}
export function neutralPoseValues(rig:StudioRig):Record<string,Transform>{
  return {[FIGURE_TRACK]:neutralFigure(),...Object.fromEntries(rig.data.points.map(p=>[p.id,p.kind==='bone'?structuredClone(rig.data.boneRest[p.bone!]):{position:[...p.rest],rotation:[0,0,0,1]}]))};
}
export function createPoseSurfaceChecker(rig:StudioRig){
  const rest=neutralPoseValues(rig),references=rig.surfaces.map((s,i)=>{const positions=poseSurfacePositions(rig,rest,i),index=s.mesh.geometry.index?.array??null;return {name:s.mesh.name||`Mesh ${i+1}`,positions,index,volume:createSurfaceVolumeChecker(positions,index)};});
  return (pose:Pose,overrides?:SkinOverrides,corrective?:StudioCorrectiveShape)=>{
    const meshes=references.map((r,i)=>{const positions=poseSurfacePositions(rig,pose.values,i,overrides,corrective);return {mesh:i,name:r.name,...checkSurfaceShape(r.positions,positions,r.index),volume:r.volume(positions)};});
    const issues=meshes.reduce((sum,m)=>sum+m.issues,0),compared=meshes.reduce((sum,m)=>sum+m.compared,0),referenceDegenerate=meshes.reduce((sum,m)=>sum+m.referenceDegenerate,0);
    const volumeIssues=meshes.reduce((n,m)=>n+m.volume.issues,0);
    return {poseId:pose.id,status:issues||volumeIssues?'outside' as const:compared?'within' as const:'unmeasurable' as const,issues,volumeIssues,compared,referenceDegenerate,limits:{...SURFACE_LIMITS},meshes};
  };
}
export function checkPoseSurface(rig:StudioRig,pose:Pose){return createPoseSurfaceChecker(rig)(pose);}

/** Bounded pose backoff, not automatic re-rigging or an ARAP solver. Never changes the rig. */
export async function suggestGentlerPose(rig:StudioRig,pose:Pose,signal:AbortSignal,valid:()=>boolean=()=>true){
  const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');};ensure();
  const inspect=createPoseSurfaceChecker(rig),before=inspect(pose);if(before.status!=='outside')return null;
  const rest=neutralPoseValues(rig);
  // Small closed details can satisfy strain limits before their volume is safe.
  // Twelve bounded probes retain a nonzero move, down to 1/1024 of the request.
  for(const fraction of [.875,.75,...Array.from({length:10},(_,i)=>2**(-i-1))]){
    await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();
    const values:Record<string,Transform>={[FIGURE_TRACK]:structuredClone(pose.values[FIGURE_TRACK]??neutralFigure())};
    for(const point of rig.data.points){const a=rest[point.id],b=pose.values[point.id];values[point.id]={position:new T.Vector3().fromArray(a.position).lerp(new T.Vector3().fromArray(b.position),fraction).toArray(),rotation:new T.Quaternion().fromArray(a.rotation).slerp(new T.Quaternion().fromArray(b.rotation),fraction).toArray()};}
    const candidate={...pose,values},report=inspect(candidate),bends=rig.checkPoseBends(candidate);
    if(report.status==='within'&&!bends.unmatched.length&&bends.results.every(r=>r.status==='within')){ensure();return {fraction,values,report};}
  }
  ensure();return null;
}
