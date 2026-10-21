# Prüfbericht 0.39.0

- `npm test`: 219 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Warnung zum großen gemeinsamen Bundle (rund 1,33 MB / 367 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Fünf neue Tests

1. Native Cursor-Folgeseiten bleiben am konfigurierten Endpoint einschließlich Proxy-Präfix; Sonderzeichen werden korrekt als Querywert kodiert. Schlüssel nur im Header; Ergebnisse sortiert und dedupliziert.
2. Fehlende/falsche/wiederholte Cursor, leere Seiten mit Fortsetzungsflag und ungültiges `has_more` verwerfen die ganze Abfrage.
3. Maximal zehn Seiten beziehungsweise 5000 empfangene Einträge; keine endlosen Folgen trotz neuer Cursor.
4. Fehler auf späteren Seiten bleiben klassifiziert (401/429/500); keine Teilliste als Erfolg.
5. Ein Abbruch beziehungsweise Timeout gilt auch auf Folgeseiten. Späte Antworten starten keine weiteren Anfragen.

Protokolltests mit simuliertem Fetch; keine echte Anthropic-Anmeldung, Browser-CORS- oder Modellqualitätsabnahme. Andere Anbieter bleiben bei ihrem bisherigen Modelllistenprotokoll. Keine Änderung an Profilen, Rollen oder gespeicherten Zugangsdaten.
