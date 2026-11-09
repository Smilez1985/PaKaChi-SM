import {test,expect} from '@playwright/test';

test('real PaKaChi reconstruction drafts load in WebGL without advertising a rig or moves',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 for(const [id,name] of [['pakachi-humanoid-draft','PaKaChi · Humanoid · 3D-Entwurf'],['pakachi-animal-draft','PaKaChi · Tierform · 3D-Entwurf']]){
  await page.locator('#avatar-select').selectOption(id);
  await expect(page.locator('#message')).toContainText(`${name} bereit`);
  await expect(page.locator('#viewport canvas')).toBeVisible();
  const capability=await page.evaluate(()=>((window as any).PaKaChiSM.call('get_avatar_capabilities')));
  expect(capability.moves).toEqual([]);
  // Reload starts the original player; both bundled drafts must remain selectable.
  await page.reload();await expect(page.locator('#message')).toContainText('Originalstand wiederhergestellt');
  await expect(page.locator('#avatar-select')).toHaveValue('pakachi-original');
  await page.locator('#avatar-select').selectOption(id);
  await expect(page.locator('#message')).toContainText(`${name} bereit`);
  await expect(page.locator('#avatar-select')).toHaveValue(id);
  await page.locator('#studio-tab').click();
  const studio=await page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);
  expect(studio.counts.points).toBe(0);expect(studio.counts.surfaces).toBe(1);expect(studio.counts.moves).toBe(0);
  await page.locator('#player-tab').click();
  await page.locator('#viewport').screenshot({path:`test-results/${id}.png`});
 }
 await page.locator('#avatar-select').selectOption('mika');await expect(page.locator('#message')).toContainText('Mika bereit');
 expect(errors).toEqual([]);
});
