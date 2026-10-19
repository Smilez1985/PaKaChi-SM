export interface Move {
  id: string;
  name: string;
  clip: string;
  loop: boolean;
  needsReview?: boolean;
  reviewPoseIds?: string[];
}

export interface Avatar {
  id: string;
  name: string;
  description: string;
  model: string;
  project?: string;
  rigVersion: string;
  moves: Move[];
  defaultMove?: string;
  states?: Record<string, string>;
}

const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const safeId = (v: unknown): v is string => text(v) && /^[a-z0-9][a-z0-9_-]*$/.test(v);

export function parseCatalog(data: unknown): Avatar[] {
  if (!object(data) || data.schemaVersion !== 1 || !Array.isArray(data.avatars)) {
    throw new Error('Der Model Zoo hat ein unbekanntes Datenformat.');
  }
  const ids = new Set<string>();
  return data.avatars.map((raw): Avatar => {
    if (!object(raw) || !safeId(raw.id) || ids.has(raw.id) || !text(raw.name) ||
        !text(raw.description) || !text(raw.rigVersion) ||
        !((raw.project===undefined&&text(raw.model)&&/^model-zoo\/[a-z0-9_/-]+\.(gltf|glb)$/.test(raw.model)&&!raw.model.includes('..')) ||
          ((raw.model===undefined||raw.model==='')&&text(raw.project)&&/^model-zoo\/[a-z0-9_/-]+\.pakachi\.json$/.test(raw.project)&&!raw.project.includes('..'))) || !Array.isArray(raw.moves)) {
      throw new Error('Ein Avatar-Eintrag im Model Zoo ist ungültig.');
    }
    ids.add(raw.id);
    const moveIds = new Set<string>();
    const moves = raw.moves.map((m): Move => {
      if (!object(m) || !safeId(m.id) || moveIds.has(m.id) || !text(m.name) ||
          !text(m.clip) || typeof m.loop !== 'boolean') {
        throw new Error(`Ungültige oder doppelte Bewegung bei ${raw.name}.`);
      }
      moveIds.add(m.id);
      return { id: m.id, name: m.name, clip: m.clip, loop: m.loop };
    });
    if (raw.defaultMove !== undefined && (!text(raw.defaultMove) || !moveIds.has(raw.defaultMove))) {
      throw new Error(`Unbekannte Grundbewegung bei ${raw.name}.`);
    }
    const states: Record<string, string> = {};
    if (raw.states !== undefined) {
      if (!object(raw.states)) throw new Error('Ungültige Zustandszuordnung.');
      for (const [state, move] of Object.entries(raw.states)) {
        if (!['idle','talking','thinking','working','waiting','review','error','sleeping'].includes(state) || !text(move) || !moveIds.has(move)) throw new Error('Ungültige Zustandszuordnung.');
        states[state] = move;
      }
    }
    return { id: raw.id, name: raw.name, description: raw.description, model: raw.project ? '' : raw.model as string, ...(raw.project?{project:raw.project as string}:{}),
      rigVersion: raw.rigVersion, moves, defaultMove: raw.defaultMove as string | undefined, states };
  });
}

export function availableMoves(avatar: Avatar, clipNames: string[]): Move[] {
  const available = new Set(clipNames);
  return avatar.moves.filter(m => available.has(m.clip));
}

export function importedAvatar(filename: string, clipNames: string[]): Avatar {
  return {
    id: 'local-import', name: filename.replace(/\.glb$/i, '') || 'Eigener Avatar',
    description: 'Eigene GLB-Datei · nur für diese Sitzung geladen', model: '', rigVersion: 'imported',
    moves: clipNames.map((clip, i) => ({ id: `clip-${i + 1}`, name: clip || `Bewegung ${i + 1}`, clip, loop: false })),
  };
}

export interface AvatarChoice {id:string;name:string;selected:boolean;source:'original'|'builtin'|'saved'|'session'}
/** One list for the player and list_avatars; no geometry or stored capabilities are advertised. */
export function catalogChoices(builtins:Pick<Avatar,'id'|'name'>[],saved:{id:string;name:string}[],current:Pick<Avatar,'id'|'name'>|null,original:boolean):AvatarChoice[]{
 const selected=original?'pakachi-original':current?.id;
 const choices:AvatarChoice[]=[{id:'pakachi-original',name:'PaKaChi Original',selected:original,source:'original'},...builtins.map(a=>({id:a.id,name:a.name,selected:a.id===selected,source:'builtin' as const})),...saved.map(a=>({id:a.id,name:a.name,selected:a.id===selected,source:'saved' as const}))];
 if(new Set(choices.map(a=>a.id)).size!==choices.length)throw Error('duplicate-avatar-id');
 if(!original&&current&&!choices.some(a=>a.id===current.id))choices.push({id:current.id,name:current.name,selected:true,source:'session'});
 return choices;
}
