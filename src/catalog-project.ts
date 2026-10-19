import {parseCatalog} from './catalog.ts';
import type {Avatar} from './catalog.ts';
import {parseProject} from './studio-data.ts';
import type {StudioProject} from './studio-data.ts';
export const MAX_CATALOG_PROJECT=80*1024*1024;
/** Bounded deployment-relative catalog resource. Model dependencies remain subject to parseModel. */
export async function loadCatalogProject(avatar:Avatar,base:string,signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<StudioProject>{
 const valid=parseCatalog({schemaVersion:1,avatars:[avatar]})[0];if(!valid.project)throw Error('Kein Katalogprojekt.');
 signal.throwIfAborted();
 const response=await fetcher(base+valid.project,{signal,redirect:'error',credentials:'omit'});
 if(!response.ok||!response.body){await response.body?.cancel().catch(()=>{});throw Error('Katalogprojekt nicht erreichbar.');}
 const reader=response.body.getReader();let total=0;const parts:Uint8Array[]=[];
 try{
  if(Number(response.headers.get('content-length'))>MAX_CATALOG_PROJECT)throw Error('Katalogprojekt ist größer als 80 MiB.');
  while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_CATALOG_PROJECT)throw Error('Katalogprojekt ist größer als 80 MiB.');parts.push(value);}
  signal.throwIfAborted();const bytes=new Uint8Array(total);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  const project=parseProject(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
  if(project.avatar.id!==valid.id)throw Error('Projekt-ID passt nicht zum Katalog.');
  return project;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
