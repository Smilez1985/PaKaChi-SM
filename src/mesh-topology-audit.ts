/** Read-only topology classification. No welding/removal: UV seams and skin weights
 * may require coincident but distinct vertices. See docs/MESH-REPARATUR.md. */
type N=ArrayLike<number>;
type Vec=[number,number,number];
export interface MeshTopologyAudit {
 triangles:number; vertices:number; invalidIndices:number; nonFiniteTriangles:number;
 zeroAreaTriangles:number; duplicateFaces:number; coincidentFaces:number; boundaryEdges:number;
 nonManifoldEdges:number; inconsistentWindingEdges:number;
 coincidentVertexGroups:number; coincidentVertices:number;
 examples:{degenerate:number[];duplicate:number[];coincident:number[];nonManifoldEdges:[number,number][]};
 advice:string[];
}
export function auditMeshTopology(positions:N,index:N|null=null):MeshTopologyAudit {
 if(!Number.isInteger(positions.length/3)||!Number.isInteger((index?.length??positions.length/3)/3))
  throw Error('Ungültiges Dreiecksformat.');
 const vertices=positions.length/3,triangles=(index?.length??vertices)/3;
 const a:MeshTopologyAudit={triangles,vertices,invalidIndices:0,nonFiniteTriangles:0,zeroAreaTriangles:0,duplicateFaces:0,
 boundaryEdges:0,nonManifoldEdges:0,inconsistentWindingEdges:0,coincidentVertexGroups:0,coincidentVertices:0,coincidentFaces:0,
 examples:{degenerate:[],duplicate:[],coincident:[],nonManifoldEdges:[]},advice:[]};
 const loc=(i:number)=>index?index[i]:i;
 const faces=new Set<string>(),geometricFaces=new Map<string,string>(),edges=new Map<string,{count:number,forward:number,first:number,second:number}>();
 const sub=(p:Vec,q:Vec):Vec=>[p[0]-q[0],p[1]-q[1],p[2]-q[2]];
 const length=(p:Vec)=>Math.hypot(p[0],p[1],p[2]);
 const cross=(p:Vec,q:Vec):Vec=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
 const pos=(i:number):Vec=>[positions[i*3],positions[i*3+1],positions[i*3+2]];
 for(let i=0;i<triangles;i++){
  const ids=[loc(i*3),loc(i*3+1),loc(i*3+2)];
  if(ids.some(id=>!Number.isInteger(id)||id<0||id>=vertices)){a.invalidIndices++;continue;}
  const points=ids.map(pos);
  if(points.some(p=>p.some(x=>!Number.isFinite(x)))){a.nonFiniteTriangles++;continue;}
  const e1=sub(points[1],points[0]),e2=sub(points[2],points[0]),e3=sub(points[2],points[1]);
  const size=Math.max(length(e1),length(e2),length(e3)),area=length(cross(e1,e2));
  if(!Number.isFinite(size)||!Number.isFinite(area)||!size||area<=1e-12*size*size){
   a.zeroAreaTriangles++;if(a.examples.degenerate.length<12)a.examples.degenerate.push(i);continue;
  }
  const face=ids.slice().sort((x,y)=>x-y).join(',');
  if(faces.has(face)){a.duplicateFaces++;if(a.examples.duplicate.length<12)a.examples.duplicate.push(i);}
  else faces.add(face);
  // A geometrically identical triangle may use different indices at a UV/material/skin seam.
  // Report it separately from duplicate index faces; never infer that welding is safe.
  const geometric=points.map(p=>p.map(x=>Object.is(x,-0)?0:x).join(',')).sort().join('|');
  const firstIndexed=geometricFaces.get(geometric);
  if(firstIndexed!==undefined&&firstIndexed!==face){
   a.coincidentFaces++;if(a.examples.coincident.length<12)a.examples.coincident.push(i);
  }else if(firstIndexed===undefined)geometricFaces.set(geometric,face);
  for(let k=0;k<3;k++){
   const s=ids[k],t=ids[(k+1)%3],first=Math.min(s,t),second=Math.max(s,t),key=first+','+second;
   const edge=edges.get(key);
   if(edge){edge.count++;if(s===first)edge.forward++;}
   else edges.set(key,{count:1,forward:s===first?1:0,first,second});
  }
 }
 for(const edge of edges.values()){
  if(edge.count===1)a.boundaryEdges++;
  if(edge.count>2){a.nonManifoldEdges++;if(a.examples.nonManifoldEdges.length<12)a.examples.nonManifoldEdges.push([edge.first,edge.second]);}
  if(edge.count===2&&edge.forward!==1)a.inconsistentWindingEdges++;
 }
 // Exact geometric duplicates only; no epsilon-based welding or topology changes.
 const coords=new Map<string,number>();
 for(let i=0;i<vertices;i++){
  const p=pos(i);
  if(p.some(x=>!Number.isFinite(x)))continue;
  const key=p.map(x=>Object.is(x,-0)?0:x).join(',');
  coords.set(key,(coords.get(key)??0)+1);
 }
 for(const count of coords.values())if(count>1){a.coincidentVertexGroups++;a.coincidentVertices+=count;}
 if(a.invalidIndices||a.nonFiniteTriangles)a.advice.push('Ungültige Index-/Koordinatendaten an der Quelle korrigieren; nicht automatisch umschreiben.');
 if(a.zeroAreaTriangles)a.advice.push('Nullflächen einzeln lokalisieren; erst auf einer Kopie entfernen und Skinning/UV prüfen.');
 if(a.duplicateFaces)a.advice.push('Doppelflächen auf absichtlich getrennte Material-/Renderlagen prüfen.');
 if(a.coincidentFaces)a.advice.push('Deckungsgleiche Flächen mit getrennten Vertex-Indizes: UV-/Material-/Skinning-Nähte prüfen, nicht blind entfernen oder verschweißen.');
 if(a.nonManifoldEdges||a.boundaryEdges||a.inconsistentWindingEdges)a.advice.push('Kanten-Inzidenz und Orientierung visuell prüfen; offene Fellflächen können beabsichtigt sein.');
 if(a.coincidentVertexGroups)a.advice.push('Gleiche Koordinaten können UV-Nähte oder verschiedene Gewichte sein: NICHT blind verschweißen.');
 return a;
}

/** Non-mutating proposal: remove only provably degenerate triangle references.
 * This does not apply a repair, remap vertex attributes, weld seams or change a rig.
 * All original vertex indices are retained; proposals are for explicit preview/review. */
export interface DegenerateFaceRemovalProposal {
 safeToPreview:boolean;
 reason?:'invalid-indices'|'nonfinite-positions'|'frame-layout';
 removedFaces:number[];
 keptTriangles:number;
 proposedIndices:number[];
 before:MeshTopologyAudit;
 after:MeshTopologyAudit|null;
}
export function proposeDegenerateFaceRemoval(positions:N,index:N|null=null):DegenerateFaceRemovalProposal {
 const before=auditMeshTopology(positions,index);
 const reject=before.invalidIndices?'invalid-indices':before.nonFiniteTriangles?'nonfinite-positions':undefined;
 if(reject)return {safeToPreview:false,reason:reject,removedFaces:[],keptTriangles:before.triangles,
  proposedIndices:[],before,after:null};
 const removedFaces:number[]=[],proposedIndices:number[]=[];
 const loc=(i:number)=>index?index[i]:i;
 for(let face=0;face<before.triangles;face++){
  const ids=[loc(face*3),loc(face*3+1),loc(face*3+2)];
  const pts=ids.map(i=>[positions[i*3],positions[i*3+1],positions[i*3+2]]);
  const sub=(a:number[],b:number[])=>a.map((v,k)=>v-b[k]);
  const a=sub(pts[1],pts[0]),b=sub(pts[2],pts[0]),c=sub(pts[2],pts[1]);
  const len=(v:number[])=>Math.hypot(...v);
  const scale=Math.max(len(a),len(b),len(c));
  const area=len([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);
  if(!Number.isFinite(scale)||!Number.isFinite(area)||!scale||area<=1e-12*scale*scale)
   removedFaces.push(face);
  else proposedIndices.push(...ids);
 }
 const after=auditMeshTopology(positions,proposedIndices);
 return {safeToPreview:true,removedFaces,keptTriangles:after.triangles,
  proposedIndices,before,after};
}

/** Preview removal only where the face is degenerate in the rest mesh AND every
 * supplied pose/morph sample. A sampled check does not prove continuous safety.
 * No input positions/indices or vertex attributes are edited. */
export function proposeStableDegenerateFaceRemoval(
 positions:N,posePositions:readonly N[],index:N|null=null
):DegenerateFaceRemovalProposal & {withheldFaces:number[];sampledFrames:number}{
 if(!posePositions.length||posePositions.length>64)throw Error('Ungültige Anzahl Mesh-Stichproben.');
 const original=proposeDegenerateFaceRemoval(positions,index);
 const refused=(reason:'frame-layout'|'nonfinite-positions')=>({
  ...original,safeToPreview:false,reason,proposedIndices:[],after:null,
  keptTriangles:original.before.triangles,removedFaces:[],withheldFaces:original.removedFaces,
  sampledFrames:posePositions.length
 });
 if(!original.safeToPreview)return {...original,withheldFaces:[],sampledFrames:posePositions.length};
 const eligible=new Set(original.removedFaces);
 for(const frame of posePositions){
  if(frame.length!==positions.length)return refused('frame-layout');
  const p=proposeDegenerateFaceRemoval(frame,index);
  if(!p.safeToPreview)return refused('nonfinite-positions');
  const degenerate=new Set(p.removedFaces);
  for(const face of eligible)if(!degenerate.has(face))eligible.delete(face);
 }
 const removedFaces=original.removedFaces.filter(face=>eligible.has(face));
 const withheldFaces=original.removedFaces.filter(face=>!eligible.has(face));
 const proposedIndices:number[]=[];
 const loc=(i:number)=>index?index[i]:i;
 for(let face=0;face<original.before.triangles;face++)
  if(!eligible.has(face))proposedIndices.push(loc(face*3),loc(face*3+1),loc(face*3+2));
 const after=auditMeshTopology(positions,proposedIndices);
 return {safeToPreview:true,removedFaces,withheldFaces,sampledFrames:posePositions.length,
  keptTriangles:after.triangles,proposedIndices,before:original.before,after};
}
