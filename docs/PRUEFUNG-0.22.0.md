# Prüfbericht 0.22.0

Zeitstempel: 2026-10-17T12:25:46+02:00

## Ergebnis

- `npm test`: 124 Tests bestanden, keine Fehler oder übersprungenen Tests. Erhaltungsprüfung der 83 Originaldateien einschließlich 72 Transformationsbilder bestanden.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung, rund 1,28 MB / 352 kB gzip.
- Sechs neue DOM-/Geometrie-Integrationstests bestanden.
- `npx playwright test tests/e2e/generation.spec.ts`: vor dem ersten Browserschritt blockiert. Chromium-Programmdatei unter dem von Playwright erwarteten Cachepfad fehlt. **Keine gerenderte Browserabnahme.**

## Neue Prüfungen

Die Tests nutzen happy-dom für Bildauswahl, ausdrückliches Starten, Vorschau-/Freigabestatus und Bedienereignisse. Der tatsächliche GLTFLoader und die neue Geometrievalidierung prüfen eine synthetische GLB. Netzadapter und WebGL-Viewer werden in diesen DOM-Tests ersetzt; der HTTP-Transport bleibt durch die vorhandenen Diensttests separat abgedeckt.

Geprüft: Auswahl sendet nichts; Vorschau übernimmt nichts automatisch; explizite Übernahme und Verwerfen räumen den Viewer auf. Geänderte Zielrevision sperrt die Übernahme. Tresorsperre bricht den Auftrag ab und verwirft späte Backend-Ergebnisse. Falscher Bildtyp und ungültige Modellbytes erzeugen keine Übernahmeaktion. Anbieterwechsel verwirft die Vorschau. Eine Tresorsperre während der asynchronen Importvorbereitung invalidiert den an den Host übergebenen Commit-Schutz.

Der neue Playwright-Test ist für Auswahl, gerenderte Vorschau, Erhalt des Originalplayers und anschließenden Modellimport vorbereitet. Er verwendet ebenfalls synthetische Dienstantworten und konnte hier nicht ausgeführt werden.

## Grenzen und nächster Nachweis

Echte TripoSR-/GPU-Inferenz, visuelle Qualität, CORS im gerenderten Browser und tatsächliches Mausgefühl der zweiten Vorschau sind nicht abgenommen. Die Übernahme nutzt den vorhandenen Modellimport mit erneuter Zielprüfung; sie hat noch kein projektübergreifendes Undo. Originaldateien bleiben unverändert. Anatomisches Rigging, Cloud-Fachadapter, automatische Geometrie-Fallbacks und freie Korrekturprompts bleiben offen.
