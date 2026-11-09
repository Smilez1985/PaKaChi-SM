import * as T from 'three';
import {StudioRig} from '../../src/studio-rig.ts';
/** A full 180° forearm twist with a deliberately collapsing 50/50 skin seam. */
export function twistFixture(normalized=false,closed=false){
 const root=new T.Group(),upper=new T.Bone(),forearm=new T.Bone();upper.name='Upper arm';forearm.name='Forearm';upper.add(forearm);root.add(upper);
 const positions:number[]=[],indices:number[]=[],skin:number[]=[],weights:number[]=[];const segments=16;
 for(let ring=0;ring<3;ring++)for(let k=0;k<segments;k++){
  const angle=2*Math.PI*k/segments;positions.push(.2*Math.cos(angle),ring-1,.2*Math.sin(angle));skin.push(0,1,0,0);weights.push(ring===0?1:ring===1?.5:0,ring===0?0:ring===1?.5:1,0,0);
 }
 for(let ring=0;ring<2;ring++)for(let k=0;k<segments;k++){const a=ring*segments+k,b=ring*segments+(k+1)%segments,c=a+segments,d=b+segments;indices.push(a,c,b,b,c,d);}
 if(closed)for(const ring of [0,2]){const center=positions.length/3;positions.push(0,ring-1,0);skin.push(0,1,0,0);weights.push(ring===0?1:0,ring===0?0:1,0,0);for(let k=0;k<segments;k++){const a=ring*segments+k,b=ring*segments+(k+1)%segments;indices.push(center,...(ring===0?[a,b]:[b,a]));}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();
 const mesh=new T.SkinnedMesh(geometry,new T.MeshStandardMaterial({color:0x40bb70,side:T.DoubleSide}));mesh.name='Arm skin';root.add(mesh);if(normalized){root.scale.setScalar(1.2);root.position.y=1.2;}root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([upper,forearm]));
 const rig=new StudioRig(root),joint=rig.data.points.find(p=>p.name==='Forearm')!,values=rig.capture();values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI).toArray();
 const pose={id:'twist',name:'Full twist',seconds:1,values};rig.data.poses=[pose,{id:'neutral',name:'Neutral',seconds:1,values:rig.capture()}];rig.data.moves=[{id:'twist-move',name:'Twist',loop:false,poses:['neutral','twist']}];return {root,rig,mesh,joint,pose};
}
