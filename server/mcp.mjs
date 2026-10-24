import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createBridge } from './bridge.mjs';

const bridge = createBridge({token: process.env.PAKACHI_TOKEN, port: Number(process.env.PAKACHI_PORT ?? 8765)});
bridge.server.on('error', error => { console.error(`PaKaChi-Brücke: ${error.message}`); process.exit(1); });
const server = new McpServer({name:'pakachi-sm', version:'0.12.0'});
const studioActions=['set_mode','add_point','update_point','delete_point','insert_bone','delete_bone','connect_points','disconnect_points','save_pose','apply_pose','replace_pose','create_move','update_move','update_moves','undo','redo'];
const studioCommand=z.object({session:z.string().max(100),expectedRevision:z.number().int().nonnegative(),action:z.enum(studioActions),mode:z.enum(['pose','rig']).optional(),id:z.string().max(100).optional(),target:z.string().max(100).optional(),name:z.string().min(1).max(100).optional(),position:z.array(z.number().min(-100).max(100)).length(3).optional(),rotation:z.array(z.number().min(-1).max(1)).length(4).optional(),bendLimit:z.object({min:z.number().min(0).max(175),max:z.number().min(0).max(175)}).strict().nullable().optional(),scale:z.number().min(.1).max(5).optional(),ratio:z.number().min(.1).max(.9).optional(),size:z.number().min(.003).max(.15).optional(),radius:z.number().min(.005).max(.6).optional(),mesh:z.number().int().nonnegative().optional(),seconds:z.number().min(.1).max(30).optional(),loop:z.boolean().optional(),poses:z.array(z.string().max(100)).min(2).max(100).optional(),updates:z.array(z.object({id:z.string().min(1).max(100),poses:z.array(z.string().min(1).max(100)).min(2).max(100)}).strict()).min(1).max(8).optional()}).strict();
const schemas = {
  get_studio:{section:z.enum(['info','points','poses','moves']).optional(),offset:z.number().int().nonnegative().optional(),limit:z.number().int().min(1).max(32).optional()},
  edit_studio:{command:studioCommand},
  list_avatars: {},
  get_avatar_capabilities: { avatar: z.string().optional() },
  list_moves: { avatar: z.string().optional() },
  get_state: {},
  set_state: { state: z.enum(['idle','talking','thinking','working','waiting','review','error','sleeping']), avatar: z.string().optional() },
  play_move: { move: z.string().min(1).max(100), avatar: z.string().optional() },
};
const descriptions = {
  get_studio:'Studio-Sitzung, Revision, Modus und Freigabe abfragen; points/poses/moves seitenweise bis 32 Elemente. nextOffset beachten. Keine Modellbytes. Positionen sind normierte Weltkoordinaten, Rotation Quaternion [x,y,z,w].',
  edit_studio:'Freigegebenes geöffnetes Studio bearbeiten. session und expectedRevision aus get_studio verwenden. set_mode: mode=pose/rig; add_point: position, optional name/mesh/size/radius; update_point: id, optionale name/position/rotation/scale/size/radius (scale nur $figure, 0.1–5); delete_point: id (nur Griff); insert_bone: id des Kindknochens, optional ratio 0.1–0.9 (Standard 0.5), vom Elternknochen zum Kind gemessen; fügt dort echten Knochen ein; delete_bone: id, entfernt echten Knochen und überträgt Kinder/Gewichte zum Elternknochen. Beide nur Rig-Modus, zuerst points lesen; Posen danach prüfen, Undo möglich. Wurzeln, skalierte Knochen und Anbauteile geschützt; connect_points/disconnect_points: id,target; save_pose: optional name,seconds; apply_pose/replace_pose: id; create_move: id,name,poses,optional loop; update_move: id,poses (vollständige Folge mit 2–100 vorhandenen Posen, Wiederholungen erlaubt, nur Posenmodus; vorher get_studio section=moves lesen); update_moves: updates=[{id,poses}], 1–8 verschiedene Moves, insgesamt höchstens 200 Posenverweise, vollständige Prüfung vor gemeinsamer Änderung und ein Undo-Schritt; undo/redo. $figure bezeichnet die ganze Figur. bendLimit nur an Knochen im Rig-Modus: {min,max} in Grad 0–175, min<=max; null entfernt die Grenze. Gilt nur für Zweiglied-IK-Ziehen. Keine Dateizugriffe. Bei Konflikten/Timeout erneut get_studio abfragen.', 
  list_avatars: 'Avatare im geöffneten Model Zoo auflisten. Auswahl erfolgt im Player.',
  get_avatar_capabilities: 'Tatsächlich geladene Fähigkeiten des ausgewählten Avatars abfragen.',
  list_moves: 'Tatsächlich verfügbare Moves des ausgewählten Avatars auflisten.',
  get_state: 'Aktiven Avatar und dauerhaften Zustand abfragen.',
  set_state: 'Unterstützten dauerhaften Zustand des ausgewählten Avatars setzen.',
  play_move: 'Gespeicherten Move des ausgewählten Avatars starten; danach Rückkehr zum aktiven Zustand.',
};
for (const [name, schema] of Object.entries(schemas)) {
  server.registerTool(name, { description: descriptions[name], inputSchema: schema,
    annotations: {readOnlyHint: !['set_state','play_move','edit_studio'].includes(name), destructiveHint:false, openWorldHint:false} }, async args => {
    try { return {content:[{type:'text', text:JSON.stringify(await bridge.request(name, args))}]}; }
    catch (error) { return {isError:true, content:[{type:'text', text:error.message}]}; }
  });
}
await server.connect(new StdioServerTransport());
const shutdown = async () => { await bridge.close(); await server.close(); };
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
process.stdin.once('end', () => void shutdown());
