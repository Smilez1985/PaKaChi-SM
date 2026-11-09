import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const run=(args)=>spawnSync(process.execPath,['scripts/benchmark-playback-transition.mjs',...args],{encoding:'utf8',timeout:120000});
test('transition benchmark measures supplied geometry without changing its source',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'transition-'));
 try{
  const path=join(dir,'triangle.gltf'),positions=Buffer.alloc(36);[0,0,0,1,0,0,0,1,0].forEach((n,i)=>positions.writeFloatLE(n,i*4));
  const source=JSON.stringify({asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{byteLength:36,uri:'data:application/octet-stream;base64,'+positions.toString('base64')}],bufferViews:[{buffer:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]}]});
  await writeFile(path,source);const result=run(['--model',path,'--runs','1']);assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);assert.equal(report.fixture,'supplied-model');assert.equal(report.runs,1);assert.equal(report.samples.length,3);assert.equal(report.modelSha256,createHash('sha256').update(source).digest('hex'));
  assert.deepEqual(report.samples.map(s=>s.selectedVertices),[0,3,3]);assert.equal(await readFile(path,'utf8'),source);
  await writeFile(path,JSON.stringify({asset:{version:'2.0'},images:[{uri:'https://example.invalid/texture.png'}]}));const image=run(['--model',path,'--runs','1']);assert.notEqual(image.status,0);assert.match(image.stderr,/Image textures require browser decoding/);
  await writeFile(path,Buffer.from('glTF'));const bad=run(['--model',path]);assert.notEqual(bad.status,0);assert.match(bad.stderr,/Invalid GLB JSON chunk/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('transition benchmark validates options before measurement',()=>{
 for(const args of [['--runs','0'],['--runs','11'],['--runs','1.5'],['--runs'],['--runs','1','--runs','2'],['--unknown','x']])assert.notEqual(run(args).status,0,JSON.stringify(args));
 const help=run(['--help']);assert.equal(help.status,0);assert.match(help.stdout,/--model/);
});
