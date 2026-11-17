import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const advisory='GHSA-fc5q-39xc-vjpf';
const allowed=new Map([
 ['picomatch',via=>via.length>0&&via.every(item=>typeof item==='object'&&item.url?.includes(advisory))],
 ['fdir',via=>via.length>0&&via.every(item=>item==='picomatch')],
 ['tinyglobby',via=>via.length>0&&via.every(item=>item==='fdir'||item==='picomatch')&&via.includes('fdir')],
 ['vite',via=>via.length>0&&via.every(item=>item==='tinyglobby'||item==='picomatch')&&via.includes('tinyglobby')]
]);
const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
const auditRun=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['audit','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
let report;
try{report=JSON.parse(auditRun.stdout);}catch{process.stderr.write(auditRun.stderr||auditRun.stdout||'npm audit did not return JSON\n');process.exit(1);}
const findings=Object.entries(report.vulnerabilities??{});
if(findings.length===0){console.log('Dependency audit clean: 0 vulnerabilities.');process.exit(0);}
const expectedNames=new Set(allowed.keys());
const names=new Set(findings.map(([name])=>name));
const onlyKnown=names.size===expectedNames.size&&[...expectedNames].every(name=>names.has(name));
const known=findings.every(([name,item])=>{
 const nodes=item.nodes??[];
 const devOnly=nodes.length>0&&nodes.every(node=>lock.packages?.[node]?.dev===true);
 return expectedNames.has(name)&&item.severity==='high'&&devOnly&&allowed.get(name)(item.via??[]);
});
const direct=report.vulnerabilities?.picomatch;
const advisoryConfirmed=!!direct?.via?.some(item=>typeof item==='object'&&item.url?.includes(advisory)&&item.name==='picomatch');
if(!onlyKnown||!known||!advisoryConfirmed){
 console.error('Dependency audit failed: unexpected or expanded vulnerabilities detected.');
 for(const [name,item] of findings)console.error(name+': '+item.severity+'; via='+JSON.stringify(item.via));
 process.exit(1);
}
console.warn('Dependency audit exception: '+advisory+' remains HIGH in the Vite-only development toolchain (picomatch → fdir → tinyglobby → vite).');
console.warn('All affected lockfile nodes are dev-only; no fixed upstream npm release is currently recorded. Any additional finding, changed dependency path, or available fix fails this check.');
console.warn('This is a tracked temporary exception, NOT a clean audit. Recheck and remove the exception when upstream publishes a verified fix.');
