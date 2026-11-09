import * as T from 'three';
/** Synthetic A-pose; independent body/limb geometry, not a generated character. */
export function draftFigure(){
 const root=new T.Group();root.name='Synthetic draft';
 const box=(name:string,size:[number,number,number],position:[number,number,number])=>{const mesh=new T.Mesh(new T.BoxGeometry(...size,2,4,2),new T.MeshStandardMaterial({color:0x55aa66,roughness:.8}));mesh.name=name;mesh.position.fromArray(position);root.add(mesh);return mesh;};
 box('Body',[.28,.34,.20],[0,.60,0]);box('Head',[.25,.22,.25],[0,.89,0]);
 for(const sign of [-1,1]){
  box(sign===1?'LeftUpperArm':'RightUpperArm',[.13,.23,.12],[sign*.24,.64,0]);box(sign===1?'LeftHand':'RightHand',[.14,.22,.12],[sign*.43,.40,0]);
  box(sign===1?'LeftLeg':'RightLeg',[.13,.39,.14],[sign*.13,.27,0]);box(sign===1?'LeftFoot':'RightFoot',[.15,.09,.27],[sign*.13,.045,.04]);
 }
 return root;
}
