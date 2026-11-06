# Prüfbericht 0.76.2

Zeitstempel: 2026-11-06T19:13:55+01:00 (Europe/Berlin)

## Ausgangsnachweis

[Lauf 41993440271](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/41993440271) für Commit 8d93ee0: 312 Node-Tests, TypeScript/Build und alle 22 Chromium-Fälle bestanden. Job-Logs wurden geprüft.

## Visuelle Stichprobe

Aus Artefakt 13398979447 wurden `studio.png`, `mobile.png`, `orbit-normal.png` und `player-3d.png` betrachtet. Optionen ist auf der dunklen Navigation kaum lesbar; der sichtbare Entwicklungsstand ist veraltet. Beides wird in 0.76.2 korrigiert. Der Importfehler in Player-/Mobile-Bildern gehört zum absichtlich ungültigen Import im Test; der vorherige Avatar bleibt sichtbar.

Die große Leerfläche oberhalb der haftenden Studio-Vorschau im Ganzseitenbild ist nicht als Live-Layoutfehler bestätigt. Eine Aufnahme des sichtbaren Bereichs bzw. manuelles Scrollen ist für diese Bewertung erforderlich. Kein Nachweis für Mausgefühl, flüssige Bewegungen oder allgemeine anatomische Qualität. Die übrigen Artefaktbilder wurden in dieser Stichprobe nicht bewertet.

## Korrekturprüfung

Neue Chromium-Prüfung liest die erwartete Version aus package.json, misst den tatsächlichen CSS-Textkontrast in Normal-/Hoverzuständen (mindestens 4,5:1), prüft Tastaturfokus und öffnet Optionen per Enter. Das neue Artefakt `navigation-readable.png` zeigt den sichtbaren Bereich. Vollständiger aktueller CI-Nachweis in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).
