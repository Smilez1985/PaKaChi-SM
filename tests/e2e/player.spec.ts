import { test, expect } from '@playwright/test';

test('original PaKaChi transforms, holds its form and keeps MQTT opt-in', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  const original = page.frameLocator('#legacy-frame');
  await expect(original.locator('#status')).toContainText('Tierform');
  await expect(original.locator('#mqtt-enabled')).not.toBeChecked();
  await original.getByRole('button', { name: 'Arbeiten', exact: true }).click();
  await expect(original.locator('#status')).toContainText('Arbeitsform', { timeout: 15000 });
  await original.locator('#state-choice').selectOption('thinking');
  await expect(original.locator('#status')).toContainText('Arbeitsform · Denken');
  await original.getByRole('button', { name: 'Normaler Chat' }).click();
  await expect(original.locator('#status')).toContainText('Tierform', { timeout: 15000 });
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/pakachi-original.png', fullPage: true });
});

test('3D selection, playback, studio and broken import preserve a working avatar', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('Avatar auswählen', { exact: true }).selectOption('mika');
  await expect(page.locator('#message')).toContainText('Mika bereit');
  await page.getByRole('button', { name: 'Winken', exact: false }).click();
  await expect(page.locator('#activity')).toContainText('Winken');
  await expect(page.locator('#activity')).toContainText('Entspannen', { timeout: 10000 });
  await page.locator('#pause').click();
  await expect(page.locator('#activity')).toContainText('Pausiert');
  await page.locator('#speed').selectOption('2');
  await page.locator('#timeline').fill('500');
  await page.locator('#studio-tab').click();
  await page.getByLabel('Skelett anzeigen').check();
  await expect(page.locator('#studio-controls')).toBeVisible();
  await page.locator('#viewport').hover(); await page.mouse.wheel(0, -600);
  await page.screenshot({ path: 'test-results/studio.png', fullPage: true });
  await page.locator('#back-player').click();
  await page.getByLabel('Avatar auswählen', { exact: true }).selectOption('nori');
  await expect(page.locator('#message')).toContainText('Nori bereit');
  await expect(page.locator('#moves')).not.toContainText('Winken');
  await expect(page.locator('#moves')).toContainText('Umschauen');
  await page.locator('#file-input').setInputFiles({ name: 'broken.glb', mimeType: 'model/gltf-binary', buffer: Buffer.from('invalid') });
  await expect(page.locator('#message')).toContainText('Laden fehlgeschlagen');
  await expect(page.locator('#avatar-name')).toHaveText('Nori');
  await expect(page.locator('#pause')).toBeEnabled();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/player-3d.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('shared state controls original and 3D; transports start disabled', async ({ page }) => {
  await page.goto('/');
  const state = page.locator('#agent-state');
  await expect(state).toBeEnabled();
  await expect(page.locator('#mqtt-active')).not.toBeChecked();
  await expect(page.locator('#mcp-active')).not.toBeChecked();
  await state.selectOption('working');
  await expect(page.frameLocator('#legacy-frame').locator('#status')).toContainText('Arbeitsform', {timeout:15000});
  await page.frameLocator('#legacy-frame').getByRole('button', {name:'Normaler Chat'}).click();
  await expect(state).toHaveValue('idle');
  await page.getByLabel('Avatar auswählen', {exact:true}).selectOption('mika');
  await expect(page.locator('#message')).toContainText('Mika bereit');
  await state.selectOption('working');
  await page.getByRole('button', {name:'Winken',exact:false}).click();
  await expect(page.locator('#activity')).toContainText('Winken');
  await expect(page.locator('#activity')).toContainText('Arbeiten',{timeout:10000});
  await expect(state).toHaveValue('working');
  const invalid = await page.evaluate(() => {
    try { window.PaKaChiSM.call('set_state',{state:'sleeping'}); return false; }
    catch { return true; }
  });
  expect(invalid).toBe(true);
  await expect(state).toHaveValue('working');
});
