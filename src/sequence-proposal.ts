import {parseStudioCommand,validMoveSequenceUpdates} from './studio-command.ts';
import type {StudioCommand} from './studio-command.ts';
import type {AssistantRPC} from './assistant.ts';
export interface SequenceComparison {id:string;name:string;before:{id:string;name:string}[];after:{id:string;name:string}[]}
/** Read-only local comparison, bound to exactly the revision proposed by the assistant. */
export function compareSequenceProposal(command:StudioCommand,rpc:AssistantRPC):SequenceComparison[]|null {
 if(command.action!=='update_move'&&command.action!=='update_moves')return null;
 const parsed=parseStudioCommand(command),updates=parsed.action==='update_move'?[{id:parsed.id!,poses:parsed.poses!}]:parsed.updates;
 if(!validMoveSequenceUpdates(updates))throw Error('invalid-proposal');
 const check=(value:any)=>{if(!value||value.session!==command.session||value.revision!==command.expectedRevision||value.open!==true)throw Error('stale-studio');};
 const read=(section:'moves'|'poses')=>{
  const rows:any[]=[];let offset=0;
  for(let page=0;page<100;page++){
   const result=rpc('get_studio',{section,offset,limit:32}) as any;check(result);
   if(!Array.isArray(result.items)||result.items.length>32||!Number.isInteger(result.total)||result.total<0||result.total>100)throw Error('invalid-snapshot');
   rows.push(...result.items);if(rows.length>100||rows.length>result.total)throw Error('invalid-snapshot');
   if(result.nextOffset===null){if(rows.length!==result.total)throw Error('invalid-snapshot');return rows;}
   if(!result.items.length||result.nextOffset!==offset+result.items.length)throw Error('invalid-snapshot');
   offset=result.nextOffset;
  }
  throw Error('invalid-snapshot');
 };
 const moves=read('moves'),poses=read('poses');check(rpc('get_studio'));
 const poseNames=new Map<string,string>();
 for(const pose of poses){if(typeof pose?.id!=='string'||typeof pose.name!=='string'||poseNames.has(pose.id))throw Error('invalid-snapshot');poseNames.set(pose.id,pose.name);}
 const steps=(ids:unknown)=>{
  if(!Array.isArray(ids)||ids.length<2||ids.length>100)throw Error('invalid-snapshot');
  return ids.map(id=>{const name=poseNames.get(id);if(name===undefined)throw Error('missing-pose');return {id,name};});
 };
 return updates.map(update=>{
  const matches=moves.filter(m=>m?.id===update.id),move=matches[0];
  if(matches.length!==1||typeof move.name!=='string')throw Error('missing-move');
  return {id:update.id,name:move.name,before:steps(move.poses),after:steps(update.poses)};
 });
}
export function renderSequenceComparison(host:HTMLElement,rows:SequenceComparison[],language:'de'|'en',preview?:(row:SequenceComparison,after:boolean)=>void){
 const t=(de:string,en:string)=>language==='de'?de:en;
 const title=document.createElement('h4');title.textContent=t('Posenfolgen: vorher und nachher','Pose sequences: before and after');host.append(title);
 for(const row of rows){
  const heading=document.createElement('h5');heading.textContent=`${row.name} [${row.id}]`;host.append(heading);
  if(preview)for(const after of [false,true]){const button=document.createElement('button');button.type='button';button.dataset.sequencePreview=after?'after':'before';button.textContent=after?t('Nachher abspielen','Play after'):t('Vorher abspielen','Play before');button.onclick=()=>preview(row,after);host.append(button);}
  const table=document.createElement('table'),head=document.createElement('thead'),header=document.createElement('tr');
  for(const label of [t('Schritt','Step'),t('Vorher','Before'),t('Nachher','After')]){const cell=document.createElement('th');cell.scope='col';cell.textContent=label;header.append(cell);}head.append(header);table.append(head);
  const body=document.createElement('tbody');
  for(let i=0;i<Math.max(row.before.length,row.after.length);i++){
   const tr=document.createElement('tr');for(const value of [String(i+1),...([row.before[i],row.after[i]].map(step=>step?`${step.name} [${step.id}]`:'—'))]){const cell=document.createElement('td');cell.textContent=value;tr.append(cell);}body.append(tr);
  }
  table.append(body);host.append(table);
 }
 const note=document.createElement('p');note.textContent=preview?t('Vorschau verändert keine gespeicherte Bewegung. Vor dem Übernehmen wird die Bearbeitungspose wiederhergestellt.','Preview does not change saved motion. The editing pose is restored before applying.'):t('Vergleich der Reihenfolge, keine Bewegungsvorschau. Alle Änderungen werden gemeinsam übernommen und gemeinsam rückgängig gemacht.','Sequence comparison, not a motion preview. All edits are applied together and undone together.');host.append(note);
}
