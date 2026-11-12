import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
const markerName='.pakachi-package-lock-sha256';

export async function ensureDependencies({root=defaultRoot,install}={}){
 const lockPath=join(root,'package-lock.json');
 const lock=await readFile(lockPath);
 const digest=createHash('sha256').update(lock).digest('hex');
 const markerPath=join(root,'node_modules',markerName);
 try{
  if((await readFile(markerPath,'utf8')).trim()===digest)return {installed:false,digest};
 }catch{/* A missing marker means a fresh or outdated dependency tree. */}
 const run=install??(()=>spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci'],{
  cwd:root,stdio:'inherit',shell:process.platform==='win32'
 }));
 const result=await run();
 if(result?.error)throw result.error;
 if(result?.status!==undefined&&result.status!==0)throw new Error('npm ci fehlgeschlagen (Exit-Code '+result.status+').');
 if(result?.status===undefined&&result?.ok===false)throw new Error('Abhängigkeitsinstallation fehlgeschlagen.');
 await mkdir(join(root,'node_modules'),{recursive:true});
 await writeFile(markerPath,digest+'\n',{mode:0o600});
 return {installed:true,digest};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 ensureDependencies().then(result=>console.log(result.installed?'PaKaChi-Abhängigkeiten wurden gemäß package-lock.json installiert.':'PaKaChi-Abhängigkeiten sind aktuell.')).catch(error=>{console.error(error.message);process.exitCode=1;});
}
