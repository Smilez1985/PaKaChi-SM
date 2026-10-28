/** Synthetic visibility diagnostic; no hardware-independent pass/fail timing threshold. */
import * as T from 'three';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {StudioWeightVisibility} from '../src/studio-weight-visibility.ts';
const camera=new T.PerspectiveCamera(60,1,.1,10);camera.position.z=3;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
const matrix=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
const view={eye:camera.position.toArray(),projection:matrix.toArray(),materials:true,alpha:true};
function run(segments,cutout){
 globalThis.gc?.();const before=process.memoryUsage();
 const geometry=new T.PlaneGeometry(2,2,segments,segments);
 for(const key of ['uv1','uv2','uv3'])geometry.setAttribute(key,geometry.getAttribute('uv').clone());
 const material=new T.MeshBasicMaterial();let map;
 if(cutout){map=new T.DataTexture(new Uint8Array([255,255,255,0,255,255,255,255]),2,1);map.channel=2;map.magFilter=T.NearestFilter;material.map=map;material.alphaTest=.5;}
 const mesh=new T.Mesh(geometry,material);mesh.updateMatrixWorld(true);
 const captureStart=performance.now(),visibility=new StudioWeightVisibility([mesh]),captureMs=performance.now()-captureStart;
 const point=new T.Vector3(.4,0,-.1),buildStart=performance.now();visibility.visible(point,view,matrix);const firstQueryMs=performance.now()-buildStart;
 globalThis.gc?.();const retained=process.memoryUsage();
 const queryStart=performance.now();let visible=0;
 for(let i=0;i<1000;i++){point.set(((i*37)%997)/997*1.8-.9,((i*61)%991)/991*1.8-.9,-.1);if(visibility.visible(point,view,matrix))visible++;}
 const queriesMs=performance.now()-queryStart;
 geometry.dispose();material.dispose();map?.dispose();
 return {triangles:segments*segments*2,material:cutout?'alpha-cutout-uv2':'opaque',captureMs:+captureMs.toFixed(1),firstQueryMs:+firstQueryMs.toFixed(1),queries:1000,queriesMs:+queriesMs.toFixed(1),visible,retainedHeapMiB:+((retained.heapUsed-before.heapUsed)/1048576).toFixed(2),retainedArrayBuffersMiB:+((retained.arrayBuffers-before.arrayBuffers)/1048576).toFixed(2)};
}
if(process.argv[2]==='--case'){console.log(JSON.stringify(run(Number(process.argv[3]),process.argv[4]==='true')));process.exit(0);}
const results=[];for(const segments of [50,100,200])for(const cutout of [false,true]){const child=spawnSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--case',String(segments),String(cutout)],{encoding:'utf8'});if(child.status!==0)throw Error(child.stderr||'Benchmark child failed');results.push(JSON.parse(child.stdout));}
console.log(JSON.stringify({node:process.version,gcAvailable:typeof globalThis.gc==='function',scope:'Each case in a fresh process. Synthetic planes with four UV channels; CPU snapshot, first query including BVH build, then 1000 rays. Memory deltas include the source fixture. No rendering, file loading, skinning or manual quality acceptance.',results},null,2));
