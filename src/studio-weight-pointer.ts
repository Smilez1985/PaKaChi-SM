import * as T from 'three';
/** Captured left-button stroke; middle-button navigation remains available between strokes. */
export class StudioWeightPointer {
 enabled=false;
 private pointer:number|null=null;
 private canvas:HTMLCanvasElement;private hit:(x:number,y:number)=>T.Vector3|null;private begin:()=>boolean;private sample:(p:T.Vector3|null)=>void;private end:(cancel:boolean)=>void;private navigation:{enabled:boolean};
 constructor(canvas:HTMLCanvasElement,hit:(x:number,y:number)=>T.Vector3|null,begin:()=>boolean,sample:(p:T.Vector3|null)=>void,end:(cancel:boolean)=>void,navigation:{enabled:boolean}){
  this.canvas=canvas;this.hit=hit;this.begin=begin;this.sample=sample;this.end=end;this.navigation=navigation;
  canvas.addEventListener('pointerdown',this.down,true);canvas.addEventListener('pointermove',this.move,true);canvas.addEventListener('pointerup',this.up,true);canvas.addEventListener('pointercancel',this.cancel,true);canvas.addEventListener('lostpointercapture',this.cancel,true);
 }
 private down=(e:PointerEvent)=>{if(!this.enabled||e.button!==0||this.pointer!==null)return;e.preventDefault();e.stopImmediatePropagation();const p=this.hit(e.clientX,e.clientY);if(!p||!this.begin())return;this.pointer=e.pointerId;this.canvas.setPointerCapture(e.pointerId);this.navigation.enabled=false;this.sample(p);};
 private move=(e:PointerEvent)=>{if(this.pointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();this.sample(this.hit(e.clientX,e.clientY));};
 private up=(e:PointerEvent)=>{if(this.pointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();this.finish(false);};
 private cancel=(e:PointerEvent)=>{if(this.pointer===e.pointerId)this.finish(true);};
 finish(cancel=true){if(this.pointer===null)return;const id=this.pointer;this.pointer=null;this.navigation.enabled=true;if(this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);this.end(cancel);}
 dispose(){this.finish();this.canvas.removeEventListener('pointerdown',this.down,true);this.canvas.removeEventListener('pointermove',this.move,true);this.canvas.removeEventListener('pointerup',this.up,true);this.canvas.removeEventListener('pointercancel',this.cancel,true);this.canvas.removeEventListener('lostpointercapture',this.cancel,true);}
}
