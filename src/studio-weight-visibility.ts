import * as T from 'three';
export interface WeightView {eye:[number,number,number];projection:number[];materials?:true}
interface Triangle {a:T.Vector3;b:T.Vector3;c:T.Vector3;box:T.Box3;center:T.Vector3;materialVisible:boolean}
interface Branch {box:T.Box3;left?:Branch;right?:Branch;triangles?:Triangle[]}
/** Immutable rest-surface occlusion tree. Faces are double-sided; optional material policy skips hidden and fully transparent groups. */
export class StudioWeightVisibility {
 private tree:Branch|null=null;
 private prepare:(()=>Branch|null)|null;
 private ray=new T.Ray();private hit=new T.Vector3();private clip=new T.Vector3();
 constructor(meshes:T.Mesh[]){
  const snapshots=meshes.filter(mesh=>{for(let n:T.Object3D|null=mesh;n;n=n.parent)if(!n.visible)return false;return true;}).map(mesh=>{const geometry=new T.BufferGeometry();geometry.setAttribute('position',mesh.geometry.getAttribute('position').clone());if(mesh.geometry.index)geometry.setIndex(mesh.geometry.index.clone());geometry.setDrawRange(mesh.geometry.drawRange.start,mesh.geometry.drawRange.count);const visible=(m:T.Material|undefined)=>!!m&&m.visible&&!(m.transparent&&m.opacity<=0);const materials=mesh.material;const ranges=Array.isArray(materials)?mesh.geometry.groups.filter(g=>visible(materials[g.materialIndex??0])).map(g=>({start:g.start,end:g.start+g.count})):(visible(materials)?[{start:0,end:Infinity}]:[]);return {geometry,matrixWorld:mesh.matrixWorld.clone(),ranges};});
  this.prepare=()=>{const triangles:Triangle[]=[];
  for(const mesh of snapshots){
   const g=mesh.geometry,p=g.getAttribute('position'),index=g.index;if(!p)continue;
   const end=Math.min(index?.count??p.count,g.drawRange.start+g.drawRange.count);
   for(let i=g.drawRange.start;i+2<end;i+=3){const vertices=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld));const [a,b,c]=vertices,box=new T.Box3().setFromPoints(vertices);triangles.push({a,b,c,box,center:box.getCenter(new T.Vector3()),materialVisible:mesh.ranges.some(r=>i>=r.start&&i+2<r.end)});}
  }
  const build=(items:Triangle[]):Branch=>{const box=new T.Box3();for(const t of items)box.union(t.box);if(items.length<=12)return {box,triangles:items};const size=box.getSize(new T.Vector3()),axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z';items.sort((a,b)=>a.center[axis]-b.center[axis]);const middle=Math.floor(items.length/2);return {box,left:build(items.slice(0,middle)),right:build(items.slice(middle))};};
  const result=triangles.length?build(triangles):null;for(const s of snapshots)s.geometry.dispose();return result;};
 }
 visible(point:T.Vector3,view:WeightView,matrix:T.Matrix4){
  if(this.prepare){this.tree=this.prepare();this.prepare=null;}
  this.clip.copy(point).applyMatrix4(matrix);if(!Number.isFinite(this.clip.x)||!Number.isFinite(this.clip.y)||!Number.isFinite(this.clip.z)||Math.abs(this.clip.x)>1||Math.abs(this.clip.y)>1||Math.abs(this.clip.z)>1)return false;
  this.ray.origin.fromArray(view.eye);this.ray.direction.copy(point).sub(this.ray.origin);const distance=this.ray.direction.length();if(distance<1e-8)return false;this.ray.direction.divideScalar(distance);const limit=distance-Math.max(1e-6,distance*1e-6);
  const blocked=(node:Branch):boolean=>{if(!this.ray.intersectBox(node.box,this.hit))return false;if(!node.box.containsPoint(this.ray.origin)&&this.hit.distanceTo(this.ray.origin)>limit)return false;
   if(node.triangles){for(const t of node.triangles){if(view.materials&&!t.materialVisible)continue;const hit=this.ray.intersectTriangle(t.a,t.b,t.c,false,this.hit);if(hit&&hit.distanceTo(this.ray.origin)<limit)return true;}return false;}
   return blocked(node.left!)||blocked(node.right!);
  };return !this.tree||!blocked(this.tree);
 }
}
