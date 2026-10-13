export const STATES = ['idle', 'talking', 'thinking', 'working', 'waiting', 'review', 'error', 'sleeping'] as const;
export type State = typeof STATES[number];
export type Command = { state: State; avatar?: string } | { move: string; avatar?: string };
export interface Capability { id: string; name: string; states: string[]; moves: { id: string; name: string; loop: boolean }[] }
export interface Adapter {
  capability: Capability;
  setState: (state: string) => void;
  playMove: (move: string) => void;
}
export function parseCommand(input: unknown): Command {
  let value = input;
  if (typeof value === 'string') {
    if (value.length > 2048) throw new Error('Befehl zu groß.');
    const s = value.trim();
    value = s.startsWith('{') ? JSON.parse(s) : { state: s };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ungültiger Befehl.');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !['state', 'status', 'move', 'avatar'].includes(k))) throw new Error('Unbekannte Befehlsfelder.');
  if (['state', 'status', 'move'].filter(k => v[k] !== undefined).length !== 1) throw new Error('Genau einen Zustand oder Move angeben.');
  if (v.avatar !== undefined && (typeof v.avatar !== 'string' || !v.avatar || v.avatar.length > 100)) throw new Error('Ungültiger Avatar.');
  const avatar = v.avatar as string | undefined;
  if (v.move !== undefined) {
    if (typeof v.move !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,99}$/.test(v.move)) throw new Error('Ungültiger Move.');
    return { move: v.move, avatar };
  }
  const state = v.state ?? v.status;
  if (typeof state !== 'string' || !(STATES as readonly string[]).includes(state)) throw new Error('Unbekannter Zustand.');
  return { state: state as State, avatar };
}

export class StateMachine {
  private adapter: Adapter | null = null;
  state: string | null = null;
  private readonly changed: () => void;
  constructor(changed: () => void = () => {}) { this.changed = changed; }
  bind(adapter: Adapter, initial: string | null = null): void {
    this.adapter = adapter; this.state = initial; this.changed();
  }
  unbind(): void { this.adapter = null; this.state = null; this.changed(); }
  get capability(): Capability | null { return this.adapter ? structuredClone(this.adapter.capability) : null; }
  observe(state: string): void {
    if (this.adapter?.capability.states.includes(state) && state !== this.state) { this.state = state; this.changed(); }
  }
  execute(input: unknown) {
    const command = parseCommand(input);
    const adapter = this.adapter;
    if (!adapter) throw new Error('Kein Avatar bereit.');
    if (command.avatar && command.avatar !== adapter.capability.id) throw new Error('Bitte diesen Avatar zuerst im Player auswählen.');
    if ('state' in command) {
      if (!adapter.capability.states.includes(command.state)) throw new Error('Dieser Avatar unterstützt den Zustand nicht.');
      if (command.state !== this.state) { adapter.setState(command.state); this.state = command.state; }
    } else {
      if (!adapter.capability.moves.some(m => m.id === command.move)) throw new Error('Dieser Avatar unterstützt den Move nicht.');
      adapter.playMove(command.move);
    }
    this.changed();
    return { avatar: adapter.capability.id, state: this.state, accepted: true };
  }
}
