/** Native Messages wire format; no SDK or external source code copied. */
export function anthropicHeaders(token:string):Record<string,string>{
 return {'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true',...(token?{'x-api-key':token}:{})};
}
export function anthropicRequest(model:string,messages:Record<string,unknown>[],tools:{function:{name:string;description:string;parameters:unknown}}[]){
 return {model,system:messages[0].content,messages:messages.slice(1),max_tokens:1024,stream:false,tools:tools.map(t=>({name:t.function.name,description:t.function.description,input_schema:t.function.parameters})),tool_choice:{type:'auto',disable_parallel_tool_use:true}};
}
export function anthropicResponse(raw:any){
 if(raw?.type!=='message'||raw.role!=='assistant'||!Array.isArray(raw.content)||raw.content.length>64)throw new Error('invalid-response');
 if(!['end_turn','tool_use'].includes(raw.stop_reason))throw new Error('incomplete-response');
 const text:string[]=[],calls:any[]=[];
 for(const block of raw.content){
  if(block?.type==='text'&&typeof block.text==='string')text.push(block.text);
  else if(block?.type==='tool_use'&&typeof block.id==='string'&&block.id.length>0&&block.id.length<=160&&typeof block.name==='string'&&block.input&&typeof block.input==='object'&&!Array.isArray(block.input))calls.push({id:block.id,function:{name:block.name,arguments:block.input}});
  else if(block?.type==='thinking'&&typeof block.thinking==='string'&&typeof block.signature==='string')continue;
  else if(block?.type==='redacted_thinking'&&typeof block.data==='string')continue;
  else throw new Error('invalid-response');
 }
 if(calls.length>1||(raw.stop_reason==='tool_use')!==(calls.length===1))throw new Error('invalid-response');
 return {role:'assistant',content:text.join('\n'),tool_calls:calls};
}
