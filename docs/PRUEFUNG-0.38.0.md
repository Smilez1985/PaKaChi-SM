# Prüfbericht 0.38.0

- `npm test`: 214 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Warnung zum großen gemeinsamen Bundle.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Neue Nachweise

1. Sequenzlesen liefert isolierte Kopien; Agentenänderung unterstützt wiederholte Posen, erhält übrige Move-Felder/Posendaten/Figur und bildet einen Undo-/Redo-Schritt. Identische Folge bleibt ohne neue Revision.
2. Ungültige/mangelnde Felder, fehlende Ziele/Posen, fehlende Freigabe, veraltete Sitzung/Revision, Ziehgesten, Wiedergabe und Rig-Modus werden ohne Mutation abgewiesen.
3. 100 Moves mit je 100 langen Unicode-Posenverweisen lassen sich vollständig und unter dem Transportlimit paginieren.
4. Assistent liest die Sequenz und gibt `update_move` nur als Bestätigungsvorschlag zurück; kein automatischer Edit-Aufruf (simulierter Anbieter).
5. Bestehender echter Node-MCP-stdio-Test erweitert: `update_move` wird einschließlich wiederholter Posen unverändert transportiert.
6. Python-Pydantic-DTO isoliert aus dem Quelltext geladen und gültigen `update_move`-Roundtrip geprüft; kein gestarteter Python-MCP-/MQTT-Dienst.

Three.js/happy-dom und Node-Transport ersetzen keine gerenderte Browserabnahme oder Prüfung mit einem externen KI-Anbieter/MCP-Host. Keine automatische Bewegungskorrektur und keine unabhängigen Zeiten je Vorkommen.
