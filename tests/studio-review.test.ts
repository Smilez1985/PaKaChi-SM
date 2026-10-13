import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyStudio,parseProject} from '../src/studio-data.ts';
import type {StudioData,Transform,StudioProject} from '../src/studio-data.ts';
import {flagAffectedPoses,moveReview} from '../src/studio-review.ts';
const neutral=():Transform=>({position:[0,0,0],rotation:[0,0,0,1]});
function fixture():StudioData {return {...emptyStudio(),boneRest:[neutral()],points:[{id:'bone',kind:'bone',bone:0,name:'Bone',rest:[0,0,0],size:.01,radius:.2},{id:'face',kind:'surface',name:'Face',rest:[0,0,0],size:.01,radius:.2}],poses:[{id:'neutral',name:'Neutral',seconds:1,values:{bone:neutral(),face:neutral()}},{id:'smile',name:'Smile',seconds:1,values:{bone:neutral(),face:{position:[.1,0,0],rotation:[0,0,0,1]}}}],moves:[{id:'smile',name:'Smile',poses:['neutral','smile'],loop:false}]};}
test('review flags geometry-affecting changes and derives affected moves without changing stored transforms',()=>{
 const before=fixture(),after=structuredClone(before);after.points[1].radius=.3;flagAffectedPoses(before,after);assert.equal(after.poses[0].review,undefined);assert.deepEqual(after.poses[1].review,['surface-radius']);assert.deepEqual(moveReview(after,after.moves[0]),{needsReview:true,reviewPoseIds:['smile']});assert.deepEqual(after.poses[1].values,before.poses[1].values);
 const next=structuredClone(after);next.boneRest[0].position[1]=.1;flagAffectedPoses(after,next);assert.deepEqual(next.poses[0].review,['bone-rest']);assert.deepEqual(next.poses[1].review,['surface-radius','bone-rest']);flagAffectedPoses(after,next);assert.equal(next.poses[1].review.length,2,'no repeated reasons');
 const shifted=structuredClone(before);shifted.points[1].rest=[.1,0,0];flagAffectedPoses(before,shifted);assert.ok(shifted.poses.every(p=>p.review?.includes('surface-rest')));
});
test('deletion flags only animated controls; cosmetic and grouping edits do not change pose interpretation',()=>{
 const before=fixture(),after=structuredClone(before);after.points=after.points.filter(p=>p.id!=='face');after.poses.forEach(p=>delete p.values.face);flagAffectedPoses(before,after);assert.equal(after.poses[0].review,undefined);assert.deepEqual(after.poses[1].review,['point-removed']);
 const cosmetic=structuredClone(before);cosmetic.points[1].size=.1;cosmetic.points[1].name='Mund';cosmetic.links=[['bone','face']];flagAffectedPoses(before,cosmetic);assert.ok(cosmetic.poses.every(p=>!p.review));
 const sign=structuredClone(before);sign.boneRest[0].rotation=[0,0,0,-1];flagAffectedPoses(before,sign);assert.ok(sign.poses.every(p=>!p.review),'equivalent quaternion must not flag poses');
});
test('pose review metadata survives project round trip and rejects unknown, duplicate or excessive reasons',()=>{
 const data=fixture();data.poses[1].review=['surface-radius'];const project:StudioProject={format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]},studio:data};assert.deepEqual(parseProject(JSON.parse(JSON.stringify(project))),project);
 for(const invalid of [['invented'],['surface-radius','surface-radius'],'bone-rest',null,Array(5).fill('bone-rest')]){const raw=JSON.parse(JSON.stringify(project));raw.studio.poses[0].review=invalid;assert.throws(()=>parseProject(raw));}
 delete data.poses[1].review;assert.doesNotThrow(()=>parseProject(project));
});
