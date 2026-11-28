import { Matrix4, Vector3 } from 'three';
import { validateClusterManifest } from './cluster-architecture.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { ClusterMeshBinding } from './cluster-inventory.ts';
import { isValidImageReferenceCameraTransform } from './image-reference.ts';
import type { ImageRegionGeometry } from './image-reference.ts';

export interface ClusterSilhouetteCamera {
  coordinateFrameId: string;
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  /** Column-major camera-to-world transform; camera forward is local +Z. */
  cameraToWorld: readonly number[];
}

export interface ClusterSilhouetteComparisonInput {
  manifest: ClusterManifest;
  bindings: readonly ClusterMeshBinding[];
  camera: ClusterSilhouetteCamera;
  meshCoordinateFrameId: string;
  imageWidth: number;
  imageHeight: number;
  /** Confirmed source-image region in pixel coordinates. */
  region: ImageRegionGeometry;
  nearPlane?: number;
}

export interface ClusterSilhouetteComparisonReport {
  sourceAssetSha256: string;
  coordinateFrameId: string;
  imageWidth: number;
  imageHeight: number;
  regionPixelCount: number;
  modelPixelCount: number;
  intersectionPixelCount: number;
  unionPixelCount: number;
  falsePositivePixelCount: number;
  falseNegativePixelCount: number;
  intersectionOverUnion: number;
  precision: number;
  recall: number;
  /** Row-major binary masks. 1 = inside the source region / projected model. */
  regionMask: Uint8Array;
  modelMask: Uint8Array;
}

const finite = (value: number) => Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function pointInRing(x: number, y: number, points: readonly {x:number;y:number}[]): boolean {
  let inside = false;
  for (let i=0, j=points.length-1; i<points.length; j=i++) {
    const a=points[i]!, b=points[j]!;
    const cross=(x-a.x)*(b.y-a.y)-(y-a.y)*(b.x-a.x);
    if (Math.abs(cross)<1e-8 && x>=Math.min(a.x,b.x)-1e-8 && x<=Math.max(a.x,b.x)+1e-8 &&
        y>=Math.min(a.y,b.y)-1e-8 && y<=Math.max(a.y,b.y)+1e-8) return true;
    if ((a.y>y)!==(b.y>y) && x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) inside=!inside;
  }
  return inside;
}

function validateRegion(region: ImageRegionGeometry, width: number, height: number): void {
  const validPoint=(point:{x:number;y:number})=>!!point&&finite(point.x)&&finite(point.y)&&point.x>=0&&point.x<=width&&point.y>=0&&point.y<=height;
  if(region.type==='rectangle'){
    if(![region.x,region.y,region.width,region.height].every(finite)||region.x<0||region.y<0||
       region.width<=0||region.height<=0||region.x+region.width>width||region.y+region.height>height)
      throw new Error('Silhouette source rectangle is outside the image or invalid.');
    return;
  }
  if(region.type!=='polygon'||!Array.isArray(region.points)||region.points.length<3||region.points.length>10000||
     !region.points.every(validPoint)||!Array.isArray(region.holes??[])||(region.holes??[]).some(ring=>
       !Array.isArray(ring)||ring.length<3||ring.length>10000||!ring.every(validPoint)))
    throw new Error('Silhouette source polygon or hole is invalid.');
}

function buildRegionMask(region: ImageRegionGeometry, width: number, height: number): Uint8Array {
  const mask=new Uint8Array(width*height);
  const outer=region.type==='rectangle'
    ? [{x:region.x,y:region.y},{x:region.x+region.width,y:region.y},{x:region.x+region.width,y:region.y+region.height},{x:region.x,y:region.y+region.height}]
    : region.points;
  const holes=region.type==='polygon'?(region.holes??[]):[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const px=x+.5,py=y+.5;
    if(pointInRing(px,py,outer)&&!holes.some(ring=>pointInRing(px,py,ring)))mask[y*width+x]=1;
  }
  return mask;
}

interface CameraVertex { x:number;y:number;z:number }
function clipNearPlane(vertices: CameraVertex[], near: number): CameraVertex[] {
  const result:CameraVertex[]=[];
  for(let i=0;i<vertices.length;i++){
    const current=vertices[i]!,previous=vertices[(i+vertices.length-1)%vertices.length]!;
    const currentInside=current.z>=near,previousInside=previous.z>=near;
    if(currentInside!==previousInside){
      const t=(near-previous.z)/(current.z-previous.z);
      result.push({x:previous.x+(current.x-previous.x)*t,y:previous.y+(current.y-previous.y)*t,z:near});
    }
    if(currentInside)result.push(current);
  }
  return result;
}

interface ScreenVertex { x:number;y:number;invZ:number }
function rasterTriangle(a:ScreenVertex,b:ScreenVertex,c:ScreenVertex,width:number,height:number,depth:Float32Array,mask:Uint8Array):void {
  const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  if(!finite(area)||Math.abs(area)<1e-10)return;
  const minX=clamp(Math.floor(Math.min(a.x,b.x,c.x)),0,width-1),maxX=clamp(Math.ceil(Math.max(a.x,b.x,c.x)),0,width-1);
  const minY=clamp(Math.floor(Math.min(a.y,b.y,c.y)),0,height-1),maxY=clamp(Math.ceil(Math.max(a.y,b.y,c.y)),0,height-1);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const px=x+.5,py=y+.5;
    const wa=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area;
    const wb=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area;
    const wc=1-wa-wb;
    if(wa < -1e-8 || wb < -1e-8 || wc < -1e-8)continue;
    const invZ=wa*a.invZ+wb*b.invZ+wc*c.invZ;
    const offset=y*width+x;
    if(invZ>depth[offset]!){depth[offset]=invZ;mask[offset]=1;}
  }
}

/**
 * Pixel-space silhouette comparison between one confirmed 2D region and the
 * exact 3D source meshes. It is read-only and requires an explicitly shared
 * camera/model coordinate frame. The report includes raw masks and overlap
 * metrics; it does not deform, classify or accept any model geometry.
 */
export function compareClusterFormSilhouette(input: ClusterSilhouetteComparisonInput): ClusterSilhouetteComparisonReport {
  const {manifest,bindings,camera,imageWidth:imageWidth,imageHeight:imageHeight,region}=input;
  const issues=validateClusterManifest(manifest);
  if(issues.length)throw new Error('Invalid cluster manifest: '+issues.map(issue=>issue.code).join(', '));
  if(!Number.isSafeInteger(imageWidth)||!Number.isSafeInteger(imageHeight)||imageWidth<1||imageHeight<1||
     imageWidth>4096||imageHeight>4096||imageWidth*imageHeight>16_777_216)
    throw new Error('Silhouette comparison image dimensions exceed the supported pixel budget.');
  if(!camera||typeof camera.coordinateFrameId!=='string'||!/^[a-z0-9][a-z0-9._:-]{0,127}$/i.test(camera.coordinateFrameId)||
     camera.coordinateFrameId!==input.meshCoordinateFrameId||!finite(camera.fx)||!finite(camera.fy)||
     !finite(camera.cx)||!finite(camera.cy)||camera.fx<=0||camera.fy<=0||camera.cx<0||camera.cx>1||
     camera.cy<0||camera.cy>1||!isValidImageReferenceCameraTransform([...camera.cameraToWorld]))
    throw new Error('Silhouette camera and model must use the same valid coordinate frame and camera calibration.');
  const near=input.nearPlane??1e-4;
  if(!finite(near)||near<=0)throw new Error('Silhouette near plane must be positive.');
  validateRegion(region,imageWidth,imageHeight);
  const byId=new Map<string,ClusterMeshBinding>();
  for(const binding of bindings){
    if(!binding||typeof binding.meshId!=='string'||byId.has(binding.meshId))
      throw new Error('Silhouette bindings contain a missing or duplicate source mesh ID.');
    byId.set(binding.meshId,binding);
  }
  const expectedIds=new Set(manifest.meshes.map(mesh=>mesh.id));
  for(const id of byId.keys())if(!expectedIds.has(id))throw new Error('Silhouette binding is outside the source mesh inventory.');
  for(const id of expectedIds)if(!byId.has(id))throw new Error('Silhouette source mesh is missing: '+id);
  const regionMask=buildRegionMask(region,imageWidth,imageHeight);
  const modelMask=new Uint8Array(imageWidth*imageHeight);
  const depth=new Float32Array(imageWidth*imageHeight);
  const cameraWorld=new Matrix4().fromArray([...camera.cameraToWorld]);
  const worldToCamera=cameraWorld.clone().invert();
  for(const source of manifest.meshes){
    const binding=byId.get(source.id)!;
    const geometry=binding.geometry,position=geometry.getAttribute('position');
    const elementCount=geometry.index?.count??position?.count??0;
    if(!position||position.count!==source.vertexCount||elementCount!==source.triangleCount*3)
      throw new Error('Silhouette geometry no longer matches source inventory for '+source.id+'.');
    binding.mesh.updateWorldMatrix(true,false);
    const meshToWorld=binding.mesh.matrixWorld;
    for(let triangle=0;triangle<source.triangleCount;triangle++){
      const offset=triangle*3;
      const vertices=[0,1,2].map(slot=>{
        const vertexIndex=geometry.index?.getX(offset+slot)??offset+slot;
        if(!Number.isSafeInteger(vertexIndex)||vertexIndex<0||vertexIndex>=position.count)
          throw new Error('Silhouette triangle index is outside source geometry.');
        const world=new Vector3(position.getX(vertexIndex),position.getY(vertexIndex),position.getZ(vertexIndex)).applyMatrix4(meshToWorld);
        const point=world.applyMatrix4(worldToCamera);
        return {x:point.x,y:point.y,z:point.z};
      });
      const clipped=clipNearPlane(vertices,near);
      if(clipped.length<3)continue;
      const projected=clipped.map(point=>({
        x:(camera.fx*point.x/point.z+camera.cx)*imageWidth,
        y:(camera.cy-camera.fy*point.y/point.z)*imageHeight,
        invZ:1/point.z,
      }));
      for(let i=1;i<projected.length-1;i++)
        rasterTriangle(projected[0]!,projected[i]!,projected[i+1]!,imageWidth,imageHeight,depth,modelMask);
    }
  }
  let regionPixelCount=0,modelPixelCount=0,intersectionPixelCount=0,unionPixelCount=0;
  for(let i=0;i<regionMask.length;i++){
    const inRegion=regionMask[i]===1,inModel=modelMask[i]===1;
    if(inRegion)regionPixelCount++;
    if(inModel)modelPixelCount++;
    if(inRegion&&inModel)intersectionPixelCount++;
    if(inRegion||inModel)unionPixelCount++;
  }
  const falsePositivePixelCount=modelPixelCount-intersectionPixelCount;
  const falseNegativePixelCount=regionPixelCount-intersectionPixelCount;
  return {
    sourceAssetSha256:manifest.sourceAssetSha256,coordinateFrameId:camera.coordinateFrameId,
    imageWidth,imageHeight,regionPixelCount,modelPixelCount,intersectionPixelCount,unionPixelCount,
    falsePositivePixelCount,falseNegativePixelCount,
    intersectionOverUnion:unionPixelCount?intersectionPixelCount/unionPixelCount:1,
    precision:modelPixelCount?intersectionPixelCount/modelPixelCount:0,
    recall:regionPixelCount?intersectionPixelCount/regionPixelCount:0,
    regionMask,modelMask,
  };
}
