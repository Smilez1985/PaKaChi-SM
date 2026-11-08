import {createInterface} from 'node:readline';
import {isAbsolute} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
let session,mcp,permission;
const send=v=>process.stdout.write(JSON.stringify(v)+'\n');
createInterface({input:process.stdin}).on('line',line=>{void(async()=>{
 const m=JSON.parse(line);
 if(m.method==='initialize')return send({jsonrpc:'2.0',id:m.id,result:{protocolVersion:1,agentCapabilities:{},agentInfo:{name:'protocol-test-agent',version:'1'},authMethods:[]}});
 if(m.method==='session/new'){
  if(!isAbsolute(m.params.cwd)||!m.params.mcpServers?.[0]?.env?.some(e=>e.name==='PAKACHI_MCP_TOKEN'))throw Error('ACP setup missing');
  session='test-session';mcp=m.params.mcpServers[0];return send({jsonrpc:'2.0',id:m.id,result:{sessionId:session}});
 }
 if(m.method==='session/prompt'){
  if(m.params.prompt[0].text==='streamed-output'){
   const update=text=>({jsonrpc:'2.0',method:'session/update',params:{sessionId:session,update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text}}}});
   const bytes=Buffer.from(JSON.stringify(update('Grüße 🐼 '+process.env.PAKACHI_TEST_SECRET.slice(0,8)))+'\n'),cut=bytes.indexOf(Buffer.from('ü'))+1;process.stdout.write(bytes.subarray(0,cut));await new Promise(resolve=>setTimeout(resolve,25));process.stdout.write(bytes.subarray(cut));send(update(process.env.PAKACHI_TEST_SECRET.slice(8)));return send({jsonrpc:'2.0',id:m.id,result:{stopReason:'end_turn'}});
  }
  permission=m.id;return send({jsonrpc:'2.0',id:'permission',method:'session/request_permission',params:{sessionId:session,toolCall:{title:'Read PaKaChi MCP status',toolCallId:'test-call'},options:[{optionId:'once',name:'Allow once',kind:'allow_once'},{optionId:'reject',name:'Reject',kind:'reject_once'}]}});
 }
 if(m.id==='permission'&&m.result){
  if(m.result.outcome.optionId==='once'){
   const client=new Client({name:'acp-fixture',version:'1'}),transport=new StdioClientTransport({command:mcp.command,args:mcp.args,env:{...process.env,...Object.fromEntries(mcp.env.map(e=>[e.name,e.value]))},stderr:'pipe'});
   await client.connect(transport);const list=await client.listTools();const response=await client.callTool({name:'local_get_status',arguments:{}});await client.close();
   if(list.tools.length!==17||JSON.parse(response.content[0].text).enabled!==true)throw Error('MCP delegation failed');
   send({jsonrpc:'2.0',method:'session/update',params:{sessionId:session,update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text:'ACP and live MCP delegation succeeded.'}}}});
  }
  return send({jsonrpc:'2.0',id:permission,result:{stopReason:'end_turn'}});
 }
})().catch(error=>{process.stderr.write(error.message);process.exitCode=1;});});
