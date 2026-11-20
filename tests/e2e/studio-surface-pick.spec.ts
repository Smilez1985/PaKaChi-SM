import {test,expect,type Page} from '@playwright/test';

test('StudioView raycasts a real canvas click to the source mesh triangle',async({page})=>{
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><canvas id="studio" style="display:block;width:400px;height:300px"></canvas></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const THREE=await import('three');
  const {StudioRig}=await import('../../src/studio-rig.ts');
  const {StudioView}=await import('../../src/studio-view.ts');
  const canvas=document.querySelector<HTMLCanvasElement>('#studio')!;
  canvas.width=400;canvas.height=300;
  const scene=new THREE.Scene();
  const root=new THREE.Group();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0, 1,-1,0, 0,1,0],3));
  geometry.setIndex([0,1,2]);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  mesh.name='pick-target';root.add(mesh);scene.add(root);
  const rig=new StudioRig(root);
  const camera=new THREE.PerspectiveCamera(45,400/300,.1,100);
  camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const orbit={enabled:true,target:new THREE.Vector3()};
  const view=new StudioView(rig,camera,canvas,orbit,scene);
  let selected:any=null;
  view.onSurfacePick=hit=>{selected=hit;};
  view.setEnabled(true);view.setAction('surface-pick');
  (window as any).__surfacePick={view,rig,scene,selected:()=>selected};
 });
 const bounds=await page.locator('#studio').boundingBox();
 expect(bounds).not.toBeNull();
 const box=bounds!;
 await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 const hit=await page.evaluate(()=> (window as any).__surfacePick.selected());
 expect(hit).not.toBeNull();
 expect(hit.meshIndex).toBe(0);
 expect(hit.triangleIndex).toBe(0);
 expect(hit.barycentric[0]).toBeCloseTo(.25,4);
 expect(hit.barycentric[1]).toBeCloseTo(.25,4);
 expect(hit.barycentric[2]).toBeCloseTo(.5,4);
 await page.evaluate(()=>{
  const state=(window as any).__surfacePick;
  state.view.dispose();
  state.rig.dispose?.();
 });
});
