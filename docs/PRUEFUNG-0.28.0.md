# Prüfbericht 0.28.0

Zeitstempel: 2026-10-19T16:09:32+02:00 (Europe/Berlin)

- `npm test`: 159 Tests bestanden, einschließlich Originaldatei-Erhaltung.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlegrößenwarnung bleibt bestehen.
- Zwei neue Katalogtests: gemeinsame eindeutige IDs, nur Metadaten, genau ein ausgewählter gespeicherter Avatar; gelöschte aktive Kopie bleibt als Sitzungsidentität erhalten und verschwindet beim Wechsel.
- Drei neue DOM-/Metadatentests: Validierung und isolierte Listenkopien; Laden über gemeinsame Auswahl mit richtiger gespeicherter Identität, Sperre konkurrierender Auswahl und Aktualisierung nach Löschen; fehlerhafte/veraltete Listen werden nicht veröffentlicht.
- Codeabgleich: `list_avatars`, Dropdown und Karten verwenden dieselbe Katalogfunktion; Laden übergibt die gespeicherte ID an die vorhandene Modellinstallation. Die StateMachine übernimmt sie aus dem installierten Avatar. Keine Änderungen am MCP-Transportprotokoll.
- Die Tests verwenden happy-dom und Speicher-Testdoubles. Kein neuer Live-Nachweis für IndexedDB, gerenderte Auswahl, WebGL oder einen externen MCP-Host. Browserstart war zuvor durch einen verbotenen Socket-Systemaufruf blockiert; nicht erneut versucht.
