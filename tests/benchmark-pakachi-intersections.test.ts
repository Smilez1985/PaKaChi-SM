import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('real-form collision benchmark remains read-only and discloses incomplete geometry coverage',async()=>{
 const source=await readFile(new URL('../scripts/benchmark-pakachi-intersections.mjs',import.meta.url),'utf8');
 assert.match(source,/pakachi-rigged/);assert.match(source,/humanoid.*animal/);assert.match(source,/LeftHip.*LeftKnee/);
 assert.match(source,/checkedMeshes/);assert.match(source,/unmeasurableMeshes/);assert.match(source,/maxTrianglesPerMesh/);
 assert.match(source,/proposeStableDegenerateFaceRemoval/);
 assert.match(source,/repairPreview/);
 assert.match(source,/withheldExamples/);
 assert.doesNotMatch(source,/writeFile|unlink|rename|\.apply\(/);
});
