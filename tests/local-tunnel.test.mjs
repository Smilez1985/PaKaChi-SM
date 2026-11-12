import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {crc32} from 'node:zlib';
import {createTunnel,extractBundle} from '../server/local/tunnel.mjs';
import {createSettings} from '../server/local/settings.mjs';
import {launchProcess} from '../server/local/process.mjs';
function zip(entries){let offset=0;const locals=[],index=[];for(const [name,bytes,mode=0o100755] of entries){const n=Buffer.from(name),b=Buffer.from(bytes),l=Buffer.alloc(30),c=Buffer.alloc(46);l.writeUInt32LE(0x04034b50);l.writeUInt32LE(crc32(b),14);l.writeUInt32LE(b.length,18);l.writeUInt32LE(b.length,22);l.writeUInt16LE(n.length,26);c.writeUInt32LE(0x02014b50);c.writeUInt32LE(crc32(b),16);c.writeUInt32LE(b.length,20);c.writeUInt32LE(b.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE((mode*65536)>>>0,38);c.writeUInt32LE(offset,42);locals.push(l,n,b);index.push(c,n);offset+=l.length+n.length+b.length;}const directory=Buffer.concat(index),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,directory,end]);}
test('official bundle extraction requires both platform binaries and validates bytes without following archive paths',()=>{
 for(const platform of ['linux','win32']){const ext=platform==='win32'?'.exe':'',bytes=zip([['tunnel-client'+ext,'client'],['cloudflared'+ext,'proxy'],['../outside','escape']]);const files=extractBundle(bytes,platform);assert.equal(files.size,2);assert.equal(files.get('cloudflared'+ext).toString(),'proxy');}
 assert.throws(()=>extractBundle(zip([['tunnel-client','only one']]),'linux'));
 assert.throws(()=>extractBundle(zip([['tunnel-client','link',0o120777],['cloudflared','proxy']]),'linux'));
 assert.throws(()=>extractBundle(zip([['tunnel-client','one'],['tunnel-client','two'],['cloudflared','proxy']]),'linux'));
 const broken=zip([['tunnel-client','client'],['cloudflared','proxy']]);broken[30+'tunnel-client'.length]^=1;assert.throws(()=>extractBundle(broken,'linux'),/Prüfsumme/);
 assert.throws(()=>extractBundle(Buffer.alloc(2),'linux'));
});
test('tunnel installation verifies official release digest and manages secret-free config, readiness and doctor',async t=>{
 const root=await mkdtemp(join(tmpdir(),'pakachi-tunnel-'));t.after(()=>rm(root,{recursive:true,force:true}));const settings=await createSettings(root);await settings.update({...settings.value,enabled:true,tunnelId:'tunnel_testing'});
 const ext=process.platform==='win32'?'.exe':'',bytes=zip([['tunnel-client'+ext,'client'],['cloudflared'+ext,'proxy']]),version='v0.0.20',platform={win32:'windows',linux:'linux',darwin:'darwin'}[process.platform],arch={x64:'amd64',arm64:'arm64'}[process.arch],name=`tunnel-client-${version}-${platform}-${arch}.zip`,url=`https://github.com/openai/tunnel-client/releases/download/${version}/${name}`;
 let digest='sha256:'+createHash('sha256').update(bytes).digest('hex'),finish,last,ready=false;
 const fetcher=async address=>{if(address.endsWith('/releases/latest'))return Response.json({tag_name:version,assets:[{name,browser_download_url:url,digest}]});if(address===url)return new Response(bytes);if(address==='http://127.0.0.1:43123/readyz')return new Response('',{status:ready?200:503});throw Error('unexpected URL '+address);};
 const launch=(command,args,options)=>{last={command,args,options};if(args[0]==='doctor')return {done:Promise.resolve({code:0,stdout:options.env.CONTROL_PLANE_API_KEY,stderr:''})};const done=new Promise(resolve=>{finish=resolve;});return {done,stop(){finish({code:0,stopped:true});}};};
 const tunnel=createTunnel(settings,{fetcher,launch});const installed=await tunnel.install();assert.equal(installed.version,version);assert.equal(await readFile(join(root,'tunnel',version,'cloudflared'+ext),'utf8'),'proxy');
 tunnel.setKey('runtime-secret-for-test');await tunnel.start('http://127.0.0.1:8787');assert.deepEqual(last.args.slice(0,2),['run','--config']);assert.equal(last.options.env.PAKACHI_TUNNEL_MCP_AUTH,'Bearer '+settings.token);
 const configText=await readFile(last.args[2],'utf8'),config=JSON.parse(configText);assert.ok(!configText.includes('runtime-secret-for-test'));assert.ok(!configText.includes(settings.token));assert.equal(config.mcp.server_urls[0].url,'http://127.0.0.1:8787/mcp');assert.equal(config.control_plane.api_key,'env:CONTROL_PLANE_API_KEY');assert.equal((await tunnel.status()).state,'starting');
 await writeFile(config.health.url_file,'http://127.0.0.1:43123');ready=true;assert.equal((await tunnel.status()).state,'ready');await tunnel.stop();assert.equal((await tunnel.status()).state,'stopped');
 const doctor=await tunnel.doctor('http://127.0.0.1:8787');assert.equal(doctor.ok,true);assert.ok(!doctor.output.includes('runtime-secret-for-test'));assert.deepEqual(last.args.filter(x=>x!=='--config'&&x!==last.args[2]),['doctor','--explain']);
 digest='sha256:'+'0'.repeat(64);await assert.rejects(tunnel.install(),/Prüfsumme/);assert.equal(await readFile(join(root,'tunnel',version,'tunnel-client'+ext),'utf8'),'client');
});
test('process logging redacts credentials split across real stdout and stderr chunks',async()=>{
 const key='a-private-runtime-key',seen=[];const source='process.stdout.write("a-private-");process.stderr.write("a-private-");setTimeout(()=>{process.stdout.end("runtime-key ✅");process.stderr.end("runtime-key");},30)';
 const result=await launchProcess(process.execPath,['-e',source],{secrets:[key],onData:text=>seen.push(text)}).done;
 assert.equal(result.code,0);assert.equal(result.stdout,'[redacted] ✅');assert.equal(result.stderr,'[redacted]');assert.ok(!seen.join('').includes(key));
});
