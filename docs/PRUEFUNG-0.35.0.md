# Prüfbericht 0.35.0

- `npm test`: 202 Tests bestanden; keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,32 MB / 365 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich der 72 Transformationsbilder besteht.

## Fünf neue Tests

1. Zwei gültige Schlüsselposen mit ungültiger Zwischenbeugung: Interpolation meldet Verletzungen; Daten, Live-Pose und Weltmatrizen bleiben unverändert.
2. Ungleiche Dauern, wiederholte Posen, Übergangsgrenzen und Schleifenrückweg; maximal 1601 Stichproben.
3. Abbruch und ungültiger Studio-Stand verwerfen Ergebnisse; getrennte Ketten werden nicht als bestandene Gelenke ausgegeben.
4. Editorprüfung verändert weder Revision, Dirty-Status noch Projekt. Abbruch, Bearbeitung und Verlassen verhindern Veröffentlichung; Bedienelemente werden wieder freigegeben.
5. DOM zeigt Stichprobenhinweis, Verletzung und Namen als Text; Bearbeitung entfernt alte Ergebnisse.

Die bestehenden realen Mika-/Nori-Geometrie- und Posenmessungstests laufen mit. Neue Bewegungsprüfungen verwenden synthetische Three.js-Ketten und happy-dom, keine gerenderte Browserabnahme. Keine kontinuierliche Garantie, Kollisionsprüfung, Originalclip-Prüfung oder automatische Korrektur. Kein neuer Python-/MCP-Livelauf.
