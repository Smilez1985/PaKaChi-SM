# Prüfbericht 0.37.0

- `npm test`: 210 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,33 MB / 367 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Vier neue Tests

1. Änderung betrifft ausschließlich die ausgewählte Move-Folge. Posen und aktuelle Figur bleiben erhalten; Dauer/Export folgen der neuen Reihenfolge, Undo/Redo stellt sie wieder her. Eingabearray wird kopiert.
2. Fehlende Posen/Moves, Anzahlgrenzen, veraltete Revision, Wiedergabe und Rig-Modus werden ohne Datenänderung abgewiesen. Identische Folge erzeugt keine neue Revision.
3. DOM-Steuerung verschiebt/entfernt einzelne wiederholte Vorkommen, fügt Posen ein und ersetzt sie. Projektposen bleiben unverändert; mindestens zwei Schritte bleiben erforderlich.
4. Übernommene Prüfpose kann per Bedienung einen bestehenden Schritt ersetzen. Änderung während einer laufenden Beugegrenzenprüfung verwirft deren Ergebnis.

Three.js und happy-dom, keine gerenderte Browserabnahme. Kein neuer MCP-/Python-Livelauf. Keine Agentenbearbeitung bestehender Folgen, keine unabhängigen Zeiten pro Vorkommen und keine automatische Bewegungskorrektur.
