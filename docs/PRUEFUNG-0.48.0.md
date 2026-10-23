# Prüfbericht 0.48.0

- 246 Node-Tests und TypeScript-/Produktionsbuild bestanden; bekannte Bundle-Warnung.
- Zwölf Chromium-Fälle vorbereitet; neuer CI-Nachweis steht aus.

Vier zusätzliche Tests prüfen eingefügte und ursprüngliche Knochen: Entfernung aus Hierarchie und Skinning-Palette, Zusammenführen der Gewichte, Erhalt der Grundform, Kindposen-Umrechnung, Undo/Redo, Projektrekonstruktion, Katalogexport und Verhinderung erneuter automatischer Erkennung gelöschter Knochen. Der Mika-Test erhält Position und Orientierung des Fußes aus einer gebeugten Kniepose. Ein Test mit unvollständiger Palette erzwingt einen Fehler und prüft die vollständige Wiederherstellung. Ungültige Löschindizes, Wurzeln und skalierte Knochen werden abgewiesen.

Der neue Browserfall entfernt das ursprüngliche Mika-Knie bei eingeschalteter Skelettanzeige, prüft die neue Fuß-Hüfte-Verbindung, Undo/Redo, Download, erneutes Laden und automatische Gelenkerkennung. Bis zum tatsächlichen CI-Ergebnis ist er nur vorbereitet.

Manuelle Haut-/Bewegungsqualität bleibt offen. Entfernung einer Gelenkspur kann deren Hautbewegung verändern, auch wenn Kindtransformationen erhalten bleiben. Wurzeln, skalierte Knochen, Anbauteile und Einfügen nach Löschungen werden noch nicht unterstützt. Kein neuer MCP-Befehl und kein GLB-Export. Original-PaKaChi-Assets bleiben unverändert.
