import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {captureStaticFigure,disposeStaticFigure} from '../src/figure-glb.ts';
test('static snapshot bakes skin, morphs and reflected world transforms without changing the source',()=>{
 const root=new T.Group(),bone=new T.Bone();root.scale.set(-2,.5,1.5);root.position.set(1,2,3);root.add(bone);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1],2));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Array(12).fill(0),4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));geometry.morphAttributes.position=[new T.Float32BufferAttribute([0,0,1,1,0,1,0,1,1],3)];
 const material=new T.MeshStandardMaterial(),mesh=new T.SkinnedMesh(geometry,material);root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([bone]));mesh.morphTargetInfluences![0]=.5;bone.rotation.z=.4;root.updateMatrixWorld(true);
 const expected=[0,1,2].map(i=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld)),source=Array.from(geometry.getAttribute('position').array),matrix=mesh.matrixWorld.clone();let disposed=0;material.addEventListener('dispose',()=>disposed++);geometry.addEventListener('dispose',()=>disposed++);
 const snapshot=captureStaticFigure([mesh]),copy=snapshot.children[0] as T.Mesh;assert.ok(!(copy instanceof T.SkinnedMesh));assert.deepEqual(Array.from(copy.geometry.index!.array),[0,2,1]);assert.equal(copy.geometry.getAttribute('skinWeight'),undefined);assert.deepEqual(copy.geometry.morphAttributes,{});assert.notEqual(copy.material,material);
 expected.forEach((v,i)=>assert.ok(new T.Vector3().fromBufferAttribute(copy.geometry.getAttribute('position'),i).distanceTo(v)<1e-6));assert.deepEqual(Array.from(copy.geometry.getAttribute('uv').array),[0,0,1,0,0,1]);disposeStaticFigure(snapshot);assert.equal(disposed,0);assert.deepEqual(Array.from(geometry.getAttribute('position').array),source);assert.deepEqual(mesh.matrixWorld,matrix);assert.equal(mesh.morphTargetInfluences![0],.5);
});
test('static snapshot skips hidden branches, preserves material arrays and rejects unsupported input',()=>{
 const parent=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(),[new T.MeshBasicMaterial(),new T.MeshBasicMaterial()]);parent.add(mesh);parent.visible=false;assert.throws(()=>captureStaticFigure([mesh]),/Keine sichtbare/);parent.visible=true;
 const copy=captureStaticFigure([mesh]);assert.ok(Array.isArray((copy.children[0] as T.Mesh).material));disposeStaticFigure(copy);mesh.material[1].visible=false;assert.throws(()=>captureStaticFigure([mesh]),/Materialgruppen/);
 const instanced=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),1);assert.throws(()=>captureStaticFigure([instanced]),/Instanzen/);
});
