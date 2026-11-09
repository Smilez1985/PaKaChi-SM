import {test,expect} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createLocalApplication} from '../../server/local/app.mjs';

test('local workspace pairs the actual player, generates Caddy config and runs Python with a result imported into Studio',async({page})=>{
 test.setTimeout(90000);
 const directory=await mkdtemp(join(tmpdir(),'pakachi-ui-')),app=await createLocalApplication({directory,seed:false}),url=await app.listen(0),errors=[];let client;
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await page.locator('#runtime-open').click();const panel=page.locator('#local-runtime-dialog');await expect(panel).toBeVisible();await expect(panel.locator('#runtime-state')).toContainText('Werkzeuge aus');
  await panel.locator('#runtime-enabled').check();await panel.locator('#runtime-allowScripts').check();
  await panel.getByText('Programme und GPU prüfen',{exact:true}).click();await panel.locator('#runtime-python').fill(process.platform==='win32'?'python':'python3');
  await panel.locator('#runtime-publicUrl').fill('https://example.duckdns.org/pakachi/mcp');await panel.locator('#runtime-caddy').click();await expect(panel.locator('#runtime-feedback')).toHaveText('Fertig.');
  const snippet=await panel.locator('#runtime-caddy-output').inputValue();expect(snippet).toContain('reverse_proxy '+new URL(url).host);expect(snippet).toContain('/pakachi/token');expect(snippet.split('\n').filter(line=>!line.startsWith('#')).join('\n')).not.toContain('/api/local');
  await panel.locator('#runtime-pair').click();await expect(panel.locator('#runtime-state')).toContainText('Player gekoppelt',{timeout:15000});
  client=new Client({name:'browser-workspace-test',version:'1'});await client.connect(new StreamableHTTPClientTransport(new URL(url+'/mcp'),{requestInit:{headers:{Authorization:'Bearer '+app.settings.token}}}));
  const state=await client.callTool({name:'get_state',arguments:{}});expect(state.isError).not.toBe(true);expect(JSON.parse(state.content[0].text).state).toBe('idle');
  const source='import os\nfrom pathlib import Path\nPath(os.environ["PAKACHI_JOB_OUTPUT"],"browser-result.txt").write_text("Created by actual Python")\nprint("Browser Python job completed")';
  await panel.locator('#runtime-source').fill(source);await panel.locator('#runtime-write-script').click();await expect(panel.locator('#runtime-feedback')).toHaveText('Fertig.');await expect(panel.locator('#runtime-script')).not.toHaveValue('');
  await panel.locator('#runtime-kind').selectOption('python');await panel.locator('#runtime-start-job').click();await expect(panel.locator('#runtime-jobs')).toContainText('completed',{timeout:15000});await panel.locator('#runtime-jobs summary').first().click();await expect(panel.locator('#runtime-jobs')).toContainText('Browser Python job completed');await expect(panel.locator('#runtime-assets')).toContainText('browser-result.txt');
  const downloadEvent=page.waitForEvent('download');await panel.locator('#runtime-assets > div').filter({hasText:'browser-result.txt'}).getByRole('button',{name:'Herunterladen'}).click();const download=await downloadEvent;expect(await readFile(await download.path(),'utf8')).toBe('Created by actual Python');
  const json=await readFile(new URL('../../public/model-zoo/mika/model.gltf',import.meta.url));const chunk=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(chunk);const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(20+chunk.length,8);header.writeUInt32LE(chunk.length,12);header.writeUInt32LE(0x4e4f534a,16);
  await panel.locator('#runtime-upload').setInputFiles({name:'avatar.glb',mimeType:'model/gltf-binary',buffer:Buffer.concat([header,chunk])});await expect(panel.locator('#runtime-assets')).toContainText('avatar.glb');
  await panel.getByRole('button',{name:'Im Studio öffnen'}).click();await expect(panel.locator('#runtime-feedback')).toHaveText('Fertig.');await panel.locator('#runtime-close').click();await expect(page.locator('#studio-controls')).toBeVisible();
  await page.screenshot({path:'test-results/local-workspace-studio.png',fullPage:true});await page.locator('#runtime-open').click();await expect(panel.locator('#runtime-state')).toContainText('Player gekoppelt');await page.screenshot({path:'test-results/local-workspace.png',fullPage:true});expect(errors).toEqual([]);
 }finally{await client?.close();await app.close();await rm(directory,{recursive:true,force:true});}
});
