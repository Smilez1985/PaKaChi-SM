/** Read-only, reproducible transverse self-intersection probes on both original PaKaChi rigged forms.
 * Run: node scripts/benchmark-pakachi-intersections.mjs
 * Never writes model files or certifies missing/non-continuous collision coverage. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
import {createPoseSurfaceChecker,poseSurfacePositions} from '../src/pose-surface-check.ts';
import {checkSurfaceIntersections,SURFACE_INTERSECTION_TRIANGLE_LIMIT,SURFACE_INTERSECTION_PAIR_BUDGET,SURFACE_INTERSECTION_SPATIAL_MULTIPLIER} from '../src/surface-intersections.ts';
if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event{};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const forms=[],jointNames=['LeftHip','LeftKnee'],degrees=[0,22.5,45,90];
for(const form of ['humanoid','animal']){
 const path=`public/model-zoo/pakachi-rigged/${form}.glb`,bytes=await readFile(new URL('../'+path,import.meta.url));
 const gltf=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(gltf.scene),probes=[];
 try{
  const inspector=createPoseSurfaceChecker(rig),base=rig.capture();
  for(const name of jointNames){
   const joint=rig.data.points.find(p=>p.name===name);
   if(!joint){probes.push({joint:name,status:'joint-not-found'});continue;}
   for(const angle of degrees){
    const values=structuredClone(base);
    values[joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),angle*Math.PI/180).toArray();
    const pose={id:'collision-probe',name:'Collision probe',seconds:1,values},shape=inspector(pose),meshes=[];
    for(let i=0;i<rig.surfaces.length;i++){
     const surface=rig.surfaces[i],index=surface.mesh.geometry.index?.array??null;
     const triangleCount=(index?.length??surface.base.length/3)/3;
     // Record only the remaining hard memory/candidate budget as incomplete.
     if(triangleCount>SURFACE_INTERSECTION_TRIANGLE_LIMIT){meshes.push({mesh:i,name:surface.mesh.name,triangles:triangleCount,checked:false,reason:'budget',intersections:0});continue;}
     const positions=poseSurfacePositions(rig,values,i);
     const result=checkSurfaceIntersections(positions,index);
     meshes.push({mesh:i,name:surface.mesh.name,...result});
    }
    const flagged=meshes.filter(m=>m.intersections||!m.checked);
    // Prioritize actionable body/fur diagnostics and actual detected crossings over decorative meshes.
    const priority=m=>(/body|fur|hip|knee|leg/i.test(m.name)?2:0)+(m.intersections?1:0);
    const ordered=[...flagged].sort((a,b)=>priority(b)-priority(a)||b.intersections-a.intersections||a.mesh-b.mesh);
    probes.push({joint:name,axis:'X',degrees:angle,surfaceIssues:shape.issues,volumeIssues:shape.volumeIssues,
     checkedMeshes:meshes.filter(m=>m.checked).length,unmeasurableMeshes:meshes.filter(m=>!m.checked).length,
     detectedTransverseIntersections:meshes.reduce((sum,m)=>sum+m.intersections,0),
     unmeasurableReasons:meshes.reduce((acc,m)=>{if(!m.checked)acc[m.reason]=(acc[m.reason]??0)+1;return acc;},{}),
     meshDiagnostics:meshes.map(m=>({mesh:m.mesh,name:m.name,triangles:m.triangles,checked:m.checked,reason:m.reason??null,intersections:m.intersections,testedPairs:m.testedPairs??0})),
     meshes:ordered.slice(0,32),
     meshesTruncated:ordered.length>32,
     scope:'Only independent triangles within each mesh; contacts, neighboring faces, other meshes and intermediate motion untested'});
   }
  }
  forms.push({form,source:path,sha256:hash(bytes),vertices:rig.surfaces.reduce((n,s)=>n+s.base.length/3,0),meshes:rig.surfaces.length,probes});
 }finally{rig.dispose();disposeModel(gltf.scene);}
}
console.log(JSON.stringify({format:'pakachi-intersection-probes',version:1,
 scope:'Read-only bounded diagnostics on existing rigged GLBs; no inferred collision or anatomy approval. Every probe is a static X-axis joint pose; not a continuous motion test.',
 parameters:{joints:jointNames,degrees,maxTrianglesPerMesh:SURFACE_INTERSECTION_TRIANGLE_LIMIT,maxCandidatePairsPerMesh:SURFACE_INTERSECTION_PAIR_BUDGET,maxSpatialBoxPairsPerMesh:SURFACE_INTERSECTION_PAIR_BUDGET*SURFACE_INTERSECTION_SPATIAL_MULTIPLIER,spatialIndex:'balanced-3d-bounds-tree'},
 forms},null,2));
