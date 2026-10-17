import {request as httpRequest} from 'node:http';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGenerationService} from '../server/generation.mjs';
import {generate,processRun} from '../scripts/generate-model.mjs';
import {createLocalGenerationAdapter} from '../src/generation-adapter.ts';
import {ProviderRegistry} from '../src/ai-providers.ts';
import {ProviderJob} from '../src/ai-jobs.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {glb} from './generation-fixture.mjs';
const token='a'.repeat(48),origin='http://127.0.0.1:5173';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=','base64');
async function fixture(t,run){
 const root=await mkdtemp(join(tmpdir(),'pakachi-service-'));
 const service=createGenerationService({token,origin,repo:root,output:root},{run});const endpoint=await service.listen(0);
 t.after(async()=>{await service.close();await rm(root,{recursive:true,force:true});});
 const profile={id:'local',name:'TripoSR',adapter:'custom-generation',model:'triposr',endpoint};
 const headers={Authorization:'Bearer '+token,Origin:origin,'Content-Type':'image/png'};
 return {root,profile,endpoint,headers};
}
test('real HTTP adapter and job validate generated output, keep preview separate and preserve source',async t=>{
 let backendCalls=0;
 const f=await fixture(t,options=>generate(options,{check:async()=>({ready:true,blockers:[],testDouble:true}),launch:async(_command,args,{signal})=>{
  backendCalls++;signal.throwIfAborted();const input=args[1];assert.deepEqual(await readFile(input),png);
  const destination=join(args[args.indexOf('--output-dir')+1],'0');await mkdir(destination,{recursive:true});await writeFile(join(destination,'mesh.glb'),glb());return {code:0};
 }}));
 const registry=new ProviderRegistry();registry.register(createLocalGenerationAdapter(()=>token));let checked=false;
 const job=new ProviderJob(registry,{config:{version:1,profiles:[f.profile],assignments:{assistant:null,generation:'local',rigging:null}},role:'generation',input:{prompt:'Image reconstruction (label only)',source:{mediaType:'image/png',bytes:png}},target:{session:'test',revision:1},validate:async output=>{assert.equal(output.kind,'model');const model=await parseModel(output.bytes.buffer);assert.equal(model.scene.children.length,1);disposeModel(model.scene);checked=true;}}).start();
 assert.equal((await job.done).status,'preview');assert.equal(backendCalls,1);assert.ok(checked);assert.equal(job.preview().kind,'model');
 assert.equal(job.accept(()=>({session:'test',revision:2}),()=>assert.fail('stale preview must not write')),false);
 assert.ok(!(await readdir(f.root)).some(x=>x.startsWith('.upload-')));
});
test('service enforces authentication, exact origin, host and narrow preflight without invoking backend',async t=>{
 let calls=0;const f=await fixture(t,async()=>{calls++;throw new Error('secret backend path');});
 for(const [headers,status] of [[{},401],[{...f.headers,Origin:'https://evil.test'},403]]){
  assert.equal((await fetch(f.endpoint+'/generate',{method:'POST',headers,body:png})).status,status);
 }
 const hostStatus=await new Promise((resolve,reject)=>{const req=httpRequest(f.endpoint+'/capabilities',{headers:{Host:'evil.test',Authorization:'Bearer '+token}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});assert.equal(hostStatus,403);
 const allowed=await fetch(f.endpoint+'/generate',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization, content-type'}});
 assert.equal(allowed.status,204);assert.equal(allowed.headers.get('access-control-allow-origin'),origin);
 assert.equal((await fetch(f.endpoint+'/generate',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'DELETE'}})).status,403);
 assert.equal((await fetch(f.endpoint+'/generate',{method:'POST',headers:f.headers,body:'not an image'})).status,415);
 assert.equal(calls,0);
 const failure=await fetch(f.endpoint+'/generate',{method:'POST',headers:f.headers,body:png});assert.equal(failure.status,502);assert.deepEqual(await failure.json(),{error:'generation-failed'});
});
test('client disconnect reaches backend AbortSignal and concurrent inference is refused',async t=>{
 let begin,stopped;const started=new Promise(r=>begin=r),ended=new Promise(r=>stopped=r);
 const f=await fixture(t,async({signal})=>{begin();await new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));stopped();throw new Error('aborted');});
 const controller=new AbortController();const pending=fetch(f.endpoint+'/generate',{method:'POST',headers:f.headers,body:png,signal:controller.signal}).catch(e=>e);
 await started;assert.equal((await fetch(f.endpoint+'/generate',{method:'POST',headers:f.headers,body:png})).status,409);
 controller.abort();await pending;await ended;
});
test('adapter refuses remote endpoints, wrong model, unsupported role and oversized responses',async()=>{
 const profile={id:'p',name:'p',adapter:'custom-generation',model:'triposr',endpoint:'http://127.0.0.1:8766'};
 let calls=0;const adapter=createLocalGenerationAdapter(()=>token,async()=>{calls++;return new Response('{}',{headers:{'Content-Length':'999999'}});});
 const signal=new AbortController().signal;
 await assert.rejects(()=>adapter.probe({...profile,endpoint:'https://example.com'},signal));
 await assert.rejects(()=>adapter.probe({...profile,model:'wrong'},signal));assert.equal(calls,0);
 await assert.rejects(()=>adapter.probe(profile,signal),/response-size/);
 await assert.rejects(()=>adapter.run({profile,role:'rigging',input:{},signal,progress:()=>{}}),/unsupported-role/);
 for(const response of [new Response('not glb',{headers:{'Content-Type':'model/gltf-binary'}}),new Response(glb(),{headers:{'Content-Type':'text/html'}})]){
  const bad=createLocalGenerationAdapter(()=>token,async()=>response);
  await assert.rejects(()=>bad.run({profile,role:'generation',input:{source:{mediaType:'image/png',bytes:png}},signal,progress:()=>{}}));
 }
});
test('generator subprocess honors cancellation and deadlines',async()=>{
 const controller=new AbortController();const pending=processRun(process.execPath,['-e','setInterval(()=>{},1000)'],{signal:controller.signal});controller.abort();
 await assert.rejects(()=>pending,/abgebrochen/);
 await assert.rejects(()=>processRun(process.execPath,['-e','setInterval(()=>{},1000)'],{timeout:30}),/Zeitlimit/);
 const done=await processRun(process.execPath,['-e','console.log("ok")']);assert.equal(done.code,0);assert.equal(done.stdout.trim(),'ok');
});
