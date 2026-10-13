import type { StudioRig } from './studio-rig.ts';
import type { ControlPoint } from './studio-data.ts';
/** Read the actual model rig; never invent anatomical joints from an unrigged mesh. */
export function detectJoints(rig:StudioRig):ControlPoint[] {
  const existing=new Set(rig.data.points.filter(p=>p.kind==='bone').map(p=>p.bone));
  return rig.initial.points.filter(p=>!existing.has(p.bone)).map(p=>{const copy=structuredClone(p);if(rig.data.points.some(q=>q.id===copy.id))copy.id=`p-${crypto.randomUUID()}`;return copy;});
}
/** Only proven parent/child bone edges. Independent hand-made groups remain independent. */
export function detectConnections(rig:StudioRig):[string,string][] {
  const byBone=new Map(rig.data.points.filter(p=>p.kind==='bone').map(p=>[rig.bones[p.bone!],p.id]));
  const existing=new Set(rig.data.links.map(edge=>edgeKey(edge)));
  const edges:[string,string][]=[];
  for(const [bone,id] of byBone){let parent=bone.parent;while(parent&&!('isBone' in parent))parent=parent.parent;
    const parentId=parent ? byBone.get(parent as typeof bone):undefined;
    if(parentId&&!existing.has(edgeKey([parentId,id])))edges.push([parentId,id]);
  }
  return edges;
}
export const edgeKey=(edge:readonly string[])=>[...edge].sort().join('|');
