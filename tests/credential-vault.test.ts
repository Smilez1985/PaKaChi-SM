import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encryptVault,decryptVault,saveVault,VAULT_STORAGE_KEY} from '../src/credential-vault.ts';
import {Window} from 'happy-dom';
import {mountCredentialVault} from '../src/credential-vault-panel.ts';
import {emptyProviderConfig,saveProviderConfig} from '../src/ai-providers.ts';
const password='a long private test password';
const profile={id:'a',adapter:'anthropic' as const,endpoint:'https://api.anthropic.com'};
const entry={...profile,token:'test-api-secret'};
test('real Web Crypto round-trip; randomized salt/IV and no plaintext persisted',async()=>{
 const a=await encryptVault([entry],password),b=await encryptVault([entry],password);assert.notEqual(a,b);assert.ok(!a.includes(entry.token));assert.ok(!a.includes(password));assert.deepEqual(await decryptVault(a,password),[entry]);assert.equal(JSON.parse(a).iterations,600000);
});
test('wrong password, altered ciphertext, unsupported versions and oversized inputs fail closed',async()=>{
 const original=await encryptVault([entry],password);await assert.rejects(decryptVault(original,'a different long password'),/unlock-failed/);const parsed=JSON.parse(original);parsed.ciphertext=(parsed.ciphertext[0]==='A'?'B':'A')+parsed.ciphertext.slice(1);await assert.rejects(decryptVault(JSON.stringify(parsed),password));parsed.version=2;await assert.rejects(decryptVault(JSON.stringify(parsed),password));await assert.rejects(decryptVault('x'.repeat(1100001),password));await assert.rejects(encryptVault([entry],'short'));
});
test('saving merges only matching profiles, preserves unknown session keys and honors explicit deletions',async()=>{
 let raw:string|null=await encryptVault([entry,{...entry,id:'removed',token:'obsolete'}],password);const storage={getItem:()=>raw,setItem:(_k:string,v:string)=>{raw=v;}};
 await saveVault([profile],()=>undefined,password,storage);assert.deepEqual(await decryptVault(raw!,password),[entry]);
 await saveVault([profile],()=>'',password,storage);assert.deepEqual(await decryptVault(raw!,password),[]);
 raw=await encryptVault([entry],password);await saveVault([{...profile,endpoint:'https://other.example'}],()=>undefined,password,storage);assert.deepEqual(await decryptVault(raw!,password),[]);
});
test('wrong password, write failures and stale operations preserve existing vault',async()=>{
 const original=await encryptVault([entry],password);let raw=original;const storage={getItem:()=>raw,setItem:(_k:string,v:string)=>{raw=v;}};
 await assert.rejects(saveVault([profile],()=> 'new','wrong password!',storage));assert.equal(raw,original);
 await assert.rejects(saveVault([profile],()=> 'new',password,storage,()=>false),/vault-changed/);assert.equal(raw,original);
 await assert.rejects(saveVault([profile],()=> 'new',password,{getItem:()=>raw,setItem(){throw new Error('quota');}}),/quota/);assert.equal(raw,original);
});
test('vault UI requires matching initial password and clears password fields on close',async()=>{
 const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const dialog=document.createElement('dialog');document.body.append(dialog);saveProviderConfig({...emptyProviderConfig(),profiles:[{...profile,name:'A',model:'test'}]},w.localStorage);
 const dispose=mountCredentialVault(dialog,w.localStorage,()=> 'de',()=>{},()=>{});dialog.querySelector<HTMLInputElement>('#vault-password')!.value=password;dialog.querySelector<HTMLInputElement>('#vault-confirm')!.value='different';dialog.querySelector<HTMLButtonElement>('#vault-save')!.click();await new Promise(r=>setTimeout(r,0));assert.match(dialog.textContent!,/nicht überein/);assert.equal(w.localStorage.getItem(VAULT_STORAGE_KEY),null);
 dialog.querySelector<HTMLInputElement>('#vault-password')!.value=password;dialog.dispatchEvent(new w.Event('close') as unknown as Event);assert.equal(dialog.querySelector<HTMLInputElement>('#vault-password')!.value,'');dispose();w.happyDOM.abort();
});

test('unlock restores a saved profile key after restart without exposing it in configuration',async()=>{
 const {mountProviderPanel}=await import('../src/provider-panel.ts');const {getProviderKey}=await import('../src/provider-credentials.ts');
 const p={...profile,id:'vault-restart',name:'Restored',model:'test'};const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const host=document.createElement('section');document.body.append(host);saveProviderConfig({...emptyProviderConfig(),profiles:[p]},w.localStorage);w.localStorage.setItem(VAULT_STORAGE_KEY,await encryptVault([{id:p.id,adapter:p.adapter,endpoint:p.endpoint,token:'restored-secret'}],password));
 const dispose=mountProviderPanel(host,()=> 'de',w.localStorage);host.querySelector<HTMLButtonElement>('.provider-row button')!.click();host.querySelector<HTMLInputElement>('#vault-password')!.value=password;host.querySelector<HTMLButtonElement>('#vault-unlock')!.click();
 const deadline=Date.now()+5000;while(host.querySelector<HTMLButtonElement>('#vault-unlock')!.disabled&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));
 assert.equal(getProviderKey(p),'restored-secret');assert.equal(host.querySelector<HTMLInputElement>('#provider-token')!.value,'restored-secret');assert.ok(!w.localStorage.getItem('pakachi-providers-v1')!.includes('restored-secret'));assert.equal(host.querySelector<HTMLInputElement>('#vault-password')!.value,'');dispose();w.happyDOM.abort();
});

test('password rotation preserves every stored entry, invalidates old password and rejects stale writes',async()=>{
 const {changeVaultPassword}=await import('../src/credential-vault.ts');const originalEntries=[entry,{...entry,id:'other',token:'another-secret'}];let raw=await encryptVault(originalEntries,password);const storage={getItem:()=>raw,setItem(_k:string,value:string){raw=value;}};const nextPassword='another long vault password';
 await changeVaultPassword(password,nextPassword,storage);assert.deepEqual(await decryptVault(raw,nextPassword),originalEntries);await assert.rejects(decryptVault(raw,password));
 const snapshot=raw;await assert.rejects(changeVaultPassword('wrong long password',password,storage));assert.equal(raw,snapshot);await assert.rejects(changeVaultPassword(nextPassword,password,storage,()=>false));assert.equal(raw,snapshot);
 await assert.rejects(changeVaultPassword(nextPassword,password,{getItem:()=>raw,setItem(){throw new Error('quota');}}));assert.equal(raw,snapshot);
});
test('password change UI rejects mismatched confirmation and wipes new passwords on close',async()=>{
 const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const host=document.createElement('dialog');document.body.append(host);const dispose=mountCredentialVault(host,w.localStorage,()=> 'en',()=>{},()=>{});
 host.querySelector<HTMLInputElement>('#vault-password')!.value=password;host.querySelector<HTMLInputElement>('#vault-new-password')!.value='new long passphrase';host.querySelector<HTMLInputElement>('#vault-new-confirm')!.value='another passphrase';host.querySelector<HTMLButtonElement>('#vault-change-password')!.click();await new Promise(r=>setTimeout(r,0));assert.match(host.textContent!,/Passwords do not match/);assert.equal(w.localStorage.getItem(VAULT_STORAGE_KEY),null);
 host.querySelector<HTMLInputElement>('#vault-new-password')!.value='new long passphrase';host.dispatchEvent(new w.Event('close') as unknown as Event);assert.equal(host.querySelector<HTMLInputElement>('#vault-new-password')!.value,'');dispose();w.happyDOM.abort();
});
