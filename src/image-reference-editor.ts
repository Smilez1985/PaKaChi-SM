import type {ImageReferenceDocument,ImageReferenceRegion} from './image-reference.ts';
import {checkImageReferenceReadiness,editImageReferenceRectangle,reorderImageReferenceRegions} from './image-reference.ts';
import {cropImageReferenceRegion} from './image-reference-crop.ts';

interface Entry {region:ImageReferenceRegion;avatar:string;form:string;view:string;use:boolean}
const makeId=(prefix:string,n:number)=>`${prefix}-${n}`;
export function mountImageReferenceEditor(host:HTMLElement,source:File,language:()=> 'de'|'en',changed:()=>void){
 const de=()=>language()==='de';
 const root=document.createElement('section');root.className='image-reference-editor';
 const heading=document.createElement('h3'),help=document.createElement('p'),canvas=document.createElement('canvas'),list=document.createElement('div'),selectedLabel=document.createElement('label'),selected=document.createElement('select'),feedback=document.createElement('p');
 canvas.className='image-reference-canvas';canvas.setAttribute('aria-label','Source image marking surface');
 feedback.setAttribute('role','status');selectedLabel.textContent=de()?'Ausschnitt für 3D auswählen':'Select region for 3D';
 root.append(heading,help,canvas,list,selectedLabel,selected,feedback);host.replaceChildren(root);
 let width=0,height=0,entries:Entry[]=[],active=0,drag:{x:number;y:number}|undefined,seq=0;
 const t=(a:string,b:string)=>de()?a:b;
 const image=new Image();
 const draw=()=>{
  const context=canvas.getContext('2d');if(!context)return;context.clearRect(0,0,width,height);context.drawImage(image,0,0,width,height);
  entries.forEach((entry,i)=>{const g=entry.region.geometry;if(g.type!=='rectangle')return;context.lineWidth=Math.max(2,width/500);context.strokeStyle=entry.region.status==='ignored'?'#999':i===active?'#12a56b':'#e0a52d';context.strokeRect(g.x,g.y,g.width,g.height);context.fillStyle=context.strokeStyle;context.font=`${Math.max(14,width/60)}px sans-serif`;context.fillText(String(i+1),g.x+4,g.y+Math.max(16,width/60));});
  if(drag){context.strokeStyle='#00a878';context.setLineDash([8,5]);context.lineWidth=Math.max(2,width/500);context.strokeRect(drag.x,drag.y,0,0);context.setLineDash([]);}
 };
 const render=()=>{
  list.replaceChildren();selected.replaceChildren();
  entries.forEach((entry,i)=>{
   const card=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=t('Bereich ','Region ')+(i+1);card.append(legend);
   const fields:[keyof Pick<Entry,'region'|'avatar'|'form'|'view'>,string,string][]=[
    ['region',t('Bereichsname','Region label'),entry.region.label],['avatar',t('Avatar','Avatar'),entry.avatar],['form',t('Form','Form'),entry.form],['view',t('Ansicht','View'),entry.view]
   ];
   fields.forEach(([key,label,value])=>{const l=document.createElement('label'),input=document.createElement('input');l.textContent=label;input.value=value;input.type='text';input.addEventListener('input',()=>{if(key==='region')entry.region.label=input.value;else entry[key]=input.value;changed();});l.append(input);card.append(l);});
   const confirm=document.createElement('label'),confirmed=document.createElement('input');confirmed.type='checkbox';confirmed.checked=entry.region.status==='confirmed';confirmed.disabled=entry.region.status==='ignored';confirm.append(confirmed,document.createTextNode(t(' Markierung geprüft und bestätigen',' Confirm reviewed region')));confirmed.onchange=()=>{entry.region.status=confirmed.checked?'confirmed':'suggested';render();changed();};card.append(confirm);
   const ignore=document.createElement('label'),ignored=document.createElement('input');ignored.type='checkbox';ignored.checked=entry.region.status==='ignored';ignore.append(ignored,document.createTextNode(t(' Diesen Bereich ignorieren',' Ignore this region')));ignored.onchange=()=>{entry.region.status=ignored.checked?'ignored':'suggested';entry.use=false;render();changed();};card.append(ignore);
   const use=document.createElement('label'),useBox=document.createElement('input');useBox.type='radio';useBox.name='image-reference-selected';useBox.checked=active===i;useBox.disabled=entry.region.status!=='confirmed';use.append(useBox,document.createTextNode(t(' Für 3D verwenden',' Use for 3D')));useBox.onchange=()=>{active=i;render();changed();};card.append(use);
   if(entry.region.geometry.type==='rectangle'){
    const geometry=entry.region.geometry;
    const geometryLabel=document.createElement('small');geometryLabel.textContent=t('Quellpixel (X, Y, Breite, Höhe)','Source pixels (X, Y, width, height)');card.append(geometryLabel);
    const geometryFields:[keyof typeof geometry,string][]=[['x','X'],['y','Y'],['width',t('Breite','Width')],['height',t('Höhe','Height')]];
    geometryFields.forEach(([key,label])=>{const l=document.createElement('label'),input=document.createElement('input');l.textContent=label;input.type='number';input.min=key==='width'||key==='height'?'4':'0';input.step='1';input.value=String(geometry[key]);input.addEventListener('change',()=>{const value=Number(input.value);if(!Number.isFinite(value)){input.value=String(geometry[key]);return;}entry.region=editImageReferenceRectangle(entry.region,width,height,{[key]:Math.round(value)});render();draw();changed();});l.append(input);card.append(l);});
   }
   const order=document.createElement('div');order.className='image-reference-order';
   const up=document.createElement('button');up.type='button';up.textContent=t('Nach oben','Move up');up.disabled=i===0;up.onclick=()=>{entries=reorderImageReferenceRegions(entries,entry.region.id,-1);active=Math.max(0,entries.findIndex(item=>item.region.id===entry.region.id));render();draw();changed();};
   const down=document.createElement('button');down.type='button';down.textContent=t('Nach unten','Move down');down.disabled=i===entries.length-1;down.onclick=()=>{entries=reorderImageReferenceRegions(entries,entry.region.id,1);active=Math.max(0,entries.findIndex(item=>item.region.id===entry.region.id));render();draw();changed();};
   order.append(up,down);card.append(order);
   const remove=document.createElement('button');remove.type='button';remove.textContent=t('Markierung löschen','Delete region');remove.onclick=()=>{entries.splice(i,1);active=Math.max(0,Math.min(active,entries.length-1));render();draw();changed();};card.append(remove);list.append(card);
   const option=document.createElement('option');option.value=entry.region.id;option.textContent=`${i+1}. ${entry.region.label} · ${entry.avatar} / ${entry.form} / ${entry.view}`;option.selected=i===active;selected.append(option);
  });
  selected.disabled=entries.length===0;feedback.textContent=entries.length?t('Markierungen: '+entries.length+'. Jede Region muss bestätigt oder ignoriert sein.','Regions: '+entries.length+'. Every region must be confirmed or ignored.'):t('Ziehe mit der Maus einen Rahmen um jeden Avatar, jede Form oder relevante Detailansicht.','Drag a rectangle around each avatar, form, or relevant detail view.');
 };
 const add=(x:number,y:number,w:number,h:number)=>{
  if(w<4||h<4)return;const n=++seq,id=makeId('region',n);
  entries.push({region:{id,label:t('Bereich ','Region ')+n,kind:'view',status:'suggested',geometry:{type:'rectangle',x,y,width:w,height:h}},avatar:'Avatar 1',form:'Tierform',view:'Ansicht '+n,use:true});active=entries.length-1;render();draw();changed();
 };
 canvas.onpointerdown=e=>{const r=canvas.getBoundingClientRect();drag={x:Math.max(0,Math.min(width,(e.clientX-r.left)*width/r.width)),y:Math.max(0,Math.min(height,(e.clientY-r.top)*height/r.height))};canvas.setPointerCapture?.(e.pointerId);};
 canvas.onpointerup=e=>{if(!drag)return;const r=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(width,(e.clientX-r.left)*width/r.width)),y=Math.max(0,Math.min(height,(e.clientY-r.top)*height/r.height)),start=drag;drag=undefined;add(Math.min(start.x,x),Math.min(start.y,y),Math.abs(x-start.x),Math.abs(y-start.y));};
 selected.onchange=()=>{active=entries.findIndex(e=>e.region.id===selected.value);render();draw();changed();};
 image.onload=()=>{width=image.naturalWidth;height=image.naturalHeight;canvas.width=width;canvas.height=height;draw();};
 image.src=URL.createObjectURL(source);
 render();
 const documentFor=async():Promise<ImageReferenceDocument>=>{
  const digest=await crypto.subtle.digest('SHA-256',await source.arrayBuffer());
  const sha=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
  const avatars=new Map<string,{id:string;label:string;formIds:string[]}>(),forms=new Map<string,{id:string;label:string;viewIds:string[]}>(),views=new Map<string,{id:string;label:string;regionIds:string[]}>();
  entries.forEach(entry=>{if(entry.region.status==='ignored')return;
   const a=entry.avatar.trim(),f=entry.form.trim(),v=entry.view.trim();if(!a||!f||!v)return;
   const aid='avatar-'+a.toLowerCase().replace(/[^a-z0-9]+/g,'-'),fid=aid+'-form-'+f.toLowerCase().replace(/[^a-z0-9]+/g,'-'),vid=fid+'-view-'+v.toLowerCase().replace(/[^a-z0-9]+/g,'-');
   if(!avatars.has(aid))avatars.set(aid,{id:aid,label:a,formIds:[]});
   if(!forms.has(fid))forms.set(fid,{id:fid,label:f,viewIds:[]});
   if(!views.has(vid))views.set(vid,{id:vid,label:v,regionIds:[]});
   if(!avatars.get(aid)!.formIds.includes(fid))avatars.get(aid)!.formIds.push(fid);
   if(!forms.get(fid)!.viewIds.includes(vid))forms.get(fid)!.viewIds.push(vid);
   views.get(vid)!.regionIds.push(entry.region.id);
  });
  return {format:'pakachi-image-reference',version:1,source:{sha256:sha,width,height},regions:entries.map(e=>e.region),views:[...views.values()],forms:[...forms.values()],avatars:[...avatars.values()]};
 };
 const readiness=async()=>{const doc=await documentFor();return checkImageReferenceReadiness(doc);};
 return {async ready(){if(!entries.length||entries.some(e=>e.region.status==='suggested'))return false;return (await readiness()).ready;},async selectedCrop(){if(!await this.ready())throw new Error('image-reference-not-ready');const entry=entries[active];if(!entry||entry.region.status!=='confirmed')throw new Error('image-reference-region-not-confirmed');return cropImageReferenceRegion(source,entry.region);},async reference(){return documentFor();},dispose(){image.onload=null;URL.revokeObjectURL(image.src);root.remove();}};
}
