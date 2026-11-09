import {test,expect} from '@playwright/test';
import {glb} from '../generation-fixture.mjs';
import {readFile} from 'node:fs/promises';

test('generated static GLB aligns its skeleton independently of a large tail and preserves original, undo and project replay',async({page})=>{
 test.setTimeout(90_000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const profile={id:'gen',name:'Local TripoSR',adapter:'custom-generation',endpoint:'http://127.0.0.1:8766',model:'triposr'};let body=Buffer.alloc(0),requests=0;
 await page.addInitScript(profile=>localStorage.setItem('pakachi-providers-v1',JSON.stringify({version:1,profiles:[profile],assignments:{assistant:null,generation:'gen',rigging:null}})),profile);
 await page.route('http://127.0.0.1:8766/**',async route=>{
  const headers={'Access-Control-Allow-Origin':'http://127.0.0.1:5173'};
  if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'authorization, content-type'}});return;}
  if(route.request().url().endsWith('/capabilities'))await route.fulfill({headers,contentType:'application/json',body:JSON.stringify({protocol:'pakachi-generation-v1',model:'triposr',capabilities:['image-to-3d'],prompt:false})});
  else{requests++;await route.fulfill({headers,contentType:'model/gltf-binary',body});}
 });
 await page.goto('/');
 body=Buffer.from(await page.evaluate(async()=>{const fixturePath='/tests/helpers/draft-rig-fixture.ts',exportPath='/src/figure-glb.ts',fixture=await import(fixturePath),exporter=await import(exportPath);return Array.from(new Uint8Array(await exporter.writeFigureGLB(fixture.draftFigure(true))));}));
 await page.evaluate(async profile=>{const path='/src/provider-credentials.ts';(await import(path)).setProviderKey(profile,'a'.repeat(48));},profile);
 await page.locator('#studio-tab').click();await page.locator('#generation-image').setInputFiles({name:'panda.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=','base64')});
 await page.locator('#generation-start').click();await expect(page.locator('#generation-apply')).toBeVisible();await page.locator('#generation-rig-template').selectOption('biped-relaxed');await page.locator('#generation-rig-alignment').selectOption('bounds');await page.locator('#generation-rig').click();await expect(page.locator('#generation-host')).toContainText('Vorlage nach Gesamtmaßen gewählt');
 const legacy=await page.locator('.generation-preview canvas').screenshot({path:'test-results/generated-standing-frame-before.png'});await page.locator('#generation-rig-alignment').selectOption('support');await page.locator('#generation-rig').click();await expect(page.locator('#generation-host')).toContainText('2 Standflächen erkannt');const aligned=await page.locator('.generation-preview canvas').screenshot({path:'test-results/generated-standing-frame-after.png'});expect(aligned.equals(legacy)).toBe(false);
 await expect(page.locator('#avatar-name')).toContainText('PaKaChi');await expect(page.locator('.generation-preview canvas')).toBeVisible();await page.locator('#generation-original').click();await expect(page.locator('#generation-host')).toContainText('Unveränderte Generatorausgabe');
 await page.locator('#generation-rig').click();await expect(page.locator('#generation-host')).toContainText('21 Gelenke');await page.locator('.generation-preview canvas').screenshot({path:'test-results/generated-first-skeleton-preview.png'});
 await page.locator('#generation-apply').click();await expect(page.locator('#avatar-name')).toContainText('3D-Entwurf');expect(requests).toBe(1);
 const points=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'points'}) as any),initial=await points();expect(initial.counts.points).toBe(21);const wrist=initial.items.find((p:any)=>p.name==='Draft_LeftWrist'),elbow=initial.items.find((p:any)=>p.name==='Draft_LeftElbow'),shoulder=initial.items.find((p:any)=>p.name==='Draft_LeftShoulder');expect(wrist.ikChain).toEqual([elbow.id,shoulder.id]);
 await page.locator('#studio-points').selectOption(wrist.id);const before=await page.locator('#viewport canvas').screenshot();await page.locator('#point-y').fill(String(wrist.position[1]+.15));await page.locator('#point-y').press('Tab');const moved=(await points()).items.find((p:any)=>p.id===wrist.id);expect(Math.abs(moved.position[1]-wrist.position[1])).toBeGreaterThan(.02);const posed=await page.locator('#viewport canvas').screenshot({path:'test-results/generated-first-skeleton-posed.png'});expect(posed.equals(before)).toBe(false);
 await page.locator('#studio-undo').click();const undone=(await points()).items.find((p:any)=>p.id===wrist.id);undone.position.forEach((n:number,i:number)=>expect(n).toBeCloseTo(wrist.position[i],6));await page.locator('#studio-redo').click();
 await page.locator('#pose-name').fill('First generated bend');await page.locator('#pose-add').click();const download=page.waitForEvent('download');await page.locator('#studio-save').click();const file=(await(await download).path())!,saved=JSON.parse(await readFile(file,'utf8'));expect(saved.studio.boneRest).toHaveLength(21);expect(saved.studio.poses).toHaveLength(1);
 const model=Buffer.from(saved.model,'base64'),json=JSON.parse(model.subarray(20,20+model.readUInt32LE(12)).toString('utf8')),frame=json.nodes.find((n:any)=>n.extras?.pakachiDraftRig)?.extras.pakachiDraftRig.frame;expect(frame.mode).toBe('support');expect(frame.supports).toHaveLength(2);expect(Math.abs(frame.center[0])).toBeLessThan(.03);
 await page.locator('#project-file').setInputFiles(file);await expect(page.locator('#message')).toContainText('3D-Entwurf bereit');await page.locator('#studio-tab').click();const reloaded=(await points()).items.find((p:any)=>p.name==='Draft_LeftWrist');reloaded.position.forEach((n:number,i:number)=>expect(n).toBeCloseTo(moved.position[i],5));expect(errors).toEqual([]);
});

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
