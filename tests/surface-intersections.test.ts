import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkSurfaceIntersections} from '../src/surface-intersections.ts';
const tri=(a:number[],b:number[],c:number[])=>[...a,...b,...c];
test('reports transverse non-neighboring triangle piercing without editing vertices',()=>{
 const vertices=[...tri([-1,-1,0],[1,-1,0],[0,1,0]),...tri([0,-.5,-1],[0,-.5,1],[0,.5,0])],before=[...vertices];
 const r=checkSurfaceIntersections(vertices);assert.equal(r.intersections,1);assert.equal(r.checked,true);assert.deepEqual(r.examples,[[0,1]]);assert.deepEqual(vertices,before);
});
test('separated faces are cleared and vertex-adjacent faces are excluded',()=>{
 const separate=[...tri([0,0,0],[1,0,0],[0,1,0]),...tri([0,0,2],[1,0,2],[0,1,2])];
 assert.deepEqual(checkSurfaceIntersections(separate).examples,[]);
 const connected=[...tri([0,0,0],[1,0,0],[0,1,0]),...tri([0,0,0],[0,0,1],[0,1,0])];
 assert.equal(checkSurfaceIntersections(connected).checked,true);
});
test('budget, malformed positions and coplanar candidates never silently pass',()=>{
 const crossing=[...tri([-1,-1,0],[1,-1,0],[0,1,0]),...tri([0,-.5,-1],[0,-.5,1],[0,.5,0])];
 const budget=checkSurfaceIntersections(crossing,null,0);assert.equal(budget.checked,false);assert.equal(budget.reason,'budget');
 assert.equal(checkSurfaceIntersections([NaN,0,0,1,0,0,0,1,0]).reason,'invalid');
 const coplanar=[...tri([0,0,0],[2,0,0],[0,2,0]),...tri([.2,.2,0],[1,.2,0],[.2,1,0])];
 assert.equal(checkSurfaceIntersections(coplanar).checked,false);
 assert.equal(checkSurfaceIntersections(coplanar).reason,'coplanar-or-touching');
 assert.throws(()=>checkSurfaceIntersections([0,0,0,1]));
});
