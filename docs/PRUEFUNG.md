## Zwischenprüfung 2026-11-25 – Mesh-Identität durch Draft-Rigging

**Änderung auf `develop`:** `src/cluster-skin-anatomy-identity.ts` überträgt die quellinventarbasierten Mesh-IDs vor dem Rigging per vollständiger 1:1-Bindung in `userData`. Der produktive `bindDraftRig()`-Pfad kopiert `userData` beim Austausch `THREE.Mesh`→`THREE.SkinnedMesh`; der anschließende Sammler liest ausschließlich diese Marker und verlangt genau den vollständigen Mesh-Satz des Manifests sowie den identischen Quellhash. Fehlende, doppelte, fremde und veraltete Identitäten führen zum Abbruch statt zu einer heuristischen Zuordnung.

**CI auf Commit `06654efee87c84ee880b86cbc01e04ad1e8c21e7`:**
- [Cluster-Landmark-Workflow #45695766223](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45695766223): **success**.
- 118/118 gezielte Regressionstests bestanden, 0 fehlgeschlagen oder übersprungen.
- Chromium: 2/2 Browser-E2E bestanden.
- TypeScript `npx tsc --noEmit`: erfolgreich.
- Dependency-Audit: 0 Schwachstellen.

**Grenzen / nächster Integrationsschritt:** Der Identitätstransfer ist implementiert und getestet, der Studio-Ablauf ruft den Evidenzsammler aber noch nicht automatisch auf. Außerdem braucht die Knochenauflösung eine explizite Bone-Name→stabile `rigBoneId`-Zuordnung aus den Rig-Metadaten. Die Generatornamen `Draft_LeftElbow` etc. dürfen nicht direkt als semantische IDs behandelt werden; `ClusterPart.rigBoneIds` sind stabile IDs. Erst nach dieser Metadatenbrücke können Skin-Weight-Vorschläge im Studio reviewpflichtig angezeigt werden. Die Klassifikation bleibt ein Vorschlag und ersetzt keine visuelle Abnahme beider Originalformen.

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

