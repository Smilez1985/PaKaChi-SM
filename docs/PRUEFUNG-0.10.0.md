# Prüfstand 0.10.0

- `npm test`: 43 Tests bestanden. Drei neue Tests prüfen skalierte SkinnedMesh-Vertices und Gesichtspunkte, Bearbeitung und Originalwiederherstellung, nicht gleichmäßig skalierte Eltern, Interpolation und Schleifen, Dateirundlauf/Altdateien sowie den Mausregler mit einem Undo-Schritt und MCP-Konfliktschutz.
- `PAKACHI_PYTHON=/tmp/pakachi-python/bin/python npm run test:python`: reale Python-MCP-2.3.0-/aMQTT-Integration bestanden; gültige Skalierung gelangt bis zum Studio, ungültige wird abgewiesen. Weiterhin acht Tools.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung, JavaScript rund 1,13 MB / 308 kB gzip.
- Erhaltungsprüfung in `npm test`: alle 83 Originaldateien einschließlich 72 Transformationsbildern bytegenau erhalten.
- Die unveränderten Original-Testprogramme wurden zuletzt in 0.9.0 erfolgreich ausgeführt.

Die Tests verwenden Three.js-Geometrie und happy-dom ohne gerendertes WebGL. Visuelle Maus-/WebGL-Abnahme, externer KI-Host und externer NanoMQ-Broker bleiben offen.
