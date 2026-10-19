# Prüfbericht 0.30.0

- `npm test`: 171 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Vite erfolgreich; bekannte Warnung zum gemeinsamen JS-Bundle (rund 1,30 MB / 359 kB gzip).
- Erhaltungsprüfung für 83 Originaldateien einschließlich 72 Transformationsbildern im vollständigen Testlauf bestanden.

## Neue Nachweise

Sechs Tests verwenden echte temporäre Dateien, die mitgelieferten Mika-/Nori-Modelle, ein synthetisches reales GLB und einen tatsächlichen CLI-Unterprozess:

1. Zusammenführung von mitgeliefertem Katalog und Projektpaket; Katalog lesbar, Modelle/Projekte bytegenau erhalten, Bericht mit korrekten Größen und SHA-256-Prüfsummen, Quellen unverändert.
2. Doppelte IDs und normalisierte Pfadkonflikte scheitern vor Erstellung der Ausgabe.
3. Fehlende, fehlerhafte und zur ID unpassende Projekte scheitern vor Erstellung der Ausgabe.
4. Entweichende Symlinks und Ausgabe innerhalb der Quelle werden abgewiesen.
5. Externe Modellressourcen und reservierte IDs werden abgewiesen.
6. CLI führt tatsächlich zusammen; ein bestehender Ausgabeordner wird nicht überschrieben.

## Grenzen

Keine gerenderte Browser-, Hosting- oder Qualitätsabnahme. Container-/Ressourcenprüfungen belegen keine anatomisch korrekte Geometrie. Die Ausgabe enthält nur katalogreferenzierte Modelle/Projekte; keine vollständige Anwendung. Schreibfehler können einen unvollständigen neuen Ordner hinterlassen. Kein automatisches Deployment.
