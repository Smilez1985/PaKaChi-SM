import type { DraftRigTemplate, DraftRigAnchorOverride } from './draft-rig.ts';
import { prepareDraftRig } from './draft-rig.ts';
import type { ConfirmedDraftRigLandmarkPlan } from './draft-rig-landmark-review.ts';

export interface DraftRigLandmarkTarget {
  avatarId: string;
  formId: string;
  form: 'animal' | 'humanoid';
  sourceAssetSha256: string;
  template: DraftRigTemplate;
}

/** Hash the exact GLB bytes; a matching avatar/form label alone is never sufficient. */
export async function sha256DraftRigSource(bytes: Uint8Array): Promise<string> {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0 || bytes.length > 50 * 1024 * 1024 ||
      !globalThis.crypto?.subtle) throw new Error('draft-rig-landmark-crypto');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.slice().buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

/**
 * Apply only a user-confirmed plan to the exact source GLB it was reviewed
 * against. Anchor coordinates are avatar-root-local and are consumed before
 * skin weights and inverse bind matrices are calculated. The input bytes are
 * never modified; any validation or rigging failure returns no partial output.
 */
export async function prepareDraftRigWithConfirmedLandmarks(
  bytes: Uint8Array,
  plan: ConfirmedDraftRigLandmarkPlan,
  target: DraftRigLandmarkTarget,
  signal: AbortSignal,
  frameMode: 'support' | 'bounds' = 'support',
): Promise<Awaited<ReturnType<typeof prepareDraftRig>>> {
  signal.throwIfAborted();
  if (!plan || plan.format !== 'pakachi-confirmed-draft-rig-landmark-plan' ||
      plan.version !== 1 || plan.status !== 'user-confirmed' ||
      !target || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(target.avatarId) ||
      !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(target.formId) ||
      !['animal', 'humanoid'].includes(target.form) ||
      !/^[a-f0-9]{64}$/.test(target.sourceAssetSha256) ||
      !/^[a-f0-9]{64}$/.test(plan.sourceImageSha256) ||
      plan.avatarId !== target.avatarId || plan.formId !== target.formId ||
      plan.sourceAssetSha256 !== target.sourceAssetSha256 ||
      plan.template !== target.template ||
      ((target.form === 'animal') !== (target.template === 'quadruped'))) {
    throw new Error('draft-rig-landmark-target-mismatch');
  }
  if (!Array.isArray(plan.anchors) || plan.anchors.length === 0 || plan.anchors.length > 64) {
    throw new Error('draft-rig-landmark-plan-empty');
  }
  const names = new Set<string>();
  const anchors: DraftRigAnchorOverride[] = plan.anchors.map(anchor => {
    if (!anchor || typeof anchor.jointName !== 'string' ||
        !/^[A-Z][A-Za-z0-9]{0,63}$/.test(anchor.jointName) ||
        names.has(anchor.jointName) || !Array.isArray(anchor.position) ||
        anchor.position.length !== 3 ||
        !anchor.position.every(value => Number.isFinite(value) && Math.abs(value) <= 1e6)) {
      throw new Error('draft-rig-landmark-plan-anchor');
    }
    names.add(anchor.jointName);
    return { jointName: anchor.jointName, position: [...anchor.position] as [number, number, number] };
  });
  const actualHash = await sha256DraftRigSource(bytes);
  signal.throwIfAborted();
  if (actualHash !== plan.sourceAssetSha256) throw new Error('draft-rig-landmark-source-hash-mismatch');
  return prepareDraftRig(bytes, plan.template, signal, frameMode, anchors);
}
