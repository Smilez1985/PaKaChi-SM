import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {StudioRig} from '../src/studio-rig.ts';
import {parseProject} from '../src/studio-data.ts';
function fixture(){
 const root=new T.Group(),hip=new T.Bone(),arm=new T.Bone(),hand=new T.Bone();root.position.y=3;root.scale.setScalar(.8);hip.rotation.z=.2;hip.add(arm);arm.add(hand);root.add(hip);arm.position.y=1;hand.position.y=1;
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([.1,0,0,.1,1.2,0,.1,2,0],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,1,2,0,0,2,0,0,0],4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,.8,.2,0,0,1,0,0,0],4));const mesh=new T.SkinnedMesh(geometry,new T.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton([hip,arm,hand]));const rig=new StudioRig(root),point=(bone:T.Bone)=>rig.data.points.find(p=>rig.bones[p.bone!]===bone)!;return {root,hip,arm,hand,mesh,rig,point};
}
const arrays=(mesh:T.SkinnedMesh)=>['skinIndex','skinWeight'].map(k=>Array.from(mesh.geometry.getAttribute(k).array));
function weights(mesh:T.SkinnedMesh,rig:StudioRig,deleted:number[]=[]){
 const index=mesh.geometry.getAttribute('skinIndex'),weight=mesh.geometry.getAttribute('skinWeight');return Array.from({length:index.count},(_,v)=>{const result=new Map<number,number>();for(let k=0;k<4;k++){const w=weight.getComponent(v,k);if(!w)continue;let id=rig.bones.indexOf(mesh.skeleton.bones[index.getComponent(v,k)]);if(deleted.includes(id))id=0;result.set(id,(result.get(id)??0)+w);}return [...result].sort((a,b)=>a[0]-b[0]);});
}
test('transfer before parent deletion retains exact semantic weights through nested replay, undo and reload',()=>{
 for(const nested of [false,true]){
  const f=fixture(),{rig,mesh}=f,source=f.point(f.arm);const above=nested?rig.insertJoint(source,.5):null,added=rig.insertJoint(f.point(f.hand),.4);rig.transferWeights(source,added,.25);
  const beforeData=structuredClone(rig.data),beforeArrays=arrays(mesh),expected=weights(mesh,rig,[source.bone!,...(above?[above.bone!]:[])]);
  rig.setFigureTransform(new T.Vector3(.4,.2,0),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.3),1.2);
  rig.deleteBone(source);if(above)rig.deleteBone(above);
  const actual=weights(mesh,rig);actual.forEach((row,i)=>{assert.deepEqual(row.map(x=>x[0]),expected[i].map(x=>x[0]));row.forEach((x,j)=>assert.ok(Math.abs(x[1]-expected[i][j][1])<1e-6));});
  const saved=structuredClone(rig.data),afterArrays=arrays(mesh);for(let i=0;i<3;i++){rig.reset();assert.deepEqual(arrays(mesh),afterArrays);}
  rig.data=beforeData;rig.reset();assert.deepEqual(arrays(mesh),beforeArrays);rig.data=saved;rig.reset();assert.deepEqual(arrays(mesh),afterArrays);
  const project=parseProject({format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'test',name:'Test',description:'',moves:[]},studio:saved});const other=fixture();other.rig.data=project.studio;other.rig.reset();assert.deepEqual(arrays(other.mesh),afterArrays);rig.dispose();other.rig.dispose();
 }
});
