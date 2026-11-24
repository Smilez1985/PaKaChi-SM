/** Persisted binary assets for one character's two distinct forms. */
export interface StudioFormModelAsset {
  formId: string;
  label: string;
  model: string;
  generationReference: import('./image-reference-crop.ts').ImageReferenceGenerationManifest;
}
export interface StudioFormModelPair {
  avatarId: string;
  activeForm: 'animal' | 'humanoid';
  animal: StudioFormModelAsset;
  humanoid: StudioFormModelAsset;
}
const id=(value:unknown):value is string=>typeof value==='string'&&/^[a-z0-9][a-z0-9_-]{0,127}$/.test(value);
const label=(value:unknown):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=100;
export function validStudioFormModelAsset(value:unknown):value is StudioFormModelAsset {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const asset=value as Record<string,unknown>;
  return Object.keys(asset).length===4&&Object.keys(asset).every(key=>['formId','label','model','generationReference'].includes(key))&&
    id(asset.formId)&&label(asset.label)&&typeof asset.model==='string'&&asset.model.length>0&&asset.model.length<=70_000_000&&
    asset.model.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(asset.model)&&
    !!asset.generationReference&&typeof asset.generationReference==='object'&&!Array.isArray(asset.generationReference);
}
export function validStudioFormModelPair(value:unknown,avatarId:string,activeModel:string):value is StudioFormModelPair {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const pair=value as Record<string,unknown>;
  if(Object.keys(pair).length!==4||!Object.keys(pair).every(key=>['avatarId','activeForm','animal','humanoid'].includes(key))||
    pair.avatarId!==avatarId||!id(pair.avatarId)||!['animal','humanoid'].includes(String(pair.activeForm))||
    !validStudioFormModelAsset(pair.animal)||!validStudioFormModelAsset(pair.humanoid))return false;
  const animal=pair.animal as StudioFormModelAsset,humanoid=pair.humanoid as StudioFormModelAsset;
  if(animal.formId===humanoid.formId||animal.model===humanoid.model)return false;
  return (pair.activeForm==='animal'?animal.model:humanoid.model)===activeModel;
}
