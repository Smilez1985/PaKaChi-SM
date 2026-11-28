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
  (window as any).__editorCorrectionEvents=[];
  for(const name of ['pointerdown','pointerup','click'])window.addEventListener(name,event=>(window as any).__editorCorrectionEvents.push(name+':'+(event.target as Element).tagName),true);
  const fixtureUrl='/tests/e2e/fixtures/studio-surface-pick.ts';
  const {mountClusterEditorCorrectionFixture}=await import(/* @vite-ignore */ fixtureUrl);
  (window as any).__editorCorrection=mountClusterEditorCorrectionFixture(canvas,host);
 });
 const bounds=await page.locator('#studio').boundingBox();expect(bounds).not.toBeNull();
 const clickX=bounds!.x+bounds!.width/2,clickY=bounds!.y+bounds!.height/2;
 const animal=page.locator('[data-cluster-form="animal"]');
 await expect(animal.locator('select[data-cluster-mesh]')).toHaveValue('animal-body');
 await expect(animal.locator('input[data-cluster-triangle]')).toHaveValue('0');
 await page.mouse.click(clickX,clickY);
 const pickDiagnostics=await page.evaluate(({x,y})=>{const state=(window as any).__editorCorrection,element=document.elementFromPoint(x,y) as HTMLElement|null,canvas=document.querySelector<HTMLCanvasElement>('#studio')!,rect=canvas.getBoundingClientRect();return {picked:state.pickedHit(),raycast:state.raycast(),events:(window as any).__editorCorrectionEvents,hitTest:{tag:element?.tagName,id:element?.id,canvasContains:!!element&&canvas.contains(element),rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}},options:[...document.querySelector('[data-cluster-form="animal"] select[data-cluster-part]')!.querySelectorAll('option')].map((option:HTMLOptionElement)=>option.value)};},{x:clickX,y:clickY});
 expect(pickDiagnostics.picked,JSON.stringify(pickDiagnostics)).toEqual({meshId:'animal-body',triangleIndex:0,sourceAssetSha256:'a'.repeat(64),state:'automatic',partId:'paws'});
 expect(pickDiagnostics.options).toContain('paws');
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


test('triangulated 3D overlay click selects the matching review row without accepting it',async({page})=>{
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><canvas id="studio" style="display:block;width:400px;height:300px"></canvas><div id="editor"></div></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const canvas=document.querySelector<HTMLCanvasElement>('#studio')!,host=document.querySelector<HTMLElement>('#editor')!;
  const fixtureUrl='/tests/e2e/fixtures/studio-surface-pick.ts';
  const {mountTriangulationReviewOverlayFixture}=await import(/* @vite-ignore */ fixtureUrl);
  (window as any).__triangulationReview=mountTriangulationReviewOverlayFixture(canvas,host);
 });
 const bounds=await page.locator('#studio').boundingBox();expect(bounds).not.toBeNull();
 await page.mouse.click(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);
 const row=page.locator('[data-landmark-review-mesh="review-mesh"][data-landmark-review-triangle="0"]');
 await expect(row).toHaveAttribute('data-selected','true');
 await expect(row).toHaveAttribute('aria-current','true');
 await expect(row.getByRole('button',{name:'Diesen Vorschlag übernehmen'})).toBeEnabled();
 const accepted=await page.evaluate(()=> (window as any).__triangulationReview.acceptedCount());
 expect(accepted).toBe(0);
 await page.evaluate(()=>{const state=(window as any).__triangulationReview;state.editor.dispose();state.view.dispose();});
});
