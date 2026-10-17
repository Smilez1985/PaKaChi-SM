import type {ProviderProfile} from './ai-providers.ts';
// Per-profile credentials live for this page session, outside browser/project storage.
const keys=new Map<string,string>();
const identity=(p:Pick<ProviderProfile,'id'|'adapter'|'endpoint'>)=>JSON.stringify([p.id,p.adapter,p.endpoint.replace(/\/$/,'')]);
export function getProviderKey(p:Pick<ProviderProfile,'id'|'adapter'|'endpoint'>){return keys.get(identity(p))??'';}
export function setProviderKey(p:Pick<ProviderProfile,'id'|'adapter'|'endpoint'>,key:string){if(key||keys.has(identity(p)))keys.set(identity(p),key);}
export function forgetProviderKeys(id:string){for(const key of keys.keys())if(JSON.parse(key)[0]===id)keys.set(key,'');}

export function peekProviderKey(p:Pick<ProviderProfile,'id'|'adapter'|'endpoint'>){return keys.get(identity(p));}

export function lockProviderSession(){keys.clear();window.dispatchEvent(new window.Event('pakachi-vault-lock'));}
