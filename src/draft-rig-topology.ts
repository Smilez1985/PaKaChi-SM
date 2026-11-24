import type { DraftRigTemplate } from './draft-rig.ts';

export interface DraftRigJointTopology {
  name: string;
  parent: number;
}

const chains: Record<DraftRigTemplate, readonly (readonly string[])[]> = {
  biped: [
    ['Hips', 'Spine', 'Chest', 'Neck', 'Head'],
    ['Chest', 'LeftShoulder', 'LeftElbow', 'LeftWrist', 'LeftHand'],
    ['Chest', 'RightShoulder', 'RightElbow', 'RightWrist', 'RightHand'],
    ['Hips', 'LeftHip', 'LeftKnee', 'LeftAnkle', 'LeftFoot'],
    ['Hips', 'RightHip', 'RightKnee', 'RightAnkle', 'RightFoot'],
  ],
  'biped-relaxed': [
    ['Hips', 'Spine', 'Chest', 'Neck', 'Head'],
    ['Chest', 'LeftShoulder', 'LeftElbow', 'LeftWrist', 'LeftHand'],
    ['Chest', 'RightShoulder', 'RightElbow', 'RightWrist', 'RightHand'],
    ['Hips', 'LeftHip', 'LeftKnee', 'LeftAnkle', 'LeftFoot'],
    ['Hips', 'RightHip', 'RightKnee', 'RightAnkle', 'RightFoot'],
  ],
  quadruped: [
    ['Hips', 'Spine', 'Chest', 'Neck', 'Head'],
    ['Hips', 'TailBase', 'TailTip'],
    ['Chest', 'LeftShoulder', 'LeftElbow', 'LeftWrist', 'LeftHand'],
    ['Chest', 'RightShoulder', 'RightElbow', 'RightWrist', 'RightHand'],
    ['Hips', 'LeftHip', 'LeftKnee', 'LeftAnkle', 'LeftFoot'],
    ['Hips', 'RightHip', 'RightKnee', 'RightAnkle', 'RightFoot'],
  ],
};

/**
 * Validates the canonical draft skeleton graph before any scene mutation.
 * This is a topology safety check, not semantic recognition of the input mesh.
 */
export function validateDraftRigTopology(
  joints: readonly DraftRigJointTopology[],
  template: DraftRigTemplate,
): void {
  if (!Array.isArray(joints) || joints.length < 5 || joints.length > 64) {
    throw new Error('draft-rig-topology-count');
  }
  const indices = new Map<string, number>();
  for (let index = 0; index < joints.length; index++) {
    const joint = joints[index];
    if (!joint || typeof joint.name !== 'string' || !joint.name ||
        !Number.isInteger(joint.parent) || joint.parent < -1 ||
        joint.parent >= index || indices.has(joint.name)) {
      throw new Error('draft-rig-topology-node');
    }
    indices.set(joint.name, index);
  }
  if (joints[0]?.name !== 'Hips' || joints[0]?.parent !== -1) {
    throw new Error('draft-rig-topology-root');
  }
  for (const chain of chains[template]) {
    for (let offset = 1; offset < chain.length; offset++) {
      const parent = indices.get(chain[offset - 1]);
      const child = indices.get(chain[offset]);
      if (parent === undefined || child === undefined || joints[child].parent !== parent) {
        throw new Error('draft-rig-topology-chain:' + chain.slice(0, offset + 1).join('>'));
      }
    }
  }
  const expected = template === 'quadruped' ? 23 : 21;
  if (joints.length !== expected) throw new Error('draft-rig-topology-count');
}
