# Prüfbericht 0.24.0

Zeitstempel: 2026-10-18T00:55:06+02:00

## Ergebnis

- `npm test`: 135 Tests bestanden, keine Fehler oder übersprungenen Tests; darunter Erhaltungsprüfung der Originaldateien und exakt 72 Transformationsbilder.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Vite-Bundlewarnung, rund 1,28 MB / 353 kB gzip.
- Fünf neue Vorbereitungs-/Rollbacktests bestanden.
- Chromium 141 / Playwright-Build 1194 installiert. `npx playwright test tests/e2e/generation.spec.ts`: beide Tests vor Anwendungsstart blockiert. Chromium bricht mit `socket() failed: Operation not permitted` ab. Keine Browserabnahme.

## Umfang der erfolgreichen Tests

Echte DOM-Knoten, Ereignisbindungen, Attribute und Auswahlwerte werden nach einer injizierten Veröffentlichungsstörung wieder eingesetzt. Die StateMachine erhält ihre vorherige Adapterbindung zurück und kann sie weiter ausführen. Alte Ressourcen werden bei Fehlschlag nicht freigegeben. Bei Erfolg erfolgt deren Freigabe erst nach Veröffentlichung; eine Cleanup-Störung zerstört den gültigen neuen Stand nicht. Kandidaten-Cleanup läuft auch bei gemeldetem Rollbackfehler.

Weitere Fehler werden beim Anzeigen, Erstellen der Studio-Ansicht und Rendern des Editors injiziert. Vorbereitete Knoten bleiben unmontiert; aktive Host-Rückmeldungen werden nicht ausgelöst; Ressourcen werden freigegeben. Ein erfolgreicher Kandidat verwendet echte GLTF-Daten, StudioRig, Editor und Playback mit ersetztem WebGL-Viewer. Geprüft werden normalisierte Oberflächenkoordinaten und idempotente Freigabe.

## Grenzen

Der WebGL-Viewer ist in den erfolgreichen Komponententests ersetzt. Die zwei Playwright-Abläufe (Generierung/Übernahme/Undo sowie injizierter Veröffentlichungsfehler) erreichen wegen der Umgebungssperre keine Seite. Kein tatsächlicher GPU-Generierungslauf, keine Qualitäts- oder Rigging-Abnahme. Die 3D-Übergabe ist abgesichert, nicht der separate Originalplayer-Neustart oder ein Prozess-/GPU-Ausfall.

Während der Vorbereitung existieren alter und neuer Viewer gleichzeitig; dies benötigt zusätzlichen Arbeitsspeicher und GPU-Ressourcen. In 0.22.0/0.23.0 gespeicherte freie Punkte/Posen sind nach der korrigierten Normalisierungsreihenfolge visuell zu prüfen; Format 1 erlaubt keine eindeutige automatische Herkunftserkennung.
