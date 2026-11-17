import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addImageReferenceRelation,removeImageReferenceRelation,checkImageReferenceReadiness,validateImageReferenceDocument,editImageReferenceRectangle,reorderImageReferenceRegions,moveImageReferenceRectangle,resizeImageReferenceRectangle,isValidImageReferencePolygon,isValidImageReferencePolygonWithHoles,moveImageReferencePolygonVertex,moveImageReferencePolygonHoleVertex,splitImageReferencePolygon,splitImageReferenceRegion,simplifyImageReferencePolygon} from '../src/image-reference.ts';
import type {ImageReferenceDocument,ImageReferenceRegion} from '../src/image-reference.ts';

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

test('supports multiple independent crop regions inside one shared view',()=>{
 const d=base();
 d.regions.push({id:'r-face-detail',label:'Gesicht',kind:'detail',status:'confirmed',geometry:{type:'polygon',points:[{x:80,y:80},{x:180,y:80},{x:170,y:170},{x:90,y:180}]}});
 d.views[0].regionIds.push('r-face-detail');
 assert.deepEqual(validateImageReferenceDocument(d),[]);
 assert.equal(checkImageReferenceReadiness(d).ready,true);
 assert.equal(d.views[0].regionIds.length,2);
 assert.notDeepEqual(d.regions[0].geometry,d.regions[3].geometry);
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


test('edits rectangle geometry in source pixels and clamps it to image bounds',()=>{
 const region=base().regions[0];
 const moved=editImageReferenceRectangle(region,1600,1000,{x:1550,y:950,width:200,height:100});
 assert.deepEqual(moved.geometry,{type:'rectangle',x:1400,y:900,width:200,height:100});
 const resized=editImageReferenceRectangle(moved,1600,1000,{width:2,height:0});
 assert.deepEqual(resized.geometry,{type:'rectangle',x:1400,y:900,width:4,height:4});
 assert.throws(()=>editImageReferenceRectangle(base().regions[1],1600,1000,{x:1}),/rectangle-edit-requires-rectangle/);
});

test('reorders regions without changing stable identities and handles boundaries',()=>{
 const regions=base().regions;
 const moved=reorderImageReferenceRegions(regions,'r-animal-side',-1);
 assert.deepEqual(moved.map(region=>region.id),['r-animal-side','r-animal-front','r-work']);
 assert.deepEqual(regions.map(region=>region.id),['r-animal-front','r-animal-side','r-work']);
 assert.deepEqual(reorderImageReferenceRegions(moved,'r-animal-side',-1).map(region=>region.id),['r-animal-side','r-animal-front','r-work']);
 assert.throws(()=>reorderImageReferenceRegions(regions,'missing',1),/unknown-image-region/);
});


test('moves rectangles by pointer delta and keeps them inside the source image',()=>{
 const region=base().regions[0];
 const moved=moveImageReferenceRectangle(region,1600,1000,500,900);
 assert.deepEqual(moved.geometry,{type:'rectangle',x:510,y:600,width:300,height:400});
 const movedBack=moveImageReferenceRectangle(moved,1600,1000,-2000,-2000);
 assert.deepEqual(movedBack.geometry,{type:'rectangle',x:0,y:0,width:300,height:400});
});

test('resizes rectangles from all handle directions with a four-pixel minimum',()=>{
 const region=base().regions[0];
 const west=resizeImageReferenceRectangle(region,1600,1000,'w',50,0);
 assert.deepEqual(west.geometry,{type:'rectangle',x:60,y:10,width:250,height:400});
 const northEast=resizeImageReferenceRectangle(region,1600,1000,'ne',40,-30);
 assert.deepEqual(northEast.geometry,{type:'rectangle',x:10,y:0,width:340,height:410});
 const min=resizeImageReferenceRectangle(region,1600,1000,'nw',1000,1000);
 assert.deepEqual(min.geometry,{type:'rectangle',x:306,y:406,width:4,height:4});
});


test('accepts simple polygon contours and rejects duplicate, tiny or self-crossing contours',()=>{
 assert.equal(isValidImageReferencePolygon([{x:10,y:10},{x:80,y:10},{x:60,y:70},{x:20,y:60}]),true);
 assert.equal(isValidImageReferencePolygon([{x:10,y:10},{x:10,y:10},{x:60,y:70}]),false);
 assert.equal(isValidImageReferencePolygon([{x:10,y:10},{x:11,y:10},{x:10,y:11}]),false);
 assert.equal(isValidImageReferencePolygon([{x:10,y:10},{x:80,y:80},{x:10,y:80},{x:80,y:10}]),false);
});


test('splits a polygon only when a cut crosses its boundary twice and conserves area',()=>{
 const points=[{x:10,y:10},{x:110,y:10},{x:110,y:90},{x:10,y:90}];
 const pieces=splitImageReferencePolygon(points,{x:60,y:0},{x:60,y:100});
 assert.ok(pieces);
 assert.equal(pieces[0].length,4);assert.equal(pieces[1].length,4);
 const area=(ring:Array<{x:number;y:number}>)=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length]!;return sum+p.x*q.y-q.x*p.y;},0))/2;
 assert.equal(area(pieces[0])+area(pieces[1]),8000);
 assert.equal(splitImageReferencePolygon(points,{x:0,y:0},{x:5,y:5}),undefined);
 assert.equal(splitImageReferencePolygon(points,{x:0,y:10},{x:120,y:10}),undefined);
});

test('splits a concave L-shaped polygon into two valid pieces',()=>{
 const points=[{x:0,y:0},{x:100,y:0},{x:100,y:30},{x:30,y:30},{x:30,y:100},{x:0,y:100}];
 const pieces=splitImageReferencePolygon(points,{x:-10,y:50},{x:40,y:50});
 assert.ok(pieces);
 assert.equal(isValidImageReferencePolygon(pieces[0]),true);
 assert.equal(isValidImageReferencePolygon(pieces[1]),true);
 const area=(ring:Array<{x:number;y:number}>)=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length]!;return sum+p.x*q.y-q.x*p.y;},0))/2;
 assert.equal(area(pieces[0])+area(pieces[1]),5100);
});

test('rejects a cut that crosses a concave contour more than twice',()=>{
 const uShape=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:70,y:100},{x:70,y:30},{x:30,y:30},{x:30,y:100},{x:0,y:100}];
 assert.equal(isValidImageReferencePolygon(uShape),true);
 assert.equal(splitImageReferencePolygon(uShape,{x:-10,y:50},{x:110,y:50}),undefined);
});

test('validates disjoint interior holes and rejects touching, outside, and overlapping rings',()=>{
 const outer=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}];
 const hole=[{x:20,y:20},{x:20,y:40},{x:40,y:40},{x:40,y:20}];
 assert.equal(isValidImageReferencePolygonWithHoles(outer,[hole]),true);
 assert.equal(isValidImageReferencePolygonWithHoles(outer,[[{x:90,y:20},{x:110,y:20},{x:110,y:40},{x:90,y:40}]]),false);
 assert.equal(isValidImageReferencePolygonWithHoles(outer,[[{x:0,y:20},{x:0,y:40},{x:20,y:40},{x:20,y:20}]]),false);
 assert.equal(isValidImageReferencePolygonWithHoles(outer,[hole,[{x:30,y:30},{x:30,y:50},{x:50,y:50},{x:50,y:30}]]),false);
});

test('simplifies redundant polygon vertices without changing the silhouette materially',()=>{
 const contour=[{x:0,y:0},{x:25,y:0},{x:50,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}];
 const simplified=simplifyImageReferencePolygon(contour,1);
 assert.ok(simplified.length<contour.length);
 assert.equal(isValidImageReferencePolygon(simplified),true);
 const area=(ring:Array<{x:number;y:number}>)=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length]!;return sum+p.x*q.y-q.x*p.y;},0))/2;
 assert.equal(area(simplified),10000);
 assert.throws(()=>simplifyImageReferencePolygon(contour,0),/invalid-simplification-tolerance/);
});

test('moves interior-ring vertices only when all hole constraints remain valid',()=>{
 const region={id:'r',label:'R',kind:'detail' as const,status:'confirmed' as const,geometry:{type:'polygon' as const,points:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}],holes:[[{x:20,y:20},{x:20,y:40},{x:40,y:40},{x:40,y:20}]]}};
 const moved=moveImageReferencePolygonHoleVertex(region,0,0,25,25,100,100);
 assert.notEqual(moved,region);
 assert.deepEqual(moved.geometry.type==='polygon'?moved.geometry.holes?.[0]?.[0]:undefined,{x:25,y:25});
 assert.equal(moveImageReferencePolygonHoleVertex(region,0,0,0,0,100,100),region);
 assert.equal(moveImageReferencePolygonHoleVertex(region,0,0,150,150,100,100),region);
});

test('moves polygon vertices within image bounds and rejects invalid self-crossing edits',()=>{
 const region=base().regions[1];
 const moved=moveImageReferencePolygonVertex(region,0,390,-20,1600,1000);
 assert.deepEqual(moved.geometry,{type:'polygon',points:[{x:390,y:0},{x:700,y:10},{x:650,y:410},{x:420,y:400}]});
 const rejected=moveImageReferencePolygonVertex(region,0,680,405,1600,1000);
 assert.equal(rejected,region);
 assert.throws(()=>moveImageReferencePolygonVertex(region,9,10,10,1600,1000),/unknown-polygon-vertex/);
});

test('splits a rectangle into two reviewable polygon regions and conserves its area',()=>{
 const region:ImageReferenceRegion={id:'touching-figures',label:'Zwei verbundene Figuren',kind:'helper',status:'suggested',geometry:{type:'rectangle',x:10,y:20,width:100,height:60}};
 const pieces=splitImageReferenceRegion(region,{x:60,y:10},{x:60,y:90});
 assert.ok(pieces);
 assert.equal(pieces[0].geometry.type,'polygon');assert.equal(pieces[1].geometry.type,'polygon');
 assert.equal(pieces[0].status,'suggested');assert.equal(pieces[1].status,'suggested');
 assert.notEqual(pieces[0].id,pieces[1].id);
 const area=(ring:Array<{x:number;y:number}>)=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length]!;return sum+p.x*q.y-q.x*p.y;},0))/2;
 if(pieces[0].geometry.type==='polygon'&&pieces[1].geometry.type==='polygon')assert.equal(area(pieces[0].geometry.points)+area(pieces[1].geometry.points),6000);
});
test('does not split polygon regions with interior holes or ambiguous rectangle cuts',()=>{
 const withHole:ImageReferenceRegion={id:'hole',label:'Loch',kind:'detail',status:'suggested',geometry:{type:'polygon',points:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}],holes:[[{x:20,y:20},{x:20,y:30},{x:30,y:30},{x:30,y:20}]]}};
 assert.equal(splitImageReferenceRegion(withHole,{x:50,y:-10},{x:50,y:110}),undefined);
 const rect:ImageReferenceRegion={id:'r',label:'R',kind:'detail',status:'suggested',geometry:{type:'rectangle',x:0,y:0,width:100,height:100}};
 assert.equal(splitImageReferenceRegion(rect,{x:0,y:0},{x:10,y:10}),undefined);
});


test('stores explicit region relations independently from hierarchy and preserves stable IDs',()=>{
 const d=base();
 const linked=addImageReferenceRelation(d,{id:'rel-identity',kind:'same-avatar',sourceRegionId:'r-animal-front',targetRegionId:'r-work'});
 assert.equal(d.relations,undefined);
 assert.deepEqual(linked.relations,[{id:'rel-identity',kind:'same-avatar',sourceRegionId:'r-animal-front',targetRegionId:'r-work'}]);
 assert.deepEqual(validateImageReferenceDocument(linked),[]);
 const removed=removeImageReferenceRelation(linked,'rel-identity');
 assert.deepEqual(removed.relations,[]);
 assert.deepEqual(linked.relations?.map(relation=>relation.id),['rel-identity']);
 assert.throws(()=>removeImageReferenceRelation(linked,'missing'),/unknown-image-reference-relation/);
});

test('validates relation endpoints, ignored regions, duplicate symmetry and direction',()=>{
 const d=base();
 d.relations=[
  {id:'rel-a',kind:'same-avatar',sourceRegionId:'r-animal-front',targetRegionId:'r-work'},
  {id:'rel-b',kind:'same-avatar',sourceRegionId:'r-work',targetRegionId:'r-animal-front'},
  {id:'rel-c',kind:'detail-of',sourceRegionId:'r-animal-front',targetRegionId:'missing'},
  {id:'rel-d',kind:'additional-view',sourceRegionId:'r-animal-side',targetRegionId:'r-animal-side'}
 ];
 d.regions[1]!.status='ignored';
 const issues=validateImageReferenceDocument(d);
 assert.ok(issues.some(issue=>issue.message.includes('bereits vorhanden')));
 assert.ok(issues.some(issue=>issue.message.includes('Unbekannte Zielregion')));
 assert.ok(issues.some(issue=>issue.message.includes('Ignorierte Regionen')));
 assert.ok(issues.some(issue=>issue.message.includes('sich selbst')));
});

test('allows inverse detail-of relations because detail links are directional',()=>{
 const d=base();
 d.relations=[
  {id:'rel-a',kind:'detail-of',sourceRegionId:'r-animal-side',targetRegionId:'r-animal-front'},
  {id:'rel-b',kind:'detail-of',sourceRegionId:'r-animal-front',targetRegionId:'r-animal-side'}
 ];
 assert.deepEqual(validateImageReferenceDocument(d),[]);
});
