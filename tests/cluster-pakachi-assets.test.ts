import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {collectClusterMeshInventory,createClusterManifestFromGLTF} from '../src/cluster-inventory.ts';
import {validateClusterManifest} from '../src/cluster-architecture.ts';

if(typeof globalThis.ProgressEvent==='undefined'){
 Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event{
  constructor(type:string,init:Record<string,unknown>={}){super(type);Object.assign(this,init);}
 }});
}

test('real PaKaChi animal and work GLBs produce complete source-bound cluster inventories',async()=>{
 const cases=[
  {form:'animal' as const,path:'../public/model-zoo/pakachi-drafts/animal.glb'},
  {form:'humanoid' as const,path:'../public/model-zoo/pakachi-drafts/humanoid.glb'},
 ];
 for(const item of cases){
  const bytes=readFileSync(new URL(item.path,import.meta.url));
  const sourceHash=createHash('sha256').update(bytes).digest('hex');
  const gltf=await parseModel(Uint8Array.from(bytes).buffer);
  try{
   gltf.scene.updateMatrixWorld(true);
   const inventory=collectClusterMeshInventory(gltf,sourceHash);
   const manifest=createClusterManifestFromGLTF(gltf,sourceHash,item.form,'2026-11-12T00:00:00.000Z');
   assert.ok(inventory.totals.meshes>0,`${item.form}: expected real meshes`);
   assert.ok(inventory.totals.vertices>=3,`${item.form}: expected real vertices`);
   assert.ok(inventory.totals.triangles>0,`${item.form}: expected real triangles`);
   assert.equal(inventory.meshes.length,inventory.totals.meshes);
   assert.equal(manifest.sourceAssetSha256,sourceHash);
   assert.equal(manifest.form,item.form);
   assert.equal(manifest.assignments.length,inventory.totals.triangles);
   assert.deepEqual(validateClusterManifest(manifest),[]);
   assert.ok(manifest.assignments.every(a=>a.partId===null&&a.surfaceLayerId===null&&a.confidence===0));
   const seen=new Set<string>();
   gltf.scene.traverse(node=>{
    if(!(node as typeof node & {isMesh?:boolean}).isMesh)return;
    const mesh=node as import('three').Mesh;
    const position=mesh.geometry.getAttribute('position');
    assert.ok(position&&position.count>=3);
    assert.ok(mesh.matrixWorld.elements.every(Number.isFinite));
   });
   for(const mesh of inventory.meshes){assert.ok(!seen.has(mesh.id));seen.add(mesh.id);}
   assert.equal(seen.size,inventory.totals.meshes);
  }finally{disposeModel(gltf.scene);}
 }
});
