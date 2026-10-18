import {z} from 'zod';
import {parseProject} from './studio-data.ts';
import type {StudioProject,StudioData,StudioMove,Pose} from './studio-data.ts';
export const MAX_MOVE_FILE=8*1024*1024;
const schema=z.object({format:z.literal('pakachi-move'),version:z.literal(1),binding:z.object({model:z.string().regex(/^[a-f0-9]{64}$/),rig:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),move:z.unknown(),poses:z.array(z.unknown()).min(1).max(100)}).strict();
export interface MoveFile {format:'pakachi-move';version:1;binding:{model:string;rig:string};move:StudioMove;poses:Pose[]}
function canonical(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
 return JSON.stringify(value);
}
async function digest(value:string){const result=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');}
async function binding(project:StudioProject){
 const d=project.studio,rig={boneRest:d.boneRest,points:d.points.map(({id,kind,bone,mesh,rest,radius})=>({id,kind,bone,mesh,rest,radius})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0),links:d.links.map(l=>[...l].sort()).sort((a,b)=>canonical(a)<canonical(b)?-1:canonical(a)>canonical(b)?1:0)};
 const [model,layout]=await Promise.all([digest(project.model),digest(canonical(rig))]);return {model,rig:layout};
}
function size(value:unknown){if(new Blob([JSON.stringify(value)]).size>MAX_MOVE_FILE)throw Error('Move-Datei ist größer als 8 MiB.');}
export async function exportMoveFile(input:StudioProject,id:string):Promise<MoveFile>{
 const project=parseProject(input),move=project.studio.moves.find(m=>m.id===id);if(!move)throw Error('Eigene Bewegung auswählen.');
 const wanted=new Set(move.poses),poses=project.studio.poses.filter(p=>wanted.has(p.id));
 // A move may reference the same pose repeatedly; its sequence is retained.
 const result:MoveFile={format:'pakachi-move',version:1,binding:await binding(project),move:structuredClone(move),poses:structuredClone(poses)};
 size(result);return result;
}
export async function importMoveFile(input:unknown,targetInput:StudioProject):Promise<StudioData>{
 size(input);const file=schema.parse(input),target=parseProject(targetInput),expected=await binding(target);
 if(file.binding.model!==expected.model||file.binding.rig!==expected.rig)throw Error('Bewegung passt nicht zu Modell und Gelenkstruktur.');
 const incoming=parseProject({...target,avatar:{...target.avatar,moves:[],defaultMove:undefined,states:undefined},studio:{...target.studio,draft:undefined,poses:file.poses,moves:[file.move]}}).studio;
 const move=incoming.moves[0],needed=new Set(move.poses);
 if(incoming.poses.some(p=>!needed.has(p.id)))throw Error('Move-Datei enthält unbenutzte Posen.');
 const result=structuredClone(target.studio),ids=new Set(result.poses.map(p=>p.id)),mapping=new Map<string,string>();
 for(const pose of incoming.poses){let id:string;do{id='p-'+crypto.randomUUID();}while(ids.has(id));ids.add(id);mapping.set(pose.id,id);result.poses.push({...pose,id});}
 const occupied=new Set([...target.avatar.moves,...result.moves].map(m=>m.id));let id=move.id,index=2;while(occupied.has(id))id=move.id.slice(0,90)+'-'+index++;
 result.moves.push({...move,id,poses:move.poses.map(id=>mapping.get(id)!)});
 // Enforce total pose/move limits before any editor mutation.
 return parseProject({...target,studio:result}).studio;
}
