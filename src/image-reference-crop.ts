import type {ImageReferenceRegion} from './image-reference.ts';

export interface ImageCropPlan {
 x:number;
 y:number;
 width:number;
 height:number;
 polygon?:Array<{x:number;y:number}>;
}

/** Convert source-pixel geometry into a bounded crop plan without changing its coordinates. */
export function planImageReferenceCrop(region:ImageReferenceRegion,sourceWidth:number,sourceHeight:number):ImageCropPlan {
 if(!Number.isSafeInteger(sourceWidth)||!Number.isSafeInteger(sourceHeight)||sourceWidth<=0||sourceHeight<=0)throw new Error('invalid-source-size');
 const points=region.geometry.type==='rectangle'
  ?[{x:region.geometry.x,y:region.geometry.y},{x:region.geometry.x+region.geometry.width,y:region.geometry.y+region.geometry.height}]
  :region.geometry.points;
 if(points.length<2||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>sourceWidth||p.y>sourceHeight))throw new Error('invalid-region-geometry');
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const x=Math.floor(Math.min(...xs)),y=Math.floor(Math.min(...ys));
 const right=Math.ceil(Math.max(...xs)),bottom=Math.ceil(Math.max(...ys));
 if(right<=x||bottom<=y)throw new Error('empty-region');
 return {x,y,width:right-x,height:bottom-y,...(region.geometry.type==='polygon'?{polygon:region.geometry.points.map(p=>({x:p.x-x,y:p.y-y}))}:{})};
}

/**
 * Extract only the selected source region. Polygon regions are alpha-clipped so pixels
 * outside the marked polygon are not accidentally sent to the reconstruction service.
 */
export async function cropImageReferenceRegion(source:File,region:ImageReferenceRegion):Promise<File> {
 const bitmap=await createImageBitmap(source);
 try{
  const plan=planImageReferenceCrop(region,bitmap.width,bitmap.height);
  const canvas=document.createElement('canvas');canvas.width=plan.width;canvas.height=plan.height;
  const context=canvas.getContext('2d');if(!context)throw new Error('canvas-unavailable');
  if(plan.polygon){
   context.beginPath();plan.polygon.forEach((p,i)=>i===0?context.moveTo(p.x,p.y):context.lineTo(p.x,p.y));context.closePath();context.clip();
  }
  context.drawImage(bitmap,plan.x,plan.y,plan.width,plan.height,0,0,plan.width,plan.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('crop-encoding-failed')),'image/png'));
  return new File([blob],`${source.name.replace(/\\.[^.]+$/,'')}-${region.id}.png`,{type:'image/png',lastModified:source.lastModified});
 }finally{bitmap.close();}
}
