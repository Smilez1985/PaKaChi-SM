import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as tick} from 'node:timers/promises';
import {ProviderRegistry,emptyProviderConfig} from '../src/ai-providers.ts';
import type {ProviderAdapter} from '../src/ai-providers.ts';
import {ProviderJob} from '../src/ai-jobs.ts';
import type {JobOptions} from '../src/ai-jobs.ts';
import type {JobExecution,JobOutput} from '../src/ai-job-types.ts';
const revision={session:'studio-A',revision:4};
function options():JobOptions{return {config:{...emptyProviderConfig(),profiles:[{id:'local',name:'Local',adapter:'ollama',endpoint:'http://localhost:11434',model:'chosen'}],assignments:{assistant:'local',generation:'local',rigging:'local'}},role:'assistant',input:{prompt:'Wave'},target:{...revision},validate:async()=>{}};}
function registry(run:NonNullable<ProviderAdapter['run']>):ProviderRegistry {
 const r=new ProviderRegistry();r.register({id:'ollama',probe:async p=>({model:p.model,capabilities:['tool-calling','image-to-3d','rigging']}),run});return r;
}
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve};}
test('job snapshots pin provider and input; validated output waits for explicit, one-time acceptance',async()=>{
 const opts=options();let calls=0;
 const job=new ProviderJob(registry(async request=>{calls++;assert.equal(request.profile.model,'chosen');assert.equal(request.input.prompt,'Wave');return {kind:'text',text:'wave'};}),opts);
 opts.config.profiles[0].model='changed';opts.input.prompt='changed';opts.target.revision=9;
 job.subscribe(()=>{throw new Error('observer error');});job.start();await job.done;
 assert.equal(job.snapshot.status,'preview');assert.equal(calls,1);
 const view=job.snapshot;Object.assign(view.profile,{model:'changed'});assert.equal(job.snapshot.profile.model,'chosen');
 const preview=job.preview();if(preview.kind==='text')preview.text='changed';assert.deepEqual(job.preview(),{kind:'text',text:'wave'});
 let applied=0;assert.equal(job.accept(()=>revision,(result,expected)=>{applied++;assert.deepEqual(expected,revision);assert.deepEqual(result,{kind:'text',text:'wave'});return true;}),true);
 assert.equal(applied,1);assert.equal(job.snapshot.status,'accepted');assert.throws(()=>job.accept(()=>revision,()=>true),/no-preview/);assert.throws(()=>job.start(),/already/);
});
test('different revision or project session prevents application; discarded results cannot be accepted',async()=>{
 for(const now of [{...revision,revision:5},{...revision,session:'studio-B'}]){
  const job=new ProviderJob(registry(async()=>({kind:'text',text:'new'})),options()).start();await job.done;
  assert.equal(job.accept(()=>now,()=>{assert.fail('must not apply');}),false);assert.equal(job.snapshot.status,'stale');job.discard();assert.throws(()=>job.preview(),/no-preview/);
 }
 const job=new ProviderJob(registry(async()=>({kind:'text',text:'new'})),options()).start();await job.done;job.discard();assert.throws(()=>job.accept(()=>revision,()=>true),/no-preview/);
});
test('cancel settles immediately even if execution ignores signal; late result and progress stay ignored',async()=>{
 const pending=deferred<JobOutput>();let request!:JobExecution;
 const job=new ProviderJob(registry(async r=>{request=r;return pending.promise;}),options()).start();await tick();
 request.progress({phase:'running',percent:40});job.cancel();assert.equal((await job.done).status,'cancelled');assert.equal(request.signal.aborted,true);assert.equal(job.snapshot.remoteStop,'unconfirmed');
 request.progress({phase:'running',percent:100});pending.resolve({kind:'text',text:'too late'});await tick();assert.equal(job.snapshot.status,'cancelled');assert.equal(job.snapshot.progress,40);assert.throws(()=>job.preview(),/no-preview/);
});
test('timeout and cancellation during an unresponsive capability probe settle without starting execution',async()=>{
 const probe=deferred<{model:string;capabilities:[]}>();let runs=0;const r=new ProviderRegistry();r.register({id:'ollama',probe:()=>probe.promise,run:async()=>{runs++;return {kind:'text',text:'x'};}});
 const timed=new ProviderJob(r,{...options(),timeoutMs:10}).start();assert.equal((await timed.done).status,'timed-out');assert.equal(timed.snapshot.remoteStop,'not-requested');
 const cancelled=new ProviderJob(r,options()).start();cancelled.cancel();assert.equal((await cancelled.done).status,'cancelled');
 probe.resolve({model:'chosen',capabilities:[]});await tick();assert.equal(runs,0);
});
test('timeout during execution is terminal; no automatic second request',async()=>{
 let runs=0;const job=new ProviderJob(registry(async()=>{runs++;return new Promise<JobOutput>(()=>{});}),{...options(),timeoutMs:10}).start();
 assert.equal((await job.done).status,'timed-out');assert.equal(job.snapshot.remoteStop,'unconfirmed');assert.equal(runs,1);job.cancel();assert.equal(job.snapshot.status,'timed-out');
});
test('progress is bounded and monotonic; delayed queued messages cannot rewind execution',async()=>{
 const pending=deferred<JobOutput>();let request!:JobExecution;const job=new ProviderJob(registry(async r=>{request=r;return pending.promise;}),options()).start();await tick();
 request.progress({phase:'queued',percent:-20});assert.equal(job.snapshot.progress,0);
 request.progress({phase:'running',percent:60});request.progress({phase:'queued',percent:90});request.progress({phase:'running',percent:NaN});request.progress({phase:'running',percent:20});assert.equal(job.snapshot.progress,60);assert.equal(job.snapshot.status,'running');
 request.progress({phase:'running',percent:200});assert.equal(job.snapshot.progress,100);pending.resolve({kind:'text',text:'done'});await job.done;assert.equal(job.snapshot.status,'preview');
});
test('validation failure or invalid output cannot become a preview and raw service errors are not exposed',async()=>{
 const job=new ProviderJob(registry(async()=>({kind:'text',text:'x'})),{...options(),validate:async()=>{throw new Error('secret response');}}).start();
 assert.equal((await job.done).status,'failed');assert.equal(job.snapshot.error,'validation-failed');assert.throws(()=>job.preview(),/no-preview/);
 const bad=new ProviderJob(registry(async()=>({kind:'model',bytes:new Uint8Array([1])})),options()).start();assert.equal((await bad.done).status,'failed');
 const error=new ProviderJob(registry(async()=>{throw new Error('Authorization: secret');}),options()).start();await error.done;assert.equal(error.snapshot.error,'provider-failed');
});
test('cancellation while validating prevents preview; model bytes cannot be mutated through preview or validator',async()=>{
 const gate=deferred<void>(),opts={...options(),role:'generation' as const,validate:async()=>gate.promise};
 const job=new ProviderJob(registry(async()=>({kind:'model',bytes:new Uint8Array([1,2,3])})),opts).start();await tick();assert.equal(job.snapshot.status,'validating');job.cancel();gate.resolve();await tick();assert.equal(job.snapshot.status,'cancelled');
 const good=new ProviderJob(registry(async()=>({kind:'model',bytes:new Uint8Array([1,2,3])})),{...opts,validate:async output=>{if(output.kind==='model')output.bytes[0]=99;}}).start();await good.done;
 const a=good.preview();assert.equal(a.kind,'model');if(a.kind==='model')a.bytes[0]=7;
 assert.deepEqual(good.preview(),{kind:'model',bytes:new Uint8Array([1,2,3])});good.discard();
});
test('invalid inputs fail before execution; missing run is explicit and failures require a fresh job',async()=>{
 let runs=0;const r=registry(async()=>{runs++;return {kind:'text',text:'x'};});
 for(const patch of [{input:{prompt:''}},{timeoutMs:Infinity},{target:{session:'',revision:0}},{input:{prompt:'x',source:{mediaType:'image/png' as const,bytes:new Uint8Array()}}}])assert.throws(()=>new ProviderJob(r,{...options(),...patch}));
 assert.equal(runs,0);
 const missing=new ProviderRegistry();missing.register({id:'ollama',probe:async p=>({model:p.model,capabilities:['tool-calling']})});const job=new ProviderJob(missing,options()).start();await job.done;assert.equal(job.snapshot.error,'execution-missing');assert.throws(()=>job.start(),/already/);
});
test('consumer rejection or throw cannot silently mark a result accepted',async()=>{
 const job=new ProviderJob(registry(async()=>({kind:'text',text:'x'})),options()).start();await job.done;
 assert.throws(()=>job.accept(()=>revision,()=>{throw new Error('transaction rejected');}),/transaction rejected/);assert.equal(job.snapshot.status,'preview');
 assert.equal(job.accept(()=>revision,()=>false),false);assert.equal(job.snapshot.status,'stale');
});

function fallbackOptions():JobOptions {
 const opts=options();opts.config.profiles.push({...opts.config.profiles[0],id:'second'});
 opts.config.fallbacks={assistant:['second'],generation:[],rigging:[]};return {...opts,preflightFallbacks:true};
}
test('preflight fallback is opt-in and never retries an executed or invalid job',async()=>{
 for(const enabled of [false,true]){
  const probes:string[]=[],runs:string[]=[],r=new ProviderRegistry();r.register({id:'ollama',probe:async p=>{probes.push(p.id);if(p.id==='local')throw Error('secret');return {model:p.model,capabilities:['tool-calling']};},run:async request=>{runs.push(request.profile.id);return {kind:'text',text:'ok'};}});
  const job=new ProviderJob(r,{...fallbackOptions(),preflightFallbacks:enabled}).start();await job.done;
  assert.deepEqual(probes,enabled?['local','second']:['local']);assert.deepEqual(runs,enabled?['second']:[]);assert.equal(job.snapshot.executionStarted,enabled);
 }
 for(const validate of [false,true]){
  let runs=0;const job=new ProviderJob(registry(async()=>{runs++;if(!validate)throw Error('secret');return {kind:'text',text:'ok'};}),{...fallbackOptions(),validate:async()=>{throw Error('bad');}}).start();
  await job.done;assert.equal(runs,1);assert.equal(job.snapshot.executionStarted,true);assert.equal(job.snapshot.status,'failed');
 }
});
test('unresponsive probe times out; late probe cannot execute and stale project blocks execution',async()=>{
 const gate=deferred<{model:string;capabilities:['tool-calling']}>();const runs:string[]=[];let firstSignal:AbortSignal|undefined;
 const r=new ProviderRegistry();r.register({id:'ollama',probe:async(p,signal)=>{if(p.id==='local'){firstSignal=signal;return gate.promise;}return {model:p.model,capabilities:['tool-calling']};},run:async request=>{runs.push(request.profile.id);return {kind:'text',text:'ok'};}});
 const job=new ProviderJob(r,{...fallbackOptions(),probeTimeoutMs:10}).start();await job.done;assert.deepEqual(runs,['second']);assert.ok(firstSignal?.aborted);
 gate.resolve({model:'chosen',capabilities:['tool-calling']});await tick();assert.deepEqual(runs,['second']);
 const stale=new ProviderJob(r,{...fallbackOptions(),mayRun:()=>false}).start();await stale.done;assert.equal(stale.snapshot.status,'stale');assert.equal(stale.snapshot.executionStarted,false);assert.deepEqual(runs,['second']);
});
test('cancelling preflight prevents fallback, including cancellation from an observer',async()=>{
 let probes=0,runs=0;const r=new ProviderRegistry();r.register({id:'ollama',probe:async()=>{probes++;throw Error('offline');},run:async()=>{runs++;return {kind:'text',text:'ok'};}});
 const job=new ProviderJob(r,fallbackOptions());job.subscribe(state=>{if(state.profile.id==='second')job.cancel();});job.start();await job.done;assert.equal(job.snapshot.status,'cancelled');assert.equal(probes,1);assert.equal(runs,0);
});
