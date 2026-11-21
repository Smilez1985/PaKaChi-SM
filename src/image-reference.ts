/**
 * User-verifiable image segmentation and avatar/form/view grouping.
 * Coordinates are always pixels in the immutable source image.
 */
export type ImageRegionKind = 'avatar'|'form'|'view'|'detail'|'helper';
export type ImageRegionStatus = 'suggested'|'confirmed'|'ignored';
export type ImageRegionGeometry =
  | {type:'rectangle';x:number;y:number;width:number;height:number}
  | {type:'polygon';points:Array<{x:number;y:number}>;holes?:Array<Array<{x:number;y:number}>>};

export interface ImageReferenceLandmark {
  id:string;
  regionId:string;
  partId:string;
  surfaceLayerId?:string|null;
  poseId:string;
  x:number;
  y:number;
  radiusPx:number;
}

/**
 * Pixel-bound observations augment region contours and landmarks without
 * claiming 3D depth or automatically assigning anatomy/material semantics.
 */
export type ImageReferenceObservation =
 | {id:string;kind:'silhouette';regionId:string;confidence?:number}
 | {id:string;kind:'proportion';regionId:string;fromLandmarkId:string;toLandmarkId:string;ratio:number;confidence?:number}
 | {id:string;kind:'color-sample';regionId:string;x:number;y:number;rgba:[number,number,number,number];radiusPx:number;confidence?:number}
 | {id:string;kind:'material-boundary';regionId:string;points:Array<{x:number;y:number}>;confidence?:number};

export interface ImageReferenceRegion {
  id:string;
  label:string;
  kind:ImageRegionKind;
  status:ImageRegionStatus;
  confidence?:number;
  /** Machine-readable geometric evidence; never a semantic identity label. */
  confidenceEvidence?:string[];
  geometry:ImageRegionGeometry;
}
export interface ImageReferenceView {
  id:string;
  label:string;
  /** Ordered region IDs: a view may combine a main crop and detail crops. */
  regionIds:string[];
}
export interface ImageReferenceForm {
  id:string;
  label:string;
  /** Ordered view IDs. Identity is the stable id, never this array position. */
  viewIds:string[];
}
export interface ImageReferenceAvatar {
  id:string;
  label:string;
  /** Ordered form IDs. A source image may contain any number of avatars/forms. */
  formIds:string[];
}
export type ImageReferenceRelationKind='same-avatar'|'other-form'|'additional-view'|'detail-of';
export interface ImageReferenceRelation {
 id:string;
 kind:ImageReferenceRelationKind;
 sourceRegionId:string;
 targetRegionId:string;
}

export interface ImageReferenceDocument {
  format:'pakachi-image-reference';
  version:1;
  source:{sha256:string;width:number;height:number;asset?:{mediaType:'image/png'|'image/jpeg';data:string}};
  regions:ImageReferenceRegion[];
  views:ImageReferenceView[];
  forms:ImageReferenceForm[];
  avatars:ImageReferenceAvatar[];
 /** Optional for backwards compatibility with version-1 projects created before relation editing. */
 relations?:ImageReferenceRelation[];
 /** Explicit user-placed 2D semantic anchors in immutable source-image pixels. */
 landmarks?:ImageReferenceLandmark[];
 /** Optional pixel-bound silhouette, proportion, color and material-boundary observations. */
 observations?:ImageReferenceObservation[];
}
export interface ImageReferenceIssue {path:string;message:string}
export interface ImageReferenceReadiness {
  ready:boolean;
  issues:ImageReferenceIssue[];
}

const idPattern=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const hashPattern=/^[a-f0-9]{64}$/i;
const regionKinds=new Set<ImageRegionKind>(['avatar','form','view','detail','helper']);
const statuses=new Set<ImageRegionStatus>(['suggested','confirmed','ignored']);
const finite=(n:number)=>Number.isFinite(n);
const unique=(items:string[])=>new Set(items).size===items.length;
const cross=(a:{x:number;y:number},b:{x:number;y:number},c:{x:number;y:number})=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);

/** Reject degenerate and self-intersecting contours before they reach reconstruction. */
export function isValidImageReferencePolygon(points:Array<{x:number;y:number}>):boolean {
 if(points.length<3||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return false;
 const same=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6;
 for(let i=0;i<points.length;i++)if(same(points[i]!,points[(i+1)%points.length]!))return false;
 const intersects=(a:{x:number;y:number},b:{x:number;y:number},c:{x:number;y:number},d:{x:number;y:number})=>{
  const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
  return ((abC>1e-8&&abD< -1e-8)||(abC< -1e-8&&abD>1e-8))&&((cdA>1e-8&&cdB< -1e-8)||(cdA< -1e-8&&cdB>1e-8));
 };
 let twiceArea=0;
 for(let i=0;i<points.length;i++){
  const a=points[i]!,b=points[(i+1)%points.length]!;
  twiceArea+=a.x*b.y-b.x*a.y;
  for(let j=i+1;j<points.length;j++){
   if(j===(i+1)%points.length||i===(j+1)%points.length)continue;
   if(intersects(a,b,points[j]!,points[(j+1)%points.length]!))return false;
  }
 }
 return Math.abs(twiceArea)>=8;
}

/**
 * Split a simple polygon with a finite cut segment that crosses its boundary exactly twice.
 * Returns two independently valid contours; ambiguous/tangent/multi-crossing cuts are rejected.
 */
export function splitImageReferencePolygon(points:Array<{x:number;y:number}>,start:{x:number;y:number},end:{x:number;y:number}):[Array<{x:number;y:number}>,Array<{x:number;y:number}>]|undefined {
 if(!isValidImageReferencePolygon(points)||![start.x,start.y,end.x,end.y].every(Number.isFinite)||Math.hypot(end.x-start.x,end.y-start.y)<1e-6)return;
 const hits:Array<{edge:number;t:number;point:{x:number;y:number};cutT:number}>=[];
 for(let i=0;i<points.length;i++){
  const a=points[i]!,b=points[(i+1)%points.length]!;
  const rx=end.x-start.x,ry=end.y-start.y,sx=b.x-a.x,sy=b.y-a.y;
  const denominator=rx*sy-ry*sx;
  if(Math.abs(denominator)<1e-9)continue;
  const qx=a.x-start.x,qy=a.y-start.y;
  const cutT=(qx*sy-qy*sx)/denominator,edgeT=(qx*ry-qy*rx)/denominator;
  if(cutT>1e-8&&cutT<1-1e-8&&edgeT>=-1e-8&&edgeT<=1+1e-8){
   const point={x:start.x+cutT*rx,y:start.y+cutT*ry};
   if(!hits.some(hit=>Math.hypot(hit.point.x-point.x,hit.point.y-point.y)<1e-6))hits.push({edge:i,t:Math.max(0,Math.min(1,edgeT)),point,cutT});
  }
 }
 if(hits.length!==2)return;
 hits.sort((a,b)=>a.edge-b.edge||a.t-b.t);
 const [first,second]=hits;
 if(!first||!second||first.edge===second.edge&&Math.abs(first.t-second.t)<1e-8)return;
 const walk=(from:typeof first,to:typeof second)=>{
  const result=[from.point];
  let index=(from.edge+1)%points.length,guard=0;
  while(index!==(to.edge+1)%points.length&&guard++<=points.length){result.push(points[index]!);index=(index+1)%points.length;}
  result.push(to.point);return result;
 };
 const a=walk(first,second),b=walk(second,first);
 if(!isValidImageReferencePolygon(a)||!isValidImageReferencePolygon(b))return;
 const area=(ring:Array<{x:number;y:number}>)=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length]!;return sum+p.x*q.y-q.x*p.y;},0))/2;
 const originalArea=area(points),pieces=area(a)+area(b);
 if(Math.abs(originalArea-pieces)>Math.max(1e-5,originalArea*1e-6))return;
 return [a,b];
}

/**
 * Conservatively remove redundant contour vertices. Each removal must keep the contour
 * simple and stay within a small cumulative area-error budget; otherwise it is skipped.
 */
export function simplifyImageReferencePolygon(points:Array<{x:number;y:number}>,tolerance=1):Array<{x:number;y:number}> {
 if(!isValidImageReferencePolygon(points))throw new Error('invalid-polygon');
 if(!Number.isFinite(tolerance)||tolerance<=0)throw new Error('invalid-simplification-tolerance');
 const area=(ring:Array<{x:number;y:number}>)=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length]!;return sum+p.x*q.y-q.x*p.y;},0))/2;
 const distanceToSegment=(p:{x:number;y:number},a:{x:number;y:number},b:{x:number;y:number})=>{
  const dx=b.x-a.x,dy=b.y-a.y,lengthSquared=dx*dx+dy*dy;
  const t=lengthSquared===0?0:Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/lengthSquared));
  return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
 };
 const originalArea=area(points),areaBudget=Math.max(1e-6,originalArea*0.01);
 const result=points.map(p=>({...p}));
 while(result.length>3){
  let candidate=-1,bestDistance=Number.POSITIVE_INFINITY;
  for(let i=0;i<result.length;i++){
   const distance=distanceToSegment(result[i]!,result[(i+result.length-1)%result.length]!,result[(i+1)%result.length]!);
   if(distance<=tolerance&&distance<bestDistance){candidate=i;bestDistance=distance;}
  }
  if(candidate<0)break;
  const trial=result.filter((_,i)=>i!==candidate);
  if(!isValidImageReferencePolygon(trial)||Math.abs(originalArea-area(trial))>areaBudget)break;
  result.splice(candidate,1);
 }
 return result;
}

/**
 * Validate a polygon with zero or more disjoint interior rings. Holes must be
 * strictly inside the outer ring and must neither touch nor overlap any ring.
 */
export function isValidImageReferencePolygonWithHoles(points:Array<{x:number;y:number}>,holes:Array<Array<{x:number;y:number}>>=[]):boolean {
 if(!isValidImageReferencePolygon(points))return false;
 const inside=(p:{x:number;y:number},ring:Array<{x:number;y:number}>)=>{
  let result=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i]!,b=ring[j]!;
   if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
  }
  return result;
 };
 const onSegment=(p:{x:number;y:number},a:{x:number;y:number},b:{x:number;y:number})=>
  Math.abs(cross(a,b,p))<1e-8&&p.x>=Math.min(a.x,b.x)-1e-8&&p.x<=Math.max(a.x,b.x)+1e-8&&p.y>=Math.min(a.y,b.y)-1e-8&&p.y<=Math.max(a.y,b.y)+1e-8;
 const intersects=(a:{x:number;y:number},b:{x:number;y:number},c:{x:number;y:number},d:{x:number;y:number})=>{
  const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
  if(((abC>1e-8&&abD< -1e-8)||(abC< -1e-8&&abD>1e-8))&&((cdA>1e-8&&cdB< -1e-8)||(cdA< -1e-8&&cdB>1e-8)))return true;
  return onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
 };
 for(let h=0;h<holes.length;h++){
  const hole=holes[h]!;
  if(!isValidImageReferencePolygon(hole)||!hole.every(p=>inside(p,points)))return false;
  for(let i=0;i<hole.length;i++)for(let j=0;j<points.length;j++)if(intersects(hole[i]!,hole[(i+1)%hole.length]!,points[j]!,points[(j+1)%points.length]!))return false;
  for(let other=0;other<h;other++){
   const prior=holes[other]!;
   if(hole.some(p=>inside(p,prior))||prior.some(p=>inside(p,hole)))return false;
   for(let i=0;i<hole.length;i++)for(let j=0;j<prior.length;j++)if(intersects(hole[i]!,hole[(i+1)%hole.length]!,prior[j]!,prior[(j+1)%prior.length]!))return false;
  }
 }
 return true;
}

/** Move one polygon vertex in source pixels; invalid/self-crossing edits are rejected atomically. */
export function moveImageReferencePolygonVertex(region:ImageReferenceRegion,index:number,x:number,y:number,sourceWidth:number,sourceHeight:number):ImageReferenceRegion {
 if(region.geometry.type!=='polygon')throw new Error('polygon-edit-requires-polygon');
 if(!Number.isInteger(index)||index<0||index>=region.geometry.points.length)throw new Error('unknown-polygon-vertex');
 if(![x,y,sourceWidth,sourceHeight].every(Number.isFinite)||sourceWidth<=0||sourceHeight<=0)throw new Error('invalid-polygon-coordinate');
 const points=region.geometry.points.map(p=>({...p}));
 points[index]={x:Math.max(0,Math.min(sourceWidth,x)),y:Math.max(0,Math.min(sourceHeight,y))};
 if(!isValidImageReferencePolygonWithHoles(points,region.geometry.holes))return region;
 return {...region,geometry:{...region.geometry,points}};
}

/** Move an interior-ring vertex while preserving all ring relationships atomically. */
export function moveImageReferencePolygonHoleVertex(region:ImageReferenceRegion,ringIndex:number,index:number,x:number,y:number,sourceWidth:number,sourceHeight:number):ImageReferenceRegion {
 if(region.geometry.type!=='polygon')throw new Error('polygon-edit-requires-polygon');
 const current=region.geometry.holes??[];
 if(!Number.isInteger(ringIndex)||ringIndex<0||ringIndex>=current.length)throw new Error('unknown-polygon-hole');
 const ring=current[ringIndex]!;
 if(!Number.isInteger(index)||index<0||index>=ring.length)throw new Error('unknown-polygon-hole-vertex');
 if(![x,y,sourceWidth,sourceHeight].every(Number.isFinite)||sourceWidth<=0||sourceHeight<=0)throw new Error('invalid-polygon-coordinate');
 const holes=current.map(points=>points.map(p=>({...p})));
 holes[ringIndex]![index]={x:Math.max(0,Math.min(sourceWidth,x)),y:Math.max(0,Math.min(sourceHeight,y))};
 if(!isValidImageReferencePolygonWithHoles(region.geometry.points,holes))return region;
 return {...region,geometry:{...region.geometry,holes}};
}

/** Structural validation allows incomplete drafts while the user is drawing and linking. */
export function validateImageReferenceDocument(value:ImageReferenceDocument):ImageReferenceIssue[] {
  const issues:ImageReferenceIssue[]=[];
  if(!value||value.format!=='pakachi-image-reference'||value.version!==1)return [{path:'$',message:'Unbekanntes Bildreferenzformat oder Version.'}];
  const {source}=value;
  if(!source||!hashPattern.test(source.sha256))issues.push({path:'source.sha256',message:'Erwartet wird ein SHA-256-Hash des unveränderten Quellbildes.'});
  if(!source||!Number.isSafeInteger(source.width)||source.width<=0||!Number.isSafeInteger(source.height)||source.height<=0)issues.push({path:'source',message:'Quellbild benötigt positive ganzzahlige Pixelmaße.'});
  const ids=new Set<string>();
  const addId=(id:string,path:string)=>{if(typeof id!=='string'||!idPattern.test(id))issues.push({path,message:'Ungültige stabile ID.'});else if(ids.has(id))issues.push({path,message:'ID ist nicht eindeutig.'});else ids.add(id);};
  const regions=new Map<string,ImageReferenceRegion>();
  for(const [i,r] of value.regions.entries()){
    const p=`regions[${i}]`;addId(r.id,p+'.id');regions.set(r.id,r);
    if(!r.label.trim())issues.push({path:p+'.label',message:'Beschriftung darf nicht leer sein.'});
    if(!regionKinds.has(r.kind))issues.push({path:p+'.kind',message:'Unbekannte Regionsart.'});
    if(!statuses.has(r.status))issues.push({path:p+'.status',message:'Unbekannter Bestätigungsstatus.'});
    if(r.confidence!==undefined&&(!finite(r.confidence)||r.confidence<0||r.confidence>1))issues.push({path:p+'.confidence',message:'Konfidenz muss zwischen 0 und 1 liegen.'});
    if(r.confidenceEvidence!==undefined&&(!Array.isArray(r.confidenceEvidence)||r.confidenceEvidence.length>16||r.confidenceEvidence.some(item=>typeof item!=='string'||item.length>80)))issues.push({path:p+'.confidenceEvidence',message:'Geometrische Evidenz muss eine begrenzte Liste kurzer Textmerkmale sein.'});
    const point=(x:number,y:number,path:string)=>{if(!finite(x)||!finite(y)||x<0||y<0||x>source.width||y>source.height)issues.push({path,message:'Punkt liegt außerhalb des Quellbildes oder ist nicht endlich.'});};
    if(r.geometry.type==='rectangle'){
      const g=r.geometry;
      if(![g.x,g.y,g.width,g.height].every(finite)||g.width<=0||g.height<=0||g.x<0||g.y<0||g.x+g.width>source.width||g.y+g.height>source.height)issues.push({path:p+'.geometry',message:'Rechteck muss vollständig innerhalb des Quellbildes liegen und positive Fläche haben.'});
    }else if(r.geometry.type==='polygon'){
      if(!isValidImageReferencePolygonWithHoles(r.geometry.points,r.geometry.holes))issues.push({path:p+'.geometry.points',message:'Polygon muss mindestens drei unterschiedliche Punkte, eine Mindestfläche und keine Selbstüberschneidungen haben.'});
      r.geometry.points.forEach((q,j)=>point(q.x,q.y,`${p}.geometry.points[${j}]`));
    }else issues.push({path:p+'.geometry',message:'Unbekannter Geometrietyp.'});
  }
  const views=new Map<string,ImageReferenceView>();
  for(const [i,v] of value.views.entries()){
    const p=`views[${i}]`;addId(v.id,p+'.id');views.set(v.id,v);
    if(!v.label.trim())issues.push({path:p+'.label',message:'Ansichtsname darf nicht leer sein.'});
    if(!unique(v.regionIds))issues.push({path:p+'.regionIds',message:'Regions-IDs dürfen innerhalb einer Ansicht nicht doppelt vorkommen.'});
    for(const id of v.regionIds)if(!regions.has(id))issues.push({path:p+'.regionIds',message:`Unbekannte Bildregion: ${id}`});
  }
  const forms=new Map<string,ImageReferenceForm>();
  for(const [i,f] of value.forms.entries()){
    const p=`forms[${i}]`;addId(f.id,p+'.id');forms.set(f.id,f);
    if(!f.label.trim())issues.push({path:p+'.label',message:'Formname darf nicht leer sein.'});
    if(!unique(f.viewIds))issues.push({path:p+'.viewIds',message:'Ansichts-IDs dürfen innerhalb einer Form nicht doppelt vorkommen.'});
    for(const id of f.viewIds)if(!views.has(id))issues.push({path:p+'.viewIds',message:`Unbekannte Ansicht: ${id}`});
  }
  for(const [i,a] of value.avatars.entries()){
    const p=`avatars[${i}]`;addId(a.id,p+'.id');
    if(!a.label.trim())issues.push({path:p+'.label',message:'Avatarname darf nicht leer sein.'});
    if(!unique(a.formIds))issues.push({path:p+'.formIds',message:'Form-IDs dürfen innerhalb eines Avatars nicht doppelt vorkommen.'});
    for(const id of a.formIds)if(!forms.has(id))issues.push({path:p+'.formIds',message:`Unbekannte Form: ${id}`});
  }
  // A view or form cannot silently belong to multiple parents; users must create an explicit
  // separate node when the same source pixels intentionally serve another grouping.
  const viewParents=new Map<string,string>(),formParents=new Map<string,string>(),regionParents=new Map<string,string>();
  for(const f of value.forms)for(const id of f.viewIds){const previous=viewParents.get(id);if(previous)issues.push({path:`forms.${f.id}.viewIds`,message:`Ansicht ${id} ist bereits Form ${previous} zugeordnet.`});else viewParents.set(id,f.id);}
  for(const a of value.avatars)for(const id of a.formIds){const previous=formParents.get(id);if(previous)issues.push({path:`avatars.${a.id}.formIds`,message:`Form ${id} ist bereits Avatar ${previous} zugeordnet.`});else formParents.set(id,a.id);}
  for(const v of value.views)for(const id of v.regionIds){const previous=regionParents.get(id);if(previous)issues.push({path:`views.${v.id}.regionIds`,message:`Region ${id} ist bereits Ansicht ${previous} zugeordnet.`});else regionParents.set(id,v.id);}
  for(const [id,r] of regions){if(r.status==='ignored'&&regionParents.has(id))issues.push({path:`regions.${id}.status`,message:'Ignorierte Region darf keiner Ansicht zugeordnet sein.'});}
  const landmarks=value.landmarks??[];
  if(!Array.isArray(landmarks)||landmarks.length>10000)issues.push({path:'landmarks',message:'Maximal 10.000 2D-Landmarken sind zulässig.'});
  else for(const [i,landmark] of landmarks.entries()){
    const p=`landmarks[${i}]`;
    addId(landmark.id,p+'.id');
    if(!regions.has(landmark.regionId))issues.push({path:p+'.regionId',message:'Landmarke verweist auf eine unbekannte Bildregion.'});
    const semanticId=/^[a-z0-9][a-z0-9_-]{0,127}$/;
    if(typeof landmark.partId!=='string'||!semanticId.test(landmark.partId))issues.push({path:p+'.partId',message:'Anatomische Part-ID ist ungültig.'});
    if(landmark.surfaceLayerId!=null&&(typeof landmark.surfaceLayerId!=='string'||!semanticId.test(landmark.surfaceLayerId)))issues.push({path:p+'.surfaceLayerId',message:'Oberflächen-Layer-ID ist ungültig.'});
    if(typeof landmark.poseId!=='string'||!semanticId.test(landmark.poseId))issues.push({path:p+'.poseId',message:'Pose-ID ist ungültig.'});
    if(!finite(landmark.x)||!finite(landmark.y)||landmark.x<0||landmark.y<0||landmark.x>source.width||landmark.y>source.height)issues.push({path:p+'.position',message:'Landmarke liegt außerhalb des Quellbildes.'});
    if(!finite(landmark.radiusPx)||landmark.radiusPx<=0||landmark.radiusPx>Math.max(source.width,source.height)*2)issues.push({path:p+'.radiusPx',message:'Landmarkenradius muss positiv und begrenzt sein.'});
  }
  const observations=value.observations??[];
  const landmarkById=new Map(Array.isArray(landmarks)?landmarks.map(item=>[item.id,item]):[]);
  if(!Array.isArray(observations)||observations.length>10000)issues.push({path:'observations',message:'Maximal 10.000 Bildbeobachtungen sind zulässig.'});
  else for(const [i,observation] of observations.entries()){
    const p=`observations[${i}]`;addId(observation.id,p+'.id');
    if(!regions.has(observation.regionId))issues.push({path:p+'.regionId',message:'Beobachtung verweist auf eine unbekannte Bildregion.'});
    if(observation.confidence!==undefined&&(!finite(observation.confidence)||observation.confidence<0||observation.confidence>1))issues.push({path:p+'.confidence',message:'Konfidenz muss zwischen 0 und 1 liegen.'});
    if(observation.kind==='silhouette'){
      if(regions.get(observation.regionId)?.geometry.type!=='polygon')issues.push({path:p+'.regionId',message:'Silhouettenbeobachtung benötigt eine Polygonkontur.'});
    }else if(observation.kind==='proportion'){
      const from=landmarkById.get(observation.fromLandmarkId),to=landmarkById.get(observation.toLandmarkId);
      if(!from||!to)issues.push({path:p+'.landmarks',message:'Proportionsmessung benötigt zwei vorhandene Landmarken.'});
      else if(observation.fromLandmarkId===observation.toLandmarkId||Math.hypot(from.x-to.x,from.y-to.y)<1e-6)issues.push({path:p+'.landmarks',message:'Proportionsmessung benötigt zwei unterschiedliche Landmarkenpositionen.'});
      else if(from.regionId!==observation.regionId||to.regionId!==observation.regionId)issues.push({path:p+'.landmarks',message:'Proportionslandmarken müssen zur angegebenen Bildregion gehören.'});
      if(!finite(observation.ratio)||observation.ratio<=0||observation.ratio>1000)issues.push({path:p+'.ratio',message:'Proportionsverhältnis muss positiv und begrenzt sein.'});
    }else if(observation.kind==='color-sample'){
      if(!finite(observation.x)||!finite(observation.y)||observation.x<0||observation.y<0||observation.x>source.width||observation.y>source.height)issues.push({path:p+'.position',message:'Farbprobe liegt außerhalb des Quellbildes.'});
      if(!Array.isArray(observation.rgba)||observation.rgba.length!==4||observation.rgba.some(channel=>!Number.isInteger(channel)||channel<0||channel>255))issues.push({path:p+'.rgba',message:'Farbprobe benötigt vier ganzzahlige RGBA-Kanäle zwischen 0 und 255.'});
      if(!finite(observation.radiusPx)||observation.radiusPx<=0||observation.radiusPx>Math.max(source.width,source.height))issues.push({path:p+'.radiusPx',message:'Radius der Farbprobe muss positiv und begrenzt sein.'});
    }else if(observation.kind==='material-boundary'){
      if(!Array.isArray(observation.points)||observation.points.length<2||observation.points.length>2048)issues.push({path:p+'.points',message:'Materialgrenze benötigt 2 bis 2.048 Pixelpunkte.'});
      else observation.points.forEach((point,j)=>{if(!finite(point.x)||!finite(point.y)||point.x<0||point.y<0||point.x>source.width||point.y>source.height)issues.push({path:`${p}.points[${j}]`,message:'Materialgrenzenpunkt liegt außerhalb des Quellbildes.'});});
    }else issues.push({path:p+'.kind',message:'Unbekannter Beobachtungstyp.'});
  }
  const relationKinds=new Set<ImageReferenceRelationKind>(['same-avatar','other-form','additional-view','detail-of']);
  const seenRelations=new Set<string>();
  for(const [i,relation] of (value.relations??[]).entries()){
    const p=`relations[${i}]`;addId(relation.id,p+'.id');
    if(!relationKinds.has(relation.kind))issues.push({path:p+'.kind',message:'Unbekannter Beziehungstyp.'});
    const from=regions.get(relation.sourceRegionId),to=regions.get(relation.targetRegionId);
    if(!from)issues.push({path:p+'.sourceRegionId',message:`Unbekannte Quellregion: ${relation.sourceRegionId}`});
    if(!to)issues.push({path:p+'.targetRegionId',message:`Unbekannte Zielregion: ${relation.targetRegionId}`});
    if(relation.sourceRegionId===relation.targetRegionId)issues.push({path:p,message:'Eine Region kann keine Beziehung zu sich selbst haben.'});
    if(from?.status==='ignored'||to?.status==='ignored')issues.push({path:p,message:'Ignorierte Regionen dürfen nicht an Beziehungen teilnehmen.'});
    const symmetric=relation.kind!=='detail-of';
    const pair=symmetric?[relation.kind,...[relation.sourceRegionId,relation.targetRegionId].sort()].join(':'):[relation.kind,relation.sourceRegionId,relation.targetRegionId].join(':');
    if(seenRelations.has(pair))issues.push({path:p,message:'Diese Beziehung ist bereits vorhanden.'});else seenRelations.add(pair);
  }
  return issues;
}

/** Conservative, non-binding proposals derived only from the explicitly assigned hierarchy. */
export function suggestImageReferenceRelations(document:ImageReferenceDocument):ImageReferenceRelation[] {
 const regions=new Map(document.regions.map(region=>[region.id,region]));
 const existing=new Set((document.relations??[]).map(r=>r.kind==='detail-of'?[r.kind,r.sourceRegionId,r.targetRegionId].join(':'):[r.kind,...[r.sourceRegionId,r.targetRegionId].sort()].join(':')));
 const result:ImageReferenceRelation[]=[];
 const add=(kind:ImageReferenceRelationKind,sourceRegionId:string,targetRegionId:string)=>{
  if(sourceRegionId===targetRegionId||regions.get(sourceRegionId)?.status==='ignored'||regions.get(targetRegionId)?.status==='ignored')return;
  const key=kind==='detail-of'?[kind,sourceRegionId,targetRegionId].join(':'):[kind,...[sourceRegionId,targetRegionId].sort()].join(':');
  if(existing.has(key)||result.some(r=>(r.kind==='detail-of'?[r.kind,r.sourceRegionId,r.targetRegionId].join(':'):[r.kind,...[r.sourceRegionId,r.targetRegionId].sort()].join(':'))===key))return;
  result.push({id:'suggest-'+(result.length+1),kind,sourceRegionId,targetRegionId});
 };
 for(const avatar of document.avatars){const forms=avatar.formIds.map(id=>document.forms.find(f=>f.id===id)).filter((f):f is ImageReferenceForm=>!!f);for(let i=0;i<forms.length;i++)for(let j=i+1;j<forms.length;j++){const lv=forms[i]!.viewIds.map(id=>document.views.find(v=>v.id===id)).find(v=>v?.regionIds.some(id=>regions.get(id)?.status!=='ignored'));const rv=forms[j]!.viewIds.map(id=>document.views.find(v=>v.id===id)).find(v=>v?.regionIds.some(id=>regions.get(id)?.status!=='ignored'));const a=lv?.regionIds.find(id=>regions.get(id)?.status!=='ignored'),b=rv?.regionIds.find(id=>regions.get(id)?.status!=='ignored');if(a&&b)add('other-form',a,b);}}
 for(const form of document.forms)for(let i=0;i<form.viewIds.length;i++)for(let j=i+1;j<form.viewIds.length;j++){const a=document.views.find(v=>v.id===form.viewIds[i])?.regionIds.find(id=>regions.get(id)?.status!=='ignored'),b=document.views.find(v=>v.id===form.viewIds[j])?.regionIds.find(id=>regions.get(id)?.status!=='ignored');if(a&&b)add('additional-view',a,b);}
 for(const view of document.views){const rs=view.regionIds.map(id=>regions.get(id)).filter((r):r is ImageReferenceRegion=>!!r&&r.status!=='ignored'),anchors=rs.filter(r=>r.kind!=='detail'&&r.kind!=='helper');if(anchors.length===1)for(const detail of rs.filter(r=>r.kind==='detail'))add('detail-of',detail.id,anchors[0]!.id);}
 return result;
}

/** Add an explicit, stable relation between two image regions without mutating the document. */
export function addImageReferenceRelation(document:ImageReferenceDocument,relation:ImageReferenceRelation):ImageReferenceDocument {
 const next={...document,relations:[...(document.relations??[]),{...relation}]};
 const issues=validateImageReferenceDocument(next);
 if(issues.length)throw new Error(`invalid-image-reference-relation:${issues.map(issue=>issue.path).join(',')}`);
 return next;
}

/** Remove a relation by stable ID; all other IDs and hierarchy links remain untouched. */
export function removeImageReferenceRelation(document:ImageReferenceDocument,relationId:string):ImageReferenceDocument {
 const relations=document.relations??[];
 if(!relations.some(relation=>relation.id===relationId))throw new Error('unknown-image-reference-relation');
 return {...document,relations:relations.filter(relation=>relation.id!==relationId)};
}

/** Verify that an embedded source asset matches its declared image type and SHA-256. */
export async function verifyImageReferenceSourceAsset(value:ImageReferenceDocument):Promise<boolean>{
 const asset=value.source.asset;if(!asset)return true;
 try{
  if(!['image/png','image/jpeg'].includes(asset.mediaType)||typeof atob!=='function'||!globalThis.crypto?.subtle)return false;
  const binary=atob(asset.data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  if(bytes.byteLength===0||bytes.byteLength>20*1024*1024)return false;
  const signature=asset.mediaType==='image/png'?[137,80,78,71,13,10,26,10]:[255,216,255];
  if(!signature.every((byte,index)=>bytes[index]===byte))return false;
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const hash=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
  return hash===value.source.sha256.toLowerCase();
 }catch{return false;}
}

/** Generation is blocked until every hierarchy link and source region is explicit and confirmed. */
export function checkImageReferenceReadiness(value:ImageReferenceDocument):ImageReferenceReadiness {
  const issues=validateImageReferenceDocument(value);
  if(issues.length)return {ready:false,issues};
  if(value.avatars.length===0)issues.push({path:'avatars',message:'Mindestens einen Avatar zuordnen.'});
  const assigned=new Set(value.views.flatMap(v=>v.regionIds));
  for(const r of value.regions){
    if(r.status==='suggested')issues.push({path:`regions.${r.id}.status`,message:'Regionsvorschlag erst bestätigen oder ausdrücklich ignorieren.'});
    else if(r.status==='confirmed'&&!assigned.has(r.id))issues.push({path:`regions.${r.id}`,message:'Bestätigte Region muss einer Ansicht zugeordnet oder ausdrücklich ignoriert werden.'});
  }
  for(const a of value.avatars){
    if(a.formIds.length===0)issues.push({path:`avatars.${a.id}.formIds`,message:'Diesem Avatar mindestens eine Form zuordnen.'});
    for(const formId of a.formIds){
      const f=value.forms.find(x=>x.id===formId)!;
      if(f.viewIds.length===0)issues.push({path:`forms.${f.id}.viewIds`,message:'Dieser Form mindestens eine Ansicht zuordnen.'});
      for(const viewId of f.viewIds){
        const v=value.views.find(x=>x.id===viewId)!;
        if(v.regionIds.length===0)issues.push({path:`views.${v.id}.regionIds`,message:'Dieser Ansicht mindestens eine Bildregion zuordnen.'});
        for(const regionId of v.regionIds)if(value.regions.find(x=>x.id===regionId)!.status!=='confirmed')issues.push({path:`regions.${regionId}.status`,message:'Nur bestätigte Bildregionen dürfen verwendet werden.'});
      }
    }
  }
  return {ready:issues.length===0,issues};
}


export interface RectangleEdit {x?:number;y?:number;width?:number;height?:number}

/** Apply source-pixel rectangle edits while preserving a minimum visible area and image bounds. */
export function editImageReferenceRectangle(region:ImageReferenceRegion,sourceWidth:number,sourceHeight:number,edit:RectangleEdit):ImageReferenceRegion {
  if(region.geometry.type!=='rectangle')throw new Error('rectangle-edit-requires-rectangle');
  if(!Number.isSafeInteger(sourceWidth)||!Number.isSafeInteger(sourceHeight)||sourceWidth<=0||sourceHeight<=0)throw new Error('invalid-source-size');
  const current=region.geometry,min=4;
  const width=Math.max(min,Math.min(sourceWidth,edit.width??current.width));
  const height=Math.max(min,Math.min(sourceHeight,edit.height??current.height));
  const x=Math.max(0,Math.min(sourceWidth-width,edit.x??current.x));
  const y=Math.max(0,Math.min(sourceHeight-height,edit.y??current.y));
  return {...region,geometry:{type:'rectangle',x,y,width,height}};
}

/** Reorder a region without changing its stable ID or any grouping references. */
export function reorderImageReferenceRegions<T>(regions:T[],regionId:string,offset:-1|1,getId:(region:T)=>string=(region)=>(region as {id:string}).id):T[] {
  const index=regions.findIndex(region=>getId(region)===regionId);
  if(index<0)throw new Error('unknown-image-region');
  const target=index+offset;
  if(target<0||target>=regions.length)return regions.slice();
  const reordered=regions.slice();
  [reordered[index],reordered[target]]=[reordered[target]!,reordered[index]!];
  return reordered;
}


export type RectangleHandle='n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'nw';

/** Move a rectangle by a pointer delta in source-image pixels. */
export function moveImageReferenceRectangle(region:ImageReferenceRegion,sourceWidth:number,sourceHeight:number,dx:number,dy:number):ImageReferenceRegion {
  if(region.geometry.type!=='rectangle')throw new Error('rectangle-edit-requires-rectangle');
  const g=region.geometry;
  return editImageReferenceRectangle(region,sourceWidth,sourceHeight,{x:g.x+dx,y:g.y+dy});
}

/** Resize from one of eight edge/corner handles using source-image pixel deltas. */
export function resizeImageReferenceRectangle(region:ImageReferenceRegion,sourceWidth:number,sourceHeight:number,handle:RectangleHandle,dx:number,dy:number):ImageReferenceRegion {
  if(region.geometry.type!=='rectangle')throw new Error('rectangle-edit-requires-rectangle');
  const g=region.geometry,min=4;
  let left=g.x,top=g.y,right=g.x+g.width,bottom=g.y+g.height;
  if(handle.includes('w'))left=Math.max(0,Math.min(right-min,left+dx));
  if(handle.includes('e'))right=Math.min(sourceWidth,Math.max(left+min,right+dx));
  if(handle.includes('n'))top=Math.max(0,Math.min(bottom-min,top+dy));
  if(handle.includes('s'))bottom=Math.min(sourceHeight,Math.max(top+min,bottom+dy));
  return editImageReferenceRectangle(region,sourceWidth,sourceHeight,{x:left,y:top,width:right-left,height:bottom-top});
}


/** Split a rectangular or simple polygon region into two polygons; holes remain explicitly unsupported. */
export function splitImageReferenceRegion(region:ImageReferenceRegion,start:{x:number;y:number},end:{x:number;y:number}):[ImageReferenceRegion,ImageReferenceRegion]|undefined {
 let points:Array<{x:number;y:number}>;
 if(region.geometry.type==='rectangle'){
  const {x,y,width,height}=region.geometry;
  if(![x,y,width,height].every(Number.isFinite)||width<4||height<4)return;
  points=[{x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}];
 }else{
  if(region.geometry.holes?.length)return;
  points=region.geometry.points;
 }
 const pieces=splitImageReferencePolygon(points,start,end);
 if(!pieces)return;
 return pieces.map((contour,index)=>({
  ...region,id:region.id+'-split-'+(index+1),label:region.label+' ('+(index+1)+')',status:'suggested',
  geometry:{type:'polygon',points:contour.map(point=>({...point}))}
 })) as [ImageReferenceRegion,ImageReferenceRegion];
}
