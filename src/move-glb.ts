import {prepareMoveMorphs,installMoveMorphs} from './move-glb-morphs.ts';
import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import type {StudioMove} from './studio-data.ts';
import {FIGURE_TRACK,neutralFigure} from './studio-data.ts';
import {captureFigureHierarchy,disposeStaticFigure,writeFigureGLB} from './figure-glb.ts';
export const MOVE_GLB_FPS=30;
const MAX_SAMPLES=12000,MAX_VALUES=2_000_000;
const visible=(node:T.Object3D)=>{for(let n:T.Object3D|null=node;n;n=n.parent)if(!n.visible)return false;return true;};
/** Sample each segment separately so every key pose and loop closure is exact. */
export function moveGLBTimes(rig:StudioRig,move:StudioMove){
 const poses=move.poses.map(id=>rig.data.poses.find(p=>p.id===id));if(poses.length<2||poses.length>100||poses.some(p=>!p))throw Error('Bewegung benötigt 2 bis 100 vorhandene Posen.');
 const durations=poses.slice(1).map(p=>p!.seconds);if(move.loop)durations.push(poses[0]!.seconds);
 if(durations.some(d=>!Number.isFinite(d)||d<.1||d>30))throw Error('Ungültige Posendauer für GLB-Export.');
 const count=1+durations.reduce((n,d)=>n+Math.ceil(d*MOVE_GLB_FPS),0),bones=rig.data.points.filter(p=>p.kind==='bone').length;
 if(count>MAX_SAMPLES||count*(bones*7+10)>MAX_VALUES)throw Error('Bewegung ist für den GLB-Export zu umfangreich. Kürzere Sequenz wählen.');
 const times=[0];let start=0;for(const d of durations){const steps=Math.ceil(d*MOVE_GLB_FPS);for(let i=1;i<=steps;i++)times.push(start+d*i/steps);start+=d;}
 return times;
}
export function captureMoveGLB(rig:StudioRig,move:StudioMove){
 const times=moveGLBTimes(rig,move);
 for(const id of move.poses){const pose=rig.data.poses.find(p=>p.id===id)!;for(const p of rig.data.points)if(!pose.values[p.id])throw Error('Pose enthält nicht alle Gelenkspuren.');}
 const morphs=prepareMoveMorphs(rig,move,times.length);
 const scene=captureFigureHierarchy(rig.root);
 try{
  const source:T.Object3D[]=[],copies:T.Object3D[]=[];rig.root.traverse(n=>source.push(n));scene.children[0].traverse(n=>copies.push(n));if(source.length!==copies.length)throw Error('Figurenhierarchie konnte nicht zugeordnet werden.');const mapping=new Map(source.map((n,i)=>[n,copies[i]]));
  const model=scene.children[0];model.matrix.copy(rig.modelWorldMatrix);model.matrix.decompose(model.position,model.quaternion,model.scale);
  for(const surface of rig.surfaces){const mesh=mapping.get(surface.mesh) as T.Mesh;mesh.geometry.setAttribute('position',new T.BufferAttribute(surface.base.slice(),3));mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
  // Bones without a visible control point still use the project's rest transform.
  rig.bones.forEach((bone,i)=>{const node=mapping.get(bone),rest=rig.data.boneRest[i];if(node&&rest){node.position.fromArray(rest.position);node.quaternion.fromArray(rest.rotation);node.updateMatrix();}});
  const size=times.length,tracks:T.KeyframeTrack[]=[],timeArray=Float32Array.from(times);
  const channels=rig.data.points.filter(p=>p.kind==='bone'&&visible(rig.bones[p.bone!])).map(p=>{const node=mapping.get(rig.bones[p.bone!]);if(!node)throw Error('Gelenk fehlt in der exportierten Figur.');return {point:p,node,position:new Float32Array(size*3),rotation:new Float32Array(size*4)};});
  const position=new Float32Array(size*3),rotation=new Float32Array(size*4),scale=new Float32Array(size*3),center=new T.Vector3().fromArray(rig.figure.rest),q=new T.Quaternion(),offset=new T.Vector3();
  times.forEach((time,i)=>{const values=rig.sample(move,time),figure=values[FIGURE_TRACK]??neutralFigure(),factor=figure.scale??1;q.fromArray(figure.rotation).normalize();offset.copy(center).multiplyScalar(factor).applyQuaternion(q).negate().add(center).add(new T.Vector3().fromArray(figure.position));offset.toArray(position,i*3);q.toArray(rotation,i*4);scale.set([factor,factor,factor],i*3);
   for(const channel of channels){const value=values[channel.point.id];channel.position.set(value.position,i*3);channel.rotation.set(value.rotation,i*4);if(i===0){channel.node.position.fromArray(value.position);channel.node.quaternion.fromArray(value.rotation);channel.node.updateMatrix();}}
  });
  scene.position.fromArray(position);scene.quaternion.fromArray(rotation);scene.scale.fromArray(scale);scene.updateMatrix();
  // GLTFExporter switches every node to TRS for animation; reject matrix shear explicitly.
  scene.traverse(node=>{const recomposed=new T.Matrix4().compose(node.position,node.quaternion,node.scale);if(node.matrix.elements.some((v,i)=>!Number.isFinite(v)||Math.abs(v-recomposed.elements[i])>1e-6*Math.max(1,Math.abs(v))))throw Error('Gescherten Modellraum kann der GLB-Animationsexport nicht verlustfrei übernehmen.');});
  for(const c of channels){tracks.push(new T.VectorKeyframeTrack(c.node.uuid+'.position',timeArray,c.position),new T.QuaternionKeyframeTrack(c.node.uuid+'.quaternion',timeArray,c.rotation));}
  tracks.push(...installMoveMorphs(rig,mapping,morphs));
  tracks.push(new T.VectorKeyframeTrack(scene.uuid+'.position',timeArray,position),new T.QuaternionKeyframeTrack(scene.uuid+'.quaternion',timeArray,rotation),new T.VectorKeyframeTrack(scene.uuid+'.scale',timeArray,scale));
  scene.updateMatrixWorld(true);return {scene,clip:new T.AnimationClip(move.name,times.at(-1)!,tracks)};
 }catch(error){disposeStaticFigure(scene);throw error;}
}
export function exportMoveGLB(rig:StudioRig,move:StudioMove){const {scene,clip}=captureMoveGLB(rig,move);return writeFigureGLB(scene,[clip]);}
