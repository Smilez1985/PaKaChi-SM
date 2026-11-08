import {spawn} from 'node:child_process';
import {StringDecoder} from 'node:string_decoder';

// Hold a suffix so a credential split between OS pipe chunks cannot enter logs.
export function redactStream(secrets,emit){
 const values=secrets.filter(Boolean),keep=Math.max(0,...values.map(s=>s.length-1));let pending='';const decoder=new StringDecoder('utf8');
 const send=final=>{let cut=final?pending.length:Math.max(0,pending.length-keep);for(const key of values){let at=-1;while((at=pending.indexOf(key,at+1))>=0){if(at<cut)cut=Math.max(cut,at+key.length);}}
  const part=values.reduce((s,key)=>s.split(key).join('[redacted]'),pending.slice(0,cut));pending=pending.slice(cut);if(part)emit(part);};
 return {write(bytes){pending+=decoder.write(bytes);send(false);},end(){pending+=decoder.end();send(true);}};
}

export function workerEnvironment(extra={}){
 const keep=['PATH','Path','SystemRoot','WINDIR','COMSPEC','TEMP','TMP','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','LD_LIBRARY_PATH','CUDA_PATH','CUDA_HOME'];
 return {...Object.fromEntries(keep.filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]])),...extra};
}
export function launchProcess(command,args,{cwd,env={},timeout=60000,onData=()=>{},secrets=[]}={}){
 const child=spawn(command,args,{cwd,env:workerEnvironment(env),shell:false,windowsHide:true,detached:process.platform!=='win32'});
 child.stdin.on('error',()=>{});
 let stdout='',stderr='',stopped=false,finished=false,force,timer;
 const redact=s=>secrets.filter(Boolean).reduce((text,secret)=>text.split(secret).join('[redacted]'),String(s));
 const kill=signal=>{
  if(process.platform==='win32'){if(child.pid)spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,shell:false,stdio:'ignore'}).on('error',()=>{});}
  else if(child.pid){try{process.kill(-child.pid,signal);}catch{try{child.kill(signal);}catch{/* already exited */}}}
 };
 const stop=()=>{if(stopped||finished)return;stopped=true;kill('SIGTERM');force=setTimeout(()=>kill('SIGKILL'),1500);force.unref();};
 if(timeout){timer=setTimeout(stop,timeout);timer.unref();}
 const done=new Promise((accept,reject)=>{
  const out=redactStream(secrets,text=>{stdout=(stdout+text).slice(-262144);onData(text);}),err=redactStream(secrets,text=>{stderr=(stderr+text).slice(-262144);onData(text);});
  const clean=()=>{out.end();err.end();if(stopped)kill('SIGKILL');finished=true;clearTimeout(timer);clearTimeout(force);};
  child.stdout.on('data',b=>out.write(b));
  child.stderr.on('data',b=>err.write(b));
  child.once('error',error=>{clean();reject(new Error(redact(error.message)));});
  child.once('close',(code,signal)=>{clean();accept({code,signal,stopped,stdout,stderr});});
 });
 return {child,done,stop};
}
