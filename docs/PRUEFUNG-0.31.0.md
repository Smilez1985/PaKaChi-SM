# Prüfbericht 0.31.0

- `npm test`: 178 Tests bestanden; keine Fehler, übersprungenen oder ausstehenden Tests.
- `npm run build`: TypeScript und Vite bestanden. Bekannte Warnung zum gemeinsamen Bundle (rund 1,30 MB / 361 kB gzip).
- Erhaltungsprüfung: 83 Originaldateien einschließlich 72 Transformationsbildern unverändert.

## Sieben neue Tests

1. Katalogschema: eindeutige IDs/Pfade, Ablehnung externer URLs und Pfadmanipulationen.
2. Anwendungsbasis, Abrufe ohne Zugangsdaten/Redirects und Prüfung der Move-ID gegen den Katalog.
3. Stream-/Headergrößen, HTTP-Fehler, ungültiges UTF-8 und Abbruch vor Annahme eines Katalogs.
4. Echter CLI-Unterprozess mit temporären Dateien: Export, Laden über den Katalog und validierter Move-Import; Quelle unverändert, vorhandene Ausgabe nicht überschrieben.
5. Fehlerhafte oder leere Projekte erzeugen keinen Ausgabeordner.
6. Studio mit happy-dom und Three.js: Katalogbeschriftung als Text, Import und ein Undo-Schritt ohne automatische Wiedergabe.
7. Verzögerte Downloads nach Bearbeitung, Verlassen oder Entsorgen des Studios werden nicht übernommen.

Der vollständige Testlauf schließt die bisherigen Kompatibilitäts-, Projektgrenzen-, SHA-256- und Undo/Redo-Prüfungen ein. Transporttests verwenden kontrollierte Responses/Streams. Kein gerenderter Browser- oder Hosting-Test; kein Nachweis von Bewegungsqualität oder Retargeting. Die ausgelieferte Sammlung ist bewusst leer.
