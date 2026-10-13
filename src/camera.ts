import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
/** Rotate the view, never the avatar or its stored joint coordinates. */
export function rotateCamera(camera:PerspectiveCamera,target:Vector3,axis:Vector3,radians:number):void {
  const rotation=new Quaternion().setFromAxisAngle(axis.clone().normalize(),radians);
  camera.position.sub(target).applyQuaternion(rotation).add(target);
  camera.up.applyQuaternion(rotation).normalize();camera.lookAt(target);camera.updateMatrixWorld(true);
}
