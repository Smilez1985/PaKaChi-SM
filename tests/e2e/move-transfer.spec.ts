import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {glb} from '../generation-fixture.mjs';

test('move download and file chooser preserve repeated poses, resolve conflicts, play and undo',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#file-input').setInputFiles({name:'triangle.glb',mimeType:'model/gltf-binary',buffer:glb()});
 await expect(page.locator('#message')).toContainText('bereit');
 await page.locator('#studio-tab').click();await page.locator('#studio-agent-edit').check();
 const source=await page.evaluate(()=>{
  const call=window.PaKaChiSM.call;
  const edit=(extra:Record<string,unknown>)=>{const s=call('get_studio') as any;return call('edit_studio',{command:{session:s.session,expectedRevision:s.revision,...extra}}) as any;};
  const a=edit({action:'save_pose',name:'Start',seconds:1}).id;
  edit({action:'update_point',id:'$figure',position:[.6,0,0]});
  const b=edit({action:'save_pose',name:'Right',seconds:1}).id;
  edit({action:'create_move',id:'transfer',name:'Transfer',poses:[a,b,a],loop:true});
  return {a,b,info:call('get_studio') as any,moves:call('get_studio',{section:'moves'}) as any};
 });
 await page.locator('#studio-moves').selectOption('transfer');
 const downloading=page.waitForEvent('download');await page.locator('#move-export').click();const download=await downloading;
 expect(download.suggestedFilename()).toBe('transfer.pakachi-move.json');
 const path=await download.path();expect(path).toBeTruthy();
 const file=JSON.parse(await readFile(path!,'utf8'));
 expect(file.format).toBe('pakachi-move');expect(file.poses).toHaveLength(2);expect(file.move.poses).toEqual([source.a,source.b,source.a]);
 const choosing=page.waitForEvent('filechooser');await page.locator('#move-import').click();await (await choosing).setFiles(path!);
 await expect(page.locator('#studio-moves option')).toHaveCount(2);
 const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);
 const moves=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'moves'}) as any);
 const imported=(await moves()).items.find((m:any)=>m.id==='transfer-2');
 expect(imported.poses).toHaveLength(3);expect(imported.poses[0]).toBe(imported.poses[2]);expect(imported.poses[0]).not.toBe(source.a);expect(imported.poses[1]).not.toBe(source.b);
 expect((await moves()).items.find((m:any)=>m.id==='transfer')).toEqual(source.moves.items[0]);
 expect((await info()).counts.poses).toBe(4);expect((await info()).revision).toBe(source.info.revision+1);
 await page.locator('#studio-moves').selectOption('transfer-2');await page.locator('#move-preview').click();
 await expect.poll(async()=> (await info()).figure.position[0]).toBeGreaterThan(.05);
 await page.locator('#pause').click();await page.locator('#timeline').fill('500');
 expect((await info()).figure.position[0]).toBeGreaterThan(.05);
 await page.screenshot({path:'test-results/imported-move.png',fullPage:true});
 await page.locator('#move-stop').click();await page.locator('#studio-undo').click();
 expect((await moves()).items).toEqual(source.moves.items);expect((await info()).counts.poses).toBe(2);expect((await info()).figure).toEqual(source.info.figure);
 // A rejected file must leave both the project and undo history untouched.
 const before=await info();file.binding.model='0'.repeat(64);
 await page.locator('#move-file').setInputFiles({name:'wrong-model.pakachi-move.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});
 await expect(page.locator('#message')).toContainText('passt nicht zu Modell');
 expect(await info()).toEqual(before);expect((await moves()).items).toEqual(source.moves.items);
 await page.locator('#studio-redo').click();await expect(page.locator('#studio-moves option')).toHaveCount(2);expect((await info()).counts.poses).toBe(4);
 expect(errors).toEqual([]);
});
