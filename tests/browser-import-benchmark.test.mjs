import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {parseBrowserImportArgs} from '../scripts/benchmark-browser-import.mjs';

test('browser import benchmark bounds runs and fixture work and never alters supplied projects',()=>{
 assert.deepEqual(parseBrowserImportArgs([]),{runs:3,transfers:256,renderer:'software'});
 assert.deepEqual(parseBrowserImportArgs(['--project','a.json','--runs','10','--renderer','default']),{project:resolve('a.json'),runs:10,transfers:256,renderer:'default'});
 assert.equal(parseBrowserImportArgs(['--transfers','0']).transfers,0);
 assert.equal(parseBrowserImportArgs(['--transfers','1024']).transfers,1024);
 for(const args of [
  ['--runs','0'],['--runs','11'],['--runs','1.5'],['--runs','NaN'],['--runs','-1'],['--runs','1','--runs','2'],
  ['--transfers','1025'],['--transfers','Infinity'],['--project','a','--transfers','0'],['--renderer','bogus'],
  ['--project',''],['--project'],['--unknown','1'],['--runs','1','extra'],
 ])assert.throws(()=>parseBrowserImportArgs(args),undefined,args.join(' '));
});
