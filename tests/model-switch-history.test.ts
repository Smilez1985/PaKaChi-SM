import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ModelSwitchHistory} from '../src/model-switch-history.ts';

test('whole-model undo and redo retain edits made after a switch and isolate stored snapshots',async()=>{
 const history=new ModelSwitchHistory<{name:string;points:number[]}>(v=>JSON.stringify(v).length);
 const original={name:'A',points:[1,2]};const commit=history.checkpoint(original);original.points.push(9);assert.equal(history.canUndo,false);commit();
 let model={name:'B',points:[3,4]};assert.equal(await history.travel('undo',model,async(value,valid)=>{assert.ok(valid());model=value;return true;}),true);assert.deepEqual(model,{name:'A',points:[1,2]});assert.ok(history.canRedo);
 model.points.push(5);await history.travel('redo',model,async(value)=>{model=value;return true;});assert.deepEqual(model,{name:'B',points:[3,4]});
 await history.travel('undo',model,async(value)=>{model=value;return true;});assert.deepEqual(model,{name:'A',points:[1,2,5]});
});
test('failed and rejected restores retain the previous history entry for retry',async()=>{
 const history=new ModelSwitchHistory<string>(v=>v.length);history.checkpoint('A')();
 assert.equal(await history.travel('undo','B',async()=>false),false);assert.ok(history.canUndo);assert.equal(history.canRedo,false);
 await assert.rejects(()=>history.travel('undo','B',async()=>{throw new Error('invalid model');}));assert.ok(history.canUndo);
 let restored='';await history.travel('undo','B',async v=>{restored=v;return true;});assert.equal(restored,'A');
});
test('overlapping or obsolete restores cannot overwrite a newer model checkpoint',async()=>{
 const history=new ModelSwitchHistory<string>(v=>v.length);history.checkpoint('A')();let release!:()=>void;
 const pending=history.travel('undo','B',async(_value,valid)=>{await new Promise<void>(r=>{release=r;});return valid();});
 assert.equal(await history.travel('undo','B',async()=>assert.fail('second restore')),false);
 history.checkpoint('C')();release();assert.equal(await pending,false);let restored='';await history.travel('undo','D',async v=>{restored=v;return true;});assert.equal(restored,'C');
});
test('one-step history replaces older switches, enforces budget before mutation and clears explicitly',async()=>{
 const history=new ModelSwitchHistory<string>(v=>v.length,3);history.checkpoint('A')();history.checkpoint('B')();assert.throws(()=>history.checkpoint('large'),/size/);
 await assert.rejects(()=>history.travel('undo','large',async()=>assert.fail('over-budget current')),/size/);let restored='';await history.travel('undo','C',async v=>{restored=v;return true;});assert.equal(restored,'B');history.clear();assert.equal(history.canRedo,false);assert.equal(history.canUndo,false);
});
