import type {ImageReferenceDocument,ImageReferenceRegion} from './image-reference.ts';
import {checkImageReferenceReadiness,isValidImageReferencePolygonWithHoles,validateImageReferenceDocument} from './image-reference.ts';

export interface ImageCropPlan {
 x:number;
 y:number;
 width:number;
 height:number;
 polygon?:Array<{x:number;y:number}>;
 holes?:Array<Array<{x:number;y:number}>>;
}

/** Convert source-pixel geometry into a bounded crop plan without changing its coordinates. */
export function planImageReferenceCrop(region:ImageReferenceRegion,sourceWidth:number,sourceHeight:number):ImageCropPlan {
 if(!Number.isSafeInteger(sourceWidth)||!Number.isSafeInteger(sourceHeight)||sourceWidth<=0||sourceHeight<=0)throw new Error('invalid-source-size');
 if(region.geometry.type==='polygon'&&!isValidImageReferencePolygonWithHoles(region.geometry.points,region.geometry.holes))throw new Error('invalid-region-geometry');
 const points=region.geometry.type==='rectangle'
  ?[{x:region.geometry.x,y:region.geometry.y},{x:region.geometry.x+region.geometry.width,y:region.geometry.y+region.geometry.height}]
  :region.geometry.points;
 if(points.length<2||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>sourceWidth||p.y>sourceHeight))throw new Error('invalid-region-geometry');
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const x=Math.floor(Math.min(...xs)),y=Math.floor(Math.min(...ys));
 const right=Math.ceil(Math.max(...xs)),bottom=Math.ceil(Math.max(...ys));
 if(right<=x||bottom<=y)throw new Error('empty-region');
 return {x,y,width:right-x,height:bottom-y,...(region.geometry.type==='polygon'?{polygon:region.geometry.points.map(p=>({x:p.x-x,y:p.y-y})),...(region.geometry.holes?.length?{holes:region.geometry.holes.map(ring=>ring.map(p=>({x:p.x-x,y:p.y-y})))}:{})}:{})};
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
   context.beginPath();plan.polygon.forEach((p,i)=>i===0?context.moveTo(p.x,p.y):context.lineTo(p.x,p.y));context.closePath();plan.holes?.forEach(ring=>{ring.forEach((p,i)=>i===0?context.moveTo(p.x,p.y):context.lineTo(p.x,p.y));context.closePath();});context.clip('evenodd');
  }
  context.drawImage(bitmap,plan.x,plan.y,plan.width,plan.height,0,0,plan.width,plan.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('crop-encoding-failed')),'image/png'));
  return new File([blob],`${source.name.replace(/\\.[^.]+$/,'')}-${region.id}.png`,{type:'image/png',lastModified:source.lastModified});
 }finally{bitmap.close();}
}

export interface ImageReferenceGenerationManifest {
 format:'pakachi-image-reference-generation'; version:1;
 source:{sha256:string;width:number;height:number};
 selection:{regionId:string;label:string;kind:ImageReferenceRegion['kind'];avatar:{id:string;label:string};form:{id:string;label:string};view:{id:string;label:string};crop:{x:number;y:number;width:number;height:number;sha256:string};mask:{type:'rectangle'|'polygon';vertices:number;holes:number}};
}
export function createImageReferenceGenerationManifest(document:ImageReferenceDocument,regionId:string,cropSha256:string):ImageReferenceGenerationManifest {
 if(!/^[a-f0-9]{64}$/i.test(cropSha256))throw new Error('invalid-generation-crop-hash');
 if(!checkImageReferenceReadiness(document).ready)throw new Error('image-reference-not-ready');
 const region=document.regions.find(item=>item.id===regionId);
 if(!region||region.status!=='confirmed')throw new Error('image-reference-region-not-confirmed');
 const matchingViews=document.views.filter(view=>view.regionIds.includes(regionId));
 if(matchingViews.length!==1)throw new Error('image-reference-view-assignment');
 const view=matchingViews[0]!;
 const matchingForms=document.forms.filter(form=>form.viewIds.includes(view.id));
 if(matchingForms.length!==1)throw new Error('image-reference-form-assignment');
 const form=matchingForms[0]!;
 const matchingAvatars=document.avatars.filter(avatar=>avatar.formIds.includes(form.id));
 if(matchingAvatars.length!==1)throw new Error('image-reference-avatar-assignment');
 const avatar=matchingAvatars[0]!,crop=planImageReferenceCrop(region,document.source.width,document.source.height),geometry=region.geometry;
 return {format:'pakachi-image-reference-generation',version:1,source:{sha256:document.source.sha256,width:document.source.width,height:document.source.height},selection:{regionId:region.id,label:region.label,kind:region.kind,avatar:{id:avatar.id,label:avatar.label},form:{id:form.id,label:form.label},view:{id:view.id,label:view.label},crop:{x:crop.x,y:crop.y,width:crop.width,height:crop.height,sha256:cropSha256},mask:{type:geometry.type,vertices:geometry.type==='polygon'?geometry.points.length:4,holes:geometry.type==='polygon'?(geometry.holes?.length??0):0}}};
}


export interface ImageReferenceFormCropSelection {formId:string;regionId:string}
export interface ImageReferenceFormCropPlan {
 region:{id:string;label:string;kind:'form'|'view'};
 form:{id:string;label:string};
 view:{id:string;label:string};
 crop:ImageCropPlan;
}
export interface ImageReferenceFormPairCropPlan {
 format:'pakachi-image-reference-form-pair';
 version:1;
 source:{sha256:string;width:number;height:number};
 avatar:{id:string;label:string};
 forms:[ImageReferenceFormCropPlan,ImageReferenceFormCropPlan];
}

/**
 * Plan two independently generated forms from one composite source image.
 * Both form and region identities must be explicitly selected by the user;
 * this function never infers animal/work identity from image position or pixels.
 */
export function createImageReferenceFormPairCropPlan(
 document:ImageReferenceDocument,
 avatarId:string,
 selections:readonly [ImageReferenceFormCropSelection,ImageReferenceFormCropSelection],
):ImageReferenceFormPairCropPlan {
 const issues=validateImageReferenceDocument(document);
 if(issues.length)throw new Error('invalid-image-reference-document');
 if(!/^[a-f0-9]{64}$/i.test(document.source.sha256))throw new Error('invalid-image-reference-source');
 const avatar=document.avatars.find(item=>item.id===avatarId);
 if(!avatar)throw new Error('unknown-image-reference-avatar');
 const [first,second]=selections;
 if(!first||!second||first.formId===second.formId||first.regionId===second.regionId)throw new Error('distinct-form-selections-required');
 const selectedForms=[first,second].map(selection=>{
  if(!avatar.formIds.includes(selection.formId))throw new Error('form-not-owned-by-avatar');
  const form=document.forms.find(item=>item.id===selection.formId);
  if(!form)throw new Error('unknown-image-reference-form');
  const owners=document.avatars.filter(item=>item.formIds.includes(form.id));
  if(owners.length!==1||owners[0]!.id!==avatar.id)throw new Error('ambiguous-form-avatar-assignment');
  const matches=document.views.filter(view=>form.viewIds.includes(view.id)&&view.regionIds.includes(selection.regionId));
  if(matches.length!==1)throw new Error('form-region-view-assignment');
  const region=document.regions.find(item=>item.id===selection.regionId);
  if(!region||region.status!=='confirmed')throw new Error('form-region-not-confirmed');
  if(region.kind!=='form'&&region.kind!=='view')throw new Error('form-region-must-be-main-view');
  const globalAssignments=document.views.filter(view=>view.regionIds.includes(region.id));
  if(globalAssignments.length!==1)throw new Error('ambiguous-region-view-assignment');
  if(form.viewIds.filter(id=>id===matches[0]!.id).length!==1)throw new Error('ambiguous-form-view-assignment');
  const crop=planImageReferenceCrop(region,document.source.width,document.source.height);
  return {region:{id:region.id,label:region.label,kind:region.kind},form:{id:form.id,label:form.label},view:{id:matches[0]!.id,label:matches[0]!.label},crop};
 });
 return {
  format:'pakachi-image-reference-form-pair',version:1,
  source:{sha256:document.source.sha256,width:document.source.width,height:document.source.height},
  avatar:{id:avatar.id,label:avatar.label},
  forms:selectedForms as [ImageReferenceFormCropPlan,ImageReferenceFormCropPlan],
 };
}


export interface ImageReferenceFormPairCrops {
 plan:ImageReferenceFormPairCropPlan;
 crops:[File,File];
 manifests:[ImageReferenceGenerationManifest,ImageReferenceGenerationManifest];
}

/** Extract both explicitly selected form regions as independent PNGs without modifying the source. */
export async function cropImageReferenceFormPair(
 source:File,
 document:ImageReferenceDocument,
 avatarId:string,
 selections:readonly [ImageReferenceFormCropSelection,ImageReferenceFormCropSelection],
):Promise<ImageReferenceFormPairCrops> {
 if(!['image/png','image/jpeg'].includes(source.type)||source.size<1||source.size>20*1024*1024)throw new Error('invalid-image-reference-source-file');
 const digest=await crypto.subtle.digest('SHA-256',await source.arrayBuffer());
 const hash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
 if(hash.toLowerCase()!==document.source.sha256.toLowerCase())throw new Error('image-reference-source-hash-mismatch');
 const bitmap=await createImageBitmap(source);
 try{
  if(bitmap.width!==document.source.width||bitmap.height!==document.source.height)throw new Error('image-reference-source-dimensions-mismatch');
 }finally{bitmap.close();}
 const plan=createImageReferenceFormPairCropPlan(document,avatarId,selections);
 const selected=selections.map(selection=>document.regions.find(region=>region.id===selection.regionId)!);
 const crops=await Promise.all(selected.map(region=>cropImageReferenceRegion(source,region))) as [File,File];
 const cropHashes=await Promise.all(crops.map(async file=>{
  const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
  return Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
 })) as [string,string];
 const manifests=selections.map((selection,index)=>createImageReferenceGenerationManifest(document,selection.regionId,cropHashes[index]!)) as [ImageReferenceGenerationManifest,ImageReferenceGenerationManifest];
 return {plan,crops,manifests};
}
