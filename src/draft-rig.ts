import * as T from 'three';
import {parseModel,disposeModel} from './viewer.ts';
import {exportRiggedFigureGLB} from './figure-glb.ts';
import {StudioRig} from './studio-rig.ts';
import {createPoseSurfaceChecker} from './pose-surface-check.ts';
import {estimateDraftBodyFrame} from './draft-body-frame.ts';
import type {DraftBodyFrame} from './draft-body-frame.ts';

export type DraftRigTemplate='biped'|'biped-relaxed'|'quadruped';
export interface DraftRigReport {template:DraftRigTemplate;bones:number;meshes:number;vertices:number;method:'proportional-template';review:'required';frame?:DraftBodyFrame;probes?:{joint:string;degrees:30;status:'within'|'outside'|'unmeasurable';surfaceIssues:number;volumeIssues:number;unmeasurableVolumeComponents:number}[]}
type Joint={name:string;parent:number;point:T.Vector3;end:T.Vector3};
/** Normalized landmarks are a starting template, never inferred anatomy. Y-up, +Z-front. */
function landmarks(template:DraftRigTemplate,frame:DraftBodyFrame):Joint[]{
 const center=new T.Vector3().fromArray(frame.center),right=new T.Vector3().fromArray(frame.right),forward=new T.Vector3().fromArray(frame.forward),joints:Joint[]=[];
 const point=(x:number,y:number,z:number)=>new T.Vector3(center.x,frame.floor+y*frame.height,center.z).addScaledVector(right,x*frame.width).addScaledVector(forward,z*frame.depth);
 const add=(name:string,parent:number,x:number,y:number,z:number,end?:T.Vector3)=>{
  const p=point(x,y,z);joints.push({name,parent,point:p,end:end??p.clone()});return joints.length-1;
 };
 if(template!=='quadruped'){
  add('Hips',-1,0,.47,0);add('Spine',0,0,.57,0);add('Chest',1,0,.69,0);add('Neck',2,0,.79,0);add('Head',3,0,.86,0,point(0,.99,0));
  for(const [side,sign] of [['Left',1],['Right',-1]] as const){
   const relaxed=template==='biped-relaxed',shoulder=add(side+'Shoulder',2,sign*.18,.72,0),elbow=add(side+'Elbow',shoulder,sign*(relaxed?.20:.30),.57,0),wrist=add(side+'Wrist',elbow,sign*(relaxed?.23:.40),.41,0);
   add(side+'Hand',wrist,sign*(relaxed?.24:.44),.35,0,point(sign*(relaxed?.24:.49),.30,0));
   const hip=add(side+'Hip',0,sign*.10,.46,0),knee=add(side+'Knee',hip,sign*.12,.26,.02),ankle=add(side+'Ankle',knee,sign*.13,.07,0);
   add(side+'Foot',ankle,sign*.13,.04,.24,point(sign*.13,.04,.45));
  }
 }else{
  add('Hips',-1,0,.58,-.22);add('Spine',0,0,.62,0);add('Chest',1,0,.65,.22);add('Neck',2,0,.78,.32);add('Head',3,0,.86,.40,point(0,.91,.49));
  const tail=add('TailBase',0,0,.60,-.36);add('TailTip',tail,0,.66,-.46,point(0,.72,-.49));
  for(const [side,sign] of [['Left',1],['Right',-1]] as const){
   const shoulder=add(side+'Shoulder',2,sign*.23,.62,.23),elbow=add(side+'Elbow',shoulder,sign*.25,.40,.20),wrist=add(side+'Wrist',elbow,sign*.25,.10,.26);
   add(side+'Hand',wrist,sign*.25,.05,.35,point(sign*.25,.05,.43));
   const hip=add(side+'Hip',0,sign*.23,.57,-.23),knee=add(side+'Knee',hip,sign*.25,.33,-.14),ankle=add(side+'Ankle',knee,sign*.25,.10,-.27);
   add(side+'Foot',ankle,sign*.25,.05,-.18,point(sign*.25,.05,-.10));
  }
 }
 if(template==='quadruped'&&frame.torsoHeight!==undefined){const shift=frame.torsoHeight-joints.find(j=>j.name==='Chest')!.point.y;for(const joint of joints){joint.point.y+=shift;joint.end.y+=shift;}}
 if(template==='quadruped'&&frame.upperCenter){
  const chest=joints.find(j=>j.name==='Chest')!,neck=joints.find(j=>j.name==='Neck')!,head=joints.find(j=>j.name==='Head')!;
  head.point.x=frame.upperCenter[0];head.point.z=frame.upperCenter[2];neck.point.x=T.MathUtils.lerp(chest.point.x,head.point.x,.65);neck.point.z=T.MathUtils.lerp(chest.point.z,head.point.z,.65);head.end.copy(head.point);head.end.y+=frame.height*.08;
 }
 if(frame.mode==='support')for(const side of ['Left','Right'])for(const limb of template==='quadruped'?['front','back']:['back']){
  const sign=side==='Left'?1:-1,front=limb==='front',support=frame.supports.find(p=>{const offset=new T.Vector3().fromArray(p).sub(center);return Math.sign(offset.dot(right))===sign&&(template!=='quadruped'||(offset.dot(forward)>0)===front);});
  if(!support)continue;
  const hip=joints.find(j=>j.name===side+(front?'Shoulder':'Hip'))!,knee=joints.find(j=>j.name===side+(front?'Elbow':'Knee'))!,ankle=joints.find(j=>j.name===side+(front?'Wrist':'Ankle'))!,foot=joints.find(j=>j.name===side+(front?'Hand':'Foot'))!;
  ankle.point.fromArray(support);ankle.point.y=frame.floor+frame.height*.09;foot.point.fromArray(support);foot.point.y=frame.floor+frame.height*.04;foot.end.copy(foot.point).addScaledVector(forward,frame.height*.07);
  const height=knee.point.y;knee.point.copy(hip.point).lerp(ankle.point,.6).addScaledVector(forward,frame.height*.02);knee.point.y=height;
 }
 // One outgoing segment per joint. Branch roots keep their central body segment.
 for(let i=0;i<joints.length;i++){const child=joints.find(j=>j.parent===i);if(child)joints[i].end.copy(child.point);}
 return joints;
}
const pause=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
/** Binds an owned, static scene. All validation/weight work finishes before scene mutation. */
export async function bindDraftRig(root:T.Object3D,template:DraftRigTemplate,signal:AbortSignal,frameMode:'support'|'bounds'='support'):Promise<DraftRigReport>{
 signal.throwIfAborted();if(!['biped','biped-relaxed','quadruped'].includes(template)||!['support','bounds'].includes(frameMode))throw Error('draft-rig-template');
 root.updateWorldMatrix(true,true);const meshes:T.Mesh[]=[],bounds=new T.Box3();let vertices=0,triangles=0;
 const point=new T.Vector3(),cloud:number[]=[];
 root.traverse(node=>{
  if(node instanceof T.Bone||node instanceof T.SkinnedMesh)throw Error('draft-rig-already-bound');
  if(!(node instanceof T.Mesh)){if(node.type==='Line'||node.type==='LineSegments'||node.type==='Points')throw Error('draft-rig-static-mesh-required');return;}
  if(node===root||node instanceof T.InstancedMesh||node.children.length||Object.keys(node.geometry.morphAttributes).length||node.geometry.getAttribute('skinIndex')||node.geometry.getAttribute('skinWeight'))throw Error('draft-rig-static-mesh-required');
  const p=node.geometry.getAttribute('position');if(!p||p.itemSize!==3||p.count<3)throw Error('draft-rig-invalid-geometry');
  vertices+=p.count;triangles+=(node.geometry.index?.count??p.count)/3;if(vertices>500000||triangles>1000000||meshes.length>=64)throw Error('draft-rig-budget');
  if(!Number.isFinite(node.matrixWorld.determinant())||Math.abs(node.matrixWorld.determinant())<1e-12)throw Error('draft-rig-transform');
  for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(node.matrixWorld);if(!point.toArray().every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6))throw Error('draft-rig-invalid-geometry');bounds.expandByPoint(point);cloud.push(point.x,point.y,point.z);}
  meshes.push(node);
 });
 const size=bounds.getSize(new T.Vector3());
 if(!meshes.length||bounds.isEmpty()||Math.min(size.x,size.y,size.z)<1e-5||Math.max(size.x,size.y,size.z)/Math.min(size.x,size.y,size.z)>100)throw Error('draft-rig-volume-required');
 await pause();signal.throwIfAborted();
 const frame=frameMode==='support'?estimateDraftBodyFrame(cloud,bounds,template==='quadruped'?4:2):{mode:'bounds' as const,reason:'manual-bounds' as const,center:bounds.getCenter(new T.Vector3()).toArray(),right:[1,0,0] as [number,number,number],forward:[0,0,1] as [number,number,number],width:size.x,depth:size.z,height:size.y,floor:bounds.min.y,supports:[]};
 const joints=landmarks(template,frame),lines=joints.map(j=>new T.Line3(j.point,j.end)),sigma=Math.max(frame.width,frame.height,frame.depth)*.035,center=new T.Vector3().fromArray(frame.center),right=new T.Vector3().fromArray(frame.right);
 const plans:{mesh:T.Mesh;indices:Uint16Array;weights:Float32Array}[]=[],closest=new T.Vector3();
 for(const mesh of meshes){
  const p=mesh.geometry.getAttribute('position'),indices=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4);
  for(let i=0;i<p.count;i++){
   if(i%2048===0){await pause();signal.throwIfAborted();}
   point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   const lateral=(point.x-center.x)*right.x+(point.z-center.z)*right.z;
   const ranked=lines.map((line,bone)=>{
    line.closestPointToPoint(point,true,closest);
    // Smoothly separate left/right limb ownership around the central body seam.
    const side=joints[bone].name.startsWith('Left')?1:joints[bone].name.startsWith('Right')?-1:0;
    const ownership=side?T.MathUtils.smoothstep(side*lateral,-frame.width*.06,frame.width*.06):1;
    return {bone,score:ownership/Math.pow(point.distanceToSquared(closest)+sigma*sigma,2)};
   }).sort((a,b)=>b.score-a.score||a.bone-b.bone).slice(0,4);
   const raw=ranked.map(r=>r.score),total=raw.reduce((a,b)=>a+b,0);
   for(let k=0;k<4;k++){indices[i*4+k]=ranked[k].bone;weights[i*4+k]=raw[k]/total;}
  }
  plans.push({mesh,indices,weights});
 }
 signal.throwIfAborted();const inverse=root.matrixWorld.clone().invert(),local=joints.map(j=>j.point.clone().applyMatrix4(inverse)),bones=joints.map(()=>new T.Bone());
 const names=new Set<string>();root.traverse(n=>names.add(n.name));
 for(let i=0;i<bones.length;i++){
  let name='Draft_'+joints[i].name;while(names.has(name))name+='_' ;names.add(name);bones[i].name=name;
  bones[i].position.copy(local[i]);if(joints[i].parent>=0){bones[i].position.sub(local[joints[i].parent]);bones[joints[i].parent].add(bones[i]);}
 }
 root.add(bones[0]);root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);skeleton.calculateInverses();
 const originals=new Set<T.BufferGeometry>();
 for(const {mesh,indices,weights} of plans){
  originals.add(mesh.geometry);const geometry=mesh.geometry.clone();geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  const skin=new T.SkinnedMesh(geometry,mesh.material);skin.name=mesh.name;skin.position.copy(mesh.position);skin.quaternion.copy(mesh.quaternion);skin.scale.copy(mesh.scale);skin.matrix.copy(mesh.matrix);skin.matrixAutoUpdate=mesh.matrixAutoUpdate;
  skin.visible=mesh.visible;skin.renderOrder=mesh.renderOrder;skin.castShadow=mesh.castShadow;skin.receiveShadow=mesh.receiveShadow;skin.userData=structuredClone(mesh.userData);
  const parent=mesh.parent!,index=parent.children.indexOf(mesh);parent.remove(mesh);parent.add(skin);parent.children.splice(parent.children.indexOf(skin),1);parent.children.splice(index,0,skin);
  skin.updateWorldMatrix(true,false);skin.bind(skeleton,skin.matrixWorld);skin.computeBoundingBox();skin.computeBoundingSphere();
 }
 originals.forEach(g=>g.dispose());
 root.userData.pakachiDraftRig={version:2,template,method:'proportional-template',review:'required',frame};
 return {template,bones:bones.length,meshes:meshes.length,vertices,method:'proportional-template',review:'required',frame};
}
/** Source GLB is retained byte-for-byte; generated output is an independently validated GLB. */
export async function prepareDraftRig(bytes:Uint8Array,template:DraftRigTemplate,signal:AbortSignal,frameMode:'support'|'bounds'='support'):Promise<{bytes:Uint8Array;report:DraftRigReport}>{
 signal.throwIfAborted();if(bytes.length>50*1024*1024)throw Error('draft-rig-model-size');
 const model=await parseModel(Uint8Array.from(bytes).buffer);
 try{
  if(model.animations.length)throw Error('draft-rig-static-mesh-required');
  const report=await bindDraftRig(model.scene,template,signal,frameMode);signal.throwIfAborted();
  const rig=new StudioRig(model.scene);
  try{
   const check=createPoseSurfaceChecker(rig),neutral=rig.capture();report.probes=[];
   for(const suffix of ['LeftElbow','LeftKnee','RightElbow','RightKnee']){
    await pause();signal.throwIfAborted();const joint=rig.data.points.find(p=>p.name.startsWith('Draft_'+suffix))!,values=structuredClone(neutral);
    values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/6).toArray();
    const result=check({id:'probe',name:suffix,seconds:1,values});report.probes.push({joint:joint.name,degrees:30,status:result.status,surfaceIssues:result.issues,volumeIssues:result.volumeIssues,unmeasurableVolumeComponents:result.meshes.reduce((sum,m)=>sum+m.volume.unmeasurableComponents,0)});
   }
  }finally{rig.dispose();}
  const output=await exportRiggedFigureGLB(model.scene);signal.throwIfAborted();
  if(output.byteLength>50*1024*1024)throw Error('draft-rig-model-size');
  return {bytes:new Uint8Array(output),report};
 }finally{disposeModel(model.scene);}
}
