import type {ProviderAdapter,ProviderProfile} from './ai-providers.ts';
import {ProviderUnavailable} from './ai-providers.ts';

/** Protocol adapter for the opt-in local TripoSR service; not a generic Cloud API. */
export function createLocalGenerationAdapter(tokenFor:(profile:Readonly<ProviderProfile>)=>string,fetcher:typeof fetch=fetch):ProviderAdapter {
 const base=(profile:Readonly<ProviderProfile>)=>{
  const url=new URL(profile.endpoint);
  if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.pathname!=='/'||url.username||url.password||url.search||url.hash)throw new Error('local-generation-endpoint');
  if(profile.model!=='triposr')throw new ProviderUnavailable('unsupported-model');
  return url.origin;
 };
 const request=(profile:Readonly<ProviderProfile>,path:string,signal:AbortSignal,body?:Uint8Array,mediaType?:string)=>{
  const endpoint=base(profile),token=tokenFor(profile);
  if(!/^[-_a-zA-Z0-9]{32,256}$/.test(token))throw new Error('generation-token-required');
  signal.throwIfAborted();
  return fetcher(endpoint+path,{method:body?'POST':'GET',signal,redirect:'error',credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+token,...(mediaType?{'Content-Type':mediaType}:{})},body:body?new Blob([Uint8Array.from(body).buffer]):undefined});
 };
 const read=async(response:Response,limit:number,signal:AbortSignal)=>{
  if(!response.ok||!response.body){await response.body?.cancel();throw new Error('generation-service-failed');}
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let length=0;
  const abort=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
  try{
   signal.throwIfAborted();if(Number(response.headers.get('content-length'))>limit)throw new Error('generation-response-size');
   while(true){const {done,value}=await reader.read();signal.throwIfAborted();if(done)break;length+=value.length;if(length>limit)throw new Error('generation-response-size');chunks.push(value);}
   const output=new Uint8Array(length);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}return output;
  }finally{signal.removeEventListener('abort',abort);await reader.cancel().catch(()=>{});reader.releaseLock();}
 };
 return {
  id:'custom-generation',
  async probe(profile,signal){
   const response=await request(profile,'/capabilities',signal);
   const value=JSON.parse(new TextDecoder().decode(await read(response,8192,signal)));
   if(value.protocol!=='pakachi-generation-v1'||value.model!==profile.model||!Array.isArray(value.capabilities)||!value.capabilities.includes('image-to-3d')||value.prompt!==false)throw new ProviderUnavailable('unsupported-model');
   return {model:value.model,capabilities:['image-to-3d']};
  },
  async run({profile,role,input,signal,progress}){
   if(role!=='generation')throw new ProviderUnavailable('unsupported-role');
   const source=input.source;
   if(!source||!['image/png','image/jpeg'].includes(source.mediaType)||source.bytes.length<3||source.bytes.length>20*1024*1024)throw new Error('generation-image-required');
   // TripoSR is image-only. The job prompt labels the task; it cannot steer reconstruction.
   progress({phase:'running'});
   const response=await request(profile,'/generate',signal,source.bytes,source.mediaType);
   if(response.headers.get('content-type')!=='model/gltf-binary'){await response.body?.cancel();throw new Error('generation-model-type');}
   const bytes=await read(response,50*1024*1024,signal);
   const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
   if(bytes.length<20||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.length)throw new Error('generation-invalid-glb');
   return {kind:'model',bytes}; // ProviderJob's mandatory validator still loads the actual model.
  },
 };
}
