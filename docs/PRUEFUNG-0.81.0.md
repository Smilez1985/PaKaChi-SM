# Prüfbericht 0.81.0

Zeitstempel: 2026-11-07T11:46:22+01:00 (Europe/Berlin)

## Browserimport messen

Das neue Kommando baut einmal eine temporäre Produktionsausgabe und startet einen Server ausschließlich auf 127.0.0.1. Drei Messungen mit Mika/256 Gewichtsaufträgen sind voreingestellt; eigene Studio-Projektdateien und 1–10 Wiederholungen werden unterstützt. Pro Sample ein neuer Browserkontext; keine Änderung an Quelldateien, bestehenden Benutzerprofilen oder Produktcode.

Die Messsonde wird ausschließlich vom Benchmark injiziert. Sie startet vor dem produktiven change-Handler des Projektdateifelds, misst File.text, beobachtet die Bereitschaft des neu installierten Avatars und prüft echte WebGL2-Zeichenaufrufe auf dessen neuem Canvas. Eine folgende Animationsframe-Grenze beendet die Messung. Der noch sichtbare Vorgängeravatar darf keinen erfolgreichen Messwert erzeugen. Fehler und Kontextverlust werden abgewiesen; SHA-256 vor/nach jedem Durchlauf schützt den Nachweis unveränderter Eingaben. Die Sonde verändert keine Rig-/Projektfunktionen.

## Nachweise

- Lokal: 325 Node-Tests bestanden, 0 fehlgeschlagen/übersprungen; TypeScript und Produktionsbuild bestanden.
- Lokaler Chromium-Start und Produktionsbenchmark versucht: Browser beendet sich vor dem Teststart mit `socket() failed: Operation not permitted`. Kein lokaler Browser- oder Laufzeitnachweis daraus abgeleitet.
- Neuer Chromium-Fall misst einen selbst enthaltenen PNG-Texturimport zweimal, prüft Bilddekodierung, Messreihenfolge, neuen Canvas, Quelldateiprüfsumme und unveränderte Datei. Zweiter Fall prüft den Fehlerpfad bei ungültigem Projekt mit vorhandenem Vorgängeravatar.
- CI-Prüfung der 31 Browserfälle und drei Produktionsmessungen steht für diesen Commit noch aus; Ergebnisse und Artefakte werden in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) nachgetragen.

## Grenzen

[Metriken, Aufruf und Grenzen](IMPORT-BENCHMARK.md). Enthalten: produktives Lesen/Validieren/Dekodieren, Texturen, Rig-Replay, UI und WebGL-Zeichnungsabgabe. Nicht enthalten: Dateiauswahl, Playwright-Dateiübertragung, Programm-/Serverstart, IndexedDB-Speicherung, GPU-Fertigstellung oder physische Anzeige. Browserprozess sowie OS-/GPU-Treibercaches können warm sein. Software-WebGL wird ausdrücklich ausgewiesen; kein Nachweis für die Ziel-GPU, große reale Modelle, anatomische Hautqualität oder manuelles Mausgefühl.

Projektformat bleibt Version 1. Keine bestehenden Tests übersprungen und keine bestehenden Zeitlimits erhöht. Bekannte Bundle-Größenwarnung bleibt.
