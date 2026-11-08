import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('surface warning and gentler pose preserve the original and support undo and project reload',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.locator('#avatar-select').selectOption('mika');await expect(page.locator('#message')).toContainText('Mika bereit');await page.locator('#studio-tab').click();
  await page.locator('#mode-rig').click();await page.locator('#point-add').click();const area=await page.locator('#viewport').boundingBox();await page.mouse.click(area!.x+area!.width*.52,area!.y+area!.height*.3);
  await page.locator('#point-radius').fill('0.4');await page.locator('#point-radius').dispatchEvent('change');await page.locator('#mode-pose').click();
  await page.locator('#pose-name').fill('Überdehnte Testpose');await page.locator('#pose-add').click();
  const pending=page.waitForEvent('download');await page.locator('#studio-save').click();const saved=JSON.parse(await readFile((await(await pending).path())!,'utf8'));
  // Inject an exaggerated local surface displacement through project import.
  // Moving an entire rigid part alone should never trigger a strain warning.
  const point=saved.studio.points.find((p:any)=>p.kind==='surface');expect(point).toBeTruthy();
  const original=saved.studio.poses[0];original.values[point.id].position[0]+=2;
  await page.locator('#project-file').setInputFiles({name:'surface-check.pakachi.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  await expect(page.locator('#message')).toContainText('Mika bereit');await page.locator('#studio-tab').click();
  const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any),before=await info();
  await page.locator('#pose-check-surface').click();await expect(page.locator('#pose-surface-result')).toContainText('Auffällige Oberflächenverformung');expect((await info()).revision).toBe(before.revision);
  await page.locator('#pose-gentler').click();await expect(page.locator('#message')).toContainText('Prüfkandidat erstellt');expect((await info()).counts.poses).toBe(2);
  await page.locator('#pose-check-surface').click();await expect(page.locator('#pose-surface-result')).toContainText('Keine Überschreitung');
  await page.locator('#pose-surface-result details').evaluate((e:HTMLDetailsElement)=>e.open=true);await page.locator('#pose-surface-result').screenshot({path:'test-results/surface-check-report.png'});
  await page.locator('#studio-undo').click();expect((await info()).counts.poses).toBe(1);await page.locator('#studio-redo').click();expect((await info()).counts.poses).toBe(2);
  const exported=page.waitForEvent('download');await page.locator('#studio-save').click();const file=(await(await exported).path())!,result=JSON.parse(await readFile(file,'utf8'));expect(result.studio.poses[0]).toEqual(original);expect(result.studio.moves).toEqual(saved.studio.moves);
  await page.locator('#project-file').setInputFiles(file);await expect(page.locator('#message')).toContainText('Mika bereit');await page.locator('#studio-tab').click();expect((await info()).counts.poses).toBe(2);expect(errors).toEqual([]);
});
