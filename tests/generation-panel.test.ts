import {test} from 'node:test';
import type {TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {mountGenerationPanel} from '../src/generation-panel.ts';
import {validateGeneration} from '../src/generation-preview.ts';
import {saveProviderConfig} from '../src/ai-providers.ts';
import type {ProviderAdapter} from '../src/ai-providers.ts';
import {setProviderKey,lockProviderSession} from '../src/provider-credentials.ts';
import {glb} from './generation-fixture.mjs';
import {draftFigure} from './helpers/draft-rig-fixture.ts';
import {writeFigureGLB} from '../src/figure-glb.ts';
import {parseModel,disposeModel} from '../src/viewer.ts';
import type {prepareDraftRig} from '../src/draft-rig.ts';
const bytes=Uint8Array.from(glb());
const referenceDocument:ImageReferenceDocument={format:'pakachi-image-reference',version:1,source:{sha256:'a'.repeat(64),width:100,height:100},regions:[{id:'region-front',label:'Front',kind:'view',status:'confirmed',geometry:{type:'rectangle',x:10,y:10,width:50,height:70}}],views:[{id:'view-front',label:'Front',regionIds:['region-front']}],forms:[{id:'form-animal',label:'Animal',viewIds:['view-front']}],avatars:[{id:'avatar-panda',label:'Panda',formIds:['form-animal']}]};
async function until(check:()=>boolean){for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,5));}assert.fail('UI did not settle');}
function fixture(t:TestContext,run?:ProviderAdapter['run'],fallback=false,prepareRig?:typeof prepareDraftRig,referenceReady=true){
 const w=new Window();Object.assign(globalThis,{window:w,document:w.document});
 const host=document.createElement('div');document.body.append(host);
 const profile={id:'gen',name:'Local',adapter:'custom-generation' as const,endpoint:'http://127.0.0.1:8766',model:'triposr'};
 saveProviderConfig({version:1,profiles:fallback?[profile,{...profile,id:'backup',name:'Backup'}]:[profile],fallbacks:{assistant:[],generation:fallback?['backup']:[],rigging:[]},assignments:{assistant:null,generation:'gen',rigging:null}},w.localStorage);setProviderKey(profile,'x'.repeat(48));if(fallback)setProviderKey({...profile,id:'backup'},'y'.repeat(48));
 let beforeAdopt:(()=>Promise<void>)|undefined,adoptedReference:ImageReferenceDocument|undefined;
 let target={session:'one',revision:1},calls=0,adoptions=0,cleanups=0,previewCalls=0,adopted:Uint8Array|undefined;
 const panel=mountGenerationPanel(host,{target:()=>target,adopt:async(output,expected,valid,reference)=>{await beforeAdopt?.();if(!valid()||expected.session!==target.session||expected.revision!==target.revision)return false;adopted=output;adoptedReference=reference;adoptions++;return true;}},()=> 'de',w.localStorage,{
  adapter:(key,p)=>{assert.equal(key,(p.id==='backup'?'y':'x').repeat(48));return {id:'custom-generation',probe:async()=>({model:'triposr',capabilities:['image-to-3d']}),run:async request=>{calls++;return run?run(request):{kind:'model',bytes};}};
  },validate:validateGeneration,prepareRig,referenceEditor:(_host,_source,_language)=>({ready:async()=>referenceReady,selectedCrop:async()=>new File([new Uint8Array([1,2,3])],'region.png',{type:'image/png'}),reference:async()=>structuredClone(referenceDocument),dispose(){}}),preview:async()=>{previewCalls++;return ()=>{cleanups++;};},
 });
 t.after(()=>{panel.dispose();w.happyDOM.abort();});
 const button=(id:string)=>host.querySelector<HTMLButtonElement>('#generation-'+id)!;
 const choose=async()=>{panel.select(new File([new Uint8Array([137,80,78,71])],'panda.png',{type:'image/png'}));await new Promise(r=>setTimeout(r,0));};
 return {w,host,panel,button,choose,delayImport(fn:()=>Promise<void>){beforeAdopt=fn;},get calls(){return calls;},get adopted(){return adopted;},get adoptedReference(){return adoptedReference;},get adoptions(){return adoptions;},get cleanups(){return cleanups;},get previewCalls(){return previewCalls;},change(){target={...target,revision:target.revision+1};w.dispatchEvent(new w.Event('pakachi-sm:change'));}};
}
test('image selection does not send; generated preview requires explicit acceptance and releases viewer',async t=>{
 const f=fixture(t);await f.choose();assert.equal(f.calls,0);f.button('start').click();await until(()=>!f.button('apply').hidden);
 assert.equal(f.calls,1);assert.equal(f.previewCalls,1);assert.equal(f.adoptions,0);f.button('apply').click();await until(()=>f.adoptions===1&&f.cleanups===1);assert.ok(f.button('apply').hidden);
});
test('manual project changes disable adoption; discarding releases preview without changing project',async t=>{
 const f=fixture(t);await f.choose();f.button('start').click();await until(()=>!f.button('apply').hidden);f.change();assert.ok(f.button('apply').disabled);f.button('apply').click();assert.equal(f.adoptions,0);f.button('discard').click();assert.equal(f.cleanups,1);
});
test('vault lock aborts active generation and ignores late backend output',async t=>{
 let complete!:(value:{kind:'model';bytes:Uint8Array})=>void,signal:AbortSignal|undefined;
 const f=fixture(t,async request=>{signal=request.signal;return new Promise(resolve=>{complete=resolve;});});await f.choose();f.button('start').click();await until(()=>!!signal);lockProviderSession();assert.ok(signal!.aborted);complete({kind:'model',bytes});await new Promise(r=>setTimeout(r,10));assert.equal(f.previewCalls,0);assert.equal(f.adoptions,0);assert.ok(f.button('apply').hidden);
});
test('invalid image, service failure and invalid model do not expose an apply action',async t=>{
 const f=fixture(t,async()=>({kind:'model',bytes:new Uint8Array([1,2,3])}));f.panel.select(new File(['bad'],'bad.txt',{type:'text/plain'}));assert.ok(f.button('start').disabled);assert.equal(f.calls,0);
 await f.choose();f.button('start').click();await until(()=>f.host.textContent!.includes('fehlgeschlagen'));assert.ok(f.button('apply').hidden);assert.equal(f.previewCalls,0);assert.equal(f.adoptions,0);
});
test('provider configuration change discards preview; original source can be retried explicitly',async t=>{
 const f=fixture(t);await f.choose();f.button('start').click();await until(()=>!f.button('apply').hidden);f.w.dispatchEvent(new f.w.Event('pakachi-providers'));assert.equal(f.cleanups,1);assert.ok(f.button('apply').hidden);assert.equal(f.calls,1);assert.ok(!f.button('start').disabled);
});

test('locking while asynchronous import prepares invalidates its commit guard',async t=>{
 const f=fixture(t);let release!:()=>void;f.delayImport(()=>new Promise<void>(resolve=>{release=resolve;}));await f.choose();f.button('start').click();await until(()=>!f.button('apply').hidden);f.button('apply').click();await until(()=>!!release);lockProviderSession();release();await new Promise(r=>setTimeout(r,5));assert.equal(f.adoptions,0);assert.ok(f.button('apply').hidden);assert.equal(f.cleanups,1);
});

test('execution failure requires explicit next-provider click with its own credentials',async t=>{
 const seen:string[]=[];const f=fixture(t,async request=>{seen.push(request.profile.id);if(request.profile.id==='gen')throw Error('offline');return {kind:'model',bytes};},true);
 await f.choose();f.button('start').click();await until(()=>!f.button('retry').hidden&&!f.button('retry').disabled);
 assert.deepEqual(seen,['gen']);assert.equal(f.adoptions,0);f.button('retry').click();await until(()=>!f.button('apply').hidden);assert.deepEqual(seen,['gen','backup']);assert.ok(f.button('retry').hidden);
});
test('stale project disables retry and vault lock removes pending retry',async t=>{
 const f=fixture(t,async()=>{throw Error('offline');},true);await f.choose();f.button('start').click();await until(()=>!f.button('retry').hidden&&!f.button('retry').disabled);
 f.change();assert.ok(f.button('retry').disabled);f.button('retry').click();assert.equal(f.calls,1);lockProviderSession();assert.ok(f.button('retry').hidden);
});
class Reader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(b:Blob){void b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}}
test('local skeleton preparation preserves the generator original and imports only the explicit preview',async t=>{
 Object.assign(globalThis,{FileReader:Reader,ProgressEvent:class extends Event{}});const source=new Uint8Array(await writeFigureGLB(draftFigure()));
 const f=fixture(t,async()=>({kind:'model',bytes:source}));await f.choose();f.button('start').click();await until(()=>!f.button('apply').hidden);
 f.button('rig').click();assert.ok(f.button('apply').disabled);await until(()=>f.host.textContent!.includes('21 Gelenke'));assert.equal(f.calls,1);assert.equal(f.adoptions,0);assert.equal(f.previewCalls,2);
 assert.ok(f.host.textContent!.includes('2 Standflächen erkannt'));
 f.button('original').click();await until(()=>f.host.textContent!.includes('Unveränderte Generatorausgabe'));assert.equal(f.calls,1);assert.ok(f.button('original').hidden);
 (f.host.querySelector('#generation-rig-template') as HTMLSelectElement).value='quadruped';(f.host.querySelector('#generation-rig-alignment') as HTMLSelectElement).value='bounds';f.button('rig').click();await until(()=>f.host.textContent!.includes('23 Gelenke'));assert.ok(f.host.textContent!.includes('Vorlage nach Gesamtmaßen gewählt'));
 f.button('apply').click();await until(()=>f.adoptions===1);const model=await parseModel(Uint8Array.from(f.adopted!).buffer);let bones=0;model.scene.traverse(n=>{if(n.type==='Bone')bones++;});assert.equal(bones,23);disposeModel(model.scene);assert.equal(f.calls,1);
});
test('failed skeleton preparation retains the raw preview and its original import bytes',async t=>{
 const f=fixture(t);await f.choose();f.button('start').click();await until(()=>!f.button('apply').hidden);f.button('rig').click();await until(()=>f.host.textContent!.includes('Skelettentwurf nicht vorbereitet'));
 assert.equal(f.cleanups,0);assert.equal(f.previewCalls,1);assert.equal(f.button('apply').disabled,false);f.button('apply').click();await until(()=>f.adoptions===1);assert.deepEqual(f.adopted,bytes);
});
test('cancellation during local skeleton preparation ignores late output and never imports it',async t=>{
 let complete!:(r:Awaited<ReturnType<typeof prepareDraftRig>>)=>void,observed:AbortSignal|undefined;
 const f=fixture(t,undefined,false,async(_bytes,template,signal)=>{observed=signal;return new Promise(resolve=>{complete=r=>resolve({...r,report:{...r.report,template}});});});
 await f.choose();f.button('start').click();await until(()=>!f.button('apply').hidden);f.button('rig').click();await until(()=>!!observed);f.button('cancel').click();assert.ok(observed!.aborted);
 complete({bytes,report:{template:'biped',bones:21,meshes:1,vertices:3,method:'proportional-template',review:'required'}});await new Promise(r=>setTimeout(r,15));assert.equal(f.adoptions,0);assert.equal(f.previewCalls,1);assert.ok(f.button('apply').hidden);
});

test('generation stays locked until every image region is explicitly assigned and confirmed',async t=>{
 const f=fixture(t,undefined,false,undefined,false);await f.choose();await new Promise(r=>setTimeout(r,10));assert.ok(f.button('start').disabled);f.button('start').click();assert.equal(f.calls,0);assert.equal(f.adoptions,0);
});

test('accepted generation passes the confirmed image-reference hierarchy to the adoption bridge',async t=>{
 const f=fixture(t);await f.choose();f.button('start').click();await until(()=>!f.button('apply').hidden);f.button('apply').click();await until(()=>f.adoptions===1);
 assert.deepEqual(f.adoptedReference,referenceDocument);
});
