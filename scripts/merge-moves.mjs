import {open,realpath,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname,basename,join,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {parseMoveLibrary} from '../src/move-library.ts';
import {parseMoveFile,MAX_MOVE_FILE} from '../src/move-file.ts';
const MAX_TOTAL=64*1024*1024,MAX_CATALOG=256*1024;
function contained(root,path){const r=relative(root,path);return r===''||(!r.split(/[\\/]/).includes('..')&&!isAbsolute(r));}
async function read(root,path,limit){
 const actual=await realpath(join(root,path));if(!contained(root,actual))throw Error('Quelldatei liegt außerhalb der Sammlung: '+path);
 const file=await open(actual,'r');
 try{const info=await file.stat();if(!info.isFile()||info.size>limit)throw Error('Datei ist zu groß oder keine reguläre Datei: '+path);
  const parts=[];let size=0;while(true){const chunk=Buffer.alloc(Math.min(1024*1024,limit-size+1)),{bytesRead}=await file.read(chunk);if(!bytesRead)break;size+=bytesRead;if(size>limit)throw Error('Datei ist zu groß: '+path);parts.push(chunk.subarray(0,bytesRead));}return Buffer.concat(parts,size);
 }finally{await file.close();}
}
const json=bytes=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
export async function mergeMoves({base,package:incoming,output}){
 if(!base||!incoming||!output)throw Error('Erforderlich: --base SAMMLUNG --package PAKET --output NEUER-ORDNER');
 const roots=await Promise.all([realpath(resolve(base)),realpath(resolve(incoming))]);
 const destination=join(await realpath(dirname(resolve(output))),basename(resolve(output)));
 if(roots.some(root=>contained(root,destination)))throw Error('Ausgabe muss außerhalb der Quellordner liegen.');
 const catalogs=await Promise.all(roots.map(async root=>parseMoveLibrary(json(await read(root,'moves/catalog.json',MAX_CATALOG)))));
 const moves=catalogs.flat();parseMoveLibrary({schemaVersion:1,moves});
 const files=[];let bytes=0;
 for(let i=0;i<catalogs.length;i++)for(const item of catalogs[i]){
  const content=await read(roots[i],item.file,Math.min(MAX_MOVE_FILE,MAX_TOTAL-bytes));
  const file=parseMoveFile(json(content));if(file.move.id!==item.id)throw Error('Move-ID passt nicht zum Katalog: '+item.file);
  bytes+=content.length;files.push({path:item.file,content});
 }
 const catalog=Buffer.from(JSON.stringify({schemaVersion:1,moves},null,2)+'\n');if(catalog.length>MAX_CATALOG)throw Error('Katalog ist größer als 256 KiB.');
 const report={format:'pakachi-moves-merge',version:1,createdAt:new Date().toISOString(),moves:moves.map(({id,name})=>({id,name})),bytes,files:[...files,{path:'moves/catalog.json',content:catalog}].map(({path,content})=>({path,bytes:content.length,sha256:createHash('sha256').update(content).digest('hex')}))};
 // All validation completes before creation. A write failure can leave a new partial output.
 await mkdir(destination);await mkdir(join(destination,'moves'));
 for(const file of files)await writeFile(join(destination,file.path),file.content,{flag:'wx'});
 await writeFile(join(destination,'moves/catalog.json'),catalog,{flag:'wx'});
 await writeFile(join(destination,'merge-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 await writeFile(join(destination,'README.txt'),'PaKaChi-SM Move-Sammlung: nur moves/ und Prüfbericht, kein vollständiger Player.\nKeine automatische Veröffentlichung. Die Dateien wurden strukturell geprüft und bytegenau kopiert. Kompatibilität wird erst beim Studio-Import mit dem tatsächlichen Modell geprüft.\nVor Übernahme die Bewegungen im Player prüfen; übrige public-Dateien erhalten.\n',{flag:'wx'});
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const {values}=parseArgs({options:{base:{type:'string'},package:{type:'string'},output:{type:'string'}}});const result=await mergeMoves(values);console.log(`${result.moves.length} Moves zusammengeführt: ${resolve(values.output)}`);}catch(error){console.error('Zusammenführung fehlgeschlagen: '+(error instanceof Error?error.message:String(error)));process.exitCode=1;}}
