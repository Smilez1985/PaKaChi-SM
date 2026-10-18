import {test} from 'node:test';
import type {TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {zooSnapshot,IndexedDBZoo} from '../src/local-zoo.ts';
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
function fixture(t:TestContext,store=new MemoryZoo()){
 const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const host=document.createElement('div');document.body.append(host);
 let revision=0,loads=0,ready=true;const source=project();
 const panel=mountLocalZoo(host,{ready:()=>ready,canSave:()=>true,target:()=>({session:'one',revision}),capture:()=>structuredClone(source),load:async(p,valid)=>{ready=false;w.dispatchEvent(new w.Event('pakachi-sm:change'));assert.ok(valid(),'own loading status must not invalidate import');parseProject(p);loads++;ready=true;return true;}},()=> 'de',store);
 t.after(()=>{panel.dispose();w.happyDOM.abort();});const button=(id:string)=>host.querySelector<HTMLButtonElement>('#zoo-'+id)!;
 const name=host.querySelector<HTMLInputElement>('#zoo-name')!,list=host.querySelector<HTMLSelectElement>('#zoo-list')!;
 return {store,panel,w,host,name,list,source,button,get loads(){return loads;},change(){revision++;w.dispatchEvent(new w.Event('pakachi-sm:change'));},async settle(){await until(()=>!button('refresh').disabled);},async save(){await this.settle();name.value='Copy';name.dispatchEvent(new w.Event('input') as unknown as Event);button('save').click();await this.settle();}};
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
 for(const mode of ['commit','abort','full']){
  let tx:IDBTransaction|undefined,closed=0,writes=0;
  const factory={open(){const request={} as IDBOpenDBRequest;const database={close(){closed++;},transaction(){
   const transaction={objectStore(){return {count(){const count={result:mode==='full'?50:0} as IDBRequest<number>;queueMicrotask(()=>count.onsuccess?.(new Event('success')));return count;},add(){writes++;}};},abort(){queueMicrotask(()=>transaction.onabort?.(new Event('abort')));}} as unknown as IDBTransaction;
   tx=transaction;return transaction;
  }} as unknown as IDBDatabase;Object.defineProperty(request,'result',{value:database});queueMicrotask(()=>request.onsuccess?.(new Event('success')));return request;}} as unknown as IDBFactory;
  const store=new IndexedDBZoo(factory);let settled=false;const promise=store.add('Copy',project());const outcome=promise.then(value=>{settled=true;return value;},error=>{settled=true;return error as Error;});
  await until(()=>!!tx);if(mode!=='full'){assert.equal(settled,false);assert.equal(writes,2);if(mode==='commit')tx!.oncomplete?.call(tx!,new Event('complete'));else tx!.onabort?.call(tx!,new Event('abort'));}
  const result=await outcome;if(mode==='commit')assert.ok(!(result instanceof Error));else assert.ok(result instanceof Error);assert.equal(closed,1);if(mode==='full')assert.equal(writes,0);
 }
});
