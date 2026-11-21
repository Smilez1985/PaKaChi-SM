import {test} from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {parseProject} from '../src/studio-data.ts';
import type {StudioProject} from '../src/studio-data.ts';
import {verifyImageReferenceSourceAsset} from '../src/image-reference.ts';
import type {ImageReferenceDocument} from '../src/image-reference.ts';
import type {ImageReferenceGenerationManifest} from '../src/image-reference-crop.ts';
import {createPaKaChiSemanticCatalog} from '../src/cluster-2d-classifier.ts';

const reference:ImageReferenceDocument={
 format:'pakachi-image-reference',version:1,
 source:{sha256:'b'.repeat(64),width:640,height:480,asset:{mediaType:'image/png',data:'AQIDBA=='}},
 regions:[{id:'region-front',label:'Front view',kind:'view',status:'confirmed',geometry:{type:'polygon',points:[{x:20,y:30},{x:220,y:30},{x:220,y:330},{x:20,y:330}],holes:[[{x:70,y:90},{x:70,y:130},{x:110,y:130},{x:110,y:90}]]}}],
 views:[{id:'view-front',label:'Front',regionIds:['region-front']}],
 forms:[{id:'form-animal',label:'Animal form',viewIds:['view-front']}],
 avatars:[{id:'avatar-panda',label:'Panda',formIds:['form-animal']}],
 landmarks:[{id:'landmark-face',regionId:'region-front',partId:'head',surfaceLayerId:'fur',poseId:'front-neutral',x:120,y:140,radiusPx:50}],
};
const generationReference:ImageReferenceGenerationManifest={format:'pakachi-image-reference-generation',version:1,source:{sha256:'b'.repeat(64),width:640,height:480},selection:{regionId:'region-front',label:'Front view',kind:'view',avatar:{id:'avatar-panda',label:'Panda'},form:{id:'form-animal',label:'Animal form'},view:{id:'view-front',label:'Front'},crop:{x:20,y:30,width:200,height:300,sha256:'c'.repeat(64)},mask:{type:'polygon',vertices:4,holes:1}}};
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


test('project round-trip preserves exact generation crop provenance',()=>{
 const project={...base,imageReference:reference,generationReference};
 const restored=parseProject(JSON.parse(JSON.stringify(project)));
 assert.deepEqual(restored.generationReference,generationReference);
});

test('project rejects generation provenance that does not match its source hierarchy',()=>{
 const mismatch=structuredClone({...base,imageReference:reference,generationReference});mismatch.generationReference!.selection.avatar.id='another-avatar';
 assert.throws(()=>parseProject(mismatch),/Generierungsherkunft/);
 const outside=structuredClone({...base,imageReference:reference,generationReference});outside.generationReference!.selection.crop.width=999;
 assert.throws(()=>parseProject(outside),/Generierungsherkunft/);
});

test('project round-trip preserves the shared character semantic catalog',()=>{
 const project={...base,semanticCatalog:createPaKaChiSemanticCatalog()};
 const restored=parseProject(JSON.parse(JSON.stringify(project)));
 assert.deepEqual(restored.semanticCatalog,project.semanticCatalog);
 assert.equal(restored.semanticCatalog?.parts.find(part=>part.id==='toes')?.parentPartId,'feet');
 assert.equal(restored.semanticCatalog?.parts.find(part=>part.id==='digits')?.parentPartId,'hands');
});

test('project rejects invalid shared semantic catalogs',()=>{
 const duplicate=structuredClone({...base,semanticCatalog:createPaKaChiSemanticCatalog()});
 duplicate.semanticCatalog!.parts.push({...duplicate.semanticCatalog!.parts[0]!});
 assert.throws(()=>parseProject(duplicate),/gemeinsamer Anatomie- und Oberflächenkatalog/);
 const cycle=structuredClone({...base,semanticCatalog:createPaKaChiSemanticCatalog()});
 cycle.semanticCatalog!.parts.find(part=>part.id==='body')!.parentPartId='head';
 assert.throws(()=>parseProject(cycle),/gemeinsamer Anatomie- und Oberflächenkatalog/);
});


test('project round-trip preserves pixel-bound silhouette, proportion, color and material observations',()=>{
 const observed=structuredClone(reference);
 observed.observations=[
  {id:'obs-silhouette',kind:'silhouette',regionId:'region-front',confidence:0.98},
  {id:'obs-proportion',kind:'proportion',regionId:'region-front',fromLandmarkId:'landmark-face',toLandmarkId:'landmark-face',ratio:1.25,confidence:0.8},
  {id:'obs-color',kind:'color-sample',regionId:'region-front',x:125,y:145,rgba:[12,34,56,255],radiusPx:3},
  {id:'obs-boundary',kind:'material-boundary',regionId:'region-front',points:[{x:80,y:100},{x:90,y:110},{x:105,y:120}]}
 ];
 const project={...base,imageReference:observed};
 assert.deepEqual(parseProject(JSON.parse(JSON.stringify(project))),project);
});

test('project rejects observations outside source pixels or with broken landmark references',()=>{
 const outside=structuredClone(reference);
 outside.observations=[{id:'obs-color',kind:'color-sample',regionId:'region-front',x:900,y:2,rgba:[0,0,0,255],radiusPx:2}];
 assert.throws(()=>parseProject({...base,imageReference:outside}),/Bildreferenzdaten/);
 const dangling=structuredClone(reference);
 dangling.observations=[{id:'obs-ratio',kind:'proportion',regionId:'region-front',fromLandmarkId:'missing',toLandmarkId:'landmark-face',ratio:1}];
 assert.throws(()=>parseProject({...base,imageReference:dangling}),/Bildreferenzdaten/);
});
