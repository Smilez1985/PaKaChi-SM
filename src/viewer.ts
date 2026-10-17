import * as THREE from 'three';
import { StudioView } from './studio-view.ts';
import type { StudioRig } from './studio-rig.ts';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { MouseNavigation } from './mouse-navigation.ts';
import { options } from './options.ts';
import { modelCenter, rotateCamera } from './camera.ts';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

export function disposeModel(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const skeletons = new Set<THREE.Skeleton>();
  root.traverse(object => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
    }
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
  });
  materials.forEach(m => {
    Object.values(m).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    m.dispose();
  });
  geometries.forEach(g => g.dispose());
  textures.forEach(t => t.dispose());
  skeletons.forEach(s => s.dispose());
}

export async function parseModel(buffer: ArrayBuffer): Promise<GLTF> {
  // Models must be self-contained. No hidden network requests from an imported asset.
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(url => {
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    throw new Error('Das Modell verweist auf externe Dateien. Bitte als eigenständige GLB-Datei exportieren.');
  });
  const gltf = await new GLTFLoader(manager).parseAsync(buffer, '');
  // Stable, unique names also make unnamed or duplicate imported clips selectable.
  const names = new Set<string>();
  gltf.animations.forEach((clip, index) => {
    const base = clip.name.trim() || `Bewegung ${index + 1}`;
    let name = base;
    let suffix = 2;
    while (names.has(name)) name = `${base} (${suffix++})`;
    clip.name = name;
    names.add(name);
  });
  return gltf;
}

export function modelBounds(root:THREE.Object3D):THREE.Box3 {
  root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.length())||size.length()===0)throw new Error('Das Modell enthält keine sichtbare Geometrie.');
  return bounds;
}

export class Viewer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  private readonly controls: ArcballControls & {target:THREE.Vector3; _gizmos:THREE.Group};
  private readonly mouse:MouseNavigation;
  private floor: THREE.Mesh;
  private readonly holder = new THREE.Group();
  private model: THREE.Object3D | null = null;
  private skeleton: THREE.SkeletonHelper | null = null;
  private frame = 0;
  private last = performance.now();
  private readonly resize: ResizeObserver;
  onFrame: (delta: number) => void = () => {};

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.setAttribute('aria-label', 'Drehbare 3D-Ansicht des Avatars');
    container.append(this.renderer.domElement);
    this.controls = new ArcballControls(this.camera, this.renderer.domElement, this.scene) as ArcballControls & {target:THREE.Vector3; _gizmos:THREE.Group};
    this.controls.unsetMouseAction(1);
    this.mouse=new MouseNavigation(this.renderer.domElement,this.camera,()=>modelCenter(this.model),
      active=>{this.controls.enabled=!active;},(rotation,pivot)=>{this.controls.target.copy(this.controls._gizmos.position).sub(pivot).applyQuaternion(rotation).add(pivot);this.controls.setCamera(this.camera);this.controls.setGizmosVisible(false);},()=>options.invertMiddleRotation);
    this.controls.enableAnimations = false;
    this.controls.enablePan = true;
    this.controls.cursorZoom = true;
    this.controls.minDistance = 0.08;
    this.controls.maxDistance = 9;
    this.controls.setGizmosVisible(false);
    this.scene.add(new THREE.HemisphereLight(0xe5f5ff, 0x75857a, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(3, 5, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xb6e8da, 2.5);
    rim.position.set(-4, 3, -3);
    this.scene.add(rim);
    const floor = this.floor = new THREE.Mesh(new THREE.CylinderGeometry(1.23, 1.27, 0.07, 64),
      new THREE.MeshStandardMaterial({ color: 0xc7d6c9, roughness: 0.9 }));
    floor.position.y = -0.055;
    this.scene.add(floor, this.holder);
    this.resetCamera();
    this.resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      this.renderer.setSize(Math.max(1, width), Math.max(1, height));
      this.camera.aspect = Math.max(1, width) / Math.max(1, height);
      this.camera.updateProjectionMatrix();
    });
    this.resize.observe(container);
    const render = (now: number) => {
      this.frame = requestAnimationFrame(render);
      const delta = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.onFrame(delta);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    this.frame = requestAnimationFrame(render);
  }

  show(root: THREE.Object3D): void {
    const bounds = modelBounds(root);
    this.clear();
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    // Normalize through a parent, preserving root animation coordinates and skeleton binding.
    const scale = 2.4 / Math.max(size.x, size.y, size.z);
    this.holder.scale.setScalar(scale);
    this.holder.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    this.holder.add(root);
    this.model = root;
    this.skeleton = new THREE.SkeletonHelper(root);
    this.skeleton.visible = false;
    this.scene.add(this.skeleton);
    this.resetCamera();
  }

  createStudioView(rig: StudioRig): StudioView { // Arcball keeps its live pan/zoom center in the gizmo group (Three.js 0.186.1).
    const controls=this.controls;
    return new StudioView(rig,this.camera,this.renderer.domElement,{get enabled(){return controls.enabled;},set enabled(value:boolean){controls.enabled=value;},get target(){return controls._gizmos.position;}},this.scene); }

  showSkeleton(visible: boolean): void { if (this.skeleton) this.skeleton.visible = visible; }
  resetCamera(): void {
    this.camera.up.set(0,1,0);
    this.camera.position.set(3.2, 2.1, 5.5);
    this.controls.target.copy(modelCenter(this.model));
    this.controls.setCamera(this.camera);
    this.controls.setGizmosVisible(false);
    this.controls.update();
  }
  setStudio(active:boolean):void {this.floor.visible=!active;if(active)this.controls.unsetMouseAction(0);else this.controls.setMouseAction('ROTATE',0);}
  rollView(degrees:number):void {
    const pivot=modelCenter(this.model),rotation=rotateCamera(this.camera,pivot,this.camera.getWorldDirection(new THREE.Vector3()),THREE.MathUtils.degToRad(degrees));
    this.controls.target.copy(this.controls._gizmos.position).sub(pivot).applyQuaternion(rotation).add(pivot);
    this.controls.setCamera(this.camera);this.controls.setGizmosVisible(false);
  }
  setView(side:string):void {
    const directions:Record<string,number[]>={front:[0,0,1],back:[0,0,-1],left:[-1,0,0],right:[1,0,0],top:[0,1,0],bottom:[0,-1,0]};
    const vector=directions[side];if(!vector)return;
    this.controls.target.copy(modelCenter(this.model));
    const distance=this.camera.position.distanceTo(this.controls.target);
    this.camera.up.set(0,1,0);if(side==='top')this.camera.up.set(0,0,-1);if(side==='bottom')this.camera.up.set(0,0,1);
    this.camera.position.copy(this.controls.target).add(new THREE.Vector3().fromArray(vector).multiplyScalar(distance));
    this.controls.setCamera(this.camera);this.controls.setGizmosVisible(false);
  }
  clear(): void {
    if (this.skeleton) { this.scene.remove(this.skeleton); this.skeleton.dispose(); this.skeleton = null; }
    if (this.model) { this.holder.remove(this.model); disposeModel(this.model); this.model = null; }
  }
  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.mouse.dispose();
    this.controls.dispose();
    this.clear();
    disposeModel(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
