# Prüfbericht 0.62.0

**0.62.0:** Die Berechnung langer Gewichtsverläufe verwendet vorberechnete Weltpositionen, wiederverwendete kleine Zahlenfelder und direkte Pufferkopien. Vertices ohne Quellgewicht oder außerhalb des Bereichs werden früh übersprungen. Der Gewichtsvergleich bestätigt dieselben Ergebnisse einschließlich Zusammenführen doppelter Indizes, Sortierung, Normalisierung und Vier-Einfluss-Grenze.

279 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40407457621)). Der Browserimport mit 256 Aufträgen dauerte in diesem Lauf 6822 ms (vorheriger 0.61.0-Lauf: 19181 ms). Einzelmessungen auf CI-Runnern, keine allgemeine Laufzeitgarantie.

Ein zusätzlicher deterministischer Test vergleicht die optimierte Berechnung komponentengenau mit der bisherigen Map-Rechenweise. Enthalten sind 256 Vertices, verschiedene Gewichtskonstellationen, doppelte Indizes, Gleichstände, Abschneiden auf vier Einflüsse, transformierte Originalpositionen und normale/interleaved Attribute. Die bestehenden Tests prüfen weiterhin Atomarität, lange Verläufe, Undo/Redo und Export.

Das Budget bleibt bei 1024 Aufträgen. Lokale Messung mit 256 Aufträgen: 1626/1471/1551 ms für den reinen Rig-Reset (Median 1551 ms); vorherige Vergleichsmessung 6375/5903/5718 ms. Dies ist kein vollständiger Browserimport und keine allgemeine Echtzeit-Zusage. Vorberechnete Weltpositionen benötigen 24 Byte pro Vertex statt zuvor 12 Byte für die Positionskopie. Beschränkung des Pinsels auf sichtbare Oberflächen und manuelle Prüfung großer Modelle bleiben offen.

## GitHub-Nachweis

Geprüfter Commit: `3ea14cdbc8464a2ddfac6e55692bf481c5bff490`. [Workflow 40407457621](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40407457621): 279 Node-Tests ohne Fehler, Build und alle 20 Chromium-Fälle bestanden (4,1 Minuten). Der unveränderte Ladetest mit 256 Gewichtsaufträgen meldete 6822 ms, gegenüber 19181 ms im erfolgreichen 0.61.0-Lauf. Diese Browsermessung schließt Dateiübergabe und Warten auf die Bereitschaftsmeldung ein und ist nicht mit dem reinen Rig-Reset gleichzusetzen. Sämtliche erneut exportierten Aufträge stimmten überein. Keine neue manuelle Hautqualitäts- oder reale GPU-Abnahme.
