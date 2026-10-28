# Prüfbericht 0.67.0

**0.67.0:** Ein zusätzlicher Browserfall prüft echte Mausrad-, Rechts- und Mitteltastenereignisse im Studio. Nach außermittigem Zoom und Verschieben bleiben beim Drehen Abstand und Bildschirmposition der bekannten Figurenmitte konstant. Der Test wählt die normale und invertierte Drehrichtung über den Optionsdialog, prüft gegensinnige Kamerabewegung und funktionierenden Zoom nach Loslassen. Der übrige Studiozustand einschließlich Revision und Figur bleibt unverändert.

Der erste CI-Lauf besteht 286 Node-Tests, Build und die bisherigen 21 Browserfälle. Der neue Mausfall scheiterte an einer Testposition unterhalb des sichtbaren Browserfensters. Der korrigierte Test verwendet den sichtbaren Canvas-Ausschnitt und prüft das getroffene Element; Build lokal bestanden. Sein CI-Bestätigungslauf [40727289984](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40727289984) endet auch nach Wiederholung vor dem ersten Arbeitsschritt ohne Testlogs. Auch lokal endet Chromium vor dem Teststart mit `socket() failed: Operation not permitted`. Die Bestätigung aller 22 Browserfälle steht aus.

Dies ergänzt den automatisierten Navigationsnachweis; tatsächliches Mausgefühl, komplexe Skelett-/Hautqualität und große reale Modelle bleiben manuell zu prüfen. Keine Änderung am Kameraalgorithmus.

## Untersuchung des ersten Browserfehlers

CI-Lauf [40682974717](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40682974717): Der Trace zeigt `mouseMove` bei `(753.2775, 1098.329375)` in einem 1000 Pixel hohen Browserfenster. Das Mausrad traf daher nicht die Ansicht. Der Test scrollt nun das Canvas in Sicht und begrenzt seine Mausposition auf den sichtbaren Ausschnitt; `elementFromPoint` bestätigt den Treffer. Korrektur-Commit: `78b07e12f33535aef5f1718cd7a9c99424e6a608`.

Beide anschließenden CI-Versuche endeten nach wenigen Sekunden mit leerer Schrittliste; Joblogs waren nicht vorhanden. Aus diesen Daten lässt sich keine konkrete Ursache des Runner-Startfehlers ableiten. Das ist kein Nachweis eines weiteren Testfehlers, aber auch keine erfolgreiche Browserabnahme.

Lokaler Gegenversuch: Chromium 141 / Playwright 1194 wurde heruntergeladen. Der Prozess scheitert vor dem Öffnen der Anwendung am verbotenen Socket-Systemaufruf (`process_singleton_posix.cc:292`). Der korrigierte Browserfall wurde dadurch nicht ausgeführt. Build mit korrigiertem Test erfolgreich; kein weiterer Kameraalgorithmus geändert.
