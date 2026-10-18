# Prüfbericht 0.25.0

Zeitstempel: 2026-10-18T04:55:02+02:00 (Europe/Berlin)

- `npm test`: 140 Tests bestanden, keine fehlgeschlagenen oder übersprungenen Tests. Enthält die Originaldatei-Erhaltungsprüfung.
- `npm run build`: TypeScript und Vite erfolgreich; bekannte Warnung zum gemeinsamen JS-Bundle (rund 1,29 MB / 354 kB gzip).
- Drei neue Auftragskerntests: opt-in Fallbacks nur vor Ausführung; keine weitere Ausführung bei Anbieter-/Validierungsfehlern; nicht reagierende Prüfung und verspätete Antwort; Revisionsprüfung; Abbruch auch durch Statusbeobachter.
- Zwei neue DOM-Tests: expliziter nächster Anbieter mit eigenem Schlüssel; gesperrte Wiederholung nach Projektänderung und Verwerfen bei Tresorsperre.
- Dienste in diesen neuen Prüfungen sind Testdoubles. Kein echter Cloud-Auftrag oder TripoSR-Inferenzlauf.
- Browserprüfung nicht erneut versucht: in 0.24.0 scheiterte der installierte Chromium vor dem Seitenstart an einem verbotenen Socket-Systemaufruf. Gerenderte WebGL-/Mausprüfung und GPU-/Qualitätsabnahme bleiben offen.
