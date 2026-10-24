# Prüfbericht 0.49.0

- 248 Node-Tests und TypeScript-/Produktionsbuild bestanden; bekannte Bundle-Warnung.
- Zwölf Chromium-Fälle vorhanden; Browsernachweis für Knochenlöschen und gemischte Umbaufolgen steht aus.

Zwei neue Tests prüfen wiederholtes Einfügen/Löschen/Einfügen, identische Hautgewichte und Vertex-Indizes nach Katalogexport und Rekonstruktion, unveränderte Grundgeometrie und tatsächliche Oberflächenverformung durch das Ersatzgelenk. Ungültige, rückläufige und außerhalb der Löschliste liegende Reihenfolgemarker werden abgewiesen. Der DOM-Test nimmt Löschen und anschließendes Einfügen unabhängig per Undo/Redo zurück und stellt beide Eingriffe wieder her.

Der bestehende Browserfall entfernt das ursprüngliche Mika-Knie, lädt das Projekt, fügt ein Ersatzgelenk ein und speichert/lädt erneut. Dieser Ablauf ist bis zu einem erfolgreichen CI-Lauf nur vorbereitet. Für den vorausgehenden 0.48.0-Commit meldete GitHub bei der erneuten Abfrage weiterhin keine Workflow-Läufe.

Die Gewichtsverteilung ist weiterhin eine geometrische Näherung. Manuelle Haut-/Bewegungsprüfung, freies Umhängen, eigene Knochenskalierung, Anbauteile und MCP-Topologieaktionen bleiben offen. Original-PaKaChi-Assets bleiben unverändert.
