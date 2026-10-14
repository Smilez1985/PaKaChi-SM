# Prüfstand 0.9.0

- `npm test`: 40 Tests bestanden. Neue Tests prüfen tatsächliche Studio-Bearbeitung bis zum gespeicherten/abspielbaren Move, Undo, fehlende Freigabe, veraltete Sitzungen/Revisionen, manuelle Änderungen, laufende Gesten, ungültige Befehle ohne Seiteneffekte und begrenzte Antwortseiten.
- `PAKACHI_PYTHON=/tmp/pakachi-python/bin/python npm run test:python`: echter Python-MCP-2.3.0-Prozess, aMQTT 0.12.1, produktiver PlayerMQTT und echter StudioEditor mit happy-dom. Acht Tools gelistet, Punkte angelegt und Pose gespeichert; fehlende Freigabe/veraltete Revision abgewiesen. Bisherige Authentifizierungs-, Zustands-, Duplikat-, Ablauf- und Opt-out-Prüfungen bleiben enthalten.
- Node-MCP-Handshake und Studio-Befehlsweitergabe mit simulierter Browser-Gegenstelle in den regulären Tests bestanden.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Bundlegröße bleibt bestehen (rund 1,13 MB / 307 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau erhalten.

Die Prozessintegration verwendet echte lokale Netzwerkverbindungen, jedoch keine gerenderte Oberfläche. Visuelle WebGL-Abnahme, konkreter externer KI-Host und externer NanoMQ-Broker bleiben offen.
