# Prüfbericht 0.49.0

- 248 Node-Tests und TypeScript-/Produktionsbuild bestanden; bekannte Bundle-Warnung.
- 248 Tests, Build und alle zwölf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)).
- Geprüfter Commit: `f44a4d7230cbf65693608dc50b8d0c3b16545334`; Job `120880655112`; Chromium-Laufzeit 2,5 Minuten.

Zwei neue Tests prüfen wiederholtes Einfügen/Löschen/Einfügen, identische Hautgewichte und Vertex-Indizes nach Katalogexport und Rekonstruktion, unveränderte Grundgeometrie und tatsächliche Oberflächenverformung durch das Ersatzgelenk. Ungültige, rückläufige und außerhalb der Löschliste liegende Reihenfolgemarker werden abgewiesen. Der DOM-Test nimmt Löschen und anschließendes Einfügen unabhängig per Undo/Redo zurück und stellt beide Eingriffe wieder her.

Der bestehende Browserfall entfernt das ursprüngliche Mika-Knie, lädt das Projekt, fügt ein Ersatzgelenk ein und speichert/lädt erneut. Dieser Ablauf ist im erfolgreichen CI-Lauf nachgewiesen. Für den vorausgehenden 0.48.0-Commit meldete GitHub bei der erneuten Abfrage weiterhin keine Workflow-Läufe.

Die Gewichtsverteilung ist weiterhin eine geometrische Näherung. Manuelle Haut-/Bewegungsprüfung, freies Umhängen, eigene Knochenskalierung, Anbauteile und MCP-Topologieaktionen bleiben offen. Original-PaKaChi-Assets bleiben unverändert.
