import {test,expect} from '@playwright/test';
import {glb} from '../generation-fixture.mjs';
test('middle mouse orbits the figure center after zoom and pan, with reversible direction and unchanged project',async({page})=>{
 test.setTimeout(90_000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const results:{before:number[];delta:number[]}[]=[];
 for(const inverted of [false,true]){
  await page.goto('/');await page.locator('#options-open').click();await page.locator('#option-invert').setChecked(inverted);await page.locator('#options-close').click();await page.locator('#file-input').setInputFiles({name:'orbit.glb',mimeType:'model/gltf-binary',buffer:glb()});
  await expect(page.locator('#message')).toContainText('bereit');await page.locator('#studio-tab').click();
  const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);
  const canvas=page.locator('canvas').first();await canvas.scrollIntoViewIfNeeded();
  const initial=await info();const box=(await canvas.boundingBox())!,viewport=page.viewportSize()!;
  // The Studio canvas can be taller than the browser window. Target its visible intersection.
  const left=Math.max(0,box.x),top=Math.max(0,box.y),right=Math.min(viewport.width,box.x+box.width),bottom=Math.min(viewport.height,box.y+box.height);
  expect(right-left).toBeGreaterThan(100);expect(bottom-top).toBeGreaterThan(100);
  const x=left+(right-left)*.58,y=top+(bottom-top)*.44;
  expect(await canvas.evaluate((element,p)=>document.elementFromPoint(p.x,p.y)===element,{x,y})).toBe(true);
  await page.mouse.move(x,y);await page.mouse.wheel(0,-180);
  await expect.poll(async()=>JSON.stringify((await info()).view.eye)).not.toBe(JSON.stringify(initial.view.eye));
  const zoomed=await info();await page.mouse.down({button:'right'});await page.mouse.move(x+45,y+25,{steps:5});await page.mouse.up({button:'right'});
  await expect.poll(async()=>JSON.stringify((await info()).view.eye)).not.toBe(JSON.stringify(zoomed.view.eye));
  const before=await info();
  // The known fixture is normalized to bounds [-1.2,0,0] .. [1.2,2.4,0].
  const center=[0,1.2,0];
  const project=(m:number[])=>{const w=m[3]*center[0]+m[7]*center[1]+m[11]*center[2]+m[15];return [(m[0]*center[0]+m[4]*center[1]+m[8]*center[2]+m[12])/w,(m[1]*center[0]+m[5]*center[1]+m[9]*center[2]+m[13])/w];};
  const radius=(eye:number[])=>Math.hypot(...eye.map((v,i)=>v-center[i]));
  await page.mouse.move(x,y);await page.mouse.down({button:'middle'});await page.mouse.move(x+24,y+12,{steps:1});await page.mouse.up({button:'middle'});
  const after=await info();expect(after.view.eye).not.toEqual(before.view.eye);
  expect(radius(after.view.eye)).toBeCloseTo(radius(before.view.eye),6);
  const p=project(before.view.projection),q=project(after.view.projection);expect(q[0]).toBeCloseTo(p[0],6);expect(q[1]).toBeCloseTo(p[1],6);
  const {view:initialView,...initialState}=initial,{view:afterView,...afterState}=after;expect(afterState).toEqual(initialState);
  results.push({before:before.view.eye,delta:after.view.eye.map((v:number,i:number)=>v-before.view.eye[i])});
  // Releasing the middle button must return wheel navigation to Arcball.
  await page.mouse.wheel(0,100);await expect.poll(async()=>JSON.stringify((await info()).view.eye)).not.toBe(JSON.stringify(after.view.eye));
  await page.screenshot({path:`test-results/orbit-${inverted?'inverted':'normal'}.png`});
 }
 for(let i=0;i<3;i++)expect(results[0].before[i]).toBeCloseTo(results[1].before[i],5);
 expect(results[0].delta.reduce((sum:number,v:number,i:number)=>sum+v*results[1].delta[i],0)).toBeLessThan(0);
 expect(errors).toEqual([]);
});
