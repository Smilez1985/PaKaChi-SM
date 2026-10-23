# Prüfbericht 0.45.0

- `npm test`: 237 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung.
- Playwright erkennt neun Browserfälle in vier Dateien; die beiden neuen Fälle benötigen den CI-Lauf.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Neue Prüfungen

Zwei DOM-Tests prüfen Nachrichten erst nach erfolgreichem Speichern, ausschließlich Metadatenaktualisierung, Auswahlbeibehaltung, gesammelte Aktualisierung während eines laufenden Schreibvorgangs, Abbau und Fokusaktualisierung. Fehlgeschlagene Schreibvorgänge senden keine Änderungsmeldung und laden kein Modell.

Ein Browserfall speichert ein importiertes GLB mit zwei Posen, einem Move und Bearbeitungspose, lädt die Seite neu und öffnet die Kopie über ihre stabile gespeicherte ID. Ein weiterer öffnet zwei Tabs, prüft automatische Aktualisierung nach Speichern, abgebrochenes und bestätigtes Löschen sowie den Erhalt des bereits geladenen Avatars im zweiten Tab.

Diese Browserfälle sind vor dem tatsächlichen CI-Ergebnis nur vorbereitet. Der vorherige Stand 0.44.0 bestand alle sieben damaligen Chromium-Fälle. Reale Speicherquoten, sehr große Projekte und manuelle Maus-/Darstellungsabnahme bleiben offen.
