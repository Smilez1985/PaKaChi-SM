# Prüfbericht 0.54.0

**0.54.0:** Knochen mit starren Anbauteilen können umgehängt werden. Auch verschachtelte starre Objektgruppen mit eigener Drehung und Skalierung bleiben am Knochen befestigt; Grundstellung und gespeicherte Einzelposen behalten ihre Welttransformationen. Anbauteile mit eigenen Knochen oder SkinnedMesh bleiben ausgeschlossen. Löschen eines Knochens mit Anbauteilen ist weiterhin gesperrt. 258 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40184399914)).

Geprüft werden Weltmatrizen einer verschachtelten, gedrehten und nicht gleichmäßig skalierten starren Objektgruppe in Grundstellung und gespeicherter Pose sowie nach Wiederladen und Rückkehr zur Quellhierarchie. Das Anbauteil folgt dem neuen Elternzweig. UI-/Agenten-Undo wird mit Anbauteil ausgeführt. Eigene Knochen und SkinnedMesh unter Anbauteilen sowie Löschen mit Anbauteilen werden abgewiesen. Der bestehende Chromium-Fall verwendet Mika mit einem ausschließlich für diesen Test ergänzten starren Mesh; die mitgelieferten Modelle bleiben unverändert.

Keine neue reale Anbieter-/Python-MCP-Host- oder manuelle Haut-/Bewegungsabnahme.

Geprüfter Commit: `6253b786bcc71439ef097b4d42e1d0dca8e1eb10`. Der korrigierte GitHub-Lauf bestätigt 258 Node-Tests (0 Fehler), erfolgreichen Build und alle 16 Chromium-Fälle in 2,4 Minuten.

Der [erste Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40183900791) bestand Node-Tests und Build, scheiterte aber in einem Browserfall: Das Test-Anbauteil verwendete dieselbe Mesh-Definition wie die geriggte Figur und wurde ohne gültiges Skelett geladen. Der korrigierte Test verwendet eine eigene starre Mesh-Definition ohne Gelenk-/Gewichtsattribute. Ein zusätzlicher Importtest prüft die tatsächlichen Objekttypen, das Umhängen und die Rekonstruktion.
