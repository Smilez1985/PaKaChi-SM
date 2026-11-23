import { Matrix4, Vector3 } from 'three';
import type { ClusterLandmarkSeed } from './cluster-landmark-classifier.ts';

export interface LandmarkCameraCalibration {
  viewId: string;
  /** Focal length and principal point in normalized image coordinates. */
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  /** Column-major camera-to-world transform. Camera forward is local +Z. */
  cameraToWorld: readonly number[];
}

export interface Landmark2DObservation {
  /** Explicit image-reference identity; never inferred from array order or camera view. */
  avatarId: string;
  formId: string;
  poseId: string;
  landmarkId: string;
  partId: string;
  /** Normalized image coordinates in [0, 1]. */
  x: number;
  y: number;
  confidence: number;
  camera: LandmarkCameraCalibration;
  /** Desired evidence radius in world units, before mesh-local conversion. */
  radiusWorld: number;
  surfaceLayerId?: string | null;
}

export interface LandmarkTriangulationOptions {
  minParallaxDegrees?: number;
  maxRayErrorWorld?: number;
}

export interface TriangulatedLandmarkSeed extends ClusterLandmarkSeed {
  avatarId: string;
  formId: string;
  poseId: string;
  landmarkId: string;
  viewCount: number;
  reprojectionProxyErrorWorld: number;
  parallaxDegrees: number;
  confidence: number;
}

export interface LandmarkTriangulationReport {
  seeds: TriangulatedLandmarkSeed[];
  rejected: Array<{ avatarId: string; formId: string; poseId: string; landmarkId: string; reason: string }>;
}

interface Ray {
  origin: Vector3;
  direction: Vector3;
  confidence: number;
}

function finiteMatrix(values: readonly number[]): Matrix4 {
  if (!Array.isArray(values) || values.length !== 16 || !values.every(Number.isFinite)) {
    throw new Error('Camera transform must contain 16 finite column-major values.');
  }
  const matrix = new Matrix4().fromArray([...values]);
  if (Math.abs(matrix.determinant()) < 1e-10) throw new Error('Camera transform is singular.');
  return matrix;
}

function makeRay(observation: Landmark2DObservation): Ray {
  const { camera } = observation;
  if (!camera || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(camera.viewId) ||
      ![camera.fx, camera.fy, camera.cx, camera.cy].every(Number.isFinite) ||
      camera.fx <= 0 || camera.fy <= 0 ||
      ![observation.x, observation.y].every(Number.isFinite) ||
      observation.x < 0 || observation.x > 1 || observation.y < 0 || observation.y > 1 ||
      !Number.isFinite(observation.confidence) || observation.confidence <= 0 || observation.confidence > 1) {
    throw new Error('Invalid normalized 2D landmark observation or camera intrinsics.');
  }
  const cameraToWorld = finiteMatrix(camera.cameraToWorld);
  // Image pixel Y grows downward, while the camera's local +Y axis points upward.
  const direction = new Vector3(
    (observation.x - camera.cx) / camera.fx,
    (camera.cy - observation.y) / camera.fy,
    1,
  ).transformDirection(cameraToWorld);
  const origin = new Vector3().setFromMatrixPosition(cameraToWorld);
  return { origin, direction, confidence: observation.confidence };
}

function solve3(matrix: number[][], vector: number[]): Vector3 | null {
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let column = 0; column < 3; column++) {
    let pivot = column;
    for (let row = column + 1; row < 3; row++) {
      if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
    }
    if (Math.abs(a[pivot][column]) < 1e-10) return null;
    [a[column], a[pivot]] = [a[pivot], a[column]];
    const divisor = a[column][column];
    for (let j = column; j < 4; j++) a[column][j] /= divisor;
    for (let row = 0; row < 3; row++) {
      if (row === column) continue;
      const factor = a[row][column];
      for (let j = column; j < 4; j++) a[row][j] -= factor * a[column][j];
    }
  }
  return new Vector3(a[0][3], a[1][3], a[2][3]);
}

function triangulate(rays: readonly Ray[]): { point: Vector3; error: number; parallax: number } | null {
  const normal = [[0,0,0],[0,0,0],[0,0,0]];
  const rhs = [0,0,0];
  for (const ray of rays) {
    const d = ray.direction;
    const w = ray.confidence;
    const projection = [
      [1-d.x*d.x, -d.x*d.y, -d.x*d.z],
      [-d.y*d.x, 1-d.y*d.y, -d.y*d.z],
      [-d.z*d.x, -d.z*d.y, 1-d.z*d.z],
    ];
    const o = [ray.origin.x, ray.origin.y, ray.origin.z];
    for (let i=0;i<3;i++) {
      for (let j=0;j<3;j++) normal[i][j] += w*projection[i][j];
      for (let j=0;j<3;j++) rhs[i] += w*projection[i][j]*o[j];
    }
  }
  const point = solve3(normal, rhs);
  if (!point) return null;
  const errors = rays.map(ray => {
    const delta = point.clone().sub(ray.origin);
    return delta.clone().addScaledVector(ray.direction, -delta.dot(ray.direction)).length();
  });
  const error = Math.sqrt(errors.reduce((sum, value)=>sum+value*value,0)/errors.length);
  let parallax = 0;
  for (let i=0;i<rays.length;i++) for (let j=i+1;j<rays.length;j++) {
    const dot = Math.max(-1, Math.min(1, rays[i].direction.dot(rays[j].direction)));
    parallax = Math.max(parallax, Math.acos(dot));
  }
  return { point, error, parallax: parallax*180/Math.PI };
}

/**
 * Triangulates semantic landmarks from calibrated multi-view 2D observations.
 * All camera-to-world transforms must use the same world frame as meshWorld.
 * The returned seed positions are mesh-local and can be passed to the cluster
 * classifier. A single image is deliberately insufficient to infer depth.
 */
export function triangulateLandmarkSeeds(
  observations: readonly Landmark2DObservation[],
  meshWorld: readonly number[],
  options: LandmarkTriangulationOptions = {},
): LandmarkTriangulationReport {
  if (!Array.isArray(observations) || observations.length === 0) {
    throw new Error('At least one 2D landmark observation is required.');
  }
  const minParallax = options.minParallaxDegrees ?? 3;
  const maxError = options.maxRayErrorWorld ?? 0.05;
  if (!Number.isFinite(minParallax) || minParallax <= 0 || minParallax >= 90 ||
      !Number.isFinite(maxError) || maxError <= 0) throw new Error('Invalid triangulation thresholds.');
  const meshMatrix = finiteMatrix(meshWorld);
  const elements = meshMatrix.elements;
  if (Math.abs(elements[3]!) > 1e-10 || Math.abs(elements[7]!) > 1e-10 ||
      Math.abs(elements[11]!) > 1e-10 || Math.abs(elements[15]! - 1) > 1e-10) {
    throw new Error('Mesh world transform must be affine.');
  }
  // A world-space sphere becomes an ellipsoid in mesh-local space. Use the
  // smallest singular value so the local sphere encloses that ellipsoid even
  // with non-uniform node scaling or rotated scale axes.
  const a = [
    [elements[0]!, elements[4]!, elements[8]!],
    [elements[1]!, elements[5]!, elements[9]!],
    [elements[2]!, elements[6]!, elements[10]!],
  ];
  const gram = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, column) =>
      a[0]![row]! * a[0]![column]! +
      a[1]![row]! * a[1]![column]! +
      a[2]![row]! * a[2]![column]!,
    ),
  );
  // Jacobi diagonalization of the symmetric 3x3 Gram matrix.
  for (let iteration = 0; iteration < 24; iteration++) {
    let p = 0, q = 1;
    if (Math.abs(gram[0]![2]!) > Math.abs(gram[p]![q]!)) { p = 0; q = 2; }
    if (Math.abs(gram[1]![2]!) > Math.abs(gram[p]![q]!)) { p = 1; q = 2; }
    if (Math.abs(gram[p]![q]!) < 1e-14) break;
    const angle = 0.5 * Math.atan2(2 * gram[p]![q]!, gram[q]![q]! - gram[p]![p]!);
    const c = Math.cos(angle), s = Math.sin(angle);
    const pp = gram[p]![p]!, qq = gram[q]![q]!, pq = gram[p]![q]!;
    gram[p]![p] = c*c*pp - 2*s*c*pq + s*s*qq;
    gram[q]![q] = s*s*pp + 2*s*c*pq + c*c*qq;
    gram[p]![q] = gram[q]![p] = 0;
    for (let k = 0; k < 3; k++) {
      if (k === p || k === q) continue;
      const kp = gram[k]![p]!, kq = gram[k]![q]!;
      gram[k]![p] = gram[p]![k] = c*kp - s*kq;
      gram[k]![q] = gram[q]![k] = s*kp + c*kq;
    }
  }
  const minEigenvalue = Math.min(gram[0]![0]!, gram[1]![1]!, gram[2]![2]!);
  const minScale = Math.sqrt(Math.max(0, minEigenvalue));
  if (!Number.isFinite(minScale) || minScale <= 1e-10) throw new Error('Mesh world transform has no usable scale.');
  const worldToMesh = meshMatrix.clone().invert();

  const groups = new Map<string, Landmark2DObservation[]>();
  for (const observation of observations) {
    if (!observation || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(observation.avatarId) ||
        !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(observation.formId) ||
        !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(observation.poseId) ||
        !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(observation.landmarkId) ||
        !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(observation.partId) ||
        !Number.isFinite(observation.radiusWorld) || observation.radiusWorld <= 0 ||
        (observation.surfaceLayerId != null && !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(observation.surfaceLayerId))) {
      throw new Error('Invalid semantic landmark metadata or evidence radius.');
    }
    const key = JSON.stringify([observation.avatarId, observation.formId, observation.poseId, observation.landmarkId]);
    const group = groups.get(key) ?? [];
    if (group.some(item => item.camera.viewId === observation.camera.viewId)) {
      throw new Error('A landmark may have only one observation per calibrated view.');
    }
    if (group.length && (group[0].avatarId !== observation.avatarId ||
        group[0].formId !== observation.formId || group[0].poseId !== observation.poseId ||
        group[0].partId !== observation.partId ||
        group[0].surfaceLayerId !== observation.surfaceLayerId ||
        Math.abs(group[0].radiusWorld - observation.radiusWorld) > 1e-8)) {
      throw new Error('Observations for one landmark must share part, layer and radius metadata.');
    }
    group.push(observation);
    groups.set(key, group);
  }

  const report: LandmarkTriangulationReport = { seeds: [], rejected: [] };
  for (const group of groups.values()) {
    const identity = { avatarId: group[0]!.avatarId, formId: group[0]!.formId, poseId: group[0]!.poseId, landmarkId: group[0]!.landmarkId };
    if (group.length < 2) {
      report.rejected.push({ ...identity, reason: 'At least two calibrated views are required for depth.' });
      continue;
    }
    const rays = group.map(makeRay);
    const result = triangulate(rays);
    if (!result) {
      report.rejected.push({ ...identity, reason: 'Camera rays do not provide a stable triangulation.' });
      continue;
    }
    // A ray intersection behind any camera is geometrically invalid even when
    // the infinite lines intersect with a small residual. Enforce cheirality.
    const behindCamera = rays.some(ray =>
      result.point.clone().sub(ray.origin).dot(ray.direction) <= 1e-8,
    );
    if (behindCamera) {
      report.rejected.push({ ...identity, reason: 'Triangulated landmark lies behind at least one camera.' });
      continue;
    }
    if (result.parallax < minParallax) {
      report.rejected.push({ ...identity, reason: 'Camera baseline is too small for reliable depth.' });
      continue;
    }
    if (result.error > maxError) {
      report.rejected.push({ ...identity, reason: 'Multi-view ray residual exceeds the configured tolerance.' });
      continue;
    }
    const local = result.point.applyMatrix4(worldToMesh);
    const confidence = Math.max(0, Math.min(1,
      Math.min(...group.map(item => item.confidence)) *
      Math.min(1, result.parallax / 15) *
      Math.max(0, 1 - result.error / maxError),
    ));
    report.seeds.push({
      ...identity,
      partId: group[0].partId,
      position: [local.x, local.y, local.z],
      radius: group[0].radiusWorld / minScale,
      surfaceLayerId: group[0].surfaceLayerId ?? null,
      viewCount: group.length,
      reprojectionProxyErrorWorld: result.error,
      parallaxDegrees: result.parallax,
      confidence,
    });
  }
  return report;
}
