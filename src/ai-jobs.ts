import {parseProviderConfig,providerRoute,ProviderRegistry,ProviderUnavailable} from './ai-providers.ts';
import type {ProviderConfig,ProviderProfile,ProviderRole} from './ai-providers.ts';
import type {JobInput,JobOutput,JobProgress} from './ai-job-types.ts';

export interface ProjectRevision {session:string;revision:number}
export type JobStatus='checking'|'queued'|'running'|'validating'|'preview'|'accepted'|'discarded'|'stale'|'failed'|'cancelled'|'timed-out';
export interface JobSnapshot {
  id:string;role:ProviderRole;profile:Readonly<ProviderProfile>;target:ProjectRevision;
  status:JobStatus;progress:number|null;error?:string;executionStarted:boolean;
  // Aborting our wait never proves that a remote, potentially billable job stopped.
  remoteStop:'not-requested'|'unconfirmed';
}
export interface JobOptions {
  config:ProviderConfig;role:ProviderRole;input:JobInput;target:ProjectRevision;
  timeoutMs?:number;
  preflightFallbacks?:boolean;probeTimeoutMs?:number;mayRun?:()=>boolean;
  // Mandatory format-specific validation (e.g. production GLB loader). No automatic acceptance.
  validate:(output:JobOutput,signal:AbortSignal)=>Promise<void>;
}
const MAX_MODEL=50*1024*1024,MAX_IMAGE=20*1024*1024;
const active=(status:JobStatus)=>['checking','queued','running','validating'].includes(status);
function validTarget(value:ProjectRevision):boolean {
  return typeof value.session==='string'&&value.session.length>0&&value.session.length<=100&&Number.isSafeInteger(value.revision)&&value.revision>=0;
}
function copyInput(input:JobInput):JobInput {
  if(typeof input.prompt!=='string'||!input.prompt.trim()||input.prompt.length>16000)throw new Error('invalid-prompt');
  if(input.source){
    const {mediaType,bytes}=input.source;
    if(!['image/png','image/jpeg','model/gltf-binary'].includes(mediaType)||!(bytes instanceof Uint8Array)||!bytes.length||bytes.byteLength>(mediaType==='model/gltf-binary'?MAX_MODEL:MAX_IMAGE))throw new Error('invalid-source');
  }
  return structuredClone(input);
}
function copyOutput(output:JobOutput,role:ProviderRole):JobOutput {
  if(role==='assistant'){
    if(output?.kind!=='text'||typeof output.text!=='string'||!output.text.trim()||output.text.length>1024*1024)throw new Error('invalid-result');
    return {kind:'text',text:output.text};
  }
  if(output?.kind!=='model'||!(output.bytes instanceof Uint8Array)||!output.bytes.length||output.bytes.byteLength>MAX_MODEL)throw new Error('invalid-result');
  return {kind:'model',bytes:output.bytes.slice()};
}

/** At most one execution; optional fallbacks apply only to capability checks. */
export class ProviderJob {
  readonly done:Promise<JobSnapshot>;
  private state:JobSnapshot;
  private output?:JobOutput;
  private controller=new AbortController();
  private timer?:ReturnType<typeof setTimeout>;
  private listeners=new Set<(state:JobSnapshot)=>void>();
  private complete!:(state:JobSnapshot)=>void;
  private started=false;
  private remotePending=false;
  private config:ProviderConfig;
  private input:JobInput;
  private timeoutMs:number;
  private validate:JobOptions['validate'];
  private registry:ProviderRegistry;
  private preflightFallbacks:boolean;
  private probeTimeoutMs:number;
  private mayRun:()=>boolean;

  constructor(registry:ProviderRegistry,options:JobOptions){
    this.registry=registry;this.config=parseProviderConfig(options.config);
    const profile=this.config.profiles.find(p=>p.id===this.config.assignments[options.role]);
    if(!profile)throw new ProviderUnavailable('unassigned');
    if(!validTarget(options.target))throw new Error('invalid-project-revision');
    this.timeoutMs=options.timeoutMs??120000;
    if(!Number.isSafeInteger(this.timeoutMs)||this.timeoutMs<1||this.timeoutMs>3600000)throw new Error('invalid-timeout');
    if(typeof options.validate!=='function')throw new Error('validator-required');
    this.preflightFallbacks=options.preflightFallbacks??false;
    this.probeTimeoutMs=options.probeTimeoutMs??10000;
    if(!Number.isSafeInteger(this.probeTimeoutMs)||this.probeTimeoutMs<1||this.probeTimeoutMs>120000)throw new Error('invalid-probe-timeout');
    this.mayRun=options.mayRun??(()=>true);
    this.validate=options.validate;this.input=copyInput(options.input);
    this.state={id:crypto.randomUUID(),role:options.role,profile:{...profile},target:{...options.target},status:'checking',progress:null,executionStarted:false,remoteStop:'not-requested'};
    this.done=new Promise(resolve=>{this.complete=resolve;});
  }
  get snapshot():JobSnapshot{return structuredClone(this.state);}
  subscribe(listener:(state:JobSnapshot)=>void):()=>void {this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
  private notify(){for(const listener of this.listeners){try{listener(this.snapshot);}catch{/* Observers cannot change job lifecycle. */}}}
  private finish(status:JobStatus,error?:string){
    clearTimeout(this.timer);this.state.status=status;
    if(error)this.state.error=error;else delete this.state.error;
    if(status!=='preview')this.output=undefined;
    // Settle before notifying: observers may synchronously accept/discard a preview.
    this.complete(this.snapshot);this.notify();
  }
  start():this {
    if(this.started||!active(this.state.status))throw new Error('job-already-started-or-closed');
    this.started=true;this.timer=setTimeout(()=>this.stop('timed-out'),this.timeoutMs);
    void this.execute();return this;
  }
  cancel():void {this.stop('cancelled');}
  private stop(status:'cancelled'|'timed-out'){
    if(!active(this.state.status))return;
    this.state.remoteStop=this.remotePending?'unconfirmed':'not-requested';
    // Mark terminal before aborting: adapters may synchronously report progress on abort.
    this.finish(status);this.controller.abort();
  }
  private report(value:JobProgress){
    if(!['queued','running'].includes(this.state.status)||!['queued','running'].includes(value.phase))return;
    // A late queued message must not move an already-running job backwards.
    if(this.state.status==='running'&&value.phase==='queued')return;
    this.state.status=value.phase;
    if(value.percent!==undefined&&Number.isFinite(value.percent))this.state.progress=Math.max(this.state.progress??0,Math.min(100,Math.max(0,value.percent)));
    this.notify();
  }
  private async resolve(){
    const route=providerRoute(this.config,this.state.role);
    let last:unknown;
    for(const profile of this.preflightFallbacks?route:route.slice(0,1)){
      this.controller.signal.throwIfAborted();
      this.state.profile={...profile};this.notify();
      this.controller.signal.throwIfAborted();
      const config=parseProviderConfig(this.config);config.assignments[this.state.role]=profile.id;
      if(config.fallbacks)config.fallbacks[this.state.role]=[];
      const controller=new AbortController();
      let timer:ReturnType<typeof setTimeout>|undefined,abort:()=>void=()=>{};
      try{
        return await Promise.race([
          new Promise<never>((_,reject)=>{
            abort=()=>{controller.abort();reject(new Error('probe-aborted'));};
            this.controller.signal.addEventListener('abort',abort,{once:true});
            timer=setTimeout(()=>{controller.abort();reject(new Error('probe-timeout'));},this.probeTimeoutMs);
          }),
          this.registry.resolveJob(config,this.state.role,controller.signal),
        ]);
      }catch(error){last=error;this.controller.signal.throwIfAborted();}
      finally{clearTimeout(timer);this.controller.signal.removeEventListener('abort',abort);}
    }
    throw last;
  }
  private async execute(){
    try{
      const {profile,run}=await this.resolve();
      if(!active(this.state.status))return;
      this.state.status='queued';this.notify();
      if(!active(this.state.status))return;
      if(!this.mayRun()){this.finish('stale');return;}
      this.state.executionStarted=true;this.remotePending=true;
      const output=await run({id:this.state.id,role:this.state.role,profile,input:this.input,signal:this.controller.signal,progress:value=>this.report(value)});
      if(!active(this.state.status))return;
      this.remotePending=false;
      const result=copyOutput(output,this.state.role);
      this.state.status='validating';this.notify();
      if(!active(this.state.status))return;
      await this.validate(structuredClone(result),this.controller.signal);
      if(!active(this.state.status))return;
      this.output=result;this.state.progress=100;this.finish('preview');
    }catch(error){
      if(!active(this.state.status))return;
      // Do not display raw service errors, which may contain credentials or response bodies.
      this.finish('failed',error instanceof ProviderUnavailable?error.reason:this.state.status==='validating'?'validation-failed':'provider-failed');
    }
  }
  preview():JobOutput {
    if(this.state.status!=='preview'||!this.output)throw new Error('no-preview');
    return structuredClone(this.output);
  }
  discard():void {
    if(!['preview','stale'].includes(this.state.status))throw new Error('no-preview');
    this.finish('discarded');
  }
  /** The consumer must compare and commit synchronously and atomically, including its Undo entry.
   * Returning false means no changes were made (revision conflict). Async commits are unsupported.
   */
  accept(current:()=>ProjectRevision,commit:(output:JobOutput,expected:ProjectRevision)=>boolean):boolean {
    if(this.state.status!=='preview'||!this.output)throw new Error('no-preview');
    const result=structuredClone(this.output);
    // Prevent reentrant acceptance through consumer callbacks.
    this.state.status='accepted';
    let accepted:boolean;
    try{
      const now=current();
      accepted=now.session===this.state.target.session&&now.revision===this.state.target.revision ? commit(result,{...this.state.target}) : false;
      if(typeof accepted!=='boolean')throw new Error('synchronous-commit-required');
    }
    catch(error){this.state.status='preview';throw error;}
    this.finish(accepted?'accepted':'stale');return accepted;
  }
}
