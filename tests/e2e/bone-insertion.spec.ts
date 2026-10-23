import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('intermediate bone can be inserted, undone, redone and reloaded through Studio UI',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#avatar-select').selectOption('mika');await expect(page.locator('#message')).toContainText('Mika bereit');await page.locator('#studio-tab').click();
 const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);const before=await info();
 const points=await page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'points'}) as any);const foot=points.items.find((p:any)=>p.name==='LeftFoot');expect(foot).toBeTruthy();
 await page.locator('#pose-name').fill('Before insertion');await page.locator('#pose-add').click();await page.locator('#mode-rig').click();await page.locator('#studio-points').selectOption(foot.id);await page.locator('#bone-insert').click();
 await expect(page.locator('#message')).toContainText('Zwischengelenk eingefügt');expect((await info()).counts.points).toBe(before.counts.points+1);
 await page.locator('#studio-undo').click();expect((await info()).counts.points).toBe(before.counts.points);await page.locator('#studio-redo').click();expect((await info()).counts.points).toBe(before.counts.points+1);
 const downloading=page.waitForEvent('download');await page.locator('#studio-save').click();const path=await (await downloading).path();const saved=JSON.parse(await readFile(path!,'utf8'));expect(saved.studio.boneInsertions).toHaveLength(1);expect(saved.studio.poses[0].review).toContain('bone-rest');
 await page.locator('#project-file').setInputFiles(path!);await expect(page.locator('#message')).toContainText('Mika bereit');await page.locator('#studio-tab').click();expect((await info()).counts.points).toBe(before.counts.points+1);
 const after=await page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'points'}) as any);const added=after.items.find((p:any)=>p.name==='Zwischengelenk');expect(added.kind).toBe('bone');expect(added.connections).toContain(foot.id);
 await page.screenshot({path:'test-results/inserted-bone.png',fullPage:true});expect(errors).toEqual([]);
});
