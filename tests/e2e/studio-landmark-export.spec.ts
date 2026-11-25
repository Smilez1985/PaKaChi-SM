import { test, expect } from '@playwright/test';

test('Studio confirms reviewed joint anchors and downloads a GLB without replacing the active model', async ({ page }) => {
  await page.route('**/', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body><main id="studio-host"></main></body></html>',
  }));
  await page.goto('/');
  await page.evaluate(async () => {
    const fixtureUrl = '/tests/e2e/fixtures/studio-landmark-export.ts';
    const fixture = await import(/* @vite-ignore */ fixtureUrl);
    const host = document.querySelector<HTMLElement>('#studio-host')!;
    const state = await fixture.mountStudioLandmarkExportFixture(host);
    (window as unknown as { __landmarkRig: typeof state }).__landmarkRig = state;
  });

  const panel = page.locator('#draft-rig-landmark-review-panel');
  await expect(panel).toContainText('1 Kandidaten · 0 ungelöst');
  const apply = page.locator('#draft-rig-landmark-plan-apply');
  await expect(apply).toBeDisabled();
  await panel.getByRole('button', { name: 'Gelenkanker ausdrücklich bestätigen' }).click();
  await expect(apply).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await apply.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('pakachi-avatar-landmark-rig.glb');
  expect(await download.failure()).toBeNull();
  await expect(panel).toContainText('Draft-Rig erzeugt und GLB exportiert');
  await expect(panel).toContainText('Der aktuell geladene Avatar blieb unverändert');

  const unchanged = await page.evaluate(() => {
    const state = (window as unknown as { __landmarkRig: { root: import('three').Group } }).__landmarkRig;
    return {
      hasDraftHead: !!state.root.getObjectByName('Draft_Head'),
      hasSkinnedMesh: state.root.children.some(child => child.type === 'SkinnedMesh'),
    };
  });
  expect(unchanged).toEqual({ hasDraftHead: false, hasSkinnedMesh: false });
  await page.evaluate(() => {
    (window as unknown as { __landmarkRig: { editor: { dispose(): void } } }).__landmarkRig.editor.dispose();
  });
});
