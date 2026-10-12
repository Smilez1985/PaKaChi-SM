const assert=require('node:assert/strict');
const C=require('../pakachi-controller.js'),MQTT=require('../pakachi-mqtt.js');
const c=new C();assert.equal(c.getState().status,'idle');c.setStatus({state:'working'});c.advance(3);assert.equal(c.getState().form,'humanoid');
c.setStatus('thinking');assert.equal(c.position,71);c.advance(3600);assert.equal(c.position,71);
c.setStatus('talking');c.advance(.3);const middle=c.position;assert(middle>0&&middle<71);c.setStatus('{"state":"review"}');assert.equal(c.position,middle);c.advance(.1);assert(c.position>middle);
assert.throws(()=>c.setStatus('{broken'));assert.throws(()=>c.setStatus('nonsense'));assert.equal(c.status,'review');c.setStatus('idle');c.advance(3);assert.equal(c.getState().form,'animal');
c.setWorking(true);assert.equal(c.status,'working');c.setWorking(false);assert.equal(c.status,'idle');
const r=new MQTT.PacketReader();assert.deepEqual(r.push(Uint8Array.of(0x20)),[]);assert.deepEqual(r.push(Uint8Array.of(2,0,0,0xd0,0)).map(x=>x.header),[0x20,0xd0]);assert.throws(()=>r.push(Uint8Array.of(0x30,0xff,0xff,0xff,0xff)));
let created=0;class FakeSocket{constructor(){created++;this.readyState=0;}close(){this.readyState=3;}}
const off=new MQTT({WebSocketClass:FakeSocket});assert.equal(created,0);assert.throws(()=>off.connect({url:'mqtt://localhost:1883',topic:'pakachi/status'}));assert.equal(created,0);off.connect({url:'ws://localhost:8083/mqtt',topic:'pakachi/status'});assert.equal(created,1);off.disconnect();assert.equal(off.active,false);assert.equal(off.connectionState,'off');assert.equal(off.options,null);
const alternate=new C({forms:{...C.DEFAULT_FORMS,thinking:'animal'}});alternate.setStatus('thinking');assert.equal(alternate.working,false);
console.log('Passed: form routing, same-form hold, mid-transition reversal, invalid messages, fragmented/coalesced packets, opt-in, configuration and opt-out.');
