# Prüfstand 0.3.0

- `npm test`: 22 Tests bestanden, einschließlich der bisherigen Player-, MQTT-, MCP- und Erhaltungsprüfungen.
- Neue Geometrieprüfungen verwenden tatsächlich geladene glTF-Skelette: Grundoberfläche bleibt bei Drehpunktänderung erhalten; Posieren bewegt Vertices; die ursprüngliche Hautbindung lässt sich wiederherstellen.
- Freie Gesichtspunkte wirken innerhalb ihres Einflussradius auf ihr Teilmodell. Punktgröße beeinflusst die Verformung nicht. Ein Gesichtspunkt folgt dem gedrehten Kopf und lässt sich in dieser Ansicht weiter bewegen.
- Posen interpolieren Positionen und Quaternionen. Modell, Rig, Posen und Moves lassen sich über das Projektformat wiederherstellen. Ungültige Verbindungen, nichtendliche Werte, fehlende Pose-Werte und doppelte Moves werden abgewiesen.
- Der DOM-Test betätigt die echten Editor-Bedienelemente für Hinzufügen, Größe, Verbinden, Rückgängig/Wiederholen, Posen und eine abspielbare Bewegung. Dabei wird ein echter Three.js-Geometrie-Rig mit einer simulierten 3D-Eingabeansicht verwendet.
- `npm run test:legacy`: beide ursprünglichen Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich. Das gebündelte JavaScript umfasst mit Three.js und Editor etwa 735 kB unkomprimiert; Vite weist weiterhin auf die Chunkgröße hin.
- Die Erhaltungsprüfung bestätigt alle 83 Originaldateien einschließlich genau 72 Transformationsbildern unverändert.

Playwright-Abläufe für tatsächliche Mausbedienung, Projekt-Download/-Import und Steuerung sind erweitert. Sie wurden hier nicht ausgeführt: Chromium kann wegen der bekannten Socket-Beschränkung der Umgebung nicht starten. DOM- und Geometrietests ersetzen keine visuelle Browserabnahme. Ebenfalls noch offen: Live-Abnahme mit einem externen Agenten/NanoMQ sowie Qualität an komplexen Fremdmodellen.

Die funktionalen Grenzen dieser ersten Editor-Version stehen in [STUDIO.md](STUDIO.md), insbesondere Quellknochenumbau, IK, Gewichtsneuzuordnung, GLB-Export und Bild-zu-3D.
