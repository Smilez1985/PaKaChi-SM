import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import type {WeightRegion} from '../src/studio-data.ts';
test('optimized weight kernel matches Map reference exactly for duplicate indices, ties, truncation and regions',()=>{
 let seed=12345;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(const interleaved of [false,true]){
 const root=new T.Group(),bones=Array.from({length:5},()=>new T.Bone());root.add(bones[0]);bones.slice(1).forEach(b=>bones[0].add(b));root.position.set(.2,.1,-.1);root.scale.setScalar(.7);root.rotation.z=.3;
 const count=256,positions=new Float32Array(count*3),ii=new Uint16Array(count*4),ww=new Float32Array(count*4);for(let v=0;v<count;v++){for(let k=0;k<3;k++)positions[v*3+k]=random()*2-1;for(let k=0;k<4;k++){ii[v*4+k]=Math.floor(random()*4);ww[v*4+k]=v%3===0?.25:Math.floor(random()*5)/4;}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
 geometry.setAttribute('skinIndex',interleaved?new T.InterleavedBufferAttribute(new T.InterleavedBuffer(ii,4),4,0):new T.BufferAttribute(ii,4));geometry.setAttribute('skinWeight',interleaved?new T.InterleavedBufferAttribute(new T.InterleavedBuffer(ww,4),4,0):new T.BufferAttribute(ww,4));
 const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));const rig=new StudioRig(root),indices=new Uint16Array(ii),weights=new Float32Array(ww),world=Array.from({length:count},(_,v)=>new T.Vector3().fromArray(positions,v*3).applyMatrix4(mesh.matrixWorld));
 const reference=(source:number,target:number,amount:number,region?:WeightRegion)=>{for(let v=0;v<count;v++){
  const merged=new Map<number,number>();for(let k=0;k<4;k++){const i=indices[v*4+k],w=weights[v*4+k];if(w>0)merged.set(i,(merged.get(i)??0)+w);}const original=merged.get(source)??0;if(original<=0)continue;let strength=amount;
  if(region){const u=T.MathUtils.clamp(1-world[v].distanceTo(new T.Vector3().fromArray(region.center))/region.radius,0,1);strength*=u*u*(3-2*u);if(strength<=0)continue;}
  merged.set(source,original*(1-strength));merged.set(target,(merged.get(target)??0)+original*strength);const strongest=[...merged].filter(([,w])=>w>0).sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,4),sum=strongest.reduce((total,[,w])=>total+w,0);for(let k=0;k<4;k++){indices[v*4+k]=strongest[k]?.[0]??0;weights[v*4+k]=(strongest[k]?.[1]??0)/sum;}
 }};
 const cases:{from:number;to:number;amount:number;region?:WeightRegion}[]=[{from:0,to:4,amount:.3},{from:0,to:1,amount:1,region:{center:[0,0,0],radius:1.3}},{from:3,to:2,amount:.1,region:{center:[.1,.2,.3],radius:.8}}];
 for(const c of cases){reference(c.from,c.to,c.amount,c.region);rig.transferWeights(rig.data.points[c.from],rig.data.points[c.to],c.amount,c.region);const actualI=mesh.geometry.getAttribute('skinIndex'),actualW=mesh.geometry.getAttribute('skinWeight');for(let v=0;v<count;v++)for(let k=0;k<4;k++){assert.equal(actualI.getComponent(v,k),indices[v*4+k]);assert.equal(actualW.getComponent(v,k),weights[v*4+k]);}}
 rig.dispose();
 }
});
