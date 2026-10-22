/** Elapsed animation time, independent of render rate; reset when visibility changes. */
export class AnimationClock {
 private previous:number;
 constructor(now:number){this.previous=now;}
 reset(now:number){if(Number.isFinite(now))this.previous=now;}
 tick(now:number):number {
  if(!Number.isFinite(now)||now<this.previous)return 0;
  const delta=(now-this.previous)/1000;this.previous=now;return delta;
 }
}
