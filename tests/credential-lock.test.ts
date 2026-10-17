import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {mountProviderPanel} from '../src/provider-panel.ts';
import {mountAssistantPanel} from '../src/assistant-panel.ts';
import {getProviderKey,setProviderKey,lockProviderSession} from '../src/provider-credentials.ts';
import {saveProviderConfig,emptyProviderConfig} from '../src/ai-providers.ts';
import {encryptVault,VAULT_STORAGE_KEY} from '../src/credential-vault.ts';
const profile={id:'lock-test',name:'Local',adapter:'ollama' as const,endpoint:'http://localhost:11434',model:'model'};
const password='private vault password';
function setup(){const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const dialog=document.createElement('dialog');document.body.append(dialog);saveProviderConfig({...emptyProviderConfig(),profiles:[profile],assignments:{assistant:profile.id,generation:null,rigging:null}},w.localStorage);return {w,dialog};}
test('lock clears profile keys, draft tokens and password fields but preserves models, profiles and encrypted vault',()=>{
 const {w,dialog}=setup();setProviderKey(profile,'stored-key');w.localStorage.setItem(VAULT_STORAGE_KEY,'unchanged-ciphertext');const before=w.localStorage.getItem('pakachi-providers-v1');const dispose=mountProviderPanel(dialog,()=> 'de',w.localStorage);dialog.querySelector<HTMLButtonElement>('.provider-row button')!.click();
 const adapter=dialog.querySelector<HTMLSelectElement>('#provider-adapter')!;adapter.value='anthropic';adapter.dispatchEvent(new w.Event('change') as any);dialog.querySelector<HTMLInputElement>('#provider-token')!.value='draft-secret';adapter.value='ollama';adapter.dispatchEvent(new w.Event('change') as any);dialog.querySelector<HTMLInputElement>('#vault-password')!.value=password;
 dialog.querySelector<HTMLButtonElement>('#vault-lock')!.click();assert.equal(getProviderKey(profile),'');assert.equal(dialog.querySelector<HTMLInputElement>('#provider-token')!.value,'');assert.equal(dialog.querySelector<HTMLInputElement>('#vault-password')!.value,'');assert.equal(dialog.querySelector<HTMLInputElement>('#provider-model')!.value,'model');adapter.value='anthropic';adapter.dispatchEvent(new w.Event('change') as any);assert.equal(dialog.querySelector<HTMLInputElement>('#provider-token')!.value,'');assert.equal(w.localStorage.getItem('pakachi-providers-v1'),before);assert.equal(w.localStorage.getItem(VAULT_STORAGE_KEY),'unchanged-ciphertext');dispose();w.happyDOM.abort();
});
test('lock aborts in-flight assistant and discards late proposals',async()=>{
 const {w,dialog}=setup();setProviderKey(profile,'key');let release!:(value:any)=>void,signal:AbortSignal|undefined;const panel=mountAssistantPanel(dialog,()=>{},()=> 'en',w.localStorage,async input=>{signal=input.signal;return new Promise(resolve=>{release=resolve;});});dialog.querySelector<HTMLTextAreaElement>('#assistant-prompt')!.value='task';dialog.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as any);lockProviderSession();assert.equal(signal?.aborted,true);assert.equal(dialog.querySelector<HTMLInputElement>('#assistant-key')!.value,'');release({text:'late secret answer',reads:0,proposal:{session:'s',expectedRevision:1,action:'undo'}});await new Promise(r=>setTimeout(r,0));assert.ok(!dialog.textContent!.includes('late secret answer'));assert.equal(dialog.querySelector<HTMLButtonElement>('#assistant-apply')!.hidden,true);panel.dispose();w.happyDOM.abort();
});
test('lock invalidates a pending unlock; a later explicit unlock restores saved keys',async()=>{
 const {w,dialog}=setup();lockProviderSession();w.localStorage.setItem(VAULT_STORAGE_KEY,await encryptVault([{id:profile.id,adapter:profile.adapter,endpoint:profile.endpoint,token:'encrypted-key'}],password));const dispose=mountProviderPanel(dialog,()=> 'en',w.localStorage);const unlock=dialog.querySelector<HTMLButtonElement>('#vault-unlock')!;
 dialog.querySelector<HTMLInputElement>('#vault-password')!.value=password;unlock.click();lockProviderSession();await new Promise(r=>setTimeout(r,500));assert.equal(getProviderKey(profile),'');
 dialog.querySelector<HTMLInputElement>('#vault-password')!.value=password;unlock.click();const deadline=Date.now()+5000;while(unlock.disabled&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));assert.equal(getProviderKey(profile),'encrypted-key');dispose();lockProviderSession();w.happyDOM.abort();
});
