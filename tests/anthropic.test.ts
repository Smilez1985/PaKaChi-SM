import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runAssistant,assistantURL} from '../src/assistant.ts';
import {discoverModels,modelListURL} from '../src/provider-discovery.ts';
import {anthropicResponse} from '../src/anthropic.ts';
import {parseProviderConfig,emptyProviderConfig} from '../src/ai-providers.ts';
import type {ProviderProfile} from '../src/ai-providers.ts';
const profile:ProviderProfile={id:'claude',name:'Cloud',adapter:'anthropic',endpoint:'https://api.anthropic.com',model:'user-selected-model'};
const tool=(name:string,input:unknown)=>({type:'tool_use',id:'tool_1',name,input});
const reply=(content:unknown[],stop_reason='tool_use')=>({type:'message',role:'assistant',stop_reason,content});
test('Anthropic profiles stay independently assignable to every role; endpoints preserve configured prefixes',()=>{
 const config={...emptyProviderConfig(),profiles:[profile],assignments:{assistant:'claude',generation:'claude',rigging:'claude'}};
 assert.deepEqual(parseProviderConfig(config),config);
 assert.equal(modelListURL(profile),'https://api.anthropic.com/v1/models');assert.equal(assistantURL(profile),'https://api.anthropic.com/v1/messages');
 assert.equal(assistantURL({...profile,endpoint:'https://example.com/proxy/v1'}),'https://example.com/proxy/v1/messages');
});
test('native model list uses API key headers and requires a complete bounded result',async()=>{
 const models=await discoverModels(profile,{token:'test-secret',fetcher:async(url,init)=>{
  assert.equal(String(url),'https://api.anthropic.com/v1/models?limit=1000');const h=init?.headers as Record<string,string>;assert.equal(h['x-api-key'],'test-secret');assert.equal(h.Authorization,undefined);assert.equal(h['anthropic-version'],'2023-06-01');assert.equal(h['anthropic-dangerous-direct-browser-access'],'true');
  return new Response(JSON.stringify({data:[{id:'b'},{id:'a'}],has_more:false}));
 }});assert.deepEqual(models,['a','b']);
 await assert.rejects(discoverModels(profile,{fetcher:async()=>new Response(JSON.stringify({data:[{id:'a'}],has_more:true}))}),/invalid-response/);
});
test('Messages request and tool results preserve native blocks; edit remains a proposal',async()=>{
 let requests=0;const methods:string[]=[];const thinking={type:'thinking',thinking:'opaque internal reasoning',signature:'signature'};
 const command={session:'s',expectedRevision:1,action:'set_mode',mode:'pose'};
 const result=await runAssistant({profile,prompt:'Pose',token:'secret',rpc(method){methods.push(method);return {session:'s',revision:1};},fetcher:async(url,init)=>{
  assert.equal(String(url),'https://api.anthropic.com/v1/messages');const body=JSON.parse(init!.body as string);assert.equal(body.model,profile.model);assert.equal(typeof body.system,'string');assert.equal(body.messages[0].role,'user');assert.equal(body.parallel_tool_calls,undefined);assert.equal(body.tool_choice.disable_parallel_tool_use,true);assert.ok(body.tools[0].input_schema);assert.ok(!body.tools[0].function);assert.ok(!String(init!.body).includes('secret'));
  if(requests++===0)return new Response(JSON.stringify(reply([thinking,tool('get_studio',{})])));
  assert.deepEqual(body.messages[1].content[0],thinking);assert.equal(body.messages[2].role,'user');assert.equal(body.messages[2].content[0].type,'tool_result');assert.equal(body.messages[2].content[0].tool_use_id,'tool_1');
  return new Response(JSON.stringify(reply([{type:'text',text:'Vorschlag'},tool('edit_studio',{command})])));
 }});
 assert.equal(result.text,'Vorschlag');assert.deepEqual(result.proposal,command);assert.ok(!methods.includes('edit_studio'));assert.equal(requests,2);
});
test('partial, malformed, parallel and mismatched native responses are rejected',()=>{
 for(const raw of [reply([tool('get_state',{})],'max_tokens'),reply([tool('get_state',{}),tool('get_state',{})]),reply([tool('get_state',{})],'end_turn'),reply([{type:'image',source:{}}],'end_turn'),reply([{type:'tool_use',id:'x',name:'get_state',input:'{}'}]),reply([])])assert.throws(()=>anthropicResponse(raw));
 assert.equal(anthropicResponse(reply([{type:'text',text:'Hello'}],'end_turn')).content,'Hello');
});
test('native tool failures are represented as is_error without leaking raw RPC errors',async()=>{
 let round=0;const result=await runAssistant({profile,prompt:'Read studio',rpc(){throw new Error('internal secret');},fetcher:async(_url,init)=>{
  if(round++===0)return new Response(JSON.stringify(reply([tool('get_studio',{})])));
  const body=JSON.parse(init!.body as string);assert.equal(body.messages[2].content[0].is_error,true);assert.ok(!String(init!.body).includes('internal secret'));
  return new Response(JSON.stringify(reply([{type:'text',text:'Open studio first.'}],'end_turn')));
 }});assert.equal(result.text,'Open studio first.');
});
