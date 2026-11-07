# Prüfbericht 0.78.1

Zeitstempel: 2026-11-07T09:04:13+01:00 (Europe/Berlin)

## Fehler und Korrektur

Der neue Regressionstest schlug vor der Korrektur mit „Der Quellknochen hat keinen übertragbaren Oberflächen-Einfluss“ fehl. Ursache: Gewichtsbearbeitungen laufen nach dem Hierarchieumbau; ein gelöschter Einfügeanker besitzt dann keinen Elternknoten mehr. Seine lokale Transformation wurde damit fälschlich in einem anderen Weltbezug ausgewertet.

Der Wiederaufbau merkt sich die früheren Elternbezüge gelöschter Knochen. Nur die Berechnung der Einfügeachse rekonstruiert diese Bezüge über die endgültigen Grundtransformationen; die gelöschten Knochen werden nicht wieder in die Szene eingehängt. Bestehende Fehlerprüfungen für tatsächlich wirkungslose Gewichtsübertragungen bleiben erhalten. Kein neues Projektformat.

## Regressionen

Unabhängiger Vergleich der Gewichte nach logischen Knochen-IDs: Nach der Löschung geht nur der verbleibende Anteil des gelöschten Knochens auf seinen Elternknochen über; vorher übertragener Anteil bleibt beim neuen Gelenk. Prüft einfache/verschachtelte Löschung, versetzten/skalierten Modellraum und gedrehten Vorfahren, vorherige Figurtransformation, drei Resets, Daten-Undo/Redo und Projektvalidierung/-rekonstruktion. Der echte Mika-GLB-Rundlauftest verwendet wieder die ursprüngliche Problemfolge.

Neuer Browserfall bedient die Folge über die Studio-Oberfläche, prüft Undo/Redo, lädt eine gespeicherte Projektdatei neu und erstellt `topology-weight-replay.png`. Maßgeblicher CI-Nachweis für den jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1). Allgemeine Haut-/Bewegungsqualität bleibt manuell zu prüfen.

Lokaler Nachweis: `npm run verify` erfolgreich, **319 Node-Tests bestanden**, TypeScript und Produktionsbuild bestanden. Der anschließend um einen gedrehten Vorfahren erweiterte Regressionstest besteht ebenfalls. Bekannte Bundle-Größenwarnung bleibt.
