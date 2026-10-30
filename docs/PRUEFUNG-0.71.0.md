# Prüfbericht 0.71.0

Zeitstempel: 2026-10-30T09:42:50+01:00 (Europe/Berlin)

## Messung und Regression

Vorher-/Nachher-Messung mit identischem Mika und identischem Benchmark: jeweils neun eigene Prozesse, drei Wiederholungen pro Fall. Alle Positionen-/Normalen-Prüfsummen stimmen zwischen den beiden Implementierungen überein. Bei allen betroffenen Meshes sinken die Medianzeiten pro Prozess von 24,94–26,86 ms auf 13,10–16,93 ms. Festgehaltener ArrayBuffer-Zuwachs weiterhin rund 8,34 MiB. [Rohdaten und Messvertrag](TRANSITION-BENCHMARK.md).

Ein neuer Regressionstest ändert die Zielgeometrie in jedem Übergangsschritt und vergleicht zusammenhängende Float32-Attribute mit verschachtelten Attributen. Zielzustände werden korrekt wiederhergestellt, die Ausgangsgeometrie bleibt unabhängig, benachbarte Datenfelder bleiben unverändert und Normalen stimmen überein. Die bisherigen Tests für Pause, Abbruch, erneuten Wechsel, Skinning, freie Punkte und Geometriewechsel bleiben erhalten.

## Lokale Prüfung

`npm run verify` erfolgreich: **301 Node-Tests bestanden, 0 fehlgeschlagen**. TypeScript-Prüfung und Produktionsbuild bestanden. Der Build meldet weiterhin das große JavaScript-Bundle (rund 1,39 MB / 385 kB gzip).

## Grenzen

Keine neue gerenderte Browserabnahme. CPU-Messung ohne Modellladen, Animator/IK, UI oder WebGL; keine allgemeine Bildratenzusage. Speicher-Momentaufnahmen sind keine Spitzenwerte. Große reale Importmodelle und sichtbare Qualität bleiben offen. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.
