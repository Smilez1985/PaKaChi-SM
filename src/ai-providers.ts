import type {JobExecution,JobOutput} from './ai-job-types.ts';
import {z} from 'zod';

export const ROLES = ['assistant','generation','rigging'] as const;
export type ProviderRole = typeof ROLES[number];
export const ADAPTERS = ['openai-compatible','ollama','lmstudio','custom-generation','custom-rigging','anthropic'] as const;
export const PROVIDER_STORAGE_KEY = 'pakachi-providers-v1';
const text = z.string().trim().min(1).max(160);
const endpoint = z.string().trim().max(2048).transform((value,ctx)=>{
  try {
    const url = new URL(value);
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    return url.href.replace(/\/$/,'');
  } catch {ctx.addIssue({code:'custom',message:'endpoint'});return z.NEVER;}
});
const profileSchema = z.object({
  id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),name:text,adapter:z.enum(ADAPTERS),endpoint,model:text,
}).strict();
const configSchema = z.object({
  version:z.literal(1),profiles:z.array(profileSchema).max(64),
  fallbacks:z.object({assistant:z.array(z.string()).max(63),generation:z.array(z.string()).max(63),rigging:z.array(z.string()).max(63)}).strict().optional(),
  assignments:z.object({assistant:z.string().nullable(),generation:z.string().nullable(),rigging:z.string().nullable()}).strict(),
}).strict().superRefine((config,ctx)=>{
  const ids=new Set(config.profiles.map(p=>p.id));
  if(ids.size!==config.profiles.length)ctx.addIssue({code:'custom',message:'duplicate-id'});
  for(const role of ROLES){const chain=config.fallbacks?.[role]??[];if(chain.some(id=>!ids.has(id)||id===config.assignments[role])||new Set(chain).size!==chain.length)ctx.addIssue({code:'custom',message:'invalid-fallbacks'});const id=config.assignments[role];if(id!==null&&!ids.has(id))ctx.addIssue({code:'custom',message:'missing-profile'});}
});
export type ProviderProfile = z.infer<typeof profileSchema>;
export type ProviderConfig = z.infer<typeof configSchema>;
export function emptyProviderConfig():ProviderConfig {return {version:1,profiles:[],assignments:{assistant:null,generation:null,rigging:null}};}
export function parseProviderConfig(value:unknown):ProviderConfig {return configSchema.parse(value);}
export function readProviderConfig(storage:Pick<Storage,'getItem'>):{config:ProviderConfig;error:boolean} {
  try {const raw=storage.getItem(PROVIDER_STORAGE_KEY);return {config:raw===null?emptyProviderConfig():parseProviderConfig(JSON.parse(raw)),error:false};}
  catch {return {config:emptyProviderConfig(),error:true};}
}
export function saveProviderConfig(config:ProviderConfig,storage:Pick<Storage,'setItem'>):void {
  storage.setItem(PROVIDER_STORAGE_KEY,JSON.stringify(parseProviderConfig(config)));
}
export function removeProviderProfile(config:ProviderConfig,id:string):ProviderConfig {
  const next=parseProviderConfig(config);next.profiles=next.profiles.filter(p=>p.id!==id);
  for(const role of ROLES){if(next.assignments[role]===id)next.assignments[role]=null;if(next.fallbacks)next.fallbacks[role]=next.fallbacks[role].filter(item=>item!==id);}
  return next;
}

// Adapter transport and credentials belong outside the persisted profile.
// No built-in network adapters are installed; execution is supplied by each adapter.
export type Capability = 'tool-calling'|'image-to-3d'|'rigging';
export interface ProviderAdapter {
  id:ProviderProfile['adapter'];
  probe(profile:Readonly<ProviderProfile>,signal:AbortSignal):Promise<{model:string;capabilities:readonly Capability[]}>;
  run?(request:JobExecution):Promise<JobOutput>;
  listModels?(profile:Readonly<ProviderProfile>,signal:AbortSignal):Promise<readonly string[]>;
}
export const REQUIRED_CAPABILITY:Record<ProviderRole,Capability>={assistant:'tool-calling',generation:'image-to-3d',rigging:'rigging'};
export class ProviderUnavailable extends Error {
  readonly reason:'unassigned'|'adapter-missing'|'unsupported-model'|'unsupported-role'|'execution-missing';
  constructor(reason:ProviderUnavailable['reason']) {super(reason);this.reason=reason;}
}
export class ProviderRegistry {
  private readonly adapters = new Map<string,ProviderAdapter>();
  register(adapter:ProviderAdapter):void {
    if(this.adapters.has(adapter.id))throw new Error('duplicate-adapter');
    this.adapters.set(adapter.id,adapter);
  }
  async resolveJob(config:ProviderConfig,role:ProviderRole,signal:AbortSignal):Promise<{profile:Readonly<ProviderProfile>;run:(request:JobExecution)=>Promise<JobOutput>}> {
    const profile=await this.resolve(config,role,signal);
    const adapter=this.adapters.get(profile.adapter)!;
    if(!adapter.run)throw new ProviderUnavailable('execution-missing');
    return {profile,run:adapter.run.bind(adapter)};
  }
  async resolve(config:ProviderConfig,role:ProviderRole,signal:AbortSignal):Promise<Readonly<ProviderProfile>> {
    signal.throwIfAborted();
    const valid=parseProviderConfig(config),id=valid.assignments[role],profile=valid.profiles.find(p=>p.id===id);
    if(!profile)throw new ProviderUnavailable('unassigned');
    const adapter=this.adapters.get(profile.adapter);
    if(!adapter)throw new ProviderUnavailable('adapter-missing');
    const snapshot=Object.freeze({...profile});
    const result=await adapter.probe(snapshot,signal);signal.throwIfAborted();
    if(result.model!==profile.model)throw new ProviderUnavailable('unsupported-model');
    if(!result.capabilities.includes(REQUIRED_CAPABILITY[role]))throw new ProviderUnavailable('unsupported-role');
    return snapshot;
  }
}

export function providerRoute(config:ProviderConfig,role:ProviderRole):ProviderProfile[]{const valid=parseProviderConfig(config);const primary=valid.assignments[role];if(!primary)return [];return [primary,...(valid.fallbacks?.[role]??[])].map(id=>valid.profiles.find(p=>p.id===id)!);}
