/** One reversible whole-project switch. Separate from the editor's gesture Undo. */
export class ModelSwitchHistory<T> {
 private entry?:{direction:'undo'|'redo';value:T};
 private version=0;
 private navigating=false;
 private readonly size:(value:T)=>number;
 private readonly limit:number;
 constructor(size:(value:T)=>number,limit=160*1024*1024){this.size=size;this.limit=limit;}
 get canUndo(){return !this.navigating&&this.entry?.direction==='undo';}
 get canRedo(){return !this.navigating&&this.entry?.direction==='redo';}
 private copy(value:T){if(this.size(value)>this.limit)throw new Error('model-history-size');return structuredClone(value);}
 /** Validate/copy before replacing anything; commit only after successful installation. */
 checkpoint(value:T):()=>void {
  const snapshot=this.copy(value);
  return ()=>{this.version++;this.entry={direction:'undo',value:snapshot};};
 }
 async travel(direction:'undo'|'redo',current:T,restore:(value:T,valid:()=>boolean)=>Promise<boolean>):Promise<boolean>{
  if(this.navigating||this.entry?.direction!==direction)return false;
  const saved=this.copy(current),target=structuredClone(this.entry.value),version=this.version;this.navigating=true;
  const valid=()=>version===this.version;
  try{
   if(!await restore(target,valid)||!valid())return false;
   this.version++;this.entry={direction:direction==='undo'?'redo':'undo',value:saved};return true;
  }finally{this.navigating=false;}
 }
 clear(){this.version++;this.entry=undefined;}
}
