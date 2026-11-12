import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createLocalApplication} from '../server/local/app.mjs';
import {createSettings,caddySnippet} from '../server/local/settings.mjs';
import {createAssets} from '../server/local/assets.mjs';
import {createJobs} from '../server/local/jobs.mjs';

async function fixture(t){
 const directory=await mkdtemp(join(tmpdir(),'pakachi-local-')),dist=join(directory,'dist');await mkdir(dist);await writeFile(join(dist,'index.html'),'<html><head></head><body>Local</body></html>');
 const app=await createLocalApplication({directory,dist,seed:false});const url=await app.listen(0);const home=await fetch(url),cookie=home.headers.get('set-cookie').split(';')[0],html=await home.text();
 const boot=await(await fetch(url+'/api/local/bootstrap',{headers:{Cookie:cookie}})).json();
 const admin=(path,body)=>fetch(url+'/api/local/'+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{'Content-Type':'application/json','X-PaKaChi-Local':boot.csrf,Origin:url})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 t.after(async()=>{await app.close();await rm(directory,{recursive:true,force:true});});return {app,url,cookie,boot,admin,directory,html};
}
async function clientFor(t,f,token=f.app.settings.token,headers={}){const client=new Client({name:'local-test',version:'1'});await client.connect(new StreamableHTTPClientTransport(new URL(f.url+'/mcp'),{requestInit:{headers:{Authorization:'Bearer '+token,...headers}}}));t.after(()=>client.close());return client;}
const value=r=>{assert.notEqual(r.isError,true,r.content?.[0]?.text);return JSON.parse(r.content[0].text);};
async function until(get,predicate,timeout=10000){const start=Date.now();let last;while(Date.now()-start<timeout){last=await get();if(predicate(last))return last;await new Promise(r=>setTimeout(r,40));}assert.fail('Condition did not complete: '+JSON.stringify(last));}

test('local application stays off by default and separates loopback management from Caddy MCP',async t=>{
 const f=await fixture(t);assert.match(f.html,/pakachi-local-runtime/);assert.equal(f.boot.settings.enabled,false);assert.equal(f.boot.settings.allowScripts,false);
 assert.equal((await fetch(f.url+'/api/local/status')).status,401);
 assert.equal((await fetch(f.url+'/api/local/settings',{method:'POST',headers:{Cookie:f.cookie,'Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(f.url+'/api/local/status',{headers:{Cookie:f.cookie,Origin:'https://evil.test'}})).status,403);
 assert.equal((await fetch(f.url+'/api/local/status',{headers:{Cookie:f.cookie,'X-Forwarded-For':'203.0.113.4'}})).status,403);
 assert.equal((await fetch(f.url+'/mcp')).status,403);
 const next={...f.boot.settings,enabled:true,publicUrl:'https://example.duckdns.org/pakachi/mcp'};
 assert.equal((await f.admin('settings',next)).status,200);
 const proxied={Host:'example.duckdns.org','X-Forwarded-For':'203.0.113.4'};
 assert.equal((await fetch(f.url+'/api/local/bootstrap',{headers:{...proxied,Cookie:f.cookie}})).status,403);
 assert.equal((await fetch(f.url+'/',{headers:proxied})).status,403);
 const unauthenticated=await fetch(f.url+'/pakachi/mcp',{headers:proxied});assert.equal(unauthenticated.status,401);assert.match(unauthenticated.headers.get('www-authenticate'),/oauth-protected-resource\/pakachi\/mcp/);
 const snippet=(await(await f.admin('caddy?upstream=192.168.1.20%3A8787')).json()).snippet;assert.match(snippet,/reverse_proxy 192.168.1.20:8787/);assert.match(snippet,/\/pakachi\/authorize/);assert.ok(!snippet.split('\n').filter(x=>!x.startsWith('#')).join('\n').includes('/api/local'));assert.ok(!snippet.includes('443'));
 const reloaded=await createSettings(f.directory);assert.equal(reloaded.value.enabled,false);assert.equal(reloaded.value.publicUrl,next.publicUrl);
});

test('real Streamable HTTP MCP performs an asynchronous Python job with inputs and chunked results',async t=>{
 const f=await fixture(t);await f.app.settings.update({...f.boot.settings,enabled:true,python:'python3'});const client=await clientFor(t,f);
 const tools=(await client.listTools()).tools.map(x=>x.name);assert.equal(tools.length,17);assert.ok(tools.includes('edit_studio'));assert.ok(tools.includes('local_start_job'));assert.ok(!tools.some(x=>/tunnel|settings|secret|shell/.test(x)));
 assert.equal(value(await client.callTool({name:'local_get_status',arguments:{}})).enabled,true);
 const input=value(await client.callTool({name:'local_write_text_asset',arguments:{name:'input.txt',text:'input preserved'}})).asset;
 const text='import os,json\nfrom pathlib import Path\ninputs=json.loads(os.environ["PAKACHI_JOB_INPUTS"])\nassert "PAKACHI_TEST_SECRET" not in os.environ\nPath(os.environ["PAKACHI_JOB_OUTPUT"],"result.txt").write_text(Path(next(iter(inputs.values()))).read_text()+" + generated")\nprint("actual Python execution")\n';
 const script=value(await client.callTool({name:'local_write_text_asset',arguments:{name:'job.py',text}})).asset.id;
 assert.equal((await client.callTool({name:'local_start_job',arguments:{kind:'python',script,inputs:[input.id]}})).isError,true);
 await f.app.settings.update({...f.app.settings.value,allowScripts:true});process.env.PAKACHI_TEST_SECRET='not inherited';t.after(()=>delete process.env.PAKACHI_TEST_SECRET);
 const requestId=randomUUID(),first=value(await client.callTool({name:'local_start_job',arguments:{kind:'python',script,inputs:[input.id],requestId}}));assert.equal(first.status,'queued');
 const repeat=value(await client.callTool({name:'local_start_job',arguments:{kind:'python',script,inputs:[input.id],requestId}}));assert.equal(first.id,repeat.id);
 const done=await until(()=>f.app.jobs.get(first.id),j=>!['queued','running'].includes(j.status));assert.equal(done.status,'completed',done.error);assert.match(done.log,/actual Python execution/);assert.equal(done.outputs.length,1);
 const bytes=value(await client.callTool({name:'local_read_asset',arguments:{id:done.outputs[0].id,length:5}}));assert.notEqual(bytes.nextOffset,null);
 const rest=value(await client.callTool({name:'local_read_asset',arguments:{id:done.outputs[0].id,offset:5}}));const result=Buffer.concat([Buffer.from(bytes.data,'base64'),Buffer.from(rest.data,'base64')]);assert.equal(result.toString(),'input preserved + generated');assert.equal(createHash('sha256').update(result).digest('hex'),done.outputs[0].sha256);
});

test('OAuth through a Caddy-style path needs local consent and validates PKCE, resource and single-use codes',async t=>{
 const f=await fixture(t),publicUrl='https://example.duckdns.org/pakachi/mcp',headers={Host:'example.duckdns.org','X-Forwarded-For':'198.51.100.2'};await f.app.settings.update({...f.boot.settings,enabled:true,publicUrl});
 const request=(path,opts={})=>fetch(f.url+path,{...opts,headers:{...headers,...opts.headers}});
 const metadata=await(await request('/.well-known/oauth-protected-resource/pakachi/mcp')).json();assert.equal(metadata.resource,publicUrl);
 const authmeta=await(await request('/.well-known/oauth-authorization-server/pakachi')).json();assert.equal(authmeta.authorization_endpoint,'https://example.duckdns.org/pakachi/authorize');
 const registration=await request('/pakachi/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:'Integration client',redirect_uris:['https://client.example/callback?existing=yes'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']})});assert.equal(registration.status,201);const client=await registration.json();
 const verifier='test-verifier-'.repeat(5),challenge=createHash('sha256').update(verifier).digest('base64url');
 const query=new URLSearchParams({client_id:client.client_id,redirect_uri:client.redirect_uris[0],response_type:'code',code_challenge_method:'S256',code_challenge:challenge,resource:publicUrl,state:'keep-this-state',scope:'pakachi:tools'});
 const authorize=await request('/pakachi/authorize?'+query);assert.equal(authorize.status,200);assert.match(await authorize.text(),/PaKaChi verbinden/);
 const waiting=f.app.oauth.approvals()[0];assert.equal(waiting.callback,'https://client.example');assert.equal((await request('/pakachi/oauth-wait/'+waiting.id)).status,200);
 assert.equal((await request('/api/local/approve',{method:'POST',headers:{Cookie:f.cookie,'Content-Type':'application/json','X-PaKaChi-Local':f.boot.csrf},body:JSON.stringify({id:waiting.id,allow:true})})).status,403);
 assert.equal((await f.admin('approve',{id:waiting.id,allow:true})).status,200);const callback=new URL((await(await request('/pakachi/oauth-wait/'+waiting.id)).json()).redirect);assert.equal(callback.searchParams.get('state'),'keep-this-state');assert.equal(callback.searchParams.get('existing'),'yes');
 const form={grant_type:'authorization_code',client_id:client.client_id,code:callback.searchParams.get('code'),redirect_uri:client.redirect_uris[0],code_verifier:verifier,resource:publicUrl};
 const exchange=body=>request('/pakachi/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
 assert.equal((await exchange({...form,code_verifier:'wrong-'.repeat(10)})).status,400);
 const response=await exchange(form);assert.equal(response.status,200);const token=await response.json();assert.ok(token.access_token);assert.equal((await exchange(form)).status,400);
 const rpc=await clientFor(t,f,token.access_token,headers);assert.equal(value(await rpc.callTool({name:'local_get_status',arguments:{}})).enabled,true);
 const refresh=await exchange({grant_type:'refresh_token',client_id:client.client_id,refresh_token:token.refresh_token,resource:publicUrl});assert.equal(refresh.status,200);
 assert.equal((await exchange({grant_type:'refresh_token',client_id:client.client_id,refresh_token:token.refresh_token,resource:publicUrl})).status,400);
 await f.admin('settings',{...f.app.settings.value,enabled:false});assert.equal((await request('/pakachi/mcp',{headers:{Authorization:'Bearer '+token.access_token}})).status,403);
});

test('assets reject traversal, symlink escapes, malformed or conflicting chunks and preserve input bytes',async t=>{
 const f=await fixture(t);await assert.rejects(()=>f.app.assets.add('../escape.py',Buffer.from('x')));await assert.rejects(()=>f.app.assets.upload({name:'input.txt',data:'%%%'}));
 const a=await f.app.assets.upload({name:'input.txt',data:Buffer.from('hello ').toString('base64')});
 await assert.rejects(()=>f.app.assets.upload({name:'input.txt',uploadId:a.uploadId,offset:1,data:'eA=='}),/Konflikt/);
 const finished=await f.app.assets.upload({name:'input.txt',uploadId:a.uploadId,offset:a.nextOffset,data:Buffer.from('world').toString('base64'),final:true});assert.equal(Buffer.from((await f.app.assets.read(finished.asset.id)).data,'base64').toString(),'hello world');
 const file=await f.app.assets.file(finished.asset.id);await rm(file);let symlinkCreated=false;try{await symlink(join(f.directory,'settings.json'),file);symlinkCreated=true;}catch(error){if(!['EPERM','EACCES'].includes(error.code))throw error;t.diagnostic('Symlink-Sicherheitsfall mangels Windows-Symlink-Berechtigung nicht ausgeführt.');}if(symlinkCreated)await assert.rejects(()=>f.app.assets.read(finished.asset.id),/außerhalb/);
 assert.throws(()=>caddySnippet('https://example.com/mcp','host:8787\nroute'),/Upstream/);
});

test('long jobs are cancellable, cannot overlap compute work, and preserve interruption status',async t=>{
 const f=await fixture(t);await f.app.settings.update({...f.boot.settings,enabled:true,allowScripts:true,python:'python3'});
 const script=await f.app.assets.add('wait.py',Buffer.from('import time\nprint("waiting",flush=True)\ntime.sleep(60)\n'));
 const starts=await Promise.allSettled([f.app.jobs.start({kind:'python',script:script.id}),f.app.jobs.start({kind:'python',script:script.id})]);assert.deepEqual(starts.map(s=>s.status),['fulfilled','rejected']);assert.match(starts[1].reason.message,/läuft bereits/);const first=starts[0].value;await until(()=>f.app.jobs.get(first.id),j=>j.log.includes('waiting'));
 await f.app.jobs.cancel(first.id);
 const result=await until(()=>f.app.jobs.get(first.id),j=>j.status==='cancelled');assert.ok(!result.outputs.length);
});

test('ACP v1 agent session receives PaKaChi MCP and waits for actual local permission before using it',async t=>{
 const f=await fixture(t);await f.app.settings.update({...f.boot.settings,enabled:true,allowScripts:true,acpCommand:process.execPath,acpArgs:[fileURLToPath(new URL('./fixtures/local-acp-agent.mjs',import.meta.url))]});
 const job=await f.app.jobs.start({kind:'acp',prompt:'Check the local PaKaChi tools.'});const pending=await until(()=>f.app.acp.approvals(),v=>v.length===1);assert.equal(f.app.jobs.get(job.id).status,'running');
 assert.equal((await f.admin('acp-approve',{id:pending[0].id,option:'once'})).status,200);
 const result=await until(()=>f.app.jobs.get(job.id),j=>!['queued','running'].includes(j.status));assert.equal(result.status,'completed',result.error);assert.match(result.log,/ACP and live MCP delegation succeeded/);assert.equal(result.agent.stopReason,'end_turn');
});

test('SDK OAuth client discovers prefixed endpoints, handles denial and completes PKCE without a supplied bearer',async t=>{
 const f=await fixture(t),publicUrl='https://example.duckdns.org/pakachi/mcp';await f.app.settings.update({...f.boot.settings,enabled:true,publicUrl});
 const paths=[],proxyFetch=async(input,init)=>{const request=new Request(input,init),url=new URL(request.url);assert.equal(url.origin,'https://example.duckdns.org');paths.push(url.pathname);const headers=new Headers(request.headers);headers.set('Host',url.host);headers.set('X-Forwarded-For','198.51.100.10');return fetch(f.url+url.pathname+url.search,{method:request.method,headers,...(['GET','HEAD'].includes(request.method)?{}:{body:await request.text()})});};
 let registration,tokens,verifier,authorization;
 const provider={redirectUrl:'https://client.example/callback',clientMetadata:{client_name:'SDK OAuth integration',redirect_uris:['https://client.example/callback'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']},state:()=> 'sdk-state',clientInformation:()=>registration,saveClientInformation:v=>{registration=v;},tokens:()=>tokens,saveTokens:v=>{tokens=v;},saveCodeVerifier:v=>{verifier=v;},codeVerifier:()=>verifier,redirectToAuthorization:v=>{authorization=v;}};
 const connect=async()=>{const client=new Client({name:'oauth-sdk-test',version:'1'}),transport=new StreamableHTTPClientTransport(new URL(publicUrl),{authProvider:provider,fetch:proxyFetch});t.after(()=>client.close());await assert.rejects(()=>client.connect(transport),/uthoriz/);assert.equal(authorization.pathname,'/pakachi/authorize');assert.equal(authorization.searchParams.get('resource'),publicUrl);assert.equal((await proxyFetch(authorization)).status,200);return transport;};
 await connect();let pending=f.app.oauth.approvals()[0];assert.equal((await f.admin('approve',{id:pending.id,allow:false})).status,200);const denied=new URL(f.app.oauth.wait(pending.id).redirect);assert.equal(denied.searchParams.get('error'),'access_denied');assert.equal(denied.searchParams.get('state'),'sdk-state');assert.equal(tokens,undefined);
 const transport=await connect();pending=f.app.oauth.approvals()[0];assert.equal((await f.admin('approve',{id:pending.id,allow:true})).status,200);const callback=new URL(f.app.oauth.wait(pending.id).redirect);await transport.finishAuth(callback.searchParams.get('code'));
 const client=new Client({name:'authorized-sdk-client',version:'1'});t.after(()=>client.close());await client.connect(new StreamableHTTPClientTransport(new URL(publicUrl),{authProvider:provider,fetch:proxyFetch}));assert.equal(value(await client.callTool({name:'local_get_status',arguments:{}})).enabled,true);
 assert.ok(paths.includes('/.well-known/oauth-protected-resource/pakachi/mcp'));assert.ok(paths.includes('/.well-known/oauth-authorization-server/pakachi'));assert.ok(paths.includes('/pakachi/register'));assert.ok(paths.includes('/pakachi/token'));
});

test('MCP cancellation stops a real Python process and disabling scripts cancels its successor',async t=>{
 const f=await fixture(t);await f.app.settings.update({...f.boot.settings,enabled:true,allowScripts:true,python:'python3'});const client=await clientFor(t,f);
 const script=value(await client.callTool({name:'local_write_text_asset',arguments:{name:'cancel.py',text:'import time\nprint("ready for cancellation",flush=True)\ntime.sleep(60)\n'}})).asset.id;
 const first=value(await client.callTool({name:'local_start_job',arguments:{kind:'python',script}}));await until(async()=>value(await client.callTool({name:'local_get_job',arguments:{id:first.id}})),j=>j.log.includes('ready for cancellation'));
 value(await client.callTool({name:'local_cancel_job',arguments:{id:first.id}}));await until(()=>f.app.jobs.get(first.id),j=>j.status==='cancelled');
 const next=value(await client.callTool({name:'local_start_job',arguments:{kind:'python',script}}));await until(()=>f.app.jobs.get(next.id),j=>j.log.includes('ready for cancellation'));assert.equal((await f.admin('settings',{...f.app.settings.value,allowScripts:false})).status,200);assert.equal(f.app.jobs.get(next.id).status,'cancelled');assert.equal((await client.callTool({name:'local_start_job',arguments:{kind:'python',script}})).isError,true);
});

test('ACP denial and cancellation clear local approvals and leave subsequent sessions usable',async t=>{
 const f=await fixture(t);await f.app.settings.update({...f.boot.settings,enabled:true,allowScripts:true,acpCommand:process.execPath,acpArgs:[fileURLToPath(new URL('./fixtures/local-acp-agent.mjs',import.meta.url))]});
 const first=await f.app.jobs.start({kind:'acp',prompt:'Denied session'}),pending=await until(()=>f.app.acp.approvals(),v=>v.length===1);await f.admin('acp-approve',{id:pending[0].id,option:'reject'});const denied=await until(()=>f.app.jobs.get(first.id),j=>j.status==='completed');assert.doesNotMatch(denied.log,/delegation succeeded/);assert.equal(f.app.acp.approvals().length,0);
 const second=await f.app.jobs.start({kind:'acp',prompt:'Cancelled session'}),waiting=await until(()=>f.app.acp.approvals(),v=>v.length===1);await f.app.jobs.cancel(second.id);await until(()=>f.app.jobs.get(second.id),j=>j.status==='cancelled');assert.equal(f.app.acp.approvals().length,0);assert.equal((await f.admin('acp-approve',{id:waiting[0].id,option:'once'})).status,400);
 const third=await f.app.jobs.start({kind:'acp',prompt:'New session after cancellation'}),again=await until(()=>f.app.acp.approvals(),v=>v.length===1);await f.admin('acp-approve',{id:again[0].id,option:'once'});const complete=await until(()=>f.app.jobs.get(third.id),j=>j.status==='completed');assert.match(complete.log,/live MCP delegation succeeded/);
});

test('cancellation during script preparation prevents the process from being launched',async t=>{
 const f=await fixture(t);await f.app.settings.update({...f.boot.settings,enabled:true,allowScripts:true});const script=await f.app.assets.add('never-run.py',Buffer.from('print("must not run")'));
 let reads=0,release,preparing,launches=0;const blocked=new Promise(resolve=>{preparing=resolve;}),gate=new Promise(resolve=>{release=resolve;});
 const assets={...f.app.assets,async file(id){if(++reads===2){preparing();await gate;}return f.app.assets.file(id);}};
 const jobs=await createJobs(f.app.settings,assets,{launch(){launches++;return {done:Promise.resolve({code:0}),stop(){}};}});t.after(()=>jobs.close());
 const job=await jobs.start({kind:'python',script:script.id});await blocked;await jobs.cancel(job.id);release();await until(()=>jobs.get(job.id),j=>j.status==='cancelled');assert.equal(launches,0);
});

test('ACP preserves split UTF-8 text and redacts credentials spanning message chunks',async t=>{
 const f=await fixture(t),secret='private-streaming-test-key';await f.app.settings.update({...f.boot.settings,enabled:true,allowScripts:true,acpCommand:process.execPath,acpArgs:[fileURLToPath(new URL('./fixtures/local-acp-agent.mjs',import.meta.url))]});await f.admin('secrets',{acpEnv:{PAKACHI_TEST_SECRET:secret}});
 const job=await f.app.jobs.start({kind:'acp',prompt:'streamed-output'}),result=await until(()=>f.app.jobs.get(job.id),j=>!['queued','running'].includes(j.status));assert.equal(result.status,'completed',result.error);assert.match(result.log,/Grüße 🐼/);assert.ok(!result.log.includes(secret));assert.match(result.log,/\[redacted\]/);
});
