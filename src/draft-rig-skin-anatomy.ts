import type { Cluster2DSemanticCatalog } from './cluster-2d-classifier.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { ClusterForm } from './cluster-architecture.ts';
import { createStudioFormManifest } from './studio-form-manifest.ts';
import { collectClusterMeshInventory, resolveClusterMeshBindings } from './cluster-inventory.ts';
import { attachClusterMeshIdentity, collectRiggedSkinWeightEvidenceFromRoot } from './cluster-skin-anatomy-identity.ts';
import { applyDraftRigBoneIdentitiesToManifest } from './draft-rig-bone-identity.ts';
import { proposeSkinWeightClusterAssignments } from './cluster-skin-anatomy.ts';
import type { SkinWeightClassificationReport } from './cluster-skin-anatomy.ts';
import type { DraftRigLifecycleHooks, DraftRigTemplate } from './draft-rig.ts';

export interface DraftRigSkinAnatomyPreparation {
  hooks: DraftRigLifecycleHooks;
  getReport: () => { sourceManifest: ClusterManifest; report: SkinWeightClassificationReport } | null;
}

/**
 * Connects the source mesh inventory to the actual draft-rig output.
 * Classification is returned as a proposal only; the source manifest is never mutated.
 */
export async function createDraftRigSkinAnatomyPreparation(
  sourceModelBase64: string,
  form: Exclude<ClusterForm,'imported'>,
  template: DraftRigTemplate,
  catalog: Cluster2DSemanticCatalog,
): Promise<DraftRigSkinAnatomyPreparation> {
  if ((form === 'animal') !== (template === 'quadruped')) throw new Error('Draft rig form/template mismatch.');
  const state: {sourceManifest:ClusterManifest|null; report:SkinWeightClassificationReport|null} = {sourceManifest:null,report:null};
  const hooks: DraftRigLifecycleHooks = {
    beforeBind: async root => {
      const manifest = await createStudioFormManifest(root,sourceModelBase64,form,new Date().toISOString(),catalog);
      const inventory = collectClusterMeshInventory(root,manifest.sourceAssetSha256);
      const bindings = resolveClusterMeshBindings(root,inventory);
      attachClusterMeshIdentity(root,manifest,bindings);
      state.sourceManifest = manifest;
    },
    afterBind: root => {
      if (!state.sourceManifest) throw new Error('Source cluster manifest was not bound before draft rigging.');
      const identity = applyDraftRigBoneIdentitiesToManifest(state.sourceManifest,root);
      const evidence = collectRiggedSkinWeightEvidenceFromRoot(root,identity.manifest,identity.rigBoneIdByName);
      state.report = proposeSkinWeightClusterAssignments(identity.manifest,identity.manifest.sourceAssetSha256,evidence);
    },
  };
  return {
    hooks,
    getReport: () => state.sourceManifest && state.report
      ? {sourceManifest:structuredClone(state.sourceManifest),report:structuredClone(state.report)}
      : null,
  };
}
