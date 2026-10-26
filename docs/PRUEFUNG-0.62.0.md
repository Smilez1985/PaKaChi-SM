# Prüfbericht 0.62.0

**0.62.0:** Die Berechnung langer Gewichtsverläufe verwendet vorberechnete Weltpositionen, wiederverwendete kleine Zahlenfelder und direkte Pufferkopien. Vertices ohne Quellgewicht oder außerhalb des Bereichs werden früh übersprungen. Der Gewichtsvergleich bestätigt dieselben Ergebnisse einschließlich Zusammenführen doppelter Indizes, Sortierung, Normalisierung und Vier-Einfluss-Grenze.

279 Node-Tests und Build bestanden. Neuer Chromium-Nachweis steht aus.

Ein zusätzlicher deterministischer Test vergleicht die optimierte Berechnung komponentengenau mit der bisherigen Map-Rechenweise. Enthalten sind 256 Vertices, verschiedene Gewichtskonstellationen, doppelte Indizes, Gleichstände, Abschneiden auf vier Einflüsse, transformierte Originalpositionen und normale/interleaved Attribute. Die bestehenden Tests prüfen weiterhin Atomarität, lange Verläufe, Undo/Redo und Export.

Das Budget bleibt bei 1024 Aufträgen. Lokale Messung mit 256 Aufträgen: 1626/1471/1551 ms für den reinen Rig-Reset (Median 1551 ms); vorherige Vergleichsmessung 6375/5903/5718 ms. Dies ist kein vollständiger Browserimport und keine allgemeine Echtzeit-Zusage. Vorberechnete Weltpositionen benötigen 24 Byte pro Vertex statt zuvor 12 Byte für die Positionskopie. Beschränkung des Pinsels auf sichtbare Oberflächen und manuelle Prüfung großer Modelle bleiben offen.
