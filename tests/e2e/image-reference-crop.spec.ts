import {test,expect,type Page} from '@playwright/test';

async function mountEditor(page:Page){
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const sourceCanvas=document.createElement('canvas');sourceCanvas.width=100;sourceCanvas.height=100;
  const sourceContext=sourceCanvas.getContext('2d')!;sourceContext.fillStyle='#ff0000';sourceContext.fillRect(0,0,100,100);
  const blob=await new Promise<Blob>(resolve=>sourceCanvas.toBlob((value:Blob|null)=>resolve(value!),'image/png'));
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
 const status=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions[0].status);
 expect(status).toBe('suggested');
});

async function mountRectangleEditor(page:Page,includeInitialRegion=true){
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('/');
 await page.evaluate(async(includeInitialRegion:boolean)=>{
  const sourceCanvas=document.createElement('canvas');sourceCanvas.width=100;sourceCanvas.height=100;
  const context=sourceCanvas.getContext('2d')!;context.fillStyle='#f5f5f5';context.fillRect(0,0,100,100);
  context.fillStyle='#202020';context.fillRect(10,10,80,80);
  const blob=await new Promise<Blob>(resolve=>sourceCanvas.toBlob((value:Blob|null)=>resolve(value!),'image/png'));
  const source=new File([blob],'touching-figures.png',{type:'image/png'});
  const initial={format:'pakachi-image-reference',version:1,source:{sha256:'0'.repeat(64),width:100,height:100},
   regions:includeInitialRegion?[{id:'joined',label:'Joined figures',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:10,y:10,width:80,height:80}}]:[],
   views:[{id:'view-1',label:'Front',regionIds:includeInitialRegion?['joined']:[]}],forms:[{id:'form-1',label:'Animal',viewIds:['view-1']}],avatars:[{id:'avatar-1',label:'PaKaChi',formIds:['form-1']}]};
  const {mountImageReferenceEditor}=await import('../../src/image-reference-editor.ts');
  const host=document.createElement('div');document.body.append(host);
  const editor=mountImageReferenceEditor(host,source,()=> 'en',()=>{},initial as any);
  (window as any).__imageReferenceEditor=editor;
 },includeInitialRegion);
}
test('browser editor splits a rectangle into two separate unconfirmed polygon regions',async({page})=>{
 await mountRectangleEditor(page);
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.getByRole('button',{name:'Split contour'}).click();
 await page.mouse.click(box.x+box.width*0.5,box.y+box.height*0.02);
 await page.mouse.click(box.x+box.width*0.5,box.y+box.height*0.98);
 const regions=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions);
 expect(regions, 'editor reference should expose the updated split regions').toHaveLength(2);
 expect(regions.every((region:any)=>region.geometry.type==='polygon'&&region.status==='suggested')).toBe(true);
 expect(regions[0].id).not.toBe(regions[1].id);
 const area=(points:Array<{x:number;y:number}>)=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length]!;return sum+p.x*q.y-q.x*p.y;},0))/2;
 expect(area(regions[0].geometry.points)+area(regions[1].geometry.points)).toBe(6400);
});

test('changing a region classification requires renewed review',async({page})=>{
 await mountEditor(page);
 const kind=page.getByRole('combobox',{name:'Region type'});
 await expect(kind).toHaveValue('view');
 await kind.selectOption('detail');
 const region=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions[0]);
 expect(region.kind).toBe('detail');
 expect(region.status).toBe('suggested');
});

test('changing avatar, form or view assignment invalidates confirmation and selection',async({page})=>{
 await mountEditor(page);
 await expect(page.getByLabel('Confirm reviewed region')).toBeChecked();
 await expect(page.evaluate(async()=> (window as any).__imageReferenceEditor.selectedCrop().then(()=>true))).resolves.toBe(true);
 await page.getByLabel('Avatar',{exact:true}).fill('Different avatar');
 const region=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions[0]);
 expect(region.status).toBe('suggested');
 await expect(page.evaluate(async()=> (window as any).__imageReferenceEditor.selectedCrop().then(()=>true,()=>false))).resolves.toBe(false);
});

test('moving a confirmed rectangle invalidates its confirmation',async({page})=>{
 await mountRectangleEditor(page);
 const before=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions[0]);
 expect(before.status).toBe('confirmed');
 await expect(page.evaluate(async()=> (window as any).__imageReferenceEditor.selectedCrop().then(()=>true))).resolves.toBe(true);
 const canvas=page.locator('canvas.image-reference-canvas');
 const bounds=await canvas.boundingBox();expect(bounds).not.toBeNull();const box=bounds!;
 await page.mouse.move(box.x+box.width*0.5,box.y+box.height*0.5);
 await page.mouse.down();await page.mouse.move(box.x+box.width*0.55,box.y+box.height*0.55,{steps:3});await page.mouse.up();
 const region=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions[0]);
 expect(region.status).toBe('suggested');
});

test('editing rectangle source-pixel fields invalidates confirmation and selection',async({page})=>{
 await mountRectangleEditor(page);
 await expect(page.getByLabel('Confirm reviewed region')).toBeChecked();
 await expect(page.getByLabel('Confirm reviewed region')).toBeChecked();
 await expect(page.evaluate(async()=> (window as any).__imageReferenceEditor.selectedCrop().then(()=>true))).resolves.toBe(true);
 await page.getByLabel('X',{exact:true}).fill('12');
 await page.getByLabel('X',{exact:true}).press('Tab');
 const region=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions[0]);
 expect(region.geometry.x).toBe(12);
 expect(region.status).toBe('suggested');
 await expect(page.evaluate(async()=> (window as any).__imageReferenceEditor.selectedCrop().then(()=>true,()=>false))).resolves.toBe(false);
});


test('editor creates and removes explicit region relations with renewed review',async({page})=>{
 await mountRectangleEditor(page);
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.getByRole('button',{name:'Split contour'}).click();
 await page.mouse.click(box.x+box.width*0.5,box.y+box.height*0.02);
 await page.mouse.click(box.x+box.width*0.5,box.y+box.height*0.98);
 const ids=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions.map((region:any)=>region.id));
 await page.getByLabel('Source region').selectOption(ids[0]);
 await page.getByLabel('Target region').selectOption(ids[1]);
 await page.getByLabel('Relation type').selectOption('same-avatar');
 await page.getByRole('button',{name:'Add relation'}).click();
 let document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.relations).toHaveLength(1);
 expect(document.relations[0]).toMatchObject({kind:'same-avatar',sourceRegionId:ids[0],targetRegionId:ids[1]});
 expect(document.regions.every((region:any)=>region.status==='suggested')).toBe(true);
 await page.getByRole('button',{name:'Remove'}).click();
 document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.relations??[]).toHaveLength(0);
});

async function mountSuggestionEditor(page:Page){
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;
  const context=canvas.getContext('2d')!;context.fillStyle='#eee';context.fillRect(0,0,100,100);
  const blob=await new Promise<Blob>(resolve=>canvas.toBlob((value:Blob|null)=>resolve(value!),'image/png'));
  const source=new File([blob],'two-forms.png',{type:'image/png'});
  const initial={format:'pakachi-image-reference',version:1,source:{sha256:'0'.repeat(64),width:100,height:100},
   regions:[
    {id:'animal-front',label:'Animal front',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:5,y:5,width:40,height:80}},
    {id:'work-front',label:'Work front',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:55,y:5,width:40,height:80}}
   ],
   views:[{id:'animal-view',label:'Animal front',regionIds:['animal-front']},{id:'work-view',label:'Work front',regionIds:['work-front']}],
   forms:[{id:'animal-form',label:'Animal',viewIds:['animal-view']},{id:'work-form',label:'Work',viewIds:['work-view']}],
   avatars:[{id:'pakachi',label:'PaKaChi',formIds:['animal-form','work-form']}]};
  const {mountImageReferenceEditor}=await import('../../src/image-reference-editor.ts');
  const host=document.createElement('div');document.body.append(host);
  (window as any).__imageReferenceEditor=mountImageReferenceEditor(host,source,()=> 'en',()=>{},initial as any);
 });
}
test('editor presents hierarchy relation suggestions and only applies them after explicit acceptance',async({page})=>{
 await mountSuggestionEditor(page);
 await expect(page.getByText('Suggested relations (not applied)')).toBeVisible();
 const accept=page.getByRole('button',{name:/Accept suggestion:/});
 await expect(accept).toHaveCount(1);
 let document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.relations??[]).toHaveLength(0);
 expect(document.regions.every((region:any)=>region.status==='confirmed')).toBe(true);
 await accept.click();
 document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.relations).toHaveLength(1);
 expect(document.relations[0]).toMatchObject({kind:'other-form',sourceRegionId:'animal-front',targetRegionId:'work-front'});
 expect(document.regions.every((region:any)=>region.status==='suggested')).toBe(true);
 await expect(page.getByRole('button',{name:/Accept suggestion:/})).toHaveCount(0);
});

test('solid-background detection shows geometry quality and its evidence without semantic claims',async({page})=>{
 await mountRectangleEditor(page,false);
 await page.getByRole('button',{name:'Detect solid background'}).click();
 const region=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions.find((item:any)=>item.status==='suggested'));
 expect(region.confidence).toBeGreaterThan(0);
 expect(region.confidenceEvidence.length).toBeGreaterThan(0);
 await expect(page.getByText(/Geometric segmentation quality:/)).toBeVisible();
 await expect(page.getByText(/not an avatar-identity or form prediction/)).toBeVisible();
});


test('transparent detection shows visual similarity as a manual-only review hint',async({page})=>{
 await page.route('**/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('/');
 await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=200;canvas.height=100;
  const context=canvas.getContext('2d')!;
  for(const x of [20,130]){
   context.fillStyle='#111';context.fillRect(x+5,15,30,50);
   context.fillStyle='#eee';context.fillRect(x+12,25,6,6);
   context.fillRect(x+22,25,6,6);
   context.fillStyle='#111';context.fillRect(x+15,42,10,5);
  }
  const blob=await new Promise<Blob>(resolve=>canvas.toBlob((value:Blob|null)=>resolve(value!),'image/png'));
  const source=new File([blob],'similar-figures.png',{type:'image/png'});
  const {mountImageReferenceEditor}=await import('../../src/image-reference-editor.ts');
  const host=document.createElement('div');document.body.append(host);
  (window as any).__imageReferenceEditor=mountImageReferenceEditor(host,source,()=> 'en',()=>{});
 });
 await page.getByRole('button',{name:'Detect transparent figures'}).click();
 const regions=await page.evaluate(async()=> (await (window as any).__imageReferenceEditor.reference()).regions);
 expect(regions).toHaveLength(2);
 expect(regions.every((region:any)=>region.status==='suggested'&&region.kind==='helper')).toBe(true);
 const hint=page.getByText(/Visually similar crops – review manually/);
 await expect(hint).toBeVisible();
 await expect(page.getByText(/luminance-pattern similarity, not an identity prediction/)).toBeVisible();
 const document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.relations??[]).toHaveLength(0);
 expect(document.avatars).toHaveLength(2);
 expect(document.avatars.every((avatar:any)=>avatar.label.startsWith('Unzugeordnet '))).toBe(true);
 expect(document.forms.every((form:any)=>form.label==='Unklassifiziert')).toBe(true);
 // A moved crop no longer represents the pixels used for its original hash.
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;const first=regions[0].geometry;
 const startX=box.x+(first.x+first.width/2)*box.width/200,startY=box.y+(first.y+first.height/2)*box.height/100;
 await page.mouse.move(startX,startY);await page.mouse.down();await page.mouse.move(startX+8,startY+4,{steps:3});await page.mouse.up();
 await expect(page.getByText(/Visually similar crops – review manually/)).toHaveCount(0);
});


test('editor places, moves, edits and deletes semantic 2D landmarks on the source image',async({page})=>{
 await mountEditor(page);
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.getByRole('button',{name:'Landmark mode'}).click();
 await page.getByLabel('Anatomical part ID').selectOption('head');
 await page.getByLabel('Surface layer ID (optional)').selectOption('fur');
 await page.getByLabel('Pose ID').fill('front-neutral');
 await page.getByLabel('Influence radius in source pixels').fill('60');
 await page.mouse.click(box.x+box.width*.25,box.y+box.height*.25);
 let document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.landmarks).toHaveLength(1);
 expect(document.landmarks[0]).toMatchObject({regionId:'region-1',partId:'head',surfaceLayerId:'fur',poseId:'front-neutral',x:25,y:25,radiusPx:60});
 await page.mouse.move(box.x+box.width*.25,box.y+box.height*.25);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.30,box.y+box.height*.30,{steps:4});await page.mouse.up();
 document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.landmarks[0]).toMatchObject({x:30,y:30});
 await page.getByLabel('Landmark X').fill('28');await page.getByLabel('Landmark X').press('Tab');
 document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.landmarks[0].x).toBe(28);
 await page.getByLabel('Active landmark').selectOption('landmark-1');
 await page.getByRole('button',{name:'Delete landmark'}).click();
 document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.landmarks??[]).toHaveLength(0);
});

test('2D classifier preview keeps a composite confirmed crop unresolved and never auto-applies it',async({page})=>{
 await mountEditor(page);
 await page.getByRole('button',{name:'Landmark mode'}).click();
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.getByLabel('Anatomical part ID').selectOption('head');
 await page.getByLabel('Pose ID').fill('front-neutral');
 await page.mouse.click(box.x+box.width*.25,box.y+box.height*.25);
 await page.mouse.click(box.x+box.width*.75,box.y+box.height*.75);
 await page.getByLabel('Anatomical part ID').selectOption('torso');
 await page.getByRole('button',{name:'Show 2D classification proposals'}).click();
 await expect(page.getByText(/Region contains multiple anatomical or surface-layer targets/)).toBeVisible();
 const document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.regions[0].status).toBe('confirmed');
 expect(document.landmarks).toHaveLength(2);
});

test('landmark editor exposes the shared semantic catalog as selectable anatomy and surface layers',async({page})=>{
 await mountEditor(page);
 await page.getByRole('button',{name:'Landmark mode'}).click();
 const parts=page.getByLabel('Anatomical part ID');
 const layers=page.getByLabel('Surface layer ID (optional)');
 expect(await parts.locator('option').allTextContents()).toEqual(expect.arrayContaining(['Body › Torso › Neck › Head (head)','Body › Torso › Shoulders › Forelimbs › Paws (paws)','Body › Torso › Shoulders › Forelimbs › Upper arms › Forearms › Hands (hands)','Body › Tail (tail)']));
 expect(await layers.locator('option').allTextContents()).toEqual(expect.arrayContaining(['No surface layer','Fur (fur)','Armor and hard covers (armor)','Mechanical joints and hardware (mechanics)']));
 await parts.selectOption('paws');
 await layers.selectOption('fur');
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.mouse.click(box.x+box.width*.25,box.y+box.height*.25);
 const document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.landmarks[0]).toMatchObject({partId:'paws',surfaceLayerId:'fur'});
});

test('editor samples exact RGBA source pixels and persists/removes color observations',async({page})=>{
 await mountEditor(page);
 await page.getByRole('button',{name:'Add color sample'}).click();
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.5);
 let document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.observations).toHaveLength(1);
 expect(document.observations[0]).toMatchObject({kind:'color-sample',regionId:'region-1',x:50,y:50,rgba:[255,0,0,255],radiusPx:3});
 await expect(page.getByText(/RGBA 255, 0, 0, 255/)).toBeVisible();
 await page.getByRole('button',{name:'Delete observation',exact:true}).click();
 document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.observations??[]).toHaveLength(0);
});


test('editor captures, displays, persists and removes material-boundary polylines',async({page})=>{
 await mountEditor(page);
 await page.getByRole('button',{name:'Draw material boundary'}).click();
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.mouse.click(box.x+box.width*.2,box.y+box.height*.3);
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.4);
 await page.mouse.click(box.x+box.width*.8,box.y+box.height*.6);
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 let document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.observations).toHaveLength(1);
 expect(document.observations[0]).toMatchObject({kind:'material-boundary',regionId:'region-1',points:[{x:20,y:30},{x:50,y:40},{x:80,y:60}]});
 await expect(page.getByText(/Material boundary · 3 points/)).toBeVisible();
 await page.getByRole('button',{name:'Delete observation'}).click();
 document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.observations??[]).toHaveLength(0);
});

 
test('editor corrects individual material-boundary vertices in source pixels',async({page})=>{
 await mountEditor(page);
 await page.getByRole('button',{name:'Draw material boundary'}).click();
 const canvas=page.locator('canvas.image-reference-canvas'),bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();const box=bounds!;
 await page.mouse.click(box.x+box.width*.2,box.y+box.height*.3);
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.4);
 await page.mouse.click(box.x+box.width*.8,box.y+box.height*.6);
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 await page.getByRole('button',{name:'Edit material boundary'}).click();
 await page.mouse.move(box.x+box.width*.2,box.y+box.height*.3);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width*.25,box.y+box.height*.35,{steps:4});
 await page.mouse.up();
 const document=await page.evaluate(async()=> (window as any).__imageReferenceEditor.reference());
 expect(document.observations[0].points[0]).toMatchObject({x:25,y:35});
});
