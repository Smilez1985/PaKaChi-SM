import type {ControlPoint,Pose,StudioData,StudioMove,Transform} from './studio-data.ts';
export const REVIEW_REASONS=['bone-rest','surface-rest','surface-radius','point-removed','bend-limit'] as const;
export type ReviewReason=typeof REVIEW_REASONS[number];
export const reviewLabels:Record<ReviewReason,string>={
  'bend-limit':'IK-Beugegrenze geändert. Gespeicherte Bewegung prüfen.',
  'bone-rest':'Skelett-Grundstellung oder Drehpunkt geändert.',
  'surface-rest':'Grundposition eines Oberflächenpunkts geändert.',
  'surface-radius':'Einflussbereich eines bewegten Oberflächenpunkts geändert.',
  'point-removed':'Ein in dieser Pose bewegter Kontrollpunkt wurde entfernt.',
};
const sameVector=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<1e-8);
function sameTransform(a:Transform|undefined,b:Transform|undefined){return !!a&&!!b&&sameVector(a.position,b.position)&&(sameVector(a.rotation,b.rotation)||sameVector(a.rotation,b.rotation.map(v=>-v)));}
const rest=(data:StudioData,p:ControlPoint):Transform=>p.kind==='bone'?data.boneRest[p.bone!]:{position:p.rest,rotation:[0,0,0,1]};
const active=(pose:Pose,data:StudioData,p:ControlPoint)=>!sameTransform(pose.values[p.id],rest(data,p));
/** Detect changes to the interpretation of stored poses, without rewriting their motion. */
export function flagAffectedPoses(before:StudioData,after:StudioData):void {
  const bonesChanged=JSON.stringify(before.boneReparents??[])!==JSON.stringify(after.boneReparents??[])||JSON.stringify(before.boneDeletions??[])!==JSON.stringify(after.boneDeletions??[])||before.boneRest.length!==after.boneRest.length||before.boneRest.some((v,i)=>!sameTransform(v,after.boneRest[i]));
  const current=new Map(after.points.map(p=>[p.id,p]));
  for(const pose of after.poses){const previous=before.poses.find(p=>p.id===pose.id);if(!previous)continue;
    const reasons=new Set<ReviewReason>(pose.review??[]);
    // Skin weights and descendant joints can affect any stored pose; conservatively flag all.
    if(bonesChanged)reasons.add('bone-rest');
    for(const point of before.points){const next=current.get(point.id);
      if(!next){if(active(previous,before,point))reasons.add('point-removed');continue;}
      if(JSON.stringify(point.bendLimit)!==JSON.stringify(next.bendLimit))reasons.add('bend-limit');
      if(point.kind==='surface'&&next.kind==='surface'){
        if(!sameVector(point.rest,next.rest))reasons.add('surface-rest');
        if(Math.abs(point.radius-next.radius)>1e-8&&(active(previous,before,point)||active(pose,after,next)))reasons.add('surface-radius');
      }
    }
    if(reasons.size)pose.review=[...reasons];
  }
}
export function moveReview(data:StudioData,move:StudioMove):{needsReview:boolean;reviewPoseIds:string[]} {
 const reviewPoseIds=[...new Set(move.poses)].filter(id=>data.poses.find(p=>p.id===id)?.review?.length);
 return {needsReview:reviewPoseIds.length>0,reviewPoseIds};
}
