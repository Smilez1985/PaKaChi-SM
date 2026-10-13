import { WebSocketServer } from 'ws';
import { timingSafeEqual, randomUUID } from 'node:crypto';

export function createBridge({ token, port = 8765, timeout = 5000 }) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 256) throw new Error('PAKACHI_TOKEN muss 32–256 Zeichen haben.');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Ungültiger Port.');
  let player = null;
  const pending = new Map();
  const failPending = () => { for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('Player getrennt.')); } pending.clear(); };
  const server = new WebSocketServer({ host: '127.0.0.1', port, maxPayload: 65536,
    verifyClient: ({ origin }) => {
      try { const u = new URL(origin); return ['http:','https:'].includes(u.protocol) && ['localhost','127.0.0.1','[::1]'].includes(u.hostname); } catch { return false; }
    } });
  server.on('connection', socket => {
    let authenticated = false;
    const timer = setTimeout(() => socket.close(1008, 'Anmeldung fehlt'), 5000);
    socket.on('error', () => {});
    socket.on('message', bytes => {
      let data;
      try { data = JSON.parse(bytes.toString()); } catch { socket.close(1008, 'Ungültige Nachricht'); return; }
      if (!authenticated) {
        const supplied = Buffer.from(typeof data?.token === 'string' ? data.token : '');
        const expected = Buffer.from(token);
        if (data?.type !== 'hello' || supplied.length !== expected.length || !timingSafeEqual(supplied, expected) || player) {
          clearTimeout(timer); socket.close(1008, 'Kopplung abgelehnt oder Player bereits verbunden'); return;
        }
        clearTimeout(timer); authenticated = true; player = socket;
        socket.send(JSON.stringify({type:'ready'})); return;
      }
      if (data?.type !== 'result' || typeof data.id !== 'string') return;
      const entry = pending.get(data.id); if (!entry) return;
      clearTimeout(entry.timer); pending.delete(data.id);
      if (typeof data.error === 'string') entry.reject(new Error(data.error)); else entry.resolve(data.result);
    });
    socket.on('close', () => { clearTimeout(timer); if (player === socket) { player = null; failPending(); } });
  });
  return {
    server,
    request(method, args = {}) {
      if (!player || player.readyState !== 1) return Promise.reject(new Error('Kein gekoppelter Player. MCP im geöffneten PaKaChi-Player einschalten.'));
      if (pending.size >= 16) return Promise.reject(new Error('Zu viele gleichzeitige Anfragen.'));
      return new Promise((resolve, reject) => {
        const id = randomUUID();
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('Player antwortet nicht. Befehl kann bereits ausgeführt sein; Zustand abfragen.')); }, timeout);
        pending.set(id, {resolve,reject,timer});
        player.send(JSON.stringify({type:'request', id, method, args}), error => {
          if (error && pending.has(id)) { clearTimeout(timer); pending.delete(id); reject(error); }
        });
      });
    },
    async close() {
      failPending(); for (const client of server.clients) client.terminate();
      await new Promise(resolve => server.close(resolve));
    },
  };
}
