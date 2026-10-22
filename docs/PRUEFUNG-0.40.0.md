# Prüfbericht 0.40.0

- `npm test`: 223 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 368 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Neue Nachweise

1. Mehrere Moves ändern sich mit einer Revision und einem Undo-/Redo-Schritt. Eingaben werden kopiert; unbeteiligte Moves, Posenwerte und Figur bleiben erhalten. Unveränderte Pakete erzeugen keine neue Revision.
2. Ein ungültiger späterer Eintrag verändert weder erste Einträge noch Daten, Dirty-Status, Revision und bestehenden Redo-Verlauf.
3. Höchstens acht verschiedene Moves und 200 Posenverweise insgesamt; strikte verschachtelte Felder, vorhandene Ziele, Freigabe, Sitzung/Revision und Bearbeitungszustand geprüft. Die exakte Obergrenze wird akzeptiert.
4. Assistent gibt ein Paket nur als Bestätigungsvorschlag zurück und führt keine Bearbeitung aus (simulierter Anbieter).
5. Bestehender echter Node-MCP-stdio-Test transportiert `update_moves` samt Einträgen unverändert.
6. Python-Pydantic-Datenklassen isoliert geladen und Paket-Roundtrip geprüft; kein gestarteter Python-MCP-/MQTT-Dienst.

Keine gerenderte Browser-, externe Anbieter- oder MCP-Host-Abnahme. Transaktionen sind auf Posenfolgen bestehender Moves begrenzt; keine allgemeine Mehraktionsvorschau, keine Skeletttransaktion und keine automatische Bewegungskorrektur.
