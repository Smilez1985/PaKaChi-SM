# Agentensteuerung

Gültig für Softwarestand 0.12.0.

**Bevorzugter Weg seit 0.4.0:** [Python-MCP 2.3.0 mit eingebettetem aMQTT-Broker](PYTHON-MCP.md). MCP-Anfragen und Player-Antworten laufen dort über denselben MQTT-Broker. Die folgende Node-Einrichtung bleibt als Kompatibilitätsweg erhalten.

## Gemeinsame StateMaschine

Der geöffnete Player besitzt einen ausgewählten Avatar. Manuelle Zustandsauswahl, MQTT und MCP verwenden dieselbe Prüfung und dieselbe StateMaschine. Der letzte gültige neue Zustand gewinnt; es gibt keine Befehlswarteschlange. Ungültige Befehle und Befehle für einen anderen Avatar verändern nichts.

Ein erneuter identischer Zustand startet die Animation nicht neu. Ein neuer Zustand unterbricht eine einmalige Bewegung. Nach einer einmaligen Bewegung kehrt ein 3D-Avatar zum aktiven Zustand zurück. Explizit als Schleife deklarierte Moves laufen dagegen weiter, bis ein neuer Move oder ein anderer Zustand gewählt wird. Originalclips untereinander werden in etwa 180 ms überblendet; Übergänge zu eigenen Studio-Moves erfolgen direkt. Ein Avatarwechsel beginnt beim Grundzustand des neuen Modells; Zustände werden nicht blind übertragen.

| Avatar | Unterstützte Zustände |
| --- | --- |
| PaKaChi Original | idle, talking, thinking, working, waiting, review, error, sleeping |
| Mika und Nori (technische 3D-Testmodelle) | idle, talking, thinking, working |
| Eigene GLB-Importe | Zunächst nur enthaltene Moves; keine automatisch erfundenen Zustandszuordnungen |

PaKaChi Original verwendet seine vorhandenen Formzuordnungen: idle/talking/sleeping/error führen zur Tierform; thinking/working/waiting/review zur humanoiden Form. Es gibt weiterhin keine eigenen Sprech- oder Tablet-Arbeitsschleifen für den Originalavatar.

## MQTT einschalten

Im Hauptfenster **„Agent verbinden · MQTT / MCP“** öffnen. Broker-WebSocket-Adresse, genaues Topic und gegebenenfalls Benutzername/Passwort eingeben. Erst **„MQTT-Empfang einschalten“** verbindet. Vorgabe: `ws://127.0.0.1:8083/mqtt`, Topic `pakachi/status`.

Der Agent darf am selben Broker MQTT/TCP nutzen. Im Browser ist WebSocket erforderlich. Für einen HTTPS-Player muss der Broker entsprechend über `wss://` erreichbar sein.

Nachrichten auf dem gewählten Topic:

```json
{"state":"working"}
```

Klartext `working` und die frühere Schreibweise `{"status":"working"}` funktionieren ebenfalls.

```json
{"move":"winken","avatar":"mika"}
```

`avatar` ist optional, muss aber bei Angabe dem ausgewählten Avatar entsprechen. Erst Fähigkeiten abfragen; nicht jede Figur kann winken. Unbekannte Felder, widersprüchliche Befehle und ungültige Namen werden abgewiesen.

Ausschalten trennt die Verbindung und beendet Wiederverbindungsversuche. Zugangsdaten werden nicht gespeichert. Nach einem Verbindungsabbruch bleibt der letzte Zustand stehen; es wird kein künstliches `idle` erzeugt. Retained-Nachrichten des Brokers können bei Wiederverbindung einen neuen Zustand liefern.

Im eingebetteten Originalplayer ist dessen separate MQTT-Oberfläche ausgeblendet; die übergeordnete Verbindung steuert nun beide Avatararten. Die Originaldateien bleiben unverändert. Beim direkten Öffnen des alten Players funktioniert dessen eigene MQTT-Oberfläche wie bisher.

## Bisherige Node-MCP-Brücke einrichten

Der MCP-Server wird von einem MCP-fähigen Agenten als **stdio-Prozess** gestartet. Er stellt acht Tools bereit:

- `list_avatars`
- `get_avatar_capabilities`
- `list_moves`
- `get_state`
- `set_state`
- `play_move`
- `get_studio`
- `edit_studio`

Er verbindet sich über eine lokale WebSocket-Brücke mit dem geöffneten Player. Das ist kein öffentlich gehosteter HTTP-MCP-Endpunkt. Es kann genau ein Player pro Brücke gekoppelt sein.

### 1. Kopplungsschlüssel erzeugen

Einmal lokal ausführen:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 2. MCP-Host konfigurieren

Repository-Abhängigkeiten zuvor mit `npm ci` installieren. Beispielkonfiguration; Pfad und Schlüssel ersetzen:

```json
{
  "mcpServers": {
    "pakachi": {
      "command": "node",
      "args": ["C:/Projekte/PaKaChi-SM/server/mcp.mjs"],
      "env": {
        "PAKACHI_TOKEN": "HIER_DEN_LOKAL_ERZEUGTEN_SCHLUESSEL_EINTRAGEN",
        "PAKACHI_PORT": "8765"
      }
    }
  }
}
```

Den Node-Prozess direkt konfigurieren, nicht `npm run mcp:legacy`: npm kann Startmeldungen auf stdout schreiben und damit den stdio-Protokollstrom stören. Der genaue Einstellungsort hängt vom MCP-Host ab.

### 3. Player koppeln

Player mit `npm run dev` öffnen. Unter MCP denselben Schlüssel und `ws://127.0.0.1:8765` eintragen. **„MCP-Kopplung einschalten“** aktivieren. Der Server bindet ausschließlich an `127.0.0.1`; der Player muss über localhost/127.0.0.1 im Browser geöffnet sein.

Ohne geöffneten, gekoppelten Player liefern die Tools eine klare Fehlermeldung. Fähigkeiten und Moves werden aus dem geladenen Modell abgefragt. Andere Avatare können gelistet werden; zur Steuerung müssen sie zuerst im Player ausgewählt werden. Nach Trennung erneut einschalten. Ein Timeout wiederholt einen Befehl nicht automatisch; er könnte bereits ausgeführt sein. Vor einem erneuten Aufruf `get_state` abfragen.

Die Brücke führt weder Shell-Befehle aus noch liest sie beliebige Dateien. Sie reicht ausschließlich die beschriebenen Player-/Studio-Operationen durch. Ein echter Agent muss den stdio-Server unterstützen; diese Integration richtet keine Verbindung zu einem Chat-Dienst automatisch ein.

## Direkte Browser-API

Seit 0.7.0 enthalten eigene Moves in `list_moves` und `get_avatar_capabilities` zusätzlich `needsReview` (Boolean) und `reviewPoseIds` (Posen-IDs). Sie informieren über Änderungen am Kontrollsystem; ein markierter Move bleibt abspielbar. Originalclips müssen diese optionalen Felder nicht enthalten.

Eigene Studio-Moves erscheinen nach dem Laden ihrer Projektdatei in `list_moves` und können über ihr Schlagwort ausgelöst werden. Solange das Studio geöffnet ist, werden Steuerbefehle mit einer Fehlermeldung abgewiesen, damit die aktuelle Bearbeitung erhalten bleibt. Abfragen bleiben möglich.

Für eine Host-Integration im selben Browserfenster (Studio-Befehle siehe [MCP-Studio](MCP-STUDIO.md)):

```js
window.PaKaChiSM.call('get_avatar_capabilities');
window.PaKaChiSM.call('set_state', {state:'thinking'});
window.PaKaChiSM.call('play_move', {move:'nicken'});
window.PaKaChiSM.call('get_state');
```

MCP und MQTT können gleichzeitig aktiviert werden. Es gibt keine versteckte Priorität; bei konkurrierenden Meldungen entscheidet deren Eingangsreihenfolge. Der Agent sollte einen zusammengefassten Gesamtzustand senden.

## Prüfstand

Router und Node-MCP sind Bestandteil der regulären Tests; der Python-Weg wurde in 0.10.0 mit realen Prozessen, aMQTT, produktivem MQTT-Client und Studio-Editor integriert getestet. Eine konkrete externe Host-/NanoMQ-Abnahme und die visuelle Browserabnahme stehen aus. Vollständige Übersicht: [Prüfstand](PRUEFUNG.md).
