# Prüfbericht 0.57.0

**0.57.0:** Die räumlich begrenzte Gewichtsübertragung zeigt eine Vorschau im Studio: grüne Außenringe markieren den Radius, orange Innenringe die halbe Stärke. Sie folgt Auswahl, Radius und bearbeitetem Gelenkpunkt und wird im Posenmodus sowie außerhalb des Studios ausgeblendet. Die Vorschau verändert weder Projekt noch Undo-Verlauf. 268 Node-Tests und Build bestanden; neuer Chromium-Nachweis steht aus.

Zwei neue Tests prüfen Geometrie, Radius, halbe Stärke, ungültige Bereiche, Freigabe der Grafikressourcen und Integration mit dem echten StudioView/Editor: Auswahl, Radius, Gelenkverschiebung, Undo/Redo, Moduswechsel und Verlassen/Wiederbetreten. Das Einschalten der Vorschau verändert weder Daten, Revision noch Änderungsstatus. Der bestehende Chromium-Fall vergleicht die Canvas-Bilder vor/nach Einschalten und erstellt einen Screenshot der Bereichsvorschau.

Die Ringe zeigen den räumlichen Bereich in der ursprünglichen Grundpose, nicht die tatsächlich gewichteten Vertices. Kontinuierlicher Gewichtspinsel und farbige Darstellung der Hautgewichte bleiben offen. Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.
