/** CPU diagnostic for the original rigs; no asset, pose or weights are changed. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {checkPoseSurface} from '../src/pose-surface-check.ts';
import {searchWeightCorrection} from '../src/pose-weight-correction.ts';
import * as T from 'three';
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
    let weightCorrection;
    if(process.argv.includes('--weights')){
      const joint=rig.data.points.find(p=>p.name==='LeftElbow'),values=rig.capture();values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI).toArray();const target={id:'twist',name:'Full elbow twist',seconds:1,values};rig.data.poses=[target,{id:'neutral',name:'Neutral',seconds:1,values:rig.capture()}];
      const before=checkPoseSurface(rig,target),proposal=await searchWeightCorrection(rig,target,joint,.3,new AbortController().signal);
      weightCorrection={joint:joint.name,rotationDegrees:180,axis:[0,1,0],radius:.3,beforeIssues:before.issues,proposal:proposal?{from:proposal.from,to:proposal.to,amount:proposal.amount,afterIssues:proposal.after.issues,affectedVertices:proposal.affectedVertices}:null,interpretation:proposal?'Measured improvement only; requires visual review.':'No accepted local transfer. Geometry and stored poses remain unchanged.'};
    }
    forms.push({form,path,sha256:createHash('sha256').update(bytes).digest('hex'),neutral:{status:neutral.status,compared:neutral.compared,issues:neutral.issues,referenceDegenerate:neutral.referenceDegenerate},unsupportedBoneOnlyRetarget:{status:rejected.status,issues:rejected.issues,body},...(weightCorrection?{weightCorrection}:{})});
  }finally{rig.dispose();disposeModel(gltf.scene);}
}
console.log(JSON.stringify({version,createdAt:new Date().toISOString(),purpose:'Warning detection only: neutral rigs versus deliberately unsupported bone-only retarget. No corrected surface or usable transformation is claimed.',forms},null,2));
