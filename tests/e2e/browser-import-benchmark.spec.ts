import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {measureBrowserProject} from '../../scripts/benchmark-browser-import.mjs';

test('browser benchmark measures a textured project through a new canvas without modifying its source',async({browser,page,baseURL},testInfo)=>{
 await page.goto('/');
 const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2;c.height=2;const g=c.getContext('2d')!;g.fillStyle='#34d399';g.fillRect(0,0,2,2);return c.toDataURL('image/png');});
 const data=Buffer.alloc(60);[0,0,0,1,0,0,0,1,0,0,0,1,0,0,1].forEach((n,i)=>data.writeFloatLE(n,i*4));
 const model={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],
  meshes:[{primitives:[{attributes:{POSITION:0,TEXCOORD_0:1},material:0}]}],
  buffers:[{byteLength:data.length,uri:'data:application/octet-stream;base64,'+data.toString('base64')}],
  bufferViews:[{buffer:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:24}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]},{bufferView:1,componentType:5126,count:3,type:'VEC2'}],
  images:[{uri:image}],textures:[{source:0}],materials:[{doubleSided:true,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:1},alphaMode:'MASK',alphaCutoff:.5}]};
 const source=JSON.stringify({format:'pakachi-studio',version:1,model:Buffer.from(JSON.stringify(model)).toString('base64'),avatar:{id:'textured-benchmark',name:'Textured benchmark',description:'',moves:[]},studio:{points:[],links:[],boneRest:[],poses:[],moves:[]}});
 const path=testInfo.outputPath('textured-project.json');await writeFile(path,source);
 const samples=[];
 for(let i=0;i<2;i++)samples.push(await measureBrowserProject(browser,{url:baseURL!,project:path,screenshot:i===0?testInfo.outputPath('textured-import.png'):undefined}));
 for(const sample of samples){
  expect(sample.projectSha256).toBe(createHash('sha256').update(source).digest('hex'));expect(sample.projectBytes).toBe(Buffer.byteLength(source));
  expect(sample.fileReadMs).toBeGreaterThanOrEqual(0);expect(sample.readyMs).toBeGreaterThanOrEqual(sample.fileReadMs);
  expect(sample.firstDrawMs).toBeGreaterThanOrEqual(sample.readyMs);expect(sample.frameBoundaryMs).toBeGreaterThanOrEqual(sample.firstDrawMs);
  expect(sample.drawCalls).toBeGreaterThan(0);expect(sample.imageBitmapsDecoded).toBe(1);expect(sample.canvas.width).toBeGreaterThan(0);expect(sample.canvas.height).toBeGreaterThan(0);expect(sample.webglVersion).toContain('WebGL 2');
 }
 expect(await readFile(path,'utf8')).toBe(source);
 await testInfo.attach('browser-import-samples',{body:Buffer.from(JSON.stringify(samples,null,2)),contentType:'application/json'});
});

test('browser benchmark rejects a failed project import instead of reporting the previous avatar',async({browser,baseURL},testInfo)=>{
 const path=testInfo.outputPath('invalid-project.json');await writeFile(path,'{}');
 await expect(measureBrowserProject(browser,{url:baseURL!,project:path})).rejects.toThrow(/Project import failed/);
 expect(await readFile(path,'utf8')).toBe('{}');
});
