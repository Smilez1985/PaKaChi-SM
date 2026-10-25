# Prüfbericht 0.54.0

**0.54.0:** Knochen mit starren Anbauteilen können umgehängt werden. Auch verschachtelte starre Objektgruppen mit eigener Drehung und Skalierung bleiben am Knochen befestigt; Grundstellung und gespeicherte Einzelposen behalten ihre Welttransformationen. Anbauteile mit eigenen Knochen oder SkinnedMesh bleiben ausgeschlossen. Löschen eines Knochens mit Anbauteilen ist weiterhin gesperrt. 257 Node-Tests und Build bestanden; erweiterter Chromium-Nachweis steht aus.

Geprüft werden Weltmatrizen einer verschachtelten, gedrehten und nicht gleichmäßig skalierten starren Objektgruppe in Grundstellung und gespeicherter Pose sowie nach Wiederladen und Rückkehr zur Quellhierarchie. Das Anbauteil folgt dem neuen Elternzweig. UI-/Agenten-Undo wird mit Anbauteil ausgeführt. Eigene Knochen und SkinnedMesh unter Anbauteilen sowie Löschen mit Anbauteilen werden abgewiesen. Der bestehende Chromium-Fall verwendet Mika mit einem ausschließlich für diesen Test ergänzten starren Mesh; die mitgelieferten Modelle bleiben unverändert.

Keine neue reale Anbieter-/Python-MCP-Host- oder manuelle Haut-/Bewegungsabnahme.
