# Python-MCP mit eingebettetem MQTT-Broker

Gültig für Softwarestand 0.10.0; Integration zuletzt in 0.10.0 einschließlich Studio-Skalierung geprüft.

Der bevorzugte Agentenweg lautet:

**KI/MCP-Host → Python-MCP-Server → aMQTT-Broker → geöffneter Player → Antwort zurück zum MCP-Host.**

Der Server verwendet das offizielle Python-Paket **mcp 2.3.0**. Die Abhängigkeiten sind in `server/python/requirements.txt` auf konkrete Versionen festgelegt. Der eingebettete Broker ist **aMQTT 0.12.1**. Es handelt sich um das offizielle MCP-SDK, nicht um das separate Paket FastMCP.

Quellen: [MCP SDK auf PyPI](https://pypi.org/project/mcp/2.3.0/), [offizielle SDK-Dokumentation](https://py.sdk.modelcontextprotocol.io/), [aMQTT auf PyPI](https://pypi.org/project/amqtt/0.12.1/), [Broker-Einbettung](https://amqtt.readthedocs.io/en/latest/references/broker/).

## Installation unter Windows

Zusätzlich zu Node wird Python benötigt; geprüft wurde Python 3.12. Im Projektordner:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r server/python/requirements.txt
npm ci
```

Einmal einen zufälligen gemeinsamen Schlüssel erzeugen:

```powershell
.venv\Scripts\python.exe -c "import secrets; print(secrets.token_hex(32))"
```

Den Schlüssel für die folgende Host-Konfiguration und das Passwortfeld im Player verwenden. Er wird nicht ins Repository geschrieben. Unter Linux/macOS lautet der Python-Pfad `.venv/bin/python`.

## MCP-Host konfigurieren

Beispiel; beide Pfade und den Schlüssel anpassen:

```json
{
  "mcpServers": {
    "pakachi": {
      "command": "C:/Projekte/PaKaChi-SM/.venv/Scripts/python.exe",
      "args": ["C:/Projekte/PaKaChi-SM/server/python/pakachi_mcp.py"],
      "env": {
        "PAKACHI_TOKEN": "HIER_DEN_ERZEUGTEN_SCHLUESSEL_EINTRAGEN"
      }
    }
  }
}
```

Der Host startet den Server als lokalen **stdio-Prozess**. Der Prozess startet standardmäßig auch den eingebetteten Broker; beim Beenden wird dieser geschlossen. Es ist kein zusätzlicher Brokerdienst und kein Docker nötig. stdout ist ausschließlich für MCP reserviert, Diagnosemeldungen gehen an stderr.

Der Broker bindet nur an **127.0.0.1**, TCP-Port **1883** und WebSocket-Port **8083**. Anmeldung: Benutzer **pakachi**, Passwort gleich `PAKACHI_TOKEN`. Anonyme Verbindungen und falsche Kennwörter werden abgelehnt. Sind die Ports belegt, startet der Server mit einem Fehler; er übernimmt keinen fremden Broker stillschweigend.

## Player verbinden

1. `npm run dev` starten und die angezeigte lokale Adresse öffnen.
2. **Agent verbinden · MQTT / MCP** öffnen.
3. Broker-Adresse: `ws://127.0.0.1:8083/mqtt`, Topic: `pakachi/status`.
4. Benutzername `pakachi`, Passwort der erzeugte Schlüssel.
5. **Python-MCP über diesen Broker erlauben** und **MQTT-Empfang einschalten** aktivieren.

Nach der Anmeldung dauert die Erkennung durch MCP höchstens ungefähr zwei Sekunden. Beide Schalter starten ausgeschaltet. Im Status steht die Player-ID. Die rechts angezeigte bisherige Node-Brücke bleibt für ältere Konfigurationen erhalten und wird für den Python-Weg nicht benötigt.

## Verfügbare Tools

| Tool | Ergebnis / Wirkung |
| --- | --- |
| `list_avatars` | Avatare des geöffneten Players, im Feld `avatars`. |
| `get_avatar_capabilities` | Tatsächlich geladene Zustände und Moves. |
| `list_moves` | Original- und eigene Studio-Moves im Feld `moves`. |
| `get_state` | Aktiver Zustand, Fähigkeiten und Bereitschaft. |
| `set_state` | Unterstützten Zustand des ausgewählten Avatars setzen. |
| `play_move` | Bewegung über ihr eindeutiges Schlagwort auslösen. |
| `get_studio` | Sitzung, Revision, Freigabe und paginierte Punkte-/Posen-/Move-Listen abfragen. |
| `edit_studio` | Nach zusätzlicher Studio-Freigabe einen validierten Bearbeitungsschritt ausführen. |

Das SDK übernimmt MCP-Handshakes, Protokollaushandlung, Schemas und Tool-Aufrufe. Der Player bestätigt die tatsächliche Ausführung beziehungsweise meldet Fehler zurück. Ein erfolgreiches MQTT-Publish allein wird nicht als erfolgreiche Aktion ausgegeben.

Die Avatar-Auswahl erfolgt weiterhin im Player. Solange das Studio geöffnet ist, werden externe Zustands-/Move-Befehle abgewiesen. Für Studio-Änderungen stehen eigene Befehle bereit. Vorher im geöffneten 3D-Studio **KI darf dieses Studio bearbeiten** aktivieren. Die Freigabe endet beim Verlassen beziehungsweise Ersetzen des Studios. [Befehle und Beispielablauf](MCP-STUDIO.md).

## Nachrichten und Verhalten

- Direkte MQTT-Nachrichten wie `{"state":"working"}` oder `{"move":"winken"}` funktionieren auf `pakachi/status` weiterhin. Der Python-MCP-Weg ergänzt einen separaten Anfrage-/Antwortkanal.
- Jeder Player hat eine zufällige Sitzungs-ID. Präsenzmeldungen laufen über `pakachi/players/<id>/presence`, adressierte Befehle über `pakachi/players/<id>/request`, Antworten über `pakachi/mcp/<server-id>/reply`.
- Präsenzmeldungen werden alle zwei Sekunden gesendet und nach sechs Sekunden ohne Aktualisierung als veraltet behandelt. Bei mehreren aktiven Playern verweigert der Server eine unklare Zuordnung. Mit `PAKACHI_PLAYER` kann die im Player angezeigte ID gezielt gewählt werden; sie ändert sich nach einem Neuladen der Seite.
- MCP-Befehle enthalten eine eindeutige ID, einen Rückkanal und eine Ablaufzeit. Sie werden ohne Retain mit QoS 0 gesendet und nie automatisch wiederholt. Der Player weist abgelaufene oder gespeicherte Retain-Anfragen ab und erkennt kürzlich bearbeitete doppelte IDs.
- Nach fünf Sekunden ohne Antwort meldet der Server einen Timeout: Der Befehl könnte bereits ausgeführt sein. Vor einer Wiederholung den Zustand abfragen.
- Player-Reconnect aktiviert nur die zuvor ausdrücklich erlaubten Funktionen. Ausschalten beendet Empfang und Wiederverbindungsversuche. Die letzte Haltung bleibt erhalten. Verliert der Python-Server selbst seine Brokerverbindung, muss der MCP-Prozess neu gestartet werden.
- Direkte Moves nicht als Retain-Nachrichten senden; der Broker würde sie sonst bei einer späteren Anmeldung erneut zustellen.

## Vorhandenen Broker statt aMQTT verwenden

Zusätzlich zur Host-Konfiguration setzen:

```json
{
  "PAKACHI_EMBEDDED_BROKER": "0",
  "PAKACHI_MQTT_URL": "mqtt://BENUTZER:PASSWORT@127.0.0.1:1883"
}
```

Zugangsdaten im URI gegebenenfalls URL-kodieren. Im Player die entsprechende WebSocket-Adresse und dieselben Broker-Zugangsdaten eintragen. `PAKACHI_TOKEN` bleibt als Konfigurationsvoraussetzung gesetzt; die tatsächliche externe Broker-Anmeldung erfolgt über den URI. Der externe Broker muss die beschriebenen Topics zulassen. Für einen HTTPS-Player ist WSS erforderlich; der eingebettete lokale Broker bietet in dieser Version WS für die lokale HTTP-Oberfläche.

Alternative lokale Ports: `PAKACHI_MQTT_PORT` und `PAKACHI_MQTT_WS_PORT`. Die WebSocket-Adresse im Player entsprechend ändern. Mehrere MCP-Hosts können denselben extern gestarteten Broker verwenden; nicht mehrere eingebettete Broker auf denselben Ports starten.

## Tests

```powershell
$env:PAKACHI_PYTHON = "$PWD/.venv/Scripts/python.exe"
npm run test:python
```

Der Integrationstest startet einen echten Python-MCP-Prozess und den echten eingebetteten Broker auf freien Ports. Er verwendet den produktiven MQTT-Playerclient und den gemeinsamen Zustandsrouter. Geprüft: MCP-Handshake, acht Tools, Studio-Abfrage, tatsächliches Anlegen eines Kontrollpunkts/Speichern einer Pose, Freigabe- und Revisionsprüfung, Rückantworten, Authentifizierung, ungültige Zustände, direkte MQTT-Steuerung, Duplikate, Ablaufzeit, Mehrdeutigkeit und Opt-out. Die Darstellung selbst wird dabei nicht in einem Browser gerendert.

Die Testergebnisse und noch offenen externen Abnahmen stehen im [aktuellen Prüfstand](PRUEFUNG.md).
