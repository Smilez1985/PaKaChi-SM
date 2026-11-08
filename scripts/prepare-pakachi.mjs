/** Reproducible character-specific refinement and skinning; no changes to source assets. */
import * as T from 'three';
import {compactMorphGLB} from '../src/sparse-morph-glb.ts';
import {preparePoseCorrections} from './pakachi-pose-corrections.mjs';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {characterForms,hierarchy} from './pakachi-rig-config.mjs';
import {pawLayout,trimPaws,attachPaws,weldSource,sealBoundaries} from './pakachi-paws.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const v=a=>new T.Vector3().fromArray(a);
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

function neighbors(geometry){
 const count=geometry.attributes.position.count,out=Array.from({length:count},()=>new Set()),index=geometry.index;
 for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);out[a].add(b).add(c);out[b].add(a).add(c);out[c].add(a).add(b);}
 return out.map(s=>[...s]);
}
function refineGeometry(source){
 const g=source.clone(),p=g.attributes.position,index=g.index,valid=[];let removedDegenerate=0;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<index.count;i+=3){a.fromBufferAttribute(p,index.getX(i));b.fromBufferAttribute(p,index.getX(i+1));c.fromBufferAttribute(p,index.getX(i+2));
  if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-20){removedDegenerate++;continue;}valid.push(index.getX(i),index.getX(i+1),index.getX(i+2));}
 g.setIndex(valid);const adjacent=neighbors(g),initial=Float32Array.from(p.array),temp=new Float32Array(p.array.length);
 // A short Taubin pair reduces reconstruction stair steps without shrinking the whole model.
 const passes=Array.from({length:8},()=>[.28,-.29]).flat();
 for(const factor of passes){
  for(let i=0;i<p.count;i++){const ns=adjacent[i];for(let axis=0;axis<3;axis++){let sum=0;for(const n of ns)sum+=p.array[n*3+axis];const k=i*3+axis;temp[k]=ns.length?p.array[k]+factor*(sum/ns.length-p.array[k]):p.array[k];}}
  p.array.set(temp);
 }
 let maxDisplacement=0;for(let i=0;i<p.count;i++)maxDisplacement=Math.max(maxDisplacement,Math.hypot(...[0,1,2].map(k=>p.array[i*3+k]-initial[i*3+k])));
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 const raw=g.attributes.color,colors=new Float32Array(p.count*3),color=new T.Color();
 for(let i=0;i<p.count;i++){
  let r=raw.getX(i),green=raw.getY(i),b=raw.getZ(i);
  // The backend writes sRGB bytes. glTF vertex colors are linear; retain the green/cream markings.
  if(r>green&&r>b*1.04&&Math.max(r,green,b)<.58){const l=.2126*r+.7152*green+.0722*b;r=l*.72;green=l*.77;b=l*.74;}
  color.setRGB(r,green,b,T.SRGBColorSpace);color.toArray(colors,i*3);
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return {geometry:g,adjacent,report:{removedDegenerate,taubinPasses:passes.length,maxDisplacement,sourceVertices:p.count}};
}
function projectChain(point,names,landmarks){
 let best={distance:Infinity,arc:0},length=0;const lengths=[];
 for(let i=0;i<names.length-1;i++){
  const a=v(landmarks[names[i]]),b=v(landmarks[names[i+1]]),delta=b.clone().sub(a),len=delta.length(),t=T.MathUtils.clamp(point.clone().sub(a).dot(delta)/(len*len),0,1),d=point.distanceTo(a.addScaledVector(delta,t));
  if(d<best.distance)best={distance:d,arc:length+len*t};lengths.push(len);length+=len;
 }
 return {...best,lengths,length};
}
function chainWeights(point,names,landmarks){
 const p=projectChain(point,names,landmarks),centers=[];let arc=0;
 p.lengths.forEach(len=>{centers.push(arc+len*.5);arc+=len;});centers.push(arc);
 if(p.arc<=centers[0])return {[names[0]]:1};
 for(let i=1;i<centers.length;i++)if(p.arc<=centers[i]){const t=smooth(centers[i-1],centers[i],p.arc);return {[names[i-1]]:1-t,[names[i]]:t};}
 return {[names.at(-1)]:1};
}
function anatomicalWeights(point,form,config,tailComponent=false){
 const l=config.landmarks,y=point.y,z=point.z;
 const tail=['TailBase','Tail1','Tail2','Tail3','TailTip'];
 let isTail=tailComponent;
 if(form==='animal'){
  const tailDistance=projectChain(point,tail,l).distance;
  const bodyDistance=Math.min(...[['Pelvis','Spine','Chest','Neck','Head'],['LeftShoulder','LeftElbow','LeftWrist','LeftHand'],['RightShoulder','RightElbow','RightWrist','RightHand'],['LeftHip','LeftKnee','LeftAnkle','LeftFoot'],['RightHip','RightKnee','RightAnkle','RightFoot']].map(names=>projectChain(point,names,l).distance));
  isTail=tailDistance<bodyDistance;
 }
 if(isTail)return chainWeights(point,tail,l);
 const headRegion=form!=='animal'||projectChain(point,['Neck','Head','Jaw'],l).distance<projectChain(point,['Pelvis','Spine','Chest'],l).distance+.025;
 if(y>config.headCut&&headRegion){
  const neck=smooth(config.headCut,config.headCut+.065,y);
  let weights={Neck:1-neck,Head:neck};
  for(const ear of ['LeftEar','RightEar']){const d=point.distanceTo(v(l[ear]));const amount=(1-smooth(.035,.105,d))*smooth(l[ear][1]-.09,l[ear][1],y);if(amount>.05){weights={Head:1-amount,[ear]:amount};break;}}
  const jaw=(1-smooth(l.Jaw[1],l.Jaw[1]+.035,y))*smooth(l.Jaw[2]-.015,l.Jaw[2]+.025,z)*.55;
  if(jaw>0){for(const k of Object.keys(weights))weights[k]*=1-jaw;weights.Jaw=jaw;}return weights;
 }
 const chains=[['Pelvis','Spine','Chest','Neck'],['LeftShoulder','LeftElbow','LeftWrist','LeftHand'],['RightShoulder','RightElbow','RightWrist','RightHand'],['LeftHip','LeftKnee','LeftAnkle','LeftFoot'],['RightHip','RightKnee','RightAnkle','RightFoot']];
 const scores=chains.map((names,i)=>({names,i,...projectChain(point,names,l)}));
 if(form==='humanoid'){
  // Keep the torso and rear tail out of the hanging forearms and legs.
  for(const score of scores){if(score.i>=3&&y>-.10)score.distance+=.3;if((score.i===1||score.i===2)&&y<-.245)score.distance+=.4;}
 }
 scores.sort((a,b)=>a.distance-b.distance);const winner=scores[0],weights=chainWeights(point,winner.names,l);
 if(winner.i){const start=v(l[winner.names[0]]),root=winner.i<=2?'Chest':'Pelvis',amount=.5*(1-smooth(0,.085,point.distanceTo(start)));for(const k of Object.keys(weights))weights[k]*=1-amount;weights[root]=(weights[root]??0)+amount;}
 return weights;
}
function bindWeights(geometry,adjacent,form,config,bones){
 const names=bones.map(b=>b.name),byName=new Map(names.map((name,i)=>[name,i])),p=geometry.attributes.position;
 const tailVertices=new Set();
 if(form==='humanoid'){
  // This reconstruction has a separate tail component. Follow its real edges
  // rather than a front-view rectangle that can accidentally include a foot.
  const queue=[];for(let i=0;i<p.count;i++)if(p.getX(i)<-.3){tailVertices.add(i);queue.push(i);}
  for(let cursor=0;cursor<queue.length;cursor++)for(const n of adjacent[queue[cursor]])if(!tailVertices.has(n)){tailVertices.add(n);queue.push(n);}
 }
 let weights=Array.from({length:p.count},(_,i)=>new Map(Object.entries(anatomicalWeights(new T.Vector3().fromBufferAttribute(p,i),form,config,tailVertices.has(i))).filter(([,w])=>w>1e-8).map(([name,w])=>[byName.get(name),w])));
 // Smooth across actual mesh edges, never across nearby but disconnected limbs.
 for(let pass=0;pass<3;pass++)weights=weights.map((self,i)=>{
  const out=new Map([...self].map(([k,w])=>[k,w*.72])),ns=adjacent[i];
  if(!ns.length)return self;
  for(const n of ns)for(const [k,w] of weights[n])out.set(k,(out.get(k)??0)+w*.28/ns.length);
  const entries=[...out].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=entries.reduce((s,[,w])=>s+w,0);return new Map(entries.map(([k,w])=>[k,w/sum]));
 });
 const indices=new Uint16Array(p.count*4),values=new Float32Array(p.count*4),coverage=Object.fromEntries(names.map(n=>[n,0]));
 weights.forEach((map,i)=>{let slot=0;for(const [bone,w] of map){indices[i*4+slot]=bone;values[i*4+slot]=w;if(w>.05)coverage[names[bone]]++;slot++;}});
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(values,4));return coverage;
}
function attachSkin(geometry,material,skeleton,parent,name){const mesh=new T.SkinnedMesh(geometry,material);mesh.name=name;parent.add(mesh);mesh.bind(skeleton,new T.Matrix4());return mesh;}

/** Returns a separately owned scene; original geometry and material are untouched. */
export function prepareCharacter(source,form){
 const config=structuredClone(characterForms[form]);if(!config)throw Error('Unknown PaKaChi form');source.updateMatrixWorld(true);const meshes=[];source.traverse(n=>{if(n.isMesh)meshes.push(n);});if(meshes.length!==1||meshes[0].isSkinnedMesh)throw Error('Expected one unrigged source mesh');
 const flat=meshes[0].geometry.clone().applyMatrix4(meshes[0].matrixWorld),sourceVertices=flat.attributes.position.count,paws=pawLayout(form,config.landmarks),welded=weldSource(flat),trimmed=trimPaws(welded,paws),refined=refineGeometry(trimmed.geometry);flat.dispose();welded.dispose();trimmed.geometry.dispose();
 const sealed=sealBoundaries(refined.geometry);refined.adjacent=neighbors(refined.geometry);
 const bodyGeometry=refined.geometry,bodyMaterial=new T.MeshPhysicalMaterial({vertexColors:true,metalness:0,roughness:1,specularIntensity:.15});bodyMaterial.name='PaKaChi_soft_fur';
 // The image reconstruction's tail has depth that cannot be read from its front
 // silhouette. Fit each centerline depth to a real local cross-section instead.
 for(const name of ['TailBase','Tail1','Tail2','Tail3','TailTip']){
  const landmark=config.landmarks[name],depths=[],position=bodyGeometry.attributes.position;
  for(let i=0;i<position.count;i++)if((position.getX(i)-landmark[0])**2+(position.getY(i)-landmark[1])**2<.045**2&&(name!=='TailBase'||position.getZ(i)<-.025))depths.push(position.getZ(i));
  depths.sort((a,b)=>a-b);if(depths.length<10)throw Error('Insufficient tail cross-section: '+name);
  landmark[2]=(depths[Math.floor(depths.length*.05)]+depths[Math.floor(depths.length*.95)])/2;
 }
 const probe=new T.Mesh(bodyGeometry,new T.MeshBasicMaterial({side:T.DoubleSide}));probe.updateMatrixWorld(true);
 function facePoint(x,y){const hits=new T.Raycaster(new T.Vector3(x,y,2),new T.Vector3(0,0,-1)).intersectObject(probe);if(!hits.length)throw Error(`Face landmark misses surface: ${form} ${x}/${y}`);const hit=hits[0],normal=hit.face.normal.clone();if(normal.z<0)normal.negate();return {position:hit.point,normal};}
 const eyeHits=config.eyes.map(([x,y])=>facePoint(x,y));eyeHits.forEach((h,i)=>config.landmarks[i?'RightEye':'LeftEye']=h.position.toArray());
 const root=new T.Group();root.name=`PaKaChi_${form}`;root.userData={character:'PaKaChi',form,rig:'pakachi-anatomical-2',source:'TripoSR draft; character-specific landmark skinning and articulated paw replacement',morphReady:false};
 const bones=[],map=new Map();
 for(const [name,parent] of hierarchy){const bone=new T.Bone();bone.name=name;const position=v(config.landmarks[name]);bone.position.copy(parent?position.sub(v(config.landmarks[parent])):position);(parent?map.get(parent):root).add(bone);bones.push(bone);map.set(name,bone);}
 root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);skeleton.calculateInverses();const coverage=bindWeights(bodyGeometry,refined.adjacent,form,config,bones);
 const body=attachSkin(bodyGeometry,bodyMaterial,skeleton,root,'PaKaChi_body');
 const socket=new T.MeshStandardMaterial({color:0x101a11,roughness:.4,metalness:0}),iris=new T.MeshStandardMaterial({color:0x328e15,roughness:.38,metalness:0,emissive:0x174300,emissiveIntensity:.23}),pupil=new T.MeshStandardMaterial({color:0x09120b,roughness:.3,metalness:0}),glint=new T.MeshBasicMaterial({color:0xf4ffe5});
 function ellipsoid(parent,name,position,scale,material){const mesh=new T.Mesh(new T.SphereGeometry(1,20,14),material);mesh.name=name;mesh.position.copy(position);mesh.scale.fromArray(scale);parent.add(mesh);return mesh;}
 // Real 3D eyes, pupils and highlights, attached to the same head hierarchy in both forms.
 eyeHits.forEach((hit,i)=>{const bone=map.get(i?'RightEye':'LeftEye'),group=new T.Group();group.name=i?'Right_eye_details':'Left_eye_details';group.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),hit.normal);bone.add(group);const r=config.eyeRadius;
  ellipsoid(group,'Eye_socket',new T.Vector3(0,0,-r*.3),[r,r*1.13,r*.57],socket);
  ellipsoid(group,'Green_iris',new T.Vector3(0,0,r*.17),[r*.73,r*.87,r*.22],iris);
  ellipsoid(group,'Pupil',new T.Vector3(0,0,r*.36),[r*.42,r*.64,r*.07],pupil);
  ellipsoid(group,'Eye_highlight',new T.Vector3(-r*.24,r*.33,r*.43),[r*.15,r*.17,r*.05],glint);
 });
 const nose=facePoint(...config.nose),noseGroup=new T.Group();noseGroup.position.copy(nose.position).sub(v(config.landmarks.Head)).addScaledVector(nose.normal,.001);noseGroup.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),nose.normal);map.get('Head').add(noseGroup);ellipsoid(noseGroup,'Soft_nose',new T.Vector3(),[config.eyeRadius*.43,config.eyeRadius*.30,config.eyeRadius*.20],pupil);
 const mouthGuide=new T.QuadraticBezierCurve3(...config.mouth.map(([x,y])=>new T.Vector3(x,y,0)));
 const mouth=mouthGuide.getPoints(24).map(p=>{const h=facePoint(p.x,p.y);return h.position.addScaledVector(h.normal,.003).sub(v(config.landmarks.Jaw));});const smile=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(mouth),32,.0009,6,false),pupil);smile.name='Muzzle_smile';map.get('Jaw').add(smile);
 attachPaws(root,map,paws,config.landmarks);
 // Short combed fiber tufts add actual silhouette detail; no billboard or painted replacement.
 const positions=[],normals=[],colors=[],skinIndices=[],skinWeights=[],furBodyVertices=[],p=bodyGeometry.attributes.position,n=bodyGeometry.attributes.normal,c=bodyGeometry.attributes.color,si=bodyGeometry.attributes.skinIndex,sw=bodyGeometry.attributes.skinWeight;
 let state=0x50414b41;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
 for(let sample=0;sample<50000;sample++){
  const i=Math.floor(random()*p.count),point=new T.Vector3().fromBufferAttribute(p,i),normal=new T.Vector3().fromBufferAttribute(n,i),rgb=new T.Vector3(c.getX(i),c.getY(i),c.getZ(i));
  const tail=form==='humanoid'?point.x<.035:point.x<-.23;
  const green=rgb.y>rgb.x*1.5&&rgb.y>rgb.z*1.4;
  if(Math.max(rgb.x,rgb.y,rgb.z)>.22&&!(tail&&green)||point.y<-.38||form==='humanoid'&&point.y>.235&&point.z>.14||form==='animal'&&point.y>.035&&point.z>.26)continue;
  const tangent=new T.Vector3().crossVectors(normal,new T.Vector3(.15,1,.12)).normalize();if(tangent.lengthSq()<.1)continue;
  const length=(tail?.003:.002)+random()*.004,base=point.clone().addScaledVector(normal,.00015),tip=base.clone().addScaledVector(normal,length).addScaledVector(new T.Vector3(0,-1,0),length*.65),width=.00055;
  for(const vertex of [base.clone().addScaledVector(tangent,width),base.clone().addScaledVector(tangent,-width),tip]){furBodyVertices.push(i);positions.push(...vertex.toArray());normals.push(...normal.toArray());colors.push(rgb.x*.8,rgb.y*.8,rgb.z*.8);for(let k=0;k<4;k++){skinIndices.push(si.getComponent(i,k));skinWeights.push(sw.getComponent(i,k));}}
 }
 const furGeometry=new T.BufferGeometry();furGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));furGeometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));furGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));furGeometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));furGeometry.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeights,4));
 const furMaterial=bodyMaterial.clone();furMaterial.name='PaKaChi_short_fibers';furMaterial.side=T.DoubleSide;const fur=attachSkin(furGeometry,furMaterial,skeleton,root,'PaKaChi_fur');
 const poseCorrections=preparePoseCorrections(root,body,fur,furBodyVertices);
 root.updateMatrixWorld(true);probe.material.dispose();
 return {root,body,bones,config,report:{...refined.report,sourceVertices,bones:bones.length,bodyVertices:p.count,pawTopology:{...trimmed.report,...sealed},digits:root.userData.paws.digits,furTufts:positions.length/9,poseCorrections,coverage,landmarks:config.landmarks,limits:['No morph correspondence between the two independently reconstructed meshes.','Articulated paws replace distal source surfaces; no final design or collision approval.','Landmark skinning and surface refinement require visual review; source reconstruction defects can remain.']}};
}

export async function generateCharacters({ifNeeded=false}={}){
 const pipelineSha256=hash(Buffer.concat(await Promise.all(['prepare-pakachi.mjs','pakachi-rig-config.mjs','pakachi-paws.mjs','pakachi-skin-optimization.mjs','pakachi-pose-corrections.mjs','../src/surface-check.ts','../src/pose-morphs.ts','../src/sparse-morph-glb.ts'].map(p=>readFile(new URL('./'+p,import.meta.url))))));
 const reportPath='docs/benchmarks/pakachi-rigging-2026-11-07.json';
 if(ifNeeded){try{
  const previous=JSON.parse(await readFile(reportPath,'utf8'));
  if(previous.pipelineSha256===pipelineSha256&&previous.forms.length===Object.keys(characterForms).length){
   const matches=await Promise.all(previous.forms.map(async r=>hash(await readFile(r.source))===r.sourceSha256&&hash(await readFile(r.output))===r.outputSha256));
   if(matches.every(Boolean))return previous.forms;
  }
 }catch{/* Missing or stale generated assets are rebuilt from the preserved source. */}}
 globalThis.ProgressEvent??=class extends Event{};
 globalThis.FileReader??=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:application/octet-stream;base64,'+Buffer.from(result).toString('base64');this.onloadend?.();});}};
 const reports=[];for(const form of Object.keys(characterForms)){
  const sourcePath=`public/model-zoo/pakachi-drafts/${form}.glb`,bytes=await readFile(sourcePath),gltf=await parseModel(Uint8Array.from(bytes).buffer),prepared=prepareCharacter(gltf.scene,form);
  const output=Buffer.from(compactMorphGLB(await new GLTFExporter().parseAsync(prepared.root,{binary:true,onlyVisible:true})));await mkdir('public/model-zoo/pakachi-rigged',{recursive:true});await writeFile(`public/model-zoo/pakachi-rigged/${form}.glb`,output);
  reports.push({form,source:sourcePath,sourceSha256:hash(bytes),output:`public/model-zoo/pakachi-rigged/${form}.glb`,outputSha256:hash(output),bytes:output.length,...prepared.report});disposeModel(gltf.scene);disposeModel(prepared.root);
 }
 await writeFile(reportPath,JSON.stringify({format:'pakachi-character-rigging',version:4,pipelineSha256,method:'Measured landmarks, corrected wrist/paw depths and fitted tail cross-sections; continuous chain weights, three mesh-edge smoothing passes, four influences maximum. Distal hand/toe clipping, 0.00001-unit source welding and simple boundary-loop caps; 28 extra digit joints with independent rigid geometry. Accepted context-guarded elbow/knee morphs with attachment-preserving fur offsets from constrained edge-length fitting; original weights and rest surface unchanged. Character-specific, not automatic anatomical inference.',forms:reports},null,2)+'\n');return reports;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)generateCharacters({ifNeeded:process.argv.includes('--if-needed')}).then(r=>console.log(r.map(x=>({form:x.form,bones:x.bones,vertices:x.bodyVertices,furTufts:x.furTufts,bytes:x.bytes})))).catch(e=>{console.error(e);process.exitCode=1;});
