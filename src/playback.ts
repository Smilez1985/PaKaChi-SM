import { AnimationMixer, LoopOnce, LoopRepeat } from 'three';
import type { AnimationAction, AnimationClip, Object3D } from 'three';
import type { Move } from './catalog.ts';

/** Local clip playback. External states, queues and MCP/MQTT belong to milestone 2. */
export class Playback {
  readonly mixer: AnimationMixer;
  current: Move | null = null;
  paused = false;
  speed = 1;
  private action: AnimationAction | null = null;
  private readonly clips: Map<string, AnimationClip>;
  private readonly moves: Map<string, Move>;
  private readonly root: Object3D;
  private readonly defaultId?: string;
  private readonly onChange: () => void;
  private onFinished = () => {
    if (this.defaultId && this.current?.id !== this.defaultId) this.play(this.defaultId);
    else { this.paused = true; this.onChange(); }
  };

  constructor(root: Object3D, clips: AnimationClip[], moves: Move[], defaultId?: string,
    onChange: () => void = () => {}) {
    this.onChange = onChange;
    this.root = root;
    this.mixer = new AnimationMixer(root);
    this.clips = new Map(clips.map(c => [c.name, c]));
    this.moves = new Map(moves.map(m => [m.id, m]));
    this.defaultId = defaultId && this.moves.has(defaultId) ? defaultId : undefined;
    this.mixer.addEventListener('finished', this.onFinished);
  }

  play(id: string): boolean {
    const move = this.moves.get(id);
    const clip = move && this.clips.get(move.clip);
    if (!move || !clip) return false;
    // Stop previous actions so replay, seeking and switches are deterministic.
    this.mixer.stopAllAction();
    this.action = this.mixer.clipAction(clip).reset();
    this.action.setLoop(move.loop ? LoopRepeat : LoopOnce, move.loop ? Infinity : 1);
    this.action.clampWhenFinished = true;
    this.action.play();
    this.current = move;
    this.paused = false;
    this.mixer.update(0);
    this.onChange();
    return true;
  }

  togglePause(): void {
    if (!this.action) return;
    if (this.action.paused && !this.current?.loop && this.progress >= 0.999) {
      this.play(this.current!.id);
      return;
    }
    this.paused = !this.paused;
    this.onChange();
  }

  seek(ratio: number): void {
    if (!this.action || !Number.isFinite(ratio)) return;
    this.action.time = Math.max(0, Math.min(1, ratio)) * this.duration;
    this.action.paused = false;
    this.mixer.update(0);
  }

  setSpeed(value: number): void {
    if (Number.isFinite(value)) this.speed = Math.max(0.25, Math.min(2, value));
  }

  update(delta: number): void {
    if (!this.paused && Number.isFinite(delta) && delta >= 0) this.mixer.update(delta * this.speed);
  }

  get duration(): number { return this.action?.getClip().duration ?? 0; }
  get progress(): number { return this.duration ? (this.action?.time ?? 0) / this.duration : 0; }

  dispose(): void {
    this.mixer.removeEventListener('finished', this.onFinished);
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.action = null;
    this.current = null;
  }
}
