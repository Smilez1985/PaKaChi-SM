# Prüfbericht 0.58.0

**0.58.0:** Neue Knochen lassen sich als freie Abzweigung an einem ausgewählten Elternknochen platzieren. Verbindung und Skinning-Palette entstehen automatisch; bestehende Hautgewichte bleiben unverändert. Einfluss lässt sich danach gezielt übertragen. Undo/Redo, gespeicherte Posen, Projekt-/Katalogexport und `add_bone` über Assistent/MCP sind berücksichtigt.

271 Node-Tests, Build und alle 18 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40277434553)); Python-Syntax lokal geprüft.

Drei neue Node-Tests prüfen Gewichterhalt und gezielte Übertragung, neue Kindketten, gemischtes Einfügen/Löschen, Export und Rekonstruktion, transformierte Eltern, ungültige Positionen/Einträge mit Rollback sowie Maus-/Agentenbedienung mit Undo/Redo und Freigabe/Revisionsschutz. Der Node-MCP-Transporttest umfasst auch `add_bone`. Ein neuer Chromium-Fall setzt einen Kindknochen per Maus an Mika und prüft Undo/Redo sowie Speichern/Laden.

Benötigt einen vorhandenen Elternknochen; kein neues Skelett auf einer ungeriggten Oberfläche. Neue Knochen wirken erst nach Gewichtsübertragung auf die Haut. Skalierte Knochenketten sind ausgeschlossen. Kontinuierlicher Gewichtspinsel, Gewichtsfärbung und manuelle Hautabnahme bleiben offen. Projekte mit freien Knochen benötigen mindestens 0.58.0; ältere Leser lehnen diese Einträge ab.

## GitHub-Nachweis

Geprüfter Commit: `5e55d3302de18345d2242ace25ada7cc5a44866c`. [Workflow 40277434553](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40277434553) erfolgreich abgeschlossen. 271 Node-Tests ohne Fehler, Build und 18 Chromium-Fälle bestanden. Der neue Browserfall setzt per Mausklick einen echten Kindknochen an Mika und prüft Elternverbindung, Undo/Redo sowie Projekt-Download und Wiederladen. Keine neue manuelle Sichtprüfung oder reale Python-MCP-Host-Abnahme.
