import { validateImageReferenceDocument } from './image-reference.ts';
import type { ImageReferenceDocument, ImageReferenceRegion } from './image-reference.ts';

/**
 * 2D evidence contract. Semantic IDs are shared with later 3D manifests;
 * coordinates and geometry remain source-image pixels and are never treated as 3D.
 */
export interface Cluster2DSemanticPart { id:string; label:string; parentPartId:string|null }
export interface Cluster2DSurfaceLayer { id:string; label:string; partId:string|null }
export interface Cluster2DSemanticCatalog {
  schemaVersion:1;
  /** Stable character identity; animal/work forms may share this catalog. */
  characterId:string;
  parts:Cluster2DSemanticPart[];
  surfaceLayers:Cluster2DSurfaceLayer[];
}

/** Shared starter taxonomy. IDs are semantic, not mesh names or ordering keys. */
export function createPaKaChiSemanticCatalog():Cluster2DSemanticCatalog {
 const parts:Cluster2DSemanticPart[]=[
  {id:'body',label:'Body',parentPartId:null},{id:'torso',label:'Torso',parentPartId:'body'},
  {id:'chest',label:'Chest',parentPartId:'torso'},{id:'pelvis',label:'Pelvis',parentPartId:'body'},
  {id:'neck',label:'Neck',parentPartId:'torso'},{id:'head',label:'Head',parentPartId:'neck'},
  {id:'muzzle',label:'Muzzle',parentPartId:'head'},{id:'ears',label:'Ears',parentPartId:'head'},
  {id:'eyes',label:'Eyes',parentPartId:'head'},{id:'eyelids',label:'Eyelids',parentPartId:'eyes'},
  {id:'mouth',label:'Mouth',parentPartId:'muzzle'},{id:'shoulders',label:'Shoulders',parentPartId:'torso'},
  {id:'forelimbs',label:'Forelimbs',parentPartId:'shoulders'},{id:'upper-arms',label:'Upper arms',parentPartId:'forelimbs'},
  {id:'forearms',label:'Forearms',parentPartId:'upper-arms'},{id:'hands',label:'Hands',parentPartId:'forearms'},
  {id:'paws',label:'Paws',parentPartId:'forelimbs'},{id:'digits',label:'Fingers and toes',parentPartId:'hands'},
  {id:'hips',label:'Hips',parentPartId:'pelvis'},{id:'hindlimbs',label:'Hindlimbs',parentPartId:'hips'},
  {id:'thighs',label:'Thighs',parentPartId:'hindlimbs'},{id:'lower-legs',label:'Lower legs',parentPartId:'thighs'},
  {id:'feet',label:'Feet',parentPartId:'lower-legs'},{id:'tail',label:'Tail',parentPartId:'body'},
  {id:'tail-tip',label:'Tail tip',parentPartId:'tail'}
 ];
 const surfaceLayers:Cluster2DSurfaceLayer[]=[
  {id:'fur',label:'Fur',partId:null},{id:'skin',label:'Skin',partId:null},
  {id:'armor',label:'Armor and hard covers',partId:null},{id:'mechanics',label:'Mechanical joints and hardware',partId:null},
  {id:'emissive',label:'Green emissive elements',partId:null},{id:'eyes',label:'Eye surfaces',partId:'eyes'},
  {id:'claws',label:'Claws',partId:null}
 ];
 return {schemaVersion:1,characterId:'pakachi',parts,surfaceLayers};
}
export interface Cluster2DLandmarkSeed {
  id:string;
  partId:string;
  surfaceLayerId?:string|null;
  avatarId:string;
  formId:string;
  viewId:string;
  /** Pose is explicit: landmarks from different animation frames are not fused. */
  poseId:string;
  x:number;
  y:number;
  radiusPx:number;
}
export interface Cluster2DClassificationOptions { ambiguityMargin?:number; maxRegions?:number; maxSeeds?:number }
export interface Cluster2DRegionAssignment {
  regionId:string;
  avatarId:string;
  formId:string;
  viewId:string;
  poseId:string;
  partId:string|null;
  surfaceLayerId:string|null;
  landmarkIds:string[];
  origin:'automatic';
  policy:'recomputable';
  reviewStatus:'suggested'|'unresolved';
  confidence:number;
  reason:string;
}
export interface Cluster2DClassificationReport {
  assignments:Cluster2DRegionAssignment[];
  classified:number;
  ambiguous:number;
  outsideEvidence:number;
}

const idPattern=/^[a-z0-9][a-z0-9_-]{0,127}$/;
const finite=(n:number)=>Number.isFinite(n);
const unique=(values:string[])=>new Set(values).size===values.length;

export function validateCluster2DSemanticCatalog(value:unknown):string[] {
  const errors:string[]=[];
  if(!value||typeof value!=='object'||Array.isArray(value))return ['catalog.object'];
  const c=value as Record<string,unknown>;
  if(c.schemaVersion!==1)errors.push('catalog.version');
  if(typeof c.characterId!=='string'||!idPattern.test(c.characterId))errors.push('catalog.character');
  if(!Array.isArray(c.parts)||!Array.isArray(c.surfaceLayers))return [...errors,'catalog.arrays'];
  const parts=c.parts as Cluster2DSemanticPart[],layers=c.surfaceLayers as Cluster2DSurfaceLayer[];
  const partIds=parts.map(p=>p&&p.id),layerIds=layers.map(l=>l&&l.id);
  if(partIds.some(id=>typeof id!=='string'||!idPattern.test(id))||!unique(partIds as string[]))errors.push('catalog.part-ids');
  if(layerIds.some(id=>typeof id!=='string'||!idPattern.test(id))||!unique(layerIds as string[]))errors.push('catalog.layer-ids');
  const known=new Set(partIds as string[]);
  for(const p of parts){
    if(!p||typeof p.label!=='string'||!p.label.trim())errors.push('catalog.part-label');
    if(p.parentPartId!==null&&!known.has(p.parentPartId))errors.push('catalog.part-parent');
  }
  for(const p of parts){const seen=new Set<string>();let current:Cluster2DSemanticPart|undefined=p;while(current?.parentPartId){if(seen.has(current.id)){errors.push('catalog.part-cycle');break;}seen.add(current.id);current=parts.find(item=>item.id===current!.parentPartId);}}
  for(const l of layers){
    if(!l||typeof l.label!=='string'||!l.label.trim())errors.push('catalog.layer-label');
    if(l?.partId!==null&&!known.has(l?.partId))errors.push('catalog.layer-part');
  }
  return errors;
}

function regionBounds(region:ImageReferenceRegion):{x:number;y:number;width:number;height:number}{
 const g=region.geometry;
 if(g.type==='rectangle')return {x:g.x,y:g.y,width:g.width,height:g.height};
 const xs=g.points.map(p=>p.x),ys=g.points.map(p=>p.y);
 return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
}
function contains(region:ImageReferenceRegion,x:number,y:number):boolean{
 const g=region.geometry;
 if(g.type==='rectangle')return x>=g.x&&x<=g.x+g.width&&y>=g.y&&y<=g.y+g.height;
 const inside=(ring:readonly {x:number;y:number}[])=>{
  let hit=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i]!,b=ring[j]!;
   if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
  }
  return hit;
 };
 return inside(g.points)&&!(g.holes??[]).some(h=>inside(h));
}

/**
 * Classifies confirmed image regions from caller-placed 2D semantic landmarks.
 * Only matching avatar/form/view/pose evidence is compared. Every output remains
 * a suggestion; ambiguous and unsupported regions stay unresolved.
 */
export function proposeCluster2DRegionAssignments(
 document:ImageReferenceDocument,
 catalog:Cluster2DSemanticCatalog,
 seeds:readonly Cluster2DLandmarkSeed[],
 options:Cluster2DClassificationOptions={}
):Cluster2DClassificationReport {
 const documentIssues=validateImageReferenceDocument(document);
 if(documentIssues.length)throw new Error('Invalid image reference document: '+documentIssues.map(x=>x.path).join(', '));
 const catalogIssues=validateCluster2DSemanticCatalog(catalog);
 if(catalogIssues.length)throw new Error('Invalid 2D semantic catalog: '+catalogIssues.join(', '));
 const ambiguityMargin=options.ambiguityMargin??0.15;
 const maxRegions=options.maxRegions??2000,maxSeeds=options.maxSeeds??10000;
 if(!finite(ambiguityMargin)||ambiguityMargin<0||ambiguityMargin>=1||
    !Number.isSafeInteger(maxRegions)||maxRegions<1||!Number.isSafeInteger(maxSeeds)||maxSeeds<1)throw new Error('Invalid 2D classifier limits.');
 if(document.regions.length>maxRegions||seeds.length>maxSeeds)throw new Error('2D classification input exceeds configured limits.');
 const parts=new Set(catalog.parts.map(p=>p.id)),layers=new Map(catalog.surfaceLayers.map(l=>[l.id,l]));
 const avatarForms=new Map<string,Set<string>>(),formViews=new Map<string,string>();
 for(const avatar of document.avatars)for(const formId of avatar.formIds)avatarForms.set(avatar.id,new Set([...(avatarForms.get(avatar.id)??[]),formId]));
 for(const form of document.forms)for(const viewId of form.viewIds)formViews.set(viewId,form.id);
 const regionViews=new Map<string,string>();
 for(const view of document.views)for(const regionId of view.regionIds)regionViews.set(regionId,view.id);
 for(const seed of seeds){
  if(!seed||!idPattern.test(seed.id)||!parts.has(seed.partId)||!idPattern.test(seed.avatarId)||!idPattern.test(seed.formId)||
     !idPattern.test(seed.viewId)||!idPattern.test(seed.poseId)||![seed.x,seed.y,seed.radiusPx].every(finite)||seed.radiusPx<=0||
     (seed.surfaceLayerId!=null&&!layers.has(seed.surfaceLayerId)))throw new Error('Invalid 2D landmark seed.');
  if(!avatarForms.get(seed.avatarId)?.has(seed.formId)||formViews.get(seed.viewId)!==seed.formId)throw new Error('2D landmark seed has inconsistent avatar/form/view provenance.');
  if(seed.surfaceLayerId!=null&&layers.get(seed.surfaceLayerId)?.partId!=null&&layers.get(seed.surfaceLayerId)?.partId!==seed.partId)throw new Error('2D landmark seed surface layer belongs to a different anatomical part.');
  if(seed.x<0||seed.y<0||seed.x>document.source.width||seed.y>document.source.height)throw new Error('2D landmark seed is outside the source image.');
 }
 if(!unique(seeds.map(s=>s.id)))throw new Error('Duplicate 2D landmark seed ID.');
 const eligible=document.regions.filter(r=>r.status==='confirmed'&&regionViews.has(r.id));
 const assignments:Cluster2DRegionAssignment[]=[];
 let classified=0,ambiguous=0,outsideEvidence=0;
 for(const region of eligible){
  const viewId=regionViews.get(region.id)!;
  const formId=document.forms.find(f=>f.viewIds.includes(viewId))!.id;
  const avatarId=document.avatars.find(a=>a.formIds.includes(formId))!.id;
  const b=regionBounds(region),center={x:b.x+b.width/2,y:b.y+b.height/2};
  const candidates=seeds.filter(s=>s.avatarId===avatarId&&s.formId===formId&&s.viewId===viewId&&contains(region,s.x,s.y));
  const poses=new Set(candidates.map(s=>s.poseId));
  if(poses.size>1){ambiguous++;assignments.push({regionId:region.id,avatarId,formId,viewId,poseId:'unresolved',partId:null,surfaceLayerId:null,landmarkIds:[],origin:'automatic',policy:'recomputable',reviewStatus:'unresolved',confidence:0,reason:'Landmarks from different poses cannot be fused into one 2D region.'});continue;}
  // Composite crops must not be collapsed to whichever landmark is nearest.
  const semanticTargets=new Set(candidates.map(seed=>seed.partId+'|'+(seed.surfaceLayerId??'')));
  if(semanticTargets.size>1){
   ambiguous++;
   assignments.push({regionId:region.id,avatarId,formId,viewId,poseId:candidates[0]!.poseId,partId:null,surfaceLayerId:null,landmarkIds:[],origin:'automatic',policy:'recomputable',reviewStatus:'unresolved',confidence:0,reason:'Region contains multiple anatomical or surface-layer targets; split or review it explicitly.'});
   continue;
  }
  const byPart=new Map<string,{score:number;layer:string|null;ids:string[]}>();
  for(const seed of candidates){
   const score=Math.hypot(center.x-seed.x,center.y-seed.y)/seed.radiusPx;
   const prior=byPart.get(seed.partId);
   if(!prior||score<prior.score)byPart.set(seed.partId,{score,layer:seed.surfaceLayerId??null,ids:[seed.id]});
   else if(score===prior.score)prior.ids.push(seed.id);
  }
  const ranked=[...byPart.entries()].map(([partId,v])=>({partId,...v})).sort((a,b)=>a.score-b.score||a.partId.localeCompare(b.partId));
  const best=ranked[0],second=ranked[1];
  const separated=!!best&&(!second||second.score-best.score>=ambiguityMargin*Math.max(best.score,1e-9));
  const accepted=!!best&&best.score<=1&&separated;
  const confidence=accepted?Math.max(0,Math.min(1,(1-best.score)*(second?(second.score-best.score)/Math.max(second.score,1e-9):1))):0;
  if(accepted)classified++;else if(!best||best.score>1)outsideEvidence++;else ambiguous++;
  assignments.push({
   regionId:region.id,avatarId,formId,viewId,poseId:candidates[0]?.poseId??'unresolved',
   partId:accepted?best!.partId:null,surfaceLayerId:accepted?best!.layer:null,
   landmarkIds:accepted?best!.ids:[],origin:'automatic',policy:'recomputable',
   reviewStatus:accepted?'suggested':'unresolved',confidence,
   reason:accepted?'2D landmark proximity proposal; explicit review required.':
    !best||best.score>1?'No matching 2D landmark evidence covers this region.':'Competing 2D anatomical landmarks are insufficiently separated.'
  });
 }
 return {assignments,classified,ambiguous,outsideEvidence};
}


/** Convert persisted editor landmarks into classifier seeds using the region's explicit hierarchy. */
export function imageReferenceLandmarksToCluster2DSeeds(document:ImageReferenceDocument):Cluster2DLandmarkSeed[] {
 const issues=validateImageReferenceDocument(document);
 if(issues.length)throw new Error('Invalid image reference document: '+issues.map(issue=>issue.path).join(', '));
 const result:Cluster2DLandmarkSeed[]=[];
 for(const landmark of document.landmarks??[]){
  const region=document.regions.find(item=>item.id===landmark.regionId);
  // Suggested/ignored geometry is not approved evidence and cannot seed proposals.
  if(region?.status!=='confirmed')continue;
  const view=document.views.find(item=>item.regionIds.includes(landmark.regionId));
  const form=view&&document.forms.find(item=>item.viewIds.includes(view.id));
  const avatar=form&&document.avatars.find(item=>item.formIds.includes(form.id));
  if(!view||!form||!avatar)throw new Error('2D landmark region is not assigned to an avatar, form, and view.');
  result.push({id:landmark.id,partId:landmark.partId,surfaceLayerId:landmark.surfaceLayerId??null,avatarId:avatar.id,formId:form.id,viewId:view.id,poseId:landmark.poseId,x:landmark.x,y:landmark.y,radiusPx:landmark.radiusPx});
 }
 return result;
}
