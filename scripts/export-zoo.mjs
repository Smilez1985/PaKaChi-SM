/** Export one project into a new static Model Zoo package; never publish or overwrite. */
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {parseProject} from '../src/studio-data.ts';
import {parseCatalog} from '../src/catalog.ts';
const MAX=80*1024*1024;
const transform=t=>({position:t.position,rotation:t.rotation,...(t.scale===undefined?{}:{scale:t.scale})});
const values=map=>Object.fromEntries(Object.entries(map).map(([id,t])=>[id,transform(t)]));
export function zooPackage(input,id){
 if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)||['pakachi-original','local-import'].includes(id)||id.startsWith('saved-'))throw Error('Ungültige oder reservierte Katalog-ID.');
 const p=parseProject(input),a=p.avatar,d=p.studio;
 // Explicit allowlists exclude unrelated fields accepted by older project readers.
 const project={format:p.format,version:p.version,model:p.model,avatar:{id,name:a.name,description:a.description||'Eigenes Studio-Projekt',moves:a.moves.map(({id,name,clip,loop})=>({id,name,clip,loop})),...(a.defaultMove?{defaultMove:a.defaultMove}:{}),...(a.states?{states:a.states}:{})},studio:{
  ...(d.weightTransfers?{weightTransfers:d.weightTransfers.map(({from,to,amount,after,region})=>({from,to,amount,after,...(region?{region:{center:[...region.center],radius:region.radius,...(region.view?{view:{...(region.view.alpha?{alpha:true}:{}),...(region.view.materials?{materials:true}:{}),eye:[...region.view.eye],projection:[...region.view.projection]}}:{})}}:{})}))}:{}),
  ...(d.boneReparents?{boneReparents:d.boneReparents.map(({bone,parent,after})=>({bone,parent,after}))}:{}),
  ...(d.boneDeletions?{boneDeletions:[...d.boneDeletions]}:{}),
  ...(d.boneInsertions?{boneInsertions:d.boneInsertions.map(({child,ratio,parent,afterDeletions})=>({...((parent===undefined)?{child,ratio}:{parent}),...(afterDeletions===undefined?{}:{afterDeletions})}))}:{}),
  points:d.points.map(({id,name,kind,bone,mesh,rest,size,radius,bendLimit})=>({id,name,kind,...(bone===undefined?{}:{bone}),...(mesh===undefined?{}:{mesh}),rest,size,radius,...(bendLimit===undefined?{}:{bendLimit:{min:bendLimit.min,max:bendLimit.max}})})),links:d.links,boneRest:d.boneRest.map(transform),
  poses:d.poses.map(({id,name,seconds,values:map,review})=>({id,name,seconds,values:values(map),...(review?{review}:{} )})),moves:d.moves.map(({id,name,loop,poses})=>({id,name,loop,poses})),...(d.draft?{draft:values(d.draft)}:{}),
 }};
 parseProject(project);const path=`model-zoo/projects/${id}.pakachi.json`;
 const catalog={schemaVersion:1,avatars:[{id,name:project.avatar.name,description:project.avatar.description,rigVersion:'studio-1',project:path,moves:project.avatar.moves,...(a.defaultMove?{defaultMove:a.defaultMove}:{}),...(a.states?{states:a.states}:{})}]};parseCatalog(catalog);
 const json=JSON.stringify(project);if(Buffer.byteLength(json)>MAX)throw Error('Projekt ist größer als 80 MiB.');return {project:json,catalog,path};
}
export async function exportZoo({project:source,id,output}){
 if(!source||!id||!output)throw Error('Erforderlich: --project DATEI --id AVATAR-ID --output NEUER-ORDNER');
 if((await stat(source)).size>MAX)throw Error('Projekt ist größer als 80 MiB.');const bytes=await readFile(source);if(bytes.byteLength>MAX)throw Error('Projekt ist größer als 80 MiB.');
 const pack=zooPackage(JSON.parse(bytes.toString('utf8')),id),destination=resolve(output);
 // Exclusive directory creation is the no-overwrite gate; do not remove unrelated files on failure.
 await mkdir(destination);await mkdir(join(destination,'model-zoo','projects'),{recursive:true});
 await writeFile(join(destination,pack.path),pack.project,{flag:'wx'});
 await writeFile(join(destination,'model-zoo','catalog.json'),JSON.stringify(pack.catalog,null,2)+'\n',{flag:'wx'});
 await writeFile(join(destination,'README.txt'),'PaKaChi-SM ab 0.29.0. Neues Katalogprojekt, noch nicht veröffentlicht.\nProjektdatei nach public/model-zoo/projects kopieren; Eintrag aus catalog.json nach Prüfung eindeutiger ID in den vorhandenen Katalog übernehmen. Nicht den bestehenden Katalog ersetzen.\nModellgeometrie, Texturen, Rig und Bewegungen im Browser prüfen. Nur eigene bzw. zur Weitergabe freigegebene Inhalte veröffentlichen.\n',{flag:'wx'});
 return destination;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const {values:args}=parseArgs({options:{project:{type:'string'},id:{type:'string'},output:{type:'string'}}});console.log(await exportZoo(args));}
 catch(error){console.error('Export fehlgeschlagen: '+(error instanceof Error?error.message:String(error)));process.exitCode=1;}
}
