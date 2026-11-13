import {test} from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {parseProject} from '../src/studio-data.ts';
import type {StudioProject} from '../src/studio-data.ts';
import {verifyImageReferenceSourceAsset} from '../src/image-reference.ts';
import type {ImageReferenceDocument} from '../src/image-reference.ts';

const reference:ImageReferenceDocument={
 format:'pakachi-image-reference',version:1,
 source:{sha256:'b'.repeat(64),width:640,height:480,asset:{mediaType:'image/png',data:'AQIDBA=='}},
 regions:[{id:'region-front',label:'Front view',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:20,y:30,width:200,height:300}}],
 views:[{id:'view-front',label:'Front',regionIds:['region-front']}],
 forms:[{id:'form-animal',label:'Animal form',viewIds:['view-front']}],
 avatars:[{id:'avatar-panda',label:'Panda',formIds:['form-animal']}],
};
const base:StudioProject={format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'panda',name:'Panda',description:'',moves:[]},studio:{points:[],links:[],boneRest:[],poses:[],moves:[]}};

test('project round-trip preserves source hash, regions and avatar/form/view hierarchy',()=>{
 const project={...base,imageReference:reference};
 const restored=parseProject(JSON.parse(JSON.stringify(project)));
 assert.deepEqual(restored,project);
});

test('embedded source asset is checked against image signature and SHA-256',async()=>{
 const bytes=Buffer.from([137,80,78,71,13,10,26,10]);
 const hash=createHash('sha256').update(bytes).digest('hex');
 const valid=structuredClone(reference);valid.source.sha256=hash;valid.source.asset={mediaType:'image/png',data:bytes.toString('base64')};
 assert.equal(await verifyImageReferenceSourceAsset(valid),true);
 const tampered=structuredClone(valid);tampered.source.asset!.data=Buffer.from('tampered').toString('base64');
 assert.equal(await verifyImageReferenceSourceAsset(tampered),false);
 const wrongType=structuredClone(valid);wrongType.source.asset!.mediaType='image/jpeg';
 assert.equal(await verifyImageReferenceSourceAsset(wrongType),false);
});

test('legacy metadata-only references remain loadable without an embedded source asset',()=>{
 const metadataOnly=structuredClone({...base,imageReference:reference});delete metadataOnly.imageReference!.source.asset;
 assert.deepEqual(parseProject(metadataOnly),metadataOnly);
});

test('project rejects malformed or oversized embedded source assets',()=>{
 const malformed=structuredClone({...base,imageReference:reference});malformed.imageReference!.source.asset!.data='not-base64';
 assert.throws(()=>parseProject(malformed),/Bildreferenzdaten/);
 const oversized=structuredClone({...base,imageReference:reference});oversized.imageReference!.source.asset!.data='A'.repeat(28_000_004);
 assert.throws(()=>parseProject(oversized),/Bildreferenzdaten/);
});

test('legacy projects without image-reference metadata remain valid',()=>{
 assert.deepEqual(parseProject(base),base);
});

test('project rejects invalid image-reference hashes, geometry and dangling hierarchy links',()=>{
 const badHash=structuredClone({...base,imageReference:reference});badHash.imageReference!.source.sha256='not-a-hash';
 assert.throws(()=>parseProject(badHash),/Bildreferenzdaten/);
 const badGeometry=structuredClone({...base,imageReference:reference});badGeometry.imageReference!.regions[0]!.geometry={type:'rectangle',x:600,y:30,width:100,height:300};
 assert.throws(()=>parseProject(badGeometry),/Bildreferenzdaten/);
 const dangling=structuredClone({...base,imageReference:reference});dangling.imageReference!.views[0]!.regionIds=['missing-region'];
 assert.throws(()=>parseProject(dangling),/Bildreferenzdaten/);
});
