import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validStudioFormModelAsset,validStudioFormModelPair} from '../src/studio-form-model-pair.ts';
import {parseProject,emptyStudio} from '../src/studio-data.ts';
const reference=(formId:string)=>({format:'pakachi-image-reference-generation',version:1,source:{sha256:'a'.repeat(64),width:100,height:100},selection:{regionId:'region-'+formId,label:'Region',kind:'form',avatar:{id:'avatar-1',label:'PaKaChi'},form:{id:formId,label:formId},view:{id:'view-1',label:'Front'},crop:{x:0,y:0,width:10,height:10,sha256:'b'.repeat(64)},mask:{type:'rectangle',vertices:4,holes:0}}});
const asset=(formId:string,model:string)=>({formId,label:formId,model,generationReference:reference(formId)});
const pair=()=>({avatarId:'avatar-1',activeForm:'animal' as const,animal:asset('animal-form','QUJD'),humanoid:asset('work-form','REVG')});
test('accepts two distinct persisted form assets bound to one avatar and active model',()=>{
 const value=pair();assert.equal(validStudioFormModelAsset(value.animal),true);assert.equal(validStudioFormModelPair(value,'avatar-1','QUJD'),true);
});
test('rejects partial, duplicated, cross-avatar and active-model-mismatched pairs',()=>{
 const value=pair();assert.equal(validStudioFormModelPair({...value,humanoid:undefined},'avatar-1','QUJD'),false);
 assert.equal(validStudioFormModelPair({...value,humanoid:asset('animal-form','REVG')},'avatar-1','QUJD'),false);
 assert.equal(validStudioFormModelPair(value,'another-avatar','QUJD'),false);
 assert.equal(validStudioFormModelPair(value,'avatar-1','REVG'),false);
});
test('rejects malformed or oversized encoded model assets',()=>{
 for(const model of ['', 'not base64!', 'A'.repeat(70_000_001)])assert.equal(validStudioFormModelAsset(asset('animal-form',model)),false);
 assert.equal(validStudioFormModelAsset({...asset('animal-form','QUJD'),extra:true}),false);
});

test('StudioProject validates and round-trips both form GLBs with their exact confirmed source regions',()=>{
 const sourceHash='a'.repeat(64),cropHash='b'.repeat(64);
 const region=(id:string)=>({id,label:id,kind:'form',status:'confirmed',geometry:{type:'rectangle',x:0,y:0,width:10,height:10}});
 const referenceDocument={format:'pakachi-image-reference',version:1,source:{sha256:sourceHash,width:100,height:100},regions:[region('region-animal'),region('region-work')],views:[{id:'view-animal',label:'Animal view',regionIds:['region-animal']},{id:'view-work',label:'Work view',regionIds:['region-work']}],forms:[{id:'animal-form',label:'Animal',viewIds:['view-animal']},{id:'work-form',label:'Work',viewIds:['view-work']}],avatars:[{id:'avatar-1',label:'PaKaChi',formIds:['animal-form','work-form']}]};
 const manifest=(formId:string,regionId:string,viewId:string,label:string)=>({format:'pakachi-image-reference-generation',version:1,source:{sha256:sourceHash,width:100,height:100},selection:{regionId,label:regionId,kind:'form',avatar:{id:'avatar-1',label:'PaKaChi'},form:{id:formId,label},view:{id:viewId,label:label+' view'},crop:{x:0,y:0,width:10,height:10,sha256:cropHash},mask:{type:'rectangle',vertices:4,holes:0}}});
 const animal=asset('animal-form','QUJD'),humanoid=asset('work-form','REVG');
 animal.generationReference=manifest('animal-form','region-animal','view-animal','Animal') as any;
 humanoid.generationReference=manifest('work-form','region-work','view-work','Work') as any;
 const project={format:'pakachi-studio' as const,version:1 as const,model:animal.model,avatar:{id:'avatar-1',name:'PaKaChi',description:'',moves:[]},studio:emptyStudio(),imageReference:referenceDocument, generationReference:animal.generationReference,formModels:{avatarId:'avatar-1',activeForm:'animal' as const,animal,humanoid}};
 const parsed=parseProject(project);assert.deepEqual(parsed.formModels,project.formModels);assert.equal(parsed.formModels?.humanoid.formId,'work-form');
 assert.throws(()=>parseProject({...project,model:humanoid.model}),/Tier-\/Arbeitsform-Modellpaar/);
 const mismatched={...project,formModels:{...project.formModels,humanoid:{...humanoid,generationReference:manifest('animal-form','region-animal','view-animal','Animal')}}};
 assert.throws(()=>parseProject(mismatched),/bestätigte Bildreferenz/);
});
