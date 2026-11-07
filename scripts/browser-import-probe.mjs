/** Injected only by the benchmark. Observes the real file input and native WebGL calls. */
export function installImportProbe() {
 const initialCanvas=document.querySelector('#viewport canvas');
 const state=window.__pakachiImportBenchmark={result:null,error:null};
 let start=null,source,ready=null,readMs=null,firstDraw=null,drawCalls=0,bitmaps=0,pending=false;
 const elapsed=()=>performance.now()-start;
 document.addEventListener('change',event=>{
  if(event.target?.id!=='project-file')return;
  if(start!==null){state.error='More than one import in a measurement';return;}
  source=event.target.files?.[0];if(source)start=performance.now();
 },true);
 const text=File.prototype.text;
 File.prototype.text=async function(...args){
  const measured=this===source&&start!==null,begin=performance.now();
  try{return await text.apply(this,args);}finally{if(measured)readMs=performance.now()-begin;}
 };
 const bitmap=window.createImageBitmap;
 if(bitmap)window.createImageBitmap=async function(...args){
  const measured=start!==null&&!state.result;
  const image=await bitmap.apply(this,args);if(measured)bitmaps++;return image;
 };
 function check(){
  if(start===null||state.result||state.error)return;
  const message=document.querySelector('#message');
  if(message?.classList.contains('error')){state.error='Project import failed: '+message.textContent;return;}
  const canvas=document.querySelector('#viewport canvas');
  if(canvas===initialCanvas||!canvas?.isConnected)return;
  try{if(ready===null&&window.PaKaChiSM.call('get_state').ready)ready=elapsed();}catch{/* Still loading. */}
 }
 window.addEventListener('pakachi-sm:change',check);
 new MutationObserver(check).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 const prototype=WebGL2RenderingContext.prototype;
 for(const key of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
  const native=prototype[key];
  prototype[key]=function(...args){
   const value=native.apply(this,args);
   if(start!==null&&ready!==null&&!state.result&&!state.error&&this.canvas===document.querySelector('#viewport canvas')){
    drawCalls++;if(firstDraw===null)firstDraw=elapsed();
    if(!pending){pending=true;requestAnimationFrame(()=>{
     check();if(state.error)return;
     const canvas=this.canvas,rect=canvas.getBoundingClientRect();
     if(!canvas.isConnected||rect.width<=0||rect.height<=0||!canvas.width||!canvas.height){state.error='Imported canvas is not visible';return;}
     state.result={fileReadMs:readMs,readyMs:ready,firstDrawMs:firstDraw,frameBoundaryMs:elapsed(),drawCalls,imageBitmapsDecoded:bitmaps,
      canvas:{width:canvas.width,height:canvas.height},webglVersion:this.getParameter(this.VERSION),renderer:this.getParameter(this.RENDERER)};
    });}
   }
   return value;
  };
 }
 document.addEventListener('webglcontextlost',()=>{if(start!==null)state.error='WebGL context lost during import';},true);
}
