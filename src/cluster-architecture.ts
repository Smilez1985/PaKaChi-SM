import {createHash} from 'node:crypto';

export type ClusterForm='animal'|'humanoid'|'imported';
export type ClusterOrigin='automatic'|'user'|'llm'|'imported';
export type OverridePolicy='recomputable'|'prefer'|'locked';
export type ClusterOperation=
 | {type:'rename-part';partId:string;name:string}
 | {type:'reparent-part';partId:string;parentPartId:string|null}
 | {type:'reorder-part';partId:string;orderKey:number[]}
 | {type:'assign-mesh';meshId:string;partId:string|null;surfaceLayerId?:string|null;policy?:OverridePolicy}
 | {type:'set-surface-layer';layerId:string;partId:string|null;name?:string}
 | {type:'add-part';part:ClusterPart}
 | {type:'remove-part';partId:string};

export interface ClusterPart {
 id:string;name:string;parentPartId:string|null;orderKey:number[];rigBoneIds:string[];
}
export interface ClusterSurfaceLayer {id:string;name:string;partId:string|null;orderKey:number[]}
export interface ClusterMeshSource {id:string;sourceMeshIndex:number;sourceMeshName:string;primitiveIndex:number;vertexCount:number;triangleCount:number}
export interface ClusterAssignment {
 meshId:string;triangleIndex:number;partId:string|null;surfaceLayerId:string|null;
 origin:ClusterOrigin;policy:OverridePolicy;confidence:number;reason:string;
}
export interface ClusterManifest {
 schemaVersion:1;form:ClusterForm;sourceAssetSha256:string;algorithmId:string;algorithmVersion:string;
 generatedAt:string;parts:ClusterPart[];layers:ClusterSurfaceLayer[];meshes:ClusterMeshSource[];
 assignments:ClusterAssignment[];revision:number;
}
export interface ClusterOverride {id:string;origin:'user'|'llm';policy:OverridePolicy;operation:ClusterOperation;createdAt:string}
export interface ClusterValidationIssue {code:string;path:string;message:string}

const idPattern=/^[a-z0-9][a-z0-9_-]{0,127}$/;
const hashPattern=/^[a-f0-9]{64}$/;
const isRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const validId=(v:unknown):v is string=>typeof v==='string'&&idPattern.test(v);
const validOrder=(v:unknown):v is number[]=>Array.isArray(v)&&v.length>0&&v.length<=16&&v.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1_000_000);
const unique=(values:string[])=>new Set(values).size===values.length;
const clone=<T>(v:T):T=>structuredClone(v);

export function validateClusterManifest(value:unknown):ClusterValidationIssue[]{
 const issues:ClusterValidationIssue[]=[];
 const issue=(code:string,path:string,message:string)=>issues.push({code,path,message});
 if(!isRecord(value)){return [{code:'manifest.object',path:'$',message:'Manifest must be an object.'}];}
 if(value.schemaVersion!==1)issue('manifest.version','schemaVersion','Unsupported cluster manifest version.');
 if(!['animal','humanoid','imported'].includes(String(value.form)))issue('manifest.form','form','Unknown form.');
 if(typeof value.sourceAssetSha256!=='string'||!hashPattern.test(value.sourceAssetSha256))issue('manifest.hash','sourceAssetSha256','Expected a SHA-256 hex digest.');
 for(const key of ['algorithmId','algorithmVersion','generatedAt'])if(typeof value[key]!=='string'||!(value[key] as string).trim())issue('manifest.metadata',key,'Required metadata is missing.');
 if(!Number.isSafeInteger(value.revision)||Number(value.revision)<0)issue('manifest.revision','revision','Revision must be a non-negative safe integer.');
 for(const key of ['parts','layers','meshes','assignments'])if(!Array.isArray(value[key]))issue('manifest.array',key,`${key} must be an array.`);
 if(issues.some(x=>x.code==='manifest.array'))return issues;
 const parts=value.parts as unknown[],layers=value.layers as unknown[],meshes=value.meshes as unknown[],assignments=value.assignments as unknown[];
 const partIds=parts.map(p=>isRecord(p)&&typeof p.id==='string'?p.id:'');
 const layerIds=layers.map(p=>isRecord(p)&&typeof p.id==='string'?p.id:'');
 const meshIds=meshes.map(p=>isRecord(p)&&typeof p.id==='string'?p.id:'');
 for(const [kind,ids] of [['part',partIds],['layer',layerIds],['mesh',meshIds]] as const)if(!unique(ids)||ids.some(x=>!validId(x)))issue(`id.${kind}`,kind+'s',`Invalid or duplicate ${kind} IDs.`);
 const partMap=new Map<string,Record<string,unknown>>();
 for(let i=0;i<parts.length;i++){
  const p=parts[i];if(!isRecord(p)){issue('part.object',`parts[${i}]`,'Part must be an object.');continue;}
  partMap.set(String(p.id),p);
  if(typeof p.name!=='string'||!p.name.trim()||p.name.length>100)issue('part.name',`parts[${i}].name`,'Invalid part name.');
  if(p.parentPartId!==null&&!validId(p.parentPartId))issue('part.parent',`parts[${i}].parentPartId`,'Invalid parent ID.');
  if(p.parentPartId===p.id)issue('part.cycle',`parts[${i}].parentPartId`,'A part cannot parent itself.');
  if(!validOrder(p.orderKey))issue('part.order',`parts[${i}].orderKey`,'Invalid hierarchical order key.');
  if(!Array.isArray(p.rigBoneIds)||p.rigBoneIds.some(x=>!validId(x)))issue('part.bones',`parts[${i}].rigBoneIds`,'Invalid rig bone references.');
 }
 for(const [id,p] of partMap)if(p.parentPartId!==null&&!partMap.has(String(p.parentPartId)))issue('part.parent.missing',`parts.${id}.parentPartId`,'Parent part does not exist.');
 for(const id of partMap.keys()){
  const seen=new Set<string>();let current:string|null=id;
  while(current){if(seen.has(current)){issue('part.cycle',`parts.${id}`,'Anatomical parent graph contains a cycle.');break;}seen.add(current);const p=partMap.get(current);current=p&&p.parentPartId!==null?String(p.parentPartId):null;}
 }
 const layerMap=new Map<string,Record<string,unknown>>();
 layers.forEach((l,i)=>{if(!isRecord(l)){issue('layer.object',`layers[${i}]`,'Layer must be an object.');return;}layerMap.set(String(l.id),l);if(typeof l.name!=='string'||!l.name.trim()||l.name.length>100)issue('layer.name',`layers[${i}].name`,'Invalid layer name.');if(l.partId!==null&&l.partId!==undefined&&!partMap.has(String(l.partId)))issue('layer.part',`layers[${i}].partId`,'Layer references an unknown part.');if(!validOrder(l.orderKey))issue('layer.order',`layers[${i}].orderKey`,'Invalid layer order key.');});
 const meshMap=new Map<string,Record<string,unknown>>();
 meshes.forEach((m,i)=>{if(!isRecord(m)){issue('mesh.object',`meshes[${i}]`,'Mesh source must be an object.');return;}meshMap.set(String(m.id),m);for(const k of ['sourceMeshIndex','primitiveIndex','vertexCount','triangleCount'])if(!Number.isSafeInteger(m[k])||Number(m[k])<0)issue('mesh.count',`meshes[${i}].${k}`,`Invalid ${k}.`);if(typeof m.sourceMeshName!=='string')issue('mesh.name',`meshes[${i}].sourceMeshName`,'Mesh name must be a string.');});
 const seenTriangles=new Set<string>();
 assignments.forEach((a,i)=>{const path=`assignments[${i}]`;if(!isRecord(a)){issue('assignment.object',path,'Assignment must be an object.');return;}const mesh=meshMap.get(String(a.meshId));if(!mesh)issue('assignment.mesh',path+'.meshId','Unknown mesh.');if(!Number.isSafeInteger(a.triangleIndex)||Number(a.triangleIndex)<0||(mesh&&Number(a.triangleIndex)>=Number(mesh.triangleCount)))issue('assignment.triangle',path+'.triangleIndex','Triangle index is outside the source primitive.');if(a.partId!==null&&!partMap.has(String(a.partId)))issue('assignment.part',path+'.partId','Unknown anatomical part.');if(a.surfaceLayerId!==null&&!layerMap.has(String(a.surfaceLayerId)))issue('assignment.layer',path+'.surfaceLayerId','Unknown surface layer.');if(!['automatic','user','llm','imported'].includes(String(a.origin)))issue('assignment.origin',path+'.origin','Unknown assignment origin.');if(!['recomputable','prefer','locked'].includes(String(a.policy)))issue('assignment.policy',path+'.policy','Unknown override policy.');if(typeof a.confidence!=='number'||!Number.isFinite(a.confidence)||a.confidence<0||a.confidence>1)issue('assignment.confidence',path+'.confidence','Confidence must be between 0 and 1.');if(typeof a.reason!=='string'||a.reason.length>500)issue('assignment.reason',path+'.reason','Invalid assignment reason.');const key=`${String(a.meshId)}:${String(a.triangleIndex)}`;if(seenTriangles.has(key))issue('assignment.duplicate',path,'A source triangle has more than one assignment.');seenTriangles.add(key);});
 return issues;
}
function assertValid(manifest:ClusterManifest){const issues=validateClusterManifest(manifest);if(issues.length)throw new Error('Invalid cluster manifest: '+issues.map(x=>x.code+' at '+x.path).join(', '));}
function assertOperation(op:ClusterOperation){
 if(!isRecord(op)||typeof op.type!=='string')throw new Error('Invalid cluster operation.');
 const id=(v:unknown)=>{if(!validId(v))throw new Error('Invalid cluster operation ID.');};
 if(op.type==='rename-part'){id(op.partId);if(typeof op.name!=='string'||!op.name.trim()||op.name.length>100)throw new Error('Invalid part name.');}
 else if(op.type==='reparent-part'){id(op.partId);if(op.parentPartId!==null)id(op.parentPartId);}
 else if(op.type==='reorder-part'){id(op.partId);if(!validOrder(op.orderKey))throw new Error('Invalid order key.');}
 else if(op.type==='assign-mesh'){id(op.meshId);if(op.partId!==null)id(op.partId);if(op.surfaceLayerId!==undefined&&op.surfaceLayerId!==null)id(op.surfaceLayerId);if(op.policy!==undefined&&!['recomputable','prefer','locked'].includes(op.policy))throw new Error('Invalid override policy.');}
 else if(op.type==='set-surface-layer'){id(op.layerId);if(op.partId!==null)id(op.partId);if(op.name!==undefined&&(typeof op.name!=='string'||!op.name.trim()||op.name.length>100))throw new Error('Invalid layer name.');}
 else if(op.type==='add-part'){if(!isRecord(op.part)||!validId(op.part.id)||typeof op.part.name!=='string'||!op.part.name.trim()||!validOrder(op.part.orderKey)||!Array.isArray(op.part.rigBoneIds))throw new Error('Invalid new part.');}
 else if(op.type==='remove-part')id(op.partId);
 else throw new Error('Unsupported cluster operation.');
}
export function applyClusterOperation(manifest:ClusterManifest,operation:ClusterOperation,origin:'user'|'llm'='user',policy:OverridePolicy='locked'):ClusterManifest{
 assertValid(manifest);assertOperation(operation);const next=clone(manifest);
 switch(operation.type){
  case 'rename-part':{const p=next.parts.find(x=>x.id===operation.partId);if(!p)throw new Error('Part not found.');p.name=operation.name.trim();break;}
  case 'reparent-part':{const p=next.parts.find(x=>x.id===operation.partId);if(!p)throw new Error('Part not found.');if(operation.parentPartId!==null&&!next.parts.some(x=>x.id===operation.parentPartId))throw new Error('Parent part not found.');p.parentPartId=operation.parentPartId;break;}
  case 'reorder-part':{const p=next.parts.find(x=>x.id===operation.partId);if(!p)throw new Error('Part not found.');p.orderKey=[...operation.orderKey];break;}
  case 'assign-mesh':{if(!next.meshes.some(x=>x.id===operation.meshId))throw new Error('Mesh not found.');if(operation.partId!==null&&!next.parts.some(x=>x.id===operation.partId))throw new Error('Part not found.');if(operation.surfaceLayerId&& !next.layers.some(x=>x.id===operation.surfaceLayerId))throw new Error('Surface layer not found.');const target=next.assignments.filter(x=>x.meshId===operation.meshId);if(!target.length)throw new Error('Mesh has no triangle assignments.');for(const a of target){a.partId=operation.partId;a.surfaceLayerId=operation.surfaceLayerId??null;a.origin=origin;a.policy=operation.policy??policy;a.confidence=1;a.reason='Explicit '+origin+' assignment.';}break;}
  case 'set-surface-layer':{const l=next.layers.find(x=>x.id===operation.layerId);if(!l)throw new Error('Surface layer not found.');if(operation.partId!==null&&!next.parts.some(x=>x.id===operation.partId))throw new Error('Part not found.');l.partId=operation.partId;if(operation.name)l.name=operation.name.trim();break;}
  case 'add-part':if(next.parts.some(x=>x.id===operation.part.id))throw new Error('Part already exists.');next.parts.push(clone(operation.part));break;
  case 'remove-part':if(!next.parts.some(x=>x.id===operation.partId))throw new Error('Part not found.');if(next.parts.some(x=>x.parentPartId===operation.partId)||next.assignments.some(x=>x.partId===operation.partId)||next.layers.some(x=>x.partId===operation.partId))throw new Error('Part is still referenced; reassign its children, layers and triangles first.');next.parts=next.parts.filter(x=>x.id!==operation.partId);break;
 }
 next.revision++;assertValid(next);return next;
}
/** Replaces automatic assignments while retaining locked manual decisions by source triangle. */
export function recomputeClusterAssignments(current:ClusterManifest,proposed:ClusterAssignment[]):ClusterManifest{
 assertValid(current);const locked=new Map(current.assignments.filter(a=>a.policy==='locked'&&a.origin!=='automatic').map(a=>[`${a.meshId}:${a.triangleIndex}`,a]));
 const merged=proposed.map(a=>{const key=`${a.meshId}:${a.triangleIndex}`;const prior=locked.get(key);if(prior){locked.delete(key);return clone(prior);}return clone(a);});
 if(locked.size)throw new Error('Recalculation omitted '+locked.size+' locked triangle assignment(s).');
 const next={...clone(current),assignments:merged,generatedAt:new Date().toISOString(),revision:current.revision+1};
 assertValid(next);return next;
}
export function clusterAssetHash(bytes:Uint8Array):string{return createHash('sha256').update(bytes).digest('hex');}
