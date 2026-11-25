## Zwischenprüfung 2026-11-25 – quellgebundener Skin-Weight-Evidenzadapter

**Änderung auf `develop`:** `src/cluster-skin-anatomy-rig.ts` liest Skin-Indizes und -Gewichte aus ausdrücklich gebundenen `THREE.SkinnedMesh`-Objekten und erzeugt `SkinWeightMeshEvidence` für die bestehende konservative Dreiecks-/Part-Klassifikation. Die Mesh-ID muss aus dem Quellinventar explizit übergeben werden; der Adapter prüft Quellhash, bekannte Mesh-ID, Vertexzahl, Dreieckszahl, Skin-Attributgrößen und Skeleton-Grenzen. Knochen werden ausschließlich per exakter Namensgleichheit gegen `ClusterPart.rigBoneIds` abgebildet. Doppelte Knochennamen oder Mehrfachzuordnungen zu Parts bleiben `null` und damit ungeklärt. Die Funktion verändert weder Mesh-Geometrie noch Skin-Attribute oder Szene.

**CI auf Commit `38f5ced4c8413bc91c067f039e7c73e7dd9fd30c`:**
- [Cluster-Landmark-Workflow #45613002888](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45613002888): **success**.
- 115/115 gezielte Regressionstests bestanden, 0 fehlgeschlagen.
- Neue Adaptertests: exakte eindeutige Knochenzuordnung, bewusste Nichtzuordnung doppelter/mehrdeutiger Knochen, Ablehnung fremder Quellhashes, unbekannter Mesh-IDs und abweichender Topologie.
- Chromium-Browserprüfungen: 2/2 bestanden – Surface-Picking sowie Studio-Landmarkenbestätigung mit GLB-Download.
- TypeScript `npx tsc --noEmit`: erfolgreich.
- Dependency-Audit: 0 Schwachstellen.

**Grenzen / nächster Integrationsschritt:** Der Adapter ist noch nicht an den Rig-Erzeugungsablauf angeschlossen. Dafür muss die vor dem Rigging inventarisierte Mesh-ID beim Ersetzen/Umwandeln der Meshes verlustfrei und eindeutig mit dem späteren `SkinnedMesh` verknüpft werden. Die derzeitige API verlangt diese Bindung explizit; sie versucht keine Zuordnung über Namen, Reihenfolge oder Ähnlichkeit. Erst nach einem geprüften Identitätstransfer kann die Evidenz direkt im Studio erzeugt werden. Auch dann bleiben die automatischen Part-Vorschläge prüfpflichtig und ersetzen keine visuelle Original-PaKaChi-Abnahme.

