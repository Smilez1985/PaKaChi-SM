# Prüfbericht 0.69.2

Zeitstempel: 2026-10-30T07:18:04+01:00 (Europe/Berlin)

## Fehler und Nachweis

Zwei neue Regressionstests scheiterten zunächst am unveränderten Stand 0.69.1:

- Ein 50-ms-Originalclip erreichte bei einer 180-ms-Mixer-Überblendung zwar sein zeitliches Ende, behielt aber Restgewicht des vorherigen Clips.
- Ein Zeitleistensprung während der Mischung zeigte nicht ausschließlich die gewünschte Zielpose.

Nach der Korrektur bestehen alle zehn gezielten Playback-/Übergangstests. Sie prüfen vollständige Endpose, unveränderte Endzeit, Wiederholen, manuelle Pause und anschließendes Weiterspielen. Die bisherigen Studio-/Skinning-Übergangstests bleiben erfolgreich.

## Gesamtprüfung

`npm run verify`: **298 Node-Tests und TypeScript-/Produktionsbuild bestanden**.

## Grenzen

Node/Three.js und happy-dom; keine neue Chromium- oder visuelle Qualitätsabnahme. Die Ausschlüsse aus 0.69.0 für bearbeitete Rigs bleiben bestehen. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.
