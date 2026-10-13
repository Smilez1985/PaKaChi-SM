# Prüfstand 0.5.0

- `npm test`: 27 Tests bestanden, einschließlich vier neuer Prüfungen für Erkennung/Einzellöschung/Undo, mittlere Maustaste und Inversion, Sprachwechsel und Speicherung sowie direktes Punktziehen am produktiven StudioView.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich. Vite meldet weiterhin das große gemeinsame Bundle (ca. 1,12 MB / 303 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau unverändert.

DOM- und Ereignistests laufen mit happy-dom; Geometrieprüfungen mit Three.js. Eine reale gerenderte Browserprüfung konnte wegen der bekannten Chromium-Startbeschränkung nicht erfolgen. Insbesondere das Mausgefühl bleibt visuell abzunehmen. Die unveränderte Python-MCP-Integration wurde in diesem Meilenstein nicht erneut ausgeführt; ihr letzter echter Integrationstest ist im Prüfstand 0.4.0 dokumentiert.
