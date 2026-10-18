# Lokale Bild-zu-3D-Generierung – 0.22.0

**Experimenteller lokaler Generator mit Studio-Oberfläche seit 0.22.0.** Es wurde hier kein KI-Modell erzeugt. Vorprüfung und Ablauf sind getestet; für echte Inferenz fehlt in der Ausführungsumgebung die eingerichtete Python-/CUDA-Pipeline. Anatomisches Rigging, beide 3D-Formen und ihre Transformation bleiben offen.

## Auswahl des ersten Testkandidaten

Quellenabgleich: 14.10.2026. Die Werte sind Herstellerangaben, keine eigenen Messungen.

| Verfahren | Offizielle Anforderungen/Umfang | Entscheidung für den ersten Versuch |
| --- | --- | --- |
| [TripoSR](https://github.com/VAST-AI-Research/TripoSR) | Einzelbild-Rekonstruktion; Standardlauf etwa 6 GB VRAM; Code und Gewichte laut README MIT. | Erster technischer Kandidat für eine lokale GLB-Geometrieprobe. Keine Qualitätszusage für PaKaChi. |
| [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) | Offiziell Linux und NVIDIA-GPU mit mindestens 24 GB Speicher. | Für eine spätere Qualitätsvergleichsmessung auf geeigneter Hardware. |
| [Hunyuan3D 2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1) | 10 GB Form, 21 GB Textur, 29 GB kombinierter Ablauf; eigene Lizenz. | Späterer Kandidat; Hardware-/Lizenzprüfung und tatsächlicher Vergleich fehlen. |

Der Adapter verwendet den offiziellen [TripoSR-CLI-Aufruf](https://github.com/VAST-AI-Research/TripoSR/blob/main/run.py) mit GLB-Ausgabe und Vertexfarben. Textur-Backen wird nicht aktiviert. Ein rekonstruiertes Mesh ist noch kein beweglicher Avatar: ein anatomisches Skelett und passende Hautgewichte müssen zusätzlich entstehen und geprüft werden.

## Einrichtung

1. TripoSR in einen **separaten lokalen Ordner** klonen: `git clone https://github.com/VAST-AI-Research/TripoSR.git`.
2. Eine eigene Python-Umgebung dafür anlegen. Passendes PyTorch/CUDA und die Abhängigkeiten nach der offiziellen [Installationsanleitung](https://github.com/VAST-AI-Research/TripoSR#installation) installieren. Das ist nicht die kleine Python-MCP-Umgebung.
3. Im PaKaChi-SM-Ordner `npm ci` ausführen und den Test mit Node 24 oder neuer starten.

Windows-Beispiel (Pfade ersetzen):

```powershell
npm run generate:model -- --check --repo "C:\KI\TripoSR" --python "C:\KI\TripoSR\.venv\Scripts\python.exe"
```

`--check` installiert nichts, lädt keine Gewichte und startet keine Generierung. Es prüft den lokalen Einstiegspunkt, die Python-Module und CUDA; bei verfügbaren GPU-Daten zeigt es Name und Gesamtspeicher. `ready: true` bedeutet nur, dass diese Vorbedingungen passen, nicht dass alle Abhängigkeiten und die Inferenz bereits erfolgreich laufen. Fehlermeldungen erklären die erkannten Blockaden.

## Beide Formen getrennt testen

Die gemeinsame Charakterreferenz zeigt **zwei Figuren nebeneinander**. Sie wird nicht als Einzelobjekt an den Generator übergeben. Für erste Einzelbildversuche sind vorhanden:

| Form | Eingabe | Besondere Prüfaufgabe |
| --- | --- | --- |
| Tierform | `public/legacy/pakachi/frames/001.png` | Vier Gliedmaßen, Gesicht, Schwanzvolumen und Ringelung. |
| Humanoide Form | `docs/references/Pakachi-Endform-Stilanker.png` | Korrigiertes Fell, dunkle Gelenke, Hände und konsistente Kopf-/Schwanzproportionen. |

Tierform:

```powershell
npm run generate:model -- --run --repo "C:\KI\TripoSR" --python "C:\KI\TripoSR\.venv\Scripts\python.exe" --image "public/legacy/pakachi/frames/001.png"
```

Humanoide Form:

```powershell
npm run generate:model -- --run --repo "C:\KI\TripoSR" --python "C:\KI\TripoSR\.venv\Scripts\python.exe" --image "docs/references/Pakachi-Endform-Stilanker.png"
```

Jeder Lauf erhält einen neuen Ordner unter `generated/`. Dort liegen die unveränderte Eingabekopie, `generator.log`, `report.json` und bei erfolgreicher Erzeugung `result/0/mesh.glb`. Der Ordner wird nicht in Git aufgenommen. Ergebnisse werden weder in den Model Zoo veröffentlicht noch als Original-PaKaChi eingesetzt.

Der Generator kann beim ersten echten Lauf Modellgewichte und Hintergrundentfernungsdaten herunterladen. Die Bilder werden als lokale Dateien an den lokalen Prozess übergeben; der Adapter ruft keinen Cloud-Generierungsdienst auf. Er installiert keine Pakete automatisch. Der Python-Pfad muss zur eingerichteten TripoSR-Umgebung gehören.

Optionen: `--output ORDNER`, `--resolution 64..512` (Vorgabe 256), `--timeout SEKUNDEN` (Vorgabe 1800). `--device cpu` aktiviert ausdrücklich den CPU-Versuch, ohne Laufzeitgarantie. Ohne diese Angabe wird fehlendes CUDA als Blockade gemeldet, statt still auf CPU auszuweichen. Eine niedrigere Rekonstruktionsauflösung ist keine geprüfte Avatar-Qualitätsstufe.

## Ergebnis übernehmen oder verwerfen

1. Eine erfolgreiche GLB in den laufenden PaKaChi-Player ziehen.
2. Vorder-/Rückseite, Unterseite, Gesicht und Schwanz aus allen Richtungen ansehen; mit der jeweiligen Originalvorlage vergleichen.
3. Fehler aufschreiben: fehlende/verschmolzene Gliedmaßen, falsche Farben, Metall statt Fell, falsche Kopfgröße, abgeschnittener Schwanz, unpassende Rückseite.
4. Unbrauchbare Versuche behalten oder löschen; die Originalvorlagen und der aktuelle Avatar bleiben unverändert.
5. Erst ein visuell akzeptierter Entwurf kommt für Rigging in Frage. Danach Gelenke, Hautgewichte und Bewegungen separat prüfen.

Zwei separat generierte Formen ergeben **noch keine Transformation**. Dafür müssen Formwechsel, Körperteile, Topologie und Bewegungen aufeinander abgestimmt werden. Keiner dieser Schritte wird durch einen erfolgreichen GLB-Import automatisch abgenommen.

## Bericht und Grenzen der Prüfung

Der Bericht speichert Zeitstempel, Laufzeit, Eingabe-Hash, Hash der lokalen `run.py`, Python-/GPU-Angaben, Parameter und Ergebnisgröße. Die GLB wird mit dem produktiven Player-Lader geöffnet; Größe, Geometrie, endliche Vertexpositionen, Meshes, vorhandene Knochen und Clips werden erfasst. Grenzen: 20 MiB Eingabe, 50 MiB GLB, zwei Millionen Vertices.

`generated-unreviewed` heißt technisch geladen, **visuell ungeprüft**. `visualReview`, `rigReview` und `transformationReview` bleiben `pending`. `failed` enthält den Fehler; ein Exitcode 0 des Generators ohne gültige GLB reicht nicht aus.

Der gesamte Backend-Code und die Gewichte sind noch nicht auf feste Revisionen gepinnt. `report.json` weist die ungepinnte Gewichtsrevision aus. Die Berichte dienen der Nachvollziehbarkeit, garantieren aber keine bitidentische Wiederholung. Nach dem ersten erfolgreichen echten Versuch sollen funktionierende Backend-/Gewichtsstände festgehalten und beide Formen direkt verglichen werden.

## Tatsächlicher Nachweis in 0.12.0

- Umgebungsprüfung ausgeführt: Python vorhanden; TripoSR, PyTorch und weitere Generierungsabhängigkeiten fehlen, CUDA nicht verfügbar.
- Vier automatisierte Tests prüfen mit synthetischer Geometrie die echte Player-Ladung und mit simuliertem Backend den Ablauf, getrennte Ergebnisordner, Vorprüfungsblockaden und Fehlerberichte.
- **Nicht durchgeführt:** TripoSR-Inferenz, Qualitätsvergleich, anatomisches Rigging, 3D-Transformation, visuelle Freigabe.

## Lokaler Generierungsdienst seit 0.21.0

Für Entwickler verbindet `server/generation.mjs` den bestehenden Wrapper mit dem Auftragskern. Seit 0.22.0 ist der Dienst an die unten beschriebene Studio-Oberfläche angeschlossen. Installation, Python-Umgebung und Modellqualität unterliegen weiterhin den oben beschriebenen Voraussetzungen. Der Start installiert nichts und startet keine Inferenz. Der erste tatsächliche Auftrag kann weiterhin Gewichte herunterladen.

Beispiel für Bash, nach Einrichtung und Prüfung der TripoSR-Umgebung:

```bash
export PAKACHI_GENERATION_TOKEN="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
npm run serve:generator -- --repo /pfad/zu/TripoSR --python /pfad/zur/venv/bin/python --origin http://127.0.0.1:5173
```

Der Schlüssel wird nicht vom Dienst ausgegeben. Der aufrufende Client braucht denselben Token; nicht in Projektdateien oder Git speichern. Standardadresse: `http://127.0.0.1:8766`. Mit `--port`, `--output`, `--device cpu`, `--resolution` und `--timeout` lassen sich Port, Ergebnisordner, expliziter CPU-Betrieb, Rekonstruktionsauflösung und Prozesszeitlimit ändern. Voreinstellung: CUDA, Auflösung 256, 1800 Sekunden. Dienst-Zeitlimit höchstens 3600 Sekunden. Falls Vite einen anderen Port nutzt oder über `localhost` geöffnet wird, `--origin` exakt entsprechend setzen. Der Dienst bindet ausschließlich an IPv4-Loopback; kein LAN-/Cloud-Server.

| Anfrage | Vertrag |
| --- | --- |
| `GET /capabilities` | Mit `Authorization: Bearer TOKEN`; Protokoll `pakachi-generation-v1`, Modell `triposr`, Fähigkeit `image-to-3d`; keine Laufzeit-/GPU-Zusage. |
| `POST /generate` | Derselbe Header; Content-Type `image/png` oder `image/jpeg`, rohe Bildbytes bis 20 MiB. Keine Dateipfade, Shellbefehle oder Backendparameter aus dem Browser. |
| Erfolg | Eigenständige, durch den Wrapper geladene GLB, Content-Type `model/gltf-binary`, höchstens 50 MiB. Weiterhin visuell ungeprüft und ohne zugesichertes Rig. |
| Fehler | Generischer JSON-Fehler ohne Python-Pfade, Logs oder Zugangsdaten; 401 bei fehlendem Token, 403 bei falschem Origin/Host, 409 bei belegtem Generator, 413/415 bei unzulässiger Eingabe, 502 bei Backendfehlern. Details stehen lokal in vorhandenen Auftragsberichten. |

PNG-/JPEG-Signaturen werden vor dem Backend geprüft; die Bilddekodierung übernimmt anschließend TripoSR. Nur der konfigurierte Browser-Origin erhält CORS-Freigabe. CLI-Clients ohne Origin brauchen ebenfalls den Token. Die Hostprüfung erwartet `127.0.0.1:PORT`. Pro Dienst gibt es einen aktiven Auftrag und keine Warteschlange. Beim Verbindungsabbruch wird der Prozessabbruch ausgelöst; ein vollständiger Stopp möglicher Kindprozesse wird nicht zugesichert. Temporäre Uploadordner werden nach dem Auftrag entfernt; Quellenkopien, Berichte und Modelle bleiben wie beim bisherigen CLI unter `generated/` erhalten.

Der Browseradapter `createLocalGenerationAdapter` kann in einer eigenen `ProviderRegistry` registriert werden; [Auftragsvertrag](AUFTRAE.md#lokaler-fachadapter). Er prüft Zieladresse, Modell, Protokoll, Antwortgröße und GLB-Header; die verpflichtende vollständige Ergebnisprüfung bleibt beim Auftrag. Der aktuelle Adapter unterstützt ausschließlich diesen lokalen Vertrag, keine beliebigen Dienste mit dem Namen `custom-generation`. Cloud-Fachadapter bleiben separat zu implementieren.

**Nachweis:** Echter Loopback-HTTP-Verkehr vom Adapter durch den Dienst und den bestehenden Wrapper bis zur GLB-Prüfung; das Python-Inferenzbackend wird im Test durch eine synthetische Dreiecksdatei ersetzt. Damit sind weder TripoSR-Ausgabequalität, GPU-Betrieb noch Browser-CORS-/WebGL-Bedienung live abgenommen. Die sichtbare Bildauswahl mit getrennter Ergebnisvorschau und ausdrücklicher Übernahme wurde in 0.22.0 ergänzt.

## Bedienung im Studio seit 0.22.0

1. Dienst wie oben starten; den Browser über den exakt als `--origin` konfigurierten lokalen Host öffnen.
2. In **Optionen** die Vorlage **TripoSR (lokal)** wählen. Sie trägt `http://127.0.0.1:8766` ein und setzt bei leerem Modellfeld `triposr`. Einen Profilnamen und den Dienst-Token im Schlüssel-/Tokenfeld eintragen, speichern und der Rolle **3D-Generator** zuordnen. Die allgemeine Modelllistenabfrage ist für diesen Fachadapter noch nicht implementiert; die Modell-ID ist bekannt.
3. **Avatar-Studio → Bild → 3D-Entwurf** öffnen. Ein PNG/JPEG auswählen oder ins Fenster ziehen. Bilder bis 20 MiB; die Auswahl allein sendet nichts.
4. **3D-Entwurf erzeugen** prüft die angezeigte Route und startet höchstens einen Generierungsauftrag. Automatische Fallbacks gelten nur vor Ausführungsbeginn (siehe unten); kein zusätzlicher Assistentenaufruf. Phasen werden angezeigt, keine erfundenen Prozentangaben.
5. Die separate Vorschau mit der Maus drehen und zoomen. Das bestehende Modell bleibt währenddessen erhalten. **Ergebnis verwerfen** entfernt den Entwurf; **Als neuen Avatar laden** importiert ihn nach erneutem Vergleich des Projektstands. Ein zwischenzeitlich verändertes Projekt muss durch einen neuen Auftrag berücksichtigt werden.

Vorhandenes Projekt vor der Übernahme speichern. Der neue Avatar ersetzt den geladenen Projektstand. Seit 0.23.0 stellt **Modellwechsel zurück** den vorherigen Stand wieder her; **Modellwechsel wiederholen** kehrt zum Entwurf zurück. Es wird nur der letzte Modellwechsel während dieser Seitensitzung gehalten. Ungespeicherte Änderungen werden durch die bisherige Rückfrage geschützt. Änderungen während der asynchronen Importvorbereitung oder eine inzwischen gesperrte Sitzung verhindern die Übernahme. Der Original-PaKaChi im Model Zoo wird nicht verändert und bleibt auswählbar.

**Abbrechen** beendet das lokale Warten; ein vollständiger Stopp des Dienstes ist nicht bestätigt. Anbieter-/Schlüsselwechsel und Tresorsperre verwerfen laufende Aufträge und Vorschauen. Deutsch/English folgt der Optionssprache. TripoSR liefert einen Geometrieentwurf ohne zugesichertes Rig; ein Korrekturprompt und automatische Anatomieerkennung sind nicht Teil dieses Verfahrens.

Die DOM-Bedienlogik und echte GLB-Prüfung sind automatisiert getestet. Ein zusätzlicher Playwright-Ablauftest ist vorhanden, konnte hier jedoch wegen fehlender Chromium-Programmdatei nicht starten (0.22.0); in 0.24.0 wurde Chromium installiert, scheitert hier aber beim Start an einer Socket-Beschränkung. Echte GPU-Inferenz und gerenderte Browserabnahme sind weiterhin ausstehend.

Seit 0.24.0 bleibt die alte 3D-Editorsitzung bis zur erfolgreichen Übergabe erhalten. Ein Fehler während der Vorbereitung/Veröffentlichung verwirft nur den Kandidaten beziehungsweise setzt den bisherigen Stand wieder ein. Der Entwurf kann anschließend erneut übernommen oder verworfen werden.

## Generator-Fallbacks (0.25.0)

Die Studio-Oberfläche zeigt vor dem Start die vollständige konfigurierte Generatorroute. Profile, Reihenfolge, Bild, Zielrevision und Schlüssel je Profil werden für diesen Versuch festgehalten. Nicht unterstützte oder nicht erreichbare Profile werden ausschließlich während der Fähigkeitsprüfung übersprungen. Jede Prüfung hat ein Zeitlimit von zehn Sekunden; verspätete Antworten starten keinen Auftrag. Unmittelbar vor der Ausführung wird die Studio-Zielrevision erneut geprüft.

Nach Beginn einer Generierung gibt es keinen automatischen weiteren Auftrag, auch nicht bei Zeitlimit oder ungültigem Ergebnis. Falls weitere Profile vorhanden sind, bietet **Nächsten Anbieter versuchen** einen ausdrücklich ausgelösten neuen Versuch mit der verbleibenden Route an. Der vorherige Dienst könnte noch arbeiten. Ein Fehler beim Anzeigen der Vorschau bietet keinen Anbieterwechsel an. Projektänderungen sperren die Wiederholung; Änderungen an Profilen/Schlüsseln, Tresorsperre, Abbruch oder Bildwechsel verwerfen sie.

Der ausführbare Fachadapter bleibt der lokale TripoSR-Dienst. Cloud-Generatoren und automatische Rigging-Dienste sind damit noch nicht implementiert. Bestehende Profile und gespeicherte Schlüssel werden nicht gelöscht.
