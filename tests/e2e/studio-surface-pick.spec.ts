import {test,expect} from '@playwright/test';

test('StudioView raycasts a real canvas click to the source mesh triangle',async({page})=>{
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><canvas id="studio" style="display:block;width:400px;height:300px"></canvas></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const canvas=document.querySelector<HTMLCanvasElement>('#studio')!;
  const fixtureUrl='/tests/e2e/fixtures/studio-surface-pick.ts';
  const {mountSurfacePickFixture}=await import(/* @vite-ignore */ fixtureUrl);
  const state=mountSurfacePickFixture(canvas);
  (window as any).__surfacePick=state;
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
 });
});

test('StudioView maps an overlay face click to its exact source mesh, triangle and provenance',async({page})=>{
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><canvas id="studio" style="display:block;width:400px;height:300px"></canvas></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const canvas=document.querySelector<HTMLCanvasElement>('#studio')!;
  const {mountClusterOverlayPickFixture}=await import(/* @vite-ignore */ '/tests/e2e/fixtures/studio-surface-pick.ts');
  (window as any).__overlayPick=mountClusterOverlayPickFixture(canvas);
 });
 const bounds=await page.locator('#studio').boundingBox();expect(bounds).not.toBeNull();
 await page.mouse.click(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);
 const hit=await page.evaluate(()=> (window as any).__overlayPick.selected());
 expect(hit).toEqual({meshId:'source-mesh-7',triangleIndex:42,sourceAssetSha256:'a'.repeat(64),state:'locked',partId:'left-paw'});
 await page.evaluate(()=> (window as any).__overlayPick.view.dispose());
});
