import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {connectAsync} from 'mqtt';
import {PlayerMQTT} from '../../src/mqtt-agent.ts';
import {StateMachine} from '../../src/control.ts';
async function port(){const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=(s.address() as {port:number}).port;await new Promise<void>(r=>s.close(()=>r()));return p;}
const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms));
test('Python MCP 2.3 -> embedded authenticated aMQTT -> actual PlayerMQTT -> state router -> reply', {timeout:25000},async t=>{
  const tcp=await port(),ws=await port(),token='integration-test-'.repeat(3);
  const transport=new StdioClientTransport({command:process.env.PAKACHI_PYTHON??'python',args:[fileURLToPath(new URL('../../server/python/pakachi_mcp.py',import.meta.url))],env:{...process.env,PAKACHI_TOKEN:token,PAKACHI_MQTT_PORT:String(tcp),PAKACHI_MQTT_WS_PORT:String(ws)},stderr:'pipe'});
  const client=new Client({name:'integration-test',version:'1.0'});t.after(()=>client.close());
  let stderr='';transport.stderr?.on('data',chunk=>stderr+=chunk.toString());
  try{await client.connect(transport);}catch(e){throw new Error(`Python MCP konnte nicht starten: ${stderr}\n${e}`);}
  assert.equal((await client.listTools()).tools.length,6);
  await assert.rejects(connectAsync(`mqtt://127.0.0.1:${tcp}`,{username:'pakachi',password:'wrong',reconnectPeriod:0,connectTimeout:1000}));
  assert.equal((await client.callTool({name:'get_state',arguments:{}})).isError,true);
  let moveCalls=0;const machine=new StateMachine();machine.bind({capability:{id:'test',name:'Test',states:['idle','working'],moves:[{id:'wave',name:'Wave',loop:false}]},setState(){},playMove(){moveCalls++;}},'idle');
  const rpc=(method:string,args:Record<string,unknown>={})=>{if(method==='get_state')return {state:machine.state};if(method==='list_moves')return machine.capability!.moves;if(method==='get_avatar_capabilities')return machine.capability;if(method==='list_avatars')return [{id:'test'}];if(method==='command')return machine.execute(args.payload);return machine.execute(method==='set_state'?{state:args.state}:{move:args.move});};
  const player=new PlayerMQTT(rpc,()=>{},()=>{});t.after(()=>player.disconnect());
  player.connect({url:`ws://127.0.0.1:${ws}/mqtt`,topic:'pakachi/status',username:'pakachi',password:token,rpcEnabled:true});
  await delay(2300);
  const reply=await client.callTool({name:'set_state',arguments:{state:'working'}});assert.notEqual(reply.isError,true,JSON.stringify(reply));assert.equal(machine.state,'working');
  assert.equal((await client.callTool({name:'set_state',arguments:{state:'sleeping'}})).isError,true);assert.equal(machine.state,'working');
  await client.callTool({name:'play_move',arguments:{move:'wave'}});assert.equal(moveCalls,1);
  const mqtt=await connectAsync(`mqtt://127.0.0.1:${tcp}`,{username:'pakachi',password:token,reconnectPeriod:0});t.after(()=>mqtt.endAsync(true));
  mqtt.publish('pakachi/status','idle');await delay(100);assert.equal(machine.state,'idle');
  const request={id:'duplicate-test',method:'play_move',args:{move:'wave'},replyTo:'pakachi/mcp/test/reply',expires:Date.now()+5000};
  mqtt.publish(`pakachi/players/${player.id}/request`,JSON.stringify(request));mqtt.publish(`pakachi/players/${player.id}/request`,JSON.stringify(request));await delay(100);assert.equal(moveCalls,2,'duplicate command must execute only once');
  mqtt.publish(`pakachi/players/${player.id}/request`,JSON.stringify({...request,id:'expired',expires:Date.now()-1000}));await delay(100);assert.equal(moveCalls,2);
  const other=new PlayerMQTT(rpc,()=>{},()=>{});t.after(()=>other.disconnect());other.connect({url:`ws://127.0.0.1:${ws}`,topic:'pakachi/other-status',username:'pakachi',password:token,rpcEnabled:true});await delay(2300);
  assert.equal((await client.callTool({name:'play_move',arguments:{move:'wave'}})).isError,true,'ambiguous players must not receive commands');assert.equal(moveCalls,2);
  other.disconnect();await delay(100);player.disconnect();await delay(100);mqtt.publish('pakachi/status','working');await delay(100);assert.equal(machine.state,'idle','opt-out must prevent commands');
});
