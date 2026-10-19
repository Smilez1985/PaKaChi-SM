/** Combine two static Model Zoo roots into a new folder. Never modify the sources. */
import {open,realpath,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname,basename,join,posix,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {parseCatalog} from '../src/catalog.ts';
import {parseProject} from '../src/studio-data.ts';
const MiB=1024*1024,MAX_TOTAL=256*MiB;
// Use path components, not string prefixes (e.g. /zoo and /zoo-other).
function contained(root,path){const r=relative(root,path);return r===''||(!r.split(/[\\/]/).includes('..')&&!isAbsolute(r));}
async function readBounded(root,path,limit){
 const actual=await realpath(join(root,path));if(!contained(root,actual))throw Error('Quelldatei liegt außerhalb des Paketordners: '+path);
 const file=await open(actual,'r');
 try{const info=await file.stat();if(!info.isFile()||info.size>limit)throw Error('Datei fehlt oder ist zu groß: '+path);
  const parts=[];let total=0;while(true){const chunk=Buffer.alloc(Math.min(MiB,limit-total+1)),{bytesRead}=await file.read(chunk);if(!bytesRead)break;total+=bytesRead;if(total>limit)throw Error('Datei ist zu groß: '+path);parts.push(chunk.subarray(0,bytesRead));}return Buffer.concat(parts,total);
 }finally{await file.close();}
}
function checkModel(bytes){
 if(bytes.byteLength>50*MiB)throw Error('Eingebettetes Modell ist größer als 50 MiB.');let json;
 if(bytes.length>=4&&bytes.readUInt32LE(0)===0x46546c67){
  if(bytes.length<20||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length||bytes.readUInt32LE(16)!==0x4e4f534a||bytes.readUInt32LE(12)>bytes.length-20)throw Error('Ungültiger GLB-Header.');
  json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 }else json=JSON.parse(bytes.toString('utf8'));
 if(json?.asset?.version!=='2.0')throw Error('glTF 2.0 erforderlich.');
 function visit(value){if(!value||typeof value!=='object')return;for(const [key,item] of Object.entries(value)){if(key==='uri'&&(typeof item!=='string'||!item.startsWith('data:')))throw Error('Modell enthält externe Ressourcen. Eigenständiges GLB/glTF exportieren.');visit(item);}}
 visit(json);
}
export async function mergeZoo({base,package:incoming,output}){
 if(!base||!incoming||!output)throw Error('Erforderlich: --base PUBLIC-ORDNER --package PAKET-ORDNER --output NEUER-ORDNER');
 const roots=await Promise.all([realpath(resolve(base)),realpath(resolve(incoming))]);
 const destination=join(await realpath(dirname(resolve(output))),basename(resolve(output)));
 if(roots.some(root=>contained(root,destination)))throw Error('Ausgabe muss außerhalb der Quellordner liegen.');
 const catalogs=await Promise.all(roots.map(async root=>parseCatalog(JSON.parse((await readBounded(root,'model-zoo/catalog.json',MiB)).toString('utf8')))));
 const avatars=catalogs.flat();if(avatars.length>100)throw Error('Höchstens 100 Katalogeinträge pro Zusammenführung.');parseCatalog({schemaVersion:1,avatars});
 const paths=new Set(),sources=[];
 for(let i=0;i<catalogs.length;i++)for(const avatar of catalogs[i]){
  if(['pakachi-original','local-import'].includes(avatar.id)||avatar.id.startsWith('saved-'))throw Error('Reservierte Katalog-ID: '+avatar.id);
  const path=posix.normalize(avatar.project||avatar.model);if(paths.has(path))throw Error('Doppelter Dateipfad: '+path);paths.add(path);if(avatar.project)avatar.project=path;else avatar.model=path;sources.push({root:roots[i],avatar,path});
 }
 // Validate and snapshot every source before creating the destination.
 const files=[];let total=0;
 for(const {root,avatar,path} of sources){
  const bytes=await readBounded(root,path,Math.min(avatar.project?80*MiB:50*MiB,MAX_TOTAL-total));
  if(avatar.project){const project=parseProject(JSON.parse(bytes.toString('utf8')));if(project.avatar.id!==avatar.id)throw Error('Projekt-ID passt nicht zum Katalog: '+path);checkModel(Buffer.from(project.model,'base64'));}else checkModel(bytes);
  total+=bytes.length;files.push({path,bytes});
 }
 const catalog=Buffer.from(JSON.stringify({schemaVersion:1,avatars},null,2)+'\n');if(catalog.length>MiB)throw Error('Zusammengeführter Katalog ist größer als 1 MiB.');
 await mkdir(destination);await mkdir(join(destination,'model-zoo'));
 for(const file of files){await mkdir(dirname(join(destination,file.path)),{recursive:true});await writeFile(join(destination,file.path),file.bytes,{flag:'wx'});}
 await writeFile(join(destination,'model-zoo/catalog.json'),catalog,{flag:'wx'});
 const report={format:'pakachi-zoo-merge',version:1,createdAt:new Date().toISOString(),avatars:avatars.map(a=>({id:a.id,name:a.name})),bytes:total,files:[...files,{path:'model-zoo/catalog.json',bytes:catalog}].map(f=>({path:f.path,bytes:f.bytes.length,sha256:createHash('sha256').update(f.bytes).digest('hex')}))};
 await writeFile(join(destination,'merge-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 await writeFile(join(destination,'README.txt'),'Zusammengeführter Model Zoo für PaKaChi-SM ab 0.29.0. Noch nicht veröffentlicht.\nQuellordner bleiben unverändert. Enthält nur katalogreferenzierte, eigenständige Modelle/Projekte, keinen vollständigen Player und keine weiteren Dateien aus public.\nmerge-report.json enthält IDs, Dateipfade, Größen und Prüfsummen. Geometrie, Rig, Texturen und Moves im Player prüfen, bevor der model-zoo-Ordner bewusst übernommen/veröffentlicht wird.\n',{flag:'wx'});
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const {values}=parseArgs({options:{base:{type:'string'},package:{type:'string'},output:{type:'string'}}});const result=await mergeZoo(values);console.log(`${result.avatars.length} Avatare zusammengeführt: ${resolve(values.output)}`);}
 catch(error){console.error('Zusammenführung fehlgeschlagen: '+(error instanceof Error?error.message:String(error)));process.exitCode=1;}
}
