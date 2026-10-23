# Prüfbericht 0.47.0

- 242 Node-Tests bestanden, keine Fehler oder übersprungenen Tests.
- TypeScript und Produktionsbuild bestanden; bekannte Bundle-Warnung.
- Elf Chromium-Fälle aufgelistet; neuer CI-Nachweis steht aus.

## Neue Nachweise

Fünf Tests prüfen echte Eltern-/Kindhierarchie, Skinning-Palette und normalisierte Gewichte, unveränderte Grundgeometrie, tatsächliche Oberflächenbewegung und erhaltene Segmentlängen beim Beugen eines ergänzten Knies. Weitere Prüfschritte decken bestehende Posen, ungültige Eingaben, Move-Kompatibilität, einen vollständigen Undo-/Redo-Schritt, wiederholte Unterteilungen und Katalogexport ab. Mika und Nori behalten beim Einfügen ihre Grundgeometrie, folgen anschließend dem neuen Knochen und lassen sich aus dem gespeicherten Projekt rekonstruieren. Die ursprünglichen Gewichte und das Quellskelett werden wiederhergestellt.

Ein Browserfall für Mika prüft den sichtbaren Einfügeknopf, Undo/Redo, echten Download und erneutes Laden des Projekts. Er ist bis zum CI-Ergebnis nur vorbereitet.

Die Gewichte werden geometrisch angenähert. Anatomische Qualität, manuelle Maus-/Darstellungskontrolle, beliebiges Löschen/Umhängen von Quellknochen und vollständiges Auto-Rigging bleiben offen. Die Original-PaKaChi-Bilddateien wurden nicht verändert.
