# Prüfbericht 0.69.1

Zeitstempel: 2026-10-29T21:45:22+01:00 (Europe/Berlin)

## Gezielte Prüfung

Acht Wiedergabetests bestanden, davon zwei neue Regressionstests. Ein 50-ms-Originalclip endet vor der 180-ms-Überblendung: Die Zielpose wird trotzdem vollständig erreicht. Vorheriges manuelles Pausieren friert die sichtbare Pose ein. Wiederholen startet neu; Zeitleistensprung löst den Abschlusszustand. Ein Übergang ohne Grundclip endet auch bei pausiertem leerem Transport; Tempo und ungültige Framezeiten sind geprüft.

Die Berechnung der Übergangszeit wird von Anwendung und Tests gemeinsam verwendet. Bestehende Skinning-, Transformations-, Morph-, Hierarchie- und Datenunverändertheitsprüfungen bestehen weiterhin.

## Gesamtprüfung

`npm run verify`: **296 Node-Tests und TypeScript-/Produktionsbuild bestanden**.

## Grenzen

Node/Three.js und happy-dom, kein gerenderter Browsernachweis. Die Ausschlüsse aus 0.69.0 für bearbeitete Rigs bleiben bestehen. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.
