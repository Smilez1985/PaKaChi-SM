import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import type {AddressInfo} from 'node:net';
import {Window} from 'happy-dom';
import {discoverModels,modelListURL,DiscoveryError} from '../src/provider-discovery.ts';
import {mountDiscoveryPanel} from '../src/provider-discovery-panel.ts';
import {mountProviderPanel} from '../src/provider-panel.ts';

const conn={adapter:'ollama' as const,endpoint:'http://localhost:11434'};
const fake=(fn:(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>)=>fn as typeof fetch;
test('model routes preserve explicit API prefixes and reject credentials or unsupported services',()=>{
 assert.equal(modelListURL(conn),'http://localhost:11434/api/tags');
 assert.equal(modelListURL({...conn,endpoint:'http://localhost:11434/ollama/api/'}),'http://localhost:11434/ollama/api/tags');
 assert.equal(modelListURL({adapter:'lmstudio',endpoint:'http://localhost:1234'}),'http://localhost:1234/v1/models');
 assert.equal(modelListURL({adapter:'openai-compatible',endpoint:'https://example.test/gateway/v1/'}),'https://example.test/gateway/v1/models');
 for(const endpoint of ['https://user:password@example.test','https://example.test?token=x','file:///secret'])assert.throws(()=>modelListURL({...conn,endpoint}),{message:'invalid-endpoint'});
 assert.throws(()=>modelListURL({...conn,adapter:'custom-rigging'}),{message:'unsupported-adapter'});
});
test('real HTTP fixture serves Ollama and compatible model lists, and receives only the explicit bearer token',async()=>{
 const requests:{path?:string;token?:string;cookie?:string;method?:string}[]=[];
 const server=createServer((req,res)=>{requests.push({path:req.url,token:req.headers.authorization,cookie:req.headers.cookie,method:req.method});res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url==='/api/tags'?{models:[{name:'z-model'},{name:'a-model'},{name:'a-model'}]}:{data:[{id:'chat-model'},{id:'embedding-model'}]}));});
 server.listen(0,'127.0.0.1');await once(server,'listening');const endpoint=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 try{
  assert.deepEqual(await discoverModels({...conn,endpoint}),['a-model','z-model']);
  assert.deepEqual(await discoverModels({adapter:'lmstudio',endpoint},{token:'test-fixture-key'}),['chat-model','embedding-model']);
  assert.deepEqual(requests,[{path:'/api/tags',token:undefined,cookie:undefined,method:'GET'},{path:'/v1/models',token:'Bearer test-fixture-key',cookie:undefined,method:'GET'}]);
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
test('request policy disables cookies, redirects and caching; token is forbidden on remote HTTP',async()=>{
 let calls=0;const fetcher=fake(async(_url,init)=>{calls++;assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');assert.equal(init?.cache,'no-store');assert.equal(init?.referrerPolicy,'no-referrer');return Response.json({models:[]});});
 assert.deepEqual(await discoverModels(conn,{fetcher}),[]);
 await assert.rejects(discoverModels({...conn,endpoint:'http://example.test'},{token:'test-key',fetcher}),{message:'insecure-token'});
 await assert.rejects(discoverModels({...conn,endpoint:'http://127.attacker.example'},{token:'test-key',fetcher}),{message:'insecure-token'});
 await assert.rejects(discoverModels(conn,{token:'bad\nkey',fetcher}),{message:'invalid-token'});assert.equal(calls,1);
});
test('HTTP and response errors are bounded, sanitized and never retried',async()=>{
 for(const [status,code] of [[401,'unauthorized'],[403,'unauthorized'],[404,'not-found'],[429,'rate-limited'],[500,'http-error']] as const){let calls=0;await assert.rejects(discoverModels(conn,{fetcher:fake(async()=>{calls++;return new Response('secret server details',{status});})}),{message:code});assert.equal(calls,1);}
 for(const body of ['<html>secret</html>',JSON.stringify({models:[{name:5}]}),JSON.stringify({data:[]}),JSON.stringify({models:Array.from({length:1001},()=>({name:'x'}))})])await assert.rejects(discoverModels(conn,{fetcher:fake(async()=>new Response(body))}),{message:'invalid-response'});
 await assert.rejects(discoverModels(conn,{fetcher:fake(async()=>new Response(' '.repeat(1024*1024+1)))}),{message:'response-too-large'});
 await assert.rejects(discoverModels(conn,{fetcher:fake(async()=>{throw new Error('secret network detail');})}),{message:'network'});
});
test('timeout and external cancellation settle even if transport ignores abort',async()=>{
 const fetcher=fake(()=>new Promise<Response>(()=>{}));
 await assert.rejects(discoverModels(conn,{fetcher,timeoutMs:10}),{message:'timeout'});
 const controller=new AbortController(),pending=discoverModels(conn,{fetcher,signal:controller.signal});controller.abort();await assert.rejects(pending,{message:'cancelled'});
 let calls=0;await assert.rejects(discoverModels(conn,{signal:controller.signal,fetcher:fake(async()=>{calls++;return Response.json({models:[]});})}),{message:'cancelled'});assert.equal(calls,0);
});
function dom(){const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const host=document.createElement('div');document.body.append(host);return {w,host};}
test('discovery UI invalidates late replies, clears tokens and keeps model IDs on language change',async()=>{
 const {w,host}=dom();let language:'de'|'en'='de',resolve!:(models:string[])=>void,chosen='';
 const panel=mountDiscoveryPanel(host,()=>conn,()=>language,id=>{chosen=id;},async()=>new Promise<string[]>(r=>{resolve=r;}));
 const token=host.querySelector<HTMLInputElement>('#provider-token')!;token.value='session-key';
 host.querySelector<HTMLButtonElement>('#provider-discover')!.click();panel.invalidate();assert.equal(token.value,'');resolve(['obsolete']);await w.happyDOM.whenAsyncComplete();assert.doesNotMatch(host.textContent!,/obsolete/);
 host.querySelector<HTMLButtonElement>('#provider-discover')!.click();resolve(['<b>model</b>']);await w.happyDOM.whenAsyncComplete();assert.equal(host.querySelector('b'),null);
 const select=host.querySelector<HTMLSelectElement>('#provider-model-list')!;select.value='<b>model</b>';select.dispatchEvent(new w.Event('change') as unknown as Event);assert.equal(chosen,'<b>model</b>');
 language='en';panel.render();assert.match(host.textContent!,/capabilities have not been checked/);assert.equal(select.value,'<b>model</b>');panel.dispose();w.happyDOM.abort();
});
test('dialog close clears token; editing endpoints and saving profiles never persists credentials',()=>{
 const {w,host}=dom(),dialog=document.createElement('dialog');host.append(dialog);const panelHost=document.createElement('section');dialog.append(panelHost);
 const dispose=mountProviderPanel(panelHost,()=> 'de',w.localStorage);
 const input=(id:string,value:string)=>{panelHost.querySelector<HTMLInputElement>(`#${id}`)!.value=value;};
 input('provider-token','close-secret');dialog.dispatchEvent(new w.Event('close') as unknown as Event);assert.equal(panelHost.querySelector<HTMLInputElement>('#provider-token')!.value,'');
 input('provider-name','Profile');input('provider-endpoint','http://localhost:11434');input('provider-model','model');input('provider-token','save-secret');
 panelHost.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as unknown as Event);assert.doesNotMatch(w.localStorage.getItem('pakachi-providers-v1')!,/secret|token/);assert.equal(panelHost.querySelector<HTMLInputElement>('#provider-token')!.value,'');
 input('provider-token','change-secret');panelHost.querySelector('#provider-endpoint')!.dispatchEvent(new w.Event('input') as unknown as Event);assert.equal(panelHost.querySelector<HTMLInputElement>('#provider-token')!.value,'');dispose();w.happyDOM.abort();
});
test('discovery UI displays sanitized errors and supports explicit cancellation',async()=>{
 const {w,host}=dom();const panel=mountDiscoveryPanel(host,()=>conn,()=> 'de',()=>{},async()=>{throw new DiscoveryError('unauthorized');});
 host.querySelector<HTMLButtonElement>('#provider-discover')!.click();await w.happyDOM.whenAsyncComplete();assert.match(host.textContent!,/401\/403/);panel.dispose();host.replaceChildren();
 const next=mountDiscoveryPanel(host,()=>conn,()=> 'de',()=>{},async()=>new Promise<string[]>(()=>{}));host.querySelector<HTMLButtonElement>('#provider-discover')!.click();host.querySelector<HTMLButtonElement>('#provider-discovery-cancel')!.click();assert.match(host.textContent!,/Abgebrochen/);assert.equal(host.querySelector<HTMLButtonElement>('#provider-discover')!.disabled,false);next.dispose();w.happyDOM.abort();
});
