# Lokaler Bild-zu-3D-Testlauf – 0.12.0

**Experimentelles Entwicklerwerkzeug, noch keine Generierungsfunktion in der Studio-Oberfläche.** Es wurde hier kein KI-Modell erzeugt. Vorprüfung und Ablauf sind getestet; für echte Inferenz fehlt in der Ausführungsumgebung die eingerichtete Python-/CUDA-Pipeline. Anatomisches Rigging, beide 3D-Formen und ihre Transformation bleiben offen.

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
