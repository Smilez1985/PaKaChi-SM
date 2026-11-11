import {test,expect} from '@playwright/test';

test('studio mesh topology markers are read-only and can be cleared',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.locator('#avatar-select').selectOption('mika');
 await expect(page.locator('#message')).toContainText('Mika bereit');
 await page.locator('#studio-tab').click();
 const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);
 const before=await info();
 await page.locator('#mesh-topology-mark').click();
 await expect(page.locator('#mesh-topology-result')).toContainText('Grundform:');
 await expect(page.locator('#mesh-topology-result')).toContainText('Keine automatische Reparatur.');
 expect((await info()).revision).toBe(before.revision);
 expect((await info()).dirty).toBe(before.dirty);
 await page.locator('#mesh-topology-clear').click();
 await expect(page.locator('#mesh-topology-result')).toContainText('Markierungen ausgeblendet.');
 expect((await info()).revision).toBe(before.revision);
 expect(errors).toEqual([]);
});
