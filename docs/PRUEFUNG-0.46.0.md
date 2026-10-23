# Prüfbericht 0.46.0

- Produktionsbuild und TypeScript-Prüfung bestanden; bekannte Bundle-Warnung.
- Playwright listet zehn Browserfälle in fünf Dateien auf.
- Neuer CI-Lauf einschließlich der 237 bestehenden Node-Tests steht aus.

## Neuer Browserfall

Ein importiertes Test-GLB erhält zwei Posen und einen Move mit wiederholter Startpose. Der Test lädt die Move-Datei herunter und importiert sie über den Dateiauswahldialog. Er prüft die konfliktfreie neue Move-ID, neue Posen-IDs, wiederholte Verweise und unveränderte Originaldaten. Die neue Bewegung läuft in der Studio-Vorschau und lässt sich über die Zeitleiste positionieren. Ein Screenshot wird als Browserbeleg gespeichert.

Ein Undo entfernt den gesamten Import und stellt die vorherige Figurpose wieder her. Der anschließende Import mit unpassender Modellbindung wird abgewiesen; Projektzustand und Redo bleiben erhalten. Redo stellt den gültigen Import wieder her.

Dieser Fall ist bis zum tatsächlichen CI-Ergebnis nur vorbereitet. Manuelle Darstellungskontrolle, Mausgefühl, echte Speicherquoten und Anbieterinferenz bleiben offen. Die Original-Assets werden nicht verändert.
