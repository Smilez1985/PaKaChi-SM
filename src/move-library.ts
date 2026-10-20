import {z} from 'zod';
import {MAX_MOVE_FILE} from './move-file.ts';
const entry=z.object({id:z.string().regex(/^[a-z0-9][a-z0-9_-]{0,99}$/),name:z.string().trim().min(1).max(100),file:z.string().regex(/^moves\/[a-z0-9_-]+\.pakachi-move\.json$/)}).strict();
export type LibraryMove=z.infer<typeof entry>;
export function parseMoveLibrary(value:unknown):LibraryMove[]{
 const {moves}=z.object({schemaVersion:z.literal(1),moves:z.array(entry).max(100)}).strict().parse(value);
 if(new Set(moves.map(m=>m.id)).size!==moves.length||new Set(moves.map(m=>m.file)).size!==moves.length)throw Error('Doppelte Einträge im Move-Katalog.');return moves;
}
async function readJSON(path:string,limit:number,signal:AbortSignal,fetcher:typeof fetch){
 signal.throwIfAborted();const response=await fetcher(path,{signal,redirect:'error',credentials:'omit'});
 if(!response.ok||!response.body){await response.body?.cancel().catch(()=>{});throw Error('Move-Sammlung nicht erreichbar.');}
 const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
 try{
  if(Number(response.headers.get('content-length'))>limit)throw Error('Move-Sammlung: Datei zu groß.');
  while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Move-Sammlung: Datei zu groß.');parts.push(value);}
  signal.throwIfAborted();const all=new Uint8Array(size);let offset=0;for(const part of parts){all.set(part,offset);offset+=part.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function loadMoveLibrary(base:string,signal:AbortSignal,fetcher:typeof fetch=fetch){return parseMoveLibrary(await readJSON(base+'moves/catalog.json',256*1024,signal,fetcher));}
export async function loadLibraryMove(value:LibraryMove,base:string,signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<unknown>{
 const item=entry.parse(value),file=await readJSON(base+item.file,MAX_MOVE_FILE,signal,fetcher);
 if(file?.move?.id!==item.id)throw Error('Move-ID passt nicht zum Katalog.');
 // The editor validates the complete file, binding and revision before mutation.
 return file;
}
