import {test,expect} from '@playwright/test';

test('assistant previews before/after without mutation, restores pose, applies once and undoes',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const profile={id:'test-assistant',name:'Test assistant',adapter:'ollama',endpoint:'http://127.0.0.1:11434',model:'test-model'};
 await page.addInitScript(profile=>localStorage.setItem('pakachi-providers-v1',JSON.stringify({version:1,profiles:[profile],assignments:{assistant:profile.id,generation:null,rigging:null}})),profile);
 await page.goto('/');await page.locator('#avatar-select').selectOption('mika');await expect(page.locator('#message')).toContainText('Mika bereit');await page.locator('#studio-tab').click();await page.locator('#studio-agent-edit').check();
 const fixture=await page.evaluate(()=>{
  const call=window.PaKaChiSM.call;
  const edit=(extra:Record<string,unknown>)=>{const info=call('get_studio') as any;return call('edit_studio',{command:{session:info.session,expectedRevision:info.revision,...extra}}) as any;};
  edit({action:'update_point',id:'$figure',position:[0,0,0]});const a=edit({action:'save_pose',name:'Neutral',seconds:1}).id;
  edit({action:'update_point',id:'$figure',position:[.6,0,0]});const b=edit({action:'save_pose',name:'Right',seconds:1}).id;
  edit({action:'create_move',id:'preview-test',name:'Preview test',poses:[a,b],loop:true});edit({action:'update_point',id:'$figure',position:[.2,0,0]});
  return {a,b,info:call('get_studio') as any,moves:call('get_studio',{section:'moves'}) as any};
 });
 let requests=0;
 await page.route('http://127.0.0.1:11434/**',async route=>{
  const headers={'Access-Control-Allow-Origin':'http://127.0.0.1:5173'};
  if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'content-type'}});return;}
  const reading=requests++%2===0;
  const args=reading?{section:'moves'}:{command:{session:fixture.info.session,expectedRevision:fixture.info.revision,action:'update_move',id:'preview-test',poses:[fixture.b,fixture.a,fixture.b]}};
  await route.fulfill({headers,contentType:'application/json',body:JSON.stringify({done:true,message:{role:'assistant',content:'',tool_calls:[{function:{name:reading?'get_studio':'edit_studio',arguments:args}}]}})});
 });
 await page.locator('.assistant-panel > summary').click();await page.locator('#assistant-prompt').fill('Reverse the motion and repeat the final pose.');await page.locator('#assistant-send').click();
 await expect(page.locator('#assistant-apply')).toBeVisible();await expect(page.locator('#assistant-sequence-comparison tbody tr')).toHaveCount(3);
 const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any);
 await page.locator('[data-sequence-preview="before"]').click();await expect.poll(async()=> (await info()).figure.position[0]).not.toBe(fixture.info.figure.position[0]);
 expect((await info()).revision).toBe(fixture.info.revision);
 await page.locator('[data-sequence-preview="after"]').click();await expect(page.locator('#time')).toContainText('3,0');
 await page.locator('#assistant-preview-stop').click();expect((await info()).figure).toEqual(fixture.info.figure);
 expect(await page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'moves'}))).toEqual(fixture.moves);expect(requests).toBe(2);
 await page.locator('[data-sequence-preview="after"]').click();await page.screenshot({path:'test-results/sequence-preview.png',fullPage:true});await page.locator('#assistant-apply').click();
 expect((await info()).revision).toBe(fixture.info.revision+1);expect((await info()).figure).toEqual(fixture.info.figure);
 const changed=await page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'moves'}) as any);expect(changed.items[0].poses).toEqual([fixture.b,fixture.a,fixture.b]);
 await page.locator('#studio-undo').click();const undone=await page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'moves'}) as any);expect(undone.items[0].poses).toEqual([fixture.a,fixture.b]);
 expect(errors).toEqual([]);
});
