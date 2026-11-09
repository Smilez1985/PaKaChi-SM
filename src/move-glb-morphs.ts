import * as T from 'three';
import type {StudioRig} from './studio-rig.ts';
import type {StudioMove,Transform} from './studio-data.ts';
export const MAX_MOVE_MORPH_BYTES=64*1024*1024,MAX_MOVE_MORPH_TARGETS=64;
const MAX_WORK=20_000_000,MAX_VALUES=2_000_000;
interface Plan {mesh:number;native:number;shapes:Record<string,Transform>[];keys:number[]}
export function prepareMoveMorphs(rig:StudioRig,move:StudioMove,samples:number){
 const poses=move.poses.map(id=>rig.data.poses.find(p=>p.id===id)!);if(move.loop)poses.push(poses[0]);
 const times=[0];for(let i=1;i<poses.length;i++)times.push(times.at(-1)!+poses[i].seconds);
 const points=rig.data.points.filter(p=>p.kind==='surface'&&poses.some(pose=>new T.Vector3().fromArray(pose.values[p.id].position).distanceToSquared(new T.Vector3().fromArray(p.rest))>1e-12));
 const plans:Plan[]=[];let bytes=0,work=0,values=samples*(rig.data.points.filter(p=>p.kind==='bone').length*7+10);
 for(let m=0;m<rig.surfaces.length;m++){
  const s=rig.surfaces[m];let visible=true;for(let n:T.Object3D|null=s.mesh;n;n=n.parent)visible&&=n.visible;if(!visible)continue;const bounds=s.worldBounds,relevant=points.filter(p=>(p.mesh===undefined||p.mesh===m)&&new T.Sphere(new T.Vector3().fromArray(p.rest),p.radius).intersectsBox(bounds));if(!relevant.length)continue;
  if(Object.keys(s.mesh.geometry.morphAttributes).some(key=>key!=='position'&&key!=='normal'))throw Error('Vorhandene Morph-Attribute werden für Oberflächenanimationen nicht unterstützt.');
  const native=s.mesh.morphTargetInfluences?.length??0,shapes:Record<string,Transform>[]=[],indices=new Map<string,number>();
  const keys=poses.map(pose=>{let nonzero=false;const key=JSON.stringify(relevant.map(p=>{const delta=new T.Vector3().fromArray(pose.values[p.id].position).sub(new T.Vector3().fromArray(p.rest));if(delta.lengthSq()<=1e-12)return [0,0,0];nonzero=true;return delta.toArray();}));if(!nonzero)return -1;let index=indices.get(key);if(index===undefined){index=shapes.length;indices.set(key,index);shapes.push(pose.values);}return index;});
  if(native+shapes.length>MAX_MOVE_MORPH_TARGETS)throw Error('Zu viele Morph-Ziele für GLB-Export. Weniger unterschiedliche Oberflächenposen wählen.');
  const count=s.base.length/3;for(const key of ['position','normal'] as const){const attributes=s.mesh.geometry.morphAttributes[key]??[];if(attributes.length&&attributes.length!==native)throw Error('Inkonsistente Morph-Ziele im Modell.');if(!attributes.length)bytes+=native*count*12;}
  bytes+=shapes.length*count*24;work+=shapes.length*(count*relevant.length+(s.mesh.geometry.index?.count??count));values+=poses.length*(native+shapes.length);plans.push({mesh:m,native,shapes,keys});
 }
 if(plans.length){for(const s of rig.surfaces)for(const attrs of Object.values(s.mesh.geometry.morphAttributes))for(const attr of attrs??[])bytes+=attr.array.byteLength;
  if(bytes>MAX_MOVE_MORPH_BYTES||work>MAX_WORK||values>MAX_VALUES)throw Error('Oberflächenanimation ist für den GLB-Export zu umfangreich. Weniger Posen oder Punkte wählen.');}
 return {plans,times:Float32Array.from(times)};
}
/** Morph weights use original key times: surface deformation is linear between poses. */
export function installMoveMorphs(rig:StudioRig,mapping:Map<T.Object3D,T.Object3D>,prepared:ReturnType<typeof prepareMoveMorphs>){
 const tracks:T.KeyframeTrack[]=[];
 for(const plan of prepared.plans){
  const surface=rig.surfaces[plan.mesh],mesh=mapping.get(surface.mesh) as T.Mesh,geometry=mesh.geometry,relative=geometry.morphTargetsRelative,normal=geometry.getAttribute('normal');const nativeWeights=[...(mesh.morphTargetInfluences??[])],sum=nativeWeights.reduce((a,b)=>a+b,0),positionFactor=!relative&&surface.mesh.geometry.morphAttributes.position?.length?1-sum:1,normalFactor=!relative&&surface.mesh.geometry.morphAttributes.normal?.length?1-sum:1,names=new Map(Object.entries(mesh.morphTargetDictionary??{}).map(([name,index])=>[index,name])),usedNames=new Set(names.values());
  for(const key of ['position','normal'] as const){if(!geometry.morphAttributes[key]?.length){const base=geometry.getAttribute(key);geometry.morphAttributes[key]=Array.from({length:plan.native},()=>new T.Float32BufferAttribute(relative?new Float32Array(base.count*3):Float32Array.from({length:base.count*3},(_,i)=>base.getComponent(Math.floor(i/3),i%3)),3));}}
  for(const attributes of Object.values(geometry.morphAttributes))for(let i=0;i<plan.native;i++)attributes![i].name=names.get(i)??attributes![i].name;
  for(let k=0;k<plan.shapes.length;k++){
   const positions=rig.surfacePositions(plan.shapes[k],plan.mesh),scratch=new T.BufferGeometry();scratch.setAttribute('position',new T.BufferAttribute(positions,3));if(geometry.index)scratch.setIndex(geometry.index);scratch.computeVertexNormals();const normals=Float32Array.from(scratch.getAttribute('normal').array);
   // Absolute native targets subtract the currently deformed base in Three.js.
   // Their constant weights therefore attenuate the new surface displacement.
   for(let i=0;i<positions.length;i++){const base=surface.base[i],baseNormal=normal.getComponent(Math.floor(i/3),i%3),dp=(positions[i]-base)*positionFactor,dn=(normals[i]-baseNormal)*normalFactor;positions[i]=relative?dp:base+dp;normals[i]=relative?dn:baseNormal+dn;}
   const position=new T.BufferAttribute(positions,3);let name='pakachi-surface-'+(plan.native+k);while(usedNames.has(name))name+='-copy';usedNames.add(name);position.name=name;geometry.morphAttributes.position!.push(position);const normalTarget=new T.BufferAttribute(normals,3);normalTarget.name=position.name;geometry.morphAttributes.normal!.push(normalTarget);scratch.dispose();
  }
  mesh.updateMorphTargets();const count=plan.native+plan.shapes.length,weights=new Float32Array(prepared.times.length*count);
  plan.keys.forEach((key,i)=>{weights.set(nativeWeights,i*count);if(key>=0)weights[i*count+plan.native+key]=1;});mesh.morphTargetInfluences=Array.from(weights.subarray(0,count));
  tracks.push(new T.NumberKeyframeTrack(mesh.uuid+'.morphTargetInfluences',prepared.times,weights));
 }
 return tracks;
}
