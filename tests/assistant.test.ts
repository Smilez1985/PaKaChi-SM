import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {runAssistant,assistantURL} from '../src/assistant.ts';
import {mountAssistantPanel} from '../src/assistant-panel.ts';
import {saveProviderConfig,emptyProviderConfig} from '../src/ai-providers.ts';
import type {ProviderProfile} from '../src/ai-providers.ts';
const local:ProviderProfile={id:'a',name:'Local',adapter:'ollama',endpoint:'http://localhost:11434',model:'example'};
const cloud:ProviderProfile={...local,adapter:'openai-compatible',endpoint:'https://example.com/v1'};
const info={session:'test',revision:2};
const proposal={...info,expectedRevision:2,action:'set_mode',mode:'pose'};delete (proposal as any).revision;
const response=(message:unknown,ollama=true)=>new Response(JSON.stringify(ollama?{done:true,message}:{choices:[{finish_reason:'tool_calls',message}]}));
const call=(name:string,args:unknown,ollama=true)=>({role:'assistant',content:'',tool_calls:[{id:'c1',type:'function',function:{name,arguments:ollama?args:JSON.stringify(args)}}]});
test('assistant requests a measured automatic skin proposal and returns only its opaque approval command',async()=>{
 const command={session:'test',expectedRevision:2,action:'apply_skin_correction',id:'skin-measured'},methods:string[]=[];let requests=0;
 const result=await runAssistant({profile:local,prompt:'Repair skin automatically',rpc(method,args,signal){methods.push(method);if(method==='get_studio')return info;assert.equal(method,'propose_studio_skin_correction');assert.equal(args?.session,'test');assert.ok(signal);return Promise.resolve({id:command.id,beforeIssues:32,afterIssues:0,checkedMoves:1,motionSamples:17,command});},fetcher:async(_url,init)=>{
  const body=JSON.parse(String(init?.body));if(requests++===0)return response(call('get_studio',{}));if(requests===2)return response(call('propose_studio_skin_correction',{session:'test',expectedRevision:2}));assert.equal(JSON.parse(body.messages.at(-1).content).afterIssues,0);return response(call('edit_studio',{command}));
 }});assert.deepEqual(result.proposal,command);assert.equal(result.reads,2);assert.ok(!methods.includes('edit_studio'));
});
test('assistant awaits real diagnostic tool results before answering, without applying edits',async()=>{
 for(const profile of [local,cloud]){
  const ollama=profile.adapter==='ollama',report={session:'test',revision:2,samples:33,maximumIssues:16,meshes:[{name:'Skin',firstIssue:.25}]};let requests=0,analyses=0;
  const result=await runAssistant({profile,prompt:'Check this move',rpc(method,args,signal){if(method==='get_studio')return info;assert.equal(method,'analyze_studio_surface');assert.equal(args?.id,'wave');assert.ok(signal);analyses++;return new Promise(resolve=>setTimeout(()=>resolve(report),5));},fetcher:async(_url,init)=>{
   const body=JSON.parse(String(init?.body));if(requests===0){requests++;return response(call('get_studio',{section:'moves'},ollama),ollama);}if(requests===1){requests++;return response(call('analyze_studio_surface',{session:'test',expectedRevision:2,kind:'move',id:'wave'},ollama),ollama);}
   assert.deepEqual(JSON.parse(body.messages.at(-1).content),report);return response({role:'assistant',content:'Measured intermediate skin issue.'},ollama);
  }});assert.equal(analyses,1);assert.equal(result.reads,2);assert.equal(result.proposal,undefined);
 }
});
test('diagnostic tool rejects unobserved revisions, stale results and propagates cancellation',async()=>{
 const args={session:'test',expectedRevision:2,kind:'move',id:'wave'};
 await assert.rejects(()=>runAssistant({profile:local,prompt:'x',rpc(){throw Error('Must not run');},fetcher:async()=>response(call('analyze_studio_surface',args))}),/unobserved-revision/);
 let revision=2,requests=0;await assert.rejects(()=>runAssistant({profile:local,prompt:'x',rpc(method){if(method==='get_studio')return {...info,revision};revision=3;return Promise.resolve({samples:17});},fetcher:async()=>response(requests++?call('analyze_studio_surface',args):call('get_studio',{}))}),/stale-studio/);
 const controller=new AbortController();requests=0;let cancelled=false;
 const pending=runAssistant({profile:local,prompt:'x',signal:controller.signal,rpc(method,_args,signal){if(method==='get_studio')return info;controller.abort();cancelled=signal!.aborted;return Promise.resolve({samples:17});},fetcher:async()=>response(requests++?call('analyze_studio_surface',args):call('get_studio',{}))});await assert.rejects(()=>pending,/cancelled/);assert.equal(cancelled,true);
});
test('assistant endpoint preserves prefixes and rejects unsupported adapters',()=>{
 assert.equal(assistantURL(local),'http://localhost:11434/api/chat');assert.equal(assistantURL(cloud),'https://example.com/v1/chat/completions');
 assert.equal(assistantURL({...local,endpoint:'http://localhost/proxy/api'}),'http://localhost/proxy/api/chat');
 assert.throws(()=>assistantURL({...local,adapter:'custom-rigging'}));
});
test('both transports read studio then propose without executing edits; credentials stay in headers',async()=>{
 for(const profile of [local,cloud]){
  const ollama=profile.adapter==='ollama';let requests=0;const methods:string[]=[];
  const result=await runAssistant({profile,prompt:'Pose mode please',token:'test-key',rpc(method){methods.push(method);return info;},fetcher:async(url,init)=>{
   assert.equal(String(url),assistantURL(profile));assert.equal(init?.redirect,'error');assert.equal(init?.credentials,'omit');assert.equal((init?.headers as any).Authorization,'Bearer test-key');assert.ok(!String(init?.body).includes('test-key'));
   const body=JSON.parse(init!.body as string);assert.equal(body.model,'example');assert.equal(body.stream,false);
   if(requests++){assert.equal(body.messages.at(-1).role,'tool');return response(call('edit_studio',{command:proposal},ollama),ollama);}
   return response(call('get_studio',{},ollama),ollama);
  }});
  assert.deepEqual(result.proposal,proposal);assert.equal(requests,2);assert.ok(!methods.includes('edit_studio'));
 }
});
test('unknown tools, bad args, invented revisions and partial responses never execute',async()=>{
 for(const message of [call('shell',{command:'x'}),call('get_state',{extra:true}),call('edit_studio',{command:proposal}),{role:'assistant',content:'x',tool_calls:[{},{}]}]){
  let calls=0;await assert.rejects(runAssistant({profile:local,prompt:'x',rpc(){calls++;},fetcher:async()=>response(message)}));assert.equal(calls,0);
 }
 await assert.rejects(runAssistant({profile:cloud,prompt:'x',rpc(){},fetcher:async()=>new Response(JSON.stringify({choices:[{finish_reason:'length',message:{role:'assistant',content:'partial'}}]}))}),/incomplete/);
});
test('loop budget, changed studio and remote HTTP key are rejected',async()=>{
 let count=0;await assert.rejects(runAssistant({profile:local,prompt:'x',rpc(){return info;},fetcher:async()=>{count++;return response(call('get_studio',{}));}}),/tool-limit/);assert.equal(count,5);
 let revision=2;await assert.rejects(runAssistant({profile:local,prompt:'x',rpc(){return {...info,revision};},fetcher:async()=>{if(revision===2){revision=3;return response(call('get_studio',{}));}revision=4;return response({role:'assistant',content:'done'});}}),/stale-studio/);
 await assert.rejects(runAssistant({profile:{...cloud,endpoint:'http://127.attacker.example/v1'},prompt:'x',token:'secret',rpc(){},fetcher:async()=>{throw new Error('must not fetch');}}),/insecure-token/);
});
test('timeout and abort stop ignored transports before late tools can run',async()=>{
 let release!:(r:Response)=>void,calls=0;const result=runAssistant({profile:local,prompt:'x',timeoutMs:5,rpc(){calls++;},fetcher:()=>new Promise(resolve=>{release=resolve;})});await assert.rejects(result,/timeout/);release(response(call('get_state',{})));await new Promise(r=>setTimeout(r,10));assert.equal(calls,0);
 const controller=new AbortController();controller.abort();await assert.rejects(runAssistant({profile:local,prompt:'x',signal:controller.signal,rpc(){}}),/cancelled/);
});
test('HTTP errors and oversized bodies fail without returning provider secrets',async()=>{
 for(const reply of [new Response('sensitive',{status:401}),new Response('x',{headers:{'content-length':'2000000'}})])await assert.rejects(runAssistant({profile:local,prompt:'x',rpc(){},fetcher:async()=>reply}),error=>error instanceof Error&&!error.message.includes('sensitive'));
});
function setup(){const w=new Window();Object.assign(globalThis,{window:w,document:w.document});const config={...emptyProviderConfig(),profiles:[local],assignments:{assistant:'a',generation:null,rigging:null}};saveProviderConfig(config,w.localStorage);const host=document.createElement('section');document.body.append(host);return {w,host};}
test('assistant skin comparison uses the actual cached proposal and ends preview before applying',async()=>{
 const {w,host}=setup(),events:string[]=[],command={session:'test',expectedRevision:2,action:'apply_skin_correction' as const,id:'skin-measured'};
 const panel=mountAssistantPanel(host,(method)=>{if(method==='edit_studio'){events.push('apply');return {};}return {...info,automaticSkinCorrection:{id:command.id,beforeIssues:32,afterIssues:0}};},()=> 'de',w.localStorage,async()=>({text:'Measured proposal',proposal:command,reads:2}),undefined,(id,corrected,session,revision)=>{assert.equal(id,command.id);assert.equal(session,'test');assert.equal(revision,2);events.push(corrected?'corrected':'original');return()=>{events.push('stop');};});
 host.querySelector<HTMLTextAreaElement>('textarea')!.value='Repair';host.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as unknown as Event);await new Promise(r=>setTimeout(r,0));assert.match(host.querySelector('#assistant-sequence-comparison')!.textContent!,/32 → 0/);
 host.querySelector<HTMLButtonElement>('[data-skin-preview="original"]')!.click();host.querySelector<HTMLButtonElement>('[data-skin-preview="corrected"]')!.click();host.querySelector<HTMLButtonElement>('#assistant-apply')!.click();assert.deepEqual(events,['original','stop','corrected','stop','apply']);panel.dispose();await w.happyDOM.abort();
});
test('panel sends only explicitly, escapes responses, applies once, retains profile key on profile changes',async()=>{
 const {w,host}=setup();let runs=0,edits=0;const panel=mountAssistantPanel(host,()=>{edits++;return {};},()=> 'de',w.localStorage,async()=>{runs++;return {text:'<img src=x>',proposal:proposal as any,reads:1};});
 assert.equal(runs,0);host.querySelector<HTMLTextAreaElement>('textarea')!.value='task';host.querySelector<HTMLInputElement>('input')!.value='secret';host.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as any);await new Promise(r=>setTimeout(r,0));assert.equal(runs,1);assert.equal(host.querySelector('img'),null);assert.equal(edits,0);
 host.querySelector<HTMLButtonElement>('#assistant-apply')!.click();host.querySelector<HTMLButtonElement>('#assistant-apply')!.click();assert.equal(edits,1);w.dispatchEvent(new w.Event('pakachi-providers'));assert.equal(host.querySelector<HTMLInputElement>('input')!.value,'secret');panel.dispose();w.happyDOM.abort();
});
test('profile change invalidates an in-flight answer and pending edit',async()=>{
 const {w,host}=setup();let release!:(r:any)=>void;const panel=mountAssistantPanel(host,()=>{},()=> 'en',w.localStorage,()=>new Promise(resolve=>{release=resolve;}));host.querySelector<HTMLTextAreaElement>('textarea')!.value='task';host.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as any);w.dispatchEvent(new w.Event('pakachi-providers'));release({text:'late',proposal,reads:1});await new Promise(r=>setTimeout(r,0));assert.ok(!host.textContent?.includes('late'));assert.equal(host.querySelector<HTMLButtonElement>('#assistant-apply')!.hidden,true);panel.dispose();w.happyDOM.abort();
});

test('assistant reads a move sequence and returns update_move only as an approval proposal',async()=>{
 const command={session:info.session,expectedRevision:info.revision,action:'update_move',id:'wave',poses:['b','a','b']};let requests=0;const methods:string[]=[];
 const result=await runAssistant({profile:local,prompt:'Reverse and repeat',rpc(method){methods.push(method);return {...info,items:[{id:'wave',poses:['a','b']}]};},fetcher:async(_url,init)=>{
  if(requests++){const body=JSON.parse(String(init?.body));assert.deepEqual(JSON.parse(body.messages.at(-1).content).items[0].poses,['a','b']);return response(call('edit_studio',{command}));}
  return response(call('get_studio',{section:'moves'}));
 }});assert.deepEqual(result.proposal,command);assert.ok(!methods.includes('edit_studio'));
});

test('assistant returns a multi-move transaction for one explicit approval without executing it',async()=>{
 const command={session:info.session,expectedRevision:info.revision,action:'update_moves',updates:[{id:'wave',poses:['b','a']},{id:'nod',poses:['a','b','a']}]};let requests=0;const methods:string[]=[];
 const result=await runAssistant({profile:local,prompt:'Change both moves together',rpc(method){methods.push(method);return {...info,items:[{id:'wave',poses:['a','b']},{id:'nod',poses:['b','a']}]};},fetcher:async()=>response(requests++?call('edit_studio',{command}):call('get_studio',{section:'moves'}))});
 assert.deepEqual(result.proposal,command);assert.ok(!methods.includes('edit_studio'));
});

test('panel shows local before/after rows, applies once and blocks stale sequence comparisons',async()=>{
 for(const stale of [false,true]){
  const {w,host}=setup();let edits=0;const command={session:'test',expectedRevision:2,action:'update_move' as const,id:'wave',poses:['b','a','b']};
  const panel=mountAssistantPanel(host,(method,args)=>{
   if(method==='edit_studio'){edits++;assert.deepEqual(args?.command,command);return {};}
   const data=args?.section==='moves'?[{id:'wave',name:'Wave',poses:['a','b']}]:[{id:'a',name:'Neutral'},{id:'b',name:'Raised'}];return {...info,open:true,revision:stale?3:2,items:data,total:data.length,nextOffset:null};
  },()=> 'en',w.localStorage,async()=>({text:'Proposal',proposal:command,reads:1}));
  host.querySelector<HTMLTextAreaElement>('textarea')!.value='task';host.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as any);await new Promise(r=>setTimeout(r,0));
  const apply=host.querySelector<HTMLButtonElement>('#assistant-apply')!;assert.equal(edits,0);assert.equal(apply.hidden,stale);
  if(!stale){assert.ok(host.querySelector('#assistant-sequence-comparison')!.textContent!.includes('Neutral [a]'));assert.equal(host.querySelectorAll('#assistant-sequence-comparison tbody tr').length,3);apply.click();apply.click();assert.equal(edits,1);assert.equal(host.querySelector('#assistant-sequence-comparison')!.childElementCount,0);}
  else{apply.click();assert.equal(edits,0);}
  panel.dispose();w.happyDOM.abort();
 }
});

test('panel previews before/after locally, stops before applying and cleans up on profile changes',async()=>{
 const {w,host}=setup();const events:string[]=[],command={session:'test',expectedRevision:2,action:'update_move' as const,id:'wave',poses:['b','a']};
 const panel=mountAssistantPanel(host,(method,args)=>{if(method==='edit_studio'){events.push('apply');return {};}
 const items=args?.section==='moves'?[{id:'wave',name:'Wave',poses:['a','b']}]:[{id:'a',name:'A'},{id:'b',name:'B'}];return {...info,open:true,items,total:items.length,nextOffset:null};},()=> 'de',w.localStorage,async()=>({text:'Proposal',proposal:command,reads:1}),(id,poses,session,revision)=>{assert.equal(id,'wave');assert.equal(session,'test');assert.equal(revision,2);events.push(poses.join(','));return ()=>{events.push('stop');};});
 const send=async()=>{host.querySelector<HTMLTextAreaElement>('textarea')!.value='task';host.querySelector('form')!.dispatchEvent(new w.Event('submit',{cancelable:true}) as any);await new Promise(r=>setTimeout(r,0));};await send();assert.deepEqual(events,[]);
 host.querySelector<HTMLButtonElement>('[data-sequence-preview="before"]')!.click();host.querySelector<HTMLButtonElement>('[data-sequence-preview="after"]')!.click();host.querySelector<HTMLButtonElement>('#assistant-apply')!.click();assert.deepEqual(events,['a,b','stop','b,a','stop','apply']);
 await send();host.querySelector<HTMLButtonElement>('[data-sequence-preview="after"]')!.click();w.dispatchEvent(new w.Event('pakachi-providers'));assert.equal(events.at(-1),'stop');assert.equal(host.querySelector('#assistant-preview-stop'),null);panel.dispose();w.happyDOM.abort();
});
