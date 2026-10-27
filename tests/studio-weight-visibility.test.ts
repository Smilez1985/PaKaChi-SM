import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import {validWeightRegion,parseProject} from '../src/studio-data.ts';
import {StudioWeightStroke} from '../src/studio-weight-stroke.ts';
function fixture(){const root=new T.Group(),a=new T.Bone(),b=new T.Bone();root.add(a);a.add(b);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.5,-.5,.5,.5,-.5,.5,0,.5,.5,-.5,-.5,0,.5,-.5,0,0,.5,0],3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(24),4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(Array.from({length:24},(_,i)=>i%4===0?1:0),4));const mesh=new T.SkinnedMesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([a,b]));return {rig:new StudioRig(root),mesh};}
function view(z=3){const camera=new T.PerspectiveCamera(60,1,.1,10);camera.position.z=z;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);return {eye:camera.position.toArray(),projection:new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).toArray()};}
function target(mesh:T.SkinnedMesh,v:number){const i=mesh.geometry.getAttribute('skinIndex'),w=mesh.geometry.getAttribute('skinWeight');let result=0;for(let k=0;k<4;k++)if(i.getComponent(v,k)===1)result+=w.getComponent(v,k);return result;}
test('visible brush excludes occluded vertices, freezes the view and survives project/catalog replay',async()=>{
 const {rig,mesh}=fixture(),snapshot={...view(),materials:true as const},stroke=new StudioWeightStroke(rig,rig.data.points[0],rig.data.points[1],.5,2,snapshot);snapshot.eye[2]=-3;stroke.sample(new T.Vector3(0,0,.5));stroke.finish();
 for(let i=0;i<3;i++)assert.ok(target(mesh,i)>0);for(let i=3;i<6;i++)assert.equal(target(mesh,i),0);
 const project={format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},studio:rig.data};parseProject(project);
 // @ts-expect-error JavaScript CLI module
 const {zooPackage}=await import('../scripts/export-zoo.mjs');const saved=JSON.parse(zooPackage(project,'visible').project);assert.deepEqual(saved.studio.weightTransfers[0].region.view,{...view(),materials:true});const loaded=fixture();loaded.rig.data=saved.studio;loaded.rig.reset();for(let i=0;i<6;i++)assert.equal(target(loaded.mesh,i),target(mesh,i));
 rig.transferWeights(rig.data.points[0],rig.data.points[1],.5,{center:[0,0,0],radius:2,view:view(-3)});for(let i=3;i<6;i++)assert.ok(target(mesh,i)>0);
 const through=fixture();through.rig.transferWeights(through.rig.data.points[0],through.rig.data.points[1],.5,{center:[0,0,.5],radius:2});for(let i=3;i<6;i++)assert.ok(target(through.mesh,i)>0);
});
test('visibility rejects out-of-frame vertices and malformed stored camera snapshots',()=>{
 const {rig,mesh}=fixture(),outside=view();const camera=new T.PerspectiveCamera(10,1,.1,10);camera.position.set(5,0,3);camera.lookAt(5,0,0);camera.updateMatrixWorld(true);outside.eye=camera.position.toArray();outside.projection=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).toArray();const before=structuredClone(rig.data);assert.throws(()=>rig.transferWeights(rig.data.points[0],rig.data.points[1],.5,{center:[0,0,0],radius:2,view:outside}),/keinen/);assert.deepEqual(rig.data,before);for(let i=0;i<6;i++)assert.equal(target(mesh,i),0);
 for(const bad of [{eye:[0,0,3],projection:[]},{eye:[NaN,0,3],projection:view().projection},{...view(),extra:1}])assert.equal(validWeightRegion({center:[0,0,0],radius:1,view:bad}),false);
});

test('material visibility policy preserves legacy occlusion and snapshots group visibility',async()=>{
 const {StudioWeightVisibility}=await import('../src/studio-weight-visibility.ts');
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-.5,-.5,.5,.5,-.5,.5,0,.5,.5],3));
 const camera=view(),matrix=new T.Matrix4().fromArray(camera.projection),point=new T.Vector3(0,0,0);
 const hidden=new T.MeshBasicMaterial({visible:false}),opaque=new T.MeshBasicMaterial(),clear=new T.MeshBasicMaterial({transparent:true,opacity:0});
 const check=(material:T.Material|T.Material[],expected:boolean)=>{const mesh=new T.Mesh(geometry,material);mesh.updateMatrixWorld(true);const tree=new StudioWeightVisibility([mesh]);assert.equal(tree.visible(point,{...camera,materials:true},matrix),expected);assert.equal(tree.visible(point,camera,matrix),false);};
 check(hidden,true);check(clear,true);check(opaque,false);
 clear.opacity=.5;check(clear,false);clear.opacity=0;clear.transparent=false;check(clear,false);
 geometry.addGroup(0,3,0);check([hidden,opaque],true);geometry.clearGroups();geometry.addGroup(0,3,1);check([hidden,opaque],false);
 const mesh=new T.Mesh(geometry,[hidden,opaque]),snapshot=new StudioWeightVisibility([mesh]);opaque.visible=false;geometry.clearGroups();assert.equal(snapshot.visible(point,{...camera,materials:true},matrix),false);
 assert.equal(validWeightRegion({center:[0,0,0],radius:1,view:{...camera,materials:true}}),true);
 for(const materials of [false,'true',1])assert.equal(validWeightRegion({center:[0,0,0],radius:1,view:{...camera,materials}}),false);
});
