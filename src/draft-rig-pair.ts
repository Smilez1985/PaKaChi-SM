import type { StudioFormModelPair } from './studio-form-model-pair.ts';
import { validStudioFormModelPair } from './studio-form-model-pair.ts';
import { prepareDraftRig } from './draft-rig.ts';
import type { DraftRigReport } from './draft-rig.ts';
import { parseModel, disposeModel } from './viewer.ts';
import { StudioRig } from './studio-rig.ts';

export interface DraftRigPairResult {
  formModels: StudioFormModelPair;
  reports: { animal: DraftRigReport; humanoid: DraftRigReport };
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
): Promise<DraftRigPairResult> {
  signal.throwIfAborted();
  const activeModel = pair[pair.activeForm].model;
  if (!validStudioFormModelPair(pair, pair.avatarId, activeModel)) {
    throw new Error('draft-rig-form-pair-invalid');
  }

  const animal = await prepareDraftRig(decode(pair.animal.model), 'quadruped', signal);
  signal.throwIfAborted();
  const humanoid = await prepareDraftRig(decode(pair.humanoid.model), 'biped-relaxed', signal);
  signal.throwIfAborted();

  const animalModel = await parseModel(animal.bytes.buffer.slice(
    animal.bytes.byteOffset, animal.bytes.byteOffset + animal.bytes.byteLength,
  ));
  let animalStudio;
  try {
    animalStudio = structuredClone(new StudioRig(animalModel.scene).data);
  } finally {
    disposeModel(animalModel.scene);
  }
  signal.throwIfAborted();

  const humanoidModel = await parseModel(humanoid.bytes.buffer.slice(
    humanoid.bytes.byteOffset, humanoid.bytes.byteOffset + humanoid.bytes.byteLength,
  ));
  let humanoidStudio;
  try {
    humanoidStudio = structuredClone(new StudioRig(humanoidModel.scene).data);
  } finally {
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
  return { formModels: next, reports: { animal: animal.report, humanoid: humanoid.report } };
}
