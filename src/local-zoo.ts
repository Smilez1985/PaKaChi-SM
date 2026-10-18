import {parseProject} from './studio-data.ts';
import type {StudioProject} from './studio-data.ts';

export interface ZooEntry {id:string;name:string;createdAt:string;bytes:number}
export interface LocalZoo {
 list():Promise<ZooEntry[]>;
 add(name:string,project:StudioProject):Promise<ZooEntry>;
 read(id:string):Promise<StudioProject>;
 remove(id:string):Promise<void>;
}
export function zooSnapshot(name:string,project:StudioProject):{project:StudioProject;entry:ZooEntry}{
 const title=name.trim();if(!title||title.length>100)throw new Error('invalid-name');
 const snapshot=parseProject(project);snapshot.avatar.name=title;
 const bytes=new Blob([JSON.stringify(snapshot)]).size;
 if(bytes>80*1024*1024)throw new Error('project-too-large');
 return {project:snapshot,entry:{id:'saved-'+crypto.randomUUID(),name:title,createdAt:new Date().toISOString(),bytes}};
}
/** Metadata and full projects commit together. Never overwrite an existing entry. */
export class IndexedDBZoo implements LocalZoo {
 private factory:IDBFactory|undefined;
 constructor(factory:IDBFactory|undefined=globalThis.indexedDB){this.factory=factory;}
 private open():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
   if(!this.factory){reject(new Error('storage-unavailable'));return;}
   const request=this.factory.open('pakachi-local-zoo',1);let closed=false;
   request.onupgradeneeded=()=>{request.result.createObjectStore('entries',{keyPath:'id'});request.result.createObjectStore('projects');};
   request.onblocked=()=>{closed=true;reject(new Error('storage-blocked'));};
   request.onerror=()=>reject(new Error('storage-open-failed'));
   request.onsuccess=()=>{if(closed){request.result.close();return;}request.result.onversionchange=()=>request.result.close();resolve(request.result);};
  });
 }
 private async transaction<T>(mode:IDBTransactionMode,work:(tx:IDBTransaction,done:(value:T)=>void)=>void):Promise<T>{
  const db=await this.open();
  try{return await new Promise<T>((resolve,reject)=>{
   const tx=db.transaction(['entries','projects'],mode);let result:T;
   tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(new Error('storage-transaction-failed'));
   tx.onerror=()=>{/* The transaction abort rejects; request success alone never commits. */};
   try{work(tx,value=>{result=value;});}catch(error){tx.abort();reject(error);}
  });}finally{db.close();}
 }
 list(){return this.transaction<ZooEntry[]>('readonly',(tx,done)=>{const request=tx.objectStore('entries').getAll();request.onsuccess=()=>done((request.result as ZooEntry[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));});}
 async add(name:string,project:StudioProject){
  const snapshot=zooSnapshot(name,project);
  return this.transaction<ZooEntry>('readwrite',(tx,done)=>{
   const entries=tx.objectStore('entries'),count=entries.count();
   count.onsuccess=()=>{if(count.result>=50){tx.abort();return;}entries.add(snapshot.entry);tx.objectStore('projects').add(snapshot.project,snapshot.entry.id);done(snapshot.entry);};
  });
 }
 async read(id:string){
  const value=await this.transaction<unknown>('readonly',(tx,done)=>{const request=tx.objectStore('projects').get(id);request.onsuccess=()=>done(request.result);});
  return parseProject(value);
 }
 remove(id:string){return this.transaction<void>('readwrite',(tx,done)=>{tx.objectStore('entries').delete(id);tx.objectStore('projects').delete(id);done(undefined);});}
}
