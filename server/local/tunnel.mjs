import {mkdir,writeFile,readFile,rename,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {inflateRawSync,crc32} from 'node:zlib';
import {launchProcess} from './process.mjs';

/** Extract only named top-level files; never use archive paths as destinations. */
export function extractBundle(bytes,platform=process.platform){
 const exe=platform==='win32'?'.exe':'',allowed=new Set(['tunnel-client'+exe,'cloudflared'+exe,'cloudflared-manifest.json','LICENSE','NOTICE']);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65558);i--)if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)throw Error('Ungültiges Release-Archiv.');const count=bytes.readUInt16LE(end+10);let cursor=bytes.readUInt32LE(end+16);const files=new Map();let total=0;
 if(count>200)throw Error('Release-Archiv enthält zu viele Dateien.');
 for(let i=0;i<count;i++){
  if(cursor+46>bytes.length||bytes.readUInt32LE(cursor)!==0x02014b50)throw Error('Ungültiger ZIP-Index.');
  const flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10),crc=bytes.readUInt32LE(cursor+16),compressed=bytes.readUInt32LE(cursor+20),size=bytes.readUInt32LE(cursor+24),n=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32),offset=bytes.readUInt32LE(cursor+42),name=bytes.toString('utf8',cursor+46,cursor+46+n),mode=bytes.readUInt32LE(cursor+38)>>>16;cursor+=46+n+extra+comment;
  if(!allowed.has(name))continue;if(files.has(name)||flags&1||(mode&0xf000)===0xa000||size>150*1024*1024||offset+30>bytes.length||bytes.readUInt32LE(offset)!==0x04034b50)throw Error('Nicht unterstütztes Release-Archiv.');
  const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28);if(start+compressed>bytes.length)throw Error('Abgeschnittenes Release-Archiv.');
  const input=bytes.subarray(start,start+compressed),data=method===0?Buffer.from(input):method===8?inflateRawSync(input,{maxOutputLength:150*1024*1024}):null;
  if(!data||data.length!==size||crc32(data)!==crc)throw Error('ZIP-Prüfsumme falsch.');total+=size;if(total>230*1024*1024)throw Error('Release-Archiv ist zu groß.');files.set(name,data);
 }
 if(!files.has('tunnel-client'+exe)||!files.has('cloudflared'+exe))throw Error('Offizielle Tunnel-Binärdateien fehlen.');return files;
}
async function bytesOf(response,max){if(!response.ok)throw Error('Download fehlgeschlagen.');if(Number(response.headers.get('content-length'))>max)throw Error('Download zu groß.');const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>max)throw Error('Download zu groß.');chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks);}
export function createTunnel(settings,{fetcher=fetch,launch=launchProcess}={}){
 const root=join(settings.root,'tunnel'),installed=join(root,'installed.json');let child=null,installing=false,state='stopped',log='',lastError=null,healthUrl=null,apiKey=process.env.CONTROL_PLANE_API_KEY??'',originKey='';
 const safe=text=>[apiKey,originKey,settings.token].filter(Boolean).reduce((v,key)=>v.split(key).join('[redacted]'),String(text));
 const append=text=>{log=(log+safe(text)).slice(-16000);};
 const binary=async()=>{const record=JSON.parse(await readFile(installed,'utf8'));return {record,path:join(root,record.version,'tunnel-client'+(process.platform==='win32'?'.exe':''))};};
 const prepare=async localUrl=>{
  if(!settings.value.enabled)throw Error('Lokale Werkzeuge zuerst einschalten.');if(!settings.value.tunnelId||!apiKey)throw Error('Tunnel-ID und Runtime-API-Schlüssel fehlen.');
  const {path}=await binary();await mkdir(root,{recursive:true,mode:0o700});originKey='Bearer '+settings.token;
  const config={config_version:1,control_plane:{base_url:'https://api.openai.com',tunnel_id:settings.value.tunnelId,api_key:'env:CONTROL_PLANE_API_KEY'},health:{listen_addr:'127.0.0.1:0',url_file:join(root,'health-url')},admin_ui:{open_browser:false},mcp:{server_urls:[{channel:'main',url:localUrl+'/mcp'}],extra_headers:{Authorization:'env:PAKACHI_TUNNEL_MCP_AUTH'},discovery_extra_headers:{Authorization:'env:PAKACHI_TUNNEL_MCP_AUTH'}}};
  const configFile=join(root,'runtime.json');await writeFile(configFile,JSON.stringify(config,null,2),{mode:0o600});return {path,configFile,env:{CONTROL_PLANE_API_KEY:apiKey,PAKACHI_TUNNEL_MCP_AUTH:originKey}};
 };
 return {
  setKey(value){if(typeof value!=='string'||value.length>4096||/[\r\n\0]/.test(value))throw Error('Ungültiger Tunnel-Schlüssel.');apiKey=value;},
  async install(){
   if(child||installing)throw Error('Tunnel zuerst stoppen; Installation läuft eventuell bereits.');installing=true;lastError=null;
   const platform={win32:'windows',linux:'linux',darwin:'darwin'}[process.platform],arch={x64:'amd64',arm64:'arm64'}[process.arch];let staging;
   try{
    if(!platform||!arch)throw Error('Betriebssystem oder Architektur nicht unterstützt.');
    const metadata=JSON.parse((await bytesOf(await fetcher('https://api.github.com/repos/openai/tunnel-client/releases/latest',{headers:{Accept:'application/vnd.github+json','User-Agent':'PaKaChi-SM'},signal:AbortSignal.timeout(30000)}),2*1024*1024)).toString('utf8'));
    if(!/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(metadata.tag_name))throw Error('Unbekanntes Release-Format.');
    const name=`tunnel-client-${metadata.tag_name}-${platform}-${arch}.zip`,asset=metadata.assets.find(a=>a.name===name);
    const url=`https://github.com/openai/tunnel-client/releases/download/${metadata.tag_name}/${name}`;
    if(!asset||asset.browser_download_url!==url||!/^sha256:[a-f0-9]{64}$/.test(asset.digest??''))throw Error('Verifiziertes offizielles Release fehlt.');
    const bytes=await bytesOf(await fetcher(url,{signal:AbortSignal.timeout(120000)}),80*1024*1024);const sha=createHash('sha256').update(bytes).digest('hex');if('sha256:'+sha!==asset.digest)throw Error('Release-Prüfsumme stimmt nicht.');
    const files=extractBundle(bytes);await mkdir(root,{recursive:true,mode:0o700});staging=join(root,'install-'+randomUUID());await mkdir(staging,{mode:0o700});
    for(const [name,data] of files){await writeFile(join(staging,name),data,{mode:0o700,flag:'wx'});}
    const destination=join(root,metadata.tag_name);let existing;try{existing=JSON.parse(await readFile(installed,'utf8'));}catch{/* first install */}
    if(existing?.version===metadata.tag_name){if(existing.sha256!==sha)throw Error('Prüfsumme eines bereits installierten Releases wurde geändert.');return existing;}
    await rm(destination,{recursive:true,force:true});await rename(staging,destination);staging=null;
    const record={version:metadata.tag_name,sha256:sha,source:url,platform,arch};await writeFile(installed+'.tmp',JSON.stringify(record),{mode:0o600});await rename(installed+'.tmp',installed);return record;
   }catch(error){lastError=safe(error.message);throw Error(lastError);}finally{installing=false;if(staging)await rm(staging,{recursive:true,force:true});}
  },
  async start(localUrl){
   if(child||installing)throw Error('Tunnel läuft oder Installation aktiv.');
   const {path,configFile,env}=await prepare(localUrl);await rm(join(root,'health-url'),{force:true});healthUrl=null;lastError=null;log='';
   const current=launch(path,['run','--config',configFile],{cwd:root,timeout:0,env,secrets:[apiKey,originKey,settings.token],onData:append});child=current;state='starting';
   current.done.then(result=>{if(child===current){child=null;state=result.stopped?'stopped':'failed';if(!result.stopped)lastError='Tunnel-Prozess beendet; Diagnose prüfen.';}}).catch(error=>{if(child===current){child=null;state='failed';lastError=safe(error.message);}});
   return {state};
  },
  async doctor(localUrl){if(child||installing)throw Error('Tunnel vor der Diagnose stoppen.');const {path,configFile,env}=await prepare(localUrl),result=await launch(path,['doctor','--config',configFile,'--explain'],{cwd:root,timeout:45000,env,secrets:[apiKey,originKey,settings.token]}).done;log=safe(result.stdout+'\n'+result.stderr);lastError=result.code===0?null:'Tunnel-Diagnose fehlgeschlagen.';return {ok:result.code===0,output:log};},
  async status(){
   let version=null;try{version=(await binary()).record.version;}catch{/* not installed */}
   if(child){try{
    const value=(await readFile(join(root,'health-url'),'utf8')).trim(),u=new URL(value);if(u.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(u.hostname)||u.username||u.password||u.search||u.hash)throw Error('Ungültige lokale Diagnoseadresse.');
    healthUrl=u.origin;const r=await fetcher(healthUrl+'/readyz',{signal:AbortSignal.timeout(1500)});state=r.ok?'ready':'starting';
   }catch{state='starting';}}
   return {state,version,installing,keyConfigured:!!apiKey,healthUrl,error:lastError,log:safe(log)};
  },
  async stop(){if(child){const current=child;current.stop();await current.done.catch(()=>{});child=null;}state='stopped';healthUrl=null;},
 };
}
