import { Box3, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type {Object3D} from 'three';
/** Current visible geometry only, including skinning; no floor, handles or camera target. */
export function modelCenter(model:Object3D|null):Vector3 {
  if(!model)return new Vector3(0,1.2,0);
  model.updateWorldMatrix(true,true);
  const bounds=new Box3().setFromObject(model,true);
  return bounds.isEmpty()?model.getWorldPosition(new Vector3()):bounds.getCenter(new Vector3());
}
/** Rotate the view, never the avatar or its stored joint coordinates. */
export function rotateCamera(camera:PerspectiveCamera,target:Vector3,axis:Vector3,radians:number):Quaternion {
  const rotation=new Quaternion().setFromAxisAngle(axis.clone().normalize(),radians);
  camera.position.sub(target).applyQuaternion(rotation).add(target);
  camera.up.applyQuaternion(rotation).normalize();camera.quaternion.premultiply(rotation).normalize();camera.updateMatrixWorld(true);return rotation;
}

/** Virtual-sphere rotation in screen space, including roll near the edge. */
export function dragCamera(camera:PerspectiveCamera,target:Vector3,from:{x:number;y:number},to:{x:number;y:number},rect:{left:number;top:number;width:number;height:number},inverted:boolean):Quaternion|undefined {
  const radius=Math.max(1,Math.min(rect.width,rect.height)/2);
  const screen=target.clone().project(camera),cx=rect.left+(screen.x+1)*rect.width/2,cy=rect.top+(1-screen.y)*rect.height/2;
  const project=(p:{x:number;y:number})=>{const x=(p.x-cx)/radius,y=(cy-p.y)/radius;return new Vector3(x,y,Math.sqrt(Math.max(0,1-x*x-y*y))).normalize();};
  const a=project(from),b=project(to),axis=a.clone().cross(b);if(axis.lengthSq()<1e-12)return;
  axis.normalize().applyQuaternion(camera.quaternion);
  return rotateCamera(camera,target,axis,Math.acos(Math.max(-1,Math.min(1,a.dot(b))))*(inverted?1:-1));
}
