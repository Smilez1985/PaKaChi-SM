# Prüfstand 0.4.0

- `npm test`: 23 Tests bestanden. Enthalten sind die bisherigen Player-, Studio-, Geometrie-, MQTT-, Node-MCP- und Erhaltungsprüfungen sowie die Kameradrehung um alle Achsen.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript-Prüfung und Produktionsbuild erfolgreich. Das gemeinsame JavaScript-Bundle einschließlich Three.js, Arcball und MQTT.js umfasst etwa 1,10 MB unkomprimiert / 296 kB gzip; Vite meldet die Chunkgröße.
- `PAKACHI_PYTHON=<Python-Umgebung> npm run test:python`: ein Integrationstest mit mehreren Prüfungen bestanden. Der echte Python-MCP-2.3.0-Prozess startet aMQTT 0.12.1; ein offizieller MCP-Client ruft die sechs Tools auf. Der produktive MQTT-Playerclient läuft über WebSocket und steuert den echten gemeinsamen Zustandsrouter. Erfolge und Ablehnungen werden über MQTT bis zur MCP-Antwort zurückgeführt.
- Zusätzlich im Integrationstest geprüft: falsches Broker-Passwort, fehlender Player, nicht unterstützter Zustand, direkter MQTT-Befehl, doppelte Anfragen, abgelaufene Anfragen, mehrere mögliche Player und wirksames Ausschalten des Empfangs.
- Die Kamera-Prüfung bestätigt erreichbare Unterseite, Rückseite und Rollbewegung bei gleichbleibendem Drehzentrum. Ansichtsdrehung verändert keine Modelldaten.
- Alle 83 wiederhergestellten Originaldateien einschließlich der 72 Transformationsbilder bleiben bytegenau erhalten.

Die Python-Integration wurde mit Python 3.12 getestet. Sie verwendet echte Netzwerkverbindungen und den produktiven Transportcode, aber keine gerenderte Browseroberfläche. Die visuelle Arcball-/WebGL-Abnahme bleibt wegen der bekannten Chromium-Startbeschränkung offen. Ein konkreter externer KI-Host und ein externer NanoMQ-Broker wurden nicht live eingerichtet; deren Konfiguration ist in [PYTHON-MCP.md](PYTHON-MCP.md) beschrieben.
