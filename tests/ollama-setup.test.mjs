import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CURATED_MODELS,GiB,parseNvidia,planModel} from '../scripts/ollama-hardware.mjs';
import {registryURL,manifestInfo,pullModel,validateLocalModel} from '../scripts/setup-ollama.mjs';
const hardware=()=>({ramFreeBytes:32*GiB,diskFreeBytes:100*GiB,gpuStatus:'measured-nvidia',gpus:[{totalBytes:16*GiB,freeBytes:15*GiB}]});
test('hardware parsing uses actual dedicated free VRAM and rejects incomplete telemetry',()=>{
 assert.deepEqual(parseNvidia('GPU-abc, NVIDIA Example, 16384, 8192\n'),[{uuid:'GPU-abc',name:'NVIDIA Example',totalBytes:16*GiB,freeBytes:8*GiB}]);
 for(const bad of ['GPU-x, Name, 16384, N/A','GPU-x, Name, 10, 11','unknown, Name, 10, 5'])assert.throws(()=>parseNvidia(bad));
});
test('32 GiB model is never offered on 16 GiB VRAM; RAM is not added to VRAM',()=>{
 const model={tag:'custom:32b',maxWeightGiB:32,runtimeGiB:4};const h=hardware();h.ramFreeBytes=256*GiB;
 const plan=planModel(h,model,32*GiB);assert.equal(plan.eligible,false);assert.match(plan.reasons.join(' '),/VRAM/);
 const small=CURATED_MODELS[0];assert.equal(planModel(h,small,3.3e9).eligible,true);h.gpus[0].freeBytes=4*GiB;assert.equal(planModel(h,small,3.3e9).eligible,false);
});
test('unknown or multiple GPUs, RAM pressure and unknown disk prevent automatic selection; CPU is explicit',()=>{
 const small=CURATED_MODELS[0],h=hardware();h.gpuStatus='unknown';h.gpus=[];
 assert.equal(planModel(h,small,3.3e9).eligible,false);assert.equal(planModel(h,small,3.3e9,{cpu:true}).eligible,true);
 h.ramFreeBytes=4*GiB;assert.equal(planModel(h,small,3.3e9,{cpu:true}).eligible,false);
 const disk=hardware();disk.diskFreeBytes=null;assert.equal(planModel(disk,small,3.3e9).eligible,false);
 const multi=hardware();multi.gpus.push({...multi.gpus[0]});assert.equal(planModel(multi,small,3.3e9).eligible,false);
});
test('registry preflight counts model and projector layers and rejects unverified metadata',async()=>{
 assert.equal(registryURL('qwen3.5:4b-q4_K_M'),'https://registry.ollama.ai/v2/library/qwen3.5/manifests/4b-q4_K_M');assert.throws(()=>registryURL('https://example.org/model'));assert.throws(()=>registryURL('model:cloud'));
 const digest='sha256:'+'a'.repeat(64),manifest={schemaVersion:2,layers:[{size:100,digest},{size:20,digest}],config:{size:3,digest}};
 const info=await manifestInfo('test:model',async()=>Response.json(manifest));assert.equal(info.bytes,123);assert.match(info.digest,/^[0-9a-f]{64}$/);
 await assert.rejects(manifestInfo('test:model',async()=>Response.json({...manifest,layers:[{size:'unknown',digest}]})),/Modellgrößen/);
});
test('pull requires a success event and never silently accepts an interrupted stream',async()=>{
 let count=0;const fetcher=async(url,options)=>{count++;assert.equal(url,'http://127.0.0.1:11434/api/pull');assert.deepEqual(JSON.parse(options.body),{model:'test:model',stream:true});return new Response('{"status":"pulling","completed":5,"total":10}\n{"status":"success"}\n');};
 const progress=[];await pullModel('test:model',{fetcher,onProgress:p=>progress.push(p)});assert.equal(count,1);assert.equal(progress[0].percent,50);
 await assert.rejects(pullModel('test:model',{fetcher:async()=>new Response('{"status":"pulling"}\n')}),/nicht bestätigt/);
});
function apiFixture({vram=8*GiB,context=4096,badTool=false}={}){
 const calls=[];const api=async(path,body)=>{calls.push({path,body});if(path==='/api/tags')return {models:[{name:'test:model',digest:'abc'}]};if(path==='/api/show')return {capabilities:['tools'],details:{quantization_level:'Q4_K_M'}};if(path==='/api/chat')return {done:true,done_reason:'stop',message:{tool_calls:[{function:{name:badTool?'unknown':'get_state',arguments:{}}}]}};if(path==='/api/ps')return {models:[{digest:'abc',context_length:context,size:8*GiB,size_vram:vram}]};return {};};return {api,calls};
}
test('local load validation fixes context, validates DE/EN tool calls and unloads the test model',async()=>{
 const fixture=apiFixture(),result=await validateLocalModel('test:model','abc',{api:fixture.api});assert.equal(result.basicToolTests.length,2);assert.equal(result.complexStudioTasks,'not-tested');
 const chat=fixture.calls.filter(c=>c.path==='/api/chat');assert.ok(chat.every(c=>c.body.options.num_ctx===4096&&c.body.tools[0].function.name==='get_state'));assert.equal(fixture.calls.at(-1).body.keep_alive,0);
});
test('GPU offload, wrong context, wrong tool or changed digest never receive runtime approval',async()=>{
 for(const config of [{vram:4*GiB},{context:8192},{badTool:true}]){const f=apiFixture(config);await assert.rejects(validateLocalModel('test:model','abc',{api:f.api}));assert.equal(f.calls.at(-1).body.keep_alive,0);}
 const f=apiFixture();await assert.rejects(validateLocalModel('test:model','different',{api:f.api}),/Digest/);assert.equal(f.calls.some(c=>c.path==='/api/chat'),false);
 const cpu=apiFixture({vram:0});await validateLocalModel('test:model','abc',{cpu:true,api:cpu.api});assert.ok(cpu.calls.filter(c=>c.path==='/api/chat').every(c=>c.body.options.num_gpu===0));
});
