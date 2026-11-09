/** Read-only probes of real PaKaChi forms; target metrics are not a motion approval. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {createPoseSurfaceChecker} from '../src/pose-surface-check.ts';
import {buildGeometricCorrection} from '../src/geometric-skin-correction.ts';
import {noMeasuredRegression,betterSurfaceReport} from '../src/pose-weight-correction.ts';
Object.assign(globalThis,{ProgressEvent:class extends Event{}});
const hash=b=>createHash('sha256').update(b).digest('hex'),forms=[];
const summarize=r=>({issues:r.issues,volumeIssues:r.volumeIssues,meshes:r.meshes.filter(m=>m.issues||m.volume.issues||m.name==='PaKaChi_body'||m.name==='PaKaChi_fur').map(m=>({name:m.name,issues:m.issues,minimumStretch:m.minimumStretch,maximumStretch:m.maximumStretch,volumeIssues:m.volume.issues,minimumVolumeRatio:m.volume.minimumRatio,maximumVolumeRatio:m.volume.maximumRatio}))});
for(const form of ['humanoid','animal']){
 const bytes=await readFile(new URL(`../public/model-zoo/pakachi-rigged/${form}.glb`,import.meta.url)),gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene),inspect=createPoseSurfaceChecker(rig),trials=[];
 try{for(const name of ['LeftKnee','LeftHip']){
  const joint=rig.data.points.find(p=>p.name===name);if(!joint)throw Error('Probe joint missing: '+name);const values=rig.capture();values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2).toArray();const pose={id:'probe',name:'Probe',seconds:1,values},before=inspect(pose);
  for(const radius of [.3,.6])for(const strength of [.25,.5,1]){const shape=buildGeometricCorrection(rig,pose,joint,radius,strength),after=shape?inspect(pose,undefined,shape):null;trials.push({joint:name,axis:'X',degrees:90,radius,strength,candidate:!!shape,affectedVertices:shape?.meshes.reduce((n,m)=>n+m.indices.length,0)??0,before:summarize(before),after:after?summarize(after):null,targetGuardPassed:!!after&&noMeasuredRegression(before,after)&&betterSurfaceReport(after,before)});}
 }forms.push({form,bytes:bytes.length,sha256:hash(bytes),trials});}finally{rig.dispose();disposeModel(gltf.scene);}
}
const sources=['../src/geometric-skin-correction.ts','../src/pose-surface-check.ts','../src/pose-weight-correction.ts','../src/pose-morphs.ts','../src/studio-corrective-shapes.ts'];
console.log(JSON.stringify({format:'pakachi-geometric-correction-probes',version:1,software:'0.94.0',scope:'Individual X90 target probes, not stored-pose or move acceptance. Rejected candidates do not alter the character.',methodSha256:hash(Buffer.concat(await Promise.all(sources.map(p=>readFile(new URL(p,import.meta.url)))))),forms},null,2));
