import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import WebSocket from 'ws';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

test('real MCP stdio handshake lists tools and round-trips browser commands',async t=>{
 const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
 const token='mcp-integration-test-key-'.repeat(3);
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../server/mcp.mjs',import.meta.url))],env:{...process.env,PAKACHI_TOKEN:token,PAKACHI_PORT:String(port)},stderr:'pipe'});
 const client=new Client({name:'test',version:'1.0.0'});t.after(()=>client.close());await client.connect(transport);
 const names=(await client.listTools()).tools.map(t=>t.name);assert.equal(names.length,8);assert.ok(names.includes('play_move'));
 assert.equal((await client.callTool({name:'get_state',arguments:{}})).isError,true);
 const ws=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://localhost:5173'});t.after(()=>ws.terminate());await once(ws,'open');
 const ready=once(ws,'message');ws.send(JSON.stringify({type:'hello',token}));await ready;
 ws.on('message',raw=>{const m=JSON.parse(raw);ws.send(JSON.stringify({type:'result',id:m.id,result:{method:m.method,state:m.args.state??'idle',command:m.args.command}}));});
 const reply=await client.callTool({name:'set_state',arguments:{state:'working'}});assert.notEqual(reply.isError,true);assert.equal(JSON.parse(reply.content[0].text).state,'working');
 const studioReply=await client.callTool({name:'edit_studio',arguments:{command:{session:'test',expectedRevision:0,action:'set_mode',mode:'rig'}}});assert.notEqual(studioReply.isError,true);assert.equal(JSON.parse(studioReply.content[0].text).command.action,'set_mode');
 for(const bendLimit of [{min:20,max:110},null]){const result=await client.callTool({name:'edit_studio',arguments:{command:{session:'test',expectedRevision:0,action:'update_point',id:'bone-1',bendLimit}}});assert.notEqual(result.isError,true);assert.deepEqual(JSON.parse(result.content[0].text).command.bendLimit,bendLimit);}
 const sequenceCommand={session:'test',expectedRevision:0,action:'update_move',id:'wave',poses:['b','a','b']};const sequenceReply=await client.callTool({name:'edit_studio',arguments:{command:sequenceCommand}});assert.notEqual(sequenceReply.isError,true);assert.deepEqual(JSON.parse(sequenceReply.content[0].text).command,sequenceCommand);
 for(const action of ['insert_bone','delete_bone']){const command={session:'test',expectedRevision:0,action,id:'bone-1',...(action==='insert_bone'?{ratio:.3}:{})};const reply=await client.callTool({name:'edit_studio',arguments:{command}});assert.notEqual(reply.isError,true);assert.deepEqual(JSON.parse(reply.content[0].text).command,command);}
 const batchCommand={session:'test',expectedRevision:0,action:'update_moves',updates:[{id:'wave',poses:['b','a']},{id:'nod',poses:['a','b']}]};const batchReply=await client.callTool({name:'edit_studio',arguments:{command:batchCommand}});assert.notEqual(batchReply.isError,true);assert.deepEqual(JSON.parse(batchReply.content[0].text).command,batchCommand);
 const invalid=await client.callTool({name:'set_state',arguments:{state:'invented'}});assert.equal(invalid.isError,true);
});
