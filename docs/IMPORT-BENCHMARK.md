# Projektimport auf der CPU messen

Seit 0.68.0 ergänzt `npm run benchmark:import` die bisherigen Rig-Reset- und Sichtprüfungsbenchmarks. Er misst einen CPU-Importpfad mit den produktiven Projekt-, Modell- und Rig-Funktionen. Er ist kein vollständiger Browserimport.

## Aufruf

Nach `npm ci` mit Node.js ab Version 24:

```sh
npm run benchmark:import
npm run benchmark:import -- --runs 3 --transfers 1024
npm run benchmark:import -- --project "mein-avatar.pakachi.json" --runs 3
```

Ohne Datei wird eine temporäre Mika-Projektkopie mit standardmäßig 256 Gewichtsaufträgen erstellt. Zulässig sind 0–1024 Aufträge und 1–10 Wiederholungen. Jede Messung verwendet einen neuen Node-Prozess; temporäre Dateien werden anschließend entfernt. `--transfers` ist bei einer eigenen Projektdatei ausgeschlossen. Quelldateien werden nur gelesen.

Für einen direkt maschinenlesbaren Bericht ohne npm-Kopfzeilen:

```sh
node scripts/benchmark-project-import.mjs --runs 3 > import-messung.json
```

Der Bericht enthält keine Projektinhalte oder Schlüssel, sondern Größen, Geometriezahlen, SHA-256-Prüfsummen, Zeiten und Laufzeit-/CPU-Angaben. Er sollte vor Weitergabe auf unerwünschte Hardwareinformationen geprüft werden.

## Messphasen und Grenzen

| Feld | Gemessener Schritt |
| --- | --- |
| `readMs` | Dateigröße prüfen und Projektdatei lesen |
| `jsonMs` | JSON dekodieren |
| `validateMs` | Studio-Projekt prüfen und kopieren |
| `decodeMs` | Eingebettetes Modell aus Base64 dekodieren |
| `modelParseMs` | Eigenständiges glTF/GLB prüfen und mit dem produktiven Loader laden |
| `normalizeMs` | Figurenmaß und Bodenposition über einen Elternknoten normalisieren, entsprechend der Viewer-Normalisierung |
| `rigBuildReplayMs` | StudioRig aufbauen und gespeicherten Knochen-/Gewichtsverlauf rekonstruieren |
| `draftMs` | Optional vorhandene Bearbeitungspose anwenden |
| `totalMs` | Gesamter gemessener CPU-Ablauf einschließlich Zwischenarbeit, vor Prüfsummen und Freigabe |

Der Bericht gibt alle Wiederholungen und den Median aus. Projekt- und Skin-Prüfsummen müssen zwischen Wiederholungen identisch sein. Das prüft Wiederholbarkeit, keine anatomische Qualität. Mesh-/Vertexzahlen zählen pro Mesh-Instanz, nicht ausschließlich eindeutige Geometriepuffer. Heap-Differenz und RSS sind Momentaufnahmen, keine Spitzen- oder dauerhaft belegten Speicherwerte.

Ausgeschlossen sind Prozessstart, Erzeugung der Testdatei, Prüfsummenberechnung, Freigabe, Benutzeroberfläche, IndexedDB, WebGL und Rendering. Der Betriebssystem-Dateicache kann bereits warm sein. Bildtexturen werden ausdrücklich abgewiesen, da diese Node-Messung die Browserdekodierung und Alpha-Auswertung solcher Modelle nicht nachweisen kann. Externe Modellressourcen bleiben durch den produktiven Loader gesperrt. Projektlimit: 80 MiB, eingebettetes Modell: 50 MiB.

Ein Durchlauf hat höchstens fünf Minuten Zeit; bei Fehlern endet das Werkzeug mit Fehlerstatus und ohne erfolgreichen JSON-Bericht. Es gibt keine hardwareunabhängige Bestehensgrenze für Laufzeiten. Große reale Projekte, texturierte Modelle und die Zeit bis zum sichtbaren Browserbild bleiben eigene Abnahmeaufgaben.

## Referenzmessung

Die [Rohdaten von 0.68.0](benchmarks/project-import-0.68.0.json) enthalten drei lokale Messungen des mitgelieferten Mika mit 256 Gewichtsaufträgen. Sie sind eine Ausgangsmessung, kein Vorher/Nachher-Nachweis einer Beschleunigung. Ergebnisse und Prüfstand stehen im [Versionsbericht](PRUEFUNG-0.68.0.md).
