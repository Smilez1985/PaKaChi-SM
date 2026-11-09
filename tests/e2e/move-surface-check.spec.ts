import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {twistFixture} from '../helpers/twist-fixture.ts';
import {exportRiggedFigureGLB} from '../../src/figure-glb.ts';

test('motion surface check finds an intermediate collapse, opens it and preserves the saved sequence',async({page})=>{
 class Reader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}}
 const reader=globalThis.FileReader;Object.assign(globalThis,{FileReader:Reader});const f=twistFixture(true);let glb:ArrayBuffer;
 try{glb=await exportRiggedFigureGLB(f.root);}finally{Object.assign(globalThis,{FileReader:reader});}
 for(const [i,degrees]of [120,240].entries())f.rig.data.poses[i].values[f.joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),degrees*Math.PI/180).toArray();
 f.rig.data.moves[0].poses=f.rig.data.poses.map(p=>p.id);f.rig.data.moves[0].loop=true;
 const studio=structuredClone(f.rig.data),project={format:'pakachi-studio',version:1,model:Buffer.from(glb).toString('base64'),avatar:{id:'motion-surface',name:'Motion surface',description:'Test fixture',moves:[]},studio};f.rig.dispose();
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#project-file').setInputFiles({name:'motion.pakachi.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});await expect(page.locator('#message')).toContainText('Motion surface bereit');await page.locator('#studio-tab').click();
 for(const p of studio.poses){await page.locator('#pose-list').selectOption(p.id);await page.locator('#pose-check-surface').click();await expect(page.locator('#pose-surface-result')).toContainText('Keine Überschreitung');}
 const state=()=>page.evaluate(()=>window.PaKaChiSM.call('get_studio') as any),before=await state();await page.locator('#move-check-surface').click();await expect(page.locator('#move-surface-result')).toContainText('Oberfläche auffällig');await expect(page.locator('#move-surface-result')).toContainText('Geprüfte Stichproben');expect((await state()).revision).toBe(before.revision);
 const analysis=await page.evaluate(async()=>{const state=window.PaKaChiSM.call('get_studio') as any;return await window.PaKaChiSM.call('analyze_studio_surface',{session:state.session,expectedRevision:state.revision,kind:'move',id:'twist-move'}) as any;});expect(analysis.samples).toBeGreaterThan(33);expect(analysis.samples).toBeLessThanOrEqual(97);expect(analysis.maximumIssues).toBeGreaterThan(0);expect((await state()).revision).toBe(before.revision);
 await page.locator('#move-check-surface').click();await expect(page.locator('#move-surface-result')).toContainText('Oberfläche auffällig');await page.locator('#move-surface-result').screenshot({path:'test-results/motion-surface-report.png'});await page.locator('#move-surface-result button').first().click();await expect(page.locator('#move-inspect-save')).toBeVisible();await page.locator('#viewport canvas').screenshot({path:'test-results/motion-surface-collapse.png'});await page.locator('#move-stop').click();
 const download=page.waitForEvent('download');await page.locator('#studio-save').click();const file=(await(await download).path())!,saved=JSON.parse(await readFile(file,'utf8'));expect(saved.studio.poses).toEqual(studio.poses);expect(saved.studio.moves).toEqual(studio.moves);
 await page.locator('#project-file').setInputFiles(file);await expect(page.locator('#message')).toContainText('Motion surface bereit');await page.locator('#studio-tab').click();await page.locator('#move-check-surface').click();await expect(page.locator('#move-surface-result')).toContainText('Oberfläche auffällig');expect(errors).toEqual([]);
});
