import {validFigureScale,validBendLimit} from './studio-data.ts';
export const STUDIO_ACTIONS=['set_mode','add_point','update_point','delete_point','connect_points','disconnect_points','save_pose','apply_pose','replace_pose','create_move','undo','redo'] as const;
export type StudioAction=typeof STUDIO_ACTIONS[number];
export interface StudioCommand {session:string;expectedRevision:number;action:StudioAction;mode?:'pose'|'rig';id?:string;target?:string;name?:string;position?:[number,number,number];rotation?:[number,number,number,number];scale?:number;bendLimit?:{min:number;max:number}|null;size?:number;radius?:number;mesh?:number;seconds?:number;loop?:boolean;poses?:string[]}
const fields:Record<StudioAction,string[]>={set_mode:['mode'],add_point:['name','position','mesh','size','radius'],update_point:['id','name','position','rotation','scale','size','radius','bendLimit'],delete_point:['id'],connect_points:['id','target'],disconnect_points:['id','target'],save_pose:['name','seconds'],apply_pose:['id'],replace_pose:['id'],create_move:['id','name','poses','loop'],undo:[],redo:[]};
export function parseStudioCommand(value:unknown):StudioCommand {
 const fail=()=>{throw new Error('Ungültiger Studio-Befehl.');};
 if(!value||typeof value!=='object'||Array.isArray(value))return fail();const v=value as Record<string,unknown>;
 if(typeof v.session!=='string'||v.session.length>100||!Number.isSafeInteger(v.expectedRevision)||(v.expectedRevision as number)<0||!STUDIO_ACTIONS.includes(v.action as StudioAction))return fail();
 const allowed=new Set(['session','expectedRevision','action',...fields[v.action as StudioAction]]);if(Object.keys(v).some(k=>!allowed.has(k)))return fail();
 for(const key of ['id','target'])if(v[key]!==undefined&&(typeof v[key]!=='string'||!/^([a-z0-9][a-z0-9_-]{0,99}|\$figure)$/.test(v[key] as string)))return fail();
 if(v.name!==undefined&&(typeof v.name!=='string'||!v.name.trim()||v.name.length>100))return fail();
 if(v.mode!==undefined&&!['pose','rig'].includes(v.mode as string))return fail();
 for(const [key,count,max] of [['position',3,100],['rotation',4,1]] as const)if(v[key]!==undefined&&(!Array.isArray(v[key])||v[key].length!==count||!(v[key] as unknown[]).every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=max)))return fail();
 if(v.rotation!==undefined&&Math.abs((v.rotation as number[]).reduce((s,n)=>s+n*n,0)-1)>.001)return fail();
 for(const [key,min,max] of [['size',.003,.15],['radius',.005,.6],['seconds',.1,30]] as const)if(v[key]!==undefined&&(typeof v[key]!=='number'||!Number.isFinite(v[key])||v[key]<min||v[key]>max))return fail();
 if(v.bendLimit!==undefined&&v.bendLimit!==null&&!validBendLimit(v.bendLimit))return fail();
 if(v.scale!==undefined&&!validFigureScale(v.scale))return fail();
 if(v.mesh!==undefined&&(!Number.isInteger(v.mesh)||(v.mesh as number)<0))return fail();
 if(v.loop!==undefined&&typeof v.loop!=='boolean')return fail();
 if(v.poses!==undefined&&(!Array.isArray(v.poses)||v.poses.length<2||v.poses.length>100||v.poses.some(x=>typeof x!=='string'||!x||x.length>100)))return fail();
 return structuredClone(v) as unknown as StudioCommand;
}
