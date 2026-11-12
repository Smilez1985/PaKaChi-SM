import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,readdir,symlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mergeZoo} from '../scripts/merge-zoo.mjs';
import {zooPackage} from '../scripts/export-zoo.mjs';
import {parseCatalog} from '../src/catalog.ts';
import {emptyStudio} from '../src/studio-data.ts';
import {glb} from './generation-fixture.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'pakachi-merge-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
async function pack(root,id){const p=zooPackage({format:'pakachi-studio',version:1,model:glb().toString('base64'),avatar:{id:'source',name:id,description:'Test',moves:[]},studio:emptyStudio()},id);const dir=join(root,id);await mkdir(join(dir,'model-zoo/projects'),{recursive:true});await writeFile(join(dir,p.path),p.project);await writeFile(join(dir,'model-zoo/catalog.json'),JSON.stringify(p.catalog));return {dir,...p};}
test('merge preserves bundled avatars and project bytes, produces checksummed catalog without changing inputs',async t=>{
 const root=await fixture(t),incoming=await pack(root,'own'),base=resolve('public'),catalogBefore=await readFile(join(base,'model-zoo/catalog.json')),output=join(root,'result'),bundled=parseCatalog(JSON.parse(catalogBefore));const report=await mergeZoo({base,package:incoming.dir,output});assert.deepEqual(report.avatars.map(a=>a.id),[...bundled.map(a=>a.id),'own']);
 assert.equal(parseCatalog(JSON.parse(await readFile(join(output,'model-zoo/catalog.json'),'utf8'))).length,bundled.length+1);assert.deepEqual(await readFile(join(base,'model-zoo/catalog.json')),catalogBefore);assert.equal(await readFile(join(incoming.dir,incoming.path),'utf8'),incoming.project);
 for(const item of report.files){const bytes=await readFile(join(output,item.path));assert.equal(hash(bytes),item.sha256);assert.equal(bytes.length,item.bytes);}
 for(const avatar of bundled)assert.deepEqual(await readFile(join(output,avatar.model)),await readFile(join(base,avatar.model)));
 assert.deepEqual((await readdir(output)).sort(),['README.txt','merge-report.json','model-zoo']);
});
test('duplicate IDs and normalized resource paths fail before creating output',async t=>{
 const root=await fixture(t),a=await pack(root,'a'),b=await pack(root,'b');const output=join(root,'result');
 const duplicate=structuredClone(b.catalog);duplicate.avatars[0].id='a';await writeFile(join(b.dir,'model-zoo/catalog.json'),JSON.stringify(duplicate));await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output}));
 const paths=structuredClone(b.catalog);paths.avatars[0].project='model-zoo//projects/a.pakachi.json';await writeFile(join(b.dir,'model-zoo/catalog.json'),JSON.stringify(paths));await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output}),/Doppelter Dateipfad/);assert.ok(!(await readdir(root)).includes('result'));
});
test('missing, malformed and identity-mismatched source files leave sources and output untouched',async t=>{
 const root=await fixture(t),a=await pack(root,'a'),b=await pack(root,'b'),output=join(root,'result');const source=join(b.dir,b.path);
 for(const content of ['not JSON',JSON.stringify({...JSON.parse(b.project),avatar:{...JSON.parse(b.project).avatar,id:'other'}})]){await writeFile(source,content);await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output}));assert.equal(await readFile(source,'utf8'),content);}
 await rm(source);await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output}));assert.ok(!(await readdir(root)).includes('result'));
});
test('escaping symlink and output inside an input root are rejected',async t=>{
 const root=await fixture(t),a=await pack(root,'a'),b=await pack(root,'b'),source=join(b.dir,b.path),outside=join(root,'outside.json');await writeFile(outside,b.project);await rm(source);let symlinkCreated=false;try{await symlink(outside,source);symlinkCreated=true;}catch(error){if(!['EPERM','EACCES'].includes(error.code))throw error;t.diagnostic('Symlink-Sicherheitsfall mangels Windows-Symlink-Berechtigung nicht ausgeführt.');}
 if(symlinkCreated){await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output:join(root,'result')}),/außerhalb/);assert.ok(!(await readdir(root)).includes('result'));}await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output:join(a.dir,'nested')}),/außerhalb/);
});
test('external model dependencies and reserved IDs are rejected before writing',async t=>{
 const root=await fixture(t),a=await pack(root,'a'),b=await pack(root,'b'),output=join(root,'result'),project=JSON.parse(b.project);project.model=Buffer.from(JSON.stringify({asset:{version:'2.0'},buffers:[{uri:'https://example.invalid/model.bin'}]})).toString('base64');await writeFile(join(b.dir,b.path),JSON.stringify(project));await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output}),/externe Ressourcen/);
 const catalog=structuredClone(b.catalog);catalog.avatars[0].id='saved-b';await writeFile(join(b.dir,'model-zoo/catalog.json'),JSON.stringify(catalog));await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output}),/Reservierte/);assert.ok(!(await readdir(root)).includes('result'));
});
test('existing output is never overwritten and CLI performs a real merge',async t=>{
 const root=await fixture(t),a=await pack(root,'a'),b=await pack(root,'b'),output=join(root,'result');const command=spawnSync(process.execPath,['scripts/merge-zoo.mjs','--base',a.dir,'--package',b.dir,'--output',output],{encoding:'utf8'});assert.equal(command.status,0,command.stderr);const before=await readFile(join(output,'model-zoo/catalog.json'));
 await assert.rejects(()=>mergeZoo({base:a.dir,package:b.dir,output}),/EEXIST/);assert.deepEqual(await readFile(join(output,'model-zoo/catalog.json')),before);
});
