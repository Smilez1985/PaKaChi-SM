import {test,expect} from '@playwright/test';
test('decoded PNG alpha is captured once and opens only the cutout ray',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const threePath='/node_modules/three/build/three.module.js',visibilityPath='/src/studio-weight-visibility.ts';
  const T=await import(threePath),{StudioWeightVisibility}=await import(visibilityPath);
  const canvas=document.createElement('canvas');canvas.width=2;canvas.height=1;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='white';ctx.fillRect(1,0,1,1);const image=new Image();image.src=canvas.toDataURL('image/png');await image.decode();
  const map=new T.Texture(image);map.magFilter=T.NearestFilter;map.flipY=false;
  const mesh=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map,alphaTest:.5}));mesh.position.z=.5;mesh.updateMatrixWorld(true);
  const tree=new StudioWeightVisibility([mesh]);
  const camera=new T.PerspectiveCamera(60,1,.1,10);camera.position.z=3;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const matrix=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),view={eye:camera.position.toArray(),projection:matrix.toArray(),materials:true,alpha:true};
  const left=new T.Vector3(-.5,0,0),right=new T.Vector3(.5,0,0);
  const hole=tree.visible(left,view,matrix),solid=tree.visible(right,view,matrix),legacy=tree.visible(left,{...view,alpha:undefined},matrix);
  ctx.fillRect(0,0,2,1);image.src=canvas.toDataURL('image/png');await image.decode();
  return {hole,solid,legacy,frozen:tree.visible(left,view,matrix)};
 });
 expect(result).toEqual({hole:true,solid:false,legacy:false,frozen:true});
});
