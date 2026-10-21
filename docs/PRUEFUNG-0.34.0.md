# Prüfbericht 0.34.0

- `npm test`: 197 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,32 MB / 364 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich der 72 Transformationsbilder besteht.

## Fünf neue Tests

1. Gespeicherte direkte Gelenkdrehung außerhalb der Grenze wird gemessen; aktuelle Gelenktransformationen, Weltmatrizen, Daten und gespeicherte Pose bleiben unverändert.
2. Randwerte gelten innerhalb der Toleranz als gültig; degenerierte Segmente und getrennte Ketten werden als nicht auswertbar gemeldet. Fehlende Grenzen ergeben keinen erfundenen Erfolgsnachweis.
3. Messung stimmt bei rotierten/skalierten Quellknochen mit IK überein und bleibt von der aktuellen Figurpose unabhängig.
4. DOM-Bericht zeigt Namen als Text, ändert weder Revision noch Dirty-Status oder Projekt; neue Auswahl/Bearbeitung entfernt alte Ergebnisse, geschlossenes Studio weist Aufrufe ab.
5. Am tatsächlichen Mika-Modell stimmen gespeicherte Winkel mit geometrisch gemessenen Gelenkpositionen überein; die inzwischen zurückgesetzte aktuelle Pose bleibt erhalten.

Keine gerenderte Browserprüfung. Die Tests verwenden Three.js-Geometrie und happy-dom. Keine Messung aller Bewegungszwischenbilder, Kollisionen, Originalclips oder Twistgrenzen. Prüfberichte bleiben flüchtig; kein automatisches Korrigieren oder Löschen bestehender Prüfmarkierungen. Kein neuer MCP-Transport oder Python-Livelauf.
