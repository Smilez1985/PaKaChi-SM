import {StudioTopology,validateReparent} from './studio-topology.ts';
import {solveLimb} from './studio-ik.ts';
import {detectConnections,edgeKey} from './studio-detection.ts';
import * as T from 'three';
import { MAX_WEIGHT_TRANSFERS, emptyStudio, FIGURE_TRACK, neutralFigure, validFigureScale, validWeightRegion } from './studio-data.ts';
import type { ControlPoint, StudioData, Transform, Vec3, Pose, StudioMove, WeightRegion } from './studio-data.ts';
const read = (o:T.Object3D):Transform => ({position:o.position.toArray(),rotation:o.quaternion.toArray()});
const write = (o:T.Object3D,v:Transform) => {o.position.fromArray(v.position);o.quaternion.fromArray(v.rotation);};
interface Surface { mesh:T.Mesh; base:Float32Array; world:T.Vector3[]; worldBounds:T.Box3; inverse:T.Matrix3; worldInverse:T.Matrix4 }

/** World-space control points on a normalized model; deformation is applied before skinning. */
export class StudioRig {
  readonly root:T.Object3D;
  readonly bones:T.Bone[]=[];
  readonly surfaces:Surface[]=[];
  readonly figure:ControlPoint={id:FIGURE_TRACK,name:'Gesamte Figur',kind:'surface',rest:[0,0,0],size:.055,radius:.12};
  private figureOffset=new T.Vector3();
  private figureRotation=new T.Quaternion();
  private figureScale=1;
  get scale(){return this.figureScale;}
  /** Original normalized model frame, independent of the current whole-figure pose. */
  get modelWorldMatrix(){return this.rootWorld.clone();}
  setFigureScale(value:number){this.setFigureTransform(this.figureOffset,this.figureRotation,value);}
  private figureMatrix=new T.Matrix4();
  private rootMatrix:T.Matrix4;
  private rootWorld:T.Matrix4;
  private rootAutoUpdate:boolean;
  data:StudioData;
  readonly initial:StudioData;
  private originalNodes:{node:T.Object3D;value:Transform;scale:T.Vector3}[]=[];
  private originalBoneRest:Transform[];
  private bindings:{mesh:T.SkinnedMesh;inverses:T.Matrix4[];bind:T.Matrix4}[]=[];
  private topology:StudioTopology;
  private surfaceValues:Record<string,Transform>={};
  constructor(root:T.Object3D, saved?:StudioData) {
    this.root=root;root.updateWorldMatrix(true,true);this.rootMatrix=root.matrix.clone();this.rootWorld=root.matrixWorld.clone();this.rootAutoUpdate=root.matrixAutoUpdate;
    const bounds=new T.Box3().setFromObject(root);if(!bounds.isEmpty())this.figure.rest=bounds.getCenter(new T.Vector3()).toArray();
    root.traverse(node=>{this.originalNodes.push({node,value:read(node),scale:node.scale.clone()});if(node instanceof T.Bone)this.bones.push(node);});
    if(this.bones.length>256)throw new Error('Das Studio unterstützt derzeit höchstens 256 Skelettpunkte.');
    this.originalBoneRest=this.bones.map(read);
    root.traverse(node=>{if(node instanceof T.SkinnedMesh)this.bindings.push({mesh:node,inverses:node.skeleton.boneInverses.map(m=>m.clone()),bind:node.bindMatrix.clone()});});
    const sourceGeometries=new Set<T.BufferGeometry>();
    root.traverse(node=>{if(node instanceof T.Mesh){
      // Keep source geometry intact; every studio surface owns its mutable copy.
      const old=node.geometry;sourceGeometries.add(old);node.geometry=old.clone();
      const attr=node.geometry.getAttribute('position');if(!attr)return;
      const base=new Float32Array(attr.count*3);for(let i=0;i<attr.count;i++){base[i*3]=attr.getX(i);base[i*3+1]=attr.getY(i);base[i*3+2]=attr.getZ(i);}
      node.geometry.setAttribute('position',new T.Float32BufferAttribute(base.slice(),3));
      const world=Array.from({length:attr.count},(_,i)=>new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(node.matrixWorld));
      this.surfaces.push({mesh:node,base,world,worldBounds:new T.Box3().setFromPoints(world),worldInverse:node.matrixWorld.clone().invert(),inverse:new T.Matrix3().setFromMatrix4(node.matrixWorld.clone().invert())});
    }});
    sourceGeometries.forEach(g=>g.dispose());
    this.topology=new StudioTopology([...this.bones],root);
    this.initial={...emptyStudio(),boneRest:this.bones.map(read),points:this.bones.map((bone,i)=>({id:`bone-${i}`,kind:'bone',bone:i,name:(bone.name || `Gelenk ${i+1}`).slice(0,100),rest:bone.getWorldPosition(new T.Vector3()).toArray(),size:.025,radius:.18}))};
    this.data=saved ? structuredClone(saved) : structuredClone(this.initial);
    if(saved) {
      if(saved.boneRest.length!==this.bones.length+(saved.boneInsertions?.length??0) || saved.points.some(p=>p.mesh!==undefined && p.mesh>=this.surfaces.length))throw new Error('Studio-Daten passen nicht zum enthaltenen Modell.');
    }
    if(!saved){this.data.links=detectConnections(this);this.initial.links=structuredClone(this.data.links);}
    this.reset();
  }
  insertJoint(point:ControlPoint,ratio=.5){
    if(point.kind!=='bone'||!Number.isFinite(ratio)||ratio<.1||ratio>.9||this.data.points.length>=256||this.data.boneRest.length>=256||(this.data.boneInsertions?.length??0)>=64)throw Error('Zwischengelenk kann hier nicht eingefügt werden.');
    const child=this.bones[point.bone!],parent=child.parent;
    if(!(parent instanceof T.Bone)||this.data.boneRest[point.bone!].position.every(v=>Math.abs(v)<1e-8))throw Error('Einen Endpunkt mit vorhandener Knochenstrecke auswählen.');
    const parentPoint=this.data.points.find(p=>p.kind==='bone'&&this.bones[p.bone!]===parent);
    if(!parentPoint)throw Error('Zuerst die vorhandenen Gelenke erkennen.');
    const before=structuredClone(this.data),values=this.capture(),originalValues=structuredClone(values);
    try{
      const offset=new T.Vector3().fromArray(this.data.boneRest[point.bone!].position).multiplyScalar(ratio),index=this.data.boneRest.length,id='joint-'+crypto.randomUUID();
      this.data.boneInsertions=[...(this.data.boneInsertions??[]),{child:point.bone!,ratio,...(this.data.boneDeletions?.length?{afterDeletions:this.data.boneDeletions.length}:{})}];
      this.data.boneRest[point.bone!].position=new T.Vector3().fromArray(this.data.boneRest[point.bone!].position).sub(offset).toArray();
      const rest:Transform={position:offset.toArray(),rotation:[0,0,0,1]};this.data.boneRest.push(rest);
      const convert=(v:Record<string,Transform>)=>{if(v[point.id])v[point.id].position=new T.Vector3().fromArray(v[point.id].position).sub(offset).toArray();v[id]=structuredClone(rest);};
      this.data.poses.forEach(p=>convert(p.values));if(this.data.draft)convert(this.data.draft);convert(values);
      const added:ControlPoint={id,name:'Zwischengelenk',kind:'bone',bone:index,rest:[0,0,0],size:.025,radius:.18};this.data.points.push(added);
      this.data.links=this.data.links.filter(l=>!(l.includes(point.id)&&l.includes(parentPoint.id)));this.data.links.push([parentPoint.id,id],[id,point.id]);
      this.reset();added.rest=this.position(added).toArray();this.apply(values);return added;
    }catch(error){this.data=before;this.reset();this.apply(originalValues);throw error;}
  }
  addBone(parentPoint:ControlPoint,position:T.Vector3){
    if(parentPoint.kind!=='bone'||!this.data.points.includes(parentPoint)||!position.toArray().every(v=>Number.isFinite(v)&&Math.abs(v)<=100)||this.data.points.length>=256||this.data.boneRest.length>=256||(this.data.boneInsertions?.length??0)>=64||this.data.links.length>=2048)throw Error('Elternknochen und gültige Position wählen; höchstens 64 neue Knochen und 256 Gelenke.');
    const before=structuredClone(this.data),values=this.capture(),original=structuredClone(values);
    try{
      this.reset();const restParent=this.bones[parentPoint.bone!];restParent.updateWorldMatrix(true,false);
      const determinant=restParent.matrixWorld.determinant();if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-12)throw Error('Elterntransformation ist nicht invertierbar. Skalierung prüfen.');
      const local=restParent.worldToLocal(position.clone());
      if(!local.toArray().every(v=>Number.isFinite(v)&&Math.abs(v)<=100))throw Error('Lokale Knochenposition liegt außerhalb des unterstützten Bereichs.');
      if(local.length()<1e-5)throw Error('Neuen Knochen mit Abstand zum Elternknochen setzen.');
      const rest:Transform={position:local.toArray(),rotation:[0,0,0,1]},index=this.data.boneRest.length,id='joint-'+crypto.randomUUID();
      this.data.boneInsertions=[...(this.data.boneInsertions??[]),{parent:parentPoint.bone!,...(this.data.boneDeletions?.length?{afterDeletions:this.data.boneDeletions.length}:{})}];
      this.data.boneRest.push(rest);
      const added:ControlPoint={id,name:'Neuer Knochen',kind:'bone',bone:index,rest:position.toArray(),size:.025,radius:.18};
      this.data.points.push(added);this.data.links.push([parentPoint.id,id]);
      for(const pose of this.data.poses)pose.values[id]=structuredClone(rest);if(this.data.draft)this.data.draft[id]=structuredClone(rest);values[id]=structuredClone(rest);
      this.reset();this.apply(values);return added;
    }catch(error){this.data=before;this.reset();this.apply(original);throw error;}
  }
  transferWeights(point:ControlPoint,target:ControlPoint,amount:number,region?:WeightRegion){
    if(point.kind!=='bone'||target.kind!=='bone'||point===target||!this.data.points.includes(point)||!this.data.points.includes(target)||!Number.isFinite(amount)||amount<=0||amount>1||(this.data.weightTransfers?.length??0)>=MAX_WEIGHT_TRANSFERS)throw Error('Zwei verschiedene Knochen und einen Anteil über 0 bis 100 % wählen (höchstens 1024 Übertragungen).');
    if(region!==undefined&&!validWeightRegion(region))throw Error('Ungültiger Bereich für Hautgewichte.');
    const edit={from:point.bone!,to:target.bone!,amount,...(region?{region:structuredClone(region)}:{}),after:(this.data.boneInsertions?.length??0)+(this.data.boneDeletions?.length??0)};
    this.topology.transfer(edit,this.bones[point.bone!],this.bones[target.bone!]);
    (this.data.weightTransfers??=[]).push(edit);
  }

  reparentBone(point:ControlPoint,target:ControlPoint){
    if(point.kind!=='bone'||target.kind!=='bone'||!this.data.points.includes(point)||!this.data.points.includes(target)||(this.data.boneReparents?.length??0)>=256)throw Error('Zwei vorhandene Knochen auswählen (höchstens 256 Umhängungen).');
    const bone=this.bones[point.bone!],parent=this.bones[target.bone!],{common,ratio}=validateReparent(bone,parent);
    const oldParent=this.data.points.find(p=>p.kind==='bone'&&this.bones[p.bone!]===bone.parent);
    if(!oldParent)throw Error('Zuerst die vorhandenen Gelenke erkennen.');
    const before=structuredClone(this.data),values=this.capture(),original=structuredClone(values);
    // Solve without the bone's own scale; topology replay applies the fixed branch ratio.
    // This avoids reflection sign ambiguity when decomposing a negatively scaled matrix.
    const world=(node:T.Bone,v:Record<string,Transform>):T.Matrix4=>{
      const chain:T.Bone[]=[];for(let n:T.Object3D|null=node;n instanceof T.Bone&&n!==common;n=n.parent)chain.unshift(n);
      const matrix=new T.Matrix4();for(const n of chain){const i=this.bones.indexOf(n),p=this.data.points.find(p=>p.kind==='bone'&&p.bone===i),t=p&&v[p.id]||before.boneRest[i];matrix.multiply(new T.Matrix4().compose(new T.Vector3().fromArray(t.position),new T.Quaternion().fromArray(t.rotation),n===bone?new T.Vector3(1,1,1):n.scale));}return matrix;
    };
    const convert=(v:Record<string,Transform>):Transform=>{
      const matrix=world(parent,v).invert().multiply(world(bone,v)),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();matrix.decompose(position,rotation,scale);rotation.normalize();
      const rebuilt=new T.Matrix4().compose(position,rotation,new T.Vector3(ratio,ratio,ratio));
      if(!position.toArray().every(n=>Number.isFinite(n)&&Math.abs(n)<=10000)||matrix.elements.some((n,i)=>!Number.isFinite(n)||Math.abs(n-rebuilt.elements[i])>1e-8*Math.max(1,Math.abs(n))))throw Error('Knochenrahmen kann nicht verlustfrei umgerechnet werden.');
      return {position:position.toArray(),rotation:rotation.toArray()};
    };
    try{
      const rest=convert({}),poses=this.data.poses.map(p=>convert(p.values)),draft=this.data.draft?convert(this.data.draft):undefined,current=convert(values);
      this.data.boneRest[point.bone!]=rest;this.data.poses.forEach((p,i)=>p.values[point.id]=poses[i]);if(this.data.draft&&draft)this.data.draft[point.id]=draft;values[point.id]=current;
      this.data.boneReparents=[...(this.data.boneReparents??[]),{bone:point.bone!,parent:target.bone!,after:(this.data.boneInsertions?.length??0)+(this.data.boneDeletions?.length??0)}];
      this.data.links=this.data.links.filter(l=>!(l.includes(point.id)&&l.includes(oldParent.id)));
      if(!this.data.links.some(l=>l.includes(point.id)&&l.includes(target.id)))this.data.links.push([target.id,point.id]);
      if(this.data.links.length>2048)throw Error('Zu viele Gelenkverbindungen.');
      this.reset();this.apply(values);
    }catch(error){this.data=before;this.reset();this.apply(original);throw error;}
  }
  deleteBone(point:ControlPoint){
    if(point.kind!=='bone'||this.data.boneDeletions?.includes(point.bone!))throw Error('Einen vorhandenen Knochen auswählen.');
    const bone=this.bones[point.bone!],parent=bone.parent;
    if(!(parent instanceof T.Bone)||bone.children.some(n=>!(n instanceof T.Bone))||(bone.children.length>0&&bone.scale.distanceTo(new T.Vector3(1,1,1))>1e-8))throw Error('Wurzelknochen, skalierte Zwischenknochen und Knochen mit Anbauteilen können nicht gelöscht werden.');
    const parentPoint=this.data.points.find(p=>p.kind==='bone'&&this.bones[p.bone!]===parent);
    const children=bone.children.map(child=>this.data.points.find(p=>p.kind==='bone'&&this.bones[p.bone!]===child));
    if(!parentPoint||children.some(p=>!p))throw Error('Zuerst die vorhandenen Gelenke erkennen.');
    const before=structuredClone(this.data),values=this.capture(),original=structuredClone(values);
    const combine=(a:Transform,b:Transform):Transform=>({position:new T.Vector3().fromArray(b.position).applyQuaternion(new T.Quaternion().fromArray(a.rotation)).add(new T.Vector3().fromArray(a.position)).toArray(),rotation:new T.Quaternion().fromArray(a.rotation).multiply(new T.Quaternion().fromArray(b.rotation)).normalize().toArray()});
    try{
      for(const child of children)this.data.boneRest[child!.bone!]=combine(before.boneRest[point.bone!],before.boneRest[child!.bone!]);
      const convert=(v:Record<string,Transform>)=>{for(const child of children)v[child!.id]=combine(v[point.id]??before.boneRest[point.bone!],v[child!.id]??before.boneRest[child!.bone!]);delete v[point.id];};
      this.data.poses.forEach(p=>convert(p.values));if(this.data.draft)convert(this.data.draft);convert(values);
      this.data.boneDeletions=[...(this.data.boneDeletions??[]),point.bone!];this.data.points=this.data.points.filter(p=>p.id!==point.id);this.data.links=this.data.links.filter(l=>!l.includes(point.id));
      for(const child of children)if(!this.data.links.some(l=>l.includes(parentPoint.id)&&l.includes(child!.id)))this.data.links.push([parentPoint.id,child!.id]);
      this.reset();this.apply(values);return parentPoint.id;
    }catch(error){this.data=before;this.reset();this.apply(original);throw error;}
  }
  dispose(){this.topology.restore();}
  reset() {
    this.figureOffset.set(0,0,0);this.figureRotation.identity();this.figureScale=1;this.figureMatrix.identity();this.root.matrixAutoUpdate=this.rootAutoUpdate;this.root.matrix.copy(this.rootMatrix);
    for(const item of this.originalNodes){write(item.node,item.value);item.node.scale.copy(item.scale);}
    const bones=this.topology.build(this.data.boneInsertions??[],this.data.boneRest,this.data.boneDeletions??[],this.data.boneReparents??[],this.data.weightTransfers??[]);this.bones.splice(0,this.bones.length,...bones);
    this.bones.forEach((b,i)=>write(b,this.data.boneRest[i]));
    this.root.updateWorldMatrix(true,true);
    this.rebind();
    this.surfaceValues=Object.fromEntries(this.data.points.filter(p=>p.kind==='surface').map(p=>[p.id,{position:[...p.rest] as Vec3,rotation:[0,0,0,1]}]));
    this.deform();
  }
  restoreSource() {
    this.figureOffset.set(0,0,0);this.figureRotation.identity();this.figureScale=1;this.figureMatrix.identity();this.root.matrixAutoUpdate=this.rootAutoUpdate;this.root.matrix.copy(this.rootMatrix);
    this.topology.restore();
    this.bones.slice(0,this.originalBoneRest.length).forEach((b,i)=>write(b,this.originalBoneRest[i]));
    for(const item of this.originalNodes){write(item.node,item.value);item.node.scale.copy(item.scale);}
    this.root.updateWorldMatrix(true,true);
    for(const b of this.bindings){b.mesh.skeleton.boneInverses=b.inverses.map(m=>m.clone());b.mesh.bind(b.mesh.skeleton,b.bind);}
    this.root.updateMatrixWorld(true);
    for(const s of this.surfaces){(s.mesh.geometry.getAttribute('position') as T.BufferAttribute).copyArray(s.base);s.mesh.geometry.getAttribute('position').needsUpdate=true;s.mesh.geometry.computeVertexNormals();s.mesh.geometry.computeBoundingSphere();s.mesh.geometry.computeBoundingBox();}
  }
  private rebind(){for(const b of this.bindings){b.mesh.skeleton.calculateInverses();b.mesh.bind(b.mesh.skeleton,b.mesh.matrixWorld);}}
  private anchors=new Map<string,{key:string;index:number}>();
  private surfaceMatrix(p:ControlPoint):T.Matrix4 {
    const surface=p.mesh===undefined?undefined:this.surfaces[p.mesh];if(!surface)return this.figureMatrix.clone();
    const mesh=surface.mesh;
    if(!(mesh instanceof T.SkinnedMesh))return mesh.matrixWorld.clone().multiply(surface.worldInverse);
    const key=`${p.mesh}:${p.rest.join(',')}`;let anchor=this.anchors.get(p.id);
    if(anchor?.key!==key){const center=new T.Vector3().fromArray(p.rest);let distance=Infinity,index=0;surface.world.forEach((v,i)=>{const d=v.distanceToSquared(center);if(d<distance){distance=d;index=i;}});anchor={key,index};this.anchors.set(p.id,anchor);}
    const indices=new T.Vector4().fromBufferAttribute(mesh.geometry.getAttribute('skinIndex'),anchor.index);
    const weights=new T.Vector4().fromBufferAttribute(mesh.geometry.getAttribute('skinWeight'),anchor.index);
    const blended=new T.Matrix4();blended.elements.fill(0);
    for(let i=0;i<4;i++){const weight=weights.getComponent(i);if(!weight)continue;const index=indices.getComponent(i),bone=mesh.skeleton.bones[index];const m=bone.matrixWorld.clone().multiply(mesh.skeleton.boneInverses[index]);for(let j=0;j<16;j++)blended.elements[j]+=m.elements[j]*weight;}
    return mesh.matrixWorld.clone().multiply(mesh.bindMatrixInverse).multiply(blended).multiply(mesh.bindMatrix).multiply(surface.worldInverse);
  }
  position(p:ControlPoint):T.Vector3 {return p.id===FIGURE_TRACK ? new T.Vector3().fromArray(this.figure.rest).add(this.figureOffset) : p.kind==='bone' ? this.bones[p.bone!].getWorldPosition(new T.Vector3()) : new T.Vector3().fromArray(this.surfaceValues[p.id]?.position ?? p.rest).applyMatrix4(this.surfaceMatrix(p));}
  rotation(p:ControlPoint):T.Quaternion {if(p.id===FIGURE_TRACK)return this.figureRotation.clone();return p.kind==='bone' ? this.bones[p.bone!].getWorldQuaternion(new T.Quaternion()) : new T.Quaternion();}
  capture():Record<string,Transform> {return {[FIGURE_TRACK]:{position:this.figureOffset.toArray(),rotation:this.figureRotation.toArray(),scale:this.figureScale},...Object.fromEntries(this.data.points.map(p=>[p.id,p.kind==='bone' ? read(this.bones[p.bone!]) : structuredClone(this.surfaceValues[p.id] ?? {position:p.rest,rotation:[0,0,0,1]})]))};}
  apply(values:Record<string,Transform>) {
    const figure=values[FIGURE_TRACK]??neutralFigure();this.setFigureTransform(new T.Vector3().fromArray(figure.position),new T.Quaternion().fromArray(figure.rotation),figure.scale??1);
    for(const p of this.data.points){const v=values[p.id];if(!v)continue;if(p.kind==='bone')write(this.bones[p.bone!],v);else this.surfaceValues[p.id]=structuredClone(v);}
    this.root.updateWorldMatrix(true,true);this.deform();
  }
  setFigureOffset(offset:T.Vector3){this.setFigureTransform(offset,this.figureRotation);}
  setFigureTransform(offset:T.Vector3,rotation:T.Quaternion,scale=this.figureScale){
    if(!validFigureScale(scale))throw new Error('Figurgröße muss zwischen 10 % und 500 % liegen.');
    this.figureScale=scale;
    this.figureOffset.copy(offset);this.figureRotation.copy(rotation).normalize();
    const center=new T.Vector3().fromArray(this.figure.rest);
    this.figureMatrix.makeTranslation(center.clone().add(offset)).multiply(new T.Matrix4().makeRotationFromQuaternion(this.figureRotation)).multiply(new T.Matrix4().makeScale(scale,scale,scale)).multiply(new T.Matrix4().makeTranslation(center.negate()));
    const local=this.figureMatrix.clone().multiply(this.rootWorld);
    if(this.root.parent){this.root.parent.updateWorldMatrix(true,false);local.premultiply(this.root.parent.matrixWorld.clone().invert());}
    // Keep the exact matrix, including shear from nonuniformly scaled parents.
    // Decomposed fields remain useful for inspection but never replace this matrix.
    this.root.matrixAutoUpdate=false;this.root.matrix.copy(local);local.decompose(this.root.position,this.root.quaternion,this.root.scale);
    this.root.matrixWorldNeedsUpdate=true;this.root.updateWorldMatrix(true,true);
    // SkinnedMesh updates its inverse bind matrix in updateMatrixWorld, not updateWorldMatrix.
    this.root.updateMatrixWorld(true);
  }
  isBoneConnection(a:ControlPoint,b:ControlPoint):boolean {
    if(a.kind!=='bone'||b.kind!=='bone')return false;
    const x=this.bones[a.bone!],y=this.bones[b.bone!];return x.parent===y||y.parent===x;
  }
  validateConnection(a:ControlPoint,b:ControlPoint) {
    if((a.kind==='bone'||b.kind==='bone')&&!this.isBoneConnection(a,b))throw new Error('Gelenkketten verbinden benachbarte Quellknochen. Freie Punkte lassen sich untereinander gruppieren.');
  }
  /** Only actual connected parent bones drive IK; arbitrary lines never rewrite a source rig. */
  poseChain(p:ControlPoint,index?:{byBone:Map<T.Bone,ControlPoint>;edges:Set<string>}):T.Bone[] {
    if(p.kind!=='bone')return [];
    const byBone=index?.byBone??new Map(this.data.points.filter(p=>p.kind==='bone').map(p=>[this.bones[p.bone!],p]));
    const edges=index?.edges??new Set(this.data.links.map(edgeKey)),result:T.Bone[]=[];
    let child=this.bones[p.bone!];
    while(result.length<2&&child.parent instanceof T.Bone){
      const parent=child.parent,a=byBone.get(child),b=byBone.get(parent);
      if(!a||!b||!edges.has(edgeKey([a.id,b.id]))||parent.children.filter(n=>n instanceof T.Bone).length>1)break;
      result.push(parent);child=parent;
    }
    return result;
  }
  setPoint(p:ControlPoint, position:T.Vector3, rotation:T.Quaternion, edit:boolean, intent?:'translate'|'rotate'|'both') {
    if(p.id===FIGURE_TRACK){if(!edit)this.setFigureTransform(position.clone().sub(new T.Vector3().fromArray(this.figure.rest)),rotation);return;}
    if(p.kind==='bone') {
      const bone=this.bones[p.bone!];
      if(!edit){
        const mode=intent??(position.distanceTo(this.position(p))>1e-7?'both':'rotate');
        if(mode!=='rotate'){
          if(!(bone.parent instanceof T.Bone))this.setFigureOffset(this.figureOffset.clone().add(position.clone().sub(this.position(p))));
          else {const chain=this.poseChain(p),middle=this.data.points.find(q=>q.kind==='bone'&&this.bones[q.bone!]===chain[0]);solveLimb(bone,chain,position,chain.length===2?middle?.bendLimit:undefined);}
        }
        if(mode!=='translate'){const parentQ=bone.parent!.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parentQ.invert().multiply(rotation));}
        this.root.updateWorldMatrix(true,true);this.root.updateMatrixWorld(true);this.deform();return;
      }
      const children=bone.children.map(node=>({node,world:node.getWorldPosition(new T.Vector3())}));
      bone.position.copy(bone.parent!.worldToLocal(position.clone()));
      const parentQ=bone.parent!.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parentQ.invert().multiply(rotation));
      bone.updateWorldMatrix(true,true);
      if(edit) {
        for(const c of children)c.node.position.copy(bone.worldToLocal(c.world));
        this.data.boneRest=this.bones.map(read);this.root.updateWorldMatrix(true,true);
        this.data.points.filter(p=>p.kind==='bone').forEach(p=>p.rest=this.position(p).toArray());
        this.rebind();
      }
    } else {const local=position.clone().applyMatrix4(this.surfaceMatrix(p).invert());this.surfaceValues[p.id]={position:local.toArray(),rotation:[0,0,0,1]};if(edit)p.rest=local.toArray();}
    this.root.updateWorldMatrix(true,true);this.deform();
  }
  /** Same additive pre-skin deformation as the editor, without modifying live geometry. */
  surfacePositions(values:Record<string,Transform>,mesh:number):Float32Array {
    const surface=this.surfaces[mesh];if(!surface)throw Error('Oberfläche fehlt.');
    const attr=new T.BufferAttribute(new Float32Array(surface.base.length),3);this.deformSurface(attr,mesh,values);return attr.array as Float32Array;
  }
  private deformSurface(attr:T.BufferAttribute,mesh:number,values:Record<string,Transform>){
    const s=this.surfaces[mesh];attr.copyArray(s.base);
    for(const p of this.data.points){if(p.kind!=='surface'||p.mesh!==undefined&&p.mesh!==mesh)continue;
      const delta=new T.Vector3().fromArray(values[p.id]?.position??p.rest).sub(new T.Vector3().fromArray(p.rest));if(!(delta.lengthSq()>1e-12))continue;
      const center=new T.Vector3().fromArray(p.rest);if(!s.worldBounds.intersectsSphere(new T.Sphere(center,p.radius)))continue;const offset=delta.applyMatrix3(s.inverse);
      for(let i=0;i<s.world.length;i++){const t=1-s.world[i].distanceTo(center)/p.radius;if(t<=0)continue;const w=t*t*(3-2*t);attr.setXYZ(i,attr.getX(i)+offset.x*w,attr.getY(i)+offset.y*w,attr.getZ(i)+offset.z*w);}
    }
  }
  private deform() {
    for(let m=0;m<this.surfaces.length;m++){
      const s=this.surfaces[m],attr=s.mesh.geometry.getAttribute('position') as T.BufferAttribute;this.deformSurface(attr,m,this.surfaceValues);
      attr.needsUpdate=true;s.mesh.geometry.computeVertexNormals();s.mesh.geometry.computeBoundingSphere();s.mesh.geometry.computeBoundingBox();
    }
  }
  sample(move:StudioMove, seconds:number):Record<string,Transform> {
    const poses=move.poses.map(id=>this.data.poses.find(p=>p.id===id)!);if(poses.some(p=>!p))throw new Error('Pose fehlt.');
    if(poses.length<2)throw new Error('Mindestens zwei Posen erforderlich.');
    const duration=this.duration(move);let time=move.loop ? seconds%duration : Math.min(seconds,duration);
    let a:Pose=poses[0], b:Pose=poses[0],ratio=0;
    for(let i=1;i<poses.length+(move.loop?1:0);i++) {b=poses[i%poses.length];if(time<=b.seconds){ratio=time/b.seconds;break;}time-=b.seconds;a=b;}
    const result:Record<string,Transform>={};
    for(const p of this.data.points){const x=a.values[p.id],y=b.values[p.id];if(!x||!y)throw new Error('Posen nach Gelenkänderung neu aufnehmen.');
      result[p.id]={position:new T.Vector3().fromArray(x.position).lerp(new T.Vector3().fromArray(y.position),ratio).toArray(),rotation:new T.Quaternion().fromArray(x.rotation).slerp(new T.Quaternion().fromArray(y.rotation),ratio).toArray()};}
    const x=a.values[FIGURE_TRACK]??neutralFigure(),y=b.values[FIGURE_TRACK]??neutralFigure();
    result[FIGURE_TRACK]={scale:T.MathUtils.lerp(x.scale??1,y.scale??1,ratio),position:new T.Vector3().fromArray(x.position).lerp(new T.Vector3().fromArray(y.position),ratio).toArray(),rotation:new T.Quaternion().fromArray(x.rotation).slerp(new T.Quaternion().fromArray(y.rotation),ratio).toArray()};
    return result;
  }
  /** Read-only evaluation in the same anchor-parent space used by the two-link solver. */
  checkPoseBends(pose:Pose){
    const results:{jointId:string;name:string;endpointId:string;angle:number|null;min:number;max:number;status:'within'|'outside'|'unmeasurable'}[]=[];
    const evaluated=new Set<string>();
    const scale=new Map(this.bones.map(bone=>[bone,bone.scale.clone()]));
    const local=(point:ControlPoint)=>{const v=pose.values[point.id];if(!v)throw Error('Pose enthält nicht alle Gelenkspuren.');return new T.Matrix4().compose(new T.Vector3().fromArray(v.position),new T.Quaternion().fromArray(v.rotation),scale.get(this.bones[point.bone!])??new T.Vector3(1,1,1));};
    const points=new Map(this.data.points.filter(p=>p.kind==='bone').map(p=>[this.bones[p.bone!],p]));
    const index={byBone:points,edges:new Set(this.data.links.map(edgeKey))};
    for(const endpoint of this.data.points){
      const chain=this.poseChain(endpoint,index);if(chain.length!==2)continue;
      const middle=points.get(chain[0])!,anchor=points.get(chain[1])!,limit=middle.bendLimit;if(!limit)continue;
      evaluated.add(middle.id);
      const am=local(anchor),bm=am.clone().multiply(local(middle)),cm=bm.clone().multiply(local(endpoint));
      const a=new T.Vector3().setFromMatrixPosition(am),b=new T.Vector3().setFromMatrixPosition(bm),c=new T.Vector3().setFromMatrixPosition(cm);
      const upper=b.clone().sub(a),lower=c.sub(b);
      const angle=upper.lengthSq()<1e-16||lower.lengthSq()<1e-16?null:T.MathUtils.radToDeg(upper.angleTo(lower));
      results.push({jointId:middle.id,name:middle.name,endpointId:endpoint.id,angle,min:limit.min,max:limit.max,status:angle===null?'unmeasurable':angle<limit.min-1e-4||angle>limit.max+1e-4?'outside':'within'});
    }
    const unmatched=this.data.points.filter(p=>p.bendLimit&&!evaluated.has(p.id)).map(p=>({id:p.id,name:p.name}));
    return {poseId:pose.id,results,unmatched};
  }
  duration(move:StudioMove){const poses=move.poses.map(id=>this.data.poses.find(p=>p.id===id)!);return poses.slice(1).reduce((sum,p)=>sum+p.seconds,0)+(move.loop ? poses[0].seconds : 0);}
}
