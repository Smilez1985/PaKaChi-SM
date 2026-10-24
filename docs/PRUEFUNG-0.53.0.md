# Prüfbericht 0.53.0

**0.53.0:** Vorhandene Knochen lassen sich im Modus „Gelenke bearbeiten“ einem anderen Elternknochen zuordnen. Grundstellung, gespeicherte Einzelposen und aktuelle Pose werden umgerechnet; Hautgewichte bleiben beim jeweiligen Knochen. Undo/Redo, gemischte Umbaufolgen, Projekt-/Katalogexport und die Aktion `reparent_bone` für Assistent/MCP sind enthalten. `get_studio` liefert `parentBone` und `parentId`. 256 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40138951275)).

Fünf neue Tests prüfen: Grundstellung/gedrehte Posen/Entwurf/aktuelle Pose und Hautpunkte; gemischte Umbaufolge samt Katalogexport und Move-Bindung; ungültige Ziele/Schema/Kreise; UI und freigegebener Agent mit Revision und Undo/Redo; sämtliche Hautpunkte von Mika und Nori nach Umhängen und Wiederladen. Der Node-MCP-Prozesstest transportiert die neue Aktion. Python wurde auf Syntax geprüft. Zwei neue Chromium-Fälle decken UI/Dateiaustausch und Assistent/Zustimmung/Undo ab.

Nur innerhalb desselben Skelettbaums; Wurzeln, Kreise, skalierte Knochenketten und Knochen mit direkten Nicht-Knochen-Anbauteilen werden abgewiesen. Gespeicherte Einzelposen bleiben erhalten, interpolierte Bewegungswege können sich ändern und werden zur Prüfung markiert. Keine automatische anatomische Bewertung oder neue reale Anbieter-/Python-Host-Abnahme.

Geprüfter Commit: `5286effe3a15c644289b845bf1ea8b8a8fd73eb4`. GitHub Actions bestätigt 256 Node-Tests (0 Fehler), erfolgreichen Build und alle 16 Chromium-Fälle in 2,6 Minuten. Browserbelege wurden als Artefakt hochgeladen.
