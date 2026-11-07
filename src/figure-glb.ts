import * as T from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
/** Independent static geometry. Skin/morph deformation is baked; no editor rig or clips. */
export function captureStaticFigure(meshes:readonly T.Mesh[]):T.Group{
 const result=new T.Group();result.name='PaKaChi figure snapshot';
 try{
  for(const mesh of meshes){
   let visible=true;for(let node:T.Object3D|null=mesh;node;node=node.parent)visible&&=node.visible;if(!visible)continue;
   const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(materials.every(m=>!m.visible))continue;
   if(materials.some(m=>!m.visible)||mesh instanceof T.InstancedMesh)throw Error('GLB-Standbild unterstützt keine Instanzen oder teilweise ausgeblendeten Materialgruppen.');
   mesh.updateWorldMatrix(true,false);const geometry=mesh.geometry.clone();
   // Register immediately so every failure disposes only our copies.
   const copy=new T.Mesh(geometry,Array.isArray(mesh.material)?materials.map(m=>m.clone()):mesh.material.clone());copy.name=mesh.name;result.add(copy);
   const position=geometry.getAttribute('position');if(!position||position.itemSize!==3)throw Error('Modell enthält keine gültigen Oberflächenpositionen.');
   const positions=new Float32Array(position.count*3),point=new T.Vector3();
   for(let i=0;i<position.count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);if(!point.toArray().every(Number.isFinite))throw Error('Modell enthält ungültige Oberflächenpositionen.');point.toArray(positions,i*3);}
   geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.morphAttributes={};geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.deleteAttribute('tangent');
   // Reflections reverse winding; reverse it back to retain visible front faces.
   if(mesh.matrixWorld.determinant()<0){const indices=geometry.index?Array.from(geometry.index.array):Array.from({length:position.count},(_,i)=>i);for(let i=0;i+2<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];geometry.setIndex(indices);}
   geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  }
  if(!result.children.length)throw Error('Keine sichtbare Figur für den GLB-Export.');
  return result;
 }catch(error){disposeStaticFigure(result);throw error;}
}
/** Copies geometry/materials only after skeleton remapping; texture images stay read-only. */
export function captureRiggedFigure(root:T.Object3D):T.Group{
 root.updateWorldMatrix(true,true);const nodes=new Set<T.Object3D>();root.traverse(node=>nodes.add(node));let skins=0;
 root.traverse(node=>{if(!(node instanceof T.SkinnedMesh))return;let visible=true;for(let n:T.Object3D|null=node;n;n=n.parent)visible&&=n.visible;if(visible)skins++;
  if(node.skeleton.bones.some(b=>!nodes.has(b)))throw Error('Rig verweist auf Knochen außerhalb der Figur.');
  for(const bone of node.skeleton.bones)for(let n:T.Object3D|null=bone;n&&nodes.has(n);n=n.parent)if(!n.visible)throw Error('Ausgeblendete Knochenhierarchie kann nicht als Rig exportiert werden.');
 });
 if(!skins)throw Error('Die Figur enthält kein exportierbares Hautskelett.');
 const result=new T.Group();result.name='PaKaChi rigged figure';const copy=cloneSkeleton(root);
 // Detach from viewer normalization without changing any world transforms.
 copy.matrix.copy(root.matrixWorld);copy.matrixAutoUpdate=false;copy.matrix.decompose(copy.position,copy.quaternion,copy.scale);
 result.add(copy);
 // A failed copy must never dispose geometry/materials still owned by the source.
 const owned:{geometry:T.BufferGeometry;materials:T.Material[]}[]=[];
 try{
  copy.traverse(node=>{if(!(node instanceof T.Mesh))return;
   const materials=Array.isArray(node.material)?node.material:[node.material];
   if(node instanceof T.InstancedMesh||materials.some(m=>!m.visible))throw Error('Rig-Export unterstützt keine Instanzen oder ausgeblendeten Materialgruppen.');
   const geometry=node.geometry.clone(),clones=materials.map(m=>m.clone());owned.push({geometry,materials:clones});node.geometry=geometry;node.material=Array.isArray(node.material)?clones:clones[0];
   if(node instanceof T.SkinnedMesh)node.skeleton.boneInverses=node.skeleton.boneInverses.map(m=>m.clone());
  });
  result.updateMatrixWorld(true);return result;
 }catch(error){for(const item of owned){item.geometry.dispose();item.materials.forEach(m=>m.dispose());}copy.traverse(node=>{if(node instanceof T.SkinnedMesh)node.skeleton.dispose();});throw error;}
}
export function disposeStaticFigure(root:T.Group){root.traverse(node=>{if(node instanceof T.Mesh){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();if(node instanceof T.SkinnedMesh)node.skeleton.dispose();}});}
async function writeFigureGLB(scene:T.Group):Promise<ArrayBuffer>{
 try{const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const exporter=new GLTFExporter(),bytes=await exporter.parseAsync(scene,{binary:true,onlyVisible:true});if(!(bytes instanceof ArrayBuffer))throw Error('GLB-Export fehlgeschlagen.');return bytes;}
 finally{disposeStaticFigure(scene);}
}
export function exportRiggedFigureGLB(root:T.Object3D):Promise<ArrayBuffer>{return writeFigureGLB(captureRiggedFigure(root));}
export async function exportFigureGLB(meshes:readonly T.Mesh[]):Promise<ArrayBuffer>{return writeFigureGLB(captureStaticFigure(meshes));}
