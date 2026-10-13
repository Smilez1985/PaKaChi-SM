import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
type Rpc=(method:string,args?:Record<string,unknown>)=>unknown;
export class PlayerMQTT {
  readonly id=`player-${crypto.randomUUID()}`;
  private client:MqttClient|null=null;
  private timer:ReturnType<typeof setInterval>|undefined;
  private enabled=false;
  private cache=new Map<string,{expires:number;response:string}>();
  private rpc:Rpc;
  private status:(s:string)=>void;
  private error:(s:string)=>void;
  constructor(rpc:Rpc,status:(s:string)=>void,error:(s:string)=>void){this.rpc=rpc;this.status=status;this.error=error;}
  connect(options:{url:string;topic:string;username:string;password:string;rpcEnabled:boolean}) {
    this.disconnect();const url=new URL(options.url);
    if(!['ws:','wss:'].includes(url.protocol)||url.username||url.password)throw new Error('MQTT benötigt eine ws://- oder wss://-Broker-Adresse.');
    if(!options.topic||options.topic.length>200||/[+#\0]/.test(options.topic)||options.topic.startsWith('pakachi/players/')||options.topic.startsWith('pakachi/mcp/'))throw new Error('Ein eindeutiges Status-Topic ohne Platzhalter angeben.');
    const presence=`pakachi/players/${this.id}/presence`,request=`pakachi/players/${this.id}/request`;
    const client=mqtt.connect(url.href,{clientId:this.id,username:options.username||undefined,password:options.password||undefined,protocolVersion:4,clean:true,reconnectPeriod:2000,connectTimeout:5000,queueQoSZero:false,resubscribe:false,will:{topic:presence,payload:JSON.stringify({online:false}),qos:0,retain:false}});
    this.client=client;this.enabled=true;
    const current=()=>this.enabled&&this.client===client;
    const publishPresence=()=>{if(current()&&client.connected&&options.rpcEnabled)client.publish(presence,JSON.stringify({online:true}),{qos:0,retain:false});};
    client.on('connect',()=>{if(!current())return;this.cache.clear();clearInterval(this.timer);
      client.subscribe([options.topic,...(options.rpcEnabled?[request]:[])],{qos:0},(error,granted)=>{
        if(!current())return;if(error||granted?.some(g=>Number(g.qos)===128)){this.error('MQTT-Abonnement abgelehnt.');this.disconnect();return;}
        this.status(options.rpcEnabled?`Verbunden · Python-MCP bereit · ${this.id}`:'Verbunden · Status-Empfang');publishPresence();this.timer=setInterval(publishPresence,2000);
      });
    });
    client.on('message',(topic,payload,packet)=>{
      if(!current()||payload.length>65536)return;
      if(topic===options.topic){try{this.rpc('command',{payload:payload.toString()});}catch(e){this.error(String(e instanceof Error?e.message:e));}return;}
      if(!options.rpcEnabled||topic!==request||packet.retain)return;
      try {
        const data=JSON.parse(payload.toString());
        if(!data||typeof data.id!=='string'||!/^[a-z0-9-]{1,64}$/.test(data.id)||typeof data.replyTo!=='string'||!/^pakachi\/mcp\/[a-z0-9-]{1,64}\/reply$/.test(data.replyTo)||!Number.isFinite(data.expires)||data.expires<Date.now()||data.expires>Date.now()+10000)return;
        let response=this.cache.get(data.id)?.response;
        if(!response){try{if(!['list_avatars','get_avatar_capabilities','list_moves','get_state','set_state','play_move'].includes(data.method))throw new Error('Unbekannte MCP-Operation.');response=JSON.stringify({id:data.id,result:this.rpc(data.method,data.args)});}catch(e){response=JSON.stringify({id:data.id,error:e instanceof Error?e.message:String(e)});}
          for(const [id,item] of this.cache)if(item.expires<Date.now())this.cache.delete(id);
          if(this.cache.size>=128)this.cache.delete(this.cache.keys().next().value!);
          this.cache.set(data.id,{response,expires:Date.now()+10000});
        }
        client.publish(data.replyTo,response,{qos:0,retain:false});
      }catch{this.error('Ungültige MCP-Nachricht verworfen.');}
    });
    client.on('error',()=>{if(current())this.error('MQTT-Verbindung fehlgeschlagen. Adresse und Zugangsdaten prüfen.');});
    client.on('offline',()=>{if(current()){clearInterval(this.timer);this.status('Getrennt · Wiederverbindung läuft');}});
    this.status('MQTT-Verbindung wird hergestellt …');
  }
  disconnect(){this.enabled=false;clearInterval(this.timer);const client=this.client;this.client=null;this.cache.clear();if(client){if(client.connected)client.publish(`pakachi/players/${this.id}/presence`,JSON.stringify({online:false}),{qos:0,retain:false});client.end();}this.status('Aus · keine Verbindung');}
}
