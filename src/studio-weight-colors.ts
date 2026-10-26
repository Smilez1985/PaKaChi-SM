import * as T from 'three';
/** Temporary diagnostic materials. Source colors and materials are restored by identity. */
export class StudioWeightColors {
 private entries:{mesh:T.SkinnedMesh;geometry:T.BufferGeometry;material:T.Material|T.Material[];color:T.BufferAttribute|T.InterleavedBufferAttribute|undefined;overlay:T.MeshBasicMaterial|T.MeshBasicMaterial[]}[]=[];
 private disposed=false;
 show(meshes:T.Mesh[],bone:T.Bone|null){
  if(this.disposed)return;
  if(!bone){this.clear();return;}
  for(const mesh of meshes){
   if(!(mesh instanceof T.SkinnedMesh))continue;
   let entry=this.entries.find(e=>e.mesh===mesh);
   if(!entry){
    const make=(m:T.Material)=>new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:m.side,visible:m.visible});
    const material=mesh.material,overlay=Array.isArray(material)?material.map(make):make(material);
    entry={mesh,geometry:mesh.geometry,material,color:mesh.geometry.getAttribute('color'),overlay};this.entries.push(entry);mesh.material=overlay;
    mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(mesh.geometry.getAttribute('position').count*3),3));
   }
   const color=mesh.geometry.getAttribute('color'),indices=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight'),index=mesh.skeleton.bones.indexOf(bone),shade=new T.Color();
   for(let v=0;v<color.count;v++){
    let weight=0;if(index>=0)for(let k=0;k<4;k++)if(indices.getComponent(v,k)===index)weight+=weights.getComponent(v,k);
    // Blue (0), green (0.5), red (1); vertex colors interpolate over triangles.
    shade.setHSL((1-T.MathUtils.clamp(weight,0,1))*2/3,1,.5);color.setXYZ(v,shade.r,shade.g,shade.b);
   }
   color.needsUpdate=true;
  }
 }
 clear(){for(const e of this.entries){e.mesh.material=e.material;if(e.color)e.geometry.setAttribute('color',e.color);else e.geometry.deleteAttribute('color');for(const m of Array.isArray(e.overlay)?e.overlay:[e.overlay])m.dispose();}this.entries=[];}
 dispose(){if(this.disposed)return;this.clear();this.disposed=true;}
}
