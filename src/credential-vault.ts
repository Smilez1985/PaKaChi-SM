import {z} from 'zod';
import {ADAPTERS} from './ai-providers.ts';
export const VAULT_STORAGE_KEY='pakachi-credential-vault-v1';
const ITERATIONS=600000;
const encoder=new TextEncoder(),aad=encoder.encode('PaKaChi credential vault v1');
const entry=z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),adapter:z.enum(ADAPTERS),endpoint:z.string().max(2048),token:z.string().max(8192)}).strict();
const entries=z.array(entry).max(64);
export type VaultEntry=z.infer<typeof entry>;
const envelope=z.object({version:z.literal(1),iterations:z.literal(ITERATIONS),salt:z.string().max(32),iv:z.string().max(24),ciphertext:z.string().max(1000000)}).strict();
const encode=(bytes:Uint8Array)=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
function decode(value:string,length?:number){const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));if(length!==undefined&&bytes.length!==length)throw new Error('invalid-vault');return bytes;}
async function derive(password:string,salt:Uint8Array<ArrayBuffer>){
 if(password.length<12||password.length>1024)throw new Error('password-length');
 const base=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:ITERATIONS},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptVault(input:VaultEntry[],password:string):Promise<string>{
 const valid=entries.parse(input),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await derive(password,salt),data=encoder.encode(JSON.stringify(valid));
 try{const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,data);return JSON.stringify(envelope.parse({version:1,iterations:ITERATIONS,salt:encode(salt),iv:encode(iv),ciphertext:encode(new Uint8Array(encrypted))}));}finally{data.fill(0);}
}
export async function decryptVault(raw:string,password:string):Promise<VaultEntry[]>{
 if(raw.length>1100000)throw new Error('invalid-vault');
 try{const stored=envelope.parse(JSON.parse(raw));const key=await derive(password,decode(stored.salt,16));
  const data=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(stored.iv,12),additionalData:aad,tagLength:128},key,decode(stored.ciphertext)));
  try{return entries.parse(JSON.parse(new TextDecoder().decode(data)));}finally{data.fill(0);}
 }catch{throw new Error('unlock-failed');}
}
export const vaultIdentity=(p:Pick<VaultEntry,'id'|'adapter'|'endpoint'>)=>JSON.stringify([p.id,p.adapter,p.endpoint.replace(/\/$/,'')]);
/** Merge only still-configured profile destinations. An explicit empty token deletes that entry. */
export async function saveVault(profiles:Omit<VaultEntry,'token'>[],session:(profile:Omit<VaultEntry,'token'>)=>string|undefined,password:string,storage:Pick<Storage,'getItem'|'setItem'>,valid=()=>true){
 const before=storage.getItem(VAULT_STORAGE_KEY),old=before?await decryptVault(before,password):[];
 const prior=new Map(old.map(p=>[vaultIdentity(p),p.token]));
 const selected=profiles.map(p=>({...p,token:session(p)??prior.get(vaultIdentity(p))??''})).filter(p=>p.token);
 const encrypted=await encryptVault(selected,password);
 if(!valid()||storage.getItem(VAULT_STORAGE_KEY)!==before)throw new Error('vault-changed');
 storage.setItem(VAULT_STORAGE_KEY,encrypted);return selected.length;
}

/** Re-encrypt the stored snapshot; do not silently save unrelated session edits. */
export async function changeVaultPassword(oldPassword:string,newPassword:string,storage:Pick<Storage,'getItem'|'setItem'>,valid=()=>true){
 const before=storage.getItem(VAULT_STORAGE_KEY);if(!before)throw new Error('missing');
 const saved=await decryptVault(before,oldPassword),encrypted=await encryptVault(saved,newPassword);
 if(!valid()||storage.getItem(VAULT_STORAGE_KEY)!==before)throw new Error('vault-changed');
 storage.setItem(VAULT_STORAGE_KEY,encrypted);return saved.length;
}
