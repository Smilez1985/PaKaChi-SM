import {test,expect} from '@playwright/test';
import {glb} from '../generation-fixture.mjs';

test('image generation keeps original until explicit import of the rendered preview',async({page})=>{
 const profile={id:'gen',name:'Local TripoSR',adapter:'custom-generation',endpoint:'http://127.0.0.1:8766',model:'triposr'};
 await page.addInitScript(profile=>localStorage.setItem('pakachi-providers-v1',JSON.stringify({version:1,profiles:[profile],assignments:{assistant:null,generation:'gen',rigging:null}})),profile);
 await page.route('http://127.0.0.1:8766/**',async route=>{
  const headers={'Access-Control-Allow-Origin':'http://127.0.0.1:5173'};
  if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'authorization, content-type'}});return;}
  if(route.request().url().endsWith('/capabilities'))await route.fulfill({headers,contentType:'application/json',body:JSON.stringify({protocol:'pakachi-generation-v1',model:'triposr',capabilities:['image-to-3d'],prompt:false})});
  else await route.fulfill({headers,contentType:'model/gltf-binary',body:glb()});
 });
 await page.goto('/');await expect(page.locator('#avatar-name')).toContainText('PaKaChi');
 await page.evaluate(async profile=>{const path='/src/provider-credentials.ts';const module=await import(path);module.setProviderKey(profile,'a'.repeat(48));},profile);
 await page.locator('#studio-tab').click();
 await page.locator('#generation-image').setInputFiles({name:'panda.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=','base64')});
 await page.locator('#generation-start').click();await expect(page.locator('#generation-apply')).toBeVisible();
 await expect(page.locator('.generation-preview canvas')).toBeVisible();await expect(page.locator('#avatar-name')).toContainText('PaKaChi');
 await page.screenshot({path:'/tmp/pakachi-generation-preview.png',fullPage:true});
 await page.locator('#generation-apply').click();await expect(page.locator('#avatar-name')).toContainText('3D-Entwurf');await expect(page.locator('#generation-apply')).toBeHidden();
 await page.locator('#model-undo').click();await expect(page.locator('#avatar-name')).toContainText('PaKaChi');
 await page.locator('#model-redo').click();await expect(page.locator('#avatar-name')).toContainText('3D-Entwurf');
});

test('failed publication retains the live editor, canvas, dirty project and agent permission',async({page})=>{
 await page.goto('/');await page.locator('#avatar-select').selectOption('mika');await expect(page.locator('#message')).toContainText('Mika bereit');
 await page.locator('#studio-tab').click();await page.locator('#studio-agent-edit').check();
 await page.locator('#studio-points').selectOption('bone-0');await page.locator('#point-name').fill('Unsaved joint');await page.locator('#point-name').press('Tab');
 page.on('dialog',dialog=>dialog.accept());
 const before=await page.evaluate(()=>{
  const api=(window as any).PaKaChiSM;const info=api.call('get_studio');
  (window as any).__oldCanvas=document.querySelector('#viewport canvas');
  return info;
 });
 await page.evaluate(()=>{
  const element=document.getElementById('avatar-cards')!;const original=element.replaceChildren.bind(element);
  element.replaceChildren=(..._nodes)=>{element.replaceChildren=original;throw new Error('injected publication failure');};
 });
 await page.locator('#file-input').setInputFiles({name:'candidate.glb',mimeType:'model/gltf-binary',buffer:glb()});
 await expect(page.locator('#message')).toContainText('injected publication failure');
 await expect(page.locator('#avatar-name')).toContainText('Mika');await expect(page.locator('#studio-agent-edit')).toBeChecked();
 const after=await page.evaluate(()=>({info:(window as any).PaKaChiSM.call('get_studio'),sameCanvas:(window as any).__oldCanvas===document.querySelector('#viewport canvas')}));
 expect(after.sameCanvas).toBe(true);expect(after.info.session).toBe(before.session);expect(after.info.revision).toBe(before.revision);expect(after.info.counts).toEqual(before.counts);expect(after.info.dirty).toBe(true);
 await expect(page.locator('#point-name')).toHaveValue('Unsaved joint');
 await expect(page.locator('#model-undo')).toBeEnabled();await page.locator('#model-undo').click();await expect(page.locator('#avatar-name')).toContainText('PaKaChi');
});
