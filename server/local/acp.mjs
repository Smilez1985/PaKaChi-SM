import {randomUUID} from 'node:crypto';
import {StringDecoder} from 'node:string_decoder';
import {launchProcess,redactStream} from './process.mjs';

/** ACP v1 client: hosts a configured agent and supplies PaKaChi through MCP. */
export function createAcpHost({launch=launchProcess}={}){
 const approvals=new Map();
 return {
  approvals:()=>[...approvals].map(([id,a])=>({id,title:a.title,options:a.options})),
  approve(id,option){const a=approvals.get(id);if(!a||!a.options.some(o=>o.optionId===option))throw Error('Ungültige ACP-Freigabe.');approvals.delete(id);a.resolve({outcome:{outcome:'selected',optionId:option}});},
  async run({command,args=[],env={},cwd,prompt,mcp,signal,timeout=1800000,onData=()=>{},secrets=[]}){
   signal.throwIfAborted();const process=launch(command,args,{cwd,env,timeout,secrets});let buffer='',counter=0,sessionId;const requests=new Map();
   const scrub=text=>secrets.filter(Boolean).reduce((s,key)=>s.split(key).join('[redacted]'),String(text));
   const write=message=>{if(!process.child.stdin.destroyed)process.child.stdin.write(JSON.stringify(message)+'\n');};
   const request=(method,params,ms=20000)=>new Promise((resolve,reject)=>{const id=++counter,timer=setTimeout(()=>{requests.delete(id);reject(Error('ACP-Antwortzeit überschritten.'));},ms);requests.set(id,{resolve,reject,timer});write({jsonrpc:'2.0',id,method,params});});
   const cancel=()=>{if(sessionId)write({jsonrpc:'2.0',method:'session/cancel',params:{sessionId}});process.stop();};signal.addEventListener('abort',cancel,{once:true});
   const updates=redactStream(secrets,onData),decoder=new StringDecoder('utf8');
   const errors=redactStream(secrets,onData);process.child.stderr.on('data',data=>errors.write(data));process.child.stderr.once('end',()=>errors.end());
   process.child.stdout.on('data',data=>{
    buffer+=decoder.write(data);if(Buffer.byteLength(buffer)>2*1024*1024){cancel();return;}
    let newline;while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);if(!line.trim())continue;let message;try{message=JSON.parse(line);}catch{cancel();return;}
     if(!message.method&&message.id!==undefined){const r=requests.get(message.id);if(r){requests.delete(message.id);clearTimeout(r.timer);message.error?r.reject(Error(scrub(message.error.message))):r.resolve(message.result);}continue;}
     if(message.method==='session/update'){const u=message.params?.update;if(['agent_message_chunk','user_message_chunk'].includes(u?.sessionUpdate)&&u.content?.type==='text')updates.write(Buffer.from(u.content.text));else if(u?.title)updates.write(Buffer.from(u.title+'\n'));continue;}
     if(message.id===undefined)continue;
     if(message.method==='session/request_permission'&&message.params?.sessionId===sessionId){
      const options=message.params.options?.filter(o=>typeof o.optionId==='string'&&typeof o.name==='string');if(!options?.length||approvals.size>=8){write({jsonrpc:'2.0',id:message.id,result:{outcome:{outcome:'cancelled'}}});continue;}
      const id=randomUUID();new Promise(resolve=>{approvals.set(id,{title:scrub(message.params.toolCall?.title??'ACP-Werkzeugaufruf'),options,resolve,owner:process});}).then(result=>write({jsonrpc:'2.0',id:message.id,result}));
     }else write({jsonrpc:'2.0',id:message.id,error:{code:-32601,message:'Client capability not enabled'}});
    }
   });
   const rejectPending=()=>{for(const r of requests.values()){clearTimeout(r.timer);r.reject(Error('ACP-Agent beendet.'));}requests.clear();};
   const exited=process.done.then(result=>{rejectPending();return result;},error=>{rejectPending();throw error;});exited.catch(()=>{});
   try{
    const initialized=await request('initialize',{protocolVersion:1,clientCapabilities:{fs:{readTextFile:false,writeTextFile:false},terminal:false},clientInfo:{name:'pakachi-sm',version:'0.90.0'}});
    if(initialized.protocolVersion!==1)throw Error('ACP-Protokollversion wird nicht unterstützt.');
    const session=await request('session/new',{cwd,mcpServers:[mcp]});if(typeof session.sessionId!=='string')throw Error('ACP-Sitzung fehlt.');sessionId=session.sessionId;
    const result=await request('session/prompt',{sessionId,prompt:[{type:'text',text:prompt}]},timeout);signal.throwIfAborted();onData('\nACP: '+result.stopReason+'\n');return result;
   }finally{
    updates.end();signal.removeEventListener('abort',cancel);for(const [id,a] of approvals)if(a.owner===process){approvals.delete(id);a.resolve({outcome:{outcome:'cancelled'}});}
    process.stop();await exited.catch(()=>{});for(const r of requests.values()){clearTimeout(r.timer);r.reject(Error('ACP-Sitzung beendet.'));}requests.clear();
   }
  },
 };
}
