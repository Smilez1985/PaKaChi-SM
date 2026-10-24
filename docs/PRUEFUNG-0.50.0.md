# Prüfbericht 0.50.0

Seit **0.50.0** unterstützen `edit_studio` und der integrierte Assistent zwei weitere Aktionen: `insert_bone` mit der ID des Kindknochens fügt ein echtes Zwischengelenk mittig ein; `delete_bone` entfernt den angegebenen Knochen und überträgt Kinder und Gewichte an seinen Elternknochen. `delete_point` entfernt weiterhin nur den Griff. Zuerst `get_studio` mit `section: points` lesen, dann im Rig-Modus mit aktueller Sitzung/Revision und erteilter Bearbeitungsfreigabe arbeiten. Der integrierte Assistent legt Änderungen weiterhin zur ausdrücklichen Übernahme vor. Jeder Eingriff ist über Undo/Redo rückgängig machbar; vorhandene Posen danach prüfen. Die Schutzregeln für Wurzeln, skalierte Knochen und Anbauteile bleiben bestehen.

249 Tests und Build bestanden; Node-MCP-Transport mit beiden Aktionen geprüft. Python-Modell und Werkzeugbeschreibung erweitert, Syntax geprüft. Keine neue reale Python-MCP-/Anbieterabnahme; neuer CI-Nachweis steht aus.

Der neue Editor-Test prüft fehlende Freigabe, falschen Modus, veraltete Revision, fehlende ID und `$figure` als unzulässiges Ziel sowie Einfügen/Löschen mit zwei Undo-Schritten. Der bestehende Node-MCP-Prozesstest transportiert beide neuen Befehle unverändert. Python wurde nur auf Syntax geprüft. Die zuletzt bestandenen zwölf Chromium-Fälle beziehen sich auf 0.49.0.
