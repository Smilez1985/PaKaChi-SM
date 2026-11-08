# Lokale Werkzeuge, Caddy und Secure MCP Tunnel

Ab 0.86.0 kann PaKaChi-SM selbst den lokalen MCP-Arbeitsplatz betreiben. Player, Studio, Programmkonfiguration, Dateien, Aufträge, Verbindungsfreigaben und Tunnel-Bedienung liegen in derselben Anwendung. Die Rechenarbeit läuft auf dem Rechner, auf dem du PaKaChi startest; eine GPU muss dem Chatbrowser nicht zugewiesen werden.

## Starten und einschalten

Node.js 24 oder neuer installieren und **Start-Windows.cmd** ausführen. Alternativ:

```sh
npm ci
npm run local -- --open
```

Das baut die Anwendung und öffnet normalerweise `http://127.0.0.1:8787`. **Lokale Werkzeuge** öffnen, **MCP-Werkzeuge einschalten** wählen und die Einstellungen übernehmen. **Player koppeln** verbindet den geöffneten Player mit demselben Dienst. Zustände und Studioaktionen behalten ihre bisherigen Freigaben; Studioänderungen benötigen weiterhin die Studiofreigabe.

Blender/Python unter **Programme und GPU prüfen** mit ihren tatsächlichen Programmpfaden eintragen. Windows-Pfade mit Leerzeichen unverändert und ohne zusätzliche Anführungszeichen eintragen. Python muss bei Bild-zu-3D auf die eingerichtete TripoSR-Umgebung zeigen. **Programme prüfen** führt Blender `--version` und eine Python-/PyTorch-/CUDA-Abfrage aus. CPU ist die Vorgabe; CUDA nur auswählen, wenn es in dieser Python-Umgebung verfügbar ist. PaKaChi installiert Blender, Python, PyTorch und TripoSR nicht automatisch.

**Blender-/Python-Skripte und lokale ACP-Agenten ausführen** ist eine getrennte Freigabe. Skripte und Agenten laufen mit den Rechten deines Benutzerkontos, ohne Betriebssystem-Sandbox. Dieser Schalter sowie die MCP-Werkzeuge sind nach jedem Neustart wieder ausgeschaltet. Programmpfade und Verbindungsadressen bleiben erhalten; Runtime-Tunnelschlüssel und zusätzliche ACP-Umgebungsvariablen gelten nur für die laufende Sitzung.

`npm run dev` bleibt der Entwicklungs-Webserver ohne lokale Programme. Für diese Werkzeuge den lokalen Start verwenden. Port und Datenordner lassen sich direkt mit `node server/local.mjs --port 8787 --directory /absoluter/pfad --open` wählen, nachdem die Anwendung gebaut wurde.

## Vorhandenen Caddy mit DuckDNS verwenden

Du brauchst keine weitere öffentliche Portfreigabe. Trage deine bestehende HTTPS-Adresse ein, zum Beispiel `https://deinname.duckdns.org/pakachi/mcp`. Mit **Caddy-Abschnitt erstellen** erhältst du die passenden MCP- und OAuth-Routen für deinen vorhandenen Siteblock. Caddy, DuckDNS und die bestehende Routerweiterleitung bleiben unter deiner Verwaltung.

| Standort von Caddy | PaKaChi-Listener | Interne Adresse im Caddy-Abschnitt |
| --- | --- | --- |
| Auf demselben Rechner | Nur dieser Rechner | `127.0.0.1:8787` |
| Auf einem anderen LAN-Rechner | Auch im LAN | Interne IP des PaKaChi-Rechners, z. B. `192.168.1.20:8787` |
| Caddy im Container | Vom Container erreichbarer Listener | Aus dem Container erreichbare Hostadresse und Port; Container-Loopback ist nicht der Windows-Host |

Bei LAN-Betrieb nur den erforderlichen internen Zugriff vom Proxy erlauben. Die Verwaltung unter `/api/local/` und die Oberfläche werden vom erzeugten Abschnitt nicht weitergeleitet und zusätzlich vom Dienst auf direkte Loopback-Anfragen beschränkt. Auch bei LAN-Listener die Anwendung am PaKaChi-Rechner über `127.0.0.1` öffnen.

Der Abschnitt enthält MCP, OAuth-Registrierung, Anmeldung, Token, Widerruf, die wartende Verbindungsanfrage und beide erforderlichen Well-known-Metadatenpfade. Bei bereits vorhandenen `handle`-/`route`-Regeln die Zuordnung in den bestehenden Siteblock einpassen. PaKaChi ändert oder lädt deinen Caddy nicht selbst neu.

Die HTTPS-MCP-Adresse im externen MCP-Client beziehungsweise in ChatGPT als eigenen MCP-Server eintragen. Der Client verwendet OAuth mit PKCE. Eine neue Anmeldung erscheint unter **Verbindungsanfragen** mit Clientname und Rücksprungadresse. Dort erlauben oder ablehnen. Es gibt keine automatische Freigabe. Nach Neustart oder Abschalten sind erteilte Tokens ungültig; nach Änderung der öffentlichen Adresse erneut verbinden. Öffentlich erreichbar ist damit noch kein angemeldeter Zugriff.

## Secure MCP Tunnel innerhalb PaKaChi bedienen

Der Tunnel ist eine alternative ausgehende Verbindung zu OpenAI und benötigt keinen eingehenden Listener am Router. Dein vorhandener Caddy kann unabhängig weiterlaufen.

1. Im eigenen OpenAI-Konto einen Secure MCP Tunnel und die erforderlichen Zugriffsrechte anlegen.
2. Unter **Secure MCP Tunnel** die Tunnel-ID und den dafür berechtigten Runtime-API-Schlüssel eintragen.
3. **Offiziellen Tunnel-Client installieren / aktualisieren** wählen. PaKaChi lädt das offizielle plattformspezifische Releasearchiv von `openai/tunnel-client`, prüft den veröffentlichten SHA-256-Digest und installiert Client und zugehöriges Cloudflared gemeinsam.
4. **Tunnel-Diagnose** oder **Tunnel starten** wählen. PaKaChi erstellt die lokale Konfiguration mit Umgebungsvariablenreferenzen; der Schlüssel steht weder in Programmargumenten noch in dieser Datei. Die Diagnose ruft den offiziellen `doctor --explain` auf.
5. Den Tunnel im externen ChatGPT-MCP-Eintrag auswählen und dort die Kontofreigabe abschließen. Die Oberfläche verlinkt die Kontoeinrichtung.

`starting` bedeutet, dass der Prozess läuft, aber noch keine Bereitschaft bestätigt ist; `ready` kommt aus dem tatsächlichen lokalen `/readyz` des offiziellen Clients. Das bestätigt keinen erfolgreichen ChatGPT-Werkzeugaufruf. Erst `local_get_status` über den verbundenen Client belegt die durchgehende Verbindung. PaKaChi kann Konto-/Workspace-Berechtigungen und die Installation des MCP-Eintrags in ChatGPT nicht stellvertretend erteilen oder dieser Chatsitzung selbst Werkzeuge hinzufügen.

Der Schlüssel bleibt im Speicher und wird nur dem Tunnelprozess über dessen Umgebung gegeben. Beenden der Anwendung stoppt den Tunnel. Die Installation unterstützt Windows, Linux und macOS auf x64/ARM64, soweit das offizielle Release das passende Archiv samt Digest bereitstellt. Tatsächlich lokal geprüft wurde hier das Linux-x64-Release v0.0.20; Windows, dein Caddy und ein live angemeldeter OpenAI-Tunnel benötigen die Abnahme bei dir.

## Dateien und Rechenaufträge

Dateien aufnehmen oder Skripttext **Als neues Skript ablegen**. Danach Auftragsart, Skript beziehungsweise Bild/GLB und weitere Eingaben auswählen. **Auftrag starten** liefert sofort eine Auftragskennung; Status und Protokoll erscheinen darunter. Ergebnisse lassen sich herunterladen, GLBs zusätzlich **Im Studio öffnen**. Mit **Abbrechen** wird der Prozess einschließlich seiner Prozessgruppe beendet. Nach unerwartetem Neustart werden laufende gespeicherte Aufträge als unterbrochen angezeigt.

| Auftragsart | Voraussetzung | Ergebnis |
| --- | --- | --- |
| Blender | Konfiguriertes Blender, `.py`-Asset, Skriptfreigabe | Hintergrundprozess mit leerer Werksszene; Dateien aus dem Ausgabeordner |
| Python | Konfiguriertes Python, `.py`-Asset, Skriptfreigabe | Echter Python-Prozess und Ausgabedateien |
| Bild zu 3D | Eingerichtetes TripoSR, Python, Bild, gewähltes CPU-/CUDA-Gerät | Bestehender Generator mit GLB-Ergebnis; keine automatische Qualitätsfreigabe |
| GLB prüfen | Eigenständiges GLB-Asset | Prüfung mit dem tatsächlichen Modelllader |
| ACP-Agent | Konfigurierter ACP-v1-Agent, Prompt, Skriptfreigabe | Agentensitzung mit denselben MCP-Werkzeugen |

Skripte erhalten `PAKACHI_JOB_INPUTS` als JSON-Zuordnung Asset-ID → kopierter Eingabepfad und `PAKACHI_JOB_OUTPUT` als Ausgabeordner. Beispiel:

```python
import os
from pathlib import Path

output = Path(os.environ["PAKACHI_JOB_OUTPUT"])
(output / "ergebnis.txt").write_text("Lokal berechnet", encoding="utf-8")
```

Dateien in diesem Ausgabeordner werden als neue unveränderliche Assets registriert. Ein Rechenauftrag und eine ACP-Sitzung können parallel laufen, sodass ein Agent einen Rechenauftrag starten und abfragen kann. Weitere gleichartige aktive Aufträge werden abgewiesen. Zeitlimit pro Auftrag: 10 bis 7200 Sekunden. Untergeordnete ACP-Aufträge werden beim Abbruch des Agenten ebenfalls abgebrochen.

Assets: GLB, PNG/JPEG/WebP, Python, JSON/TXT und Blend; maximal 50 MiB je Datei und 1 MiB je Python-Datei. Übertragung in höchstens 384-KiB-Blöcken; Auftragsresultate werden bis 50 Dateien/150 MiB eingesammelt. Gespeicherte Assets sind auf 1000 Dateien/1 GiB begrenzt. Der Standarddatenordner `.pakachi-local` enthält Einstellungen, lokalen Zugangsschlüssel, Assets, Jobs und Tunnelprogramme und ist vom Git-Repository ausgeschlossen. Nicht mehr benötigte Daten bei beendetem PaKaChi sichern beziehungsweise entfernen; das Löschen dieses Ordners verwirft auch die lokale Verbindungskonfiguration.

## MCP-Werkzeuge und ACP

Der integrierte Streamable-HTTP-MCP-Server bietet die acht bisherigen Player-/Studiowerkzeuge sowie:

| Werkzeug | Aufgabe |
| --- | --- |
| `local_get_status` | Tatsächliche Laufzeit, CPU/RAM, Programmprobe und aktive Aufträge |
| `local_list_assets` | Verfügbare Dateien und Hashes |
| `local_read_asset` | Dateiblöcke mit `nextOffset` abrufen |
| `local_upload_asset` | Dateiblöcke mit fortlaufendem Offset hochladen |
| `local_write_text_asset` | Neues Text-/Python-Asset ablegen |
| `local_start_job` | Auftrag asynchron starten; optionale `requestId` verhindert doppelte Starts in der laufenden Sitzung |
| `local_get_job` | Status, begrenztes Protokoll und Ergebnis-Assets |
| `local_list_jobs` | Letzte Aufträge |
| `local_cancel_job` | Laufenden Auftrag abbrechen |

Lange Berechnungen werden gestartet und danach abgefragt; sie halten keinen MCP-Aufruf über die Tunnel-Frist offen. Große GLBs werden in Blöcken übertragen. Executable-Pfade, Tunnel-Anmeldung und globale Ausführungsfreigabe können nur lokal in der Oberfläche geändert werden.

**MCP-/ACP-Client-Konfiguration kopieren** exportiert eine tatsächlich zur laufenden Anwendung passende lokale stdio-MCP-Konfiguration. Sie enthält einen lokalen Zugangsschlüssel und gehört nur in vertrauenswürdige lokale Clients.

Bei ACP ist PaKaChi der **Client**: Es startet dein konfiguriertes ACP-Programm ohne Shell, handelt Protokollversion 1 aus, erstellt eine Sitzung und gibt dem Agenten PaKaChi als stdio-MCP-Server mit. Programmargumente als JSON-Liste und zusätzliche Schlüssel/Umgebungsvariablen als sitzungsgebundenes JSON-Objekt eingeben. Einen passenden installierten und authentifizierten ACP-Agenten voraussetzen; PaKaChi liefert keinen eigenen universellen LLM-Agenten mit. ACP-Berechtigungsanfragen erscheinen lokal zur Auswahl. Nicht angebotene Dateisystem-/Terminal-Clientfähigkeiten werden abgewiesen. Ein Agentprogramm selbst besitzt weiterhin die Rechte des gestarteten Benutzerkontos.

Der externe ChatGPT-Zugriff auf PaKaChi erfolgt über MCP. Ein ACP-Agent kann denselben MCP-Arbeitsplatz lokal verwenden; ACP ist kein zusätzlich erfundener öffentlicher HTTP-Endpunkt.

## Protokollquellen

- [OpenAI Secure MCP Tunnels](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
- [Offizieller Tunnel-Client und Releasearchive](https://github.com/openai/tunnel-client)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [ACP v1](https://agentclientprotocol.com/protocol/v1/overview)
- [Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
