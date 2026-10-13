# Prüfstand 0.6.0

- `npm test`: 30 Tests bestanden. Neue Prüfungen decken die Weltverschiebung echter skinned Geometrie, Kontrollpunkte, Rückkehr zur Originalposition, knochenlose Modelle unter rotierten/skalierten Elternobjekten, Interpolation, Projektvalidierung, alte Projekte sowie den Editorablauf mit Undo/Redo ab.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Größe des gemeinsamen Bundles bleibt bestehen.
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau unverändert.

DOM-Tests verwenden happy-dom; Geometrietests Three.js und echte GLTF-Testmodelle. Die visuelle WebGL-/Mausprüfung bleibt wegen der bekannten Chromium-Startbeschränkung offen. Python-MCP blieb unverändert und wurde in diesem Meilenstein nicht erneut integriert getestet; letzter tatsächlicher Integrationstest siehe 0.4.0.
