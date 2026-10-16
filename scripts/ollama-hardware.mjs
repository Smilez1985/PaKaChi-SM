import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {statfs,access} from 'node:fs/promises';
import {join} from 'node:path';
const exec=promisify(execFile);
export const GiB=1024**3;
export function parseNvidia(text){
 return text.trim().split(/\r?\n/).filter(Boolean).map(line=>{
  const fields=line.split(',').map(s=>s.trim());if(fields.length!==4)throw new Error('GPU-Messwerte unvollständig.');
  const [uuid,name,total,free]=fields,totalBytes=Number(total)*1024**2,freeBytes=Number(free)*1024**2;
  if(!uuid.startsWith('GPU-')||!name||!Number.isFinite(totalBytes)||totalBytes<=0||!Number.isFinite(freeBytes)||freeBytes<0||freeBytes>totalBytes)throw new Error('GPU-Speicher nicht zuverlässig messbar.');
  return {uuid,name,totalBytes,freeBytes};
 });
}
export async function probeHardware({modelsDir}={}){
 const result={measuredAt:new Date().toISOString(),platform:os.platform(),cpu:os.cpus()[0]?.model??'unbekannt',cpuThreads:os.cpus().length,ramTotalBytes:os.totalmem(),ramFreeBytes:os.freemem(),gpus:[],gpuStatus:'unknown',diskFreeBytes:null,modelsDir:null};
 try{const {stdout}=await exec('nvidia-smi',['--query-gpu=uuid,name,memory.total,memory.free','--format=csv,noheader,nounits'],{timeout:5000,windowsHide:true,maxBuffer:65536});result.gpus=parseNvidia(stdout);if(result.gpus.length)result.gpuStatus='measured-nvidia';}catch{/* Never derive dedicated VRAM from RAM, names or Windows AdapterRAM. */}
 const candidates=modelsDir?[modelsDir]:[process.env.OLLAMA_MODELS,os.platform()==='linux'?'/usr/share/ollama/.ollama/models':null,join(os.homedir(),'.ollama','models')].filter(Boolean);
 for(const dir of candidates){try{await access(dir);const fs=await statfs(dir);const bytes=fs.bavail*fs.bsize;if(Number.isFinite(bytes)&&bytes>=0){result.modelsDir=dir;result.diskFreeBytes=bytes;break;}}catch{}}
 return result;
}
export const CURATED_MODELS=[
 {tag:'qwen3.5:4b-q4_K_M',quant:'Q4_K_M',maxWeightGiB:3.5,runtimeGiB:2,digestPrefix:'d8b0f5e9760c'},
 {tag:'qwen3.5:4b-q8_0',quant:'Q8_0',maxWeightGiB:5.5,runtimeGiB:2.5,digestPrefix:'e15635ee9312'},
 {tag:'qwen3.5:9b-q4_K_M',quant:'Q4_K_M',maxWeightGiB:6.5,runtimeGiB:3,digestPrefix:'56671c2ab938'},
 {tag:'qwen3.5:9b-q8_0',quant:'Q8_0',maxWeightGiB:10,runtimeGiB:3,digestPrefix:'a8ee95bc3592'},
].map(m=>({...m,source:`https://ollama.com/library/${m.tag}`,context:4096,quality:'research-candidate'}));
export function planModel(hardware,model,weightBytes,{cpu=false}={}){
 const reasons=[];const weights=Math.max(weightBytes,model.maxWeightGiB*GiB);
 if(!Number.isFinite(weights)||weights<=0)reasons.push('Gewichtsgröße unbekannt.');
 const runtime=(model.runtimeGiB??Math.max(4,weights/GiB))*GiB;
 const requiredComputeBytes=weights+runtime+(cpu?3:1)*GiB;
 const requiredRamBytes=cpu?requiredComputeBytes:weights+3*GiB;
 if(!Number.isFinite(hardware.ramFreeBytes)||hardware.ramFreeBytes<requiredRamBytes)reasons.push('Zu wenig gemessener freier RAM (einschließlich Reserve).');
 if(!cpu){
  if(hardware.gpuStatus!=='measured-nvidia'||hardware.gpus.length!==1)reasons.push('Genau eine zuverlässig gemessene NVIDIA-GPU erforderlich; CPU nur ausdrücklich mit --cpu.');
  else if(hardware.gpus[0].freeBytes<requiredComputeBytes||hardware.gpus[0].totalBytes<requiredComputeBytes)reasons.push('Zu wenig freier dedizierter VRAM einschließlich Kontext-/Studioreserve.');
 }
 // Account for all layers plus temporary storage; existing blobs are deliberately not discounted.
 const requiredDiskBytes=weightBytes*1.2+GiB;
 if(!Number.isFinite(hardware.diskFreeBytes)||hardware.diskFreeBytes<requiredDiskBytes)reasons.push('Modellspeicher unbekannt oder zu wenig Platz; --models-dir auf den tatsächlichen Ollama-Modellordner setzen.');
 return {tag:model.tag,mode:cpu?'cpu':'gpu',eligible:reasons.length===0,reasons,weightBytes,requiredComputeBytes,requiredRamBytes,requiredDiskBytes,context:4096,quality:'unverified',runtime:'unverified'};
}
