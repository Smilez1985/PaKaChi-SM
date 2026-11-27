import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import * as T from 'three';
import { StudioRig } from '../src/studio-rig.ts';
import { StudioEditor,encodeModel,decodeModel } from '../src/studio-editor.ts';
import type { StudioView } from '../src/studio-view.ts';
import {createUnclassifiedClusterManifest} from '../src/cluster-inventory.ts';
import {proposeSkinWeightClusterAssignments} from '../src/cluster-skin-anatomy.ts';
import {createPaKaChiSemanticCatalog} from '../src/cluster-2d-classifier.ts';


function skinProposalFixture(form:'animal'|'humanoid',hash:string,meshId:string){
 const source={schemaVersion:1 as const,sourceAssetSha256:hash,meshes:[{id:meshId,sourceMeshIndex:0,sourceMeshName:'Body',primitiveIndex:0,vertexCount:3,triangleCount:1}],totals:{meshes:1,vertices:3,triangles:1}};
 const manifest=createUnclassifiedClusterManifest(source,form,'2026-11-27T00:00:00.000Z');
 manifest.parts=[{id:'paws',name:'Paws',parentPartId:null,orderKey:[1],rigBoneIds:['paw-bone']}];
 const skinIndices=new Uint16Array(12),skinWeights=new Float32Array(12);
 for(let vertex=0;vertex<3;vertex++){skinIndices[vertex*4]=0;skinWeights[vertex*4]=1;}
 return proposeSkinWeightClusterAssignments(manifest,hash,[{meshId,vertexCount:3,triangleCount:1,skinIndices,skinWeights,bonePartIds:['paws'],indices:null}],{generatedAt:'2026-11-27T00:00:00.000Z'});
}
function editorView(){
 return {setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},setClusterSkinOverlay(){},onClusterSkinTrianglePick:null as ((hit:{meshId:string;triangleIndex:number;sourceAssetSha256:string;state:'automatic'|'ambiguous'|'unmapped'|'locked';partId:string|null})=>void)|null};
}

test('3D overlay pick pre-fills the correct form and manual correction persists as a locked override',()=>{
 const window=new Window();Object.assign(globalThis,{document:window.document,Option:function(text="",value=""){const o=window.document.createElement("option");o.textContent=text;o.value=value;return o;}});
 const host=window.document.createElement('div'),root=new T.Group();root.add(new T.Mesh(new T.SphereGeometry(.5,8,8)));
 const animalHash='a'.repeat(64),humanoidHash='b'.repeat(64),animalMesh='animal-body',humanoidMesh='humanoid-body';
 const proposals={animal:skinProposalFixture('animal',animalHash,animalMesh),humanoid:skinProposalFixture('humanoid',humanoidHash,humanoidMesh)};
 const project={format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},semanticCatalog:createPaKaChiSemanticCatalog(),clusterSkinAnatomyProposals:proposals};
 const view=editorView();let feedback='';
 const editor=new StudioEditor(new StudioRig(root),view as unknown as StudioView,host as unknown as HTMLElement,project,{suspend(){},resume(){},changed(){},feedback(value){feedback=value;}});
 editor.enter();
 assert.ok(view.onClusterSkinTrianglePick);
 view.onClusterSkinTrianglePick({meshId:animalMesh,triangleIndex:0,sourceAssetSha256:animalHash,state:'automatic',partId:'paws'});
 const animal=host.querySelector<HTMLElement>('[data-cluster-form="animal"]')!;
 const humanoid=host.querySelector<HTMLElement>('[data-cluster-form="humanoid"]')!;
 assert.equal(animal.querySelector<HTMLSelectElement>('[data-cluster-mesh]')!.value,animalMesh);
 assert.equal(animal.querySelector<HTMLInputElement>('[data-cluster-triangle]')!.value,'0');
 assert.equal(animal.querySelector<HTMLSelectElement>('[data-cluster-part]')!.value,'paws');
 assert.match(animal.querySelector<HTMLElement>('[data-cluster-pick-status]')!.textContent??'',/animal-body.*Dreieck 0/);
 assert.equal(humanoid.querySelector<HTMLSelectElement>('[data-cluster-mesh]')!.value,humanoidMesh);
 const reason=animal.querySelector('textarea') as HTMLTextAreaElement;reason.value='Gegen die freigegebene Referenz geprüft.';
 (animal.querySelector('button:last-of-type') as HTMLButtonElement).click();
 const saved=editor.exportProject();
 const corrected=saved.clusterSkinAnatomyProposals!.animal.manifest.assignments[0]!;
 assert.equal(corrected.partId,'paws');assert.equal(corrected.origin,'user');assert.equal(corrected.policy,'locked');
 assert.equal(saved.clusterSkinAnatomyProposals!.humanoid.manifest.assignments[0]!.origin,'automatic');
 const restoredRoot=new T.Group();restoredRoot.add(new T.Mesh(new T.SphereGeometry(.5,8,8)));
 const restored=new StudioEditor(new StudioRig(restoredRoot),editorView() as unknown as StudioView,window.document.createElement('div') as unknown as HTMLElement,saved,{suspend(){},resume(){},changed(){},feedback(){}});
 const roundTrip=restored.exportProject();
 assert.equal(roundTrip.clusterSkinAnatomyProposals!.animal.manifest.assignments[0]!.policy,'locked');
 assert.equal(roundTrip.clusterSkinAnatomyProposals!.humanoid.manifest.assignments[0]!.origin,'automatic');
 assert.match(feedback,/gesperrte Benutzerzuordnung/);
 editor.dispose();restored.dispose();window.happyDOM.abort();
});

test('3D overlay pick refuses stale and ambiguous form/hash bindings without pre-filling a correction',()=>{
 const window=new Window();Object.assign(globalThis,{document:window.document,Option:function(text="",value=""){const o=window.document.createElement("option");o.textContent=text;o.value=value;return o;}});
 const host=window.document.createElement('div'),root=new T.Group();root.add(new T.Mesh(new T.SphereGeometry(.5,8,8)));
 const hash='c'.repeat(64),meshId='shared-mesh';
 const proposals={animal:skinProposalFixture('animal',hash,meshId),humanoid:skinProposalFixture('humanoid',hash,meshId)};
 const project={format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},semanticCatalog:createPaKaChiSemanticCatalog(),clusterSkinAnatomyProposals:proposals};
 const view=editorView();let feedback='';
 const editor=new StudioEditor(new StudioRig(root),view as unknown as StudioView,host as unknown as HTMLElement,project,{suspend(){},resume(){},changed(){},feedback(value){feedback=value;}});
 editor.enter();assert.ok(view.onClusterSkinTrianglePick);
 view.onClusterSkinTrianglePick({meshId,triangleIndex:0,sourceAssetSha256:'d'.repeat(64),state:'automatic',partId:'paws'});
 assert.match(feedback,/keiner eindeutigen Form/);
 view.onClusterSkinTrianglePick({meshId,triangleIndex:0,sourceAssetSha256:hash,state:'automatic',partId:'paws'});
 assert.match(feedback,/keiner eindeutigen Form/);
 for(const form of ['animal','humanoid']){
  const section=host.querySelector<HTMLElement>(`[data-cluster-form="${form}"]`)!;
  assert.equal(section.querySelector<HTMLElement>('[data-cluster-pick-status]')!.dataset.sourceHash,undefined);
 }
 editor.dispose();window.happyDOM.abort();
});

test('shared semantic catalog editor adds, validates, deletes safely and participates in undo/redo',()=>{
 const window=new Window();Object.assign(globalThis,{document:window.document,Option:function(text="",value=""){const o=window.document.createElement("option");o.textContent=text;o.value=value;return o;}});
 const host=window.document.createElement('div') as unknown as HTMLElement,root=new T.Group();root.add(new T.Mesh(new T.SphereGeometry(.5,8,8)));const rig=new StudioRig(root);
 const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){}};
 const project={format:'pakachi-studio' as const,version:1 as const,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]},imageReference:{format:'pakachi-image-reference' as const,version:1 as const,source:{sha256:'a'.repeat(64),width:100,height:100},regions:[{id:'region-cheek',label:'Cheek',kind:'detail' as const,status:'confirmed' as const,geometry:{type:'rectangle' as const,x:10,y:10,width:20,height:20}}],views:[{id:'view-front',label:'Front',regionIds:['region-cheek']}],forms:[{id:'form-animal',label:'Animal form',viewIds:['view-front']}],avatars:[{id:'avatar-panda',label:'Panda',formIds:['form-animal']}],landmarks:[{id:'lm-cheek',regionId:'region-cheek',partId:'facial-cheek',surfaceLayerId:'cheek-fur',poseId:'pose-neutral',x:20,y:20,radiusPx:4}]}};
 let feedback='';const editor=new StudioEditor(rig,view as unknown as StudioView,host,project,{suspend(){},resume(){},changed(){},feedback(value){feedback=value;}});
 const click=(id:string)=>{(host.querySelector('#'+id) as unknown as HTMLButtonElement).click();};
 const select=(id:string)=>host.querySelector('#'+id) as unknown as HTMLSelectElement;
 const field=(id:string,value:string)=>{const input=host.querySelector('#'+id) as unknown as HTMLInputElement;input.value=value;};
 editor.enter();assert.ok(host.querySelector('#catalog-part'));assert.ok(host.querySelector('#cluster-form-comparison .form-comparison'));assert.ok(host.querySelector('#cluster-export-current-manifest'));assert.ok(host.querySelector('#cluster-current-form'));assert.ok(host.querySelector('#cluster-landmark-review'));assert.ok(host.querySelector('#cluster-import-reviewed-manifest'));assert.ok(host.querySelector('#cluster-import-reviewed-manifest-file'));assert.match(host.querySelector('#cluster-landmark-review')?.textContent??'',/Noch keine Klassifikationsvorschläge/);assert.match(host.textContent??'',/Tierform ↔ Arbeitsform vergleichen/);
 field('catalog-part-id','facial-cheek');field('catalog-part-label','Cheeks');select('catalog-part-parent').value='head';click('catalog-part-save');
 assert.ok(editor.exportProject().semanticCatalog?.parts.some(part=>part.id==='facial-cheek'&&part.parentPartId==='head'));
 click('studio-undo');assert.ok(!editor.exportProject().semanticCatalog?.parts.some(part=>part.id==='facial-cheek'));
 click('studio-redo');assert.ok(editor.exportProject().semanticCatalog?.parts.some(part=>part.id==='facial-cheek'));
 select('catalog-part').value='facial-cheek';click('catalog-part-delete');assert.ok(editor.exportProject().semanticCatalog?.parts.some(part=>part.id==='facial-cheek'));assert.match(feedback,/landmarks/);
 field('catalog-layer-id','cheek-fur');field('catalog-layer-label','Cheek fur');select('catalog-layer-part').value='head';click('catalog-layer-save');
 assert.ok(editor.exportProject().semanticCatalog?.surfaceLayers.some(layer=>layer.id==='cheek-fur'&&layer.partId==='head'));select('catalog-layer').value='cheek-fur';click('catalog-layer-delete');assert.ok(editor.exportProject().semanticCatalog?.surfaceLayers.some(layer=>layer.id==='cheek-fur'));assert.match(feedback,/referenced/);
 (host.querySelector('#catalog-part') as unknown as HTMLSelectElement).value='head';click('catalog-part-delete');assert.match(feedback,/child parts/);
 editor.dispose();window.happyDOM.abort();
});

test('studio DOM workflow adds, sizes, connects, undoes, poses and plays a real surface move',()=>{
  const window=new Window();Object.assign(globalThis,{document:window.document,Option:function(text="",value=""){const o=window.document.createElement("option");o.textContent=text;o.value=value;return o;}});
  const host=window.document.createElement('div');window.document.body.append(host);
  const root=new T.Group();root.add(new T.Mesh(new T.SphereGeometry(.5,10,10)));root.updateMatrixWorld(true);
  const rig=new StudioRig(root);let resumed=0;let feedback='';
  const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onAdd:(_p:T.Vector3,_mesh?:number)=>{},onSelect:(_id:string)=>{},onConnect:(_id:string)=>{}};
  const editor=new StudioEditor(rig,view as unknown as StudioView,host as unknown as HTMLElement,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'X',description:'',moves:[]}},{suspend(){},resume(){resumed++;},changed(){},feedback(s){feedback=s;}});
  const click=(id:string)=>(host.querySelector(`#${id}`) as unknown as HTMLButtonElement).click();
  const value=(id:string,text:string,change=true)=>{const e=host.querySelector(`#${id}`) as unknown as HTMLInputElement;e.value=text;if(change)e.dispatchEvent(new window.Event('change') as unknown as Event);};
  editor.enter();click('mode-rig');view.onAdd(new T.Vector3(0,.5,0),0);const a=rig.data.points[0].id;
  value('point-name','Mund links');value('point-size','.006');assert.equal(rig.data.points[0].size,.006);
  view.onAdd(new T.Vector3(.1,.45,0),0);const b=rig.data.points[1].id;view.onConnect(a);assert.equal(rig.data.links.length,1);
  click('studio-undo');assert.equal(rig.data.links.length,0);click('studio-redo');assert.equal(rig.data.links.length,1);
  click('mode-pose');value('pose-name','Neutral',false);click('pose-add');view.onSelect(b);value('point-y','.55');value('pose-name','Lächeln',false);click('pose-add');
  value('move-name','Lächeln',false);value('move-id','laecheln',false);click('move-add');assert.equal(editor.data.moves.length,1);assert.equal(editor.data.poses.length,2);assert.equal(feedback.includes('Schlagwort'),false);
  assert.ok(editor.play('laecheln'));editor.update(.5);const p=editor.data.points.find(p=>p.id===b)!;assert.ok(Math.abs(rig.position(p).y-.5)<1e-6);
  editor.update(.6);assert.equal(editor.playing,false);assert.equal(resumed,1);
  editor.enter();click('mode-rig');view.onSelect(a);click('point-delete');assert.equal(editor.data.points.length,1);assert.equal(editor.data.links.length,0);assert.ok(editor.data.poses.every(p=>!p.values[a]));click('studio-undo');assert.equal(editor.data.points.length,2);
  const bytes=new Uint8Array([0,255,128,10]);assert.deepEqual(new Uint8Array(decodeModel(encodeModel(bytes.buffer))),bytes);
  editor.dispose();window.happyDOM.abort();
});

test('project snapshots preserve unsaved draft, points and moves without saving or capturing player animation',()=>{
 const window=new Window();Object.assign(globalThis,{document:window.document,Option:function(text='',value=''){const o=window.document.createElement('option');o.textContent=text;o.value=value;return o;}});
 const root=new T.Group();root.add(new T.Mesh(new T.SphereGeometry(.5,10,10)));root.updateMatrixWorld(true);
 const rig=new StudioRig(root),host=window.document.createElement('div');
 const view={setEnabled(){},setFigureEnabled(){},setAction(){},setRotation(){},select(){},refresh(){},dispose(){},onAdd:(_p:T.Vector3,_mesh?:number)=>{},onSelect:(_id:string)=>{}};
 const editor=new StudioEditor(rig,view as unknown as StudioView,host as unknown as HTMLElement,{format:'pakachi-studio',version:1,model:'AAAA',avatar:{id:'x',name:'Snapshot',description:'',moves:[]}},{suspend(){},resume(){},changed(){},feedback(){}});
 const click=(id:string)=>(host.querySelector('#'+id) as unknown as HTMLButtonElement).click();
 editor.enter();click('mode-rig');view.onAdd(new T.Vector3(0,.5,0),0);click('mode-pose');
 const point=rig.data.points[0];rig.setPoint(point,new T.Vector3(0,.6,0),new T.Quaternion(),false);
 editor.data.poses=[{id:'pose1',name:'One',seconds:1,values:rig.capture()},{id:'pose2',name:'Two',seconds:1,values:rig.capture()}];editor.data.moves=[{id:'own',name:'Own',loop:true,poses:['pose1','pose2']}];
 const active=editor.exportProject();assert.equal(editor.dirty,true);assert.ok(active.studio.draft);assert.equal(active.studio.points.length,1);
 active.studio.points[0].name='mutated copy';assert.notEqual(editor.data.points[0].name,'mutated copy');
 editor.leave();const player=editor.exportProject();assert.deepEqual(player.studio.draft,active.studio.draft);assert.equal(player.model,'AAAA');assert.deepEqual(player.studio.moves,active.studio.moves);assert.deepEqual(player.studio.poses,active.studio.poses);
 const restoredRoot=new T.Group();restoredRoot.add(new T.Mesh(new T.SphereGeometry(.5,10,10)));const restoredRig=new StudioRig(restoredRoot,player.studio);restoredRig.apply(player.studio.draft!);assert.ok(restoredRig.position(restoredRig.data.points[0]).distanceTo(new T.Vector3(0,.6,0))<1e-6);
 editor.restoreDirty(true);assert.ok(host.querySelector('#studio-save')!.textContent.includes('*'));
 editor.restoreDirty(false);assert.equal(editor.dirty,false);editor.dispose();window.happyDOM.abort();
});

test('invalid replacement bounds are rejected before the viewer clears its current model',async()=>{
 const {Viewer}=await import('../src/viewer.ts');let cleared=false;
 const invalid=new T.Group();
 assert.throws(()=>Viewer.prototype.show.call({clear(){cleared=true;}} as unknown as InstanceType<typeof Viewer>,invalid),/Geometrie/);
 assert.equal(cleared,false);
});
