# Prüfbericht 0.46.0

- Produktionsbuild und TypeScript-Prüfung bestanden; bekannte Bundle-Warnung.
- Playwright listet zehn Browserfälle in fünf Dateien auf.
- Neuer CI-Lauf einschließlich der 237 bestehenden Node-Tests steht aus.

## Neuer Browserfall

Ein importiertes Test-GLB erhält zwei Posen und einen Move mit wiederholter Startpose. Der Test lädt die Move-Datei herunter und importiert sie über den Dateiauswahldialog. Er prüft die konfliktfreie neue Move-ID, neue Posen-IDs, wiederholte Verweise und unveränderte Originaldaten. Die neue Bewegung läuft in der Studio-Vorschau und wird über den sichtbaren Stoppknopf angehalten. Ein Screenshot wird als Browserbeleg gespeichert.

Ein Undo entfernt den gesamten Import und stellt die vorherige Figurpose wieder her. Der anschließende Import mit unpassender Modellbindung wird abgewiesen; Projektzustand und Redo bleiben erhalten. Redo stellt den gültigen Import wieder her.

Dieser Fall ist bis zum tatsächlichen CI-Ergebnis nur vorbereitet. Manuelle Darstellungskontrolle, Mausgefühl, echte Speicherquoten und Anbieterinferenz bleiben offen. Die Original-Assets werden nicht verändert.

## Erster CI-Lauf

[Erster Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39912344319): 237 Node-Tests und Build bestanden; neun Browserfälle bestanden, der neue Fall scheiterte beim Anklicken des im Studio ausgeblendeten Player-Pauseknopfs. Download, Import und laufende Figurenbewegung waren bereits erfolgreich geprüft. Der Test verwendet nun ausschließlich die sichtbaren Studio-Steuerungen; erneuter CI-Nachweis steht aus.
