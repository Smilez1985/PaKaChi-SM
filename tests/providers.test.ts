import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {emptyProviderConfig,parseProviderConfig,saveProviderConfig,readProviderConfig,removeProviderProfile,ProviderRegistry,PROVIDER_STORAGE_KEY} from '../src/ai-providers.ts';
import type {ProviderConfig,ProviderProfile} from '../src/ai-providers.ts';
import {mountProviderPanel} from '../src/provider-panel.ts';

const profile=(id:string):ProviderProfile=>({id,name:id,adapter:'ollama',endpoint:'http://localhost:11434',model:'test-model'});
function fixture():ProviderConfig {return {...emptyProviderConfig(),profiles:[profile('a'),profile('b'),profile('c')],assignments:{assistant:'a',generation:'b',rigging:'c'}};}
test('independent assignments survive persistence; deleting a shared profile only clears affected roles',()=>{
 let raw='';const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
 const config=fixture();saveProviderConfig(config,storage);assert.deepEqual(readProviderConfig(storage).config,config);
 config.assignments.rigging='a';const next=removeProviderProfile(config,'a');
 assert.deepEqual(next.assignments,{assistant:null,generation:'b',rigging:null});assert.equal(config.profiles.length,3);
 assert.equal(readProviderConfig({getItem:()=>'{broken'}).error,true);
 assert.throws(()=>saveProviderConfig(config,{setItem(){throw new Error('quota');}}),/quota/);
});
test('invalid references, duplicate IDs, secrets and credential URLs are rejected',()=>{
 for(const endpoint of ['javascript:alert(1)','https://name:password@example.com','https://example.com?token=secret','https://example.com#secret']){
  const config=fixture();config.profiles[0].endpoint=endpoint;assert.throws(()=>parseProviderConfig(config));
 }
 assert.throws(()=>parseProviderConfig({...fixture(),apiKey:'secret'}));
 assert.throws(()=>parseProviderConfig({...fixture(),profiles:[{...profile('a'),apiKey:'secret'}]}));
 const duplicate=fixture();duplicate.profiles[1].id='a';assert.throws(()=>parseProviderConfig(duplicate));
 const missing=fixture();missing.assignments.rigging='missing';assert.throws(()=>parseProviderConfig(missing));
 const normalize=fixture();normalize.profiles[0].endpoint=' http://localhost:11434/ ';assert.equal(parseProviderConfig(normalize).profiles[0].endpoint,'http://localhost:11434');
});
test('registry rejects unavailable adapters and unsuitable models without fallback; abort is respected',async()=>{
 const registry=new ProviderRegistry(),config=fixture(),signal=new AbortController().signal;
 await assert.rejects(registry.resolve(config,'assistant',signal),{message:'adapter-missing'});
 let calls=0;registry.register({id:'ollama',async probe(p){calls++;return {model:p.model,capabilities:['tool-calling']};}});
 assert.equal((await registry.resolve(config,'assistant',signal)).id,'a');
 await assert.rejects(registry.resolve(config,'rigging',signal),{message:'unsupported-role'});
 assert.equal(calls,2);assert.throws(()=>registry.register({id:'ollama',async probe(p){return {model:p.model,capabilities:[]};}}),/duplicate-adapter/);
 const controller=new AbortController();controller.abort();await assert.rejects(registry.resolve(config,'assistant',controller.signal));assert.equal(calls,2);
 const mismatch=new ProviderRegistry();mismatch.register({id:'ollama',async probe(){return {model:'another-model',capabilities:['tool-calling']};}});
 await assert.rejects(mismatch.resolve(config,'assistant',signal),{message:'unsupported-model'});
 await assert.rejects(registry.resolve(emptyProviderConfig(),'assistant',signal),{message:'unassigned'});
});
function setup(){const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const host=document.createElement('section');document.body.append(host);return {w,host};}
test('profile UI adds, edits and assigns three profiles, preserves drafts on language change and removes assignments',()=>{
 const {w,host}=setup();let language:'de'|'en'='de';const dispose=mountProviderPanel(host,()=>language,w.localStorage);
 const input=(id:string,value:string)=>{host.querySelector<HTMLInputElement>(`#${id}`)!.value=value;};
 const submit=()=>host.querySelector('form')!.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}) as unknown as Event);
 for(const name of ['Alpha','Beta','<b>Gamma</b>']){input('provider-name',name);input('provider-endpoint','http://localhost:11434');input('provider-model','test-model');submit();}
 assert.equal(host.querySelectorAll('.provider-row').length,3);assert.equal(host.querySelector('.provider-row b'),null);
 const saved=readProviderConfig(w.localStorage).config;
 for(const [i,role] of ['assistant','generation','rigging'].entries()){
  const select=host.querySelector<HTMLSelectElement>(`#provider-role-${role}`)!;select.value=saved.profiles[i].id;select.dispatchEvent(new w.Event('change') as unknown as Event);
 }
 assert.deepEqual(readProviderConfig(w.localStorage).config.assignments,{assistant:saved.profiles[0].id,generation:saved.profiles[1].id,rigging:saved.profiles[2].id});
 host.querySelector<HTMLButtonElement>('.provider-row button')!.click();input('provider-name','Draft');language='en';w.dispatchEvent(new w.Event('pakachi-options'));
 assert.equal(host.querySelector<HTMLInputElement>('#provider-name')!.value,'Draft');assert.match(host.textContent!,/Save changes/);submit();
 assert.equal(readProviderConfig(w.localStorage).config.profiles.find(p=>p.id===saved.profiles[0].id)!.name,'Draft');
 const row=Array.from(host.querySelectorAll('.provider-row')).find(row=>row.textContent!.includes('Draft'))!;
 row.querySelectorAll<HTMLButtonElement>('button')[1].click();assert.equal(readProviderConfig(w.localStorage).config.assignments.assistant,null);
 assert.match(host.textContent!,/not connected yet/);dispose();w.happyDOM.abort();
});
test('failed UI persistence keeps the draft and previously saved assignments',()=>{
 const {w,host}=setup(),raw=JSON.stringify(fixture());
 const dispose=mountProviderPanel(host,()=> 'de',{getItem:()=>raw,setItem(){throw new Error('denied');}});
 const select=host.querySelector<HTMLSelectElement>('#provider-role-assistant')!;select.value='b';select.dispatchEvent(new w.Event('change') as unknown as Event);
 assert.equal(host.querySelector<HTMLSelectElement>('#provider-role-assistant')!.value,'a');assert.match(host.textContent!,/Speichern nicht möglich/);
 host.querySelector<HTMLButtonElement>('.provider-row button')!.click();host.querySelector<HTMLInputElement>('#provider-name')!.value='Unsaved';
 host.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as unknown as Event);
 assert.equal(host.querySelector<HTMLInputElement>('#provider-name')!.value,'Unsaved');assert.equal(JSON.parse(raw).profiles[0].name,'a');
 assert.equal(w.localStorage.getItem(PROVIDER_STORAGE_KEY),null);dispose();w.happyDOM.abort();
});
