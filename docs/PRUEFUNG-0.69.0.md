# Prüfbericht 0.69.0

Zeitstempel: 2026-10-29T21:13:59+01:00 (Europe/Berlin)

## Lokale Ergebnisse

294 Node-Tests und Produktionsbuild bestanden. Drei neue Tests prüfen:

- Zwischenwerte für Position, Quaternion-Rotation, Skalierung und Morph-Gewichte; exakte Wiederherstellung der Zielmatrix und ihrer Aktualisierungsart, Pause, wiederholter Wechsel und Abbruch.
- Direkter Wechsel bei geänderter Hierarchie oder Schertransformation.
- Originalclip → Studio-Move → Originalclip mit echtem Three.js-Skelett und Skinning, Hautposition ohne Sprung am Start, Pause, Zeitleistensprung und automatische Rückkehr zur Grundbewegung; unveränderte Projektdaten und Dirty-Status. Studioeintritt beendet den Übergang; freie Oberflächenpunkte und bearbeitete Knochen-Grundstellung sind ausgeschlossen.

Die Ergänzung der Ausschlussfälle wurde zusätzlich im gezielten Testlauf geprüft. Die bekannte Bundle-Größenwarnung bleibt bestehen.

## Grenzen

Kein neuer Chromium-/WebGL-Nachweis, keine manuelle Bewertung des Übergangs. Die Tests laufen mit Three.js und happy-dom, nicht mit einem Renderer. Die erste Stufe unterstützt keine bearbeiteten Grundskelette, Gewichtsumbauten oder freien Oberflächenpunkte; dort bleibt der direkte Wechsel bestehen. Der alte Original-PaKaChi-Bildplayer und seine 72 Transformationsbilder werden nicht geändert.

Entwicklungsmeilenstein auf `work/local-verification-model-zoo`; main unverändert. Keine Actions gestartet.
