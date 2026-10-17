import type {GLTF} from 'three/addons/loaders/GLTFLoader.js';
import type {Avatar,Move} from './catalog.ts';
import type {StudioProject,StudioData} from './studio-data.ts';
import {StudioRig} from './studio-rig.ts';
import {StudioEditor} from './studio-editor.ts';
import {Playback} from './playback.ts';
import {Viewer,disposeModel} from './viewer.ts';
import {disposeAll} from './avatar-installation.ts';

type CandidateViewer=Pick<Viewer,'show'|'createStudioView'|'setStudio'|'showSkeleton'|'dispose'|'onFrame'>;
interface CandidateOptions {
 model:GLTF;avatar:Avatar;moves:Move[];source:Omit<StudioProject,'studio'>;data?:StudioData;
 studio:boolean;speed:number;dirty:boolean;skeleton:boolean;
 resume:()=>void;changed:()=>void;feedback:(text:string)=>void;playbackChanged:()=>void;
}
/** Owns the supplied model, including on preparation failure. Nothing is mounted yet. */
export function prepareAvatar(options:CandidateOptions,makeViewer:(host:HTMLElement)=>CandidateViewer=host=>new Viewer(host)){
 const stage=document.createElement('div');stage.className='avatar-stage';
 const editorHost=document.createElement('div');
 let viewer:CandidateViewer|undefined,editor:StudioEditor|undefined,playback:Playback|undefined,view:ReturnType<CandidateViewer['createStudioView']>|undefined;
 let live=false,disposed=false;
 const cleanup=()=>{
  if(disposed)return;disposed=true;live=false;
  const modelAttached=!!options.model.scene.parent;
  const errors=disposeAll([()=>editor?editor.dispose():view?.dispose(),()=>playback?.dispose(),()=>viewer?.dispose(),()=>{if(!modelAttached)disposeModel(options.model.scene);}]);
  stage.remove();editorHost.remove();if(errors.length)throw new AggregateError(errors,'avatar-cleanup-failed');
 };
 try{
  viewer=makeViewer(stage);viewer.show(options.model.scene);viewer.setStudio(options.studio);
  const rig=new StudioRig(options.model.scene,options.data);
  playback=new Playback(options.model.scene,options.model.animations,options.moves,options.avatar.defaultMove,()=>{if(live)options.playbackChanged();});
  playback.setSpeed(options.speed);
  view=viewer.createStudioView(rig);
  editor=new StudioEditor(rig,view,editorHost,options.source,{
   suspend:()=>playback!.suspend(),resume:()=>{if(live)options.resume();else{const id=options.avatar.defaultMove;if(id)playback!.setBaseMove(id);}},
   changed:()=>{if(live)options.changed();},feedback:text=>{if(live)options.feedback(text);},
  });
  rig.restoreSource();
  const idle=options.avatar.states?.idle;
  const initial=idle&&options.moves.some(m=>m.id===idle)?idle:options.avatar.defaultMove;
  if(initial)playback.play(initial);
  if(options.studio)editor.enter();
  editor.restoreDirty(options.dirty);viewer.showSkeleton(options.studio&&options.skeleton);
  return {stage,editorHost,viewer,editor,playback,initialState:idle&&initial===idle?'idle':null,activate(){live=true;},dispose:cleanup};
 }catch(error){const failures=disposeAll([cleanup]);if(failures.length)throw new AggregateError([error,...failures],'avatar-prepare-cleanup-failed');throw error;}
}
