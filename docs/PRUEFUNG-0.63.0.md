# Prüfbericht 0.63.0

**0.63.0:** Die optionale Checkbox „Pinsel nur auf sichtbare Oberfläche“ begrenzt Gewichtsaufträge auf geometrisch sichtbare Vertices im Blickfeld. Eine räumliche Suchstruktur prüft Verdeckung durch andere Dreiecke. Die Kamera wird pro Strich festgehalten und mit den Aufträgen gespeichert; Projekt-/Katalogexport und Undo/Redo reproduzieren die Auswahl. Assistent/MCP können `region.view` aus `get_studio.view` übernehmen.

281 Node-Tests und Build bestanden; Python-Syntax geprüft. Neuer Chromium-Nachweis steht aus.

Zwei neue Node-Tests prüfen vordere/hintere Dreiecke, Kamerawechsel und eingefrorene Kamera, unveränderte verdeckte Vertices, Projekt-/Katalogreplay, Blickfeldgrenzen und ungültige Kameradaten. Der Node-MCP-Transporttest umfasst `region.view`. Der vorhandene Browser-Pinseltest aktiviert die Checkbox und prüft gespeicherte Kameradaten beim Undo/Redo und Wiederladen sowie beim langen Verlauf.

Sichtprüfung bezieht sich auf die ursprüngliche Grundpose. Dreiecke gelten beidseitig als undurchsichtige Hindernisse; Transparenz, Alpha-Ausschnitte und Materialgruppen-Sichtbarkeit werden nicht ausgewertet. Die erste Sichtprüfung baut eine Suchstruktur auf und benötigt zusätzlichen Speicher; große Modelle sind noch nicht manuell abgenommen. Ohne Checkbox gilt weiterhin der kugelförmige Pinsel. Projekte mit `region.view` benötigen mindestens 0.63.0.
