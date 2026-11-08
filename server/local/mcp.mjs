import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {registerPlayerTools} from '../player-tools.mjs';
import {jobSchema} from './jobs.mjs';

export function localMcpServer({settings,assets,jobs,bridge,status,version}){
 const server=new McpServer({name:'pakachi-local-workspace',version},{instructions:'PaKaChi-SM local workspace. First call local_get_status and local_list_assets. Use asset IDs, not OS paths. Long work: local_start_job returns immediately; poll local_get_job and read its output IDs with local_read_asset chunks. Blender/Python/ACP require the operator to enable script execution. Programs run with the local user rights, not an OS sandbox. MCP exposes no tunnel keys or administrator settings. Studio edits also require its existing session/revision and UI grant. Never equate a generated model or closed mesh with approved character quality.'});
 registerPlayerTools(server,(method,args)=>{if(!settings.value.enabled)throw Error('Lokale Werkzeuge sind aus.');return bridge.request(method,args);});
 const register=(name,description,inputSchema,write,fn)=>server.registerTool(name,{description,inputSchema,annotations:{readOnlyHint:!write,destructiveHint:write,openWorldHint:write}},async(args,extra)=>{
  try{if(!settings.value.enabled)throw Error('Lokale Werkzeuge sind aus.');const value=await fn(args,extra);return {content:[{type:'text',text:JSON.stringify(value)}],structuredContent:value};}
  catch(error){return {isError:true,content:[{type:'text',text:error.message}]};}
 });
 register('local_get_status','Lokalen Arbeitsplatz, freigegebene Fähigkeiten und Hardware abfragen; keine Schlüssel.',{},false,async()=>status());
 register('local_list_assets','Dateien im PaKaChi-Arbeitsbereich auflisten. IDs für Folgeaufrufe verwenden.',{},false,async()=>({assets:assets.list()}));
 register('local_read_asset','Datei in Base64-Blöcken von höchstens 384 KiB lesen. nextOffset bis null verfolgen; sha256 prüfen.',{id:z.string().uuid(),offset:z.number().int().nonnegative().default(0),length:z.number().int().min(1).max(384*1024).default(384*1024)},false,async a=>assets.read(a.id,a.offset,a.length));
 register('local_upload_asset','Datei in Base64-Blöcken hochladen. Erster Block offset=0; uploadId/nextOffset übernehmen. Letzter Block final=true ergibt neue unveränderliche Datei-ID; maximal 50 MiB.',{name:z.string().max(180),data:z.string().max(524296),uploadId:z.string().uuid().optional(),offset:z.number().int().nonnegative().default(0),final:z.boolean().default(false)},true,async a=>assets.upload(a));
 register('local_write_text_asset','Neue Python-, JSON- oder Textdatei erstellen. Bestehende Dateien werden nicht überschrieben.',{name:z.string().max(180).regex(/\.(py|json|txt)$/),text:z.string().min(1).max(262144)},true,async a=>({asset:await assets.add(a.name,Buffer.from(a.text))}));
 register('local_start_job','Blender-/Python-Skript, Bild-zu-3D, Modellprüfung oder lokalen ACP-Agenten starten. Sofortige Auftrags-ID; local_get_job pollen. Skripte erhalten PAKACHI_JOB_INPUTS (JSON: ID→Pfad) und PAKACHI_JOB_OUTPUT. Ergebnisse dort ablegen. Skript/inputs/image sind Datei-IDs. Ausführbare Programme legt ausschließlich der lokale Benutzer fest. requestId verhindert doppelte Starts bei Wiederholung.',jobSchema.shape,true,async(a,extra)=>jobs.start(a,{parent:extra.authInfo?.clientId?.startsWith('acp:')?extra.authInfo.clientId.slice(4):null}));
 register('local_get_job','Status, begrenztes Protokoll und Ergebnis-Datei-IDs eines Auftrags abfragen.',{id:z.string().uuid()},false,async a=>jobs.get(a.id));
 register('local_list_jobs','Letzte lokale Aufträge mit Status und Ergebnissen auflisten.',{},false,async()=>({jobs:jobs.list()}));
 register('local_cancel_job','Laufenden Auftrag und zugehörige ACP-Unteraufträge abbrechen.',{id:z.string().uuid()},true,async a=>jobs.cancel(a.id));
 return server;
}
