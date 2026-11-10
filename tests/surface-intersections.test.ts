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

test('measured intersection regression distinguishes a clean frame from a newly crossing frame',()=>{
 const fixed=tri([-1,-1,0],[1,-1,0],[0,1,0]);
 const safe=[...fixed,...tri([0,-.5,2],[0,-.5,3],[0,.5,2])];
 const crossing=[...fixed,...tri([0,-.5,-1],[0,-.5,1],[0,.5,0])];
 const before=checkSurfaceIntersections(safe),after=checkSurfaceIntersections(crossing);
 assert.equal(before.checked,true);assert.equal(before.intersections,0);
 assert.equal(after.checked,true);assert.equal(after.intersections,1);
 assert.ok(after.intersections>before.intersections);
});

test('spatial sweep checks more than 2048 triangles and finds crossings across distant batches',()=>{
 const base=tri([-1,-1,0],[1,-1,0],[0,1,0]),vertices=[...base];
 for(let i=0;i<2100;i++){const x=10*(i+1);vertices.push(...tri([x,0,0],[x+1,0,0],[x,1,0]));}
 vertices.push(...tri([0,-.5,-1],[0,-.5,1],[0,.5,0]));
 const before=[...vertices],report=checkSurfaceIntersections(vertices);
 assert.equal(report.triangles,2102);assert.equal(report.checked,true);
 assert.equal(report.intersections,1);assert.deepEqual(report.examples,[[0,2101]]);
 assert.ok(report.broadphasePairs<100);assert.deepEqual(vertices,before);
});
test('dense spatial broad-phase is bounded and reports incomplete coverage',()=>{
 const positions:number[]=[];
 for(let i=0;i<20;i++)positions.push(...tri([-1,-1,i*.001],[1,-1,i*.001],[0,1,i*.001]));
 const report=checkSurfaceIntersections(positions,null,1);
 assert.equal(report.checked,false);assert.equal(report.reason,'budget');
});
