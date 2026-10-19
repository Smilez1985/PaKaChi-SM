# Prüfbericht 0.29.0

Zeitstempel: 2026-10-19T16:46:59+02:00 (Europe/Berlin)

- `npm test`: 165 Tests bestanden; Originaldateien einschließlich 72 Transformationsbildern unverändert.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlegrößenwarnung bleibt bestehen.
- Sechs neue Tests in `tests/zoo-export.test.mjs`: bereinigtes Projektpaket und echtes synthetisches GLB erneut laden; relative Quellen, reservierte IDs und Quellmehrdeutigkeit; falsche Projekt-ID, JSON, HTTP-Fehler, Größenheader und Abbruch; Chunk-Zusammensetzung und tatsächliche Streamgrenze mit Abbruch des Readers; neuer Ausgabeordner und Überschreibschutz; ungültige Eingabe ohne Dateischreibzugriff und echter CLI-Prozess.
- Nach Ergänzung der Streamgrößenprüfung alle sechs Export-/Ladetests nochmals bestanden. HTTP-Antworten sind Testdoubles, Dateioperationen und CLI-Prozess sind real.
- Codeabgleich: Katalogprojekt wird vor dem vorhandenen Modelllader strukturell geprüft und anschließend durch dieselben Modell-/Geometrie-/Revisionsprüfungen und die vorbereitete 3D-Installation geführt.
- Kein gerenderter Browser-/Hosting-Test, kein automatisches Deployment, keine Anatomie-/Textur-/GPU-Abnahme. Das Exportskript validiert die Projektstruktur; visuelle Modellqualität wird damit nicht zugesichert.
