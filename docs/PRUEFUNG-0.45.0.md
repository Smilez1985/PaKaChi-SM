# Prüfbericht 0.45.0

- `npm test`: 237 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung.
- Alle neun Chromium-Browserfälle bestanden auf dem GitHub-Runner (1,5 Minuten; [CI-Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987)).
- Geprüfter Commit: `b4fe7204aa35d7d0af7c8b29dfcbe5e17727cdc8`; Job `120247737733` erfolgreich abgeschlossen.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Neue Prüfungen

Zwei DOM-Tests prüfen Nachrichten erst nach erfolgreichem Speichern, ausschließlich Metadatenaktualisierung, Auswahlbeibehaltung, gesammelte Aktualisierung während eines laufenden Schreibvorgangs, Abbau und Fokusaktualisierung. Fehlgeschlagene Schreibvorgänge senden keine Änderungsmeldung und laden kein Modell.

Ein Browserfall speichert ein importiertes GLB mit zwei Posen, einem Move und Bearbeitungspose, lädt die Seite neu und öffnet die Kopie über ihre stabile gespeicherte ID. Ein weiterer öffnet zwei Tabs, prüft automatische Aktualisierung nach Speichern, abgebrochenes und bestätigtes Löschen sowie den Erhalt des bereits geladenen Avatars im zweiten Tab.

Der tatsächliche CI-Lauf bestätigt beide neuen Browserfälle und alle sieben bisherigen Fälle. Er verwendet Chromium mit Software-WebGL und lokale Testdaten; keine echte Anbieterinferenz. Reale Speicherquoten, sehr große Projekte und manuelle Maus-/Darstellungsabnahme bleiben offen.
