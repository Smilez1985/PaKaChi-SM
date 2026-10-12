import './style.css';
import { availableMoves, importedAvatar, parseCatalog } from './catalog.ts';
import type { Avatar, Move } from './catalog.ts';
import { Playback } from './playback.ts';
import { disposeModel, parseModel, Viewer } from './viewer.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <aside class="rail">
    <a class="brand" href="./" aria-label="PaKaChi-SM Startseite"><span class="brand-mark">P<span>•</span></span><span>PaKaChi<span class="brand-sub">STATE MASCHINE</span></span></a>
    <p class="rail-label">DEIN AVATAR, IN BEWEGUNG</p>
    <nav aria-label="Anwendungsbereiche">
      <button id="player-tab" class="nav-button active" aria-pressed="true"><span>◉</span> Player</button>
      <button id="studio-tab" class="nav-button" aria-pressed="false"><span>◇</span> Avatar-Studio <small>Aufbau</small></button>
    </nav>
    <div class="rail-bottom"><span class="online-dot"></span> Lokal auf deinem Gerät<p>Entwicklungsstand 0.1.0<br>Player & Model Zoo</p></div>
  </aside>
  <main>
    <header><div><p class="eyebrow">PAKACHI-SM / <span id="section-label">PLAYER</span></p><h1 id="page-title">Dein Model Zoo<span>.</span></h1><p id="page-intro">Eine Figur auswählen. Eine Bewegung starten. Leben einhauchen.</p></div><button id="import-button" class="button outline">＋ GLB laden</button><input id="file-input" type="file" accept=".glb" hidden></header>
    <div class="notice identity-note"><span>✦</span><p><strong>Dein PaKaChi bleibt PaKaChi.</strong> Beide Formen und alle 72 Transformationsbilder sind im Originalplayer erhalten. Mika und Nori sind ausschließlich technische Testavatare.</p></div>
    <div id="message" role="status" aria-live="polite">Model Zoo wird geladen …</div>
    <div class="workspace">
      <section class="stage-panel" aria-label="Avatar-Vorschau">
        <div class="stage-top"><span class="pill" id="model-type">3D · TESTAVATAR</span><button id="reset-camera" class="text-button">Ansicht zurücksetzen ↺</button></div>
        <div id="viewport"></div><iframe id="legacy-frame" class="legacy-frame" title="PaKaChi Originalplayer mit Tierform und Arbeitsform"></iframe>
        <div class="stage-caption"><div><h2 id="avatar-name">Wird geladen …</h2><p id="avatar-description"></p></div><span class="live-badge" id="activity">Bereit</span></div>
        <p class="camera-help">Links ziehen: drehen <span>·</span> Rechts ziehen: verschieben <span>·</span> Mausrad: zoomen</p>
      </section>
      <aside class="control-panel">
        <div class="panel-heading"><span class="eyebrow">MODEL ZOO</span><span id="avatar-count" class="count">0</span></div>
        <label for="avatar-select">Avatar auswählen</label><select id="avatar-select" disabled></select>
        <div id="avatar-cards" class="avatar-cards"></div>
        <div class="divider"></div>
        <div id="legacy-controls" hidden><h2>PaKaChi · Original</h2><p class="legacy-notice">Dein bestehender Avatar mit beiden Formen, 72 Transformationsbildern und optionalem MQTT. Die originale Darstellung und Steuerung bleiben erhalten.</p><p class="legacy-notice">Wähle links „Arbeiten“ oder „Normaler Chat“. Die Endform bleibt bis zum nächsten Signal stehen.</p><p class="legacy-notice">Der Bildstand ist ein Entwurf mit bekannten Proportions- und Materialschwankungen. Die 3D-Übertragung dieses Designs steht noch aus.</p></div><div id="player-controls">
          <div class="panel-heading"><h2>Bewegungen</h2><span id="move-count" class="count">0</span></div>
          <p class="subtle">Was dieser Avatar schon kann.</p>
          <div id="moves" class="moves"></div>
          <div class="playback"><button id="pause" class="button primary" disabled>Pause</button><label for="speed">Tempo<select id="speed"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label></div>
          <label class="timeline-label" for="timeline"><span>Abspielposition</span><output id="time">0,0 / 0,0 s</output></label><input id="timeline" type="range" min="0" max="1000" value="0" disabled>
          <details class="legend"><summary>Schlagworte & Fähigkeiten</summary><ul id="capabilities"></ul></details>
        </div>
        <div id="studio-controls" hidden>
          <h2>Avatar-Studio</h2><p class="subtle">Dein Editor, direkt im Player.</p>
          <label class="check"><input type="checkbox" id="skeleton"> Skelett anzeigen</label>
          <div class="studio-next"><span class="eyebrow">NÄCHSTE AUSBAUSTUFEN</span><h3>Aus Posen werden Moves.</h3><p>„Figur bewegen“ und „Gelenke bearbeiten“ folgen in den nächsten Meilensteinen.</p><p>Bild-zu-3D, KI-Korrektur, Neu/Laden/Speichern von Studio-Projekten und Modellqualität sind noch nicht implementiert.</p></div>
          <button id="back-player" class="button outline">Zurück zum Player</button>
        </div>
        <p class="local-note">GLB-Import bleibt lokal im Browser und gilt für diese Sitzung. Es werden keine Modelle hochgeladen.</p>
      </aside>
    </div>
    <footer><span>PAKACHI · PANDA-KI-CHIMERA</span><span>MCP & gemeinsame 3D-Zustandssteuerung folgen.</span></footer>
  </main>`;

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
let viewer: Viewer | undefined;
let original = false;
let playback: Playback | null = null;
let catalog: Avatar[] = [];
let loaded: Avatar | null = null;
let studio = false;
let request = 0;
let fetchController: AbortController | null = null;
let busy = false;

function message(text: string, error = false): void {
  el('message').textContent = text;
  el('message').classList.toggle('error', error);
}

function changeView(edit: boolean): void {
  studio = edit;
  el('player-controls').hidden = edit || original;
  el('studio-controls').hidden = !edit || original;
  el('legacy-controls').hidden = !original;
  for (const [id, active] of [['player-tab', !edit], ['studio-tab', edit]] as const) {
    el(id).classList.toggle('active', active);
    el(id).setAttribute('aria-pressed', String(active));
  }
  el('page-title').textContent = edit ? 'Dein Avatar-Studio.' : 'Dein Model Zoo.';
  el('section-label').textContent = edit ? 'AVATAR-STUDIO' : 'PLAYER';
  el('page-intro').textContent = edit ? 'Ein gemeinsamer Ort für deine Figuren und ihre Bewegungen.' : 'Eine Figur auswählen. Eine Bewegung starten. Leben einhauchen.';
  viewer?.showSkeleton(edit && el<HTMLInputElement>('skeleton').checked);
}

function syncPlayback(): void {
  el<HTMLButtonElement>('pause').disabled = busy || !playback?.current;
  el<HTMLInputElement>('timeline').disabled = busy || !playback?.current;
  el('pause').textContent = playback?.paused ? '▶ Weiter' : 'Ⅱ Pause';
  el('activity').textContent = playback?.current ? `${playback.paused ? 'Pausiert' : '●'} · ${playback.current.name}` : 'Standbild';
  el('moves').querySelectorAll<HTMLButtonElement>('button').forEach(button => {
    const active = button.dataset.move === playback?.current?.id;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
    button.disabled = busy;
  });
}

function renderCatalog(): void {
  const select = el<HTMLSelectElement>('avatar-select');
  select.replaceChildren();
  select.add(new Option('PaKaChi · Original (2D)', 'pakachi-original'));
  el('avatar-cards').replaceChildren();
  const originalCard = document.createElement('button'); originalCard.className = `avatar-card original-card ${original ? 'selected' : ''}`;
  originalCard.textContent = '✦ PaKaChi · beide Formen'; originalCard.setAttribute('aria-pressed', String(original));
  originalCard.onclick = showOriginal; el('avatar-cards').append(originalCard);
  catalog.forEach(avatar => {
    select.add(new Option(avatar.name, avatar.id));
    const button = document.createElement('button');
    button.className = `avatar-card ${avatar.id === loaded?.id ? 'selected' : ''}`;
    button.setAttribute('aria-label', `${avatar.name} auswählen`);
    button.setAttribute('aria-pressed', String(avatar.id === loaded?.id));
    const initial = document.createElement('span'); initial.className = `avatar-initial ${avatar.id}`; initial.textContent = avatar.name[0];
    const title = document.createElement('strong'); title.textContent = avatar.name;
    const type = document.createElement('small'); type.textContent = '3D-Testavatar';
    button.append(initial, title, type);
    button.onclick = () => void loadAvatar(avatar);
    el('avatar-cards').append(button);
  });
  if (loaded?.id === 'local-import') select.add(new Option(`${loaded.name} · Import`, loaded.id));
  if (original) select.value = 'pakachi-original'; else if (loaded) select.value = loaded.id;
  select.disabled = false;
  el('avatar-count').textContent = String(1 + catalog.length + (loaded?.id === 'local-import' ? 1 : 0));
}

function renderMoves(moves: Move[]): void {
  el('moves').replaceChildren(); el('capabilities').replaceChildren();
  el('move-count').textContent = String(moves.length);
  moves.forEach(move => {
    const button = document.createElement('button'); button.className = 'move-button'; button.dataset.move = move.id;
    const title = document.createElement('span'); title.textContent = move.name;
    const icon = document.createElement('span'); icon.textContent = move.loop ? '↻' : '↗'; icon.setAttribute('aria-hidden', 'true');
    button.append(title, icon); button.onclick = () => { playback?.play(move.id); syncPlayback(); };
    el('moves').append(button);
    const li = document.createElement('li'); const code = document.createElement('code'); code.textContent = move.id;
    li.append(code, ` · ${move.loop ? 'Schleife' : 'einmalig'}`); el('capabilities').append(li);
  });
  if (!moves.length) el('moves').textContent = 'Dieses Modell enthält keine abspielbaren Bewegungen.';
}

function showOriginal(): void {
  request++; fetchController?.abort(); busy = false;
  playback?.dispose(); playback = null; viewer?.clear(); loaded = null;
  original = true;
  el('legacy-frame').parentElement!.classList.add('legacy');
  const frame = el<HTMLIFrameElement>('legacy-frame');
  if (!frame.getAttribute('src')) frame.src = `${import.meta.env.BASE_URL}legacy/pakachi/index.html`;
  renderCatalog(); changeView(studio);
  message('PaKaChi · Originalstand wiederhergestellt · 72 Bilder · Tierform ↔ Arbeitsform');
}

async function loadAvatar(avatar?: Avatar, file?: File): Promise<void> {
  const token = ++request;
  fetchController?.abort();
  fetchController = new AbortController();
  busy = true; syncPlayback();
  message(`${file?.name ?? avatar?.name ?? 'Avatar'} wird geladen …`);
  try {
    if (!viewer) throw new Error('3D benötigt WebGL2/Hardwarebeschleunigung. Der Originalplayer bleibt verfügbar.');
    let buffer: ArrayBuffer;
    if (file) {
      if (!/\.glb$/i.test(file.name)) throw new Error('Bitte eine eigenständige .glb-Datei auswählen.');
      if (file.size > 50 * 1024 * 1024) throw new Error('Die GLB-Datei ist größer als 50 MB. Bitte einen kleineren Export verwenden.');
      buffer = await file.arrayBuffer();
    } else {
      if (!avatar) throw new Error('Kein Avatar ausgewählt.');
      const response = await fetch(`${import.meta.env.BASE_URL}${avatar.model}`, { signal: fetchController.signal });
      if (!response.ok) throw new Error(`Modelldatei konnte nicht geladen werden (${response.status}).`);
      buffer = await response.arrayBuffer();
    }
    const gltf = await parseModel(buffer);
    if (token !== request) { disposeModel(gltf.scene); return; }
    const next = file ? importedAvatar(file.name, gltf.animations.map(c => c.name)) : avatar!;
    const moves = availableMoves(next, gltf.animations.map(c => c.name));
    // Validate visible geometry before replacing a working avatar.
    const hasMesh = gltf.scene.getObjectsByProperty('isMesh', true).length > 0;
    if (!hasMesh) { disposeModel(gltf.scene); throw new Error('Das Modell enthält keine sichtbare Geometrie.'); }
    playback?.dispose(); playback = null;
    viewer.show(gltf.scene);
    loaded = next; original = false;
    el('legacy-frame').parentElement!.classList.remove('legacy');
    el<HTMLIFrameElement>('legacy-frame').removeAttribute('src');
    changeView(studio);
    playback = new Playback(gltf.scene, gltf.animations, moves, next.defaultMove, syncPlayback);
    playback.setSpeed(Number(el<HTMLSelectElement>('speed').value));
    renderMoves(moves); renderCatalog();
    el('avatar-name').textContent = next.name;
    el('avatar-description').textContent = next.description;
    el('model-type').textContent = file ? '3D · EIGENER IMPORT' : '3D · TESTAVATAR';
    viewer?.showSkeleton(studio && el<HTMLInputElement>('skeleton').checked);
    if (next.defaultMove && moves.some(m => m.id === next.defaultMove)) playback.play(next.defaultMove);
    const missing = next.moves.length - moves.length;
    message(missing ? `${missing} deklarierte Bewegung(en) fehlen in der Modelldatei und werden nicht angeboten.` : `${next.name} bereit · ${moves.length} Bewegungen · ${(buffer.byteLength / 1024 / 1024).toFixed(2).replace('.', ',')} MB`);
  } catch (error) {
    if (token !== request) return;
    message(`Laden fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`, true);
    renderCatalog();
  } finally {
    if (token === request) { busy = false; syncPlayback(); }
  }
}

async function boot(): Promise<void> {
  try { viewer = new Viewer(el('viewport')); }
  catch { message('3D ist ohne WebGL2 nicht verfügbar. Der Originalplayer kann verwendet werden.', true); }
  if (viewer) viewer.onFrame = delta => {
    playback?.update(delta);
    const duration = playback?.duration ?? 0;
    const progress = playback?.progress ?? 0;
    if (document.activeElement !== el('timeline')) el<HTMLInputElement>('timeline').value = String(progress * 1000);
    el('time').textContent = `${(duration * progress).toFixed(1).replace('.', ',')} / ${duration.toFixed(1).replace('.', ',')} s`;
  };
  el('player-tab').onclick = () => changeView(false);
  el('studio-tab').onclick = () => changeView(true);
  el('back-player').onclick = () => changeView(false);
  el('reset-camera').onclick = () => viewer?.resetCamera();
  el('skeleton').onchange = () => viewer?.showSkeleton(el<HTMLInputElement>('skeleton').checked);
  el('pause').onclick = () => playback?.togglePause();
  el('speed').onchange = () => playback?.setSpeed(Number(el<HTMLSelectElement>('speed').value));
  el('timeline').oninput = () => playback?.seek(Number(el<HTMLInputElement>('timeline').value) / 1000);
  el('avatar-select').onchange = () => {
    if (el<HTMLSelectElement>('avatar-select').value === 'pakachi-original') { showOriginal(); return; }
    const avatar = catalog.find(a => a.id === el<HTMLSelectElement>('avatar-select').value);
    if (avatar) void loadAvatar(avatar);
  };
  el('import-button').onclick = () => el<HTMLInputElement>('file-input').click();
  el('file-input').onchange = () => {
    const file = el<HTMLInputElement>('file-input').files?.[0];
    if (file) void loadAvatar(undefined, file);
    el<HTMLInputElement>('file-input').value = '';
  };
  let dragDepth = 0;
  document.addEventListener('dragover', event => event.preventDefault());
  document.addEventListener('dragenter', event => { event.preventDefault(); dragDepth++; document.body.classList.add('dragging'); });
  document.addEventListener('dragleave', () => { if (--dragDepth <= 0) document.body.classList.remove('dragging'); });
  document.addEventListener('drop', event => {
    event.preventDefault(); dragDepth = 0; document.body.classList.remove('dragging');
    const file = event.dataTransfer?.files[0]; if (file) void loadAvatar(undefined, file);
  });
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}model-zoo/catalog.json`);
    if (!response.ok) throw new Error(`Katalog nicht erreichbar (${response.status}).`);
    catalog = parseCatalog(await response.json()); renderCatalog();
    showOriginal();
  } catch (error) { message(`Model Zoo: ${error instanceof Error ? error.message : String(error)}`, true); }
  window.addEventListener('pagehide', () => { fetchController?.abort(); request++; playback?.dispose(); viewer?.dispose(); }, { once: true });
}
void boot();
