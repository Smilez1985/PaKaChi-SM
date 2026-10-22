# Prüfbericht 0.44.0

- `npm test`: 235 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Tatsächlicher Browserbefund

[CI-Lauf 39776867884](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39776867884), Commit `eba828cf62fd2f4596d9e782148d865e43985ed6`: Chromium lief auf dem GitHub-Runner. Original-Transformation und der vollständige Sequenzvorschau-Test bestanden. Fünf Fälle scheiterten: Generierungsablauf wartete auf den nie gesetzten Originalnamen; Modellwechsel-Undo zeigte weiterhin Mika als Überschrift; drei Playerfälle warteten vergeblich auf die Rückkehr aus einmaligen Bewegungen.

## Korrekturen und Nachweise

- Originalwechsel setzt die sichtbaren Metadaten, leert die 3D-Move-Liste und synchronisiert die Wiedergabeanzeige. Das erklärt die beiden beobachteten Beschriftungsfehler; die weiteren Generierungsschritte benötigen den Folgelauf.
- Viewer reicht tatsächliche Vordergrundzeit statt höchstens 50 ms pro Renderbild weiter. Bisher verursachte niedrige Software-Renderbildrate eine künstliche Zeitlupe. Sichtbarkeitswechsel setzen die Uhr zurück; Hintergrundzeit wird nicht nachgeholt.
- Neuer Geometrielauf prüft echte Three.js-Clip-Wiedergabe und Rückkehr zur Grundbewegung bei 16, 250 und 500 ms Renderabstand.
- Zweiter Test prüft Hintergrund-Zeitreset sowie ungültige/rückläufige Zeitstempel.

Die Ursachen wurden anhand CI-Protokoll und Code identifiziert. Ein erfolgreicher kompletter Browser-Folgelauf wird erst nach tatsächlichem Ergebnis behauptet. Lokale Chromium-Ausführung bleibt durch Socket-Berechtigungen blockiert. Keine echte Cloud-Inferenz oder vollständige manuelle Mausabnahme.
