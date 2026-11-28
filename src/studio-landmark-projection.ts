import { validateImageReferenceDocument, type ImageReferenceCameraCalibration, type ImageReferenceDocument } from './image-reference.ts';
import { triangulateLandmarkSeeds } from './cluster-landmark-projection.ts';
import type { Landmark2DObservation, LandmarkTriangulationOptions } from './cluster-landmark-projection.ts';

/**
 * Convert confirmed source-pixel landmarks into calibrated normalized observations.
 * The caller must select one explicit avatar/form/pose; no view, pose or camera is inferred.
 */
export function createCalibratedLandmarkObservations(
  document: ImageReferenceDocument,
  identity: { avatarId: string; formId: string; poseId: string; radiusWorld: number },
): Landmark2DObservation[] {
  if (!document || document.format !== 'pakachi-image-reference' || document.version !== 1 ||
      !Number.isSafeInteger(document.source.width) || document.source.width <= 0 ||
      !Number.isSafeInteger(document.source.height) || document.source.height <= 0 ||
      !/^[a-f0-9]{64}$/i.test(document.source.sha256)) {
    throw new Error('A valid immutable image-reference document is required.');
  }
  const documentIssues = validateImageReferenceDocument(document);
  if (documentIssues.length > 0) {
    throw new Error(`invalid-image-reference-document:${documentIssues.map(issue => issue.path).join(',')}`);
  }
  const validId = (value: string) => /^[a-z0-9][a-z0-9_-]{0,127}$/.test(value);
  if (!identity || !validId(identity.avatarId) || !validId(identity.formId) || !validId(identity.poseId) ||
      !Number.isFinite(identity.radiusWorld) || identity.radiusWorld <= 0) {
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
        ...(calibration.coordinateFrameId ? { coordinateFrameId: calibration.coordinateFrameId } : {}),
        fx: calibration.fx,
        fy: calibration.fy,
        cx: calibration.cx,
        cy: calibration.cy,
        cameraToWorld: calibration.cameraToWorld,
      },
      radiusWorld: identity.radiusWorld,
      surfaceLayerId: landmark.surfaceLayerId ?? null,
    });
  }
  return observations;
}


export interface LandmarkCalibrationCoverageItem {
  landmarkId: string;
  partId: string;
  viewIds: string[];
  calibratedViewIds: string[];
  missingCalibrationViewIds: string[];
  hasMultiViewCalibration: boolean;
}

export interface LandmarkCalibrationCoverageReport {
  avatarId: string;
  formId: string;
  poseId: string;
  sourceImageSha256: string;
  policy: 'read-only';
  automaticCalibrationApplied: false;
  calibratedViewCount: number;
  landmarkCount: number;
  landmarksWithNoCalibration: number;
  landmarksWithOneCalibratedView: number;
  landmarksWithMultiViewCalibration: number;
  items: LandmarkCalibrationCoverageItem[];
}

/**
 * Reports whether each confirmed landmark has enough explicitly calibrated
 * views to attempt depth triangulation. Two views are only a minimum coverage
 * gate: this report does not claim sufficient parallax or a valid 3D solution.
 */
export function createLandmarkCalibrationCoverageReport(
  document: ImageReferenceDocument,
  identity: { avatarId: string; formId: string; poseId: string; radiusWorld: number },
): LandmarkCalibrationCoverageReport {
  // Reuse the strict source, hierarchy, identity and calibration validation.
  createCalibratedLandmarkObservations(document, identity);
  const form = document.forms.find(item => item.id === identity.formId)!;
  const viewByRegion = new Map<string, string>();
  for (const viewId of form.viewIds) {
    const view = document.views.find(item => item.id === viewId)!;
    for (const regionId of view.regionIds) viewByRegion.set(regionId, viewId);
  }
  const confirmedRegions = new Set(document.regions
    .filter(region => region.status === 'confirmed')
    .map(region => region.id));
  const groups = new Map<string, { partId: string; viewIds: Set<string> }>();
  for (const landmark of document.landmarks ?? []) {
    if (landmark.poseId !== identity.poseId || !confirmedRegions.has(landmark.regionId)) continue;
    const viewId = viewByRegion.get(landmark.regionId);
    if (!viewId) continue;
    const landmarkId = landmark.correspondenceId ?? landmark.id;
    const group = groups.get(landmarkId) ?? { partId: landmark.partId, viewIds: new Set<string>() };
    if (group.partId !== landmark.partId) {
      throw new Error('A landmark correspondence cannot span different anatomical parts.');
    }
    group.viewIds.add(viewId);
    groups.set(landmarkId, group);
  }
  const calibrations = new Set((document.cameraCalibrations ?? [])
    .filter(item => item.avatarId === identity.avatarId && item.formId === identity.formId &&
      item.poseId === identity.poseId && item.sourceImageSha256 === document.source.sha256)
    .map(item => item.viewId));
  const items = [...groups.entries()].map(([landmarkId, group]) => {
    const viewIds = [...group.viewIds].sort();
    const calibratedViewIds = viewIds.filter(viewId => calibrations.has(viewId));
    const missingCalibrationViewIds = viewIds.filter(viewId => !calibrations.has(viewId));
    return {
      landmarkId,
      partId: group.partId,
      viewIds,
      calibratedViewIds,
      missingCalibrationViewIds,
      hasMultiViewCalibration: calibratedViewIds.length >= 2,
    };
  }).sort((a, b) => a.landmarkId.localeCompare(b.landmarkId));
  const counts = {
    landmarksWithNoCalibration: items.filter(item => item.calibratedViewIds.length === 0).length,
    landmarksWithOneCalibratedView: items.filter(item => item.calibratedViewIds.length === 1).length,
    landmarksWithMultiViewCalibration: items.filter(item => item.hasMultiViewCalibration).length,
  };
  return {
    avatarId: identity.avatarId,
    formId: identity.formId,
    poseId: identity.poseId,
    sourceImageSha256: document.source.sha256,
    policy: 'read-only',
    automaticCalibrationApplied: false,
    calibratedViewCount: new Set(items.flatMap(item => item.calibratedViewIds)).size,
    landmarkCount: items.length,
    ...counts,
    items,
  };
}

export interface LandmarkTriangulationQualityItem {
  landmarkId: string;
  partId: string;
  viewIds: string[];
  calibratedViewIds: string[];
  status: 'ready' | 'rejected' | 'missing-observations';
  parallaxDegrees: number | null;
  rayErrorWorld: number | null;
  confidence: number | null;
  reason: string | null;
}

export interface LandmarkTriangulationQualityReport {
  avatarId: string;
  formId: string;
  poseId: string;
  sourceImageSha256: string;
  policy: 'read-only';
  automaticCalibrationApplied: false;
  triangulatedPositionsExported: false;
  thresholds: { minParallaxDegrees: number; maxRayErrorWorld: number };
  readyCount: number;
  rejectedCount: number;
  missingObservationCount: number;
  items: LandmarkTriangulationQualityItem[];
}

/**
 * Runs the existing calibrated-ray triangulation as a read-only quality gate.
 * The identity mesh transform is used only to run the solver; mesh-local points
 * are discarded and never exposed or persisted by this diagnostic report.
 */
export function createLandmarkTriangulationQualityReport(
  document: ImageReferenceDocument,
  identity: { avatarId: string; formId: string; poseId: string },
  options: LandmarkTriangulationOptions = {},
): LandmarkTriangulationQualityReport {
  const coverage = createLandmarkCalibrationCoverageReport(document, { ...identity, radiusWorld: 1 });
  const observations = createCalibratedLandmarkObservations(document, { ...identity, radiusWorld: 1 });
  const solved = observations.length ? triangulateLandmarkSeeds(observations, [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ], options) : { seeds: [], rejected: [] };
  const minParallaxDegrees = options.minParallaxDegrees ?? 3;
  const maxRayErrorWorld = options.maxRayErrorWorld ?? 0.05;
  const items = coverage.items.map(item => {
    const seed = solved.seeds.find(value => value.landmarkId === item.landmarkId);
    if (seed) return {
      landmarkId: item.landmarkId, partId: item.partId, viewIds: item.viewIds,
      calibratedViewIds: item.calibratedViewIds, status: 'ready' as const,
      parallaxDegrees: seed.parallaxDegrees, rayErrorWorld: seed.reprojectionProxyErrorWorld,
      confidence: seed.confidence, reason: null,
    };
    const rejection = solved.rejected.find(value => value.landmarkId === item.landmarkId);
    return {
      landmarkId: item.landmarkId, partId: item.partId, viewIds: item.viewIds,
      calibratedViewIds: item.calibratedViewIds,
      status: (rejection ? 'rejected' : 'missing-observations') as 'rejected' | 'missing-observations',
      parallaxDegrees: null, rayErrorWorld: null, confidence: null,
      reason: rejection?.reason ?? 'No calibrated observations are available for this landmark.',
    };
  });
  return {
    ...identity,
    sourceImageSha256: document.source.sha256,
    policy: 'read-only',
    automaticCalibrationApplied: false,
    triangulatedPositionsExported: false,
    thresholds: { minParallaxDegrees, maxRayErrorWorld },
    readyCount: items.filter(item => item.status === 'ready').length,
    rejectedCount: items.filter(item => item.status === 'rejected').length,
    missingObservationCount: items.filter(item => item.status === 'missing-observations').length,
    items,
  };
}

