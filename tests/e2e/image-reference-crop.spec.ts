import {test,expect,type Page} from '@playwright/test';

async function mountEditor(page:Page){
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const sourceCanvas=document.createElement('canvas');sourceCanvas.width=100;sourceCanvas.height=100;
  const sourceContext=sourceCanvas.getContext('2d')!;sourceContext.fillStyle='#ff0000';sourceContext.fillRect(0,0,100,100);
  const blob=await new Promise<Blob>(resolve=>sourceCanvas.toBlob(value=>resolve(value!),'image/png'));
  const source=new File([blob],'reference.png',{type:'image/png'});
  const initial={
   format:'pakachi-image-reference',version:1,
   source:{sha256:'0'.repeat(64),width:100,height:100},
   regions:[{id:'region-1',label:'Panda torso',kind:'view',status:'confirmed',geometry:{type:'polygon',points:[{x:10,y:10},{x:90,y:10},{x:90,y:90},{x:10,y:90}],holes:[[{x:35,y:35},{x:35,y:65},{x:65,y:65},{x:65,y:35}]]}}],
   views:[{id:'view-1',label:'Front',regionIds:['region-1']}],
   forms:[{id:'form-1',label:'Animal',viewIds:['view-1']}],
   avatars:[{id:'avatar-1',label:'PaKaChi',formIds:['form-1']}]
  };
  const {mountImageReferenceEditor}=await import('../../src/image-reference-editor.ts');
  const host=document.createElement('div');document.body.append(host);
  const editor=mountImageReferenceEditor(host,source,()=> 'en',()=>{},initial as any);
  (window as any).__imageReferenceEditor=editor;
 });
}

test('selected polygon crop has a transparent interior hole and opaque exterior',async({page})=>{
 await mountEditor(page);
 const pixels=await page.evaluate(async()=>{
  const crop=await (window as any).__imageReferenceEditor.selectedCrop() as File;
  const bitmap=await createImageBitmap(crop);
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d')!;context.drawImage(bitmap,0,0);
  const hole=context.getImageData(40,40,1,1).data[3];
  const outsideHole=context.getImageData(10,10,1,1).data[3];
  bitmap.close();
  return {width:canvas.width,height:canvas.height,hole,outsideHole};
 });
 expect(pixels).toEqual({width:80,height:80,hole:0,outsideHole:255});
});

test('a hole vertex can be moved in the editor and remains attached to its region',async({page})=>{
 await mountEditor(page);
 const canvas=page.locator('canvas.image-reference-canvas');
 const bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();
 const box=bounds!;
 await page.mouse.move(box.x+box.width*0.35,box.y+box.height*0.35);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width*0.40,box.y+box.height*0.40,{steps:4});
 await page.mouse.up();
 const point=await page.evaluate(async()=>{
  const document=await (window as any).__imageReferenceEditor.reference();
  return document.regions[0].geometry.holes[0][0];
 });
 expect(point).toEqual({x:40,y:40});
});
