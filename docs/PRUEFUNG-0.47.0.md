# Prüfbericht 0.47.0

- 242 Node-Tests bestanden, keine Fehler oder übersprungenen Tests.
- TypeScript und Produktionsbuild bestanden; bekannte Bundle-Warnung.
- 242 Tests, Build und alle elf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)).
- Geprüfter Commit: `cb7d567f266029dc54cec4f704daaebb61f41354`; Chromium-Laufzeit 2,6 Minuten.

## Neue Nachweise

Fünf Tests prüfen echte Eltern-/Kindhierarchie, Skinning-Palette und normalisierte Gewichte, unveränderte Grundgeometrie, tatsächliche Oberflächenbewegung und erhaltene Segmentlängen beim Beugen eines ergänzten Knies. Weitere Prüfschritte decken bestehende Posen, ungültige Eingaben, Move-Kompatibilität, einen vollständigen Undo-/Redo-Schritt, wiederholte Unterteilungen und Katalogexport ab. Mika und Nori behalten beim Einfügen ihre Grundgeometrie, folgen anschließend dem neuen Knochen und lassen sich aus dem gespeicherten Projekt rekonstruieren. Die ursprünglichen Gewichte und das Quellskelett werden wiederhergestellt.

Ein Browserfall für Mika prüft den sichtbaren Einfügeknopf, Undo/Redo, echten Download und erneutes Laden des Projekts. Er ist im erfolgreichen CI-Lauf nachgewiesen.

Die Gewichte werden geometrisch angenähert. Anatomische Qualität, manuelle Maus-/Darstellungskontrolle, beliebiges Löschen/Umhängen von Quellknochen und vollständiges Auto-Rigging bleiben offen. Die Original-PaKaChi-Bilddateien wurden nicht verändert.

## Erster Browserlauf

[Lauf 39956455038](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39956455038): 242 Tests und Build bestanden; zehn bisherige Browserfälle bestanden. Der neue Fall bestätigte Einfügen, Undo/Redo und Download, scheiterte dann an der alten Knochenzahl-Vorprüfung im Projektladeweg. Diese berücksichtigt nun die gespeicherten Unterteilungen. Der [Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749) besteht alle elf Browserfälle einschließlich des Projektladens.
