# Prüfbericht 0.81.0

Zeitstempel: 2026-11-07T11:46:22+01:00 (Europe/Berlin)

## Browserimport messen

Das neue Kommando baut einmal eine temporäre Produktionsausgabe und startet einen Server ausschließlich auf 127.0.0.1. Drei Messungen mit Mika/256 Gewichtsaufträgen sind voreingestellt; eigene Studio-Projektdateien und 1–10 Wiederholungen werden unterstützt. Pro Sample ein neuer Browserkontext; keine Änderung an Quelldateien, bestehenden Benutzerprofilen oder Produktcode.

Die Messsonde wird ausschließlich vom Benchmark injiziert. Sie startet vor dem produktiven change-Handler des Projektdateifelds, misst File.text, beobachtet die Bereitschaft des neu installierten Avatars und prüft echte WebGL2-Zeichenaufrufe auf dessen neuem Canvas. Eine folgende Animationsframe-Grenze beendet die Messung. Der noch sichtbare Vorgängeravatar darf keinen erfolgreichen Messwert erzeugen. Fehler und Kontextverlust werden abgewiesen; SHA-256 vor/nach jedem Durchlauf schützt den Nachweis unveränderter Eingaben. Die Sonde verändert keine Rig-/Projektfunktionen.

## Nachweise

- Lokal: 325 Node-Tests bestanden, 0 fehlgeschlagen/übersprungen; TypeScript und Produktionsbuild bestanden.
- Lokaler Chromium-Start und Produktionsbenchmark versucht: Browser beendet sich vor dem Teststart mit `socket() failed: Operation not permitted`. Kein lokaler Browser- oder Laufzeitnachweis daraus abgeleitet.
- Neuer Chromium-Fall misst einen selbst enthaltenen PNG-Texturimport zweimal, prüft Bilddekodierung, Messreihenfolge, neuen Canvas, Quelldateiprüfsumme und unveränderte Datei. Zweiter Fall prüft den Fehlerpfad bei ungültigem Projekt mit vorhandenem Vorgängeravatar.
- CI für Commit `7c706bb480f1562f7d60186c76103bd15fe7802e`: **325 Node-Tests, TypeScript/Build, alle 31 Chromium-Fälle (6,3 Minuten) und drei Produktionsmessungen bestanden**. [Lauf 42365460756](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42365460756) · [Browserartefakte](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42365460756/artifacts/13571608579). Job-Schritte und vollständige Logs geprüft; kein übersprungener oder nach Wiederholung bestandener Browserfall.
- Ergebnisabgleich: 2026-11-07T11:58:34+01:00. Der Screenshot `textured-import.png` zeigt die vollständig gerenderte grüne Testdreiecksfläche; beide Textur-Samples enthalten genau eine erfolgreich dekodierte ImageBitmap. Das ist ein konkreter Textur-/Rendernachweis, keine allgemeine visuelle Qualitätsabnahme.
- Die PNG-Testvorbereitung erzeugt das Bild anschließend direkt im leeren Fixture-Tab. Dadurch läuft während der beiden eigentlichen Messungen kein zusätzlicher Originalplayer als unnötige Konkurrenz. Prüfungen und Zeitlimits bleiben erhalten. Der vollständige CI-Nachweis des abschließenden Dokumentations-/Teststands wird am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verlinkt.

## Referenzmessung

[Unveränderte JSON-Rohdaten](benchmarks/browser-import-0.81.0.json) aus dem genannten Lauf: Mika mit 256 Gewichtsaufträgen, 979.550 Byte Projektgröße, drei neue Browserkontexte, Chromium 141.0.7390.37, Node v24.22.2, Linux x64, AMD EPYC 9V74, erzwungenes Software-WebGL.

| Sample | Datei lesen | Avatar bereit | Erste Zeichnung | Folgende Frame-Grenze |
| --- | --- | --- | --- | --- |
| 1 | 7,3 ms | 3.090,2 ms | 3.180,2 ms | 3.275,3 ms |
| 2 | 5,2 ms | 3.236,6 ms | 3.321,5 ms | 3.374,4 ms |
| 3 | 5,4 ms | 3.247,2 ms | 3.334,6 ms | 3.387,9 ms |

Median der Frame-Grenze: **3.374,4 ms**. Alle drei Eingabeprüfsummen stimmen überein. Mika selbst enthält keine Bildtexturen; deren Dekodierung ist separat durch die oben beschriebene PNG-Regression nachgewiesen. Das ist eine Referenzmessung, kein Vorher/Nachher-Nachweis einer Optimierung und keine Zusage für große reale Figuren oder die Hardware des Nutzers.

## Grenzen

[Metriken, Aufruf und Grenzen](IMPORT-BENCHMARK.md). Enthalten: produktives Lesen/Validieren/Dekodieren, Texturen, Rig-Replay, UI und WebGL-Zeichnungsabgabe. Nicht enthalten: Dateiauswahl, Playwright-Dateiübertragung, Programm-/Serverstart, IndexedDB-Speicherung, GPU-Fertigstellung oder physische Anzeige. Browserprozess sowie OS-/GPU-Treibercaches können warm sein. Software-WebGL wird ausdrücklich ausgewiesen; kein Nachweis für die Ziel-GPU, große reale Modelle, anatomische Hautqualität oder manuelles Mausgefühl.

Projektformat bleibt Version 1. Keine bestehenden Tests übersprungen und keine bestehenden Zeitlimits erhöht. Bekannte Bundle-Größenwarnung bleibt.
