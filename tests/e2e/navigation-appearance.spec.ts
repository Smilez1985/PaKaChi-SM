import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const version=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8')).version;
test('navigation shows the package version and readable options in normal, hover and keyboard focus states',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.rail-bottom')).toContainText(`Entwicklungsstand ${version}`);
 const button=page.locator('#options-open');await expect(button).toBeEnabled();
 const contrast=()=>button.evaluate(el=>{
  const rgb=(s:string)=>s.match(/[\d.]+/g)!.slice(0,3).map(Number);
  const light=(c:number[])=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const style=getComputedStyle(el),bg=style.backgroundColor==='rgba(0, 0, 0, 0)'?getComputedStyle(el.closest('.rail')!).backgroundColor:style.backgroundColor;
  const a=light(rgb(style.color)),b=light(rgb(bg));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 });
 expect(await contrast()).toBeGreaterThanOrEqual(4.5);
 await button.hover();expect(await contrast()).toBeGreaterThanOrEqual(4.5);
 await page.mouse.move(500,10);await page.locator('.brand').focus();await page.keyboard.press('Tab');await expect(button).toBeFocused();
 expect(await button.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
 await page.screenshot({path:'test-results/navigation-readable.png'});
 await page.keyboard.press('Enter');await expect(page.locator('#options-dialog')).toBeVisible();
});
