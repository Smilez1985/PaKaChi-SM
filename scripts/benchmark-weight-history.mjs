/** Diagnostic replay benchmark for the bundled Mika model; no pass/fail timing threshold. */
import {readFile} from 'node:fs/promises';
import {parseModel,disposeModel} from '../src/viewer.ts';
import {StudioRig} from '../src/studio-rig.ts';
if(typeof globalThis.ProgressEvent==='undefined')globalThis.ProgressEvent=class extends Event{constructor(type,options={}){super(type);Object.assign(this,options);}};
const bytes=await readFile(new URL('../public/model-zoo/mika/model.gltf',import.meta.url));
const {scene}=await parseModel(Uint8Array.from(bytes).buffer),rig=new StudioRig(scene);
try{
 const source=rig.data.points.find(p=>p.name==='Root'),target=rig.data.points.find(p=>p.name==='Neck');
 rig.data.weightTransfers=Array.from({length:256},()=>({from:source.bone,to:target.bone,amount:.001,after:0,region:{center:[...source.rest],radius:2}}));
 const resetMs=[];for(let i=0;i<3;i++){const started=performance.now();rig.reset();resetMs.push(Math.round(performance.now()-started));}
 console.log(JSON.stringify({model:'mika',transfers:256,resetMs,medianMs:[...resetMs].sort((a,b)=>a-b)[1],scope:'Rig reset only; excludes file import, UI and rendering'},null,2));
}finally{rig.dispose();disposeModel(scene);}
