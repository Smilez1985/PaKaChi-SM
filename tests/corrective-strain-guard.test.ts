import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {twistFixture} from './helpers/twist-fixture.ts';
import {buildGeometricCorrection} from '../src/geometric-skin-correction.ts';
import {limitCorrectiveStrain} from '../src/corrective-strain-guard.ts';
import {correctionSamples,noMeasuredRegression} from '../src/pose-weight-correction.ts';
import {createPoseSurfaceChecker} from '../src/pose-surface-check.ts';
const budget=()=>({used:0,limit:1000000,exhausted:false});
function fixture(){const f=twistFixture(false,true);f.pose.values[f.joint.id].rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2).toArray();return f;}
test('a valid sparse corrective survives the cached strain guard and retains its measured volume improvement',async()=>{
 const f=fixture(),shape=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!,source=JSON.stringify(f.rig.data),copy=structuredClone(shape),work=budget();
 try{const poses=[...correctionSamples(f.rig,f.pose,8),f.pose],guarded=await limitCorrectiveStrain(f.rig,shape,poses,new AbortController().signal,work);assert.ok(guarded);assert.ok(work.used>0);assert.deepEqual(shape,copy);assert.equal(JSON.stringify(f.rig.data),source);const inspect=createPoseSurfaceChecker(f.rig);for(const pose of poses)assert.equal(noMeasuredRegression(inspect(pose),inspect(pose,undefined,guarded)),true);assert.equal(inspect(f.pose,undefined,guarded).volumeIssues,0);}finally{f.rig.dispose();}
});
test('a new local strain spike is removed or refused while the original proposal stays untouched',async()=>{
 const f=fixture(),shape=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;shape.meshes[0].deltas[0]+=.7;const copy=structuredClone(shape);
 try{const poses=[...correctionSamples(f.rig,f.pose,8),f.pose],guarded=await limitCorrectiveStrain(f.rig,shape,poses,new AbortController().signal,budget());assert.deepEqual(shape,copy);if(guarded){const inspect=createPoseSurfaceChecker(f.rig);for(const pose of poses)assert.equal(noMeasuredRegression(inspect(pose),inspect(pose,undefined,guarded)),true);assert.notDeepEqual(guarded,shape);}}finally{f.rig.dispose();}
});
test('budget exhaustion, cancellation and stale revisions cannot publish partial guarded shapes',async()=>{
 const f=fixture(),shape=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!,copy=structuredClone(shape),poses=[f.pose];
 try{const work={used:0,limit:1,exhausted:false};assert.equal(await limitCorrectiveStrain(f.rig,shape,poses,new AbortController().signal,work),null);assert.equal(work.exhausted,true);const c=new AbortController(),pending=limitCorrectiveStrain(f.rig,shape,poses,c.signal,budget());c.abort();await assert.rejects(pending);let valid=true;const stale=limitCorrectiveStrain(f.rig,shape,poses,new AbortController().signal,budget(),()=>valid);valid=false;await assert.rejects(stale,/geändert/);assert.deepEqual(shape,copy);await assert.rejects(limitCorrectiveStrain(f.rig,shape,Array(9).fill(f.pose),new AbortController().signal,budget()),/Gegenprüfung/);}finally{f.rig.dispose();}
});
test('the sparse cache refuses a proposal that renormalizes an existing pose driver',async()=>{
 const f=fixture(),original=buildGeometricCorrection(f.rig,f.pose,f.joint,2)!;
 try{f.rig.addCorrective(original);const shape=structuredClone(original);shape.id='second';assert.equal(await limitCorrectiveStrain(f.rig,shape,[f.pose],new AbortController().signal,budget()),null);}finally{f.rig.dispose();}
});
