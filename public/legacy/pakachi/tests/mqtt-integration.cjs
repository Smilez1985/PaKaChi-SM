const assert=require('node:assert/strict');const C=require('../pakachi-controller.js'),MQTT=require('../pakachi-mqtt.js');
const c=new C();const expected=['working','thinking','talking','review','idle'];let index=0,errors=0,connected=false;
let resolve,reject;const completion=new Promise((yes,no)=>{resolve=yes;reject=no});
const mqtt=new MQTT({onStatus:s=>{if(s==='connected')connected=true;},onError:e=>{if(e.startsWith('Statusnachricht ignoriert:'))errors++;else reject(new Error(e));},onMessage:(payload)=>{
 const state=c.setStatus(payload);assert.equal(state.status,expected[index]);
 if(index===0){c.advance(3);assert.equal(c.position,71);}
 if(index===1){assert.equal(c.position,71);c.advance(1000);assert.equal(c.position,71);}
 if(index===2){c.advance(.25);assert(c.position<71&&c.position>0);}
 if(index===3){const before=c.position;c.advance(.1);assert(c.position>before);}
 if(index===4){c.advance(3);assert.equal(c.position,0);setTimeout(resolve,100);}
 index++;
}});
(async()=>{const timeout=setTimeout(()=>reject(new Error('Integration timeout')),8000);
 try{mqtt.connect({url:process.argv[2],topic:'pakachi/status',username:'test-user',password:'test-password'});await completion;assert(connected);assert.equal(index,5);assert.equal(errors,2);console.log('Passed: real WebSocket MQTT CONNECT/SUBSCRIBE, credentials, fragmented packets, retained QoS1 ACK, state routing and invalid-payload handling.');}
 finally{clearTimeout(timeout);mqtt.disconnect();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
