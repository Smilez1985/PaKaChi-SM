import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validStudioFormModelAsset,validStudioFormModelPair} from '../src/studio-form-model-pair.ts';
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
