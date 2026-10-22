# Prüfbericht 0.43.0

- `npm test`: 233 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 369 kB gzip).
- `npx playwright test --list`: sieben Browserfälle in drei Dateien erkannt.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Browser-Versuch und Grenze

Der erste Lauf scheiterte am fehlenden Chromium. Nach Installation über einen alternativen offiziellen Downloadserver wurde der Browserprozess gestartet, brach jedoch vor Seitenaufruf mit `socket() failed: Operation not permitted` ab. Alle sechs damals vorhandenen Fälle blieben dadurch ohne Anwendungsnachweis. Der anschließend ergänzte siebte Fall ist typgeprüft und aufgelistet, aber lokal nicht erfolgreich ausgeführt.

## Vorbereiteter Ablauf

Das neue E2E-Szenario richtet Mika und zwei unterschiedliche Posen über die echte Studio-Schnittstelle ein. Ein simulierter Ollama-Dienst liefert einen Sequenzvorschlag. Der Test bedient Vorher/Nachher und Stopp, prüft Wiederherstellung ohne Datenänderung, übernimmt den Vorschlag und macht ihn per Undo rückgängig. Ein Screenshot dokumentiert die Vorschau, sobald der Fall auf einem geeigneten Runner läuft.

Der neue GitHub-Actions-Workflow installiert Node 24 und Chromium, führt Tests/Build/E2E aus und sammelt HTML-Bericht, Fehler-Screenshots und Traces für 14 Tage. Keine echten Anbieterkonten, keine Secrets und kein Deployment. Die Workflow-Veröffentlichung ist noch kein erfolgreicher CI-Lauf; dessen Ergebnis muss gesondert geprüft werden.

Quellen für den Aufbau: [Playwright CI](https://playwright.dev/docs/ci), offizielle Release-Metadaten von [checkout](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node](https://github.com/actions/setup-node/releases/tag/v7.1.0) und [upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.2), geprüft am 22.10.2026.
