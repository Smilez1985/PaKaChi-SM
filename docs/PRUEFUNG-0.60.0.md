# Prüfbericht 0.60.0

**0.60.0:** Die tatsächlichen Hautgewichte des ausgewählten Knochens können farbig angezeigt werden: Blau = 0 %, Grün = 50 %, Rot = 100 %, mit Zwischenfarben. Die Anzeige folgt Auswahl, Gewichtsübertragung, Pinsel und Undo/Redo. Ausschalten, Posenmodus und Verlassen des Studios stellen ursprüngliche Materialien und Vertex-Farben wieder her. Die Ansicht verändert weder Projekt, Revision noch Undo-Verlauf.

277 Node-Tests und Build bestanden. Neuer Chromium-Nachweis steht aus.

Zwei neue Node-Tests prüfen Farben aus Skinning-Paletten, Gewichtsänderungen, ursprüngliche Materialidentität und Vertex-Farben, Materialarrays und Ressourcenfreigabe. Mit echtem StudioView/Editor werden unveränderte Revision/Daten, Pinsel, Auswahl, Undo/Redo, Moduswechsel und Verlassen/Wiederbetreten geprüft. Ein neuer Chromium-Fall vergleicht die gerenderte Mika-Oberfläche vor/nach Aktivierung und nach Deaktivierung und prüft den unveränderten Projektstatus.

Nur geriggte Oberflächen mit Skinning-Gewichten. Farben werden zwischen Vertices über Dreiecke interpoliert; die Anzeige ist keine Anatomie- oder Qualitätsbewertung. Der bestehende Pinsel bleibt kugelförmig und auf 128 gespeicherte Übertragungen begrenzt. Beschränkung auf sichtbare Vertices, größere Pinselbudgets und manuelle Hautqualitäts-/Performance-Abnahme bleiben offen.
