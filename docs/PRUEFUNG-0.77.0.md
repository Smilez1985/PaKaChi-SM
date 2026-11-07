# Prüfbericht 0.77.0

Zeitstempel: 2026-11-07T01:14:27+01:00 (Europe/Berlin)

## Implementierung und lokale Prüfung

Statische GLB-Ausgabe der sichtbaren Figur mit gebackener Haut-/Morph-Verformung und Welttransformation. Geometriekopien erhalten UVs und Materialeigenschaften; Spiegelungen korrigieren die Dreiecksorientierung. Unsichtbare Zweige werden übersprungen. Kein Rig, keine Animationen, kein Retargeting. Instanzen und teilweise ausgeblendete Materialgruppen werden abgewiesen.

`npm run verify`: 314 Node-Tests bestanden, 0 fehlgeschlagen; TypeScript und Produktionsbuild erfolgreich. Neue Tests prüfen tatsächliche Vertexpositionen nach Skinning/Morphing/Spiegelung, Quellschutz, Materialkopien und nicht unterstützte Eingaben. Bekannte Bundle-Warnung bleibt; GLTFExporter wird als eigener Chunk erst bei Bedarf geladen.

Browserfall: Mika verschieben/vergrößern, GLB herunterladen, Header und selbst enthaltenen Buffer sowie fehlende Rig-/Clipdaten prüfen, Projektzustand vergleichen und Datei erneut laden. Aktueller CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

## Grenzen

Keine allgemeine Material-/Texturqualitätsabnahme. Statische Form; für Bearbeitung Studio-Projekt zusätzlich speichern. Manuelle anatomische Bewegungsabnahme bleibt offen.
