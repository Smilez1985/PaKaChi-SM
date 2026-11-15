import type {ProviderProfile,ProviderRole} from './ai-providers.ts';
import type {ImageReferenceGenerationManifest} from './image-reference-crop.ts';

export interface JobInput {
  prompt:string;
  source?:{mediaType:'image/png'|'image/jpeg'|'model/gltf-binary';bytes:Uint8Array};
  reference?:ImageReferenceGenerationManifest;
}
export type JobOutput = {kind:'text';text:string}|{kind:'model';bytes:Uint8Array};
export interface JobProgress {phase:'queued'|'running';percent?:number}
export interface JobExecution {
  id:string;
  role:ProviderRole;
  profile:Readonly<ProviderProfile>;
  input:JobInput;
  signal:AbortSignal;
  progress:(value:JobProgress)=>void;
}
