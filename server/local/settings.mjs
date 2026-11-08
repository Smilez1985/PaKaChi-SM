import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {z} from 'zod';

const executable=z.string().trim().max(2048).refine(s=>!/[\r\n\0]/.test(s));
export const settingsSchema=z.object({
 enabled:z.boolean().default(false),allowScripts:z.boolean().default(false),listenHost:z.enum(['127.0.0.1','0.0.0.0']).default('127.0.0.1'),
 publicUrl:z.string().max(2048).default('').refine(s=>{if(!s)return true;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/(?:[a-zA-Z0-9_-]+\/)*mcp$/.test(u.pathname);}catch{return false;}},'HTTPS-Adresse mit abschließendem /mcp erforderlich.'),
 blender:executable.default('blender'),python:executable.default('python'),triposrRepo:executable.default(''),device:z.enum(['cpu','cuda:0']).default('cpu'),
 jobTimeout:z.number().int().min(10).max(7200).default(1800),tunnelId:z.string().max(100).default('').refine(s=>!s||/^tunnel_[a-zA-Z0-9_-]+$/.test(s)),
 acpCommand:executable.default(''),acpArgs:z.array(z.string().max(2048).refine(s=>!s.includes('\0'))).max(32).default([]),
}).strict();
export async function createSettings(directory){
 const root=resolve(directory);await mkdir(root,{recursive:true,mode:0o700});const file=join(root,'settings.json');
 let stored;try{stored=JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 let value=settingsSchema.parse(stored?.settings??{});let token=stored?.token;
 if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))token=randomBytes(32).toString('hex');
 const save=async()=>{const temp=file+'.tmp';await writeFile(temp,JSON.stringify({version:1,token,settings:value},null,2)+'\n',{mode:0o600});await rename(temp,file);};
 await save();
 // Every launch requires opting in again. Saved executable paths are not an execution grant.
 value={...value,enabled:false,allowScripts:false};
 return {root,get value(){return structuredClone(value);},get token(){return token;},async update(next){value=settingsSchema.parse(next);await save();return this.value;},async rotate(){token=randomBytes(32).toString('hex');await save();return token;}};
}
export function connectionDetails(publicUrl,localUrl){
 const resource=new URL(publicUrl||localUrl+'/mcp'),prefix=resource.pathname.slice(0,-4).replace(/\/$/,'');
 return {resource,prefix,base:new URL(prefix||'/',resource.origin),metadata:new URL('/.well-known/oauth-protected-resource'+resource.pathname,resource.origin)};
}
export function caddySnippet(publicUrl,upstream='127.0.0.1:8787'){
 if(!publicUrl)return '';
 settingsSchema.parse({publicUrl});if(!/^(?:127\.0\.0\.1|localhost|[a-zA-Z0-9._-]+):[0-9]{1,5}$/.test(upstream))throw Error('Ungültiger interner Upstream.');
 const {resource,prefix}=connectionDetails(publicUrl,'');
 const routes=[resource.pathname,`${prefix}/authorize`,`${prefix}/token`,`${prefix}/register`,`${prefix}/revoke`,`${prefix}/oauth-wait/*`,'/.well-known/oauth-protected-resource'+resource.pathname,'/.well-known/oauth-authorization-server'+prefix];
 return `# In deinen vorhandenen Caddy-Siteblock für ${resource.hostname} einfügen.\n# Bei Caddy auf einem anderen Rechner: interne PaKaChi-IP statt 127.0.0.1.\n@pakachi_mcp path ${routes.join(' ')}\nhandle @pakachi_mcp {\n    reverse_proxy ${upstream} {\n        flush_interval -1\n    }\n}\n# /api/local und die Verwaltungsoberfläche werden nicht weitergeleitet.\n`;
}
