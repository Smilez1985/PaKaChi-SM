# Prüfbericht 0.32.0

- `npm test`: 185 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Vite bestanden; bekannte Bundle-Warnung (rund 1,31 MB / 362 kB gzip).
- Die vollständige Erhaltungsprüfung für 83 Originaldateien einschließlich 72 Transformationsbildern besteht.

## Sieben neue Tests

1. Zwei Sammlungen für verschiedene Modellbindungen zusammenführen: bytegleiche Dateien, korrekte Prüfsummen, Quellen unverändert. Kompatibler Import gelingt; unpassendes Zielmodell wird weiterhin abgewiesen.
2. Doppelte IDs und Pfade scheitern vor Ausgabeerstellung.
3. Fehlerhafte JSON-Dateien, Posen, Posenreferenzen, falsche Move-ID und fehlende Dateien scheitern ohne Ausgabe.
4. Entweichende Symlinks, Ausgabe innerhalb einer Quelle und übergroße Move-Dateien werden abgewiesen.
5. Tatsächlicher CLI-Unterprozess erzeugt Sammlung; wiederholter Aufruf überschreibt die Ausgabe nicht.
6. Leere Sammlung lässt sich ergänzen; echte Dateien an der Einzelgrößengrenze überschreiten zusammen das 64-MiB-Limit und werden vor dem Schreiben abgewiesen.
7. Eigenständige Strukturprüfung erkennt unterschiedliche Spurensätze, unbenutzte Posen und ungültige Quaternionen; wiederholte Posen bleiben erhalten.

Die bestehenden Tests für Studio-Import, Kompatibilitätsgrenzen, Undo/Redo und veraltete Downloads bestehen weiterhin. Keine gerenderte Browser-/Hosting-Abnahme und kein Nachweis anatomischer Qualität. Strukturvalidierung und Prüfsummen sind kein Herkunftsnachweis; Kompatibilität wird am tatsächlichen Zielprojekt geprüft.
