/** ACP/local MCP clients share the same application-owned HTTP server and tools. */
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {ListToolsRequestSchema,CallToolRequestSchema} from '@modelcontextprotocol/sdk/types.js';
import {parseArgs} from 'node:util';

const {values}=parseArgs({options:{url:{type:'string',default:'http://127.0.0.1:8787/mcp'}}});
const url=new URL(values.url),token=process.env.PAKACHI_MCP_TOKEN;
if(url.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash||!token)throw Error('Lokale MCP-Adresse und PAKACHI_MCP_TOKEN erforderlich.');
const client=new Client({name:'pakachi-local-stdio',version:'0.87.0'}),server=new Server({name:'pakachi-local-workspace',version:'0.87.0'},{capabilities:{tools:{}}});
await client.connect(new StreamableHTTPClientTransport(url,{requestInit:{headers:{Authorization:'Bearer '+token}}}));
server.setRequestHandler(ListToolsRequestSchema,()=>client.listTools());server.setRequestHandler(CallToolRequestSchema,request=>client.callTool(request.params));
await server.connect(new StdioServerTransport());
let closing=false;const close=async()=>{if(closing)return;closing=true;await client.close();await server.close();};
for(const event of ['SIGINT','SIGTERM'])process.once(event,()=>void close());process.stdin.once('end',()=>void close());
