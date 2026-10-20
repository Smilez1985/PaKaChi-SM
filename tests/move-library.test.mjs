import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {exportMoves} from '../scripts/export-moves.mjs';
import {loadMoveLibrary,loadLibraryMove,parseMoveLibrary} from '../src/move-library.ts';
import {importMoveFile} from '../src/move-file.ts';
import {emptyStudio} from '../src/studio-data.ts';
const entry={id:'wave',name:'Wave',file:'moves/wave.pakachi-move.json'};
const catalog={schemaVersion:1,moves:[entry]};
const signal=()=>new AbortController().signal;
function fixture(){const studio=emptyStudio();studio.poses=[{id:'a',name:'A',seconds:1,values:{$figure:{position:[0,0,0],rotation:[0,0,0,1]}}},{id:'b',name:'B',seconds:1,values:{$figure:{position:[1,0,0],rotation:[0,0,0,1]}}}];studio.moves=[{id:'wave',name:'Wave',loop:true,poses:['a','b']}];return {format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]},studio};}
test('move collection rejects duplicate identities, paths and remote/traversal resources',()=>{
 assert.deepEqual(parseMoveLibrary(catalog),[entry]);
 for(const file of ['https://evil/a.json','../a.json','moves//a.pakachi-move.json','moves/a/../b.pakachi-move.json','moves/a.json'])assert.throws(()=>parseMoveLibrary({schemaVersion:1,moves:[{...entry,file}]}));
 assert.throws(()=>parseMoveLibrary({schemaVersion:1,moves:[entry,entry]}));assert.throws(()=>parseMoveLibrary({schemaVersion:1,moves:[entry,{...entry,id:'other'}]}));assert.throws(()=>parseMoveLibrary({...catalog,schemaVersion:2}));
});
test('bounded collection loading uses app base without credentials or redirects and checks identity',async()=>{
 const calls=[],fetcher=async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify(url.endsWith('catalog.json')?catalog:{move:{id:'wave'}}));};
 assert.equal((await loadMoveLibrary('/app/',signal(),fetcher)).length,1);await loadLibraryMove(entry,'/app/',signal(),fetcher);
 assert.deepEqual(calls.map(c=>c[0]),['/app/moves/catalog.json','/app/moves/wave.pakachi-move.json']);assert.ok(calls.every(c=>c[1].credentials==='omit'&&c[1].redirect==='error'));
 await assert.rejects(()=>loadLibraryMove(entry,'/',signal(),async()=>new Response('{"move":{"id":"other"}}')),/ID/);
});
test('stream limit, oversized headers, HTTP errors, invalid UTF-8 and abort prevent collection acceptance',async()=>{
 for(const response of [new Response('x',{status:404}),new Response('{}',{headers:{'content-length':'300000'}}),new Response(new Uint8Array(262145)),new Response(new Uint8Array([255]))])await assert.rejects(()=>loadMoveLibrary('/',signal(),async()=>response));
 const controller=new AbortController();controller.abort();let called=false;await assert.rejects(()=>loadMoveLibrary('/',controller.signal,async()=>{called=true;return new Response('{}');}));assert.equal(called,false);
 let sent=false;const aborting=new AbortController();const stream=new ReadableStream({pull(c){if(!sent){sent=true;c.enqueue(new TextEncoder().encode(JSON.stringify(catalog)));aborting.abort();}else c.close();}});await assert.rejects(()=>loadMoveLibrary('/',aborting.signal,async()=>new Response(stream)));
});
test('real CLI exports collection and files round-trip through loader and compatibility validation',async t=>{
 const root=await mkdtemp(join(tmpdir(),'pakachi-moves-'));t.after(()=>rm(root,{recursive:true,force:true}));const source=join(root,'source.json'),output=join(root,'result'),project=fixture(),original=JSON.stringify(project);await writeFile(source,original);
 const result=spawnSync(process.execPath,['scripts/export-moves.mjs','--project',source,'--output',output],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const fetcher=async path=>new Response(await readFile(join(output,path)));const entries=await loadMoveLibrary('',signal(),fetcher),file=await loadLibraryMove(entries[0],'',signal(),fetcher);const restored=await importMoveFile(file,project);assert.equal(restored.moves[1].id,'wave-2');assert.equal(restored.poses.length,4);assert.equal(await readFile(source,'utf8'),original);
 const before=await readFile(join(output,'moves/catalog.json'),'utf8');await assert.rejects(()=>exportMoves({project:source,output}),/EEXIST/);assert.equal(await readFile(join(output,'moves/catalog.json'),'utf8'),before);
});
test('empty or malformed project produces no export directory',async t=>{
 const root=await mkdtemp(join(tmpdir(),'pakachi-moves-invalid-'));t.after(()=>rm(root,{recursive:true,force:true}));const source=join(root,'source.json'),output=join(root,'result');
 for(const value of ['{',JSON.stringify({...fixture(),studio:emptyStudio()})]){await writeFile(source,value);await assert.rejects(()=>exportMoves({project:source,output}));await assert.rejects(()=>access(output));}
});
