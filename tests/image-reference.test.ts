import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkImageReferenceReadiness,validateImageReferenceDocument} from '../src/image-reference.ts';
import type {ImageReferenceDocument} from '../src/image-reference.ts';

const base=():ImageReferenceDocument=>({
 format:'pakachi-image-reference',version:1,
 source:{sha256:'a'.repeat(64),width:1600,height:1000},
 regions:[
  {id:'r-animal-front',label:'Tierform vorne',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:10,y:10,width:300,height:400}},
  {id:'r-animal-side',label:'Tierform Seite',kind:'detail',status:'confirmed',geometry:{type:'polygon',points:[{x:400,y:10},{x:700,y:10},{x:650,y:410},{x:420,y:400}]}},
  {id:'r-work',label:'Arbeitsform',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:800,y:10,width:300,height:600}}
 ],
 views:[{id:'v-front',label:'Vorderansicht',regionIds:['r-animal-front']},{id:'v-side',label:'Seitenansicht',regionIds:['r-animal-side']},{id:'v-work',label:'Arbeitsform-Ansicht',regionIds:['r-work']}],
 forms:[{id:'f-animal',label:'Tierform',viewIds:['v-front','v-side']},{id:'f-work',label:'Arbeitsform',viewIds:['v-work']}],
 avatars:[{id:'avatar-pakachi',label:'PaKaChi',formIds:['f-animal','f-work']}]
});

test('supports variable avatar, form and view counts without positional assumptions',()=>{
 const d=base();d.avatars.push({id:'avatar-second',label:'Zweiter Avatar',formIds:[]});
 d.forms.push({id:'f-second',label:'Einzelform',viewIds:[]});
 d.avatars[1].formIds.push('f-second');
 assert.deepEqual(validateImageReferenceDocument(d),[]);
 assert.equal(checkImageReferenceReadiness(d).ready,false);
 d.regions.push({id:'r-second',label:'Einzelfigur',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:1200,y:100,width:200,height:300}});
 d.views.push({id:'v-second',label:'Einzelansicht',regionIds:['r-second']});
 d.forms[2].viewIds.push('v-second');
 assert.deepEqual(checkImageReferenceReadiness(d).issues,[]);
});

test('blocks generation while suggestions remain unconfirmed',()=>{
 const d=base();d.regions[0].status='suggested';
 const result=checkImageReferenceReadiness(d);
 assert.equal(result.ready,false);
 assert.ok(result.issues.some(x=>x.path==='regions.r-animal-front.status'));
});

test('rejects out-of-image rectangles, invalid polygons and duplicate or dangling links',()=>{
 const d=base();d.regions[0].geometry={type:'rectangle',x:1500,y:10,width:200,height:400};
 d.regions[1].geometry={type:'polygon',points:[{x:2,y:2},{x:3,y:3}]};
 d.forms[0].viewIds.push('missing-view');
 d.forms[1].viewIds.push('v-front');
 const issues=validateImageReferenceDocument(d);
 assert.ok(issues.some(x=>x.path==='regions[0].geometry'));
 assert.ok(issues.some(x=>x.path==='regions[1].geometry.points'));
 assert.ok(issues.some(x=>x.message.includes('missing-view')));
 assert.ok(issues.some(x=>x.message.includes('bereits Form')));
});

test('rejects shared regions and ambiguous confidence values',()=>{
 const d=base();d.views[1].regionIds.push('r-animal-front');
 d.regions[0].confidence=1.2;
 const issues=validateImageReferenceDocument(d);
 assert.ok(issues.some(x=>x.message.includes('bereits Ansicht')));
 assert.ok(issues.some(x=>x.path==='regions[0].confidence'));
});

test('requires every detected region to be linked or explicitly ignored',()=>{
 const d=base();d.regions.push({id:'r-uncertain',label:'Unklare Figur',kind:'avatar',status:'suggested',confidence:.42,geometry:{type:'rectangle',x:1100,y:50,width:150,height:200}});
 let result=checkImageReferenceReadiness(d);assert.equal(result.ready,false);assert.ok(result.issues.some(x=>x.path==='regions.r-uncertain.status'));
 d.regions[d.regions.length-1].status='ignored';result=checkImageReferenceReadiness(d);assert.equal(result.ready,true);
 d.regions[d.regions.length-1].status='confirmed';result=checkImageReferenceReadiness(d);assert.equal(result.ready,false);assert.ok(result.issues.some(x=>x.path==='regions.r-uncertain'));
});

test('keeps incomplete empty draft valid but not ready for reconstruction',()=>{
 const d=base();d.avatars=[];d.forms=[];d.views=[];d.regions=[];
 assert.deepEqual(validateImageReferenceDocument(d),[]);
 assert.equal(checkImageReferenceReadiness(d).ready,false);
});
