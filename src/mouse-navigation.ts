import type {PerspectiveCamera,Vector3,Quaternion} from 'three';
import {dragCamera} from './camera.ts';
/** Middle button drag is independent of the current editing tool; no modifier keys. */
export class MouseNavigation {
  private canvas:HTMLCanvasElement;
  private camera:PerspectiveCamera;
  private center:()=>Vector3;
  private suspend:(active:boolean)=>void;
  private sync:(rotation:Quaternion,pivot:Vector3)=>void;
  private pivot:Vector3|null=null;
  private inverted:()=>boolean;
  private pointer:number|null=null;
  private previous={x:0,y:0};
  constructor(canvas:HTMLCanvasElement,camera:PerspectiveCamera,center:()=>Vector3,suspend:(active:boolean)=>void,sync:(rotation:Quaternion,pivot:Vector3)=>void,inverted:()=>boolean){
    this.canvas=canvas;this.camera=camera;this.center=center;this.suspend=suspend;this.sync=sync;this.inverted=inverted;
    canvas.addEventListener('pointerdown',this.down,true);canvas.addEventListener('pointermove',this.move,true);canvas.addEventListener('pointerup',this.up,true);canvas.addEventListener('pointercancel',this.up,true);canvas.addEventListener('lostpointercapture',this.up,true);canvas.addEventListener('mousedown',this.prevent,true);canvas.addEventListener('auxclick',this.prevent,true);
  }
  private prevent=(e:MouseEvent)=>{if(e.button===1)e.preventDefault();};
  private down=(e:PointerEvent)=>{if(e.button!==1)return;e.preventDefault();e.stopImmediatePropagation();this.pointer=e.pointerId;this.pivot=this.center().clone();this.previous={x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId);this.suspend(true);};
  private move=(e:PointerEvent)=>{if(e.pointerId!==this.pointer)return;e.preventDefault();e.stopImmediatePropagation();const point={x:e.clientX,y:e.clientY};const rotation=dragCamera(this.camera,this.pivot!,this.previous,point,this.canvas.getBoundingClientRect(),this.inverted());this.previous=point;if(rotation)this.sync(rotation,this.pivot!);};
  private up=(e:PointerEvent)=>{if(e.pointerId!==this.pointer)return;e.preventDefault();e.stopImmediatePropagation();this.pointer=null;this.pivot=null;if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);this.suspend(false);};
  dispose(){this.canvas.removeEventListener('pointerdown',this.down,true);this.canvas.removeEventListener('pointermove',this.move,true);this.canvas.removeEventListener('pointerup',this.up,true);this.canvas.removeEventListener('pointercancel',this.up,true);this.canvas.removeEventListener('lostpointercapture',this.up,true);this.canvas.removeEventListener('mousedown',this.prevent,true);this.canvas.removeEventListener('auxclick',this.prevent,true);if(this.pointer!==null)this.suspend(false);}
}
