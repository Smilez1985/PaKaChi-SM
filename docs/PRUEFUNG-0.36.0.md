# Prüfbericht 0.36.0

- `npm test`: 206 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,32 MB / 366 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Vier neue Tests

1. Exaktes Prüfbild öffnet pausiert und bleibt trotz Zeitupdate stehen. Stopp stellt Bearbeitungspose und unverändertes Projekt wieder her; Revision und Dirty-Status bleiben erhalten.
2. Übernahme erzeugt eine unabhängige neue Pose. Bestehender Move bleibt unverändert; Undo/Redo stellt Daten und jeweilige angezeigte Pose wieder her.
3. Unbekannte Moves, ungültige Zeitpunkte, veraltete Revision und geschlossenes Studio werden abgewiesen. Der exakte Endpunkt ist erreichbar; bei 100 Posen wird die Übernahme verhindert.
4. DOM-Ablauf vom Prüfen über „Auffälliges Bild ansehen“ bis zur ausdrücklichen Posenübernahme. Die Übernahme-Schaltfläche ist in der pausierten Prüfvorschau bedienbar.

Tests verwenden Three.js und happy-dom, keinen gerenderten Browser. Keine automatische Korrektur, keine automatische Einfügung in bestehende Moves und kein kontinuierlicher Grenznachweis. Kein neuer MCP-/Python-Livelauf.
