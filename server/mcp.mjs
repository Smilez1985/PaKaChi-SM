import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {registerPlayerTools} from './player-tools.mjs';
import { createBridge } from './bridge.mjs';

const bridge = createBridge({token: process.env.PAKACHI_TOKEN, port: Number(process.env.PAKACHI_PORT ?? 8765)});
bridge.server.on('error', error => { console.error(`PaKaChi-Brücke: ${error.message}`); process.exit(1); });
const server = new McpServer({name:'pakachi-sm', version:'0.12.0'});
registerPlayerTools(server,(method,args)=>bridge.request(method,args));
await server.connect(new StdioServerTransport());
const shutdown = async () => { await bridge.close(); await server.close(); };
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
process.stdin.once('end', () => void shutdown());
