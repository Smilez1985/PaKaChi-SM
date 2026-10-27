# Prüfbericht 0.64.0

**0.64.0:** Neue sichtgefilterte Pinselstriche berücksichtigen ausgeblendete Materialien und Materialgruppen sowie transparente Materialien mit Opazität 0. Die ursprünglichen Materialeigenschaften werden beim Laden festgehalten; eine temporäre Gewichtsfärbung verändert die Auswahl nicht. `region.view.materials: true` speichert diese Regel. Ohne das Feld gilt weiterhin die geometrische Sichtprüfung aus 0.63.0, damit alte Verläufe unverändert bleiben.

282 Node-Tests, Produktionsbuild und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40542963343)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 6254 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Teiltransparente Materialien und Alpha-Texturen gelten weiterhin als undurchsichtige Hindernisse; Dreiecke bleiben beidseitig. Große Modelle und Materialdarstellung sind noch nicht manuell abgenommen. Dateien mit dem neuen Feld benötigen mindestens 0.64.0.

Geprüfter Commit: `f1be0869b0675baa0664502717d49b2fd621f479`. Regressionstest umfasst ausgeblendete Einzelmaterialien und Gruppen, transparente Opazität 0, Teiltransparenz, Opazität 0 ohne Transparenzmodus, unveränderliche Material-Snapshots und alte geometrische Aufträge. Projekt-/Katalogreplay und MCP-Transport erhalten die neue Regel. Der Browser-Pinseltest prüft sie beim Speichern und Wiederladen. Keine manuelle Material-/GPU-Abnahme.
