import {open,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {parseProject} from '../src/studio-data.ts';
import {exportMoveFile} from '../src/move-file.ts';
import {parseMoveLibrary} from '../src/move-library.ts';
/** Export every Studio move from one project into a new deployment-relative collection. */
export async function exportMoves({project,output}){
 if(!project||!output)throw Error('Erforderlich: --project DATEI --output NEUER-ORDNER');
 const source=await open(resolve(project),'r');let bytes;
 try{const stat=await source.stat();if(!stat.isFile()||stat.size>80*1024*1024)throw Error('Projekt ist größer als 80 MiB oder keine Datei.');
  bytes=Buffer.alloc(stat.size+1);let total=0;while(total<bytes.length){const {bytesRead}=await source.read(bytes,total,bytes.length-total,total);if(!bytesRead)break;total+=bytesRead;}if(total!==stat.size)throw Error('Projekt wurde beim Lesen verändert.');bytes=bytes.subarray(0,total);
 }finally{await source.close();}
 const parsed=parseProject(JSON.parse(bytes.toString('utf8')));if(!parsed.studio.moves.length)throw Error('Projekt enthält keine eigenen Moves.');
 const files=[],moves=[];let total=0;
 for(const move of parsed.studio.moves){const file='moves/'+move.id+'.pakachi-move.json',content=JSON.stringify(await exportMoveFile(parsed,move.id));total+=Buffer.byteLength(content);if(total>64*1024*1024)throw Error('Move-Sammlung ist größer als 64 MiB.');files.push({file,content});moves.push({id:move.id,name:move.name,file});}
 const catalog={schemaVersion:1,moves};parseMoveLibrary(catalog);
 const destination=resolve(output);await mkdir(destination);await mkdir(join(destination,'moves'));
 for(const {file,content} of files)await writeFile(join(destination,file),content,{flag:'wx'});
 await writeFile(join(destination,'moves/catalog.json'),JSON.stringify(catalog,null,2)+'\n',{flag:'wx'});
 return catalog;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const {values}=parseArgs({options:{project:{type:'string'},output:{type:'string'}}});const result=await exportMoves(values);console.log(`${result.moves.length} Moves exportiert: ${resolve(values.output)}`);}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}}
