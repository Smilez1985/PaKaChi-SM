# Prüfbericht 0.61.0

**0.61.0:** Das gemeinsame Budget für Pinsel- und Einzelübertragungen steigt von 128 auf 1024 Aufträge pro Projekt. Neue Übertragungen werden auf den aktuellen Gewichten berechnet, ohne den bisherigen Verlauf und das Skelett bei jedem Auftrag erneut aufzubauen. Alle betroffenen Oberflächen werden vor der Übernahme geprüft; Fehler hinterlassen keine teilweise geänderten Gewichte. Posen, Skinning-Paletten und bestehende Attribute bleiben während der Übertragung erhalten.

278 Node-Tests und Build bestanden. Neuer Chromium-Nachweis steht aus.

Ein neuer Node-Test wendet 1024 Übertragungen an und prüft null Rig-Resets, unveränderte Pose sowie Identität der Palette und Attribute. Rekonstruktion und Katalogexport liefern identische Gewichte; Auftrag 1025 wird ohne Änderung zurückgewiesen. Der bestehende Abbruchtest verwendet jetzt die neue Budgetgrenze. Der Browserfall für den Pinsel lädt und exportiert zusätzlich ein Projekt mit 256 Aufträgen.

Projekte mit mehr als 128 Gewichtsaufträgen benötigen mindestens 0.61.0. Das Projektformat bleibt Version 1; ältere Leser lehnen das größere Budget ab. Laden und Undo/Redo rekonstruieren weiterhin den gespeicherten Verlauf. Die manuelle Performance-Abnahme großer Modelle bleibt offen; keine pauschale Echtzeit-Zusage. Sichtbare Oberflächen begrenzen den kugelförmigen Pinsel weiterhin nicht.
