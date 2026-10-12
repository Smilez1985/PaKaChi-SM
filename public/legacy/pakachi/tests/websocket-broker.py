"""Local protocol test fixture, not a NanoMQ server or deployment."""
import asyncio,struct
from pathlib import Path
from websockets.asyncio.server import serve

def packet(header,body=b''):
 length=len(body);prefix=b''
 while True:
  digit=length%128;length//=128;prefix+=bytes([digit|(128 if length else 0)])
  if not length:break
 return bytes([header])+prefix+body

def string(text):
 b=text.encode();return struct.pack('!H',len(b))+b

def unpack(data):
 pos=1;length=0;factor=1
 while True:
  b=data[pos];pos+=1;length+=(b&127)*factor
  if not b&128:break
  factor*=128
 assert len(data)==pos+length
 return data[0],data[pos:]

def take_string(data,pos):
 n=int.from_bytes(data[pos:pos+2],'big');return data[pos+2:pos+2+n].decode(),pos+2+n

async def main():
 completed=asyncio.Event();result=[]
 async def broker(ws):
  try:
   assert ws.subprotocol=='mqtt'
   h,b=unpack(await ws.recv());assert h==0x10
   protocol,pos=take_string(b,0);assert protocol=='MQTT' and b[pos]==4 and b[pos+1]==0xc2
   assert b[pos+2:pos+4]==bytes([0,30]);pos+=4
   client,pos=take_string(b,pos);assert 1<=len(client)<=23
   username,pos=take_string(b,pos);password,pos=take_string(b,pos)
   assert username=='test-user' and password=='test-password' and pos==len(b)
   await ws.send(bytes([0x20]));await asyncio.sleep(.02);await ws.send(bytes([2,0,0]))
   h,b=unpack(await ws.recv());assert h==0x82 and b[:2]==b'\x00\x01'
   topic,pos=take_string(b,2);assert topic=='pakachi/status' and b[pos:]==b'\x00'
   def pub(payload,topic='pakachi/status',qos=0,retained=False):
    return packet(0x30|(qos<<1)|int(retained),string(topic)+(b'\x00\x07' if qos else b'')+payload.encode())
   await ws.send(packet(0x90,b'\x00\x01\x00')+pub('{"state":"working"}',qos=1,retained=True))
   h,b=unpack(await ws.recv());assert h==0x40 and b==b'\x00\x07'
   for data in [pub('{invalid'),pub('unknown'),pub('idle','different/topic'),pub('thinking'),pub('{"status":"talking"}'),pub('review'),pub('idle')]:
    await ws.send(data);await asyncio.sleep(.02)
   h,b=unpack(await ws.recv());assert h==0xe0 and not b
   result.append('broker checks passed')
  except Exception as e:result.append(e)
  finally:completed.set()
 async with serve(broker,'127.0.0.1',0,subprotocols=['mqtt']) as server:
  port=server.sockets[0].getsockname()[1]
  proc=await asyncio.create_subprocess_exec('node',str(Path(__file__).with_name('mqtt-integration.cjs')),f'ws://127.0.0.1:{port}/mqtt')
  code=await asyncio.wait_for(proc.wait(),12);await asyncio.wait_for(completed.wait(),2)
  assert code==0 and result==['broker checks passed'],result
 print('Broker side: CONNECT, subscription, acknowledgements and explicit disconnect passed.')
asyncio.run(main())
