# Prüfbericht 0.58.0

**0.58.0:** Neue Knochen lassen sich als freie Abzweigung an einem ausgewählten Elternknochen platzieren. Verbindung und Skinning-Palette entstehen automatisch; bestehende Hautgewichte bleiben unverändert. Einfluss lässt sich danach gezielt übertragen. Undo/Redo, gespeicherte Posen, Projekt-/Katalogexport und `add_bone` über Assistent/MCP sind berücksichtigt.

271 Node-Tests und Build bestanden; Python-Syntax geprüft. Der neue Chromium-Nachweis steht aus.

Drei neue Node-Tests prüfen Gewichterhalt und gezielte Übertragung, neue Kindketten, gemischtes Einfügen/Löschen, Export und Rekonstruktion, transformierte Eltern, ungültige Positionen/Einträge mit Rollback sowie Maus-/Agentenbedienung mit Undo/Redo und Freigabe/Revisionsschutz. Der Node-MCP-Transporttest umfasst auch `add_bone`. Ein neuer Chromium-Fall setzt einen Kindknochen per Maus an Mika und prüft Undo/Redo sowie Speichern/Laden.

Benötigt einen vorhandenen Elternknochen; kein neues Skelett auf einer ungeriggten Oberfläche. Neue Knochen wirken erst nach Gewichtsübertragung auf die Haut. Skalierte Knochenketten sind ausgeschlossen. Kontinuierlicher Gewichtspinsel, Gewichtsfärbung und manuelle Hautabnahme bleiben offen. Projekte mit freien Knochen benötigen mindestens 0.58.0; ältere Leser lehnen diese Einträge ab.
