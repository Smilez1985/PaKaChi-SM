import type {ProviderProfile} from './ai-providers.ts';
// Per-profile credentials live for this page session, outside browser/project storage.
const keys=new Map<string,string>();
const identity=(p:Pick<ProviderProfile,'id'|'adapter'|'endpoint'>)=>JSON.stringify([p.id,p.adapter,p.endpoint.replace(/\/$/,'')]);
export function getProviderKey(p:Pick<ProviderProfile,'id'|'adapter'|'endpoint'>){return keys.get(identity(p))??'';}
export function setProviderKey(p:Pick<ProviderProfile,'id'|'adapter'|'endpoint'>,key:string){if(key)keys.set(identity(p),key);else keys.delete(identity(p));}
export function forgetProviderKeys(id:string){for(const key of keys.keys())if(JSON.parse(key)[0]===id)keys.delete(key);}
