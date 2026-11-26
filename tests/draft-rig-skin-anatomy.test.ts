import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFigureGLB} from '../src/figure-glb.ts';
import {prepareDraftRig} from '../src/draft-rig.ts';
import {createPaKaChiSemanticCatalog} from '../src/cluster-2d-classifier.ts';
import {createDraftRigSkinAnatomyPreparation} from '../src/draft-rig-skin-anatomy.ts';
import {draftFigure} from './helpers/draft-rig-fixture.ts';
class Reader{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}}
Object.assign(globalThis,{FileReader:Reader,ProgressEvent:class extends Event{}});
const signal=()=>new AbortController().signal;
const base64=(bytes:Uint8Array)=>{let value='';for(let i=0;i<bytes.length;i+=0x8000)value+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(value);};

test('real draft rig lifecycle carries source mesh IDs into skin-weight anatomy proposals without mutating source bytes',async()=>{
 const bytes=new Uint8Array(await writeFigureGLB(draftFigure(true))),original=bytes.slice();
 const preparation=await createDraftRigSkinAnatomyPreparation(base64(bytes),'animal','quadruped',createPaKaChiSemanticCatalog());
 const prepared=await prepareDraftRig(bytes,'quadruped',signal(),'support',[],preparation.hooks);
 const output=preparation.getReport();
 assert.deepEqual(bytes,original);
 assert.ok(output);
 assert.equal(output.sourceManifest.form,'animal');
 assert.equal(output.report.candidateManifest.algorithmId,'skin-weight-anatomy');
 assert.equal(output.report.candidateManifest.meshes.length,output.sourceManifest.meshes.length);
 assert.equal(output.report.classified+output.report.ambiguous+output.report.unmapped,output.sourceManifest.assignments.length);
 assert.ok(output.report.candidateManifest.assignments.every(item=>item.origin==='automatic'||item.origin==='imported'));
 assert.equal(prepared.report.bones,23);
 assert.equal(output.report.candidateManifest.parts.find(part=>part.id==='forelimbs')!.rigBoneIds.includes('left_shoulder'),true);
 assert.equal(output.report.candidateManifest.parts.find(part=>part.id==='hindlimbs')!.rigBoneIds.includes('right_hip'),true);
});
