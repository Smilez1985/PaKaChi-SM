import {mkdir,readFile,writeFile,stat,realpath,readdir,lstat,copyFile,rm} from 'node:fs/promises';
import {resolve,join,extname,basename,relative,isAbsolute} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';

const MAX=50*1024*1024,CHUNK=384*1024;
const hash=b=>createHash('sha256').update(b).digest('hex');
const validId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
const nameOK=name=>typeof name==='string'&&name===basename(name)&&!/[\0\r\n<>:"|?*\\/]/.test(name)&&name.length>0&&name.length<=180&&['.glb','.png','.jpg','.jpeg','.webp','.py','.json','.txt','.blend'].includes(extname(name).toLowerCase());
export async function createAssets(root){
 const directory=resolve(root,'assets');await mkdir(directory,{recursive:true,mode:0o700});const records=new Map(),uploads=new Map();
 for(const name of await readdir(directory))if(name.endsWith('.meta.json')){const info=JSON.parse(await readFile(join(directory,name),'utf8'));if(validId(info.id)&&name===info.id+'.meta.json')records.set(info.id,info);}
 async function file(id){if(!validId(id)||!records.has(id))throw Error('Unbekannte Datei.');const p=join(directory,id+extname(records.get(id).name));const actual=await realpath(p),part=relative(directory,actual);if(isAbsolute(part)||part.startsWith('..')||(await lstat(p)).isSymbolicLink())throw Error('Datei liegt außerhalb des Arbeitsbereichs.');return actual;}
 async function add(name,bytes){
  if(!nameOK(name)||!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX||extname(name)==='.py'&&bytes.length>1024*1024)throw Error('Ungültige Datei oder Dateigröße.');
  if(records.size>=1000||[...records.values()].reduce((n,r)=>n+r.bytes,0)+bytes.length>1024*1024*1024)throw Error('Arbeitsbereich voll; lokale Dateien bereinigen.');
  const id=randomUUID(),record={id,name,bytes:bytes.length,sha256:hash(bytes),created:new Date().toISOString()};
  await writeFile(join(directory,id+extname(name)),bytes,{flag:'wx',mode:0o600});await writeFile(join(directory,id+'.meta.json'),JSON.stringify(record),{flag:'wx',mode:0o600});records.set(id,record);return {...record};
 }
 return {directory,add,file,
  list:()=>[...records.values()].slice(-200).map(r=>({...r})),
  async read(id,offset=0,length=CHUNK){const p=await file(id);if(!Number.isInteger(offset)||offset<0||!Number.isInteger(length)||length<1||length>CHUNK)throw Error('Ungültiger Dateiausschnitt.');const bytes=await readFile(p),chunk=bytes.subarray(offset,offset+length);if(offset>bytes.length)throw Error('Dateiausschnitt außerhalb der Datei.');return {...records.get(id),offset,data:chunk.toString('base64'),nextOffset:offset+chunk.length<bytes.length?offset+chunk.length:null};},
  async upload({name,data,uploadId,offset=0,final=false}){
   if(!nameOK(name)||typeof data!=='string'||data.length>CHUNK*4/3+8||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)||!Number.isInteger(offset)||offset<0)throw Error('Ungültiger Upload.');
   for(const [id,u] of uploads)if(Date.now()-u.time>600000)uploads.delete(id);
   if(!uploadId){if(offset||uploads.size>=8)throw Error('Upload belegt oder falscher Anfang.');uploadId=randomUUID();uploads.set(uploadId,{name,chunks:[],bytes:0,time:Date.now(),busy:false});}
   const u=uploads.get(uploadId);if(!u||u.name!==name||u.bytes!==offset||u.busy)throw Error('Upload-Konflikt.');
   const chunk=Buffer.from(data,'base64');if(u.bytes+chunk.length>MAX||[...uploads.values()].reduce((n,r)=>n+r.bytes,0)+chunk.length>64*1024*1024){uploads.delete(uploadId);throw Error('Upload-Grenze erreicht.');}u.chunks.push(chunk);u.bytes+=chunk.length;u.time=Date.now();
   if(!final)return {uploadId,nextOffset:u.bytes};u.busy=true;try{return {asset:await add(u.name,Buffer.concat(u.chunks))};}finally{uploads.delete(uploadId);}
  },
  async collect(folder){
   const output=[];let size=0;
   const visit=async(dir,depth=0)=>{if(depth>4)throw Error('Zu viele Ausgabeordner.');for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.isSymbolicLink())continue;const p=join(dir,entry.name);if(entry.isDirectory())await visit(p,depth+1);else if(entry.isFile()&&nameOK(entry.name)){if(output.length>=50)throw Error('Zu viele Ausgabedateien.');const s=await stat(p);size+=s.size;if(s.size>MAX||size>150*1024*1024)throw Error('Ausgaben sind zu groß.');const bytes=await readFile(p);if(bytes.length)output.push(await add(entry.name,bytes));}}};
   await visit(folder);return output;
  },
  async seed(paths){for(const path of paths){try{const b=await readFile(path);if(![...records.values()].some(r=>r.sha256===hash(b)))await add(basename(path),b);}catch(error){if(error.code!=='ENOENT')throw error;}}},
  async copyInputs(ids,destination){if(!Array.isArray(ids)||ids.length>16||new Set(ids).size!==ids.length)throw Error('Ungültige Eingabedateien.');const out={};for(const id of ids){const source=await file(id),name=id+extname(source),target=join(destination,name);await copyFile(source,target);out[id]=target;}return out;},
  async remove(id){const p=await file(id);await rm(p);await rm(join(directory,id+'.meta.json'));records.delete(id);},
 };
}
