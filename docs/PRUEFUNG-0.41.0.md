# Prüfbericht 0.41.0

- `npm test`: 228 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 369 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Fünf neue Tests

1. Einzel- und Paketvorschläge lesen paginierte Move-/Posennamen, erhalten wiederholte Schritte und verändern weder Eingaben noch Studio-Daten. Andere Vorschlagsarten lösen keine Vergleichsabfragen aus.
2. Abweichende Revision auf jeder möglichen Seite oder bei abschließender Statusprüfung sowie geschlossenes Studio sperren den Vergleich.
3. Fehlende Moves/Posen und inkonsistente Seitenzähler/Folgeoffsets werden abgewiesen.
4. Tabellen zeigen Einfügen/Entfernen, DE/EN-Beschriftung und Projekttexte wörtlich; HTML-/Script-Texte werden nicht als Elemente eingefügt.
5. Das echte Assistentenpanel zeigt den lokalen Vergleich vor Übernahme, führt nur einmal aus und bietet veraltete Sequenzvorschläge nicht zur Übernahme an.

DOM-Prüfung mit happy-dom und simulierten Anbieterantworten; keine gerenderte Browser- oder echte Anbieterabnahme. Vorher/Nachher bezieht sich auf Reihenfolge und Namen, nicht auf eine animierte 3D-Vorschau. MCP-Protokoll und Projektformat bleiben unverändert.
