# Projektimport auf CPU und im Browser messen

Seit 0.81.0 ergänzt der Browserbenchmark den CPU-Pfad um den produktiven Dateiimport, Texturdekodierung, UI und WebGL-Zeichnung. Beide Werkzeuge geben Messwerte aus; es gibt keine allgemeine Bestehensgrenze für Geschwindigkeit.

## Produktionsbrowser

Nach `npm ci` und einmalig `npx playwright install chromium` (bei fehlenden Linux-Bibliotheken `npx playwright install --with-deps chromium`):

```sh
npm run benchmark:browser-import
npm run benchmark:browser-import -- --project "mein-avatar.pakachi.json" --runs 3
npm run benchmark:browser-import -- --transfers 1024 --runs 3 --renderer default
```

Das Werkzeug baut eine temporäre Produktionsausgabe, startet sie auf einer freien Loopback-Adresse und öffnet Chromium. Jeder Durchlauf verwendet einen frischen Browserkontext ohne vorherige Auswahl, Zugangsdaten oder IndexedDB-Daten. Die Anwendung und der anfängliche Mika-Avatar werden vor der Messung geladen. Der Projektimport läuft über dasselbe Dateifeld wie in der Oberfläche; danach beobachtet eine injizierte Sonde den neuen Avatar und dessen WebGL2-Canvas. Produktcode und Quelldateien werden nicht verändert.

Standard: drei Durchläufe, temporäres Mika-Projekt mit 256 Gewichtsaufträgen, Software-WebGL (SwiftShader). Zulässig: 1–10 Durchläufe und 0–1024 Gewichtsaufträge; `--transfers` darf nicht mit `--project` kombiniert werden. `--renderer default` verwendet die Browserkonfiguration ohne erzwungenes SwiftShader; auch dann können Treiber auf Software zurückfallen. Der Bericht nennt Modus, WebGL-Renderer, Browser, CPU und Viewportgröße.

Der Browserbenchmark unterstützt selbst enthaltene glTF-/GLB-Modelle einschließlich eingebetteter Bildtexturen innerhalb einer Studio-Projektdatei. Externe Modellressourcen bleiben durch den produktiven Loader gesperrt. Es gelten dieselben 80-MiB-Projekt- und 50-MiB-Modellgrenzen. Fehlerhafte Importe, Browserfehler, Kontextverlust, fehlende Renderaufrufe und während der Messung geänderte Quelldateien brechen mit Fehlerstatus ab. Pro Import gilt ein festes Wartebudget von 60 Sekunden; ein Abbruch ist kein erfolgreicher Geschwindigkeitswert.

Maschinenlesbare Ausgabe ohne npm-Kopfzeile:

```sh
node scripts/benchmark-browser-import.mjs --runs 3 > browser-import-messung.json
```

| Feld je Sample | Messung |
| --- | --- |
| `fileReadMs` | Dauer von `File.text()` im produktiven Import |
| `readyMs` | Zeit ab Dateifeld-change bis zur fertigen Installation des neuen Avatars |
| `firstDrawMs` | Zeit ab change bis zum ersten echten WebGL-Zeichenaufruf auf dem neuen Canvas |
| `frameBoundaryMs` | Zeit ab change bis zur folgenden Animationsframe-Grenze nach diesem Zeichenaufruf |
| `drawCalls` | Beobachtete Zeichenaufrufe bis zu dieser Grenze; keine FPS-Messung |
| `imageBitmapsDecoded` | Während des Imports erfolgreich erzeugte ImageBitmaps; kein allgemeiner Zähler aller Texturtypen |
| `projectSha256`, `projectBytes` | Identität und Größe der unveränderten Eingabe |

`medianFrameBoundaryMs` fasst die Wiederholungen zusammen. Alle Zeitpunkte stammen aus derselben Browseruhr. Der Start liegt vor dem produktiven change-Handler; die Playwright-Dateiübertragung zum Eingabefeld und das Öffnen des Dateidialogs zählen nicht mit. Enthalten sind Dateilesen, JSON-/Modell-/Texturdekodierung, Rig-Replay, UI-Installation und WebGL-Zeichnungsabgabe. Die folgende Animationsframe-Grenze enthält auch die Wartezeit bis zum nächsten Frame. Sie beweist weder abgeschlossene GPU-Arbeit noch eine physisch angezeigte Bildschirmseite. Kein `gl.finish()` verändert den gemessenen Renderpfad.

Build, Server-/Browser-/Anwendungsstart, anfängliches Mika-Laden, Prüfsummen und IndexedDB-Speicherung sind ausgeschlossen. Die Browserkontexte sind neu; der Chromium-Prozess und OS-/GPU-Treibercaches können warm bleiben. Werte nur bei gleicher Hardware, Rendererwahl, Projektprüfsumme und vergleichbarer Last vergleichen. Der Bericht enthält Hardwareangaben, keine Quelldaten oder Zugangsschlüssel. Große reale Projekte und Zielhardware bleiben separat zu prüfen.

Actions führt nach den Browserregressionen drei Produktionsmessungen mit Mika/256 Gewichtsaufträgen aus und legt `test-results/browser-import-benchmark.json` im Artefakt `browser-evidence` ab. Die Texturregression verwendet ein kleines eingebettetes PNG-Modell; das ist keine allgemeine Qualitätsabnahme großer Texturen. [Prüfbericht](PRUEFUNG.md#version-0810).

## Browser-Referenzmessung

Die [Rohdaten von 0.81.0](benchmarks/browser-import-0.81.0.json) stammen aus drei Produktionsbrowser-Importen im [CI-Lauf 42365460756](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42365460756): Mika mit 256 Gewichtsaufträgen, Software-WebGL, AMD-EPYC-Runner. Median bis zur folgenden Frame-Grenze: 3.374,4 ms. Eine Referenz, kein Nachweis einer Beschleunigung. Die separate PNG-Regression bestätigt Bilddekodierung und tatsächliche Darstellung; das Mika-Messmodell ist untexturiert. [Einzelwerte und Grenzen](PRUEFUNG.md#version-0810).

## CPU-Pfad

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

Ein CPU-Durchlauf hat höchstens fünf Minuten Zeit; bei Fehlern endet das Werkzeug mit Fehlerstatus und ohne erfolgreichen JSON-Bericht. Es gibt keine hardwareunabhängige Bestehensgrenze für Laufzeiten. Texturierte Modelle und WebGL-Zeiten misst das oben beschriebene Browserwerkzeug; große reale Projekte und die physisch sichtbare Bildausgabe bleiben eigene Abnahmeaufgaben.

## Referenzmessung

Die [Rohdaten von 0.68.0](benchmarks/project-import-0.68.0.json) enthalten drei lokale Messungen des mitgelieferten Mika mit 256 Gewichtsaufträgen. Sie sind eine Ausgangsmessung, kein Vorher/Nachher-Nachweis einer Beschleunigung. Ergebnisse und Prüfstand stehen im [Versionsbericht](PRUEFUNG.md#version-0680).

