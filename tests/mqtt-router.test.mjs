import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {StateMachine} from '../src/control.ts';
const require=createRequire(import.meta.url);
const MQTT=require('../public/legacy/pakachi/pakachi-mqtt.js');

test('MQTT transport feeds the same router, preserves state on bad payload, and opts out',()=>{
 const values=[], errors=[];const sm=new StateMachine();
 sm.bind({capability:{id:'demo',name:'Demo',states:['idle','working'],moves:[{id:'wave',name:'Wave',loop:false}]},setState:s=>values.push(s),playMove:m=>values.push(m)},'idle');
 class Socket { static last;readyState=0;sent=[];constructor(){Socket.last=this;}send(data){this.sent.push(data);}close(){this.readyState=3;this.onclose?.();} }
 const mqtt=new MQTT({WebSocketClass:Socket,onMessage:payload=>sm.execute(payload),onError:e=>errors.push(e)});
 assert.equal(Socket.last,undefined);
 mqtt.connect({url:'ws://127.0.0.1:8083/mqtt',topic:'pakachi/status'});
 const ws=Socket.last;ws.readyState=1;ws.onopen();
 const receive=(header,body)=>{const p=MQTT.packet(header,body);ws.onmessage({data:p.buffer});};
 receive(0x20,[0,0]);receive(0x90,[0,1,0]);
 const publish=text=>receive(0x30,[...MQTT.utf8('pakachi/status'),...new TextEncoder().encode(text)]);
 publish('working');publish('{"move":"wave"}');assert.deepEqual(values,['working','wave']);
 publish('{"state":"invented"}');assert.equal(sm.state,'working');assert.equal(errors.length,1);
 mqtt.disconnect();publish('idle');assert.equal(sm.state,'working');assert.equal(mqtt.active,false);
});
