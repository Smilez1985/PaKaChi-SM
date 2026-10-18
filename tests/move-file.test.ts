import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exportMoveFile,importMoveFile} from '../src/move-file.ts';
import {emptyStudio,parseProject} from '../src/studio-data.ts';
import type {StudioProject} from '../src/studio-data.ts';
function fixture():StudioProject {
 const studio=emptyStudio();studio.points=[{id:'face',name:'Face',kind:'surface',mesh:0,rest:[0,0,0],size:.01,radius:.1}];
 studio.poses=[0,1,2].map((value)=>({id:'p'+value,name:'Pose '+value,seconds:1+value,values:{face:{position:[0,value*.1,0],rotation:[0,0,0,1]},$figure:{position:[value,0,0],rotation:[0,0,0,1],scale:1+value*.1}}}));
 studio.moves=[{id:'wave',name:'Wave',loop:true,poses:['p1','p0','p1']}];studio.poses[1].review=['surface-rest'];
 return {format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'avatar',name:'Avatar',description:'Test',moves:[]},studio};
}
test('move file contains only required poses, keeps sequence, review flags and whole-figure tracks',async()=>{
 const project=fixture(),file=await exportMoveFile(project,'wave');assert.equal(file.poses.length,2);assert.deepEqual(file.move.poses,['p1','p0','p1']);assert.equal('model' in file,false);assert.equal(JSON.stringify(file).includes('AAAA'),false);
 const target=structuredClone(project);target.studio.moves=[];target.studio.poses=[];const imported=await importMoveFile(JSON.parse(JSON.stringify(file)),target);assert.equal(imported.moves[0].loop,true);assert.equal(imported.moves[0].poses[0],imported.moves[0].poses[2]);assert.deepEqual(imported.poses[1].review,project.studio.poses[1].review);assert.deepEqual(imported.poses[1].values.$figure,project.studio.poses[1].values.$figure);assert.doesNotThrow(()=>parseProject({...target,studio:imported}));assert.equal(target.studio.poses.length,0);
});
test('import never overwrites poses or built-in/custom move identifiers',async()=>{
 const target=fixture(),file=await exportMoveFile(target,'wave');target.avatar.moves=[{id:'wave-2',name:'Clip',clip:'clip',loop:false}];
 const before=structuredClone(target),result=await importMoveFile(file,target);assert.deepEqual(target,before);assert.equal(result.moves[1].id,'wave-3');assert.equal(result.poses.length,5);assert.equal(new Set(result.poses.map(p=>p.id)).size,5);assert.deepEqual(result.poses.slice(0,3),before.studio.poses);
});
test('model, influence radius, rest pose and connections are compatibility boundaries; labels and sizes are not',async()=>{
 const source=fixture(),file=await exportMoveFile(source,'wave');
 for(const change of [(p:StudioProject)=>{p.model='AQAA';},(p:StudioProject)=>{p.studio.points[0].radius=.2;},(p:StudioProject)=>{p.studio.points[0].rest[0]=.1;},(p:StudioProject)=>{p.studio.points[0].mesh=1;}]){const other=structuredClone(source);change(other);await assert.rejects(()=>importMoveFile(file,other),/passt nicht/);}
 const connected=structuredClone(source);connected.studio.points.push({...connected.studio.points[0],id:'face2'});for(const pose of connected.studio.poses)pose.values.face2=structuredClone(pose.values.face);const connections=await exportMoveFile(connected,'wave');connected.studio.links=[['face','face2']];await assert.rejects(()=>importMoveFile(connections,connected),/passt nicht/);
 const cosmetic=structuredClone(source);cosmetic.avatar.name='Renamed';cosmetic.studio.points[0].name='Eye';cosmetic.studio.points[0].size=.05;assert.equal((await importMoveFile(file,cosmetic)).moves.length,2);
});
test('invalid versions, dangling pose IDs, non-finite values and total limits are rejected without changing the target',async()=>{
 const source=fixture(),file=await exportMoveFile(source,'wave'),before=structuredClone(source);
 for(const patch of [{version:2},{move:{...file.move,poses:['missing','p0']}},{poses:[{...file.poses[0],seconds:Infinity},file.poses[1]]},{extra:'not allowed'}])await assert.rejects(()=>importMoveFile({...file,...patch},source));
 const full=structuredClone(source);full.studio.poses=Array.from({length:100},(_,i)=>({...structuredClone(source.studio.poses[0]),id:'p'+i}));await assert.rejects(()=>importMoveFile(file,full));assert.deepEqual(source,before);assert.equal(full.studio.poses.length,100);
});
test('repeated single pose remains round-trippable and unknown moves cannot be exported',async()=>{
 const source=fixture();source.studio.moves[0].poses=['p0','p0'];const file=await exportMoveFile(source,'wave');assert.equal(file.poses.length,1);const result=await importMoveFile(file,source);assert.equal(result.moves[1].poses[0],result.moves[1].poses[1]);await assert.rejects(()=>exportMoveFile(source,'missing'));
});
