import {test,expect} from '@playwright/test';
for(const action of ['insert_bone','delete_bone','reparent_bone'] as const){
 test(`assistant ${action} waits for approval and is fully undoable`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const profile={id:'bone-assistant',name:'Bone assistant',adapter:'ollama',endpoint:'http://127.0.0.1:11434',model:'test-model'};
  await page.addInitScript(profile=>localStorage.setItem('pakachi-providers-v1',JSON.stringify({version:1,profiles:[profile],assignments:{assistant:profile.id,generation:null,rigging:null}})),profile);
  await page.goto('/');await page.locator('#avatar-select').selectOption('mika');await expect(page.locator('#message')).toContainText('Mika bereit');await page.locator('#studio-tab').click();await page.locator('#studio-agent-edit').check();await page.locator('#mode-rig').click();
  const info=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any),points=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio',{section:'points'}) as any);
  const before=await info(),original=(await points()).items,target=original.find((p:any)=>p.name===(action==='delete_bone'?'LeftKnee':'LeftFoot'));let requests=0;
  await page.route('http://127.0.0.1:11434/**',async route=>{
   const headers={'Access-Control-Allow-Origin':'http://127.0.0.1:5173'};
   if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'content-type'}});return;}
   const reading=requests++===0,args=reading?{section:'points'}:{command:{session:before.session,expectedRevision:before.revision,action,id:target.id,...(action==='insert_bone'?{ratio:.3}:action==='reparent_bone'?{target:original.find((p:any)=>p.name==='LeftHip').id}:{})}};
   await route.fulfill({headers,contentType:'application/json',body:JSON.stringify({done:true,message:{role:'assistant',content:'',tool_calls:[{function:{name:reading?'get_studio':'edit_studio',arguments:args}}]}})});
  });
  await page.locator('.assistant-panel > summary').click();await page.locator('#assistant-prompt').fill(action==='insert_bone'?'Füge vor dem linken Fuß ein Gelenk ein.':action==='delete_bone'?'Entferne den linken Knieknochen.':'Hänge den linken Fuß direkt unter die linke Hüfte.');await page.locator('#assistant-send').click();await expect(page.locator('#assistant-apply')).toBeVisible();
  expect((await info()).revision).toBe(before.revision);expect((await points()).items).toEqual(original);expect(requests).toBe(2);
  await page.locator('#assistant-apply').click();expect((await info()).revision).toBe(before.revision+1);expect((await info()).counts.points).toBe(before.counts.points+(action==='insert_bone'?1:action==='delete_bone'?-1:0));
  if(action==='reparent_bone')expect((await points()).items.find((p:any)=>p.id===target.id).parentId).toBe(original.find((p:any)=>p.name==='LeftHip').id);
  await page.screenshot({path:`test-results/assistant-${action}.png`,fullPage:true});await page.locator('#studio-undo').click();expect((await points()).items).toEqual(original);expect(errors).toEqual([]);
 });
}
