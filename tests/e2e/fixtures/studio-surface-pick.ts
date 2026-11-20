import * as THREE from 'three';
import {StudioRig} from '../../../src/studio-rig.ts';
import {StudioView} from '../../../src/studio-view.ts';

export function mountSurfacePickFixture(canvas:HTMLCanvasElement){
 canvas.width=400;canvas.height=300;
 const scene=new THREE.Scene(),root=new THREE.Group();
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,0,1,0],3));
 geometry.setIndex([0,1,2]);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 mesh.name='pick-target';root.add(mesh);scene.add(root);
 const rig=new StudioRig(root);
 const camera=new THREE.PerspectiveCamera(45,400/300,.1,100);
 camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const orbit={enabled:true,target:new THREE.Vector3()};
 const view=new StudioView(rig,camera,canvas,orbit,scene);
 let selected:{meshIndex:number;triangleIndex:number;barycentric:readonly [number,number,number]}|null=null;
 view.onSurfacePick=hit=>{selected=hit;};
 view.setEnabled(true);view.setAction('surface-pick');
 return {view,selected:()=>selected};
}
