import { PlayerMQTT } from './mqtt-agent.ts';
type Rpc = (method: string, args?: Record<string, unknown>) => unknown;
declare global {
  interface Window {
    PaKaChiSM: { call: Rpc };
  }
}
export function mountAgentPanel(rpc: Rpc) {
  const panel = document.createElement('section'); panel.className = 'agent-panel';
  panel.innerHTML = `<div class="state-row"><label for="agent-state">Zustand</label><select id="agent-state" disabled></select><span id="state-readout" role="status">Kein Avatar bereit</span></div>
<details><summary>Agent verbinden · MQTT / MCP</summary>
<div class="agent-columns"><fieldset><legend>MQTT</legend><label class="check"><input id="mqtt-active" type="checkbox"> MQTT-Empfang einschalten</label><label class="check"><input id="mqtt-rpc-active" type="checkbox"> Python-MCP über diesen Broker erlauben</label><label>Broker-Adresse<input id="mqtt-url" value="ws://127.0.0.1:8083/mqtt"></label><label>Topic<input id="mqtt-topic" value="pakachi/status"></label><label>Benutzername<input id="mqtt-user" value="pakachi" autocomplete="off"></label><label>Passwort<input id="mqtt-password" type="password" autocomplete="off"></label><p id="mqtt-feedback" role="status">Aus · keine Verbindung</p></fieldset>
<fieldset><legend>MCP · bisherige Node-Brücke</legend><label class="check"><input id="mcp-active" type="checkbox"> MCP-Kopplung einschalten</label><label>Lokale Brücke<input id="mcp-url" value="ws://127.0.0.1:8765"></label><label>Kopplungsschlüssel<input id="mcp-token" type="password" autocomplete="off"></label><p id="mcp-feedback" role="status">Aus · keine Verbindung</p><p>Für den neuen Python-Server links MQTT und Python-MCP einschalten. Diese direkte Verbindung bleibt für den bisherigen Node-Server verfügbar. Denselben Schlüssel hier eintragen. Einrichtung: docs/ANSTEUERUNG.md</p></fieldset></div><p>Beide Verbindungen starten ausgeschaltet. Änderungen an Verbindungsdaten durch Aus- und Einschalten übernehmen. Zugangsdaten werden nicht gespeichert.</p></details><p id="command-feedback" role="status"></p>`;
  document.querySelector('.identity-note')!.after(panel);
  const input = (id: string) => panel.querySelector<HTMLInputElement>(`#${id}`)!;
  const feedback = (id: string, value: string) => { panel.querySelector(`#${id}`)!.textContent = value; };
  const run = (method: string, args: Record<string, unknown>) => {
    try { const result = rpc(method,args); feedback('command-feedback','Befehl übernommen.'); return result; }
    catch (error) { feedback('command-feedback', String(error instanceof Error ? error.message : error)); throw error; }
  };
  const state = panel.querySelector<HTMLSelectElement>('#agent-state')!;
  state.onchange = () => { try { run('set_state',{state:state.value}); } catch { refresh(); } };
  const mqtt = new PlayerMQTT(rpc,status=>feedback('mqtt-feedback',status),error=>feedback('mqtt-feedback',error));
  input('mqtt-active').onchange = () => {
    if (!input('mqtt-active').checked) { mqtt.disconnect(); return; }
    try { mqtt.connect({url:input('mqtt-url').value, topic:input('mqtt-topic').value, username:input('mqtt-user').value, password:input('mqtt-password').value,rpcEnabled:input('mqtt-rpc-active').checked}); }
    catch (error) { mqtt.disconnect(); input('mqtt-active').checked = false; feedback('mqtt-feedback', String(error)); }
  };
  input('mqtt-rpc-active').onchange = () => {if(input('mqtt-active').checked)input('mqtt-active').dispatchEvent(new Event('change'));};
  let socket: WebSocket | null = null;
  let handshake: ReturnType<typeof setTimeout> | undefined;
  function disconnect() { clearTimeout(handshake); const old = socket; socket = null; old?.close(); }
  input('mcp-active').onchange = () => {
    disconnect();
    if (!input('mcp-active').checked) { feedback('mcp-feedback','Aus · keine Verbindung'); return; }
    try {
      const url = new URL(input('mcp-url').value);
      if (url.protocol !== 'ws:' || !['127.0.0.1','localhost'].includes(url.hostname) || url.username || url.password || url.search || url.hash) throw new Error('MCP-Brücke muss eine lokale ws://-Adresse sein.');
      const token = input('mcp-token').value;
      if (token.length < 32 || token.length > 256) throw new Error('Kopplungsschlüssel benötigt 32–256 Zeichen.');
      const ws = new WebSocket(url); socket = ws;
      let ready = false;
      feedback('mcp-feedback','Verbindung wird hergestellt …');
      handshake = setTimeout(() => { if(socket===ws) { disconnect(); input('mcp-active').checked=false; feedback('mcp-feedback','Kopplung: Zeitüberschreitung.'); } },6000);
      ws.onopen = () => { if(socket===ws) ws.send(JSON.stringify({type:'hello',token})); };
      ws.onmessage = event => {
        if (socket !== ws || typeof event.data !== 'string' || event.data.length > 65536) return;
        let data; try { data = JSON.parse(event.data); } catch { return; }
        if (data?.type === 'ready') { ready=true; clearTimeout(handshake); feedback('mcp-feedback','Gekoppelt · Agent kann steuern'); return; }
        if (!ready || data?.type !== 'request' || typeof data.id !== 'string') return;
        try { ws.send(JSON.stringify({type:'result', id:data.id, result:rpc(data.method,data.args)})); }
        catch(error) { ws.send(JSON.stringify({type:'result', id:data.id, error:error instanceof Error ? error.message : String(error)})); }
      };
      ws.onerror = () => { if(socket===ws) feedback('mcp-feedback','MCP-Brücke nicht erreichbar.'); };
      ws.onclose = () => { if(socket===ws) { clearTimeout(handshake); socket=null; input('mcp-active').checked=false; feedback('mcp-feedback','Getrennt · bei Bedarf erneut einschalten'); } };
    } catch(error) { input('mcp-active').checked=false; feedback('mcp-feedback',String(error)); }
  };
  function refresh() {
    const current = rpc('get_state') as { state: string | null; ready: boolean; capability: { states: string[] } | null };
    state.replaceChildren(...(current.capability?.states ?? []).map(s => new Option(s,s)));
    state.disabled = !current.ready || !state.options.length; if(current.state) state.value=current.state;
    feedback('state-readout',current.state ?? 'Kein aktiver Zustand');
  }
  window.addEventListener('pakachi-sm:change',refresh); refresh();
  return { connectLocal(connection:{url:string;token:string}) {input('mcp-url').value=connection.url;input('mcp-token').value=connection.token;input('mcp-active').checked=true;input('mcp-active').dispatchEvent(new Event('change'));}, dispose() { mqtt.disconnect(); disconnect(); window.removeEventListener('pakachi-sm:change',refresh); } };
}
