# Prüfbericht 0.72.0

Zeitstempel: 2026-10-31T01:51:23+01:00 (Europe/Berlin)

Neue Abzweigungen mit gleichmäßiger, ungleichmäßiger und negativer Quellskalierung geprüft: gewünschte Weltposition, unveränderte Hautgeometrie, Pose, Projektvalidierung und Rekonstruktion sowie Quellwiederherstellung. Nicht invertierbare und extreme Umrechnungen lassen Daten und aktuelle Pose unverändert. Bestehende Maus-/Agenten- und Undo-/Redo-Tests bleiben erhalten.

Keine gerenderte Haut-/IK-Abnahme. Umhängen und Löschen skalierter Knochen sowie Löschen mit Anbauteilen bleiben eingeschränkt. Keine Actions gestartet; Arbeitsbranch bleibt getrennt von main.

`npm run verify`: **305 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen.
