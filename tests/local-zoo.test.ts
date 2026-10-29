import {test} from 'node:test';
import type {TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {zooSnapshot,IndexedDBZoo,parseZooEntries} from '../src/local-zoo.ts';
import type {LocalZoo,ZooEntry} from '../src/local-zoo.ts';
import {mountLocalZoo} from '../src/local-zoo-panel.ts';
import {emptyStudio,parseProject} from '../src/studio-data.ts';
import type {StudioProject} from '../src/studio-data.ts';
import {glb} from './generation-fixture.mjs';
const project=():StudioProject=>({format:'pakachi-studio',version:1,model:Buffer.from(glb()).toString('base64'),avatar:{id:'my-avatar',name:'My avatar',description:'Test',moves:[]},studio:emptyStudio()});
async function until(check:()=>boolean){for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,5));}assert.fail('UI did not settle');}
class MemoryZoo implements LocalZoo {
 values=new Map<string,{entry:ZooEntry;project:StudioProject}>();fail=false;
 async list(){return [...this.values.values()].map(v=>structuredClone(v.entry));}
 async add(name:string,p:StudioProject){if(this.fail)throw Error('quota');const value=zooSnapshot(name,p);this.values.set(value.entry.id,value);return structuredClone(value.entry);}
 async read(id:string){return structuredClone(this.values.get(id)!.project);}
 async remove(id:string){this.values.delete(id);}
}
function fixture(t:TestContext,store=new MemoryZoo(),configure?:(w:Window)=>void){
 const w=new Window();configure?.(w);Object.assign(globalThis,{window:w,document:w.document});const host=document.createElement('div');document.body.append(host);
 let revision=0,loads=0,ready=true;const source=project();const notifications:ZooEntry[][]=[],pendingStates:boolean[]=[],loadedEntries:ZooEntry[]=[];
 const panel=mountLocalZoo(host,{entriesChanged:entries=>{notifications.push(entries);},pendingChanged:value=>{pendingStates.push(value);},ready:()=>ready,canSave:()=>true,target:()=>({session:'one',revision}),capture:()=>structuredClone(source),load:async(p,valid,entry)=>{loadedEntries.push(entry);ready=false;w.dispatchEvent(new w.Event('pakachi-sm:change'));assert.ok(valid(),'own loading status must not invalidate import');parseProject(p);loads++;ready=true;return true;}},()=> 'de',store);
 t.after(()=>{panel.dispose();w.happyDOM.abort();});const button=(id:string)=>host.querySelector<HTMLButtonElement>('#zoo-'+id)!;
 const name=host.querySelector<HTMLInputElement>('#zoo-name')!,list=host.querySelector<HTMLSelectElement>('#zoo-list')!;
 return {store,panel,w,host,name,list,source,button,notifications,pendingStates,loadedEntries,get loads(){return loads;},change(){revision++;w.dispatchEvent(new w.Event('pakachi-sm:change'));},async settle(){await until(()=>!button('refresh').disabled);},async save(){await this.settle();name.value='Copy';name.dispatchEvent(new w.Event('input') as unknown as Event);button('save').click();await this.settle();}};
}
test('zoo snapshots are independent valid projects, preserve studio data and use unique identities',()=>{
 const source=project();source.studio.draft={$figure:{position:[1,2,3],rotation:[0,0,0,1]}};
 const a=zooSnapshot('  Copy  ',source),b=zooSnapshot('Copy',source);assert.notEqual(a.entry.id,b.entry.id);assert.equal(a.project.avatar.name,'Copy');assert.deepEqual(parseProject(a.project).studio,source.studio);
 source.studio.draft.$figure.position[0]=9;assert.equal(a.project.studio.draft!.$figure.position[0],1);assert.equal(source.avatar.name,'My avatar');assert.ok(a.entry.bytes>0);
 for(const name of ['',' '.repeat(5),'a'.repeat(101)])assert.throws(()=>zooSnapshot(name,source));assert.throws(()=>zooSnapshot('Copy',{...source,model:'invalid'}));
});
test('unsupported browser storage fails explicitly without a false save result',async()=>{
 const store=new IndexedDBZoo(undefined);await assert.rejects(()=>store.add('Copy',project()),/storage-unavailable/);await assert.rejects(()=>store.list(),/storage-unavailable/);
});
test('saving creates a copy and loading goes through the host guard; remount lists stored copies',async t=>{
 const f=fixture(t);await f.save();assert.equal(f.store.values.size,1);assert.equal(f.source.avatar.name,'My avatar');assert.equal(f.loads,0);f.button('load').click();await f.settle();assert.equal(f.loads,1);
 f.panel.dispose();const again=fixture(t,f.store);await again.settle();assert.equal(again.list.options.length,1);assert.equal(again.list.options[0].textContent?.startsWith('Copy'),true);
});
test('storage failure preserves previous copies and never loads a replacement',async t=>{
 const f=fixture(t);await f.save();f.store.fail=true;await f.save();assert.equal(f.store.values.size,1);assert.equal(f.loads,0);assert.match(f.host.textContent!,/Nicht abgeschlossen/);
});
test('project change or disposal during storage read prevents loading a stale copy',async t=>{
 for(const dispose of [false,true]){
  const f=fixture(t);await f.save();let release!:(p:StudioProject)=>void;f.store.read=async()=>new Promise(resolve=>{release=resolve;});f.button('load').click();await until(()=>!!release);if(dispose)f.panel.dispose();else f.change();release(project());if(dispose)await new Promise(r=>setTimeout(r,10));else await f.settle();assert.equal(f.loads,0);
 }
});
test('deleting requires confirmation, removes only saved copy and keeps active project',async t=>{
 const f=fixture(t);await f.save();Object.assign(f.w,{confirm:()=>false});f.button('remove').click();assert.equal(f.store.values.size,1);
 Object.assign(f.w,{confirm:()=>true});f.button('remove').click();await f.settle();assert.equal(f.store.values.size,0);assert.equal(f.loads,0);assert.equal(f.source.avatar.name,'My avatar');
});

test('IndexedDB save waits for transaction commit and rejects aborted or full transactions',async()=>{
 for(const mode of ['commit','abort','full','quota']){
  let tx:IDBTransaction|undefined,closed=0,writes=0;
  const factory={open(){const request={} as IDBOpenDBRequest;const database={close(){closed++;},transaction(){
   const transaction={objectStore(){return {count(){const count={result:mode==='full'?50:0} as IDBRequest<number>;queueMicrotask(()=>count.onsuccess?.(new Event('success')));return count;},add(){writes++;}};},abort(){queueMicrotask(()=>transaction.onabort?.(new Event('abort')));}} as unknown as IDBTransaction;
   tx=transaction;return transaction;
  }} as unknown as IDBDatabase;Object.defineProperty(request,'result',{value:database});queueMicrotask(()=>request.onsuccess?.(new Event('success')));return request;}} as unknown as IDBFactory;
  const store=new IndexedDBZoo(factory);let settled=false;const promise=store.add('Copy',project());const outcome=promise.then(value=>{settled=true;return value;},error=>{settled=true;return error as Error;});
  await until(()=>!!tx);if(mode!=='full'){assert.equal(settled,false);assert.equal(writes,2);if(mode==='commit')tx!.oncomplete?.call(tx!,new Event('complete'));else {if(mode==='quota')Object.defineProperty(tx!,'error',{value:new DOMException('Full','QuotaExceededError')});tx!.onabort?.call(tx!,new Event('abort'));}}
  const result=await outcome;if(mode==='commit')assert.ok(!(result instanceof Error));else assert.ok(result instanceof Error);assert.equal(closed,1);if(mode==='full'){assert.equal(writes,0);assert.equal((result as Error).message,'storage-entry-limit');}if(mode==='quota')assert.equal((result as Error).message,'storage-quota-exceeded');
 }
});

test('saved metadata publishes only validated detached identities',()=>{
 const entry=zooSnapshot('Avatar',project()).entry,raw={...entry,secret:'not metadata'};const parsed=parseZooEntries([raw]);assert.deepEqual(parsed,[entry]);parsed[0].name='Changed';assert.equal(raw.name,'Avatar');
 for(const patch of [{id:'pakachi-original'},{name:''},{bytes:Infinity},{createdAt:'invalid'}])assert.throws(()=>parseZooEntries([{...entry,...patch}]));assert.throws(()=>parseZooEntries([entry,entry]));assert.throws(()=>parseZooEntries(Array(51).fill(entry)));
});
test('shared selection loads the exact saved identity and publishes committed list changes',async t=>{
 const f=fixture(t);await f.save();const id=f.list.value;assert.equal(f.notifications.at(-1)![0].id,id);assert.equal(f.panel.load('unknown'),false);assert.equal(f.panel.load(id),true);assert.equal(f.panel.load(id),false,'concurrent shared selection blocked');await f.settle();assert.equal(f.loadedEntries[0].id,id);assert.equal(f.loadedEntries[0].name,'Copy');assert.equal(f.pendingStates.at(-1),false);
 Object.assign(f.w,{confirm:()=>true});f.button('remove').click();await f.settle();assert.deepEqual(f.notifications.at(-1),[]);assert.equal(f.panel.load(id),false);assert.equal(f.loads,1);
});
test('failed list refresh never publishes an unvalidated or late catalog',async t=>{
 const f=fixture(t);await f.save();const count=f.notifications.length;f.store.list=async()=>[{id:'mika',name:'Invalid',bytes:1,createdAt:new Date().toISOString()}];f.button('refresh').click();await f.settle();assert.equal(f.notifications.length,count);
 let release!:(value:ZooEntry[])=>void;f.store.list=()=>new Promise(resolve=>{release=resolve;});f.button('refresh').click();await until(()=>!!release);f.panel.dispose();release([]);await new Promise(r=>setTimeout(r,10));assert.equal(f.notifications.length,count);
});

test('cross-tab notices refresh only metadata, queue behind writes and contain no project data',async t=>{
 let listener:((event:{data:unknown})=>void)|null=null,closed=false;const sent:unknown[]=[];
 class Channel {set onmessage(fn:(event:{data:unknown})=>void){listener=fn;}postMessage(value:unknown){sent.push(value);}close(){closed=true;}}
 const f=fixture(t,new MemoryZoo(),w=>Object.assign(w,{BroadcastChannel:Channel}));await f.save();assert.deepEqual(sent,['changed']);const first=f.list.value;
 await f.store.add('Other tab',project());listener!({data:'changed'});await f.settle();assert.equal(f.list.options.length,2);assert.equal(f.list.value,first);assert.equal(f.loads,0);
 let release!:()=>void;const add=f.store.add.bind(f.store);f.store.add=async(name,p)=>{await new Promise<void>(r=>{release=r;});return add(name,p);};f.button('save').click();await until(()=>!!release);listener!({data:'changed'});release();await f.settle();assert.equal(f.list.options.length,3);assert.equal(f.loads,0);
 f.panel.dispose();assert.equal(closed,true);const count=f.notifications.length;listener!({data:'changed'});assert.equal(f.notifications.length,count);
});
test('focus refresh does not load models and failed writes do not notify other tabs',async t=>{
 const sent:unknown[]=[];class Channel {postMessage(value:unknown){sent.push(value);}close(){}}
 const f=fixture(t,new MemoryZoo(),w=>Object.assign(w,{BroadcastChannel:Channel}));await f.settle();f.store.fail=true;await f.save();assert.deepEqual(sent,[]);f.store.fail=false;await f.store.add('External',project());f.w.dispatchEvent(new f.w.Event('focus'));await f.settle();assert.equal(f.list.options.length,1);assert.equal(f.loads,0);
});

test('specific storage failures preserve copies and the active project',async t=>{
 const f=fixture(t);await f.save();const before=structuredClone([...f.store.values]),notices=f.notifications.length;
 for(const [code,message] of [['storage-quota-exceeded','Browserspeicher voll'],['storage-entry-limit','50 Kopien'],['project-too-large','80 MiB']]){
  f.store.add=async()=>{throw Error(code);};await f.save();assert.match(f.host.textContent!,new RegExp(message));assert.deepEqual([...f.store.values],before);assert.equal(f.loads,0);assert.equal(f.notifications.length,notices);assert.equal(f.button('save').disabled,false);
 }
});
test('committed changes survive failed listing; stale selections stay blocked until refresh',async t=>{
 for(const operation of ['save','remove']){
  const f=fixture(t);await f.save();const id=f.list.value,list=f.store.list.bind(f.store);f.store.list=async()=>{throw Error('read-failed');};
  if(operation==='save')await f.save();else{Object.assign(f.w,{confirm:()=>true});f.button('remove').click();await f.settle();}
  assert.match(f.host.textContent!,operation==='save'?/Kopie gespeichert.*Liste konnte nicht/:/Kopie gelöscht.*Liste konnte nicht/);
  const size=operation==='save'?2:0;assert.equal(f.store.values.size,size);assert.equal(f.button('load').disabled,true);assert.equal(f.button('remove').disabled,true);assert.equal(f.panel.load(id),false);assert.equal(f.loads,0);
  f.store.list=list;f.button('refresh').click();await f.settle();assert.equal(f.list.options.length,size);assert.equal(f.store.values.size,size);assert.equal(f.button('load').disabled,size===0);
 }
});
test('manual refresh failure blocks stale identities and successful refresh restores loading',async t=>{
 const f=fixture(t);await f.save();const id=f.list.value,list=f.store.list.bind(f.store);f.store.list=async()=>{throw Error('read-failed');};f.button('refresh').click();await f.settle();assert.equal(f.panel.load(id),false);assert.equal(f.button('remove').disabled,true);
 f.store.list=list;f.button('refresh').click();await f.settle();assert.equal(f.panel.load(id),true);await f.settle();assert.equal(f.loads,1);
});
