import { validateImageReferenceDocument } from './image-reference.ts';
import type { ImageReferenceDocument } from './image-reference.ts';
import type { ClusterManifest, ClusterForm } from './cluster-architecture.ts';
import type { ClusterMeshBinding } from './cluster-inventory.ts';
import { compareClusterFormSilhouette } from './cluster-form-silhouette.ts';
import type { ClusterSilhouetteComparisonReport } from './cluster-form-silhouette.ts';

export interface ClusterFormSilhouetteSelection {
  avatarId: string;
  formId: string;
  viewId: string;
  regionId: string;
  poseId: string;
  targetForm: Exclude<ClusterForm, 'imported'>;
  meshCoordinateFrameId: string;
}

/**
 * Strictly resolves the selected, user-confirmed 2D reference hierarchy and its
 * exact camera calibration before invoking the read-only silhouette comparator.
 * The caller must provide bindings from the same parsed source asset as manifest.
 */
export function compareSelectedClusterFormSilhouette(input: {
  document: ImageReferenceDocument;
  selection: ClusterFormSilhouetteSelection;
  manifest: ClusterManifest;
  bindings: readonly ClusterMeshBinding[];
}): ClusterSilhouetteComparisonReport {
  const {document,selection,manifest,bindings}=input;
  const issues=validateImageReferenceDocument(document);
  if(issues.length)throw new Error('Invalid image reference document: '+issues.map(issue=>issue.path).join(', '));
  if(!selection||![selection.avatarId,selection.formId,selection.viewId,selection.regionId,selection.poseId,selection.meshCoordinateFrameId].every(value=>typeof value==='string'&&value.trim().length>0))
    throw new Error('Silhouette comparison requires explicit avatar, form, view, region, pose and model coordinate-frame selections.');
  if(selection.targetForm!=='animal'&&selection.targetForm!=='humanoid')
    throw new Error('Silhouette comparison requires an explicit animal or humanoid target form.');
  if(manifest.form!==selection.targetForm)
    throw new Error('Selected reference form and target cluster manifest form do not match.');
  const avatar=document.avatars.find(value=>value.id===selection.avatarId);
  const form=document.forms.find(value=>value.id===selection.formId);
  const view=document.views.find(value=>value.id===selection.viewId);
  const region=document.regions.find(value=>value.id===selection.regionId);
  if(!avatar||!avatar.formIds.includes(selection.formId)||!form||!form.viewIds.includes(selection.viewId)||
     !view||!view.regionIds.includes(selection.regionId)||!region)
    throw new Error('Selected image region is not linked through the selected avatar, form and view hierarchy.');
  if(region.status!=='confirmed'||region.kind==='helper')
    throw new Error('Only a user-confirmed, non-helper image region can be compared.');
  const calibrations=(document.cameraCalibrations??[]).filter(camera=>
    camera.sourceImageSha256.toLowerCase()===document.source.sha256.toLowerCase()&&
    camera.avatarId===selection.avatarId&&camera.formId===selection.formId&&
    camera.poseId===selection.poseId&&camera.viewId===selection.viewId);
  if(calibrations.length!==1)
    throw new Error(calibrations.length===0
      ? 'No exact camera calibration exists for the selected source image, avatar, form, pose and view.'
      : 'Multiple camera calibrations match the selected reference; the calibration must be unambiguous.');
  const camera=calibrations[0]!;
  if(!camera.coordinateFrameId||camera.coordinateFrameId!==selection.meshCoordinateFrameId)
    throw new Error('Selected camera calibration and target model do not share the explicitly selected coordinate frame.');
  return compareClusterFormSilhouette({
    manifest,bindings,
    camera:{coordinateFrameId:camera.coordinateFrameId,fx:camera.fx,fy:camera.fy,cx:camera.cx,cy:camera.cy,cameraToWorld:camera.cameraToWorld},
    meshCoordinateFrameId:selection.meshCoordinateFrameId,
    imageWidth:document.source.width,imageHeight:document.source.height,
    region:region.geometry,
  });
}
