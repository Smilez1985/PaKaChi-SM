import type {StudioRig} from './studio-rig.ts';
import type {StudioMove} from './studio-data.ts';
export const MOVE_CHECK_STEPS=16;
/** Segment-relative sampling includes every key pose and the loop closure. Not a continuous proof. */
export function moveCheckTimes(rig:StudioRig,move:StudioMove){
 const poses=move.poses.map(id=>{const p=rig.data.poses.find(p=>p.id===id);if(!p)throw Error('Pose nicht gefunden.');return p;});
 if(poses.length<2||poses.length>100)throw Error('Ungültige Bewegung.');
 const durations=poses.slice(1).map(p=>p.seconds);if(move.loop)durations.push(poses[0].seconds);
 const times=[0];let start=0;for(const duration of durations){if(!Number.isFinite(duration)||duration<.1||duration>30)throw Error('Ungültige Posendauer.');for(let i=1;i<=MOVE_CHECK_STEPS;i++)times.push(start+duration*i/MOVE_CHECK_STEPS);start+=duration;}return times;
}
export async function checkMoveBends(rig:StudioRig,move:StudioMove,signal:AbortSignal,valid:()=>boolean=()=>true){
 const ensure=()=>{signal.throwIfAborted();if(!valid())throw Error('Studio-Stand hat sich geändert. Prüfung erneut starten.');};ensure();
 const times=moveCheckTimes(rig,move);
 type Measurement=ReturnType<StudioRig['checkPoseBends']>['results'][number];
 const joints=new Map<string,Measurement&{minimum:number|null;maximum:number|null;violations:number;unmeasurable:number;firstIssue:number|null}>();
 let unmatched:ReturnType<StudioRig['checkPoseBends']>['unmatched']=[];
 for(let i=0;i<times.length;i++){
  if(i%8===0){await new Promise<void>(resolve=>setTimeout(resolve,0));ensure();}
  const time=times[i],report=rig.checkPoseBends({id:'sample',name:'Sample',seconds:1,values:rig.sample(move,time)});unmatched=report.unmatched;
  for(const result of report.results){let item=joints.get(result.jointId);if(!item){item={...result,minimum:null,maximum:null,violations:0,unmeasurable:0,firstIssue:null};joints.set(result.jointId,item);}
   if(result.angle!==null){item.minimum=Math.min(item.minimum??Infinity,result.angle);item.maximum=Math.max(item.maximum??-Infinity,result.angle);}
   if(result.status==='outside')item.violations++;if(result.status==='unmeasurable')item.unmeasurable++;
   if(result.status!=='within'&&item.firstIssue===null)item.firstIssue=time;
  }
 }
 ensure();return {moveId:move.id,samples:times.length,stepsPerSegment:MOVE_CHECK_STEPS,duration:times.at(-1)!,joints:[...joints.values()],unmatched};
}
