import * as THREE from 'three';
import {StudioRig} from '../../../src/studio-rig.ts';
import {StudioView} from '../../../src/studio-view.ts';
import {StudioEditor} from '../../../src/studio-editor.ts';
import {createPaKaChiSemanticCatalog} from '../../../src/cluster-2d-classifier.ts';
import {createUnclassifiedClusterManifest} from '../../../src/cluster-inventory.ts';
import {proposeSkinWeightClusterAssignments} from '../../../src/cluster-skin-anatomy.ts';

export function mountSurfacePickFixture(canvas:HTMLCanvasElement){
 canvas.width=400;canvas.height=300;
 const scene=new THREE.Scene(),root=new THREE.Group();
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,0,1,0],3));
 geometry.setIndex([0,1,2]);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 mesh.name='pick-target';root.add(mesh);scene.add(root);
 const rig=new StudioRig(root);
 const camera=new THREE.PerspectiveCamera(45,400/300,.1,100);
 camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const orbit={enabled:true,target:new THREE.Vector3()};
 const view=new StudioView(rig,camera,canvas,orbit,scene);
 let selected:{meshIndex:number;triangleIndex:number;barycentric:readonly [number,number,number]}|null=null;
 view.onSurfacePick=hit=>{selected=hit;};
 view.setEnabled(true);view.setAction('surface-pick');
 return {view,selected:()=>selected};
}

export function mountClusterOverlayPickFixture(canvas:HTMLCanvasElement){
 canvas.width=400;canvas.height=300;
 const scene=new THREE.Scene(),root=new THREE.Group();
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,0,1,0],3));
 geometry.setIndex([0,1,2]);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 mesh.userData.pakachiClusterMeshId='source-mesh-7';mesh.userData.pakachiClusterSourceAssetSha256='a'.repeat(64);
 root.add(mesh);scene.add(root);
 const rig=new StudioRig(root);
 const camera=new THREE.PerspectiveCamera(45,400/300,.1,100);
 camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const orbit={enabled:true,target:new THREE.Vector3()};
 const view=new StudioView(rig,camera,canvas,orbit,scene);
 let selected:unknown=null;
 view.onClusterSkinTrianglePick=hit=>{selected=hit;};
 view.setEnabled(true);
 view.setClusterSkinOverlay({sourceAssetSha256:'a'.repeat(64),missingMeshIds:[],triangles:[{
  meshId:'source-mesh-7',triangleIndex:42,state:'locked',partId:'left-paw',positions:[-1,-1,0,1,-1,0,0,1,0],
 }]});
 return {view,selected:()=>selected};
}


function skinProposal(form:'animal'|'humanoid',hash:string,meshId:string){
 const source={schemaVersion:1 as const,sourceAssetSha256:hash,meshes:[{id:meshId,sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:3,triangleCount:1}],totals:{meshes:1,vertices:3,triangles:1}};
 const manifest=createUnclassifiedClusterManifest(source,form,'2026-11-27T00:00:00.000Z');
 manifest.parts=[{id:'paws',name:'Paws',parentPartId:null,orderKey:[1],rigBoneIds:['paw-bone']}];
 const skinIndices=new Uint16Array(12),skinWeights=new Float32Array(12);
 for(let vertex=0;vertex<3;vertex++){skinIndices[vertex*4]=0;skinWeights[vertex*4]=1;}
 return proposeSkinWeightClusterAssignments(manifest,hash,[{meshId,vertexCount:3,triangleCount:1,skinIndices,skinWeights,bonePartIds:['paws'],indices:null}],{generatedAt:'2026-11-27T00:00:00.000Z'});
}

export function mountClusterEditorCorrectionFixture(canvas:HTMLCanvasElement,host:HTMLElement){
 canvas.width=400;canvas.height=300;
 host.innerHTML='<div id="cluster-skin-anatomy-proposals"></div>';
 const scene=new THREE.Scene(),root=new THREE.Group(),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,0,1,0],3));geometry.setIndex([0,1,2]);
 root.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})));scene.add(root);
 const rig=new StudioRig(root),camera=new THREE.PerspectiveCamera(45,400/300,.1,100);
 camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const orbit={enabled:true,target:new THREE.Vector3()},view=new StudioView(rig,camera,canvas,orbit,scene);
 const animalHash='a'.repeat(64),humanoidHash='b'.repeat(64);
 const project={format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},semanticCatalog:createPaKaChiSemanticCatalog(),clusterSkinAnatomyProposals:{animal:skinProposal('animal',animalHash,'animal-body'),humanoid:skinProposal('humanoid',humanoidHash,'humanoid-body')}};
 let feedback='';
 const hooks={suspend(){},resume(){},changed(){},feedback(value:string){feedback=value;}};
 const editor=new StudioEditor(rig,view,host,project,hooks);editor.enter();
 let pickedHit:unknown=null;const pick= view.onClusterSkinTrianglePick;view.onClusterSkinTrianglePick=hit=>{pickedHit=hit;pick(hit);};
 view.setClusterSkinOverlay({sourceAssetSha256:animalHash,missingMeshIds:[],triangles:[{meshId:'animal-body',triangleIndex:0,state:'automatic',partId:'paws',positions:[-1,-1,0,1,-1,0,0,1,0]}]});
 return {view,editor,feedback:()=>feedback,pickedHit:()=>pickedHit,restore(){
  const saved=JSON.parse(JSON.stringify(editor.exportProject()));
  const restoredHost=document.createElement('div');restoredHost.innerHTML='<div id="cluster-skin-anatomy-proposals"></div>';document.body.append(restoredHost);
  const restoredRoot=new THREE.Group();restoredRoot.add(new THREE.Mesh(new THREE.SphereGeometry(.5,8,8)));
  const restoredView={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},setClusterSkinOverlay(){}} as any;
  const restored=new StudioEditor(new StudioRig(restoredRoot),restoredView,restoredHost,saved,hooks);restored.enter();
  return {editor:restored,host:restoredHost,saved};
 }};
}
