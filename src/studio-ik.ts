import * as T from 'three';

/** Rotate a joint towards a target without ever changing a bone's local translation. */
function aim(joint:T.Bone, endpoint:T.Bone, target:T.Vector3) {
  joint.updateWorldMatrix(true,true);
  const from=joint.worldToLocal(endpoint.getWorldPosition(new T.Vector3()));
  const to=joint.worldToLocal(target.clone());
  if(from.lengthSq()<1e-16||to.lengthSq()<1e-16)return;
  joint.quaternion.multiply(new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize())).normalize();
  joint.updateWorldMatrix(true,true);
}

/** One or two segments; anchor position is fixed. Targets outside reach never stretch bones. */
export function solveLimb(endpoint:T.Bone,joints:T.Bone[],target:T.Vector3) {
  if(!joints.length)return;
  if(joints.length===1){aim(joints[0],endpoint,target);return;}
  const elbow=joints[0],anchor=joints[1],space=anchor.parent!;
  space.updateWorldMatrix(true,true);
  const a=space.worldToLocal(anchor.getWorldPosition(new T.Vector3()));
  const b=space.worldToLocal(elbow.getWorldPosition(new T.Vector3()));
  const c=space.worldToLocal(endpoint.getWorldPosition(new T.Vector3()));
  const goal=space.worldToLocal(target.clone());
  const l1=a.distanceTo(b),l2=b.distanceTo(c);if(l1<1e-8||l2<1e-8)return;
  const axis=goal.clone().sub(a);if(axis.lengthSq()<1e-16)axis.copy(c).sub(a);if(axis.lengthSq()<1e-16)axis.set(0,1,0);axis.normalize();
  // Preserve the current elbow side. A stable perpendicular resolves a fully straight limb.
  const pole=b.clone().sub(a).addScaledVector(axis,-b.clone().sub(a).dot(axis));
  if(pole.lengthSq()<1e-12){pole.set(0,0,1);pole.addScaledVector(axis,-pole.dot(axis));if(pole.lengthSq()<1e-12)pole.set(1,0,0);}
  pole.normalize();
  const distance=T.MathUtils.clamp(a.distanceTo(goal),Math.abs(l1-l2)+1e-7,l1+l2-1e-7);
  const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const desiredElbow=a.clone().addScaledVector(axis,along).addScaledVector(pole,height);
  const desiredEnd=a.clone().addScaledVector(axis,distance);
  aim(anchor,elbow,space.localToWorld(desiredElbow));
  aim(elbow,endpoint,space.localToWorld(desiredEnd));
}
