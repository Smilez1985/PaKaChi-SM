import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compactMorphGLB} from '../src/sparse-morph-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import * as T from 'three';
Object.assign(globalThis,{ProgressEvent:class extends Event{}});
function fixture(count=300,stride=12){
 const positions=new Float32Array(count*3);for(let i=0;i<positions.length;i++)positions[i]=i%13/8;
 const delta=new Uint8Array(count*stride),data=new DataView(delta.buffer),offset=stride-12;data.setFloat32((count-1)*stride+offset,1.25,true);data.setFloat32((count-2)*stride+offset+4,-0,true);
 const json:any={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,extras:{bufferView:999}}],meshes:[{primitives:[{attributes:{POSITION:0},targets:[{POSITION:1}]}]}],buffers:[{byteLength:positions.byteLength+delta.byteLength+4}],bufferViews:[{buffer:0,byteOffset:0,byteLength:positions.byteLength},{buffer:0,byteOffset:positions.byteLength,byteLength:delta.byteLength,byteStride:stride},{buffer:0,byteOffset:positions.byteLength+delta.byteLength,byteLength:3}],accessors:[{bufferView:0,componentType:5126,count,type:'VEC3',min:[0,0,0],max:[1.5,1.5,1.5]},{bufferView:1,byteOffset:offset,componentType:5126,count,type:'VEC3',min:[0,0,0],max:[1.25,0,0]}],images:[{bufferView:2,mimeType:'image/png'}]};
 const bin=new Uint8Array(json.buffers[0].byteLength);bin.set(new Uint8Array(positions.buffer));bin.set(delta,positions.byteLength);bin.set([7,8,9],positions.byteLength+delta.byteLength);
 return {json,bin,buffer:encode(json,bin)};
}
function encode(json:any,bin:Uint8Array){const encoded=new TextEncoder().encode(JSON.stringify(json)),length=Math.ceil(encoded.length/4)*4,bl=Math.ceil(bin.length/4)*4,buffer=new ArrayBuffer(28+length+bl),v=new DataView(buffer),bytes=new Uint8Array(buffer);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,buffer.byteLength,true);v.setUint32(12,length,true);v.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+length);bytes.set(encoded,20);v.setUint32(20+length,bl,true);v.setUint32(24+length,0x004e4942,true);bytes.set(bin,28+length);return buffer;}
function decode(buffer:ArrayBuffer){const v=new DataView(buffer),length=v.getUint32(12,true);return {json:JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,length))),bin:new Uint8Array(buffer,28+length)};}
test('sparse GLB preserves real decoded base/morph vertices, negative zero, extras and image bytes',async()=>{
 const f=fixture(),packed=compactMorphGLB(f.buffer);assert.ok(packed.byteLength<f.buffer.byteLength*.7);const {json,bin}=decode(packed);assert.equal(json.nodes[0].extras.bufferView,999);const image=json.bufferViews[json.images[0].bufferView];assert.deepEqual([...bin.slice(image.byteOffset,image.byteOffset+image.byteLength)],[7,8,9]);assert.equal(json.accessors[1].sparse.count,2);
 const before=await parseModel(f.buffer),after=await parseModel(packed),a=before.scene.children[0] as T.Mesh,b=after.scene.children[0] as T.Mesh;assert.deepEqual(a.geometry.attributes.position.array,b.geometry.attributes.position.array);assert.deepEqual(a.geometry.morphAttributes.position![0].array,b.geometry.morphAttributes.position![0].array);assert.equal(compactMorphGLB(packed),packed);disposeModel(before.scene);disposeModel(after.scene);
});
test('strided morph accessors and sparse indices above 65535 retain exact values',async()=>{
 const f=fixture(65538,16),packed=compactMorphGLB(f.buffer),{json,bin}=decode(packed),a=json.accessors[1],iv=json.bufferViews[a.sparse.indices.bufferView];assert.equal(a.sparse.indices.componentType,5125);assert.equal(new DataView(bin.buffer,bin.byteOffset+iv.byteOffset).getUint32(4,true),65537);const loaded=await parseModel(packed),m=loaded.scene.children[0] as T.Mesh,values=m.geometry.morphAttributes.position![0];assert.equal(values.getX(65537),1.25);assert.ok(Object.is(values.getY(65536),-0));disposeModel(loaded.scene);
});
test('zero targets need no sparse values and shared base accessors stay intact',async()=>{
 const f=fixture();new Uint8Array(f.bin.buffer,f.json.bufferViews[1].byteOffset,f.json.bufferViews[1].byteLength).fill(0);const packed=compactMorphGLB(encode(f.json,f.bin)),j=decode(packed).json;assert.equal(j.accessors[1].bufferView,undefined);assert.equal(j.accessors[1].sparse,undefined);const loaded=await parseModel(packed);assert.ok((loaded.scene.children[0] as T.Mesh).geometry.morphAttributes.position![0].array.every(v=>v===0));disposeModel(loaded.scene);
 f.json.meshes[0].primitives[0].attributes.POSITION=1;const shared=encode(f.json,f.bin);assert.equal(compactMorphGLB(shared),shared);
});
test('invalid container and accessor bounds reject before repacking',()=>{
 const f=fixture();assert.throws(()=>compactMorphGLB(f.buffer.slice(0,-4)));f.json.accessors[1].count+=3;assert.throws(()=>compactMorphGLB(encode(f.json,f.bin)));const invalid=fixture();new DataView(invalid.bin.buffer).setFloat32(invalid.json.bufferViews[1].byteOffset,NaN,true);assert.throws(()=>compactMorphGLB(encode(invalid.json,invalid.bin)));
});
