import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {zooPackage,exportZoo} from '../scripts/export-zoo.mjs';
import {parseCatalog} from '../src/catalog.ts';
import {loadCatalogProject,MAX_CATALOG_PROJECT} from '../src/catalog-project.ts';
import {emptyStudio} from '../src/studio-data.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {glb} from './generation-fixture.mjs';
function fixture(){const studio=emptyStudio();studio.poses=[{id:'a',name:'A',seconds:1,values:{}},{id:'b',name:'B',seconds:2,values:{}}];studio.moves=[{id:'wave',name:'Wave',loop:false,poses:['a','b']}];return {format:'pakachi-studio',version:1,model:glb().toString('base64'),avatar:{id:'local-import',name:'Own avatar',description:'',moves:[]},studio};}
test('export package round-trips a real model, Studio moves and stable catalog identity without unrelated fields',async()=>{
 const input=fixture();input.secret='credential';input.avatar.extra='credential';input.studio.poses[0].secret='credential';const pack=zooPackage(input,'my-avatar');assert.equal(pack.project.includes('credential'),false);assert.equal(input.avatar.id,'local-import');const avatar=parseCatalog(pack.catalog)[0];assert.equal(avatar.project,pack.path);assert.equal(avatar.model,'');
 const project=await loadCatalogProject(avatar,'/app/',new AbortController().signal,async(url,options)=>{assert.equal(url,'/app/'+pack.path);assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');return new Response(pack.project);});assert.equal(project.avatar.id,'my-avatar');assert.deepEqual(project.studio.moves,input.studio.moves);
 const model=await parseModel(Uint8Array.from(Buffer.from(project.model,'base64')).buffer);assert.equal(model.scene.getObjectsByProperty('isMesh',true).length,1);disposeModel(model.scene);
});
test('catalog project paths reject remote URLs, traversal and ambiguous sources',()=>{
 const pack=zooPackage(fixture(),'own'),raw=pack.catalog.avatars[0];for(const project of ['https://example.com/project.json','../own.pakachi.json','model-zoo/../own.pakachi.json','model-zoo/a%2fb.pakachi.json','model-zoo/a.pakachi.json?x=1'])assert.throws(()=>parseCatalog({schemaVersion:1,avatars:[{...raw,project}]}));assert.throws(()=>parseCatalog({schemaVersion:1,avatars:[{...raw,model:'model-zoo/mika/model.gltf'}]}));
 for(const id of ['saved-foo','pakachi-original','local-import','../bad',''])assert.throws(()=>zooPackage(fixture(),id));
});
test('loader rejects wrong identity, bad data, HTTP failures, oversized headers and pre-aborted reads',async()=>{
 const pack=zooPackage(fixture(),'own'),avatar=parseCatalog(pack.catalog)[0],signal=new AbortController().signal;
 for(const response of [new Response(JSON.stringify({...fixture(),avatar:{...fixture().avatar,id:'other'}})),new Response('bad json'),new Response('no',{status:404}),new Response(pack.project,{headers:{'content-length':String(MAX_CATALOG_PROJECT+1)}})])await assert.rejects(()=>loadCatalogProject(avatar,'/',signal,async()=>response));
 const controller=new AbortController();controller.abort();let calls=0;await assert.rejects(()=>loadCatalogProject(avatar,'/',controller.signal,async()=>{calls++;return new Response(pack.project);}));assert.equal(calls,0);
});
test('chunked project download assembles valid UTF-8, enforces actual size and rejects aborted publication',async()=>{
 const pack=zooPackage(fixture(),'own'),avatar=parseCatalog(pack.catalog)[0],bytes=new TextEncoder().encode(pack.project);const response=()=>new Response(new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=7)controller.enqueue(bytes.slice(i,i+7));controller.close();}}));
 assert.equal((await loadCatalogProject(avatar,'/',new AbortController().signal,async()=>response())).avatar.id,'own');
 const controller=new AbortController();await assert.rejects(()=>loadCatalogProject(avatar,'/',controller.signal,async()=>{controller.abort();return response();}));
 const chunk=new Uint8Array(41*1024*1024);let cancelled=false;const tooLarge=new Response(new ReadableStream({pull(c){c.enqueue(chunk);},cancel(){cancelled=true;}}));await assert.rejects(()=>loadCatalogProject(avatar,'/',new AbortController().signal,async()=>tooLarge),/80 MiB/);assert.equal(cancelled,true);
});
test('export creates a new package and refuses to overwrite any existing destination',async t=>{
 const root=await mkdtemp(join(tmpdir(),'pakachi-zoo-'));t.after(()=>rm(root,{recursive:true,force:true}));const source=join(root,'source.json'),output=join(root,'package');await writeFile(source,JSON.stringify(fixture()));
 await exportZoo({project:source,id:'own',output});const catalog=JSON.parse(await readFile(join(output,'model-zoo/catalog.json'),'utf8'));assert.equal(catalog.avatars[0].id,'own');const original=await readFile(join(output,'model-zoo/projects/own.pakachi.json'),'utf8');
 await assert.rejects(()=>exportZoo({project:source,id:'different',output}));assert.equal(await readFile(join(output,'model-zoo/projects/own.pakachi.json'),'utf8'),original);assert.deepEqual(await readdir(join(output,'model-zoo/projects')),['own.pakachi.json']);
});
test('invalid projects fail before output creation; command-line export accepts documented arguments',async t=>{
 const root=await mkdtemp(join(tmpdir(),'pakachi-zoo-cli-'));t.after(()=>rm(root,{recursive:true,force:true}));const source=join(root,'source.json'),output=join(root,'out');await writeFile(source,'{}');await assert.rejects(()=>exportZoo({project:source,id:'own',output}));assert.deepEqual(await readdir(root),['source.json']);await writeFile(source,JSON.stringify(fixture()));
 const result=spawnSync(process.execPath,['scripts/export-zoo.mjs','--project',source,'--id','own','--output',output],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(await readFile(join(output,'model-zoo/catalog.json'),'utf8')).avatars[0].id,'own');
});
