/** Local, opt-in image-to-3D transport. Backend paths/options come only from the operator. */
import {createServer} from 'node:http';
import {createHash,timingSafeEqual} from 'node:crypto';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {generate} from '../scripts/generate-model.mjs';
const MAX_IMAGE=20*1024*1024;
function parseReferenceManifest(header){
 if(header===undefined)return undefined;
 if(typeof header!=='string'||header.length>8192)throw new Error('reference-size');
 let value;try{value=JSON.parse(decodeURIComponent(header));}catch{throw new Error('reference-json');}
 const keys=(item,expected)=>item&&typeof item==='object'&&!Array.isArray(item)&&Object.keys(item).sort().join(',')===expected.slice().sort().join(',');
 const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=128;
 if(!keys(value,['format','version','source','selection'])||value.format!=='pakachi-image-reference-generation'||value.version!==1)throw new Error('reference-format');
 const source=value.source,selection=value.selection;
 if(!keys(source,['sha256','width','height'])||typeof source.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(source.sha256)||!Number.isSafeInteger(source.width)||source.width<1||!Number.isSafeInteger(source.height)||source.height<1)throw new Error('reference-source');
 if(!keys(selection,['regionId','label','kind','avatar','form','view','crop','mask'])||!text(selection.regionId)||!text(selection.label)||!['avatar','form','view','detail','helper'].includes(selection.kind))throw new Error('reference-selection');
 for(const parent of [selection.avatar,selection.form,selection.view])if(!keys(parent,['id','label'])||!text(parent.id)||!text(parent.label))throw new Error('reference-parent');
 const crop=selection.crop,mask=selection.mask;
 if(!keys(crop,['x','y','width','height','sha256'])||typeof crop.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(crop.sha256)||![crop.x,crop.y,crop.width,crop.height].every(Number.isSafeInteger)||crop.x<0||crop.y<0||crop.width<1||crop.height<1||crop.x+crop.width>source.width||crop.y+crop.height>source.height)throw new Error('reference-crop');
 if(!keys(mask,['type','vertices','holes'])||!['rectangle','polygon'].includes(mask.type)||!Number.isSafeInteger(mask.vertices)||mask.vertices<(mask.type==='polygon'?3:4)||mask.vertices>4096||!Number.isSafeInteger(mask.holes)||mask.holes<0||mask.holes>64||(mask.type==='rectangle'&&mask.holes!==0))throw new Error('reference-mask');
 return value;
}
const png=Buffer.from([137,80,78,71,13,10,26,10]);
export function createGenerationService({token,origin='http://127.0.0.1:5173',...backend},{run=generate}={}){
 if(typeof token!=='string'||!/^[-_a-zA-Z0-9]{32,256}$/.test(token))throw new Error('A 32–256 character token is required.');
 const url=new URL(origin);
 if(url.origin!==origin||!['http:','https:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new Error('Exact local Studio origin required.');
 if(!backend.repo)throw new Error('TripoSR repo required.');
 const authorization=Buffer.from('Bearer '+token);let active,activeDone=Promise.resolve();
 const server=createServer(async(req,res)=>{
  const reply=(status,error)=>{if(!res.destroyed&&!res.headersSent){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({error}));}};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  // Host check also prevents DNS rebinding. No wildcard CORS, cookies or URL credentials.
  if(req.headers.host!==`127.0.0.1:${server.address()?.port}`){reply(403,'host');return;}
  if(req.headers.origin!==undefined&&req.headers.origin!==origin){reply(403,'origin');return;}
  if(req.headers.origin===origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(!['/capabilities','/generate'].includes(req.url)){reply(404,'route');return;}
  if(req.method==='OPTIONS'){
   const method=req.headers['access-control-request-method'];
   const headers=(req.headers['access-control-request-headers']??'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
   if(req.headers.origin!==origin||method!==(req.url==='/generate'?'POST':'GET')||headers.some(x=>!['authorization','content-type','x-pakachi-reference'].includes(x))){reply(403,'preflight');return;}
   res.writeHead(204,{'Access-Control-Allow-Methods':method,'Access-Control-Allow-Headers':'authorization, content-type, x-pakachi-reference'});res.end();return;
  }
  const provided=Buffer.from(req.headers.authorization??'');
  if(provided.length!==authorization.length||!timingSafeEqual(provided,authorization)){reply(401,'authorization');return;}
  if(req.url==='/capabilities'&&req.method==='GET'){
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({protocol:'pakachi-generation-v1',model:'triposr',capabilities:['image-to-3d'],input:['image/png','image/jpeg'],prompt:false,rigging:false}));return;
  }
  if(req.url!=='/generate'||req.method!=='POST'){reply(405,'method');return;}
  if(active){reply(409,'busy');return;}
  const media=req.headers['content-type'];
  if(!['image/png','image/jpeg'].includes(media)){reply(415,'image-type');return;}
  let reference;try{reference=parseReferenceManifest(req.headers['x-pakachi-reference']);}catch{reply(400,'reference-manifest');return;}
  if(Number(req.headers['content-length'])>MAX_IMAGE){reply(413,'image-size');return;}
  const controller=new AbortController();active=controller;let complete;activeDone=new Promise(resolve=>{complete=resolve;});
  const disconnect=()=>{if(!res.writableEnded)controller.abort();};res.on('close',disconnect);
  // Includes upload, preflight, inference and validation; backend also has its own process deadline.
  const timer=setTimeout(()=>{controller.abort();reply(504,'timeout');},((backend.timeout??1800)+60)*1000);
  let staging;
  try{
   const chunks=[];let size=0;
   for await(const chunk of req){controller.signal.throwIfAborted();size+=chunk.length;if(size>MAX_IMAGE){reply(413,'image-size');return;}chunks.push(chunk);}
   const bytes=Buffer.concat(chunks);
   if(reference&&createHash('sha256').update(bytes).digest('hex')!==reference.selection.crop.sha256.toLowerCase()){reply(400,'reference-crop-hash');return;}
   if(media==='image/png'?!bytes.subarray(0,8).equals(png):!(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)){reply(415,'image-signature');return;}
   controller.signal.throwIfAborted();
   const output=resolve(backend.output??'generated');await mkdir(output,{recursive:true});staging=await mkdtemp(join(output,'.upload-'));
   const image=join(staging,media==='image/png'?'source.png':'source.jpg');await writeFile(image,bytes,{flag:'wx',mode:0o600});
   const result=await run({...backend,output,image,signal:controller.signal,reference});controller.signal.throwIfAborted();
   if(result.report.status!=='generated-unreviewed'){reply(502,'generation-failed');return;}
   if(reference)await writeFile(join(result.job,'pakachi-reference.json'),JSON.stringify(reference,null,2),{flag:'wx',mode:0o600});
   // Fixed backend-owned output location; never take a path from the request or report.
   const model=await readFile(join(result.job,'result','0','mesh.glb'));controller.signal.throwIfAborted();
   if(model.length>50*1024*1024){reply(502,'model-size');return;}
   await rm(staging,{recursive:true,force:true});staging=undefined;controller.signal.throwIfAborted();
   res.writeHead(200,{'Content-Type':'model/gltf-binary','Content-Length':model.length});res.end(model);
  }catch{reply(controller.signal.aborted?499:502,controller.signal.aborted?'cancelled':'generation-failed');}
  finally{clearTimeout(timer);res.off('close',disconnect);try{if(staging)await rm(staging,{recursive:true,force:true});}catch{/* Failed staging cleanup must not retain the inference lock. */}finally{active=undefined;complete();}}
 });
 server.requestTimeout=60000;server.headersTimeout=15000;
 return {
  listen:port=>new Promise((accept,reject)=>{server.once('error',reject);server.listen(port??8766,'127.0.0.1',()=>{server.off('error',reject);accept(`http://127.0.0.1:${server.address().port}`);});}),
  close:async()=>{active?.abort();await new Promise((accept,reject)=>{server.close(error=>error?reject(error):accept());server.closeAllConnections();});await activeDone;},
 };
}
async function main(){
 const {values:v}=parseArgs({options:{repo:{type:'string'},python:{type:'string',default:'python'},output:{type:'string',default:'generated'},device:{type:'string',default:'cuda:0'},resolution:{type:'string',default:'256'},timeout:{type:'string',default:'1800'},port:{type:'string',default:'8766'},origin:{type:'string',default:'http://127.0.0.1:5173'}}});
 const port=Number(v.port),timeout=Number(v.timeout),resolution=Number(v.resolution);
 if(!Number.isInteger(port)||port<1||port>65535||!Number.isInteger(timeout)||timeout<1||timeout>3600||!Number.isInteger(resolution)||resolution<64||resolution>512||!['cpu','cuda:0'].includes(v.device))throw new Error('Invalid service options.');
 const service=createGenerationService({...v,timeout,resolution,token:process.env.PAKACHI_GENERATION_TOKEN});
 console.log('PaKaChi generation service:',await service.listen(port),'— model triposr; no inference until POST /generate.');
 for(const event of ['SIGINT','SIGTERM'])process.once(event,()=>{void service.close();});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
