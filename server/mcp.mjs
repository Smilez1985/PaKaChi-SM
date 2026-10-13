import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createBridge } from './bridge.mjs';

const bridge = createBridge({token: process.env.PAKACHI_TOKEN, port: Number(process.env.PAKACHI_PORT ?? 8765)});
bridge.server.on('error', error => { console.error(`PaKaChi-Brücke: ${error.message}`); process.exit(1); });
const server = new McpServer({name:'pakachi-sm', version:'0.2.0'});
const schemas = {
  list_avatars: {},
  get_avatar_capabilities: { avatar: z.string().optional() },
  list_moves: { avatar: z.string().optional() },
  get_state: {},
  set_state: { state: z.enum(['idle','talking','thinking','working','waiting','review','error','sleeping']), avatar: z.string().optional() },
  play_move: { move: z.string().min(1).max(100), avatar: z.string().optional() },
};
const descriptions = {
  list_avatars: 'Avatare im geöffneten Model Zoo auflisten. Auswahl erfolgt im Player.',
  get_avatar_capabilities: 'Tatsächlich geladene Fähigkeiten des ausgewählten Avatars abfragen.',
  list_moves: 'Tatsächlich verfügbare Moves des ausgewählten Avatars auflisten.',
  get_state: 'Aktiven Avatar und dauerhaften Zustand abfragen.',
  set_state: 'Unterstützten dauerhaften Zustand des ausgewählten Avatars setzen.',
  play_move: 'Gespeicherten Move des ausgewählten Avatars starten; danach Rückkehr zum aktiven Zustand.',
};
for (const [name, schema] of Object.entries(schemas)) {
  server.registerTool(name, { description: descriptions[name], inputSchema: schema,
    annotations: {readOnlyHint: !['set_state','play_move'].includes(name), destructiveHint:false, openWorldHint:false} }, async args => {
    try { return {content:[{type:'text', text:JSON.stringify(await bridge.request(name, args))}]}; }
    catch (error) { return {isError:true, content:[{type:'text', text:error.message}]}; }
  });
}
await server.connect(new StdioServerTransport());
const shutdown = async () => { await bridge.close(); await server.close(); };
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
process.stdin.once('end', () => void shutdown());
