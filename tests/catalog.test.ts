import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { availableMoves, importedAvatar, parseCatalog, catalogChoices } from '../src/catalog.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {SkinnedMesh} from 'three';

const data = JSON.parse(readFileSync(new URL('../public/model-zoo/catalog.json', import.meta.url), 'utf8'));
test('catalog advertises real clips and keeps unrigged PaKaChi drafts static', async () => {
  if(typeof globalThis.ProgressEvent==='undefined')Object.defineProperty(globalThis,'ProgressEvent',{value:class extends Event {}});
  for (const avatar of parseCatalog(data)) {
    const bytes=readFileSync(new URL(`../public/${avatar.model}`, import.meta.url)),gltf=await parseModel(Uint8Array.from(bytes).buffer);
    try{
      let skins=0,bones=0;gltf.scene.traverse(node=>{if(node instanceof SkinnedMesh)skins++;if((node as any).isBone)bones++;});
      assert.equal(availableMoves(avatar,gltf.animations.map(a=>a.name)).length,avatar.moves.length);
      if(avatar.rigVersion==='unrigged-draft-1'){
        assert.equal(skins,0);assert.equal(bones,0);assert.equal(gltf.animations.length,0);assert.equal(avatar.moves.length,0);assert.equal(avatar.defaultMove,undefined);assert.deepEqual(avatar.states,{});
      }else assert.ok(skins>0);
    }finally{disposeModel(gltf.scene);}
  }
});
test('catalog rejects duplicate IDs, external paths and unknown schema', () => {
  assert.throws(() => parseCatalog({ ...data, avatars: [data.avatars[0], data.avatars[0]] }));
  assert.throws(() => parseCatalog({ ...data, avatars: [{ ...data.avatars[0], model: 'https://example.com/model.glb' }] }));
  assert.throws(() => parseCatalog({ ...data, schemaVersion: 999 }));
});
test('missing clips are never advertised', () => {
  assert.equal(availableMoves(parseCatalog(data)[0], []).length, 0);
  assert.deepEqual(availableMoves(parseCatalog(data)[0], ['nicken']).map(m => m.id), ['nicken']);
});
test('import IDs are distinct and static models have no invented moves', () => {
  assert.deepEqual(importedAvatar('static.glb', []).moves, []);
  assert.equal(new Set(importedAvatar('a.glb', ['wave', 'wave']).moves.map(m => m.id)).size, 2);
});

test('one catalog joins bundled and saved avatars with unique persistent IDs and metadata only',()=>{
 const builtins=parseCatalog(data),saved=[{id:'saved-one',name:'My avatar'}];
 const choices=catalogChoices(builtins,saved,{id:'saved-one',name:'My avatar'},false);
 assert.equal(choices.length,builtins.length+2);assert.equal(choices.filter(a=>a.selected).length,1);assert.equal(choices.find(a=>a.selected)?.source,'saved');
 assert.ok(choices.every(a=>Object.keys(a).sort().join(',')==='id,name,selected,source'));assert.throws(()=>catalogChoices(builtins,[{id:builtins[0].id,name:'Collision'}],null,false),/duplicate/);
});
test('deleting a loaded copy preserves its session identity until the avatar changes',()=>{
 const current={id:'saved-one',name:'My avatar'};
 const before=catalogChoices([], [current],current,false),after=catalogChoices([],[],current,false);assert.equal(before[1].id,after[1].id);assert.equal(after[1].source,'session');assert.equal(after[1].selected,true);
 const original=catalogChoices([],[],null,true);assert.equal(original.length,1);assert.equal(original[0].selected,true);
 const restored=catalogChoices([],[],current,false);assert.equal(restored[1].id,current.id,'model history can retain a removed stored identity');
});
