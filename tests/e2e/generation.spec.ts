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
});
