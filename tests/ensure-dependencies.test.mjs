import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ensureDependencies} from '../scripts/ensure-dependencies.mjs';

async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'pakachi-dependencies-'));
 await mkdir(join(root,'node_modules'),{recursive:true});
 await writeFile(join(root,'package-lock.json'),'{"lockfileVersion":3}\\n');
 t.after(()=>rm(root,{recursive:true,force:true}));
 return root;
}

test('dependency installer runs once for a lockfile and skips an unchanged tree',async t=>{
 const root=await fixture(t);let installs=0;
 const install=async()=>{installs++;return {status:0};};
 const first=await ensureDependencies({root,install}),second=await ensureDependencies({root,install});
 assert.equal(first.installed,true);assert.equal(second.installed,false);assert.equal(installs,1);
 assert.equal((await readFile(join(root,'node_modules','.pakachi-package-lock-sha256'),'utf8')).trim(),first.digest);
});

test('dependency installer reruns when package-lock changes',async t=>{
 const root=await fixture(t);let installs=0;
 const install=async()=>{installs++;return {status:0};};
 await ensureDependencies({root,install});await writeFile(join(root,'package-lock.json'),'{"lockfileVersion":3,"changed":true}\\n');
 const next=await ensureDependencies({root,install});
 assert.equal(next.installed,true);assert.equal(installs,2);
});

test('failed npm ci never records the new lockfile as installed',async t=>{
 const root=await fixture(t);
 await assert.rejects(()=>ensureDependencies({root,install:async()=>({status:1})}),/Exit-Code 1/);
 await assert.rejects(()=>readFile(join(root,'node_modules','.pakachi-package-lock-sha256')));
});
