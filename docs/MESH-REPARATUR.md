# Mesh-Audit und sichere Reparatur – PaKaChi

## Diagnose vor Korrektur
Der lesende `auditMeshTopology` prüft unabhängig vom Schnittbudget: ungültige Indizes und NaN/Inf, Nullflächen, doppelte Dreiecke (nach Index), offene und nicht-manifold Kanten, fehlerhafte gemeinsame Kantenorientierung sowie exakt zusammenfallende Eckpunktkoordinaten. Seine Ergebnisse bedeuten **nicht**, dass die Oberfläche geschlossen, kollisionsfrei oder anatomisch korrekt ist. Im Originalformen-Benchmark wird die Topologie einmal pro Ausgangsmodell erfasst, die Schnittprüfung dagegen pro Pose.

## Manuelle Vorlage und automatisierbarer Ablauf
1. **Blender 3D Print Toolbox:** Check All, Non-Manifold, Degenerate und Intersections prüfen; problematische Flächen selektieren. Vorher Kopie speichern.
2. **Ursache trennen:** Unverbundene UV-Nähte/Felllagen sind nicht automatisch Fehler. Fehlende Dreiecke und offene Flächen können beabsichtigt sein.
3. **Konservative Reparatur:** Gezielte Entfernung eindeutiger Null- und Doppel-Dreiecke auf einer **Kopie**. Niemals allein aufgrund gleicher Positionen Eckpunkte verschweißen; unterschiedliche UVs, Normals, Bone-Gewichte und Morph-Ziele müssten erhalten bleiben.
4. **Wirklich beschädigte Oberflächen:** Saubere lokale Retopologie, Kanten neu verbinden, Normals ausrichten; bei echten Selbstschnitten robustere CGAL-Prädikate und ggf. Triangle-Soup-Autorefinement verwenden.
5. **Vorher/Nachher:** Ausgangs-GLB-Hash, Vertex-/Flächenzahl, Grenzen, Gewichte und Morphziele prüfen; 16 Gelenkposen und alle relevanten Moves vergleichen. Nur nach Regressionstest akzeptieren.

## Referenzen
- Blender: https://projects.blender.org/extensions/print3d_toolbox/wiki/Analyze
- PyMesh Cleanup: https://github.com/PyMesh/PyMesh/blob/main/docs/api_local_mesh_cleanup.rst
- Trimesh Validation: https://trimesh.org/trimesh.html
- CGAL Mesh Processing: https://doc.cgal.org/latest/Polygon_mesh_processing/

## GitHub-Actions-Kostenkontrolle
`verify.yml` läuft automatisch erst bei Push auf `main` oder Pull Request gegen `main`. Auf `develop` erfolgen volle Tests nur explizit per `workflow_dispatch`; die beiden aufwendigen Originalformen-Benchmarks laufen ausschließlich manuell. So gibt es keine redundanten 15–25-Minuten-Prüfungen für jeden kleinen Entwicklungscommit. Vor Integration `npm run verify:full` lokal oder eine manuell gestartete vollständige CI abwarten. **Ein fehlender CI-Lauf ist keine grüne CI.**

GitHub rechnet private Actions je nach Kontoplan und tatsächlicher Nutzung ab; Budget/Verbrauch ist in den Billing-Einstellungen des Repository-Eigentümers zu prüfen. Self-hosted Runner sind laut GitHub für die Actions-Laufzeit kostenlos (eigene Hardware/Stromkosten bleiben).
