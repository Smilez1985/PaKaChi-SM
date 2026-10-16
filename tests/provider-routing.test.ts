import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {emptyProviderConfig,parseProviderConfig,providerRoute,removeProviderProfile,saveProviderConfig,readProviderConfig} from '../src/ai-providers.ts';
import {getProviderKey,setProviderKey,forgetProviderKeys} from '../src/provider-credentials.ts';
import {runAssistantRoute} from '../src/assistant-routing.ts';
import {mountProviderPanel} from '../src/provider-panel.ts';
const profiles=['primary','second','third'].map(id=>({id,name:id,adapter:'ollama' as const,endpoint:'http://localhost:11434',model:id}));
const config=()=>({...emptyProviderConfig(),profiles,assignments:{assistant:'primary',generation:'third',rigging:'second'},fallbacks:{assistant:['second','third'],generation:['primary'],rigging:[]}});
test('independent ordered routes round-trip; legacy profiles remain valid; deleting one profile preserves others',()=>{
 assert.equal(parseProviderConfig(emptyProviderConfig()).fallbacks,undefined);const c=config();assert.deepEqual(providerRoute(c,'assistant').map(p=>p.id),['primary','second','third']);assert.deepEqual(providerRoute(c,'generation').map(p=>p.id),['third','primary']);
 let raw='';saveProviderConfig(c,{setItem(_k,v){raw=v;}});assert.deepEqual(readProviderConfig({getItem:()=>raw}).config,c);
 assert.deepEqual(removeProviderProfile(c,'second').fallbacks?.assistant,['third']);
 for(const ids of [['second','second'],['missing'],['primary']])assert.throws(()=>parseProviderConfig({...c,fallbacks:{...c.fallbacks,assistant:ids}}));
});
test('profile keys coexist and are bound to exact destination; explicit deletion affects only one',()=>{
 setProviderKey(profiles[0],'one');setProviderKey(profiles[1],'two');assert.equal(getProviderKey(profiles[0]),'one');assert.equal(getProviderKey({...profiles[0],endpoint:'https://elsewhere.example'}),'');forgetProviderKeys('primary');assert.equal(getProviderKey(profiles[0]),'');assert.equal(getProviderKey(profiles[1]),'two');forgetProviderKeys('second');
});
test('assistant fallback follows configured order and key snapshot, returning actual provider',async()=>{
 const calls:string[]=[];const result=await runAssistantRoute(config(),{prompt:'task',rpc(){}},p=>`key-${p.id}`,async input=>{calls.push(input.profile.id);assert.equal(input.token,`key-${input.profile.id}`);if(input.profile.id==='primary')throw new Error('unauthorized');return {text:'ok',reads:0};});assert.deepEqual(calls,['primary','second']);assert.equal(result.profile.id,'second');
});
test('cancellation and studio/protocol conflicts never trigger fallback',async()=>{
 for(const message of ['cancelled','stale-studio','invalid-tool','unobserved-revision']){let calls=0;await assert.rejects(runAssistantRoute(config(),{prompt:'task',rpc(){}},()=>'',async()=>{calls++;throw new Error(message);}));assert.equal(calls,1);}
 const controller=new AbortController();let calls=0;await assert.rejects(runAssistantRoute(config(),{prompt:'task',rpc(){},signal:controller.signal},()=>'',async()=>{calls++;controller.abort();throw new Error('network');}));assert.equal(calls,1);
});
test('UI keeps keys and models across profile visits and orders independent fallbacks',()=>{
 const w=new Window();Object.assign(globalThis,{window:w,document:w.document});saveProviderConfig(config(),w.localStorage);const host=document.createElement('section');document.body.append(host);const dispose=mountProviderPanel(host,()=> 'de',w.localStorage);
 const edit=(index:number)=>host.querySelectorAll<HTMLButtonElement>('.provider-row')[index].querySelector<HTMLButtonElement>('button')!.click();
 edit(0);host.querySelector<HTMLInputElement>('#provider-token')!.value='first-key';host.querySelector<HTMLInputElement>('#provider-model')!.value='draft-model';edit(1);host.querySelector<HTMLInputElement>('#provider-token')!.value='second-key';edit(0);assert.equal(host.querySelector<HTMLInputElement>('#provider-token')!.value,'first-key');assert.equal(host.querySelector<HTMLInputElement>('#provider-model')!.value,'draft-model');edit(1);assert.equal(host.querySelector<HTMLInputElement>('#provider-token')!.value,'second-key');
 const up=host.querySelectorAll<HTMLOListElement>('ol[data-role="assistant"] li')[1].querySelector<HTMLButtonElement>('button')!;up.click();assert.deepEqual(readProviderConfig(w.localStorage).config.fallbacks?.assistant,['third','second']);assert.deepEqual(readProviderConfig(w.localStorage).config.fallbacks?.generation,['primary']);assert.doesNotMatch(w.localStorage.getItem('pakachi-providers-v1')!,/first-key|second-key/);dispose();w.happyDOM.abort();profiles.forEach(p=>forgetProviderKeys(p.id));
});
