(function(root){
'use strict';
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
function utf8(text){const b=encoder.encode(text);if(b.length>65535||text.includes('\0'))throw new Error('Ungültiges MQTT-Textfeld');return [b.length>>8,b.length&255,...b];}
function packet(header,body=[]){let n=body.length,remaining=[];do{let b=n%128;n=Math.floor(n/128);if(n)b|=128;remaining.push(b);}while(n);return new Uint8Array([header,...remaining,...body]);}
class PacketReader{
 constructor(){this.buffer=new Uint8Array();}
 push(bytes){
  if(this.buffer.length+bytes.length>65536)throw new Error('MQTT-Paket zu groß');
  const all=new Uint8Array(this.buffer.length+bytes.length);all.set(this.buffer);all.set(bytes,this.buffer.length);this.buffer=all;const result=[];
  while(this.buffer.length>=2){let length=0,multiplier=1,end=1,complete=false;
   for(let i=0;i<4;i++){if(end>=this.buffer.length)break;const b=this.buffer[end++];length+=(b&127)*multiplier;if(!(b&128)){complete=true;break;}multiplier*=128;if(i===3)throw new Error('Ungültige MQTT-Paketlänge');}
   if(length>65530)throw new Error('MQTT-Paket zu groß');if(!complete||this.buffer.length<end+length)break;
   result.push({header:this.buffer[0],body:this.buffer.slice(end,end+length)});this.buffer=this.buffer.slice(end+length);
  }return result;
 }
}
class PakachiMQTT{
 constructor({onMessage=()=>{},onStatus=()=>{},onError=()=>{},WebSocketClass=root.WebSocket}={}){this.onMessage=onMessage;this.onStatus=onStatus;this.onError=onError;this.WebSocketClass=WebSocketClass;this.active=false;this.ws=null;this.generation=0;this.retryDelay=1000;this.connectionState='off';}
 status(value){this.connectionState=value;this.onStatus(value);}
 connect(options){
  const url=new URL(options.url);if(!['ws:','wss:'].includes(url.protocol)||url.username||url.password||url.hash)throw new Error('Broker-Adresse muss ws:// oder wss:// sein, Zugangsdaten separat eingeben');
  const topic=String(options.topic??'').trim();if(!topic||topic.includes('\0')||topic.includes('#')||topic.includes('+'))throw new Error('Bitte ein einzelnes Status-Topic ohne Wildcards eingeben');utf8(topic);
  const username=String(options.username??''),password=String(options.password??'');if(password&&!username)throw new Error('Für ein Passwort bitte auch einen Benutzernamen eingeben');utf8(username);utf8(password);
  if(typeof this.WebSocketClass!=='function')throw new Error('WebSocket wird nicht unterstützt');
  this.disconnect();this.options={url:url.href,topic,username,password};this.active=true;this.retryDelay=1000;this.attempt();
 }
 disconnect(){
  this.active=false;this.generation++;clearTimeout(this.retryTimer);clearTimeout(this.handshakeTimer);clearInterval(this.pingTimer);
  const ws=this.ws;this.ws=null;this.options=null;
  if(ws){if(ws.readyState===1){try{ws.send(packet(0xe0));}catch{}}try{ws.close();}catch{}}
  this.status('off');
 }
 attempt(){
  if(!this.active)return;const generation=++this.generation;let ws;
  try{ws=new this.WebSocketClass(this.options.url,'mqtt');}catch(e){this.onError('WebSocket-Verbindung konnte nicht gestartet werden');this.schedule();return;}
  this.ws=ws;this.reader=new PacketReader();this.connected=false;this.subscribed=false;this.awaitPing=false;ws.binaryType='arraybuffer';this.status('connecting');
  const current=()=>this.active&&generation===this.generation&&this.ws===ws;
  this.handshakeTimer=setTimeout(()=>{if(current())this.fail('Broker antwortet nicht auf Verbindung oder Anmeldung');},10000);
  ws.onopen=()=>{if(!current())return;
   const id='pk'+Math.random().toString(16).slice(2,12)+Math.random().toString(16).slice(2,10);
   let flags=2,body=[...utf8('MQTT'),4,0,0,30,...utf8(id)];
   if(this.options.username){flags|=128;body.push(...utf8(this.options.username));}
   if(this.options.password){flags|=64;body.push(...utf8(this.options.password));}
   body[7]=flags;this.send(packet(0x10,body));
  };
  ws.onmessage=event=>{if(!current())return;try{
   if(!(event.data instanceof ArrayBuffer))throw new Error('Broker sendet keine binären MQTT-Daten');
   for(const data of this.reader.push(new Uint8Array(event.data)))this.handle(data);
  }catch(e){this.fail(e.message);}};
  ws.onerror=()=>{if(current())this.onError('WebSocket-Verbindung fehlgeschlagen; Adresse, Listener und Zugangsdaten prüfen');};
  ws.onclose=()=>{if(generation!==this.generation||this.ws!==ws)return;clearTimeout(this.handshakeTimer);clearInterval(this.pingTimer);this.ws=null;this.connected=false;this.subscribed=false;if(this.active)this.schedule();};
 }
 schedule(){if(!this.active)return;this.status('reconnecting');clearTimeout(this.retryTimer);const delay=this.retryDelay;this.retryDelay=Math.min(30000,delay*2);this.retryTimer=setTimeout(()=>this.attempt(),delay);}
 fail(message,permanent=false){this.onError(message);if(permanent){this.active=false;this.options=null;this.status('error');}if(this.ws)try{this.ws.close(1002);}catch{}clearTimeout(this.handshakeTimer);clearInterval(this.pingTimer);}
 send(bytes){if(this.ws?.readyState===1){this.ws.send(bytes);this.lastTx=Date.now();}}
 handle({header,body}){
  const type=header>>4;
  if(type===2){
   if(header!==0x20||body.length!==2||body[0]!==0||body[1]>5)throw new Error('Ungültige CONNACK-Antwort');
   if(body[1]!==0){this.fail(['','MQTT-Version abgelehnt','Client-ID abgelehnt','Broker nicht verfügbar','Zugangsdaten abgelehnt','Nicht autorisiert'][body[1]],true);return;}
   this.connected=true;this.send(packet(0x82,[0,1,...utf8(this.options.topic),0]));
  }else if(type===9){
   if(!this.connected||header!==0x90||body.length!==3||body[0]!==0||body[1]!==1||![0,128].includes(body[2]))throw new Error('Ungültige SUBACK-Antwort');
   if(body[2]===128){this.fail('Status-Topic wurde vom Broker abgelehnt',true);return;}
   clearTimeout(this.handshakeTimer);this.subscribed=true;this.retryDelay=1000;this.status('connected');
   this.pingTimer=setInterval(()=>{if(!this.active||!this.connected)return;if(this.awaitPing){this.fail('MQTT-Keepalive ohne Antwort');return;}if(Date.now()-this.lastTx>=15000){this.awaitPing=true;this.send(packet(0xc0));}},15000);
  }else if(type===3){
   if(!this.connected||body.length<2)throw new Error('Ungültige Status-Publikation');const qos=(header>>1)&3;if(qos>1)throw new Error('QoS2 wird bei diesem QoS0-Abonnement nicht unterstützt');
   const size=(body[0]<<8)|body[1];let offset=2+size;if(!size||offset>body.length)throw new Error('Ungültiges MQTT-Topic');const topic=decoder.decode(body.slice(2,offset));
   if(qos===1){if(offset+2>body.length)throw new Error('Paket-ID fehlt');const id=body.slice(offset,offset+2);if(!id[0]&&!id[1])throw new Error('Ungültige Paket-ID');offset+=2;this.send(packet(0x40,[...id]));}
   if(body.length-offset>16384){this.onError('Statusnachricht zu groß; ignoriert');return;}
   if(topic!==this.options.topic)return;
   try{this.onMessage(decoder.decode(body.slice(offset)),{topic,retained:Boolean(header&1)});}catch(e){this.onError('Statusnachricht ignoriert: '+e.message);}
  }else if(type===13){if(header!==0xd0||body.length!==0)throw new Error('Ungültige PINGRESP');this.awaitPing=false;
  }else throw new Error('Unerwartetes MQTT-Paket');
 }
}
PakachiMQTT.PacketReader=PacketReader;PakachiMQTT.packet=packet;PakachiMQTT.utf8=utf8;
if(typeof module!=='undefined'&&module.exports)module.exports=PakachiMQTT;else root.PakachiMQTT=PakachiMQTT;
})(typeof globalThis!=='undefined'?globalThis:this);
