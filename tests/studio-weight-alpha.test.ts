import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {captureWeightAlpha,weightAlphaDiscard} from '../src/studio-weight-alpha.ts';
import {StudioWeightVisibility} from '../src/studio-weight-visibility.ts';
import {validWeightRegion} from '../src/studio-data.ts';
function texture(){const t=new T.DataTexture(new Uint8Array([255,255,255,0,255,255,255,255]),2,1);t.magFilter=T.NearestFilter;return t;}
function uv(x:number,y=.5){return new Map<number,[T.Vector2,T.Vector2,T.Vector2]>([[0,[new T.Vector2(x,y),new T.Vector2(x,y),new T.Vector2(x,y)]]]);}
const bary=new T.Vector3(1,0,0);
test('alpha sampler snapshots pixels, uses texture transforms, wrapping, filters and green alpha maps',()=>{
 const map=texture(),material=new T.MeshBasicMaterial({map,alphaTest:.5});
 const capture=()=>captureWeightAlpha(material,new Map());
 const snapshot=capture();assert.equal(weightAlphaDiscard(snapshot,uv(.25),bary),true);assert.equal(weightAlphaDiscard(snapshot,uv(.75),bary),false);
 map.image.data![3]=255;assert.equal(weightAlphaDiscard(snapshot,uv(.25),bary),true);map.image.data![3]=0;
 map.offset.x=.5;assert.equal(weightAlphaDiscard(capture(),uv(.25),bary),false);
 map.offset.x=0;map.wrapS=T.RepeatWrapping;assert.equal(weightAlphaDiscard(capture(),uv(-.75),bary),true);
 map.wrapS=T.MirroredRepeatWrapping;assert.equal(weightAlphaDiscard(capture(),uv(1.75),bary),true);
 map.wrapS=T.ClampToEdgeWrapping;map.magFilter=T.LinearFilter;
 assert.equal(weightAlphaDiscard(capture(),uv(.49),bary),true);assert.equal(weightAlphaDiscard(capture(),uv(.5),bary),false);
 material.map=null;material.alphaMap=map;map.image.data![1]=0;map.image.data![5]=255;assert.equal(weightAlphaDiscard(capture(),uv(.25),bary),true);
 map.channel=1;assert.equal(weightAlphaDiscard(capture(),uv(.25),bary),false);
 const channelUvs=uv(.25);channelUvs.set(1,channelUvs.get(0)!);assert.equal(weightAlphaDiscard(capture(),channelUvs,bary),true);
 const vertical=new T.DataTexture(new Uint8Array([255,255,255,0,255,255,255,255]),1,2);vertical.magFilter=T.NearestFilter;vertical.flipY=true;material.map=vertical;material.alphaMap=null;assert.equal(weightAlphaDiscard(capture(),uv(.5,.25),bary),false);assert.equal(weightAlphaDiscard(capture(),uv(.5,.75),bary),true);
 material.map=null;material.alphaMap=null;material.opacity=.2;assert.equal(weightAlphaDiscard(capture(),uv(.5),bary),true);
 material.alphaToCoverage=true;assert.equal(capture(),null);
});
test('alpha ray holes respect material policy and preserve older visibility results',()=>{
 const geometry=new T.PlaneGeometry(2,2);const map=texture(),material=new T.MeshBasicMaterial({map,alphaTest:.5});const mesh=new T.Mesh(geometry,material);mesh.position.z=.5;mesh.updateMatrixWorld(true);
 const tree=new StudioWeightVisibility([mesh]),camera=new T.PerspectiveCamera(60,1,.1,10);camera.position.z=3;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const matrix=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),view={eye:camera.position.toArray(),projection:matrix.toArray(),materials:true as const};
 assert.equal(tree.visible(new T.Vector3(-.5,0,0),view,matrix),false);
 assert.equal(tree.visible(new T.Vector3(-.5,0,0),{...view,alpha:true},matrix),true);
 assert.equal(tree.visible(new T.Vector3(.5,0,0),{...view,alpha:true},matrix),false);
 material.alphaTest=0;map.image.data!.fill(255);assert.equal(tree.visible(new T.Vector3(-.5,0,0),{...view,alpha:true},matrix),true);
 assert.equal(validWeightRegion({center:[0,0,0],radius:1,view:{...view,alpha:true}}),true);
 assert.equal(validWeightRegion({center:[0,0,0],radius:1,view:{...view,materials:undefined,alpha:true}}),false);
});
test('unreadable images and missing UVs do not infer alpha holes',()=>{
 const map=new T.Texture({width:1,height:1} as any),material=new T.MeshBasicMaterial({map,alphaTest:.5});assert.equal(captureWeightAlpha(material,new Map()),null);
 material.map=texture();assert.equal(weightAlphaDiscard(captureWeightAlpha(material,new Map()),new Map(),bary),false);
});
