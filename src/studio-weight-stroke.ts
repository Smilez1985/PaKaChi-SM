import type {WeightView} from './studio-weight-visibility.ts';
import * as T from 'three';
import type {ControlPoint,StudioData,Transform,WeightRegion} from './studio-data.ts';
import type {StudioRig} from './studio-rig.ts';
/** One rollback-capable brush gesture. Fixed spatial spacing avoids event-rate-dependent dabs. */
export class StudioWeightStroke {
 readonly before:{data:StudioData;values:Record<string,Transform>};
 private last:T.Vector3|null=null;
 private distance=0;
 private closed=false;
 changed=false;
 private view?:WeightView;
 private rig:StudioRig;private source:ControlPoint;private target:ControlPoint;private amount:number;private radius:number;
 constructor(rig:StudioRig,source:ControlPoint,target:ControlPoint,amount:number,radius:number,view?:WeightView){
  this.view=view?structuredClone(view):undefined;
  this.rig=rig;this.source=source;this.target=target;this.amount=amount;this.radius=radius;
  if(source.kind!=='bone'||target.kind!=='bone'||source===target||!rig.data.points.includes(source)||!rig.data.points.includes(target)||!Number.isFinite(amount)||amount<=0||amount>1||!Number.isFinite(radius)||radius<.005||radius>2)throw Error('Zwei Knochen, Stärke und gültigen Pinselradius wählen.');
  this.before={data:structuredClone(rig.data),values:rig.capture()};
 }
 private dab(center:T.Vector3){
  const region:WeightRegion={center:center.toArray(),radius:this.radius,...(this.view?{view:this.view}:{})};
  try{this.rig.transferWeights(this.source,this.target,this.amount,region);this.changed=true;}
  catch(error){
   // A region with no source influence is a normal gap, not a failed gesture.
   if(error instanceof Error&&error.message==='Der Quellknochen hat keinen übertragbaren Oberflächen-Einfluss.'){
    this.source=this.rig.data.points.find(p=>p.id===this.source.id)!;this.target=this.rig.data.points.find(p=>p.id===this.target.id)!;return;
   }
   this.cancel();throw error;
  }
 }
 sample(point:T.Vector3|null){
  if(this.closed)return;
  if(!point){this.last=null;this.distance=0;return;}
  if(!point.toArray().every(v=>Number.isFinite(v)&&Math.abs(v)<=100)){this.cancel();throw Error('Ungültige Pinselposition.');}
  if(!this.last){this.dab(point);this.last=point.clone();this.distance=0;return;}
  const step=this.radius/4,delta=point.clone().sub(this.last),length=delta.length();
  if(length<1e-10)return;
  // Do not bridge large jumps between disconnected surfaces.
  if(length>this.radius*2){this.dab(point);this.last=point.clone();this.distance=0;return;}
  for(let travel=step-this.distance;travel<=length+1e-10;travel+=step)this.dab(this.last.clone().addScaledVector(delta,travel/length));
  this.distance=(this.distance+length)%step;if(this.distance<1e-9||step-this.distance<1e-9)this.distance=0;this.last=point.clone();
 }
 finish(){this.closed=true;return this.changed;}
 cancel(){if(this.closed)return;this.closed=true;this.rig.data=structuredClone(this.before.data);this.rig.reset();this.rig.apply(this.before.values);this.changed=false;}
}
