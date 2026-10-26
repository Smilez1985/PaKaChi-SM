import {REVIEW_REASONS} from './studio-review.ts';
import type {ReviewReason} from './studio-review.ts';
export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];
/** Reserved pose channel; cannot collide with user point IDs. */
export const FIGURE_TRACK='$figure';
export const neutralFigure=():Transform=>({position:[0,0,0],rotation:[0,0,0,1]});
export interface Transform { position: Vec3; rotation: Quat; /** Uniform whole-figure scale only; absent means 1. */ scale?: number }
export interface ControlPoint {
  id: string; name: string; kind: 'bone' | 'surface'; bone?: number; mesh?: number;
  rest: Vec3; size: number; radius: number; bendLimit?: {min:number;max:number};
}
export interface Pose { id: string; name: string; seconds: number; values: Record<string, Transform>; review?: ReviewReason[] }
export interface StudioMove { id: string; name: string; loop: boolean; poses: string[] }
export const MAX_WEIGHT_TRANSFERS=1024;
export interface WeightRegion {center:Vec3;radius:number}
export function validWeightRegion(value:unknown):value is WeightRegion {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const r=value as Record<string,unknown>;
 return Object.keys(r).every(k=>k==='center'||k==='radius')&&Array.isArray(r.center)&&r.center.length===3&&r.center.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=100)&&typeof r.radius==='number'&&Number.isFinite(r.radius)&&r.radius>=.005&&r.radius<=2;
}
export type BoneInsertion = ({child:number;ratio:number;parent?:never}|{parent:number;child?:never;ratio?:never}) & {afterDeletions?:number};
export interface StudioData {
  weightTransfers?: {from:number;to:number;amount:number;after:number;region?:WeightRegion}[];
  boneReparents?: {bone:number;parent:number;after:number}[];
  boneDeletions?: number[];
  boneInsertions?: BoneInsertion[];
  points: ControlPoint[]; links: [string, string][]; boneRest: Transform[]; poses: Pose[]; moves: StudioMove[]; draft?: Record<string,Transform>;
}
export interface StudioProject {
  format: 'pakachi-studio'; version: 1; model: string;
  avatar: { id: string; name: string; description: string; moves: {id:string;name:string;clip:string;loop:boolean}[]; defaultMove?: string; states?: Record<string,string> };
  studio: StudioData;
}
export const emptyStudio = (): StudioData => ({points:[],links:[],boneRest:[],poses:[],moves:[]});
const obj = (v: unknown): v is Record<string,unknown> => !!v && typeof v==='object' && !Array.isArray(v);
const name = (v: unknown): v is string => typeof v==='string' && v.trim().length>0 && v.length<=100;
const id = (v: unknown): v is string => name(v) && /^[a-z0-9][a-z0-9_-]*$/.test(v);
const finite = (v: unknown): v is number => typeof v==='number' && Number.isFinite(v) && Math.abs(v)<=10000;
const vector = (v:unknown,n:number) => Array.isArray(v) && v.length===n && v.every(finite);
export function validBendLimit(v:unknown):v is {min:number;max:number}{return obj(v)&&Object.keys(v).every(k=>k==='min'||k==='max')&&typeof v.min==='number'&&typeof v.max==='number'&&Number.isFinite(v.min)&&Number.isFinite(v.max)&&v.min>=0&&v.max<=175&&v.min<=v.max;}
export const validFigureScale = (v:unknown):v is number => typeof v==='number' && Number.isFinite(v) && v>=.1 && v<=5;
const transform = (v:unknown,figure=false) => obj(v) && (v.scale===undefined || figure && validFigureScale(v.scale)) && vector(v.position,3) && vector(v.rotation,4) && Math.abs((v.rotation as number[]).reduce((s,x)=>s+x*x,0)-1)<.01;
function require(condition:unknown, message='Ungültige Studio-Projektdatei.'): asserts condition { if(!condition) throw new Error(message); }
export function parseProject(input: unknown): StudioProject {
  require(obj(input) && input.format==='pakachi-studio' && input.version===1,'Unbekanntes Studio-Projektformat.');
  require(typeof input.model==='string' && input.model.length>0 && input.model.length<=70_000_000 && input.model.length%4===0 && /^[A-Za-z0-9+/]*={0,2}$/.test(input.model),'Modelldaten fehlen oder sind ungültig.');
  const a=input.avatar; require(obj(a) && id(a.id) && name(a.name) && typeof a.description==='string' && a.description.length<=1000 && Array.isArray(a.moves) && a.moves.length<=512);
  const moveIds=new Set<string>();
  for(const m of a.moves) { require(obj(m) && id(m.id) && !moveIds.has(m.id) && name(m.name) && name(m.clip) && typeof m.loop==='boolean'); moveIds.add(m.id); }
  require(a.defaultMove===undefined || moveIds.has(a.defaultMove as string));
  if(a.states!==undefined) {require(obj(a.states));for(const [key,value] of Object.entries(a.states))require(['idle','talking','thinking','working','waiting','review','error','sleeping'].includes(key) && moveIds.has(value as string));}
  const d=input.studio; require(obj(d) && Array.isArray(d.points) && d.points.length<=256 && Array.isArray(d.links) && d.links.length<=2048 && Array.isArray(d.boneRest) && d.boneRest.length<=512 && d.boneRest.every(v=>transform(v)) && Array.isArray(d.poses) && d.poses.length<=100 && Array.isArray(d.moves) && d.moves.length<=100);
  if(d.boneInsertions!==undefined){
    require(Array.isArray(d.boneInsertions)&&d.boneInsertions.length<=64&&d.boneRest.length<=256,'Ungültige Knochenänderungen.');
    const count=d.boneRest.length-d.boneInsertions.length;require(count>0);
    d.boneInsertions.forEach((e,i)=>{
      require(obj(e),'Ungültiger neuer Knochen.');
      const branch=e.parent!==undefined,index=branch?e.parent:e.child;
      require(Object.keys(e).every(k=>(branch?['parent','afterDeletions']:['child','ratio','afterDeletions']).includes(k))&&Number.isInteger(index)&&(index as number)>=0&&(index as number)<count+i&&(branch||typeof e.ratio==='number'&&Number.isFinite(e.ratio)&&e.ratio>=.1&&e.ratio<=.9),'Ungültiger neuer Knochen.');
    });
  }
  if(d.boneDeletions!==undefined)require(Array.isArray(d.boneDeletions)&&d.boneDeletions.length<=256&&new Set(d.boneDeletions).size===d.boneDeletions.length&&d.boneDeletions.every(i=>Number.isInteger(i)&&i>=0&&i<(d.boneRest as unknown[]).length),'Ungültige Knochenlöschungen.');
  let stage=0;
  for(const e of (d.boneInsertions??[]) as {afterDeletions?:number}[]){const next=e.afterDeletions??0;require(Number.isInteger(next)&&next>=stage&&next<=((d.boneDeletions as number[]|undefined)?.length??0),'Ungültige Reihenfolge der Knochenänderungen.');stage=next;}
  if(d.weightTransfers!==undefined){
    require(Array.isArray(d.weightTransfers)&&d.weightTransfers.length<=MAX_WEIGHT_TRANSFERS,'Zu viele Hautgewichtsübertragungen.');let previous=0;
    const total=((d.boneInsertions as unknown[]|undefined)?.length??0)+((d.boneDeletions as unknown[]|undefined)?.length??0);
    for(const e of d.weightTransfers){require(obj(e)&&Object.keys(e).every(k=>['from','to','amount','after','region'].includes(k))&&Number.isInteger(e.from)&&Number.isInteger(e.to)&&(e.from as number)>=0&&(e.to as number)>=0&&(e.from as number)<d.boneRest.length&&(e.to as number)<d.boneRest.length&&e.from!==e.to&&(e.region===undefined||validWeightRegion(e.region))&&typeof e.amount==='number'&&Number.isFinite(e.amount)&&e.amount>0&&e.amount<=1&&Number.isInteger(e.after)&&(e.after as number)>=previous&&(e.after as number)<=total,'Ungültige Hautgewichtsübertragung.');previous=e.after as number;}
  }
  if(d.boneReparents!==undefined){
    require(Array.isArray(d.boneReparents)&&d.boneReparents.length<=256,'Ungültige Knochenzuordnungen.');
    let previous=0;const total=((d.boneInsertions as unknown[]|undefined)?.length??0)+((d.boneDeletions as unknown[]|undefined)?.length??0);
    for(const e of d.boneReparents){require(obj(e)&&Object.keys(e).every(k=>['bone','parent','after'].includes(k))&&Number.isInteger(e.bone)&&Number.isInteger(e.parent)&&(e.bone as number)>=0&&(e.parent as number)>=0&&(e.bone as number)<d.boneRest.length&&(e.parent as number)<d.boneRest.length&&e.bone!==e.parent&&Number.isInteger(e.after)&&(e.after as number)>=previous&&(e.after as number)<=total,'Ungültige Knochenzuordnung.');previous=e.after as number;}
  }
  const ids=new Set<string>(), bones=new Set<number>();
  for(const p of d.points) {
    require(obj(p) && id(p.id) && !ids.has(p.id) && name(p.name) && ['bone','surface'].includes(p.kind as string) && vector(p.rest,3) && finite(p.size) && p.size>=.003 && p.size<=.15 && finite(p.radius) && p.radius>=.005 && p.radius<=2);
    require(p.bendLimit===undefined || p.kind==='bone'&&validBendLimit(p.bendLimit),'Ungültige IK-Beugegrenze.');
    if(p.kind==='bone') {require(Number.isInteger(p.bone) && (p.bone as number)>=0 && (p.bone as number)<d.boneRest.length && !bones.has(p.bone as number)&&!(d.boneDeletions as number[]|undefined)?.includes(p.bone as number));bones.add(p.bone as number);}
    else require(p.mesh===undefined || Number.isInteger(p.mesh) && (p.mesh as number)>=0 && (p.mesh as number)<2048);
    ids.add(p.id);
  }
  const valuesValid=(values:unknown)=>{if(!obj(values))return false;const keys=Object.keys(values);return keys.length===ids.size+(FIGURE_TRACK in values?1:0)&&keys.every(key=>key===FIGURE_TRACK ? transform(values[key],true) : ids.has(key)&&transform(values[key]));};
  if(d.draft!==undefined)require(valuesValid(d.draft));
  const links=new Set<string>();
  for(const l of d.links) {require(Array.isArray(l) && l.length===2 && l[0]!==l[1] && ids.has(l[0]) && ids.has(l[1])); const k=[...l].sort().join('|');require(!links.has(k));links.add(k);}
  const poses=new Set<string>();
  for(const p of d.poses) {
    require(obj(p) && id(p.id) && !poses.has(p.id) && name(p.name) && finite(p.seconds) && p.seconds>=.1 && p.seconds<=30 && valuesValid(p.values));
    if(p.review!==undefined)require(Array.isArray(p.review)&&p.review.length<=REVIEW_REASONS.length&&new Set(p.review).size===p.review.length&&p.review.every(r=>REVIEW_REASONS.includes(r)),'Ungültige Posen-Prüfhinweise.');
    poses.add(p.id);
  }
  for(const m of d.moves) {require(obj(m) && id(m.id) && !moveIds.has(m.id) && name(m.name) && typeof m.loop==='boolean' && Array.isArray(m.poses) && m.poses.length>=2 && m.poses.length<=100 && m.poses.every(p=>poses.has(p))); moveIds.add(m.id);}
  return structuredClone(input) as unknown as StudioProject;
}
export function connectedPoints(data:StudioData, start:string):Set<string> {
  const result=new Set([start]); let changed=true;
  while(changed) {changed=false; for(const [a,b] of data.links) if(result.has(a)!==result.has(b)){result.add(a);result.add(b);changed=true;}}
  return result;
}
/** Bounded snapshots: one entry per gesture, not per pointer event. */
export class StudioHistory<T> {
  private past:T[]=[]; private future:T[]=[];
  push(value:T) {this.past.push(structuredClone(value));if(this.past.length>40)this.past.shift();this.future=[];}
  undo(current:T):T|undefined {const value=this.past.pop();if(value){this.future.push(structuredClone(current));return value;}}
  redo(current:T):T|undefined {const value=this.future.pop();if(value){this.past.push(structuredClone(current));return value;}}
  get canUndo(){return !!this.past.length;} get canRedo(){return !!this.future.length;}
}
