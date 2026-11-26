import type { StudioFormModelPair } from './studio-form-model-pair.ts';
import { validStudioFormModelPair } from './studio-form-model-pair.ts';
import { prepareDraftRig } from './draft-rig.ts';
import type { DraftRigReport } from './draft-rig.ts';
import { parseModel, disposeModel } from './viewer.ts';
import { StudioRig } from './studio-rig.ts';
import type { Cluster2DSemanticCatalog } from './cluster-2d-classifier.ts';
import { createPaKaChiSemanticCatalog } from './cluster-2d-classifier.ts';
import { createDraftRigSkinAnatomyPreparation } from './draft-rig-skin-anatomy.ts';

export interface DraftRigPairResult {
  formModels: StudioFormModelPair;
  reports: { animal: DraftRigReport; humanoid: DraftRigReport };
  skinAnatomy: { animal: NonNullable<ReturnType<Awaited<ReturnType<typeof createDraftRigSkinAnatomyPreparation>>['getReport']>>; humanoid: NonNullable<ReturnType<Awaited<ReturnType<typeof createDraftRigSkinAnatomyPreparation>>['getReport']>> };
}
const decode = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};
const encode = (bytes: Uint8Array): string => {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
};

/**
 * Builds two independent, review-required draft rigs. The input pair is never
 * mutated; neither form is returned unless both GLBs and both Studio states
 * have been prepared successfully.
 */
export async function prepareDraftRigPair(
  pair: StudioFormModelPair,
  signal: AbortSignal,
  semanticCatalog: Cluster2DSemanticCatalog = createPaKaChiSemanticCatalog(),
): Promise<DraftRigPairResult> {
  signal.throwIfAborted();
  const activeModel = pair[pair.activeForm].model;
  if (!validStudioFormModelPair(pair, pair.avatarId, activeModel)) {
    throw new Error('draft-rig-form-pair-invalid');
  }

  const animalSkin = await createDraftRigSkinAnatomyPreparation(pair.animal.model,'animal','quadruped',semanticCatalog);
  const animal = await prepareDraftRig(decode(pair.animal.model), 'quadruped', signal,'support',[],animalSkin.hooks);
  const animalSkinReport = animalSkin.getReport();
  if(!animalSkinReport)throw new Error('Animal skin anatomy proposal was not produced.');
  signal.throwIfAborted();
  const humanoidSkin = await createDraftRigSkinAnatomyPreparation(pair.humanoid.model,'humanoid','biped-relaxed',semanticCatalog);
  const humanoid = await prepareDraftRig(decode(pair.humanoid.model), 'biped-relaxed', signal,'support',[],humanoidSkin.hooks);
  const humanoidSkinReport = humanoidSkin.getReport();
  if(!humanoidSkinReport)throw new Error('Humanoid skin anatomy proposal was not produced.');
  signal.throwIfAborted();

  const animalModel = await parseModel(Uint8Array.from(animal.bytes).buffer as ArrayBuffer);
  let animalStudio: import('./studio-data.ts').StudioData;
  const animalRig = new StudioRig(animalModel.scene);
  try {
    animalStudio = structuredClone(animalRig.data);
  } finally {
    animalRig.dispose();
    disposeModel(animalModel.scene);
  }
  signal.throwIfAborted();

  const humanoidModel = await parseModel(Uint8Array.from(humanoid.bytes).buffer as ArrayBuffer);
  let humanoidStudio: import('./studio-data.ts').StudioData;
  const humanoidRig = new StudioRig(humanoidModel.scene);
  try {
    humanoidStudio = structuredClone(humanoidRig.data);
  } finally {
    humanoidRig.dispose();
    disposeModel(humanoidModel.scene);
  }
  signal.throwIfAborted();

  const next: StudioFormModelPair = {
    ...structuredClone(pair),
    animal: { ...structuredClone(pair.animal), model: encode(animal.bytes), studio: animalStudio },
    humanoid: { ...structuredClone(pair.humanoid), model: encode(humanoid.bytes), studio: humanoidStudio },
  };
  if (!validStudioFormModelPair(next, next.avatarId, next[next.activeForm].model)) {
    throw new Error('draft-rig-form-pair-output-invalid');
  }
  return { formModels: next, reports: { animal: animal.report, humanoid: humanoid.report }, skinAnatomy:{animal:animalSkinReport,humanoid:humanoidSkinReport} };
}
