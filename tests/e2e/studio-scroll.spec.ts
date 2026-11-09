import {test,expect} from '@playwright/test';
import {glb} from '../generation-fixture.mjs';
test('studio scrolling keeps the desktop canvas reachable and mobile controls unobstructed',async({page})=>{
 test.setTimeout(90_000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const size of [{width:1440,height:1000},{width:1280,height:600}]){
  await page.setViewportSize(size);await page.goto('/');await page.locator('#file-input').setInputFiles({name:'scroll.glb',mimeType:'model/gltf-binary',buffer:glb()});await expect(page.locator('#message')).toContainText('bereit');await page.locator('#studio-tab').click();
  const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);
  const before=await info();await page.locator('#pose-name').scrollIntoViewIfNeeded();
  const stage=page.locator('.stage-panel');await expect.poll(()=>stage.evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBe(12);
  const box=(await stage.boundingBox())!;expect(box.y+box.height).toBeLessThanOrEqual(size.height);
  // A real wheel event must reach the renderer while the page is scrolled.
  const canvas=page.locator('#viewport canvas');const area=(await canvas.boundingBox())!;const x=area.x+area.width*.5,y=area.y+area.height*.5;
  expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x,y})).toBe('CANVAS');
  await page.mouse.move(x,y);await page.mouse.wheel(0,-120);await expect.poll(async()=>JSON.stringify((await info()).view.eye)).not.toBe(JSON.stringify(before.view.eye));
  const after=await info(),{view:oldView,...oldState}=before,{view:newView,...newState}=after;expect(newState).toEqual(oldState);
  await page.screenshot({path:`test-results/studio-scrolled-${size.height}.png`});
 }
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#file-input').setInputFiles({name:'mobile-scroll.glb',mimeType:'model/gltf-binary',buffer:glb()});await expect(page.locator('#message')).toContainText('bereit');await page.locator('#studio-tab').click();
 const stage=page.locator('.stage-panel');await expect(stage).toHaveCSS('position','relative');
 const name=page.locator('#pose-name');await name.scrollIntoViewIfNeeded();expect((await stage.boundingBox())!.y+(await stage.boundingBox())!.height).toBeLessThan(0);
 const box=(await name.boundingBox())!;expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box.x+box.width/2,y:box.y+box.height/2})).toBe('pose-name');
 await name.fill('Scroll test');await expect(name).toHaveValue('Scroll test');await page.screenshot({path:'test-results/studio-mobile-controls.png'});
 expect(errors).toEqual([]);
});
