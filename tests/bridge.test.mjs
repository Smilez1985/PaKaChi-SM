import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import WebSocket from 'ws';
import { createBridge } from '../server/bridge.mjs';
const token='test-key-'.repeat(8);
const origin='http://127.0.0.1:5173';
async function setup(t) {
 const bridge=createBridge({token,port:0,timeout:120});
 await once(bridge.server,'listening');t.after(()=>bridge.close());
 return {bridge,url:`ws://127.0.0.1:${bridge.server.address().port}`};
}
async function pair(url,key=token) {
 const socket=new WebSocket(url,{origin});await once(socket,'open');
 const first=key===token ? once(socket,'message') : once(socket,'close');
 socket.send(JSON.stringify({type:'hello',token:key}));await first;return socket;
}
test('bridge requires opt-in pairing, relays replies and rejects disconnected requests',async t=>{
 const {bridge,url}=await setup(t);
 await assert.rejects(bridge.request('get_state'),/Kein gekoppelter/);
 const rejected=await pair(url,'bad');assert.equal(rejected.readyState,WebSocket.CLOSED);
 const socket=await pair(url);
 socket.on('message',raw=>{const m=JSON.parse(raw);socket.send(JSON.stringify({type:'result',id:m.id,result:{state:'working'}}));});
 assert.deepEqual(await bridge.request('get_state'),{state:'working'});
 const closed=once(socket,'close');socket.close();await closed;
 await assert.rejects(bridge.request('get_state'),/Kein gekoppelter/);
});
test('bridge rejects non-loopback origins and times out without replaying commands',async t=>{
 const {bridge,url}=await setup(t);
 const bad=new WebSocket(url,{origin:'https://example.com'});await once(bad,'error');
 const socket=await pair(url);let count=0;socket.on('message',()=>count++);
 await assert.rejects(bridge.request('play_move',{move:'wave'}),/bereits ausgeführt/);assert.equal(count,1);socket.close();
});
