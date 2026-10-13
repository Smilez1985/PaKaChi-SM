# Prüfstand 0.2.0

- `npm test`: 16 Tests bestanden. Enthalten sind glTF-Laden und reale Knochenanimation, Zustands-/Move-Verhalten, MQTT-Protokoll bis zum Router, WebSocket-Kopplung und echter MCP-stdio-Handshake mit Tool-Aufrufen.
- `npm run test:legacy`: Original-Controller und MQTT-Lebenszyklus bestanden.
- `npm run build`: TypeScript-Prüfung und Produktionsbuild erfolgreich. Vite meldet weiterhin das große Three.js-Bundle (ca. 675 kB unkomprimiert).
- Erhaltungsprüfung: alle 83 wiederhergestellten Originaldateien, darunter genau 72 Transformationsbilder, stimmen bytegenau mit dem gesicherten Stand überein.

Die Browserabläufe sind als Playwright-Tests hinterlegt, wurden hier aber nicht ausgeführt: Chromium scheitert an der Socket-Beschränkung der Ausführungsumgebung. Daher keine visuelle Abnahme behauptet. Es gab keine Live-Abnahme mit NanoMQ oder einem externen Agenten; der MCP-Test verwendet den offiziellen SDK-Client und eine simulierte Player-Gegenstelle.

Noch nicht implementiert: Gelenk-/Posenbearbeitung, freie Gesichtspunkte, editierbare Studio-Projekte, Bild-zu-3D und die 3D-Übertragung der beiden Originalformen.
