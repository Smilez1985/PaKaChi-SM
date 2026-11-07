import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
for(const [id,label] of [['pakachi-work','PaKaChi · Arbeitsform · Rig'],['pakachi-normal','PaKaChi · Normalform · Rig']]){
 test(`${id}: actual rig bends with skin, undoes and reloads the saved pose`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#avatar-select').selectOption(id);await expect(page.locator('#message')).toContainText(`${label} bereit`);
  const canvas=page.locator('#viewport canvas');await expect(canvas).toBeVisible();
  await canvas.screenshot({path:`test-results/${id}-character.png`});
  await page.locator('#studio-tab').click();await page.locator('#skeleton').check();
  const points=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'points'}) as any);
  const initial=await points();expect(initial.counts.points).toBe(31);expect(initial.counts.moves).toBe(0);
  const wrist=initial.items.find((p:any)=>p.name==='LeftWrist'),elbow=initial.items.find((p:any)=>p.name==='LeftElbow'),shoulder=initial.items.find((p:any)=>p.name==='LeftShoulder');
  expect(wrist.ikChain).toEqual([elbow.id,shoulder.id]);
  await page.locator('#studio-points').selectOption(wrist.id);
  const original=await canvas.screenshot();await page.locator('#point-y').fill(String(wrist.position[1]+.2));await page.locator('#point-y').press('Tab');
  const posed=await points(),moved=posed.items.find((p:any)=>p.id===wrist.id);expect(Math.abs(moved.position[1]-wrist.position[1])).toBeGreaterThan(.02);
  const posedImage=await canvas.screenshot({path:`test-results/${id}-posed.png`});expect(posedImage.equals(original)).toBe(false);
  await page.locator('#studio-undo').click();const reset=(await points()).items.find((p:any)=>p.id===wrist.id);reset.position.forEach((n:number,i:number)=>expect(n).toBeCloseTo(wrist.position[i],6));
  await page.locator('#studio-redo').click();
  const pending=page.waitForEvent('download');await page.locator('#studio-save').click();const file=(await(await pending).path())!;
  const saved=JSON.parse(await readFile(file,'utf8'));expect(saved.studio.boneRest).toHaveLength(31);expect(saved.studio.draft).toBeTruthy();
  page.once('dialog',d=>d.accept());await page.locator('#project-file').setInputFiles(file);await expect(page.locator('#message')).toContainText(`${label} bereit`);
  await page.locator('#studio-tab').click();const reloaded=(await points()).items.find((p:any)=>p.name==='LeftWrist');reloaded.position.forEach((n:number,i:number)=>expect(n).toBeCloseTo(moved.position[i],6));
  await page.locator('#skeleton').uncheck();
  for(const side of ['front','back','left']){await page.locator('#view-side').selectOption(side);await canvas.screenshot({path:`test-results/${id}-${side}.png`});}
  expect(errors).toEqual([]);
 });
}
