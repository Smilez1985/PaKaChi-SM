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
  const fixtureUrl='/tests/e2e/fixtures/studio-surface-pick.ts';
  const {mountClusterOverlayPickFixture}=await import(/* @vite-ignore */ fixtureUrl);
  (window as any).__overlayPick=mountClusterOverlayPickFixture(canvas);
 });
 const bounds=await page.locator('#studio').boundingBox();expect(bounds).not.toBeNull();
 await page.mouse.click(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);
 const hit=await page.evaluate(()=> (window as any).__overlayPick.selected());
 expect(hit).toEqual({meshId:'source-mesh-7',triangleIndex:42,sourceAssetSha256:'a'.repeat(64),state:'locked',partId:'left-paw'});
 await page.evaluate(()=> (window as any).__overlayPick.view.dispose());
});


test('real overlay click fills the Studio correction form, locks the correction and restores it after project reload',async({page})=>{
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><canvas id="studio" style="display:block;width:400px;height:300px"></canvas><div id="editor"></div></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const canvas=document.querySelector<HTMLCanvasElement>('#studio')!,host=document.querySelector<HTMLElement>('#editor')!;
  const fixtureUrl='/tests/e2e/fixtures/studio-surface-pick.ts';
  const {mountClusterEditorCorrectionFixture}=await import(/* @vite-ignore */ fixtureUrl);
  (window as any).__editorCorrection=mountClusterEditorCorrectionFixture(canvas,host);
  (window as any).__editorCorrectionEvents=[];
  for(const name of ['pointerdown','pointerup','click'])canvas.addEventListener(name,event=>(window as any).__editorCorrectionEvents.push(name+':'+(event.target as Element).tagName),true);
 });
 const bounds=await page.locator('#studio').boundingBox();expect(bounds).not.toBeNull();
 const clickX=bounds!.x+bounds!.width/2,clickY=bounds!.y+bounds!.height/2;
 const eventLog=await page.evaluate(({x,y})=>{
  const canvas=document.querySelector<HTMLCanvasElement>('#studio')!;
  const target=document.elementFromPoint(x,y);
  const events:string[]=[];
  for(const name of ['pointerdown','pointerup','click'])canvas.addEventListener(name,event=>events.push(name+':'+(event.target as Element).tagName),true);
  return {target:target?.tagName??null,targetId:(target as HTMLElement|null)?.id??null,canvasRect:(()=>{const r=canvas.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})(),events};
 },{x:clickX,y:clickY});
 await page.mouse.click(clickX,clickY);
 const observed=await page.evaluate(()=>({target:document.elementFromPoint(window.__lastClickX??0,window.__lastClickY??0)?.tagName,events:(window as any).__editorCorrectionEvents??[]}));
 const animal=page.locator('[data-cluster-form="animal"]');
 await expect(animal.locator('select[data-cluster-mesh]')).toHaveValue('animal-body');
 await expect(animal.locator('input[data-cluster-triangle]')).toHaveValue('0');
 const pickDiagnostics=await page.evaluate(()=>{const state=(window as any).__editorCorrection;return {picked:state.pickedHit(),raycast:state.raycast(),events:(window as any).__editorCorrectionEvents,options:[...document.querySelector('[data-cluster-form="animal"] select[data-cluster-part]')!.querySelectorAll('option')].map((option:HTMLOptionElement)=>option.value)};});
 expect(pickDiagnostics).toEqual({picked:{meshId:'animal-body',triangleIndex:0,sourceAssetSha256:'a'.repeat(64),state:'automatic',partId:'paws'},options:expect.arrayContaining(['paws'])});
 await expect(animal.locator('select[data-cluster-part]')).toHaveValue('paws');
 await expect(animal.locator('[data-cluster-pick-status]')).toContainText('animal-body · Dreieck 0');
 await animal.locator('textarea').fill('Gegen die freigegebene Referenz geprüft.');
 await animal.getByRole('button',{name:'Dreieck-Zuordnung manuell korrigieren'}).click();
 const restored=await page.evaluate(()=>{
  const state=(window as any).__editorCorrection,roundTrip=state.restore();
  return {saved:roundTrip.saved,animal:roundTrip.editor.exportProject().clusterSkinAnatomyProposals.animal.manifest.assignments[0],humanoid:roundTrip.editor.exportProject().clusterSkinAnatomyProposals.humanoid.manifest.assignments[0]};
 });
 expect(restored.animal.origin).toBe('user');
 expect(restored.animal.policy).toBe('locked');
 expect(restored.humanoid.origin).toBe('automatic');
 expect(restored.saved.clusterSkinAnatomyProposals.animal.manifest.assignments[0].policy).toBe('locked');
 await page.evaluate(()=>{
  const state=(window as any).__editorCorrection;state.editor.dispose();state.view.dispose();
 });
});
