"""MCP SDK 2.3 server with an opt-in embedded MQTT broker and correlated replies."""
import asyncio
from contextlib import asynccontextmanager, suppress
import json
import logging
import os
import re
import time
from typing import Literal
from urllib.parse import quote
from uuid import uuid4
from amqtt.broker import Broker
from amqtt.client import MQTTClient
from mcp.server import MCPServer
from pydantic import BaseModel, ConfigDict, Field

STATES = Literal['idle', 'talking', 'thinking', 'working', 'waiting', 'review', 'error', 'sleeping']

class StudioCommand(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    session: str = Field(max_length=100)
    expectedRevision: int = Field(ge=0)
    action: Literal['set_mode', 'add_point', 'update_point', 'delete_point', 'connect_points', 'disconnect_points', 'save_pose', 'apply_pose', 'replace_pose', 'create_move', 'undo', 'redo']
    mode: Literal['pose', 'rig'] | None = None
    id: str | None = Field(default=None, max_length=100)
    target: str | None = Field(default=None, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    position: list[float] | None = Field(default=None, min_length=3, max_length=3)
    rotation: list[float] | None = Field(default=None, min_length=4, max_length=4)
    scale: float | None = Field(default=None, ge=.1, le=5)
    size: float | None = Field(default=None, ge=.003, le=.15)
    radius: float | None = Field(default=None, ge=.005, le=.6)
    mesh: int | None = Field(default=None, ge=0)
    seconds: float | None = Field(default=None, ge=.1, le=30)
    loop: bool | None = None
    poses: list[str] | None = Field(default=None, min_length=2, max_length=100)

class MQTTBridge:
    def __init__(self, uri, player=None, timeout=5.0):
        self.uri, self.player, self.timeout = uri, player, timeout
        self.client = MQTTClient(client_id='pakachi-mcp-' + uuid4().hex,
                                 config={'auto_reconnect': False, 'connection_timeout': 5})
        self.reply_topic = 'pakachi/mcp/' + uuid4().hex + '/reply'
        self.pending = {}
        self.players = {}
        self.task = None
        self.connected = False

    async def start(self):
        await self.client.connect(self.uri)
        await self.client.subscribe([('pakachi/players/+/presence', 0), (self.reply_topic, 0)])
        self.connected = True
        self.task = asyncio.create_task(self.receive())

    async def receive(self):
        try:
            while True:
                message = await self.client.deliver_message()
                if len(message.data) > 65536:
                    continue
                try:
                    data = json.loads(message.data)
                    if not isinstance(data, dict):
                        continue
                    if message.topic == self.reply_topic:
                        entry = self.pending.get(data.get('id'))
                        if entry and not entry.done():
                            if isinstance(data.get('error'), str):
                                entry.set_exception(RuntimeError(data['error']))
                            else:
                                entry.set_result(data.get('result'))
                    elif re.fullmatch(r'pakachi/players/[a-z0-9-]{1,64}/presence', message.topic):
                        player = message.topic.split('/')[2]
                        if data.get('online') is True:
                            self.players[player] = time.monotonic()
                        else:
                            self.players.pop(player, None)
                except (ValueError, TypeError):
                    continue
        except asyncio.CancelledError:
            raise
        except Exception:
            self.connected = False
            for future in self.pending.values():
                if not future.done():
                    future.set_exception(RuntimeError('MQTT-Verbindung getrennt. MCP-Server neu starten.'))

    async def request(self, method, args=None):
        if not self.connected:
            raise RuntimeError('MQTT-Brücke nicht verbunden.')
        active = [p for p, stamp in self.players.items() if time.monotonic() - stamp < 6]
        if self.player:
            active = [p for p in active if p == self.player]
        if not active:
            raise RuntimeError('Kein Player bereit. MQTT und Python-MCP im Player einschalten; Kopplung dauert bis zu zwei Sekunden.')
        if len(active) != 1:
            raise RuntimeError('Mehrere Player bereit. PAKACHI_PLAYER auf die angezeigte Player-ID setzen oder weitere Player trennen.')
        if len(self.pending) >= 16:
            raise RuntimeError('Zu viele gleichzeitige Anfragen.')
        ident = uuid4().hex
        future = asyncio.get_running_loop().create_future()
        self.pending[ident] = future
        command = {'id': ident, 'method': method, 'args': args or {},
                   'replyTo': self.reply_topic, 'expires': int((time.time()+self.timeout)*1000)}
        try:
            await self.client.publish('pakachi/players/'+active[0]+'/request',
                                      json.dumps(command).encode(), qos=0, retain=False)
            return await asyncio.wait_for(future, self.timeout)
        except asyncio.TimeoutError as exc:
            raise RuntimeError('Player antwortet nicht. Befehl könnte ausgeführt sein; Zustand abfragen. Keine automatische Wiederholung.') from exc
        finally:
            self.pending.pop(ident, None)

    async def close(self):
        self.connected = False
        if self.task:
            self.task.cancel()
            with suppress(asyncio.CancelledError):
                await self.task
        with suppress(Exception):
            await self.client.disconnect()


def build_server(uri=None, embedded=True, tcp_port=1883, ws_port=8083):
    bridge = None

    @asynccontextmanager
    async def lifespan(server):
        nonlocal bridge
        broker = None
        token = os.environ.get('PAKACHI_TOKEN', '')
        if not 32 <= len(token) <= 256:
            raise RuntimeError('PAKACHI_TOKEN muss 32–256 Zeichen haben.')
        try:
            if embedded:
                broker = Broker({'listeners': {
                    'default': {'type': 'tcp', 'bind': f'127.0.0.1:{tcp_port}'},
                    'websocket': {'type': 'ws', 'bind': f'127.0.0.1:{ws_port}'}},
                    'plugins': {'pakachi_auth.TokenAuth': {}}})
                await broker.start()
            address = uri or f'mqtt://pakachi:{quote(token, safe="")}@127.0.0.1:{tcp_port}'
            bridge = MQTTBridge(address, player=os.environ.get('PAKACHI_PLAYER'))
            await bridge.start()
            yield {}
        finally:
            if bridge:
                await bridge.close()
            if broker:
                with suppress(Exception):
                    await broker.shutdown()

    server = MCPServer('pakachi-sm', version='0.11.0', lifespan=lifespan)

    async def request(method, args=None):
        if bridge is None:
            raise RuntimeError('MQTT-Brücke startet noch.')
        return await bridge.request(method, args)

    @server.tool()
    async def list_avatars() -> dict:
        """Avatare im geöffneten Player abfragen. Auswahl erfolgt im Player."""
        return {'avatars': await request('list_avatars')}

    @server.tool()
    async def get_avatar_capabilities(avatar: str | None = None) -> dict:
        """Tatsächlich geladene Zustände und Moves des aktiven Avatars abfragen."""
        return await request('get_avatar_capabilities', {'avatar': avatar} if avatar else {})

    @server.tool()
    async def list_moves(avatar: str | None = None) -> dict:
        """Verfügbare Original- und Studio-Moves mit ihren Schlagworten abfragen."""
        return {'moves': await request('list_moves', {'avatar': avatar} if avatar else {})}

    @server.tool()
    async def get_state() -> dict:
        """Aktiven Zustand, Avatar-Fähigkeiten und Bereitschaft abfragen."""
        return await request('get_state')

    @server.tool()
    async def set_state(state: STATES, avatar: str | None = None) -> dict:
        """Unterstützten dauerhaften Zustand setzen; Studio-Bearbeitung wird geschützt."""
        return await request('set_state', {'state': state, **({'avatar': avatar} if avatar else {})})

    @server.tool()
    async def play_move(move: str, avatar: str | None = None) -> dict:
        """Gespeicherten Move ausführen. Einmalige Moves kehren zum aktiven Zustand zurück."""
        if not re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,99}', move):
            raise ValueError('Ungültiges Move-Schlagwort.')
        return await request('play_move', {'move': move, **({'avatar': avatar} if avatar else {})})

    @server.tool()
    async def get_studio(section: Literal['info', 'points', 'poses', 'moves'] = 'info', offset: int = 0, limit: int = 32) -> dict:
        """Studio-Sitzung, Revision, Modus und Freigabe lesen. Listen seitenweise bis 32 Elemente; nextOffset beachten. Keine Modellbytes. Positionen: normierte Weltkoordinaten; Rotation: Quaternion [x,y,z,w]."""
        if offset < 0 or not 1 <= limit <= 32:
            raise ValueError('Ungültige Studio-Seite.')
        return await request('get_studio', {'section': section, 'offset': offset, 'limit': limit})

    @server.tool()
    async def edit_studio(command: StudioCommand) -> dict:
        """Freigegebenes geöffnetes Studio bearbeiten. session/expectedRevision aus get_studio verwenden.
        set_mode: mode=pose/rig. add_point: position, optional name/mesh/size/radius.
        update_point: id und name/position/rotation/scale/size/radius (scale nur $figure, 0.1–5); $figure ist die ganze Figur.
        delete_point: id. connect_points/disconnect_points: id,target.
        save_pose: optional name,seconds. apply_pose/replace_pose: id.
        create_move: id,name,poses,optional loop. undo/redo ohne weitere Felder.
        Keine Dateizugriffe; Konflikte oder Timeouts zuerst mit get_studio aufklären.
        """
        return await request('edit_studio', {'command': command.model_dump(exclude_none=True)})

    return server

if __name__ == '__main__':
    # stdout belongs exclusively to the MCP protocol; broker logs go to stderr.
    logging.basicConfig(level=logging.WARNING)
    server = build_server(uri=os.environ.get('PAKACHI_MQTT_URL'),
                          embedded=os.environ.get('PAKACHI_EMBEDDED_BROKER', '1') == '1',
                          tcp_port=int(os.environ.get('PAKACHI_MQTT_PORT', '1883')),
                          ws_port=int(os.environ.get('PAKACHI_MQTT_WS_PORT', '8083')))
    server.run()
