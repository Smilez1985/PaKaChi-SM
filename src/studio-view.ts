import * as T from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
type NavigationControls = {enabled:boolean; target:T.Vector3};
import type { StudioRig } from './studio-rig.ts';

export class StudioView {
  readonly group=new T.Group();
  private readonly handles=new T.Group();
  private readonly lines=new T.Group();
  private readonly proxy=new T.Object3D();
  private readonly gizmo:TransformControls;
  private readonly ray=new T.Raycaster();
  private enabled=false;
  private selected:string|null=null;
  private action:'select'|'add'|'connect'='select';
  private rotation=false;
  private dragging=false;
  onSelect:(id:string)=>void=()=>{};
  onAdd:(position:T.Vector3,mesh?:number)=>void=()=>{};
  onConnect:(id:string)=>void=()=>{};
  onStart:()=>void=()=>{};
  onMove:(position:T.Vector3,rotation:T.Quaternion)=>void=()=>{};
  onEnd:()=>void=()=>{};
  private rig:StudioRig;
  private camera:T.PerspectiveCamera;
  private canvas:HTMLCanvasElement;
  private orbit:NavigationControls;
  constructor(rig:StudioRig,camera:T.PerspectiveCamera,canvas:HTMLCanvasElement,orbit:NavigationControls,scene:T.Scene) {
    this.rig=rig;this.camera=camera;this.canvas=canvas;this.orbit=orbit;
    this.group.add(this.handles,this.lines,this.proxy);scene.add(this.group);
    this.gizmo=new TransformControls(camera,canvas);this.gizmo.setSpace('world');this.gizmo.setSize(.75);this.group.add(this.gizmo.getHelper());
    this.gizmo.addEventListener('mouseDown',()=>{this.dragging=true;orbit.enabled=false;this.onStart();});
    this.gizmo.addEventListener('objectChange',()=>{if(this.dragging)this.onMove(this.proxy.position.clone(),this.proxy.quaternion.clone());});
    this.gizmo.addEventListener('mouseUp',()=>{this.dragging=false;orbit.enabled=true;this.onEnd();});
    canvas.addEventListener('pointerdown',this.down,true);canvas.addEventListener('pointerup',this.up,true);
    this.setEnabled(false);
  }
  setEnabled(value:boolean) {this.enabled=value;this.canvas.style.cursor=value&&this.action==='add'?'crosshair':'';this.group.visible=value;this.gizmo.enabled=value;this.orbit.enabled=true;if(!value){this.gizmo.detach();this.dragging=false;}else this.refresh();}
  setAction(value:'select'|'add'|'connect'){this.action=value;if(value!=='select')this.gizmo.detach();else this.refresh();this.canvas.style.cursor=value==='add'?'crosshair':'';}
  setRotation(value:boolean){this.rotation=value;this.gizmo.setMode(value?'rotate':'translate');}
  select(id:string|null){this.selected=id;this.refresh();}
  private start:{x:number;y:number}|null=null;
  private down=(event:PointerEvent)=>{if(this.enabled && event.button===0)this.start={x:event.clientX,y:event.clientY};};
  private up=(event:PointerEvent)=>{
    const start=this.start;this.start=null;if(!start||!this.enabled||event.button!==0||Math.hypot(event.clientX-start.x,event.clientY-start.y)>4||this.dragging||this.gizmo.axis)return;
    const rect=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),this.camera);
    // Minimum 10 px pick radius keeps tiny face points usable without enlarging their display.
    const click=new T.Vector2(event.clientX,event.clientY);
    const hits=this.rig.data.points.map(p=>{const world=this.rig.position(p),v=world.clone().project(this.camera);const pixel=new T.Vector2(rect.left+(v.x+1)*rect.width/2,rect.top+(1-v.y)*rect.height/2);const radius=Math.max(10,p.size*rect.height/(2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*world.distanceTo(this.camera.position)));return {id:p.id,d:pixel.distanceTo(click),radius,z:v.z};}).filter(x=>x.z>=-1&&x.z<=1&&x.d<=x.radius).sort((a,b)=>a.d-b.d);
    if(this.action==='add') {
      const meshes=this.rig.surfaces.map(s=>s.mesh);const hit=this.ray.intersectObjects(meshes,false)[0];
      if(hit){this.onAdd(hit.point,meshes.indexOf(hit.object as T.Mesh));return;}
      const normal=this.camera.getWorldDirection(new T.Vector3()),plane=new T.Plane().setFromNormalAndCoplanarPoint(normal,this.orbit.target);
      const position=this.ray.ray.intersectPlane(plane,new T.Vector3());if(position)this.onAdd(position);return;
    }
    if(hits[0]){if(this.action==='connect')this.onConnect(hits[0].id);else this.onSelect(hits[0].id);}
  };
  refresh() {
    this.clearGroup(this.handles);this.clearGroup(this.lines);
    for(const p of this.rig.data.points){const mesh=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshBasicMaterial({color:p.id===this.selected?0xffa82e:p.kind==='bone'?0x257fb4:0x17a878,depthTest:false,transparent:true,opacity:.9}));mesh.position.copy(this.rig.position(p));mesh.scale.setScalar(p.size);mesh.renderOrder=20;this.handles.add(mesh);}
    for(const [a,b] of this.rig.data.links){const p=this.rig.data.points.find(p=>p.id===a),q=this.rig.data.points.find(p=>p.id===b);if(!p||!q)continue;const line=new T.Line(new T.BufferGeometry().setFromPoints([this.rig.position(p),this.rig.position(q)]),new T.LineBasicMaterial({color:0x388a77,depthTest:false}));line.renderOrder=19;this.lines.add(line);}
    const point=this.rig.data.points.find(p=>p.id===this.selected);
    if(this.enabled && point && this.action==='select') {this.proxy.position.copy(this.rig.position(point));this.proxy.quaternion.copy(this.rig.rotation(point));this.gizmo.setMode(this.rotation && point.kind==='bone'?'rotate':'translate');this.gizmo.attach(this.proxy);}else this.gizmo.detach();
  }
  private clearGroup(group:T.Group){for(const child of [...group.children]){group.remove(child);if(child instanceof T.Mesh||child instanceof T.Line){child.geometry.dispose();(child.material as T.Material).dispose();}}}
  dispose(){this.canvas.removeEventListener('pointerdown',this.down,true);this.canvas.removeEventListener('pointerup',this.up,true);this.canvas.style.cursor='';this.orbit.enabled=true;this.gizmo.dispose();this.clearGroup(this.handles);this.clearGroup(this.lines);this.group.removeFromParent();}
}
