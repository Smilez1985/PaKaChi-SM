(function(root){
'use strict';
const DEFAULT_FORMS=Object.freeze({idle:'animal',talking:'animal',thinking:'humanoid',working:'humanoid',waiting:'humanoid',review:'humanoid',error:'animal',sleeping:'animal'});
function parseStatus(payload){
 if(typeof payload==='string'){
  if(payload.length>16384)throw new RangeError('Statusnachricht zu groß');
  const text=payload.trim();
  if(text.startsWith('{')||text.startsWith('"')){payload=JSON.parse(text);}else payload=text;
 }
 const status=typeof payload==='string'?payload:payload?.state??payload?.status;
 if(typeof status!=='string'||!Object.hasOwn(DEFAULT_FORMS,status))throw new RangeError('Unbekannter Pakachi-Zustand');
 return status;
}
class PakachiController {
 constructor({frameCount=72,fps=24,forms=DEFAULT_FORMS}={}){
  if(!Number.isInteger(frameCount)||frameCount<2||!Number.isFinite(fps)||fps<=0)throw new Error('Invalid animation configuration');
  for(const key of Object.keys(DEFAULT_FORMS))if(!['animal','humanoid'].includes(forms[key]))throw new Error('Invalid form map');
  this.frameCount=frameCount;this.fps=fps;this.forms=Object.freeze({...forms});this.position=0;this.status='idle';this.working=false;
 }
 setStatus(payload){const status=parseStatus(payload);this.status=status;this.working=this.forms[status]==='humanoid';return this.getState();}
 setWorking(value){if(typeof value!=='boolean')throw new TypeError('working must be boolean');return this.setStatus(value?'working':'idle');}
 advance(seconds){
  if(!Number.isFinite(seconds)||seconds<0)throw new TypeError('Invalid elapsed time');
  this.position=Math.max(0,Math.min(this.frameCount-1,this.position+(this.working?1:-1)*seconds*this.fps));return this.getState();
 }
 getState(){const mode=this.position===0?'normal':this.position===this.frameCount-1?'work':this.working?'transforming-in':'transforming-out';return {mode,status:this.status,targetForm:this.forms[this.status],form:mode==='normal'?'animal':mode==='work'?'humanoid':'transition',animation:mode.startsWith('transforming')?mode:this.status,working:this.working,frame:Math.round(this.position),frameCount:this.frameCount};}
}
PakachiController.DEFAULT_FORMS=DEFAULT_FORMS;PakachiController.parseStatus=parseStatus;
if(typeof module!=='undefined'&&module.exports)module.exports=PakachiController;else root.PakachiController=PakachiController;
})(typeof globalThis!=='undefined'?globalThis:this);
