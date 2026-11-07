/** Browser import diagnostic; no production hooks, user-profile reuse or source edits. */
import {readFile,stat,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir,cpus} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {installImportProbe} from './browser-import-probe.mjs';
import {createImportFixture} from './benchmark-project-import.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const round=n=>Math.round(n*100)/100;
export function parseBrowserImportArgs(args){
 const options={runs:3,transfers:256,renderer:'software'},seen=new Set();
 for(let i=0;i<args.length;i+=2){
  const key=args[i],value=args[i+1];
  if(!['--project','--runs','--transfers','--renderer'].includes(key)||seen.has(key)||value===undefined)throw Error('Invalid arguments; use --help');
  seen.add(key);
  if(key==='--project'){if(!value.trim())throw Error('Expected project path');options.project=resolve(value);}
  else if(key==='--renderer'){if(!['software','default'].includes(value))throw Error('Renderer must be software or default');options.renderer=value;}
  else{if(!/^\d+$/.test(value))throw Error('Expected integer');const n=Number(value);if(key==='--runs'){if(n<1||n>10)throw Error('Runs must be 1..10');options.runs=n;}else{if(n>1024)throw Error('Transfers must be 0..1024');options.transfers=n;}}
 }
 if(options.project&&seen.has('--transfers'))throw Error('--transfers cannot modify a supplied project');
 return options;
}
async function inputBytes(path){
 if((await stat(path)).size>80*1024*1024)throw Error('Project exceeds 80 MiB');
 const bytes=await readFile(path);if(bytes.length>80*1024*1024)throw Error('Project exceeds 80 MiB');return bytes;
}
/** Fresh browser context per sample; app startup and the initial Mika load are excluded. */
export async function measureBrowserProject(browser,{url,project,timeout=60000,screenshot}){
 const before=await inputBytes(project),checksum=hash(before);
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];let measuring=false;
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(measuring&&message.type()==='error')errors.push(message.text());});
  page.setDefaultTimeout(timeout);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#avatar-select option[value="mika"]').waitFor({state:'attached'});
  await page.locator('#avatar-select').selectOption('mika');
  await page.waitForFunction(()=>{const state=window.PaKaChiSM?.call('get_state');return state?.ready&&state.capability.id==='mika';},null,{timeout});
  await page.evaluate(installImportProbe);
  measuring=true;
  await page.locator('#project-file').setInputFiles(project);
  await page.waitForFunction(()=>{const state=window.__pakachiImportBenchmark;return state?.result||state?.error;},null,{timeout});
  const state=await page.evaluate(()=>window.__pakachiImportBenchmark);
  if(state.error)throw Error(state.error);
  if(errors.length)throw Error('Browser error: '+errors.join('; '));
  const sample=state.result;
  for(const key of ['fileReadMs','readyMs','firstDrawMs','frameBoundaryMs'])if(!Number.isFinite(sample[key])||sample[key]<0)throw Error('Incomplete import timing: '+key);
  if(sample.readyMs>sample.firstDrawMs||sample.firstDrawMs>sample.frameBoundaryMs||!sample.drawCalls)throw Error('Invalid import/render ordering');
  // Read-only API snapshot is outside the timed interval.
  sample.studioCounts=await page.evaluate(()=>window.PaKaChiSM.call('get_studio').counts);
  if(screenshot)await page.locator('#viewport').screenshot({path:screenshot});
  if(hash(await inputBytes(project))!==checksum)throw Error('Project changed during measurement');
  for(const key of ['fileReadMs','readyMs','firstDrawMs','frameBoundaryMs'])sample[key]=round(sample[key]);
  return {projectSha256:checksum,projectBytes:before.length,...sample};
 }finally{await context.close();}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length===1&&args[0]==='--help'){
  console.log('Usage: npm run benchmark:browser-import -- [--project file.pakachi.json] [--runs 1..10] [--transfers 0..1024] [--renderer software|default]\nRequires npm ci and npx playwright install chromium. Builds a temporary production app and starts a loopback server. Default: Mika with 256 transfers, 3 fresh contexts, software WebGL. Source files remain unchanged. JSON on stdout; no performance pass/fail threshold.');return;
 }
 const options=parseBrowserImportArgs(args),temp=await mkdtemp(join(tmpdir(),'pakachi-browser-import-'));
 let server,browser;
 try{
  let project=options.project;
  if(!project){project=join(temp,'fixture.pakachi.json');await createImportFixture(project,options.transfers);}
  const initial=hash(await inputBytes(project));
  const {build,preview}=await import('vite'),{chromium}=await import('playwright');
  const outDir=join(temp,'dist');
  await build({root,configFile:false,logLevel:'silent',build:{outDir,emptyOutDir:true}});
  server=await preview({root,configFile:false,logLevel:'silent',build:{outDir},preview:{host:'127.0.0.1',port:0}});
  const address=server.httpServer.address();if(!address||typeof address==='string')throw Error('Missing preview port');
  browser=await chromium.launch({channel:'chromium',args:options.renderer==='software'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  const samples=[];
  for(let i=0;i<options.runs;i++)samples.push(await measureBrowserProject(browser,{url:`http://127.0.0.1:${address.port}`,project}));
  if(samples.some(sample=>sample.projectSha256!==initial)||hash(await inputBytes(project))!==initial)throw Error('Input changed between samples');
  const sorted=samples.map(s=>s.frameBoundaryMs).sort((a,b)=>a-b),mid=Math.floor(sorted.length/2),median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
  console.log(JSON.stringify({version:1,measuredAt:new Date().toISOString(),node:process.version,chromium:browser.version(),platform:process.platform,arch:process.arch,cpu:cpus()[0]?.model,
   rendererMode:options.renderer,runs:options.runs,fixture:options.project?'supplied-project':'mika',
   scope:'Production app, fresh context per sample, existing Chromium process. Starts at file-input change; includes File.text, JSON validation, model/image decoding, rig replay, UI installation and first WebGL draw submission plus next animation-frame boundary. Excludes build/server/browser/app startup, initial Mika load, Playwright file delivery, file chooser time, IndexedDB persistence and checksum calculation. GPU completion and physical display are not measured; browser/OS/driver caches may be warm. No performance pass/fail threshold.',
   medianFrameBoundaryMs:round(median),samples},null,2));
 }finally{try{await browser?.close();}finally{try{if(server)await new Promise((done,reject)=>server.httpServer.close(error=>error?reject(error):done()));}finally{await rm(temp,{recursive:true,force:true});}}}
}
if(resolve(process.argv[1]??'')===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
