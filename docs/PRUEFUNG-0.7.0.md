# Prüfstand 0.7.0

- `npm test`: 34 Tests bestanden. Vier neue Prüfungen decken Änderungsgründe, unveränderte Posenwerte, ausgenommene kosmetische Änderungen, Ableitung betroffener Moves, Persistenz/Importvalidierung und den Editorablauf mit Undo/Redo, Bestätigung und Ersetzen ab.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Bundlegröße bleibt bestehen (rund 1,12 MB / 304 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau erhalten.

Die neuen Bedienprüfungen nutzen happy-dom. Die visuelle WebGL-/Mausprüfung bleibt wegen der bekannten Chromium-Startbeschränkung offen. Die unveränderte Python-MCP-Integration wurde nicht erneut ausgeführt; die neuen Review-Felder werden in der produktiven Fähigkeitsliste erstellt und von vorhandenen Tools weitergereicht. Ein eigener Live-Test dieser Felder mit einem externen Host steht noch aus.
