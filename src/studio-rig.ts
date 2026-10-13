import * as T from 'three';
import { emptyStudio, FIGURE_TRACK, neutralFigure } from './studio-data.ts';
import type { ControlPoint, StudioData, Transform, Vec3, Pose, StudioMove } from './studio-data.ts';
const read = (o:T.Object3D):Transform => ({position:o.position.toArray(),rotation:o.quaternion.toArray()});
const write = (o:T.Object3D,v:Transform) => {o.position.fromArray(v.position);o.quaternion.fromArray(v.rotation);};
interface Surface { mesh:T.Mesh; base:Float32Array; world:T.Vector3[]; inverse:T.Matrix3; worldInverse:T.Matrix4 }

/** World-space control points on a normalized model; deformation is applied before skinning. */
export class StudioRig {
  readonly root:T.Object3D;
  readonly bones:T.Bone[]=[];
  readonly surfaces:Surface[]=[];
  readonly figure:ControlPoint={id:FIGURE_TRACK,name:'Gesamte Figur',kind:'surface',rest:[0,0,0],size:.055,radius:.12};
  private figureOffset=new T.Vector3();
  private figureRotation=new T.Quaternion();
  private figureMatrix=new T.Matrix4();
  private rootMatrix:T.Matrix4;
  private rootWorld:T.Matrix4;
  private rootAutoUpdate:boolean;
  data:StudioData;
  readonly initial:StudioData;
  private originalNodes:{node:T.Object3D;value:Transform;scale:T.Vector3}[]=[];
  private originalBoneRest:Transform[];
  private bindings:{mesh:T.SkinnedMesh;inverses:T.Matrix4[];bind:T.Matrix4}[]=[];
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
      this.surfaces.push({mesh:node,base,world,worldInverse:node.matrixWorld.clone().invert(),inverse:new T.Matrix3().setFromMatrix4(node.matrixWorld.clone().invert())});
    }});
    sourceGeometries.forEach(g=>g.dispose());
    this.initial={...emptyStudio(),boneRest:this.bones.map(read),points:this.bones.map((bone,i)=>({id:`bone-${i}`,kind:'bone',bone:i,name:(bone.name || `Gelenk ${i+1}`).slice(0,100),rest:bone.getWorldPosition(new T.Vector3()).toArray(),size:.025,radius:.18}))};
    this.data=saved ? structuredClone(saved) : structuredClone(this.initial);
    if(saved) {
      if(saved.boneRest.length!==this.bones.length || saved.points.some(p=>p.mesh!==undefined && p.mesh>=this.surfaces.length))throw new Error('Studio-Daten passen nicht zum enthaltenen Modell.');
    }
    this.reset();
  }
  reset() {
    this.figureOffset.set(0,0,0);this.figureRotation.identity();this.figureMatrix.identity();this.root.matrixAutoUpdate=this.rootAutoUpdate;this.root.matrix.copy(this.rootMatrix);
    for(const item of this.originalNodes){write(item.node,item.value);item.node.scale.copy(item.scale);}
    this.bones.forEach((b,i)=>write(b,this.data.boneRest[i]));
    this.root.updateWorldMatrix(true,true);
    this.rebind();
    this.surfaceValues=Object.fromEntries(this.data.points.filter(p=>p.kind==='surface').map(p=>[p.id,{position:[...p.rest] as Vec3,rotation:[0,0,0,1]}]));
    this.deform();
  }
  restoreSource() {
    this.figureOffset.set(0,0,0);this.figureRotation.identity();this.figureMatrix.identity();this.root.matrixAutoUpdate=this.rootAutoUpdate;this.root.matrix.copy(this.rootMatrix);
    this.bones.forEach((b,i)=>write(b,this.originalBoneRest[i]));
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
  capture():Record<string,Transform> {return {[FIGURE_TRACK]:{position:this.figureOffset.toArray(),rotation:this.figureRotation.toArray()},...Object.fromEntries(this.data.points.map(p=>[p.id,p.kind==='bone' ? read(this.bones[p.bone!]) : structuredClone(this.surfaceValues[p.id] ?? {position:p.rest,rotation:[0,0,0,1]})]))};}
  apply(values:Record<string,Transform>) {
    const figure=values[FIGURE_TRACK]??neutralFigure();this.setFigureTransform(new T.Vector3().fromArray(figure.position),new T.Quaternion().fromArray(figure.rotation));
    for(const p of this.data.points){const v=values[p.id];if(!v)continue;if(p.kind==='bone')write(this.bones[p.bone!],v);else this.surfaceValues[p.id]=structuredClone(v);}
    this.root.updateWorldMatrix(true,true);this.deform();
  }
  setFigureOffset(offset:T.Vector3){this.setFigureTransform(offset,this.figureRotation);}
  setFigureTransform(offset:T.Vector3,rotation:T.Quaternion){
    this.figureOffset.copy(offset);this.figureRotation.copy(rotation).normalize();
    const center=new T.Vector3().fromArray(this.figure.rest);
    this.figureMatrix.makeTranslation(center.clone().add(offset)).multiply(new T.Matrix4().makeRotationFromQuaternion(this.figureRotation)).multiply(new T.Matrix4().makeTranslation(center.negate()));
    const local=this.figureMatrix.clone().multiply(this.rootWorld);
    if(this.root.parent){this.root.parent.updateWorldMatrix(true,false);local.premultiply(this.root.parent.matrixWorld.clone().invert());}
    // Keep the exact matrix, including shear from nonuniformly scaled parents.
    // Decomposed fields remain useful for inspection but never replace this matrix.
    this.root.matrixAutoUpdate=false;this.root.matrix.copy(local);local.decompose(this.root.position,this.root.quaternion,this.root.scale);
    this.root.matrixWorldNeedsUpdate=true;this.root.updateWorldMatrix(true,true);
    // SkinnedMesh updates its inverse bind matrix in updateMatrixWorld, not updateWorldMatrix.
    this.root.updateMatrixWorld(true);
  }
  setPoint(p:ControlPoint, position:T.Vector3, rotation:T.Quaternion, edit:boolean) {
    if(p.id===FIGURE_TRACK){if(!edit)this.setFigureTransform(position.clone().sub(new T.Vector3().fromArray(this.figure.rest)),rotation);return;}
    if(p.kind==='bone') {
      const bone=this.bones[p.bone!];
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
  private deform() {
    const active=this.data.points.filter(p=>p.kind==='surface').map(p=>({p,delta:new T.Vector3().fromArray(this.surfaceValues[p.id]?.position ?? p.rest).sub(new T.Vector3().fromArray(p.rest))})).filter(x=>x.delta.lengthSq()>1e-12);
    for(let m=0;m<this.surfaces.length;m++){
      const s=this.surfaces[m], attr=s.mesh.geometry.getAttribute('position') as T.BufferAttribute;
      attr.copyArray(s.base);
      for(const {p,delta} of active){if(p.mesh!==undefined && p.mesh!==m)continue;const offset=delta.clone().applyMatrix3(s.inverse),center=new T.Vector3().fromArray(p.rest);
        for(let i=0;i<s.world.length;i++){const t=1-s.world[i].distanceTo(center)/p.radius;if(t<=0)continue;const w=t*t*(3-2*t);attr.setXYZ(i,attr.getX(i)+offset.x*w,attr.getY(i)+offset.y*w,attr.getZ(i)+offset.z*w);}
      }
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
    result[FIGURE_TRACK]={position:new T.Vector3().fromArray(x.position).lerp(new T.Vector3().fromArray(y.position),ratio).toArray(),rotation:new T.Quaternion().fromArray(x.rotation).slerp(new T.Quaternion().fromArray(y.rotation),ratio).toArray()};
    return result;
  }
  duration(move:StudioMove){const poses=move.poses.map(id=>this.data.poses.find(p=>p.id===id)!);return poses.slice(1).reduce((sum,p)=>sum+p.seconds,0)+(move.loop ? poses[0].seconds : 0);}
}
