/** Lossless sparse morph storage for self-contained GLBs emitted by GLTFExporter. */
export function compactMorphGLB(buffer:ArrayBuffer):ArrayBuffer{
 const view=new DataView(buffer),fail=()=>{throw Error('Ungültiger binärer GLB-Export.');};
 if(buffer.byteLength<20||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)fail();
 let jsonBytes:Uint8Array|undefined,bin:Uint8Array|undefined,unknown=false;
 for(let at=12;at<buffer.byteLength;){if(at+8>buffer.byteLength)fail();const length=view.getUint32(at,true),type=view.getUint32(at+4,true);if(length%4||at+8+length>buffer.byteLength)fail();const bytes=new Uint8Array(buffer,at+8,length);if(type===0x4e4f534a){if(jsonBytes)fail();jsonBytes=bytes;}else if(type===0x004e4942){if(bin)fail();bin=bytes;}else unknown=true;at+=8+length;}
 if(!jsonBytes)fail();
 const json=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(jsonBytes));
 if(unknown||!bin||json.buffers?.length!==1||json.buffers[0].uri||json.extensionsUsed?.includes('EXT_meshopt_compression'))return buffer;
 // These records are exporter-owned glTF data; application extras remain opaque.
 const walk=(value:any,visit:(owner:any,key:string)=>void)=>{if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if(key==='extras')continue;if(key==='bufferView')visit(value,key);else walk(value[key],visit);}};
 const accessors=json.accessors??[],views=json.bufferViews??[],targets=new Set<number>(),protectedAccessors=new Set<number>();
 for(const mesh of json.meshes??[])for(const primitive of mesh.primitives??[]){for(const id of Object.values(primitive.attributes??{}))protectedAccessors.add(id as number);if(primitive.indices!==undefined)protectedAccessors.add(primitive.indices);for(const target of primitive.targets??[])for(const semantic of ['POSITION','NORMAL'])if(target[semantic]!==undefined)targets.add(target[semantic]);}
 for(const skin of json.skins??[])if(skin.inverseBindMatrices!==undefined)protectedAccessors.add(skin.inverseBindMatrices);
 for(const animation of json.animations??[])for(const sampler of animation.samplers??[]){protectedAccessors.add(sampler.input);protectedAccessors.add(sampler.output);}
 const additions=new Map<number,Uint8Array>();let changed=0;
 const addView=(bytes:Uint8Array)=>{const id=views.length;views.push({buffer:0,byteLength:bytes.byteLength});additions.set(id,bytes);return id;};
 for(const id of targets){
  const a=accessors[id];if(!a||protectedAccessors.has(id)||a.type!=='VEC3'||a.componentType!==5126||a.normalized||a.sparse||a.bufferView===undefined||a.extensions)continue;
  const source=views[a.bufferView];if(!source||source.buffer!==0||!Number.isInteger(a.count)||a.count<1)fail();
  const start=(source.byteOffset??0)+(a.byteOffset??0),stride=source.byteStride??12,end=start+(a.count-1)*stride+12;
  if(stride<12||stride%4||start%4||end>(source.byteOffset??0)+source.byteLength||end>bin.byteLength)fail();
  const data=new DataView(bin.buffer,bin.byteOffset,bin.byteLength),nonzero:number[]=[];
  for(let i=0;i<a.count;i++){let present=false;for(let k=0;k<3;k++){const at=start+i*stride+k*4;if(!Number.isFinite(data.getFloat32(at,true)))fail();if(data.getUint32(at,true)!==0)present=true;}if(present)nonzero.push(i);}
  const width=nonzero.at(-1)!<256?1:nonzero.at(-1)!<65536?2:4;
  if(nonzero.length*(12+width)+160>=a.count*12)continue;
  delete a.bufferView;delete a.byteOffset;changed++;
  if(nonzero.length){
   const indices=new Uint8Array(nonzero.length*width),values=new Uint8Array(nonzero.length*12),iv=new DataView(indices.buffer);
   nonzero.forEach((vertex,i)=>{if(width===1)iv.setUint8(i,vertex);else if(width===2)iv.setUint16(i*2,vertex,true);else iv.setUint32(i*4,vertex,true);values.set(bin!.subarray(start+vertex*stride,start+vertex*stride+12),i*12);});
   a.sparse={count:nonzero.length,indices:{bufferView:addView(indices),componentType:width===1?5121:width===2?5123:5125},values:{bufferView:addView(values)}};
  }
 }
 if(!changed)return buffer;
 const used=new Set<number>();walk(json,(owner,key)=>{const id=owner[key];if(!Number.isInteger(id)||id<0||id>=views.length)fail();used.add(id);});
 const mapping=new Map<number,number>(),parts:{offset:number;bytes:Uint8Array}[]=[],outputViews:any[]=[];let cursor=0;
 for(const id of [...used].sort((a,b)=>a-b)){
  const original=views[id];if(original.buffer!==0)fail();let bytes=additions.get(id);
  if(!bytes){const start=original.byteOffset??0;if(!Number.isInteger(start)||!Number.isInteger(original.byteLength)||start<0||original.byteLength<0||start+original.byteLength>bin.byteLength)fail();bytes=bin.subarray(start,start+original.byteLength);}
  cursor=Math.ceil(cursor/4)*4;mapping.set(id,outputViews.length);outputViews.push({...original,byteOffset:cursor,byteLength:bytes.byteLength});parts.push({offset:cursor,bytes});cursor+=bytes.byteLength;
 }
 walk(json,(owner,key)=>{owner[key]=mapping.get(owner[key]);});json.bufferViews=outputViews;const binaryLength=Math.ceil(cursor/4)*4;json.buffers[0].byteLength=binaryLength;
 const encoded=new TextEncoder().encode(JSON.stringify(json)),jsonLength=Math.ceil(encoded.length/4)*4,total=12+8+jsonLength+8+binaryLength;
 if(total>=buffer.byteLength)return buffer;
 const output=new ArrayBuffer(total),header=new DataView(output),bytes=new Uint8Array(output);header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,total,true);header.setUint32(12,jsonLength,true);header.setUint32(16,0x4e4f534a,true);bytes.fill(0x20,20,20+jsonLength);bytes.set(encoded,20);header.setUint32(20+jsonLength,binaryLength,true);header.setUint32(24+jsonLength,0x004e4942,true);for(const part of parts)bytes.set(part.bytes,28+jsonLength+part.offset);
 return output;
}
