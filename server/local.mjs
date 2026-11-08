import {parseArgs} from 'node:util';
import {spawn} from 'node:child_process';
import {createLocalApplication} from './local/app.mjs';

const {values}=parseArgs({options:{port:{type:'string',default:'8787'},directory:{type:'string'},open:{type:'boolean'}}});
const port=Number(values.port);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Ungültiger Port.');
const app=await createLocalApplication({...(values.directory?{directory:values.directory}:{})});
try{
 const url=await app.listen(port);console.log('PaKaChi-SM:',url,'— lokale Werkzeuge zunächst ausgeschaltet.');
 if(values.open){const command=process.platform==='win32'?'rundll32':process.platform==='darwin'?'open':'xdg-open',args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];spawn(command,args,{shell:false,detached:true,stdio:'ignore',windowsHide:true}).on('error',()=>{}).unref();}
 for(const event of ['SIGINT','SIGTERM'])process.once(event,()=>void app.close());
}catch(error){await app.close();console.error(error.message);process.exitCode=1;}
