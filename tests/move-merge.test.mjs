import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,access,symlink,truncate} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mergeMoves} from '../scripts/merge-moves.mjs';
import {exportMoves} from '../scripts/export-moves.mjs';
import {parseMoveFile,importMoveFile} from '../src/move-file.ts';
import {emptyStudio} from '../src/studio-data.ts';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'pakachi-move-merge-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
async function pack(root,id,model='AAAA'){
 const studio=emptyStudio();studio.poses=[{id:'a',name:'A',seconds:1,values:{$figure:{position:[0,0,0],rotation:[0,0,0,1]}}},{id:'b',name:'B',seconds:2,values:{$figure:{position:[1,0,0],rotation:[0,0,0,1],scale:2}}}];studio.moves=[{id,name:id,loop:true,poses:['a','b','a']}];
 const project={format:'pakachi-studio',version:1,model,avatar:{id:'avatar',name:'Avatar',description:'',moves:[]},studio};const source=join(root,id+'.json'),dir=join(root,id);await writeFile(source,JSON.stringify(project));await exportMoves({project:source,output:dir});return {dir,project,path:join(dir,'moves',id+'.pakachi-move.json')};
}
test('merge combines different model collections byte-for-byte, retains compatibility and records checksums',async t=>{
 const root=await fixture(t),a=await pack(root,'wave'),b=await pack(root,'jump','AQAA'),output=join(root,'combined'),before=await readFile(a.path);const report=await mergeMoves({base:a.dir,package:b.dir,output});
 assert.deepEqual(report.moves.map(m=>m.id),['wave','jump']);assert.deepEqual(await readFile(a.path),before);assert.deepEqual(await readFile(join(output,'moves/wave.pakachi-move.json')),before);
 for(const item of report.files){const bytes=await readFile(join(output,item.path));assert.equal(bytes.length,item.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);}
 const file=JSON.parse(await readFile(join(output,'moves/jump.pakachi-move.json'),'utf8'));assert.equal((await importMoveFile(file,b.project)).moves.length,2);await assert.rejects(()=>importMoveFile(file,a.project),/passt nicht/);
});
test('duplicate IDs and resource paths are rejected before creation',async t=>{
 const root=await fixture(t),a=await pack(root,'wave'),b=await pack(root,'jump'),output=join(root,'combined');
 for(const item of [{id:'wave',name:'Other',file:'moves/jump.pakachi-move.json'},{id:'jump',name:'Other',file:'moves/wave.pakachi-move.json'}]){await writeFile(join(b.dir,'moves/catalog.json'),JSON.stringify({schemaVersion:1,moves:[item]}));await assert.rejects(()=>mergeMoves({base:a.dir,package:b.dir,output}),/Doppelte/);await assert.rejects(()=>access(output));}
});
test('invalid poses, identity mismatch, malformed or missing files do not create output',async t=>{
 const root=await fixture(t),a=await pack(root,'wave'),b=await pack(root,'jump'),output=join(root,'combined'),original=JSON.parse(await readFile(b.path,'utf8'));
 for(const content of ['{',JSON.stringify({...original,move:{...original.move,id:'other'}}),JSON.stringify({...original,move:{...original.move,poses:['missing','a']}}),JSON.stringify({...original,poses:[{...original.poses[0],seconds:-1},original.poses[1]]})]){await writeFile(b.path,content);await assert.rejects(()=>mergeMoves({base:a.dir,package:b.dir,output}));await assert.rejects(()=>access(output));assert.equal(await readFile(b.path,'utf8'),content);}
 await rm(b.path);await assert.rejects(()=>mergeMoves({base:a.dir,package:b.dir,output}));await assert.rejects(()=>access(output));
});
test('escaping symlinks, nested output and oversized files are rejected',async t=>{
 const root=await fixture(t),a=await pack(root,'wave'),b=await pack(root,'jump'),output=join(root,'combined'),outside=join(root,'outside.json');await writeFile(outside,await readFile(b.path));await rm(b.path);let symlinkCreated=false;try{await symlink(outside,b.path);symlinkCreated=true;}catch(error){if(!['EPERM','EACCES'].includes(error.code))throw error;t.diagnostic('Symlink-Sicherheitsfall mangels Windows-Symlink-Berechtigung nicht ausgeführt.');}
 if(symlinkCreated){await assert.rejects(()=>mergeMoves({base:a.dir,package:b.dir,output}),/außerhalb/);await assert.rejects(()=>access(output));}await assert.rejects(()=>mergeMoves({base:a.dir,package:b.dir,output:join(a.dir,'new')}),/außerhalb/);
 await rm(b.path,{force:true});await writeFile(b.path,'');await truncate(b.path,8*1024*1024+1);await assert.rejects(()=>mergeMoves({base:a.dir,package:b.dir,output}),/groß/);await assert.rejects(()=>access(output));
});
test('CLI creates a merged collection and refuses an existing output without changes',async t=>{
 const root=await fixture(t),a=await pack(root,'wave'),b=await pack(root,'jump'),output=join(root,'combined'),args=['scripts/merge-moves.mjs','--base',a.dir,'--package',b.dir,'--output',output];const result=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const before=await readFile(join(output,'moves/catalog.json'));
 const again=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(again.status,1);assert.match(again.stderr,/EEXIST/);assert.deepEqual(await readFile(join(output,'moves/catalog.json')),before);
});
test('empty collections are supported and aggregate size is bounded before writing',async t=>{
 const root=await fixture(t),a=await pack(root,'wave'),empty=join(root,'empty');await mkdir(join(empty,'moves'),{recursive:true});await writeFile(join(empty,'moves/catalog.json'),'{"schemaVersion":1,"moves":[]}');assert.equal((await mergeMoves({base:a.dir,package:empty,output:join(root,'one')})).moves.length,1);
 const template=JSON.parse(await readFile(a.path,'utf8')),moves=[];
 for(let i=0;i<9;i++){const id='m'+i,file='moves/'+id+'.pakachi-move.json',content=JSON.stringify({...template,move:{...template.move,id}});await writeFile(join(empty,file),content+' '.repeat(8*1024*1024-content.length));moves.push({id,name:id,file});}await writeFile(join(empty,'moves/catalog.json'),JSON.stringify({schemaVersion:1,moves}));
 await assert.rejects(()=>mergeMoves({base:a.dir,package:empty,output:join(root,'too-large')}),/groß/);await assert.rejects(()=>access(join(root,'too-large')));
});
test('standalone structural validation checks track sets and unused poses without claiming model compatibility',async t=>{
 const root=await fixture(t),a=await pack(root,'wave'),file=JSON.parse(await readFile(a.path,'utf8'));assert.deepEqual(parseMoveFile(file).move.poses,['a','b','a']);
 const added=structuredClone(file);added.poses.push({...added.poses[0],id:'unused'});assert.throws(()=>parseMoveFile(added),/unbenutzte/);
 const invalid=structuredClone(file);invalid.poses[1].values.fake={position:[0,0,0],rotation:[0,0,0,1]};assert.throws(()=>parseMoveFile(invalid));
 const corrupt=structuredClone(file);corrupt.poses[0].values.$figure.rotation=[0,0,0,0];assert.throws(()=>parseMoveFile(corrupt));
});
