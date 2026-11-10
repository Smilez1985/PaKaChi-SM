import * as T from 'three';
import {POSE_MORPHS,POSE_MORPH_BIND,invalidatePoseMorphBindings,poseMorphBindings} from './pose-morphs.ts';
import type {PoseMorphShape} from './pose-morphs.ts';
export const MAX_STUDIO_SHAPES=4,MAX_CORRECTIVE_VERTICES=32768;
export interface StudioCorrectiveShape extends PoseMorphShape {id:string;meshes:{mesh:number;indices:number[];deltas:number[]}[]}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const quaternion=(v:unknown)=>Array.isArray(v)&&v.length===4&&v.every(n=>typeof n==='number'&&Number.isFinite(n))&&Math.abs(v.reduce((s,n)=>s+n*n,0)-1)<1e-5;
export function validCorrectiveShapes(value:unknown):value is StudioCorrectiveShape[]|undefined {
 if(value===undefined)return true;if(!Array.isArray(value)||value.length>MAX_STUDIO_SHAPES)return false;let count=0;const ids=new Set<string>();
 for(const s of value){
  if(!record(s)||Object.keys(s).some(k=>!['id','group','joint','rest','pose','radius','constraints','meshes'].includes(k))||typeof s.id!=='string'||!/^shape-[a-z0-9-]{1,64}$/.test(s.id)||ids.has(s.id)||s.group!==s.id||typeof s.joint!=='string'||!s.joint||s.joint.length>100||!quaternion(s.rest)||!quaternion(s.pose)||typeof s.radius!=='number'||!Number.isFinite(s.radius)||s.radius<.01||s.radius>Math.PI||!Array.isArray(s.meshes)||!s.meshes.length||s.meshes.length>128)return false;ids.add(s.id);if(s.radius>new T.Quaternion().fromArray(s.rest as number[]).angleTo(new T.Quaternion().fromArray(s.pose as number[]))+1e-8)return false;
  if(s.constraints!==undefined&&(!Array.isArray(s.constraints)||s.constraints.length>8||s.constraints.some(c=>!record(c)||Object.keys(c).some(k=>!['joint','rest','radius'].includes(k))||typeof c.joint!=='string'||!c.joint||c.joint.length>100||!quaternion(c.rest)||typeof c.radius!=='number'||!Number.isFinite(c.radius)||c.radius<=1e-6||c.radius>Math.PI)))return false;
  const meshes=new Set<number>();for(const m of s.meshes){if(!record(m)||Object.keys(m).some(k=>!['mesh','indices','deltas'].includes(k))||!Number.isInteger(m.mesh)||(m.mesh as number)<0||(m.mesh as number)>=2048||meshes.has(m.mesh as number)||!Array.isArray(m.indices)||!m.indices.length||!Array.isArray(m.deltas)||m.deltas.length!==m.indices.length*3)return false;meshes.add(m.mesh as number);count+=m.indices.length;if(count>MAX_CORRECTIVE_VERTICES)return false;let previous=-1;for(const i of m.indices){if(!Number.isInteger(i)||i<=previous||i>2_000_000)return false;previous=i;}if(m.deltas.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>2))return false;}
 }return true;
}
/** Rebuild only owned morph arrays. Source position, skin and imported targets remain intact. */
export function createCorrectiveInstaller(root:T.Object3D,surfaces:readonly {mesh:T.Mesh;base:Float32Array}[]){
 const originals=surfaces.map(({mesh})=>({attributes:Object.fromEntries(Object.entries(mesh.geometry.morphAttributes).map(([k,v])=>[k,[...v!]])),relative:mesh.geometry.morphTargetsRelative,dictionary:{...mesh.morphTargetDictionary},weights:[...(mesh.morphTargetInfluences??[])],shapes:structuredClone(mesh.userData[POSE_MORPHS]),bind:structuredClone(mesh.userData[POSE_MORPH_BIND]),normals:mesh.geometry.getAttribute('normal')?.clone()}));
 let generated=false;
 return (shapes:readonly StudioCorrectiveShape[])=>{
  if(!validCorrectiveShapes(shapes))throw Error('Ungültige geometrische Hautkorrekturen.');
  if(!generated&&!shapes.length)return;
  // Ordinary face/morph controls are independent of our driven targets.
  surfaces.forEach(({mesh},i)=>{const o=originals[i];o.weights=(mesh.morphTargetInfluences??[]).slice(0,o.weights.length);});generated=shapes.length>0;
  surfaces.forEach(({mesh},i)=>{const o=originals[i],current=mesh.geometry.morphAttributes.position??[],original=o.attributes.position??[];if(current.length!==original.length||current.some((a,k)=>a!==original[k]))mesh.geometry.dispose();mesh.geometry.morphAttributes=Object.fromEntries(Object.entries(o.attributes).map(([k,v])=>[k,[...v]]));mesh.geometry.morphTargetsRelative=o.relative;mesh.morphTargetDictionary={...o.dictionary};mesh.morphTargetInfluences=[...o.weights];for(const [key,v]of [[POSE_MORPHS,o.shapes],[POSE_MORPH_BIND,o.bind]] as const){if(v===undefined)delete mesh.userData[key];else mesh.userData[key]=structuredClone(v);}});
  invalidatePoseMorphBindings(root);
  for(const shape of shapes)for(const part of shape.meshes){
   const surface=surfaces[part.mesh];if(!surface)throw Error('Korrekturfläche fehlt.');const {mesh,base}=surface,g=mesh.geometry,o=originals[part.mesh];
   if(!(mesh instanceof T.SkinnedMesh)||Object.keys(g.morphAttributes).some(k=>!['position','normal'].includes(k))||g.morphAttributes.position?.length&&!g.morphTargetsRelative||(mesh.userData[POSE_MORPHS]?.length??0)>=32)throw Error('Korrekturform passt nicht zum Modell.');
   if(part.indices.some(i=>i>=base.length/3))throw Error('Korrekturvertices passen nicht zum Modell.');
   const delta=new Float32Array(base.length);part.indices.forEach((v,k)=>delta.set(part.deltas.slice(k*3,k*3+3),v*3));const name='pakachi-'+shape.id;
   if(mesh.morphTargetDictionary?.[name]!==undefined)throw Error('Korrekturform bereits vorhanden.');
   const scratch=new T.BufferGeometry();scratch.setAttribute('position',new T.Float32BufferAttribute(base.map((v,i)=>v+delta[i]),3));if(g.index)scratch.setIndex(g.index);scratch.computeVertexNormals();
   const normals=Float32Array.from(scratch.getAttribute('normal').array,(v,i)=>v-(o.normals?.getComponent(Math.floor(i/3),i%3)??0));scratch.dispose();
   const target=new T.BufferAttribute(delta,3);target.name=name;const normal=new T.BufferAttribute(normals,3);normal.name=name;const native=g.morphAttributes.position?.length??0;
   if(!g.morphAttributes.normal?.length)g.morphAttributes.normal=Array.from({length:native},()=>new T.Float32BufferAttribute(new Float32Array(base.length),3));
   (g.morphAttributes.position??=[]).push(target);g.morphAttributes.normal.push(normal);g.morphTargetsRelative=true;
   const previousWeights=[...(mesh.morphTargetInfluences??[])],previousNames={...mesh.morphTargetDictionary};mesh.updateMorphTargets();mesh.morphTargetDictionary={...previousNames,[name]:native};mesh.morphTargetInfluences=[...previousWeights,0];
   const {meshes:_meshes,id:_id,...driver}=shape;mesh.userData[POSE_MORPHS]=[...(mesh.userData[POSE_MORPHS]??[]),{...driver,target:name}];
   mesh.userData[POSE_MORPH_BIND]??=mesh.skeleton.boneInverses.map(m=>m.clone().multiply(mesh.bindMatrix).toArray());
  }
  invalidatePoseMorphBindings(root);
  if(!shapes.length)poseMorphBindings(root);
 };
}
