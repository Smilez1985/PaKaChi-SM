import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {once} from 'node:events';
import {cpus,totalmem,platform,arch} from 'node:os';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {z} from 'zod';
import {createBridge} from '../bridge.mjs';
import {createSettings,connectionDetails,caddySnippet} from './settings.mjs';
import {createAssets} from './assets.mjs';
import {createJobs} from './jobs.mjs';
import {createTunnel} from './tunnel.mjs';
import {createLocalOAuth,equal} from './oauth.mjs';
import {createAcpHost} from './acp.mjs';
import {launchProcess} from './process.mjs';
import {localMcpServer} from './mcp.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url)),version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const localAddress=address=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address);
const media={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.gif':'image/gif','.ico':'image/x-icon'};
async function jsonBody(req,limit=1024*1024){
 if(!String(req.headers['content-type']??'').startsWith('application/json'))throw Error('JSON-Anfrage erforderlich.');
 let size=0;const chunks=[];for await(const b of req){size+=b.length;if(size>limit)throw Error('Anfrage zu groß.');chunks.push(b);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function createLocalApplication({directory=join(root,'.pakachi-local'),dist=join(root,'dist'),seed=true,...dependencies}={}){
 const settings=await createSettings(directory),assets=await createAssets(settings.root),tunnel=createTunnel(settings,dependencies.tunnel),acp=createAcpHost(dependencies.acp);
 if(seed){for(const [name,file] of [['PaKaChi-Normalform-Quelle.glb','pakachi-drafts/animal.glb'],['PaKaChi-Arbeitsform-Quelle.glb','pakachi-drafts/humanoid.glb'],['PaKaChi-Normalform-Rig.glb','pakachi-rigged/animal.glb'],['PaKaChi-Arbeitsform-Rig.glb','pakachi-rigged/humanoid.glb']]){try{const bytes=await readFile(join(root,'public/model-zoo',file));const hash=(await import('node:crypto')).createHash('sha256').update(bytes).digest('hex');if(!assets.list().some(a=>a.sha256===hash))await assets.add(name,bytes);}catch(error){if(error.code!=='ENOENT')throw error;}}}
 const bridge=createBridge({token:settings.token,port:0});await once(bridge.server,'listening');
 let origin='',acpEnv={},probe=null,closing=false,boundHost=settings.value.listenHost;const csrf=randomBytes(32).toString('hex'),sessions=new Set(),mcpConnections=new Set();
 const oauth=createLocalOAuth(settings,()=>origin);
 const jobs=await createJobs(settings,assets,{...dependencies.jobs,acp,acpConfig:id=>{
  const token=oauth.localToken('acp:'+id,settings.value.jobTimeout+60);
  return {env:acpEnv,secrets:[token,...Object.values(acpEnv)],mcp:{name:'pakachi-local',command:process.execPath,args:[join(root,'server/runtime-stdio.mjs'),'--url',origin+'/mcp'],env:[{name:'PAKACHI_MCP_TOKEN',value:token}]}};
 }});
 const status=()=>({version,enabled:settings.value.enabled,allowScripts:settings.value.allowScripts,playerConnected:bridge.connected,hardware:{platform:platform(),arch:arch(),cpu:cpus()[0]?.model??'unknown',cpuThreads:cpus().length,ramBytes:totalmem()},probe,tools:['blender','python','image-to-3d','inspect-model',...(settings.value.acpCommand?['acp']:[])],activeJobs:jobs.list().filter(j=>['queued','running'].includes(j.status)).map(j=>({id:j.id,kind:j.kind,status:j.status}))});
 const reply=(res,statusCode,value)=>{if(res.headersSent)return;res.writeHead(statusCode,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 const isAdmin=req=>localAddress(req.socket.remoteAddress)&&!req.headers.forwarded&&!req.headers['x-forwarded-for']&&!req.headers['x-forwarded-host']&&[`127.0.0.1:${server.address()?.port}`,`localhost:${server.address()?.port}`].includes(req.headers.host);
 const sessionValid=req=>{const value=String(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('pakachi_local='))?.slice(14);return sessions.has(value);};
 const refresh=async()=>({settings:settings.value,status:status(),assets:assets.list(),jobs:jobs.list(),tunnel:await tunnel.status(),approvals:oauth.approvals(),acpApprovals:acp.approvals(),boundHost,acpEnvConfigured:Object.keys(acpEnv),publicMcpUrl:settings.value.publicUrl,localMcpUrl:origin+'/mcp'});
 const redact=s=>[settings.token,...Object.values(acpEnv)].filter(Boolean).reduce((text,secret)=>text.split(secret).join('[redacted]'),String(s));
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','no-referrer');
  let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{return reply(res,400,{error:'Ungültige Adresse.'});}
  const cfg=settings.value,details=connectionDetails(cfg.publicUrl,origin),publicHost=cfg.publicUrl?new URL(cfg.publicUrl).host:null;
  const hosts=[`127.0.0.1:${server.address()?.port}`,`localhost:${server.address()?.port}`,...(publicHost?[publicHost]:[])];
  if(!hosts.includes(req.headers.host))return reply(res,403,{error:'Unzulässiger Host.'});
  const normalized=details.prefix&&url.pathname.startsWith(details.prefix+'/')?url.pathname.slice(details.prefix.length):url.pathname;
  const publicRoute=normalized==='/mcp'||['/authorize','/token','/register','/revoke'].includes(normalized)||normalized.startsWith('/oauth-wait/')||url.pathname.startsWith('/.well-known/oauth-');
  if(publicRoute){
   if(!cfg.enabled)return reply(res,403,{error:'Lokale Werkzeuge sind ausgeschaltet.'});
   if(req.headers.origin&&![origin,origin.replace('127.0.0.1','localhost'),details.resource.origin].includes(req.headers.origin))return reply(res,403,{error:'Unzulässiger Ursprung.'});
   if(normalized.startsWith('/oauth-wait/')){const result=oauth.wait(normalized.slice(12));return reply(res,result?200:404,result??{error:'Anfrage abgelaufen.'});}
   if(normalized!=='/mcp'){try{return oauth.handle(req,res);}catch{return reply(res,400,{error:'Anmeldeanfrage ungültig.'});}}
   const bearer=String(req.headers.authorization??'').match(/^Bearer (.+)$/i)?.[1];let auth;
   try{auth=equal(bearer,settings.token)?{token:bearer,clientId:'local',scopes:['pakachi:tools']}:await oauth.provider.verifyAccessToken(bearer);}
   catch{res.setHeader('WWW-Authenticate',`Bearer resource_metadata="${details.metadata.href}", scope="pakachi:tools"`);return reply(res,401,{error:'MCP-Anmeldung erforderlich.'});}
   if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{error:'Streamable HTTP: POST erforderlich.'});}
   let transport,mcp;try{
    const body=await jsonBody(req);req.auth=auth;mcp=localMcpServer({settings,assets,jobs,bridge,status,version});transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});mcpConnections.add(mcp);
    res.once('close',()=>{mcpConnections.delete(mcp);void transport?.close();void mcp?.close();});await mcp.connect(transport);await transport.handleRequest(req,res,body);
   }catch(error){reply(res,400,{error:redact(error.message)});if(mcp){mcpConnections.delete(mcp);await mcp.close();}}return;
  }
  if(url.pathname.startsWith('/api/local/')){
   if(!isAdmin(req)||req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return reply(res,403,{error:'Verwaltung ist nur direkt auf diesem Rechner erreichbar.'});
   if(!sessionValid(req))return reply(res,401,{error:'PaKaChi-Anwendung zuerst lokal öffnen.'});
   if(req.method!=='GET'&&!equal(req.headers['x-pakachi-local'],csrf))return reply(res,403,{error:'Lokale Sitzung fehlt.'});
   const route=url.pathname.slice(11);
   try{
    if(req.method==='GET'&&route==='bootstrap')return reply(res,200,{...await refresh(),csrf,player:{url:`ws://127.0.0.1:${bridge.server.address().port}`,token:settings.token}});
    if(req.method==='GET'&&route==='status')return reply(res,200,await refresh());
    if(req.method==='GET'&&route==='connection')return reply(res,200,{mcpServers:{pakachi:{command:process.execPath,args:[join(root,'server/runtime-stdio.mjs'),'--url',origin+'/mcp'],env:{PAKACHI_MCP_TOKEN:settings.token}}},acp:{cwd:settings.root,mcpServers:[{name:'pakachi-local',command:process.execPath,args:[join(root,'server/runtime-stdio.mjs'),'--url',origin+'/mcp'],env:[{name:'PAKACHI_MCP_TOKEN',value:settings.token}]}]}});
    if(req.method==='GET'&&route==='caddy')return reply(res,200,{snippet:caddySnippet(cfg.publicUrl,url.searchParams.get('upstream')??`127.0.0.1:${server.address().port}`)});
    if(req.method==='GET'&&route.startsWith('asset/')){const id=route.slice(6),path=await assets.file(id),info=assets.list().find(a=>a.id===id),bytes=await readFile(path);res.writeHead(200,{'Content-Type':media[extname(info.name)]??'application/octet-stream','Cache-Control':'no-store','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(info.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`});res.end(bytes);return;}
    if(req.method!=='POST')return reply(res,404,{error:'Unbekannte Verwaltungsfunktion.'});
    const body=await jsonBody(req);
    if(route==='settings'){
     const old=settings.value,next=await settings.update(body);
     if(old.enabled&&!next.enabled||old.allowScripts&&!next.allowScripts)await jobs.close();if(!next.enabled)await tunnel.stop();if(old.publicUrl!==next.publicUrl||!next.enabled)oauth.clear();
     if(next.listenHost!==boundHost)res.once('finish',()=>{setImmediate(()=>void rebind(next.listenHost).catch(()=>{}));});reply(res,200,{settings:next,rebind:next.listenHost!==boundHost});return;
    }
    if(route==='secrets'){
     const data=z.object({tunnelApiKey:z.string().max(4096).optional(),acpEnv:z.record(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),z.string().max(4096)).optional()}).strict().parse(body);
     if(data.tunnelApiKey!==undefined)tunnel.setKey(data.tunnelApiKey);if(data.acpEnv){if(Object.keys(data.acpEnv).length>32)throw Error('Zu viele ACP-Variablen.');acpEnv=data.acpEnv;}return reply(res,200,{savedInMemory:true});
    }
    if(route==='approve'){const a=z.object({id:z.string(),allow:z.boolean()}).strict().parse(body);oauth.approve(a.id,a.allow);return reply(res,200,{accepted:true});}
    if(route==='acp-approve'){const a=z.object({id:z.string().uuid(),option:z.string().max(100)}).strict().parse(body);acp.approve(a.id,a.option);return reply(res,200,{accepted:true});}
    if(route==='upload')return reply(res,200,await assets.upload(body));
    if(route==='text-asset'){const a=z.object({name:z.string(),text:z.string().max(262144)}).strict().parse(body);return reply(res,200,{asset:await assets.add(a.name,Buffer.from(a.text))});}
    if(route==='start-job')return reply(res,202,await jobs.start(body));
    if(route==='cancel-job')return reply(res,200,await jobs.cancel(body.id));
    if(route==='tunnel-install')return reply(res,200,await tunnel.install());
    if(route==='tunnel-start')return reply(res,202,await tunnel.start(origin));
    if(route==='tunnel-doctor')return reply(res,200,await tunnel.doctor(origin));
    if(route==='tunnel-stop'){await tunnel.stop();return reply(res,200,{state:'stopped'});}
    if(route==='detect'){
     const results={};
     for(const [name,command,args] of [['blender',cfg.blender,['--version']],['python',cfg.python,['-c',`import sys,json,importlib.util\nr={'python':sys.version.split()[0],'torch':False,'cuda':False}\nif importlib.util.find_spec('torch'):\n import torch\n r.update(torch=True,cuda=torch.cuda.is_available())\n if r['cuda']:r.update(gpu=torch.cuda.get_device_name(0),vramBytes=torch.cuda.get_device_properties(0).total_memory)\nprint(json.dumps(r))`]]]){
      try{const p=await launchProcess(command,args,{timeout:15000}).done;results[name]={ready:p.code===0,details:name==='python'&&p.code===0?JSON.parse(p.stdout.trim().split('\n').at(-1)):p.stdout.split('\n')[0]};}catch{results[name]={ready:false,details:'Programm unter dem eingestellten Pfad nicht verfügbar.'};}
     }
     probe=results;return reply(res,200,results);
    }
    return reply(res,404,{error:'Unbekannte Verwaltungsfunktion.'});
   }catch(error){return reply(res,400,{error:redact(error instanceof z.ZodError?'Eingaben prüfen.':error.message)});}
  }
  if(!isAdmin(req))return reply(res,403,{error:'Die PaKaChi-Oberfläche bleibt lokal.'});
  if(req.method!=='GET'&&req.method!=='HEAD')return reply(res,405,{error:'Methode nicht erlaubt.'});
  try{
   const path=decodeURIComponent(url.pathname),file=resolve(dist,'.'+(path==='/'?'/index.html':path)),part=relative(resolve(dist),file);if(isAbsolute(part)||part.startsWith('..')||path.includes('\0'))throw Error('path');
   const actual=await realpath(file),inside=relative(resolve(dist),actual);if(isAbsolute(inside)||inside.startsWith('..')||!(await stat(actual)).isFile())throw Error('path');let bytes=await readFile(actual);
   if(path==='/'||path==='/index.html'){
    if(sessions.size>=32)sessions.delete(sessions.values().next().value);const session=randomBytes(32).toString('hex');sessions.add(session);res.setHeader('Set-Cookie',`pakachi_local=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);bytes=Buffer.from(bytes.toString('utf8').replace('</head>','<meta name="pakachi-local-runtime" content="1"></head>'));
   }
   res.writeHead(200,{'Content-Type':media[extname(actual)]??'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{reply(res,404,{error:'Datei nicht gefunden. Anwendung zuerst bauen.'});}
 });
 server.headersTimeout=15000;server.requestTimeout=60000;
 async function rebind(host){const port=server.address().port;await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});await new Promise((accept,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.off('error',reject);boundHost=host;accept();});});}
 return {settings,assets,jobs,tunnel,oauth,acp,server,
  async listen(port=8787){await new Promise((accept,reject)=>{server.once('error',reject);server.listen(port,settings.value.listenHost,()=>{server.off('error',reject);accept();});});origin=`http://127.0.0.1:${server.address().port}`;return origin;},
  async close(){if(closing)return;closing=true;await jobs.close();await tunnel.stop();for(const m of mcpConnections)await m.close();await bridge.close();if(server.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});},
 };
}
