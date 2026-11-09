import {Box3,Mesh,Vector3} from 'three';
import {parseModel,disposeModel,Viewer} from './viewer.ts';
import type {JobOutput} from './ai-job-types.ts';

export async function validateGeneration(output:JobOutput,signal:AbortSignal):Promise<void>{
 if(output.kind!=='model')throw new Error('model-required');
 signal.throwIfAborted();const model=await parseModel(Uint8Array.from(output.bytes).buffer);
 try{
  signal.throwIfAborted();let vertices=0,bones=0;const bounds=new Box3();model.scene.updateMatrixWorld(true);
  model.scene.traverse(node=>{
   if(node.type==='Bone'&&++bones>256)throw new Error('bone-limit');
   if(!(node instanceof Mesh))return;
   const position=node.geometry.getAttribute('position');if(!position)throw new Error('positions-required');
   vertices+=position.count;if(vertices>2000000)throw new Error('vertex-limit');
   for(let i=0;i<position.count;i++){const point=node.getVertexPosition(i,new Vector3()).applyMatrix4(node.matrixWorld);if(!point.toArray().every(Number.isFinite))throw new Error('invalid-geometry');bounds.expandByPoint(point);}
  });
  if(vertices<3||bounds.isEmpty()||bounds.getSize(new Vector3()).length()<1e-8)throw new Error('empty-geometry');
 }finally{disposeModel(model.scene);}
}
export async function showGenerationPreview(host:HTMLElement,bytes:Uint8Array,signal:AbortSignal,skeleton=false):Promise<()=>void>{
 const model=await parseModel(Uint8Array.from(bytes).buffer);let viewer:Viewer|undefined;
 try{signal.throwIfAborted();viewer=new Viewer(host);viewer.show(model.scene);viewer.showSkeleton(skeleton);return ()=>viewer!.dispose();}
 catch(error){if(viewer)viewer.dispose();else disposeModel(model.scene);throw error;}
}
