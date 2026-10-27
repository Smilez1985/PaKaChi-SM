import * as T from 'three';
interface AlphaTexture {channel:number;matrix:T.Matrix3;width:number;height:number;data:Uint8Array;component:number;wrapS:number;wrapT:number;flipY:boolean;nearest:boolean}
export interface WeightAlpha {opacity:number;cutoff:number;textures:AlphaTexture[]}
/** Immutable base-level alpha sampling. Unsupported images/materials stay opaque. */
export function captureWeightAlpha(material:T.Material,cache:Map<T.Texture,Uint8Array|null>):WeightAlpha|null {
 const m=material as T.MeshStandardMaterial;
 if(!(m.alphaTest>0)||m.alphaToCoverage||(material as T.ShaderMaterial).isShaderMaterial)return null;
 const textures:AlphaTexture[]=[];
 for(const [texture,component] of [[m.map,3],[m.alphaMap,1]] as const){
  if(!texture)continue;
  if(component===1&&texture.colorSpace!==T.NoColorSpace)return null;
  if(typeof ImageBitmap!=='undefined'&&texture.image instanceof ImageBitmap&&texture.flipY)return null;
  if(texture.mapping!==T.UVMapping||texture.type!==T.UnsignedByteType||texture.format!==T.RGBAFormat)return null;
  const image=texture.image as {width:number;height:number;data?:Uint8Array};
  const width=image?.width,height=image?.height;
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16777216)return null;
  if(!cache.has(texture)){
   let data:Uint8Array|null=null;
   try{
    if(image.data instanceof Uint8Array&&image.data.length===width*height*4)data=new Uint8Array(image.data);
    else if(!image.data&&typeof document!=='undefined'){
     const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     if(ctx){ctx.drawImage(texture.image as CanvasImageSource,0,0);data=new Uint8Array(ctx.getImageData(0,0,width,height).data);}
     canvas.width=canvas.height=0;
    }
   }catch{/* Unreadable or cross-origin image: no alpha holes inferred. */}
   cache.set(texture,data);
  }
  const data=cache.get(texture);if(!data)return null;
  // Canvas premultiplication can erase green in transparent alpha-map pixels.
  if(component===1&&!image.data){for(let i=3;i<data.length;i+=4)if(data[i]!==255)return null;}
  const matrix=texture.matrixAutoUpdate?new T.Matrix3().setUvTransform(texture.offset.x,texture.offset.y,texture.repeat.x,texture.repeat.y,texture.rotation,texture.center.x,texture.center.y):texture.matrix.clone();
  textures.push({channel:texture.channel,matrix,width,height,data,component,wrapS:texture.wrapS,wrapT:texture.wrapT,flipY:texture.flipY,nearest:texture.magFilter===T.NearestFilter});
 }
 return {opacity:m.opacity,cutoff:m.alphaTest,textures};
}
function address(i:number,size:number,wrap:number){
 if(wrap===T.RepeatWrapping)return ((i%size)+size)%size;
 if(wrap===T.MirroredRepeatWrapping){const n=((i%(2*size))+2*size)%(2*size);return n<size?n:2*size-1-n;}
 return Math.max(0,Math.min(size-1,i));
}
function sample(t:AlphaTexture,uv:T.Vector2){
 uv.applyMatrix3(t.matrix);if(t.flipY)uv.y=1-uv.y;
 if(!Number.isFinite(uv.x)||!Number.isFinite(uv.y))return 1;
 const pixel=(x:number,y:number)=>t.data[(address(y,t.height,t.wrapT)*t.width+address(x,t.width,t.wrapS))*4+t.component]/255;
 if(t.nearest)return pixel(Math.floor(uv.x*t.width),Math.floor(uv.y*t.height));
 const x=uv.x*t.width-.5,y=uv.y*t.height-.5,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 return (pixel(ix,iy)*(1-fx)+pixel(ix+1,iy)*fx)*(1-fy)+(pixel(ix,iy+1)*(1-fx)+pixel(ix+1,iy+1)*fx)*fy;
}
export function weightAlphaDiscard(alpha:WeightAlpha|null,uvs:Map<number,[T.Vector2,T.Vector2,T.Vector2]>,bary:T.Vector3){
 if(!alpha)return false;
 let value=alpha.opacity;
 for(const texture of alpha.textures){const uv=uvs.get(texture.channel);if(!uv)return false;
  value*=sample(texture,new T.Vector2().copy(uv[0]).multiplyScalar(bary.x).addScaledVector(uv[1],bary.y).addScaledVector(uv[2],bary.z));
 }
 return value<alpha.cutoff;
}
