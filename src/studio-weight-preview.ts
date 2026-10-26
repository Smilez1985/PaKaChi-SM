import * as T from 'three';
import {validWeightRegion} from './studio-data.ts';
import type {WeightRegion} from './studio-data.ts';

/** World-space guide only: never part of model geometry, picking or saved projects. */
export class StudioWeightPreview {
 readonly group=new T.Group();
 private readonly circle=new T.BufferGeometry().setFromPoints(Array.from({length:96},(_,i)=>new T.Vector3(Math.cos(i*Math.PI/48),Math.sin(i*Math.PI/48),0)));
 private readonly sphere=new T.SphereGeometry(1,32,16);
 private readonly boundary=new T.LineBasicMaterial({color:0x17a878,transparent:true,opacity:.85,depthTest:false,depthWrite:false});
 private readonly half=new T.LineDashedMaterial({color:0xffa82e,transparent:true,opacity:.75,depthTest:false,depthWrite:false,dashSize:.12,gapSize:.08});
 private readonly fill=new T.MeshBasicMaterial({color:0x17a878,transparent:true,opacity:.045,depthTest:false,depthWrite:false,side:T.DoubleSide});
 private disposed=false;
 constructor(){
  this.group.name='studio-weight-region';this.group.visible=false;
  const shell=new T.Mesh(this.sphere,this.fill);shell.renderOrder=16;this.group.add(shell);
  for(const inner of [false,true])for(let axis=0;axis<3;axis++){
   const ring=new T.LineLoop(this.circle,inner?this.half:this.boundary);if(axis===1)ring.rotation.x=Math.PI/2;if(axis===2)ring.rotation.y=Math.PI/2;
   ring.scale.setScalar(inner ? .5 : 1);ring.renderOrder=17;ring.computeLineDistances();this.group.add(ring);
  }
 }
 setRegion(region:WeightRegion|null){
  this.group.visible=!this.disposed&&region!==null&&validWeightRegion(region);
  if(this.group.visible&&region){this.group.position.fromArray(region.center);this.group.scale.setScalar(region.radius);}
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.group.visible=false;this.group.removeFromParent();this.circle.dispose();this.sphere.dispose();this.boundary.dispose();this.half.dispose();this.fill.dispose();}
}
