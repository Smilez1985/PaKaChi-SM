# Prüfbericht 0.57.0

**0.57.0:** Die räumlich begrenzte Gewichtsübertragung zeigt eine Vorschau im Studio: grüne Außenringe markieren den Radius, orange Innenringe die halbe Stärke. Sie folgt Auswahl, Radius und bearbeitetem Gelenkpunkt und wird im Posenmodus sowie außerhalb des Studios ausgeblendet. Die Vorschau verändert weder Projekt noch Undo-Verlauf. 268 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40253220224)).

Zwei neue Tests prüfen Geometrie, Radius, halbe Stärke, ungültige Bereiche, Freigabe der Grafikressourcen und Integration mit dem echten StudioView/Editor: Auswahl, Radius, Gelenkverschiebung, Undo/Redo, Moduswechsel und Verlassen/Wiederbetreten. Das Einschalten der Vorschau verändert weder Daten, Revision noch Änderungsstatus. Der bestehende Chromium-Fall vergleicht die Canvas-Bilder vor/nach Einschalten und erstellt einen Screenshot der Bereichsvorschau.

Die Ringe zeigen den räumlichen Bereich in der ursprünglichen Grundpose, nicht die tatsächlich gewichteten Vertices. Kontinuierlicher Gewichtspinsel und farbige Darstellung der Hautgewichte bleiben offen. Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.

## GitHub-Nachweis

- Geprüfter Software-Commit: `a7e0751dee95598dac6abb7ed91a5c8a8dfe569e`.
- [Workflow 40253220224](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40253220224), abgeschlossen am 26.10.2026 um 02:22:53 Uhr (Europe/Berlin).
- 268 Node-Tests bestanden, 0 fehlgeschlagen; TypeScript und Produktionsbuild bestanden.
- Alle 17 Chromium-Fälle bestanden (4,2 Minuten), einschließlich Canvas-Vergleich der Bereichsvorschau sowie Gewichtsübertragung mit Undo/Redo und Speichern/Wiederladen.
- Browsernachweise als Workflow-Artefakt hochgeladen. Der automatisierte Bildvergleich ersetzt keine manuelle Sichtprüfung.
