import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
/** Rotate the view, never the avatar or its stored joint coordinates. */
export function rotateCamera(camera:PerspectiveCamera,target:Vector3,axis:Vector3,radians:number):void {
  const rotation=new Quaternion().setFromAxisAngle(axis.clone().normalize(),radians);
  camera.position.sub(target).applyQuaternion(rotation).add(target);
  camera.up.applyQuaternion(rotation).normalize();camera.lookAt(target);camera.updateMatrixWorld(true);
}

/** Virtual-sphere rotation in screen space, including roll near the edge. */
export function dragCamera(camera:PerspectiveCamera,target:Vector3,from:{x:number;y:number},to:{x:number;y:number},rect:{left:number;top:number;width:number;height:number},inverted:boolean):void {
  const radius=Math.max(1,Math.min(rect.width,rect.height)/2);
  const project=(p:{x:number;y:number})=>{const x=(p.x-rect.left-rect.width/2)/radius,y=(rect.top+rect.height/2-p.y)/radius;return new Vector3(x,y,Math.sqrt(Math.max(0,1-x*x-y*y))).normalize();};
  const a=project(from),b=project(to),axis=a.clone().cross(b);if(axis.lengthSq()<1e-12)return;
  axis.normalize().applyQuaternion(camera.quaternion);
  rotateCamera(camera,target,axis,Math.acos(Math.max(-1,Math.min(1,a.dot(b))))*(inverted?1:-1));
}
