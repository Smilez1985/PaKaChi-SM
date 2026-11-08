import type {BufferGeometry,Matrix4} from 'three';
export function optimizeSkinWeights(geometry:BufferGeometry,matrixSets:Matrix4[][],options?:{iterations?:number;step?:number}):{indices:Uint16Array;weights:Float32Array;activeVertices:number};
