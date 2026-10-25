# Prüfbericht 0.56.0

**0.56.0:** Hautgewichtsübertragungen können auf einen kugelförmigen Bereich um das Quellgelenk begrenzt werden. Radius per Mausregler; Stärke nimmt zum Rand weich auf null ab. Außerhalb bleiben Gewichte unverändert. Assistent/MCP unterstützen optional `region: {center, radius}`; Projekt-/Katalogexport erhalten den Bereich. 266 Node-Tests und Build bestanden; erweiterter Chromium-Nachweis steht aus.

Zwei zusätzliche Tests prüfen weichen Randabfall, unveränderte Außenpunkte, Transformation/Skalierung des Ursprungsmodells und der aktuellen Figur, Rekonstruktion/Katalogexport, kopierte Bereichsdaten sowie ungültige und leere Bereiche ohne bleibende Änderung. Der Mika-Test verwendet den im Browser geprüften Radius 0,5. Node-MCP transportiert den Bereich; Python-Syntax geprüft. Der bestehende Chromium-Fall verwendet Checkbox und Radiusregler sowie Undo/Redo und Wiederladen.

Der Bereich bezieht sich auf normalisierte Weltkoordinaten der ursprünglichen Grundpose, unabhängig von der aktuellen Figurpose. Die Oberfläche nutzt den gespeicherten Gelenkpunkt als Mittelpunkt; API-Aufrufe können einen eigenen Mittelpunkt setzen. Noch kein kontinuierlicher Malpinsel oder sichtbare Bereichsvorschau. Höchstens vier normalisierte Einflüsse pro Vertex; manuelle Hautqualität und echte Anbieterabnahme bleiben offen.
