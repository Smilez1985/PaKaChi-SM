import {anthropicHeaders} from './anthropic.ts';
import {parseProviderConfig} from './ai-providers.ts';
import type {ProviderProfile} from './ai-providers.ts';

export type ProviderConnection=Pick<ProviderProfile,'adapter'|'endpoint'>;
export type DiscoveryErrorCode='invalid-endpoint'|'unsupported-adapter'|'insecure-token'|'invalid-token'|'unauthorized'|'not-found'|'rate-limited'|'http-error'|'invalid-response'|'response-too-large'|'network'|'timeout'|'cancelled';
export class DiscoveryError extends Error {
  readonly code:DiscoveryErrorCode;
  constructor(code:DiscoveryErrorCode){super(code);this.code=code;}
}
/** Build exactly one read-only endpoint. Never guess alternate hosts or API routes. */
export function modelListURL(connection:ProviderConnection):string {
  let profile:ProviderProfile;
  try{profile=parseProviderConfig({version:1,profiles:[{...connection,id:'probe',name:'probe',model:'probe'}],assignments:{assistant:null,generation:null,rigging:null}}).profiles[0];}
  catch{throw new DiscoveryError('invalid-endpoint');}
  const url=new URL(profile.endpoint),path=url.pathname.replace(/\/+$/,'');
  if(profile.adapter==='ollama')url.pathname=path.endsWith('/api')?`${path}/tags`:`${path}/api/tags`;
  else if(profile.adapter==='lmstudio'||profile.adapter==='openai-compatible'||profile.adapter==='anthropic')url.pathname=`${path||'/v1'}/models`;
  else throw new DiscoveryError('unsupported-adapter');
  return url.href;
}
const MAX_BYTES=1024*1024;
export async function readJSON(response:Response,signal:AbortSignal):Promise<unknown>{
  if(Number(response.headers.get('content-length'))>MAX_BYTES){void response.body?.cancel().catch(()=>{});throw new DiscoveryError('response-too-large');}
  if(!response.body)throw new DiscoveryError('invalid-response');
  const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
  const stop=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',stop,{once:true});
  try{
    while(true){signal.throwIfAborted();const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw new DiscoveryError('response-too-large');parts.push(value);}
    signal.throwIfAborted();const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
    try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new DiscoveryError('invalid-response');}
  }finally{signal.removeEventListener('abort',stop);void reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function discoverModels(connection:ProviderConnection,options:{token?:string;signal?:AbortSignal;timeoutMs?:number;fetcher?:typeof fetch}={}):Promise<string[]> {
  const url=modelListURL(connection),token=options.token?.trim()??'',target=new URL(url);
  if(token.length>8192||/[\x00-\x20\x7f]/.test(token))throw new DiscoveryError('invalid-token');
  const loopback=target.hostname==='localhost'||target.hostname==='[::1]'||/^127(?:\.\d{1,3}){3}$/.test(target.hostname);
  if(token&&target.protocol!=='https:'&&!loopback)throw new DiscoveryError('insecure-token');
  if(options.signal?.aborted)throw new DiscoveryError('cancelled');
  const timeout=options.timeoutMs??10000;if(!Number.isFinite(timeout)||timeout<1||timeout>60000)throw new DiscoveryError('timeout');
  const controller=new AbortController();let timedOut=false;
  const abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeout);
  let rejectAbort!:()=>void;
  const cancelled=new Promise<never>((_resolve,reject)=>{rejectAbort=()=>reject(new DiscoveryError(timedOut?'timeout':'cancelled'));controller.signal.addEventListener('abort',rejectAbort,{once:true});});
  try{
    const request=(async()=>{
      const headers:Record<string,string>={Accept:'application/json'};if(connection.adapter==='anthropic')Object.assign(headers,anthropicHeaders(token));else if(token)headers.Authorization=`Bearer ${token}`;
      const requestURL=new URL(url);if(connection.adapter==='anthropic')requestURL.searchParams.set('limit','1000');
      const response=await (options.fetcher??fetch)(requestURL.href,{method:'GET',headers,signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer'});
      if(!response.ok){void response.body?.cancel().catch(()=>{});throw new DiscoveryError(response.status===401||response.status===403?'unauthorized':response.status===404?'not-found':response.status===429?'rate-limited':'http-error');}
      const raw=await readJSON(response,controller.signal);
      if(!raw||typeof raw!=='object')throw new DiscoveryError('invalid-response');
      if(connection.adapter==='anthropic'&&((raw as {has_more?:unknown}).has_more!==false))throw new DiscoveryError('invalid-response');
      const rows=connection.adapter==='ollama'?(raw as {models?:unknown}).models:(raw as {data?:unknown}).data;
      if(!Array.isArray(rows)||rows.length>1000)throw new DiscoveryError('invalid-response');
      const ids=rows.map(row=>{
        const id=connection.adapter==='ollama'?row?.name:row?.id;
        if(typeof id!=='string'||!id.trim()||id!==id.trim()||id.length>160||/[\x00-\x1f\x7f]/.test(id))throw new DiscoveryError('invalid-response');
        return id;
      });
      return [...new Set(ids)].sort((a,b)=>a.localeCompare(b));
    })();
    return await Promise.race([request,cancelled]);
  }catch(error){
    if(controller.signal.aborted)throw new DiscoveryError(timedOut?'timeout':'cancelled');
    throw error instanceof DiscoveryError?error:new DiscoveryError('network');
  }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);controller.signal.removeEventListener('abort',rejectAbort);}
}
