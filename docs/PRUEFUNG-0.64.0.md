# Prüfbericht 0.64.0

**0.64.0:** Neue sichtgefilterte Pinselstriche berücksichtigen ausgeblendete Materialien und Materialgruppen sowie transparente Materialien mit Opazität 0. Die ursprünglichen Materialeigenschaften werden beim Laden festgehalten; eine temporäre Gewichtsfärbung verändert die Auswahl nicht. `region.view.materials: true` speichert diese Regel. Ohne das Feld gilt weiterhin die geometrische Sichtprüfung aus 0.63.0, damit alte Verläufe unverändert bleiben.

Lokale Tests und Build sowie der neue Chromium-Lauf werden noch abschließend geprüft.

Teiltransparente Materialien und Alpha-Texturen gelten weiterhin als undurchsichtige Hindernisse; Dreiecke bleiben beidseitig. Große Modelle und Materialdarstellung sind noch nicht manuell abgenommen. Dateien mit dem neuen Feld benötigen mindestens 0.64.0.
