import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {compareSequenceProposal,renderSequenceComparison} from '../src/sequence-proposal.ts';
import type {StudioCommand} from '../src/studio-command.ts';
const command:StudioCommand={session:'s',expectedRevision:4,action:'update_moves',updates:[{id:'wave',poses:['b','a','b']},{id:'nod',poses:['a','b']}]};
const info={session:'s',revision:4,open:true};
const moves=[{id:'wave',name:'Wave',poses:['a','b']},{id:'nod',name:'Nod',poses:['b','a']}],poses=[{id:'a',name:'Neutral'},{id:'b',name:'Raised'}];
function rpc(method:string,args?:Record<string,unknown>){assert.equal(method,'get_studio');if(!args)return info;const items=(args.section==='moves'?moves:poses).slice(args.offset as number,(args.offset as number)+1);return {...info,items,total:2,nextOffset:args.offset===0?1:null};}
test('comparison reads paginated names and sequences without editing and preserves repeated occurrences',()=>{
 const before=JSON.stringify({command,moves,poses});const rows=compareSequenceProposal(command,rpc)!;
 assert.deepEqual(rows[0],{id:'wave',name:'Wave',before:[{id:'a',name:'Neutral'},{id:'b',name:'Raised'}],after:[{id:'b',name:'Raised'},{id:'a',name:'Neutral'},{id:'b',name:'Raised'}]});assert.equal(rows.length,2);assert.equal(JSON.stringify({command,moves,poses}),before);
 assert.equal(compareSequenceProposal({...command,action:'save_pose'},()=>{throw Error('unexpected read');}),null);
 assert.equal(compareSequenceProposal({session:'s',expectedRevision:4,action:'update_move',id:'wave',poses:['b','a']},rpc)!.length,1);
});
test('stale pages or a change after the final page prevent a comparison',()=>{
 for(const failAt of [1,2,3,4,5]){let calls=0;assert.throws(()=>compareSequenceProposal(command,(method,args)=>({...rpc(method,args),revision:++calls===failAt?5:4})),/stale-studio/);}
 assert.throws(()=>compareSequenceProposal(command,(method,args)=>({...rpc(method,args),open:false})),/stale-studio/);
});
test('missing targets, unknown poses and invalid pagination are rejected',()=>{
 assert.throws(()=>compareSequenceProposal({...command,updates:[{id:'missing',poses:['a','b']}]},rpc),/missing-move/);
 assert.throws(()=>compareSequenceProposal({...command,updates:[{id:'wave',poses:['a','missing']}]},rpc),/missing-pose/);
 for(const patch of [{nextOffset:0},{items:[],nextOffset:1},{total:101},{total:0},{nextOffset:null}])assert.throws(()=>compareSequenceProposal(command,(method,args)=>({...rpc(method,args),...patch})),/invalid-snapshot/);
});
test('localized comparison renders project names as text and represents inserted and removed steps',()=>{
 const w=new Window();Object.assign(globalThis,{document:w.document});
 for(const language of ['de','en'] as const){const host=document.createElement('div'),rows=compareSequenceProposal(command,rpc)!;rows[0].name='<img src=x>';rows[0].after[0].name='<script>alert(1)</script>';rows[1].before.push({id:'a',name:'Neutral'});renderSequenceComparison(host,rows,language);assert.equal(host.querySelectorAll('table').length,2);assert.equal(host.querySelector('img,script'),null);assert.ok(host.textContent!.includes('<img src=x>'));assert.ok(host.textContent!.includes('—'));assert.ok(host.textContent!.includes(language==='de'?'Vorher':'Before'));assert.equal(host.querySelectorAll('tbody tr').length,6);}
 w.happyDOM.abort();
});
