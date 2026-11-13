/**
 * User-verifiable image segmentation and avatar/form/view grouping.
 * Coordinates are always pixels in the immutable source image.
 */
export type ImageRegionKind = 'avatar'|'form'|'view'|'detail'|'helper';
export type ImageRegionStatus = 'suggested'|'confirmed'|'ignored';
export type ImageRegionGeometry =
  | {type:'rectangle';x:number;y:number;width:number;height:number}
  | {type:'polygon';points:Array<{x:number;y:number}>};

export interface ImageReferenceRegion {
  id:string;
  label:string;
  kind:ImageRegionKind;
  status:ImageRegionStatus;
  confidence?:number;
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
export interface ImageReferenceDocument {
  format:'pakachi-image-reference';
  version:1;
  source:{sha256:string;width:number;height:number};
  regions:ImageReferenceRegion[];
  views:ImageReferenceView[];
  forms:ImageReferenceForm[];
  avatars:ImageReferenceAvatar[];
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
    const point=(x:number,y:number,path:string)=>{if(!finite(x)||!finite(y)||x<0||y<0||x>source.width||y>source.height)issues.push({path,message:'Punkt liegt außerhalb des Quellbildes oder ist nicht endlich.'});};
    if(r.geometry.type==='rectangle'){
      const g=r.geometry;
      if(![g.x,g.y,g.width,g.height].every(finite)||g.width<=0||g.height<=0||g.x<0||g.y<0||g.x+g.width>source.width||g.y+g.height>source.height)issues.push({path:p+'.geometry',message:'Rechteck muss vollständig innerhalb des Quellbildes liegen und positive Fläche haben.'});
    }else if(r.geometry.type==='polygon'){
      if(r.geometry.points.length<3)issues.push({path:p+'.geometry.points',message:'Ein Polygon benötigt mindestens drei Punkte.'});
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
  return issues;
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
