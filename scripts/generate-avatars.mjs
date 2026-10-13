import { mkdir, writeFile } from 'node:fs/promises';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// GLTFExporter uses browser FileReader; these two methods cover our texture-free fixtures.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => {
    this.result = `data:application/octet-stream;base64,${Buffer.from(value).toString('base64')}`;
    this.onloadend?.();
  }); }
};

function avatar(robot = false) {
  const bones = [];
  function bone(name, parent, xyz) {
    const b = new T.Bone(); b.name = name; b.position.fromArray(xyz);
    if (parent) parent.add(b);
    bones.push(b); return b;
  }
  const root = bone('Root', null, [0, 0.82, 0]);
  const head = bone('Head', root, [0, 0.86, 0]);
  const left = bone('LeftShoulder', root, [0.46, 0.47, 0]);
  const right = bone('RightShoulder', root, [-0.46, 0.47, 0]);
  const leftElbow = bone('LeftElbow', left, [0.13, -0.34, 0]);
  const rightElbow = bone('RightElbow', right, [-0.13, -0.34, 0]);
  const leftLeg = bone('LeftHip', root, [0.24, -0.30, 0]);
  const rightLeg = bone('RightHip', root, [-0.24, -0.30, 0]);
  root.updateMatrixWorld(true);
  const light = new T.MeshStandardMaterial({ color: robot ? 0xe7b85d : 0xf1eee3, roughness: 0.52, metalness: robot ? 0.35 : 0.02 });
  const dark = new T.MeshStandardMaterial({ color: 0x223b3c, roughness: 0.57 });
  const mint = new T.MeshStandardMaterial({ color: 0x70d6be, emissive: 0x286450, emissiveIntensity: 0.45, roughness: 0.35 });
  const parts = [], materials = [];
  function shape(b, offset, scale, material, box = false) {
    const g = box ? new T.BoxGeometry(1, 1, 1, 1, 1, 1) : new T.SphereGeometry(1, 20, 14);
    g.scale(...scale); g.translate(...offset); g.applyMatrix4(b.matrixWorld);
    const count = g.getAttribute('position').count;
    const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { indices[i * 4] = bones.indexOf(b); weights[i * 4] = 1; }
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4));
    g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    parts.push(g); materials.push(material);
  }
  shape(root, [0, 0.18, 0], [0.5, 0.58, 0.34], light);
  shape(root, [0, 0.22, 0.31], [0.13, 0.13, 0.04], mint);
  shape(head, [0, 0.12, 0], robot ? [0.95, 0.74, 0.64] : [0.58, 0.49, 0.43], light, robot);
  for (const side of [-1, 1]) {
    shape(head, [side * 0.44, 0.47, 0], [0.18, 0.19, 0.14], dark);
    shape(head, [side * 0.22, 0.16, 0.36], [0.14, 0.18, 0.075], dark);
    shape(head, [side * 0.22, 0.18, 0.425], [0.052, 0.075, 0.03], mint);
    shape(head, [side * 0.235, 0.21, 0.447], [0.016, 0.024, 0.012], light);
  }
  shape(head, [0, -0.03, 0.43], [0.075, 0.045, 0.035], dark);
  shape(head, [0, -0.13, 0.409], [0.07, 0.017, 0.022], dark);
  shape(left, [0.06, -0.15, 0], [0.16, 0.25, 0.17], dark);
  shape(right, [-0.06, -0.15, 0], [0.16, 0.25, 0.17], dark);
  shape(leftElbow, [0.02, -0.12, 0], [0.16, 0.22, 0.17], robot ? light : dark);
  shape(rightElbow, [-0.02, -0.12, 0], [0.16, 0.22, 0.17], robot ? light : dark);
  shape(leftLeg, [0, -0.20, 0.07], [0.21, 0.30, 0.26], dark);
  shape(rightLeg, [0, -0.20, 0.07], [0.21, 0.30, 0.26], dark);
  const mesh = new T.SkinnedMesh(mergeGeometries(parts, true), materials);
  mesh.name = robot ? 'Nori' : 'Mika';
  mesh.add(root); mesh.bind(new T.Skeleton(bones));
  parts.forEach(g => g.dispose());
  function rotation(name, times, angles, axis = 'z') {
    const vector = axis === 'x' ? new T.Vector3(1, 0, 0) : axis === 'y' ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1);
    return new T.QuaternionKeyframeTrack(`${name}.quaternion`, times,
      angles.flatMap(a => new T.Quaternion().setFromAxisAngle(vector, a).toArray()));
  }
  const idle = new T.AnimationClip('idle', 4, [
    rotation('Head', [0, 1, 2, 3, 4], [0, 0.045, 0, -0.045, 0]),
    new T.VectorKeyframeTrack('Root.position', [0, 2, 4], [0, .82, 0, 0, .85, 0, 0, .82, 0]),
  ]);
  const wave = new T.AnimationClip('winken', 2.8, [
    rotation('LeftShoulder', [0, .6, 2.2, 2.8], [0, 2.2, 2.2, 0]),
    rotation('LeftElbow', [0, .6, .9, 1.2, 1.5, 1.8, 2.2, 2.8], [0, .3, -.25, .3, -.25, .3, .2, 0]),
    rotation('Head', [0, .6, 2.2, 2.8], [0, -.12, -.12, 0]),
  ]);
  const nod = new T.AnimationClip('nicken', 1.8, [rotation('Head', [0, .3, .6, .9, 1.2, 1.8], [0, .22, -.08, .22, -.08, 0], 'x')]);
  const look = new T.AnimationClip('umschauen', 4, [rotation('Head', [0, 1, 2, 3, 4], [0, -.45, 0, .45, 0], 'y')]);
  const thinking = new T.AnimationClip('thinking', 3, [rotation('Head', [0,1.5,3], [-.13,.03,-.13])]);
  const talking = new T.AnimationClip('talking', 1.2, [rotation('Head', [0,.3,.6,.9,1.2], [0,.1,0,-.05,0], 'x')]);
  const working = new T.AnimationClip('working', 1.6, [rotation('LeftShoulder', [0,.8,1.6], [.4,.6,.4]), rotation('RightShoulder', [0,.8,1.6], [-.6,-.4,-.6])]);
  return { mesh, clips: [...(robot ? [idle, nod, look] : [idle, wave, nod]), thinking, talking, working] };
}

const catalog = { schemaVersion: 1, avatars: [] };
for (const [id, name, description, robot] of [
  ['mika', 'Mika', 'Ein kleiner Panda. Drei Bewegungen, ein guter Anfang.', false],
  ['nori', 'Nori', 'Ein neugieriger Roboter mit eigenem Bewegungsrepertoire.', true],
]) {
  const { mesh, clips } = avatar(robot);
  const gltf = await new GLTFExporter().parseAsync(mesh, { animations: clips, binary: false, onlyVisible: true });
  const dir = new URL(`../public/model-zoo/${id}/`, import.meta.url);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('model.gltf', dir), JSON.stringify(gltf));
  const labels = { idle: 'Entspannen', winken: 'Winken', nicken: 'Nicken', umschauen: 'Umschauen', thinking: 'Denken', talking: 'Sprechen', working: 'Arbeiten' };
  catalog.avatars.push({ id, name, description, model: `model-zoo/${id}/model.gltf`, rigVersion: 'fixture-rig-1',
    defaultMove: 'idle', states: {idle:'idle', thinking:'thinking', talking:'talking', working:'working'}, moves: clips.map(c => ({ id: c.name, clip: c.name, name: labels[c.name], loop: ['idle','thinking','talking','working'].includes(c.name) })) });
}
await writeFile(new URL('../public/model-zoo/catalog.json', import.meta.url), JSON.stringify(catalog, null, 2) + '\n');
console.log('Two self-contained, skinned glTF fixtures generated.');
