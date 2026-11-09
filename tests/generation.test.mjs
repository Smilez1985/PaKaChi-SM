import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generate,inspectGenerated,checkEnvironment} from '../scripts/generate-model.mjs';
import {glb} from './generation-fixture.mjs';
import {orientTripoSRGlb} from '../scripts/orient-triposr.mjs';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'pakachi-generation-'));t.after(()=>rm(root,{recursive:true,force:true}));const input=join(root,'input name.png');await writeFile(input,'original-input');return {root,input,options:{repo:root,image:input,output:join(root,'results')},check:async()=>({ready:true,blockers:[],testDouble:true})};}
test('generated GLB is loaded by the player and classified as unrigged, not a finished avatar',async t=>{const f=await fixture(t),file=join(f.root,'mesh.glb');await writeFile(file,glb());const report=await inspectGenerated(file);assert.equal(report.vertices,3);assert.equal(report.triangles,1);assert.equal(report.bones,0);assert.equal(report.visualReview,'pending');await writeFile(file,'not a model');await assert.rejects(()=>inspectGenerated(file));});
test('generation keeps input unchanged, separates runs and records a technically checked but unreviewed result',async t=>{
 const f=await fixture(t);let calls=0;
 const launch=async(_python,args,{cwd,onData})=>{calls++;assert.equal(cwd,f.root);assert.ok(args.includes('--model-save-format'));assert.ok(!args.includes('--bake-texture'));const destination=join(args[args.indexOf('--output-dir')+1],'0');await mkdir(destination,{recursive:true});await writeFile(join(destination,'mesh.glb'),glb());onData('synthetic backend for orchestration test only');return {code:0};};
 const a=await generate(f.options,{check:f.check,launch}),b=await generate(f.options,{check:f.check,launch});assert.equal(calls,2);assert.notEqual(a.job,b.job);assert.equal(a.report.status,'generated-unreviewed');assert.equal(a.report.transformationReview,'pending');assert.equal(await readFile(f.input,'utf8'),'original-input');assert.equal(JSON.parse(await readFile(join(a.job,'report.json'),'utf8')).model.bones,0);
 for(const result of [a,b]){
  assert.deepEqual(await readFile(join(result.job,result.report.orientation.nativeFile)),glb());
  assert.deepEqual(await readFile(join(result.job,result.report.model.file)),orientTripoSRGlb(glb()));
 }
});
test('backend errors and invalid outputs produce failed reports, never success',async t=>{const f=await fixture(t);for(const launch of [async()=>({code:7}),async()=>({code:0}),async()=>{throw new Error('timeout');}]){const r=await generate(f.options,{check:f.check,launch});assert.equal(r.report.status,'failed');assert.ok(r.report.error);assert.equal(JSON.parse(await readFile(join(r.job,'report.json'),'utf8')).status,'failed');}});
test('blocked preflight and invalid input cannot start generation',async t=>{const f=await fixture(t);let calls=0;const launch=async()=>{calls++;return {code:0};};await assert.rejects(()=>generate(f.options,{check:async()=>({ready:false,blockers:['no GPU']}),launch}),/no GPU/);await assert.rejects(()=>generate({...f.options,resolution:Infinity},{check:f.check,launch}));assert.equal(calls,0);const environment=await checkEnvironment({python:join(f.root,'no-python'),repo:f.root});assert.equal(environment.ready,false);assert.ok(environment.blockers.length>=2);});
test('TripoSR orientation maps native front to player front without changing geometry bytes or rotating twice',async t=>{
 const f=await fixture(t),native=glb(),oriented=orientTripoSRGlb(native),file=join(f.root,'oriented.glb');
 const bin=b=>b.subarray(20+b.readUInt32LE(12));assert.deepEqual(bin(oriented),bin(native));assert.deepEqual(orientTripoSRGlb(oriented),oriented);
 await writeFile(file,oriented);const info=await inspectGenerated(file);assert.equal(info.vertices,3);assert.equal(info.bones,0);assert.equal(info.clips,0);
 // Native XY triangle becomes an XZ triangle: x->z, y->x, z->y.
 info.bounds.min.forEach(v=>assert.ok(Math.abs(v)<1e-7));assert.deepEqual(info.bounds.max.map(v=>Math.round(v)),[1,0,1]);
 assert.throws(()=>orientTripoSRGlb(Buffer.from('broken')));
});
