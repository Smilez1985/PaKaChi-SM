# Prüfbericht 0.61.0

**0.61.0:** Das gemeinsame Budget für Pinsel- und Einzelübertragungen steigt von 128 auf 1024 Aufträge pro Projekt. Neue Übertragungen werden auf den aktuellen Gewichten berechnet, ohne den bisherigen Verlauf und das Skelett bei jedem Auftrag erneut aufzubauen. Alle betroffenen Oberflächen werden vor der Übernahme geprüft; Fehler hinterlassen keine teilweise geänderten Gewichte. Posen, Skinning-Paletten und bestehende Attribute bleiben während der Übertragung erhalten.

278 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40362549729)). Der Import mit 256 Aufträgen dauerte auf diesem CI-Runner 19,181 Sekunden; weitere Ladezeitoptimierung bleibt offen.

Ein neuer Node-Test wendet 1024 Übertragungen an und prüft null Rig-Resets, unveränderte Pose sowie Identität der Palette und Attribute. Rekonstruktion und Katalogexport liefern identische Gewichte; Auftrag 1025 wird ohne Änderung zurückgewiesen. Der bestehende Abbruchtest verwendet jetzt die neue Budgetgrenze. Der Browserfall für den Pinsel lädt und exportiert zusätzlich ein Projekt mit 256 Aufträgen.

Projekte mit mehr als 128 Gewichtsaufträgen benötigen mindestens 0.61.0. Das Projektformat bleibt Version 1; ältere Leser lehnen das größere Budget ab. Laden und Undo/Redo rekonstruieren weiterhin den gespeicherten Verlauf. Die manuelle Performance-Abnahme großer Modelle bleibt offen; keine pauschale Echtzeit-Zusage. Sichtbare Oberflächen begrenzen den kugelförmigen Pinsel weiterhin nicht.

## Erster CI-Lauf

[Workflow 40322516300](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40322516300): 278 Node-Tests und Build bestanden, 19 von 20 Chromium-Fällen bestanden. Der erweiterte Pinseltest erreichte beim Laden des 256-Aufträge-Projekts die bisherige 5-Sekunden-Erwartungsfrist; die Oberfläche meldete noch „Avatar wird geladen“. Der gezielte Ladeabschnitt erhält 30 Sekunden, der kombinierte Test mit mehreren Imports insgesamt 90 Sekunden. Er protokolliert die tatsächliche Ladezeit und prüft weiterhin alle exportierten Gewichtsaufträge. Der folgende Wiederholungslauf ist erfolgreich abgeschlossen.

## Erfolgreicher Wiederholungslauf

Geprüfter Commit: `24a93d98cea917a43c1fe0798eb92541d7d1e6a6`. [Workflow 40362549729](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40362549729): 278 Node-Tests ohne Fehler, Build und alle 20 Chromium-Fälle bestanden (5,1 Minuten). Der Import des Mika-Projekts mit 256 Aufträgen benötigte 19.181 ms einschließlich Dateiübergabe und Warten auf die Bereitschaftsmeldung. Alle erneut exportierten Aufträge stimmten überein. Die Messung ist ein einzelner CI-Wert, kein allgemeiner Leistungsnachweis. Das JSON-Testartefakt `weight-history-replay` enthält die Ladezeit. Laden/Undo bleiben Optimierungsziele; keine neue manuelle Hautqualitätsabnahme.
