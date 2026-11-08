/** CPU diagnostic for the original rigs; no asset, pose or weights are changed. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {checkPoseSurface} from '../src/pose-surface-check.ts';
globalThis.ProgressEvent??=class extends Event{};
const source=JSON.parse(await readFile(new URL('../docs/benchmarks/pakachi-rigging-2026-11-07.json',import.meta.url),'utf8'));
const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const forms=[];
for(const form of ['humanoid','animal']){
  const path=`public/model-zoo/pakachi-rigged/${form}.glb`,bytes=await readFile(new URL('../'+path,import.meta.url)),gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene);
  try{
    const pose={id:'diagnostic',name:'Diagnostic',seconds:1,values:rig.capture()},neutral=checkPoseSurface(rig,pose),other=source.forms.find(f=>f.form!==form).landmarks;
    for(const point of rig.data.points){const bone=rig.bones[point.bone],a=other[bone.name],b=other[bone.parent?.name];if(a)pose.values[point.id].position=a.map((v,i)=>v-(b?.[i]??0));}
    const rejected=checkPoseSurface(rig,pose),body=rejected.meshes.find(m=>m.name==='PaKaChi_body');
    forms.push({form,path,sha256:createHash('sha256').update(bytes).digest('hex'),neutral:{status:neutral.status,compared:neutral.compared,issues:neutral.issues,referenceDegenerate:neutral.referenceDegenerate},unsupportedBoneOnlyRetarget:{status:rejected.status,issues:rejected.issues,body}});
  }finally{rig.dispose();disposeModel(gltf.scene);}
}
console.log(JSON.stringify({version,createdAt:new Date().toISOString(),purpose:'Warning detection only: neutral rigs versus deliberately unsupported bone-only retarget. No corrected surface or usable transformation is claimed.',forms},null,2));
