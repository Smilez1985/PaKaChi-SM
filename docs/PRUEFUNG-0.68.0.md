# Prüfbericht 0.68.0

Zeitstempel: 2026-10-29T19:35:45+01:00 (Europe/Berlin)

Entwicklungsmeilenstein auf dem Arbeitsbranch, noch nicht in main. Model-Zoo-Fehlerbehandlung, lokale Prüfkommandos und Dokumentationsfilter sind gebündelt. Letzter lokaler Nachweis vor der Dokumentationspflege: 290 Node-Tests und Build bestanden. Finale Prüfung des Meilensteins folgt unten. Chromium-Nachweis und reale Browserkontingente bleiben offen.

## Ergebnis

- `npm run verify`: 291 Node-Tests und TypeScript-/Produktionsbuild bestanden.
- Nach Ergänzung der ausdrücklichen Bildtextur-Abweisung: gezielter CLI-Regressionstest erneut bestanden, einschließlich ungültigem Projekt, Bildtexturen, unveränderten Quelldateien und wiederholbarer Rekonstruktion.
- Node-Tests simulieren Model-Zoo-Kontingent-/Listenfehler und Tab-Ereignisse; reale Browserquoten bleiben offen.
- Bekannte Warnung zum großen JavaScript-Bundle bleibt bestehen.
- Keine neuen Actions-Läufe, kein neuer Chromium-Nachweis. Version 0.68.0 ist ein Entwicklungsmeilenstein auf dem Arbeitsbranch, keine vollständige Browserfreigabe.

## Importmessung

Mika mit 256 Gewichtsaufträgen, drei getrennte Node-Prozesse: CPU-Importzeiten 1922.96, 1940.57, 1901.99 ms; Median **1922.96 ms**. Rig-Aufbau einschließlich Wiederherstellung des Verlaufs: 1758.21, 1779.44, 1743.1 ms. Projekt- und Skin-Prüfsummen sind zwischen den Messungen identisch.

Einzelner lokaler Hardware-/Laufzeitstand; kein Vorher/Nachher-Vergleich und keine allgemeine Laufzeitzusage. Die erzeugte Mika-Projektkopie enthält keine Bildtexturen. UI, WebGL, Browserdatenbank und Zeit bis zum sichtbaren Bild sind ausgeschlossen. Große eigene Projekte und texturierte Modelle bleiben zu messen. [Rohdaten](benchmarks/project-import-0.68.0.json) · [Messvertrag](IMPORT-BENCHMARK.md).

## Dokumentationsabgleich

README, Design, Blaupausenindex, Roadmap, Changelog und Prüfstand sind abgeglichen. Paket und Lockdatei tragen 0.68.0. Erledigte Roadmap-Historie ist entfernt; zuvor offene Aufgaben sind erhalten. Das Changelog verwendet Unreleased, einen datierten Versionsabschnitt, passende Änderungskategorien und zusätzlich einen ISO-8601-Zeitstempel mit Europe/Berlin-Zeitzone.
