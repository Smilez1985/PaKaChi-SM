# 2D/3D-Landmarken-Korrespondenz

Stand: 2026-11-19 · Arbeitsbranch: `develop`

## Zwei zulässige Wege

Eine 2D-Landmarke darf nur dann als 3D-Evidenz verwendet werden, wenn ihre räumliche Zuordnung nachvollziehbar ist:

1. **Kalibrierte Mehransicht:** Mindestens zwei passende Beobachtungen derselben Landmarke aus kalibrierten Kameras werden trianguliert. Parallaxe, Kameratiefe und Strahlresiduum werden geprüft.
2. **Explizite Oberflächenzuordnung:** Ein Nutzer ordnet eine gespeicherte 2D-Landmarke einer konkret ausgewählten Fläche im 3D-Mesh zu. Der Punkt wird aus Dreiecksindex und baryzentrischen Koordinaten in Mesh-Lokalraum berechnet.

Einzelbilder liefern keine Tiefe. Die zweite Methode behauptet keine Triangulation und erfindet keine Rückseitengeometrie; sie speichert eine geprüfte Korrespondenz zwischen einer Bildbeobachtung und einem vom Nutzer ausgewählten Oberflächenpunkt.

## Implementierter Resolver

`resolveReviewedLandmarkSurfacePicks()` prüft Quellbild- und 3D-Asset-Hashes, Avatar-/Form-/Ansichts-/Posen-Provenienz, explizite Bestätigung, stabile Part-/Layer-IDs, Mesh-Inventar, Dreiecksgrenzen und baryzentrische Koordinaten. Er berechnet den 3D-Punkt ausschließlich aus den drei Vertices des gewählten Quell-Dreiecks. Die Ausgabe trägt Herkunft `user` und Richtlinie `locked`; sie ist ein Eingabebaustein für die spätere Cluster-Neuberechnung, keine automatische Übernahme in ein Manifest.

## Grenzen

- Es wird keine Kamera aus einer Bildtafel geraten.
- Posen und Ansichten werden nicht fusioniert.
- Der Resolver wählt weder Mesh noch Dreieck automatisch.
- Das 3D-Mesh wird nicht verändert.
- Die UI-Auswahl im gerenderten Studio und das persistente Speichern der Korrespondenzen stehen noch aus.
