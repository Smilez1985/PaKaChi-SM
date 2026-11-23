import type { ImageReferenceCameraCalibration, ImageReferenceDocument } from './image-reference.ts';
import type { Landmark2DObservation } from './cluster-landmark-projection.ts';

/**
 * Convert confirmed source-pixel landmarks into calibrated normalized observations.
 * The caller must select one explicit avatar/form/pose; no view, pose or camera is inferred.
 */
export function createCalibratedLandmarkObservations(
  document: ImageReferenceDocument,
  identity: { avatarId: string; formId: string; poseId: string },
): Landmark2DObservation[] {
  if (!document || document.format !== 'pakachi-image-reference' || document.version !== 1 ||
      !Number.isSafeInteger(document.source.width) || document.source.width <= 0 ||
      !Number.isSafeInteger(document.source.height) || document.source.height <= 0 ||
      !/^[a-f0-9]{64}$/i.test(document.source.sha256)) {
    throw new Error('A valid immutable image-reference document is required.');
  }
  const validId = (value: string) => /^[a-z0-9][a-z0-9_-]{0,127}$/.test(value);
  if (!identity || !validId(identity.avatarId) || !validId(identity.formId) || !validId(identity.poseId)) {
    throw new Error('Select one explicit avatar, form and pose before reconstructing depth.');
  }
  const avatar = document.avatars.find(item => item.id === identity.avatarId);
  const form = document.forms.find(item => item.id === identity.formId);
  if (!avatar || !avatar.formIds.includes(identity.formId) || !form) {
    throw new Error('The selected avatar and form do not match the image-reference hierarchy.');
  }
  const allowedViews = new Set(form.viewIds);
  const viewByRegion = new Map<string, string>();
  for (const viewId of form.viewIds) {
    const view = document.views.find(item => item.id === viewId);
    if (!view) throw new Error('The selected form references a missing image view.');
    for (const regionId of view.regionIds) viewByRegion.set(regionId, view.id);
  }
  const calibrations = (document.cameraCalibrations ?? []).filter(item =>
    item.avatarId === identity.avatarId && item.formId === identity.formId &&
    item.poseId === identity.poseId && allowedViews.has(item.viewId),
  );
  const calibrationByView = new Map<string, ImageReferenceCameraCalibration>();
  for (const calibration of calibrations) {
    if (calibration.sourceImageSha256 !== document.source.sha256) {
      throw new Error('Camera calibration belongs to a different source image.');
    }
    if (calibrationByView.has(calibration.viewId)) {
      throw new Error('Duplicate camera calibration for the selected view and pose.');
    }
    calibrationByView.set(calibration.viewId, calibration);
  }
  const confirmedRegions = new Set(document.regions.filter(region => region.status === 'confirmed').map(region => region.id));
  const observations: Landmark2DObservation[] = [];
  for (const landmark of document.landmarks ?? []) {
    if (landmark.poseId !== identity.poseId) continue;
    if (!confirmedRegions.has(landmark.regionId)) continue;
    const viewId = viewByRegion.get(landmark.regionId);
    if (!viewId) continue;
    const calibration = calibrationByView.get(viewId);
    if (!calibration) continue;
    observations.push({
      avatarId: identity.avatarId,
      formId: identity.formId,
      poseId: identity.poseId,
      landmarkId: landmark.correspondenceId ?? landmark.id,
      partId: landmark.partId,
      x: landmark.x / document.source.width,
      y: landmark.y / document.source.height,
      confidence: 1,
      camera: {
        viewId: calibration.viewId,
        fx: calibration.fx,
        fy: calibration.fy,
        cx: calibration.cx,
        cy: calibration.cy,
        cameraToWorld: calibration.cameraToWorld,
      },
      radiusWorld: landmark.radiusPx / Math.max(document.source.width, document.source.height),
      surfaceLayerId: landmark.surfaceLayerId ?? null,
    });
  }
  return observations;
}
