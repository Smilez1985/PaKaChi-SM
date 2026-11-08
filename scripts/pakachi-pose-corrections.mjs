import * as T from 'three';
import {optimizeSkinWeights} from './pakachi-skin-optimization.mjs';
import {checkSurfaceShape} from '../src/surface-check.ts';
const attributes=g=>({indices:Uint16Array.from(g.attributes.skinIndex.array),weights:Float32Array.from(g.attributes.skinWeight.array)});
function skin(geometry,matrices,binding,delta,amount=1){
 const p=geometry.attributes.position,out=new Float64Array(p.count*3),point=new T.Vector3(),posed=new T.Vector3();
 for(let v=0;v<p.count;v++){point.fromBufferAttribute(p,v);if(delta)point.add(new T.Vector3().fromArray(delta,v*3).multiplyScalar(amount));for(let k=0;k<4;k++){const w=binding.weights[v*4+k];if(!w)continue;posed.copy(point).applyMatrix4(matrices[binding.indices[v*4+k]]);out[v*3]+=w*posed.x;out[v*3+1]+=w*posed.y;out[v*3+2]+=w*posed.z;}}return out;
}
function correctiveDelta(geometry,matrices,oldBinding,newBinding){
 const target=skin(geometry,matrices,newBinding),delta=new Float32Array(target.length),blend=new T.Matrix4(),point=new T.Vector3();
 for(let v=0;v<target.length/3;v++){
  blend.elements.fill(0);for(let k=0;k<4;k++){const w=oldBinding.weights[v*4+k],matrix=matrices[oldBinding.indices[v*4+k]];for(let a=0;a<16;a++)blend.elements[a]+=w*matrix.elements[a];}blend.elements[3]=blend.elements[7]=blend.elements[11]=0;blend.elements[15]=1;
  if(Math.abs(blend.determinant())<1e-8)throw Error('Singular skin blend; corrective shape refused.');point.fromArray(target,v*3).applyMatrix4(blend.invert());for(let axis=0;axis<3;axis++)delta[v*3+axis]=point.getComponent(axis)-geometry.attributes.position.getComponent(v,axis);
 }return delta;
}
const metric=r=>({issues:r.issues,maximumStretch:r.maximumStretch,minimumStretch:r.minimumStretch,invalid:r.invalid});

/** Bake a small pose-space corrective set; original skin weights are never changed. */
export function preparePoseCorrections(root,body,fur,furBodyVertices,{iterations=480}={}){
 const skeleton=body.skeleton,joint=skeleton.bones.find(b=>b.name==='LeftElbow'),rest=joint.quaternion.clone(),original=attributes(body.geometry),furOriginal=attributes(fur.geometry),cache=new Map();
 const matrices=(axis,degrees)=>{const key=axis+degrees;if(cache.has(key))return cache.get(key);const direction=new T.Vector3();direction[axis]=1;joint.quaternion.copy(rest).multiply(new T.Quaternion().setFromAxisAngle(direction,degrees*Math.PI/180));root.updateMatrixWorld(true);const result=skeleton.bones.map((b,i)=>b.matrixWorld.clone().multiply(skeleton.boneInverses[i]));joint.quaternion.copy(rest);root.updateMatrixWorld(true);cache.set(key,result);return result;};
 const optimized=optimizeSkinWeights(body.geometry,['x','y','z'].map(axis=>matrices(axis,90)),{iterations,step:.7}),furOptimized={indices:new Uint16Array(furOriginal.indices.length),weights:new Float32Array(furOriginal.weights.length)};
 furBodyVertices.forEach((v,i)=>{for(let k=0;k<4;k++){furOptimized.indices[i*4+k]=optimized.indices[v*4+k];furOptimized.weights[i*4+k]=optimized.weights[v*4+k];}});
 const surfaces=[{mesh:body,old:original,next:optimized},{mesh:fur,old:furOriginal,next:furOptimized}],trials=[];
 try{
  for(const axis of ['x','y','z'])for(const sign of [1,-1]){
   const degrees=sign*90,pose=rest.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0),degrees*Math.PI/180)),deltas=surfaces.map(s=>correctiveDelta(s.mesh.geometry,matrices(axis,degrees),s.old,s.next)),samples=[];
   for(const magnitude of [0,45,67.5,90,112.5,135,180]){
    const angle=sign*magnitude,t=T.MathUtils.clamp(1-Math.abs(magnitude-90)/45,0,1),amount=t*t*(3-2*t),set=matrices(axis,angle);
    samples.push({degrees:angle,meshes:surfaces.map((s,i)=>{const g=s.mesh.geometry,reference=Float64Array.from(g.attributes.position.array),before=checkSurfaceShape(reference,skin(g,set,s.old),g.index?.array??null),after=checkSurfaceShape(reference,skin(g,set,s.old,deltas[i],amount),g.index?.array??null);return {name:s.mesh.name,before:metric(before),after:metric(after)};})});
   }
   const target=samples.find(s=>s.degrees===degrees).meshes[0],accepted=target.after.issues<target.before.issues&&samples.every(s=>s.meshes.every(m=>!m.after.invalid&&m.after.issues<=m.before.issues&&(m.after.maximumStretch??0)<=(m.before.maximumStretch??0)+1e-5));
   trials.push({axis,degrees,accepted,samples});if(!accepted)continue;
   const name=`PaKaChi_LeftElbow_${axis}_${sign>0?'positive':'negative'}`;
   surfaces.forEach((s,i)=>{
    const g=s.mesh.geometry;if(Object.keys(g.morphAttributes).length&&!g.morphTargetsRelative)throw Error('Existing absolute morph targets cannot be corrected here.');
    const scratch=g.clone(),positions=Float32Array.from(g.attributes.position.array);for(let k=0;k<positions.length;k++)positions[k]+=deltas[i][k];scratch.setAttribute('position',new T.BufferAttribute(positions,3));scratch.computeVertexNormals();const normals=Float32Array.from(scratch.attributes.normal.array);for(let k=0;k<normals.length;k++)normals[k]-=g.attributes.normal.getComponent(Math.floor(k/3),k%3);scratch.dispose();
    g.morphTargetsRelative=true;const position=new T.BufferAttribute(deltas[i],3),normal=new T.BufferAttribute(normals,3);position.name=normal.name=name;(g.morphAttributes.position??=[]).push(position);(g.morphAttributes.normal??=[]).push(normal);s.mesh.updateMorphTargets();s.mesh.userData.pakachiPoseMorphBind=s.mesh.skeleton.boneInverses.map(m=>m.clone().multiply(s.mesh.bindMatrix).toArray());(s.mesh.userData.pakachiPoseMorphs??=[]).push({joint:joint.name,target:name,rest:rest.toArray(),pose:pose.toArray(),radius:Math.PI/4});
   });
  }
 }finally{joint.quaternion.copy(rest);root.updateMatrixWorld(true);}
 return {method:'Pose-space corrective morphs from projected edge-length fitting; original weights, joints and rest geometry preserved.',joint:joint.name,iterations,activeVertices:optimized.activeVertices,trials,limits:['Only accepted axis-aligned elbow probes; not arbitrary combined poses.','No collision, volume or final design approval.','Disabled after changes to skin weights or bind skeleton.']};
}
