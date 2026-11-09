import * as T from 'three';
import {optimizeSkinWeights} from './pakachi-skin-optimization.mjs';
import {poseMorphAmount} from '../src/pose-morphs.ts';
import {checkSurfaceShape} from '../src/surface-check.ts';
const attributes=g=>({indices:Uint16Array.from(g.attributes.skinIndex.array),weights:Float32Array.from(g.attributes.skinWeight.array)});
function skin(geometry,matrices,binding,delta,amount=1){
 const p=geometry.attributes.position,out=new Float64Array(p.count*3),point=new T.Vector3(),posed=new T.Vector3();
 for(let v=0;v<p.count;v++){point.fromBufferAttribute(p,v);if(delta)point.add(new T.Vector3().fromArray(delta,v*3).multiplyScalar(amount));for(let k=0;k<4;k++){const w=binding.weights[v*4+k];if(!w)continue;posed.copy(point).applyMatrix4(matrices[binding.indices[v*4+k]]);out[v*3]+=w*posed.x;out[v*3+1]+=w*posed.y;out[v*3+2]+=w*posed.z;}}return out;
}
function correctiveDelta(geometry,matrices,oldBinding,newBinding){
 const target=skin(geometry,matrices,newBinding),delta=new Float32Array(target.length),blend=new T.Matrix4(),point=new T.Vector3();
 for(let v=0;v<target.length/3;v++){
  if([0,1,2,3].every(k=>oldBinding.indices[v*4+k]===newBinding.indices[v*4+k]&&oldBinding.weights[v*4+k]===newBinding.weights[v*4+k]))continue;
  blend.elements.fill(0);for(let k=0;k<4;k++){const w=oldBinding.weights[v*4+k],matrix=matrices[oldBinding.indices[v*4+k]];for(let a=0;a<16;a++)blend.elements[a]+=w*matrix.elements[a];}blend.elements[3]=blend.elements[7]=blend.elements[11]=0;blend.elements[15]=1;
  if(Math.abs(blend.determinant())<1e-8)throw Error('Singular skin blend; corrective shape refused.');point.fromArray(target,v*3).applyMatrix4(blend.invert());for(let axis=0;axis<3;axis++)delta[v*3+axis]=point.getComponent(axis)-geometry.attributes.position.getComponent(v,axis);
 }return delta;
}
const metric=r=>({issues:r.issues,maximumStretch:r.maximumStretch,minimumStretch:r.minimumStretch,invalid:r.invalid});

/** Bake checked multi-joint pose corrections; original skin weights stay unchanged. */
export function preparePoseCorrections(root,body,fur,furBodyVertices,{iterations=480,joints=['LeftElbow','RightElbow','LeftKnee','RightKnee','LeftShoulder','RightShoulder','LeftHip','RightHip']}={}){
 const skeleton=body.skeleton,rests=new Map(skeleton.bones.map(b=>[b.name,b.quaternion.clone()])),original=attributes(body.geometry),furOriginal=attributes(fur.geometry),cache=new Map(),trials=[],regions=[];
 const poseOf=(joint,axis,degrees)=>{const direction=new T.Vector3();direction[axis]=1;return {joint,rotation:rests.get(joint).clone().multiply(new T.Quaternion().setFromAxisAngle(direction,degrees*Math.PI/180)).toArray()};};
 const scenePose=specs=>{const key=JSON.stringify(specs);if(cache.has(key))return cache.get(key);const rotations=new Map([...rests].map(([name,q])=>[name,q.clone()]));for(const spec of specs)rotations.set(spec.joint,new T.Quaternion().fromArray(spec.rotation));
  skeleton.bones.forEach(b=>b.quaternion.copy(rotations.get(b.name)));root.updateMatrixWorld(true);const matrices=skeleton.bones.map((b,i)=>b.matrixWorld.clone().multiply(skeleton.boneInverses[i]));skeleton.bones.forEach(b=>b.quaternion.copy(rests.get(b.name)));root.updateMatrixWorld(true);const result={matrices,rotations};cache.set(key,result);return result;
 };
 const sparseCache=new WeakMap();let rawCache=new WeakMap();
 const activeVertices=delta=>{let cached=sparseCache.get(delta);if(cached)return cached;const vertices=[];for(let v=0;v<delta.length/3;v++)if(delta[v*3]||delta[v*3+1]||delta[v*3+2])vertices.push(v);cached=Int32Array.from(vertices);sparseCache.set(delta,cached);return cached;};
 const amount=(rotation,entry,pose)=>poseMorphAmount(rotation,entry,name=>pose.rotations.get(name));
 const rawSkin=(surface,pose)=>{let cache=rawCache.get(surface.mesh);if(!cache){cache=new WeakMap();rawCache.set(surface.mesh,cache);}let positions=cache.get(pose);if(!positions){positions=skin(surface.mesh.geometry,pose.matrices,surface.old);cache.set(pose,positions);}return positions;};
 const skinShapes=(surface,pose,additional)=>{
  const g=surface.mesh.geometry,out=rawSkin(surface,pose).slice(),shapes=[];
  for(const entry of surface.mesh.userData.pakachiPoseMorphs??[]){const weight=amount(pose.rotations.get(entry.joint),entry,pose);if(weight)shapes.push({delta:g.morphAttributes.position[surface.mesh.morphTargetDictionary[entry.target]].array,weight});}
  if(additional){const weight=amount(pose.rotations.get(additional.entry.joint),additional.entry,pose);if(weight)shapes.push({delta:additional.delta,weight});}
  for(const {delta,weight}of shapes)for(const v of activeVertices(delta)){const dx=delta[v*3]*weight,dy=delta[v*3+1]*weight,dz=delta[v*3+2]*weight;for(let k=0;k<4;k++){const w=surface.old.weights[v*4+k];if(!w)continue;const e=pose.matrices[surface.old.indices[v*4+k]].elements;out[v*3]+=w*(e[0]*dx+e[4]*dy+e[8]*dz);out[v*3+1]+=w*(e[1]*dx+e[5]*dy+e[9]*dz);out[v*3+2]+=w*(e[2]*dx+e[6]*dy+e[10]*dz);}}
  return out;
 };
 const guard=(entry,name)=>{if((entry.constraints??[]).some(c=>c.joint===name))return;const list=entry.constraints??=[];if(list.length>=8)throw Error('Too many correction-context constraints.');list.push({joint:name,rest:rests.get(name).toArray(),radius:Math.PI/360});};
 try{
  for(const jointName of joints){
   const joint=skeleton.bones.find(b=>b.name===jointName);if(!joint)throw Error('Missing correction joint: '+jointName);
   const optimized=optimizeSkinWeights(body.geometry,['x','y','z'].map(axis=>scenePose([poseOf(jointName,axis,90)]).matrices),{iterations,step:.7}),furOptimized={indices:new Uint16Array(furOriginal.indices.length),weights:new Float32Array(furOriginal.weights.length)};
   furBodyVertices.forEach((v,i)=>{for(let k=0;k<4;k++){furOptimized.indices[i*4+k]=optimized.indices[v*4+k];furOptimized.weights[i*4+k]=optimized.weights[v*4+k];}});regions.push({joint:jointName,activeVertices:optimized.activeVertices});
   const surfaces=[{mesh:body,old:original,next:optimized},{mesh:fur,old:furOriginal,next:furOptimized}];
   for(const axis of ['x','y','z'])for(const sign of [1,-1]){
    rawCache=new WeakMap();
    const snapshots=surfaces.map(s=>structuredClone(s.mesh.userData.pakachiPoseMorphs??[]));
    const degrees=sign*90,target=poseOf(jointName,axis,degrees),entry={joint:jointName,rest:rests.get(jointName).toArray(),pose:target.rotation,radius:Math.PI/4},deltas=[correctiveDelta(body.geometry,scenePose([target]).matrices,original,optimized)];
    // A tuft shares one body attachment. Translate every vertex by that attachment's
    // corrective offset, preserving its existing shape under any linear skin pose.
    deltas.push(Float32Array.from({length:furBodyVertices.length*3},(_,k)=>deltas[0][furBodyVertices[Math.floor(k/3)]*3+k%3]));
    const specifications=[0,45,67.5,90,112.5,135,180].map(magnitude=>({kind:'single',degrees:sign*magnitude,poses:[poseOf(jointName,axis,sign*magnitude)]}));
    const companionNames=[...new Set((body.userData.pakachiPoseMorphs??[]).map(e=>e.joint))].filter(name=>name!==jointName);
    for(const name of companionNames){const candidates=(body.userData.pakachiPoseMorphs??[]).filter(e=>e.joint===name);for(const companion of candidates)specifications.push({kind:'joint-pair',companionTarget:companion.target,poses:[target,{joint:name,rotation:companion.pose}]});}
    if(joint.parent instanceof T.Bone)for(const angle of [30,-30])specifications.push({kind:'parent-pair',poses:[target,poseOf(joint.parent.name,'x',angle)]});
    const otherAxis=axis==='x'?'y':'x';for(const angle of [15,-15]){const direction=new T.Vector3();direction[otherAxis]=1;const rotation=new T.Quaternion().fromArray(target.rotation).multiply(new T.Quaternion().setFromAxisAngle(direction,angle*Math.PI/180)).toArray();specifications.push({kind:'mixed-axis',poses:[{joint:jointName,rotation}]});}
    const measure=spec=>{const pose=scenePose(spec.poses);return {...spec,meshes:surfaces.map((s,i)=>{const g=s.mesh.geometry,reference=Float64Array.from(g.attributes.position.array),before=checkSurfaceShape(reference,rawSkin(s,pose),g.index?.array??null),after=checkSurfaceShape(reference,skinShapes(s,pose,{entry,delta:deltas[i]}),g.index?.array??null);return {name:s.mesh.name,before:metric(before),after:metric(after)};})};};
    const regressed=sample=>sample.meshes.some(m=>m.after.invalid||m.after.issues>m.before.issues||(m.after.maximumStretch??0)>(m.before.maximumStretch??0)+1e-5);
    const initialSamples=specifications.map(measure),reciprocalTransitions=[];
    for(const sample of initialSamples.filter(regressed)){
     if(sample.kind==='parent-pair')guard(entry,joint.parent.name);
     if(sample.kind==='mixed-axis')entry.axisCone={inner:2*Math.PI/180,outer:5*Math.PI/180};
     if(sample.kind==='joint-pair'){const other=sample.poses[1].joint;guard(entry,other);for(const s of surfaces){const existing=(s.mesh.userData.pakachiPoseMorphs??[]).find(e=>e.target===sample.companionTarget);if(existing)guard(existing,jointName);}for(const angle of [.25,-.25])reciprocalTransitions.push({kind:'reverse-context-transition',poses:[sample.poses[1],poseOf(jointName,'x',angle)]});}
    }
    for(const constraint of entry.constraints??[])for(const angle of [.25,-.25])specifications.push({kind:'context-transition',poses:[target,poseOf(constraint.joint,'x',angle)]});
    if(entry.axisCone)for(const angle of [3.5,-3.5,5,-5,7.2,-7.2]){const direction=new T.Vector3();direction[otherAxis]=1;specifications.push({kind:'axis-transition',poses:[{joint:jointName,rotation:new T.Quaternion().fromArray(target.rotation).multiply(new T.Quaternion().setFromAxisAngle(direction,angle*Math.PI/180)).toArray()}]});}
    specifications.push(...reciprocalTransitions);const samples=specifications.map(measure);
    const targetResult=samples.find(s=>s.kind==='single'&&s.degrees===degrees).meshes[0],withinBudget=(body.geometry.morphAttributes.position?.length??0)<32,accepted=withinBudget&&targetResult.after.issues<targetResult.before.issues&&samples.every(s=>s.meshes.every(m=>!m.after.invalid&&m.after.issues<=m.before.issues&&(m.after.maximumStretch??0)<=(m.before.maximumStretch??0)+1e-5));
    trials.push({joint:jointName,axis,degrees,accepted,withinBudget,conditions:structuredClone(entry),initialRegressions:initialSamples.filter(regressed).map(s=>s.kind),samples});if(!accepted){surfaces.forEach((s,i)=>{s.mesh.userData.pakachiPoseMorphs=snapshots[i];});continue;}
    const name=`PaKaChi_${jointName}_${axis}_${sign>0?'positive':'negative'}`;
    surfaces.forEach((s,i)=>{
     const g=s.mesh.geometry;if(Object.keys(g.morphAttributes).length&&!g.morphTargetsRelative)throw Error('Existing absolute morph targets cannot be corrected here.');
     const scratch=new T.BufferGeometry(),positions=Float32Array.from(g.attributes.position.array),affected=new Uint8Array(positions.length/3);for(let k=0;k<positions.length;k++){positions[k]+=deltas[i][k];if(deltas[i][k]!==0)affected[Math.floor(k/3)]=1;}
     const touched=affected.slice();if(g.index){for(let k=0;k<g.index.count;k+=3){const a=g.index.getX(k),b=g.index.getX(k+1),c=g.index.getX(k+2);if(affected[a]||affected[b]||affected[c])touched[a]=touched[b]=touched[c]=1;}}else for(let k=0;k<touched.length;k+=3)if(affected[k]||affected[k+1]||affected[k+2])touched[k]=touched[k+1]=touched[k+2]=1;
     scratch.setAttribute('position',new T.BufferAttribute(positions,3));if(g.index)scratch.setIndex(g.index);scratch.computeVertexNormals();const normals=Float32Array.from(scratch.attributes.normal.array);for(let k=0;k<normals.length;k++)normals[k]=s.mesh!==fur&&touched[Math.floor(k/3)]?normals[k]-g.attributes.normal.getComponent(Math.floor(k/3),k%3):0;scratch.dispose();
     g.morphTargetsRelative=true;const position=new T.BufferAttribute(deltas[i],3),normal=new T.BufferAttribute(normals,3);position.name=normal.name=name;(g.morphAttributes.position??=[]).push(position);(g.morphAttributes.normal??=[]).push(normal);s.mesh.updateMorphTargets();s.mesh.userData.pakachiPoseMorphBind=s.mesh.skeleton.boneInverses.map(m=>m.clone().multiply(s.mesh.bindMatrix).toArray());(s.mesh.userData.pakachiPoseMorphs??=[]).push({...entry,target:name});
    });
   }
  }
 }finally{skeleton.bones.forEach(b=>b.quaternion.copy(rests.get(b.name)));root.updateMatrixWorld(true);}
 for(const trial of trials.filter(t=>t.accepted)){const name=`PaKaChi_${trial.joint}_${trial.axis}_${trial.degrees>0?'positive':'negative'}`,entry=(body.userData.pakachiPoseMorphs??[]).find(e=>e.target===name);trial.conditions=structuredClone(entry);}
 const finalChecks=[],surfaces=[{mesh:body,old:original},{mesh:fur,old:furOriginal}],entries=body.userData.pakachiPoseMorphs??[];
 const specifications=trials.filter(t=>t.accepted).flatMap(t=>t.samples.map(s=>({kind:s.kind,poses:s.poses})));
 for(let a=0;a<entries.length;a++)for(let b=a+1;b<entries.length;b++)if(entries[a].joint!==entries[b].joint)specifications.push({kind:'final-joint-pair',poses:[entries[a],entries[b]].map(e=>({joint:e.joint,rotation:e.pose}))});
 const unique=new Set();for(const spec of specifications){const key=JSON.stringify(spec.poses);if(unique.has(key))continue;unique.add(key);rawCache=new WeakMap();const pose=scenePose(spec.poses),meshes=surfaces.map(s=>{const g=s.mesh.geometry,reference=g.attributes.position.array,before=metric(checkSurfaceShape(reference,rawSkin(s,pose),g.index?.array??null)),after=metric(checkSurfaceShape(reference,skinShapes(s,pose),g.index?.array??null));return {name:s.mesh.name,before,after};});
  if(meshes.some(m=>m.after.invalid||m.after.issues>m.before.issues||(m.after.maximumStretch??0)>(m.before.maximumStretch??0)+1e-5))throw Error('Final correction set regressed: '+JSON.stringify(spec));finalChecks.push({...spec,meshes});
 }
 return {method:'Fur tufts translate with their body attachment, preserving their existing triangle shape. Pose-space corrective morphs from projected edge-length fitting; original weights, joints and rest geometry preserved.',joints,iterations,regions,trials,finalChecks,limits:['Accepted individual and sampled combined poses only; not arbitrary motion.','No collision, volume or final design approval.','Disabled after changes to skin weights or bind skeleton.']};
}
