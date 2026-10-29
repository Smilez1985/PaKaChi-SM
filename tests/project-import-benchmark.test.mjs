import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {glb} from './generation-fixture.mjs';
const script=fileURLToPath(new URL('../scripts/benchmark-project-import.mjs',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8',timeout:30000});
test('import benchmark measures a supplied project without modifying it and reports repeatable reconstruction',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pakachi-benchmark-test-'));try{
  const path=join(dir,'project.json'),source=JSON.stringify({format:'pakachi-studio',version:1,model:Buffer.from(glb()).toString('base64'),avatar:{id:'test',name:'Test',description:'',moves:[]},studio:{points:[],links:[],boneRest:[],poses:[],moves:[]}});
  await writeFile(path,source);const result=run('--project',path,'--runs','2');assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.samples.length,2);assert.equal(report.fixture,'supplied-project');assert.equal(report.samples[0].projectSha256,report.samples[1].projectSha256);assert.ok(report.samples[0].vertices>0);
  for(const sample of report.samples){assert.ok(sample.totalMs>=0);for(const name of ['readMs','jsonMs','validateMs','decodeMs','modelParseMs','normalizeMs','rigBuildReplayMs'])assert.ok(Number.isFinite(sample.stages[name]));}
  assert.equal(await readFile(path,'utf8'),source);assert.notEqual(run('--project',path,'--transfers','1').status,0);
  const textured=JSON.parse(source);textured.model=Buffer.from(JSON.stringify({asset:{version:'2.0'},images:[{uri:'data:image/png;base64,AA=='}]})).toString('base64');await writeFile(path,JSON.stringify(textured));const imageResult=run('--project',path,'--runs','1');assert.notEqual(imageResult.status,0);assert.match(imageResult.stderr,/Image textures require browser decoding/);assert.equal(imageResult.stdout,'');
  await writeFile(path,'{}');const invalid=run('--project',path,'--runs','1');assert.notEqual(invalid.status,0);assert.equal(invalid.stdout,'');assert.equal(await readFile(path,'utf8'),'{}');
 }finally{await rm(dir,{recursive:true,force:true});}
});
