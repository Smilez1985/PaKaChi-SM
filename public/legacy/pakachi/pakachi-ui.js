'use strict';
const controller=new PakachiController({frameCount:72,fps:24});
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),status=document.querySelector('#status');
const normal=document.querySelector('#normal'),work=document.querySelector('#work'),stateChoice=document.querySelector('#state-choice');
const labels={normal:'Tierform',work:'Arbeitsform','transforming-in':'Verwandlung …','transforming-out':'Rückverwandlung …'};
const stateLabels={idle:'Ruhe',talking:'Sprechen',thinking:'Denken',working:'Arbeiten',waiting:'Warten',review:'Prüfen',error:'Fehler',sleeping:'Schlafen'};
const enabled=document.querySelector('#mqtt-enabled'),form=document.querySelector('#mqtt-form'),connection=document.querySelector('#mqtt-status'),message=document.querySelector('#mqtt-message');
let images=[],ready=false,previous=null,lastState=null;
function setStatus(value){const state=controller.setStatus(value);normal.setAttribute('aria-pressed',String(!state.working));work.setAttribute('aria-pressed',String(state.working));stateChoice.value=state.status;return state;}
function setWorking(value){if(typeof value!=='boolean')throw new TypeError('working must be boolean');return setStatus(value?'working':'idle');}
normal.onclick=()=>setStatus('idle');work.onclick=()=>setStatus('working');stateChoice.onchange=()=>setStatus(stateChoice.value);
const mqtt=new PakachiMQTT({
 onMessage:(payload,meta)=>{const state=setStatus(payload);message.textContent='Empfangen: '+state.status+(meta.retained?' · letzter Broker-Status':'')+' · '+new Date().toLocaleTimeString();},
 onStatus:value=>{connection.textContent=({off:'Aus · keine Verbindung',connecting:'Verbindung wird hergestellt …',connected:'Verbunden · Status-Topic abonniert',reconnecting:'Verbindung unterbrochen · erneuter Versuch …',error:'Verbindung abgelehnt · Einstellungen prüfen'})[value];},
 onError:text=>{message.textContent=text;}
});
function connectFromForm(){message.textContent='';try{mqtt.connect({url:form.elements.broker.value.trim(),topic:form.elements.topic.value.trim(),username:form.elements.username.value,password:form.elements.password.value});}catch(e){mqtt.disconnect();message.textContent=e.message;enabled.checked=false;}}
enabled.onchange=()=>{if(enabled.checked)connectFromForm();else{mqtt.disconnect();message.textContent='Empfang ausgeschaltet. Die aktuelle Form bleibt erhalten.';}};
form.onsubmit=e=>{e.preventDefault();if(enabled.checked)connectFromForm();else message.textContent='Zum Verbinden zuerst „MQTT-Empfang einschalten“ aktivieren.';};
window.Pakachi={setStatus,setWorking,getState:()=>controller.getState(),getMQTTState:()=>mqtt.connectionState};
window.addEventListener('pakachi:context',e=>{try{if(typeof e.detail?.state==='string'||typeof e.detail?.status==='string')setStatus(e.detail);else if(typeof e.detail?.working==='boolean')setWorking(e.detail.working);}catch(err){message.textContent=err.message;}});
window.addEventListener('pagehide',()=>mqtt.disconnect());
function tick(time){const elapsed=previous===null?0:Math.min((time-previous)/1000,.1);previous=time;
 if(ready){const state=controller.advance(elapsed);ctx.clearRect(0,0,768,832);ctx.drawImage(images[state.frame],0,0);status.textContent=labels[state.mode]+' · '+stateLabels[state.status];
 const key=state.mode+':'+state.status;if(lastState!==key){lastState=key;window.dispatchEvent(new CustomEvent('pakachi:state',{detail:state}));}}
 requestAnimationFrame(tick);}
Promise.all(Array.from({length:72},(_,i)=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Bild '+(i+1)+' fehlt. Bitte das gesamte ZIP entpacken.'));image.src='frames/'+String(i+1).padStart(3,'0')+'.png';}))).then(items=>{images=items;ready=true;}).catch(e=>{status.textContent='Laden fehlgeschlagen';document.querySelector('#error').textContent=e.message;});
requestAnimationFrame(tick);
