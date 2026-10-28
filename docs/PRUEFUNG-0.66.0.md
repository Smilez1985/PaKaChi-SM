# Prüfbericht 0.66.0

**0.66.0:** Der Sichtfilter kopiert nur UV-Kanäle, die tatsächlich von unterstützten Alpha-Materialien benötigt werden. Undurchsichtige Dreiecke erhalten keine eigenen UV-Vektoren. Die Sichtregeln und gespeicherten Projekte bleiben unverändert. `npm run benchmark:visibility` misst synthetische Flächen mit 5.000/20.000/80.000 Dreiecken, jeweils undurchsichtig und mit Alpha-Ausschnitt; jeder Fall läuft in einem eigenen Prozess.

286 Node-Tests und Produktionsbuild lokal bestanden. Neuer Chromium-Nachweis steht aus.

Lokale Einzelmessung bei 80.000 Dreiecken: zurückbehaltener JavaScript-Heap einschließlich Testmodell von 166,10 auf 64,85 MiB (undurchsichtig) und 166,12 auf 100,20 MiB (Alpha). Die 1.000 Strahlproben lieferten jeweils dieselben Ergebnisse. Keine Messung des vollständigen Browserimports, Renderings oder Skinning; keine allgemeine Laufzeit-/Speicherzusage. Mipmaps, Teiltransparenz und manuelle Abnahme großer realer Modelle bleiben offen.

## Lokaler Vorher-/Nachher-Vergleich

Node v24.22.1, frischer Prozess pro Fall mit expliziter Garbage Collection. Speicherwerte enthalten das synthetische Quellmodell. Einzelmessungen, kein statistischer Benchmark. Die erste Strahlabfrage enthält den Aufbau des Suchbaums.

| Dreiecke | Material | Heap vorher/nachher (MiB) | Erste Abfrage vorher/nachher (ms) | Sichtbar von 1.000, vorher/nachher |
| --- | --- | --- | --- | --- |
| 5000 | opaque | 10.85 / 4.16 | 40.5 / 29.6 | 0 / 0 |
| 5000 | alpha-cutout-uv2 | 10.55 / 6.44 | 39.8 / 32.7 | 502 / 502 |
| 20000 | opaque | 41.86 / 16.63 | 186.9 / 101 | 0 / 0 |
| 20000 | alpha-cutout-uv2 | 41.67 / 25.18 | 155.8 / 141.8 | 502 / 502 |
| 80000 | opaque | 166.1 / 64.85 | 518.6 / 411.6 | 0 / 0 |
| 80000 | alpha-cutout-uv2 | 166.12 / 100.2 | 564.1 / 481.6 | 502 / 502 |

Rohdaten: [vorher](benchmarks/visibility-0.65.0.json), [nachher](benchmarks/visibility-0.66.0.json). Aufruf: `npm run benchmark:visibility`. Kein automatischer Zeitgrenzwert, weil Laufzeit und Garbage Collection hardwareabhängig sind.

Der erste lokale Testlauf meldete eine abweichende Kopie von Originalframe `034.png`. Das Bild auf GitHub wurde anhand seiner SHA-256-Prüfsumme verifiziert, die lokale Abweichung gesichert und die lokale Kopie wiederhergestellt. Der erneute vollständige Lauf besteht alle 286 Tests einschließlich der 83 Originaldateien und 72 Transformationsbilder. Keine Avatar-Binärdatei ist Bestandteil dieses Meilenstein-Commits.
