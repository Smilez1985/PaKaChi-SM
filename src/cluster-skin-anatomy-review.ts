import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { SkinWeightClassificationReport } from './cluster-skin-anatomy.ts';

export interface SkinWeightTriangleCorrection {
  meshId: string;
  triangleIndex: number;
  partId: string;
  surfaceLayerId?: string | null;
  reason: string;
}

/** Applies one explicit user correction to a proposal without touching geometry or skin weights. */
export function correctSkinWeightProposal(
  report: SkinWeightClassificationReport,
  correction: SkinWeightTriangleCorrection,
): SkinWeightClassificationReport {
  const manifest = structuredClone(report.manifest);
  if (validateClusterManifest(manifest).length) throw new Error('Invalid skin-weight proposal manifest.');
  if (!correction || typeof correction.meshId !== 'string' ||
      !Number.isSafeInteger(correction.triangleIndex) || correction.triangleIndex < 0 ||
      typeof correction.partId !== 'string' || !manifest.parts.some(part => part.id === correction.partId) ||
      typeof correction.reason !== 'string' || !correction.reason.trim() || correction.reason.length > 500) {
    throw new Error('Invalid explicit skin-weight triangle correction.');
  }
  const layerId = correction.surfaceLayerId ?? null;
  const layer = layerId === null ? null : manifest.layers.find(item => item.id === layerId);
  if (layerId !== null && (!layer || (layer.partId !== null && layer.partId !== correction.partId))) {
    throw new Error('Surface layer is unknown or belongs to a different anatomical part.');
  }
  const assignment = manifest.assignments.find(item =>
    item.meshId === correction.meshId && item.triangleIndex === correction.triangleIndex);
  if (!assignment) throw new Error('Triangle is not part of the current source inventory.');
  assignment.partId = correction.partId;
  assignment.surfaceLayerId = layerId;
  assignment.origin = 'user';
  assignment.policy = 'locked';
  assignment.confidence = 1;
  assignment.reason = correction.reason.trim();
  manifest.revision++;
  const issues = validateClusterManifest(manifest);
  if (issues.length) throw new Error('Corrected skin-weight proposal is invalid: ' + issues.map(issue => issue.code).join(', '));
  return { ...structuredClone(report), manifest,
    classified: manifest.assignments.filter(item => item.partId !== null).length,
    ambiguous: manifest.assignments.filter(item => item.partId === null && /multiple|decisive|ambiguous/i.test(item.reason)).length,
    unmapped: manifest.assignments.filter(item => item.partId === null && !/multiple|decisive|ambiguous/i.test(item.reason)).length,
  };
}

/** Explicitly accepts all current automatic part proposals as locked user-reviewed assignments. */
export function confirmSkinWeightProposal(report: SkinWeightClassificationReport): ClusterManifest {
  const manifest = structuredClone(report.manifest);
  if (validateClusterManifest(manifest).length) throw new Error('Invalid skin-weight proposal manifest.');
  let accepted = 0;
  for (const assignment of manifest.assignments) {
    if (assignment.partId === null) continue;
    if (assignment.origin === 'automatic') {
      assignment.origin = 'user';
      assignment.policy = 'locked';
      assignment.reason = 'Explicitly confirmed in Avatar Studio. ' + assignment.reason;
      accepted++;
    }
  }
  if (!accepted && !manifest.assignments.some(item => item.origin === 'user' && item.policy === 'locked')) {
    throw new Error('No classified skin-weight assignments are available to confirm.');
  }
  manifest.algorithmId = 'skin-weight-anatomy-reviewed';
  manifest.revision++;
  const issues = validateClusterManifest(manifest);
  if (issues.length) throw new Error('Confirmed skin-weight manifest is invalid: ' + issues.map(issue => issue.code).join(', '));
  return manifest;
}
