import {test,expect} from '@playwright/test';
import {glb} from '../generation-fixture.mjs';

test('local zoo survives reload with poses, moves and stable shared identity',async({page})=>{
 await page.goto('/');await page.locator('#file-input').setInputFiles({name:'triangle.glb',mimeType:'model/gltf-binary',buffer:glb()});await expect(page.locator('#message')).toContainText('bereit');await page.locator('#studio-tab').click();await page.locator('#studio-agent-edit').check();
 const saved=await page.evaluate(()=>{const call=window.PaKaChiSM.call;const edit=(extra:Record<string,unknown>)=>{const s=call('get_studio') as any;return call('edit_studio',{command:{session:s.session,expectedRevision:s.revision,...extra}}) as any;};const a=edit({action:'save_pose',name:'Start'}).id;edit({action:'update_point',id:'$figure',position:[.3,0,0]});const b=edit({action:'save_pose',name:'End'}).id;edit({action:'create_move',id:'slide',name:'Slide',poses:[a,b]});return {a,b};});
 await page.locator('#zoo-name').fill('Persistent triangle');await page.locator('#zoo-save').click();await expect(page.locator('.local-zoo [role=status]')).toContainText('Neue Kopie gespeichert');const id=await page.locator('#zoo-list').inputValue();expect(id).toMatch(/^saved-/);
 await page.reload();await expect(page.locator('#zoo-list option')).toHaveCount(1);await page.locator('#avatar-select').selectOption(id);await expect(page.locator('#message')).toContainText('Persistent triangle bereit');await page.locator('#studio-tab').click();
 const snapshot=await page.evaluate(()=>({info:window.PaKaChiSM.call('get_studio') as any,moves:window.PaKaChiSM.call('get_studio',{section:'moves'}) as any,avatars:window.PaKaChiSM.call('list_avatars') as any[]}));
 expect(snapshot.info.counts.poses).toBe(2);expect(snapshot.moves.items[0].poses).toEqual([saved.a,saved.b]);expect(snapshot.info.figure.position).toEqual([.3,0,0]);expect(snapshot.avatars.find(a=>a.id===id)?.selected).toBe(true);await expect(page.locator('#studio-agent-edit')).not.toBeChecked();
 await page.screenshot({path:'test-results/zoo-reloaded.png',fullPage:true});
});

test('two tabs share committed list changes without replacing a loaded avatar',async({page,context})=>{
 await page.goto('/');const second=await context.newPage();await second.goto('/');await expect(second.locator('#zoo-refresh')).toBeEnabled();
 await page.locator('#file-input').setInputFiles({name:'shared.glb',mimeType:'model/gltf-binary',buffer:glb()});await expect(page.locator('#message')).toContainText('bereit');await page.locator('#zoo-name').fill('Shared triangle');await page.locator('#zoo-save').click();await expect(page.locator('.local-zoo [role=status]')).toContainText('Neue Kopie gespeichert');const id=await page.locator('#zoo-list').inputValue();
 await expect(second.locator('#zoo-list option')).toHaveCount(1);await second.locator('#avatar-select').selectOption(id);await expect(second.locator('#message')).toContainText('Shared triangle bereit');const before=await second.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);
 page.once('dialog',d=>d.dismiss());await page.locator('#zoo-remove').click();await expect(second.locator('#zoo-list option')).toHaveCount(1);
 page.once('dialog',d=>d.accept());await page.locator('#zoo-remove').click();await expect(second.locator('#zoo-list option')).toHaveCount(0);await expect(second.locator('#avatar-name')).toHaveText('Shared triangle');expect(await second.evaluate(()=>window.PaKaChiSM.call('get_studio'))).toEqual(before);
 await second.close();
});
