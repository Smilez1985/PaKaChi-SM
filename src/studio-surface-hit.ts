import * as T from 'three';

export interface StudioSurfaceFace { a: number; b: number; c: number }

/** Convert a world-space ray hit into stable triangle material coordinates. */
export function studioSurfaceHitBarycentric(
  mesh: T.Mesh,
  face: StudioSurfaceFace,
  worldPoint: T.Vector3,
): readonly [number, number, number] | null {
  const localPoint = mesh.worldToLocal(worldPoint.clone());
  const a = mesh.getVertexPosition(face.a, new T.Vector3());
  const b = mesh.getVertexPosition(face.b, new T.Vector3());
  const c = mesh.getVertexPosition(face.c, new T.Vector3());
  const weights = T.Triangle.getBarycoord(localPoint, a, b, c, new T.Vector3());
  if (!weights || ![weights.x, weights.y, weights.z].every(Number.isFinite)) return null;
  const raw = [weights.x, weights.y, weights.z];
  if (raw.some(value => value < -1e-5 || value > 1 + 1e-5)) return null;
  const clamped = raw.map(value => T.MathUtils.clamp(value, 0, 1));
  const total = clamped.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  return clamped.map(value => value / total) as [number, number, number];
}
