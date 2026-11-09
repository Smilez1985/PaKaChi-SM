/** TripoSR uses Z-up/+X-facing coordinates; the player uses glTF Y-up/+Z-facing. */
export function orientTripoSRGlb(input) {
 const bytes=Buffer.from(input);
 if(bytes.length<20||bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length||bytes.readUInt32LE(16)!==0x4e4f534a)throw new Error('Invalid TripoSR GLB.');
 const end=20+bytes.readUInt32LE(12);if(end>bytes.length)throw new Error('Incomplete GLB JSON.');
 const data=JSON.parse(bytes.toString('utf8',20,end));
 if(data.asset?.extras?.pakachiOrientation==='triposr-zup-xfront-to-yup-zfront')return bytes;
 if(!Array.isArray(data.nodes)||!Array.isArray(data.scenes)||!data.scenes.length)throw new Error('TripoSR GLB has no scene.');
 for(const scene of data.scenes){
  if(!Array.isArray(scene.nodes)||!scene.nodes.length)throw new Error('TripoSR GLB has no scene roots.');
  const root=data.nodes.length;
  data.nodes.push({name:'PaKaChi_TripoSR_orientation',children:scene.nodes,rotation:[-.5,-.5,-.5,.5]});
  scene.nodes=[root];
 }
 data.asset.extras={...data.asset.extras,pakachiOrientation:'triposr-zup-xfront-to-yup-zfront'};
 const json=Buffer.from(JSON.stringify(data)),padded=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(padded);
 const result=Buffer.alloc(20+padded.length+bytes.length-end);
 bytes.copy(result,0,0,12);result.writeUInt32LE(result.length,8);result.writeUInt32LE(padded.length,12);result.writeUInt32LE(0x4e4f534a,16);padded.copy(result,20);bytes.copy(result,20+padded.length,end);
 return result;
}
