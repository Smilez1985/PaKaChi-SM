# Prüfstand 0.8.0

- `npm test`: 37 Tests bestanden. Drei neue Prüfungen decken Gesamtdrehung skinned Geometrie, mitgeführte Gesichtspunkte und weitere Bearbeitung nach Drehung, Rückkehr zu Originalclips, knochenlose Modelle unter ungleichmäßiger Elternskalierung, Projektpersistenz, Slerp und den Editorablauf mit Undo ab.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Bundlegröße bleibt bestehen (rund 1,12 MB / 305 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau erhalten.

Three.js-Geometrie und happy-dom-Ereignisse sind automatisiert geprüft. Die gerenderte Browserabnahme bleibt wegen der bekannten Chromium-Startbeschränkung offen. Die unveränderte Python-MCP-Integration wurde nicht erneut ausgeführt; diese Änderung erweitert die Daten und Wiedergabe vorhandener Moves, nicht die Agentenprotokolle.
