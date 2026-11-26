## Zwischenprüfung 2026-11-26 – quellgebundenes Skin-Anatomie-Overlay

**Implementierung auf `develop`:** `src/cluster-skin-anatomy-overlay.ts` erzeugt aus dem aktiven Szenenbaum einen read-only Snapshot klassifizierter Dreiecke. Meshes werden ausschließlich über `pakachiClusterMeshId` und `pakachiClusterSourceAssetSha256` gebunden; Namen und Traversierungsreihenfolge werden nicht als Identität verwendet. Quellhash, vollständige Inventarzuordnung, Vertex-/Dreieckszahlen und Triangle-Indizes werden validiert. Indexierte und nicht indexierte BufferGeometries werden unterstützt.

`StudioView.setClusterSkinOverlay()` rendert vier getrennte Zustände: automatische Zuordnung, mehrdeutig, unaufgelöst und manuell gesperrt. Das Review-Panel bietet je Form eine explizite Anzeige und Ausblendung. Das Overlay ist ein separater Render-Layer und verändert weder Modellgeometrie noch Skin-Weights. Bei fehlenden, doppelten oder veralteten Identitäten wird die Anzeige verweigert.

**CI auf Commit `0d5ac386e5c4e8791d57a841b988f69005912d09`:**
- [Cluster-Landmark-Workflow #45882535878](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45882535878): **success**, 130/130 gezielte Regressionen, 2/2 Chromium-E2E, TypeScript erfolgreich, Dependency-Audit 0 Schwachstellen.
- [Image-Reference-Workflow #45882535827](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45882535827): **success**, 21/21 Chromium-E2E, TypeScript und Dependency-Audit erfolgreich.

**Grenzen / nächster Schritt:** Das Overlay kann formweise explizit ein- und ausgeblendet werden. Ein Klick auf ein farbiges Dreieck übernimmt dessen Mesh-ID und Dreiecksindex noch nicht direkt in die Korrekturmaske. Diese Viewport-Auswahlbindung bleibt offen. Es erfolgte keine visuelle Abnahme an den Original-PaKaChi-Referenzen; `main` bleibt unverändert.

## Zwischenprüfung 2026-11-26 – interaktive Skin-Weight-Prüfung

**Implementierung auf `develop`:** `src/cluster-skin-anatomy-review.ts` erlaubt quellinventar- und manifestgebundene manuelle Dreieckskorrekturen. Jede Korrektur validiert Mesh, Dreiecksindex, anatomischen Part und optionalen Layer; sie erzeugt eine gesperrte Benutzerzuordnung (`origin: user`, `policy: locked`) und mutiert den ursprünglichen Vorschlagsreport nicht. `confirmSkinWeightProposal()` übernimmt nur klassifizierte Vorschläge als gesperrte Benutzerzuordnungen. Unaufgelöste Dreiecke bleiben offen. Im Studio gibt es je Form Mesh-/Dreiecksauswahl, Part-/Layer-Auswahl, Begründungsfeld und getrennten Export; die gemeinsame Übernahme beider Form-Manifeste erfordert eine ausdrückliche Aktion.

**CI:**
- [Cluster-Landmark-Workflow #45776499011](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45776499011): **success**, 126/126 gezielte Regressionen, 2/2 Chromium-E2E, TypeScript erfolgreich, Dependency-Audit 0 Schwachstellen.
- [Image-Reference-Workflow #45776499092](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45776499092): **success**, 21/21 Chromium-E2E, TypeScript und Dependency-Audit erfolgreich.

**Grenzen:** Die Oberfläche ermöglicht aktuell die manuelle Prüfung per Mesh und Dreiecksindex; sie rendert noch keine farbige Dreiecks-/Part-Overlay-Vorschau direkt auf der 3D-Oberfläche. Die Tests belegen die Datenoperationen und bestehende Studio-Browserpfade, nicht die visuelle Abnahme des Original-PaKaChi. Nächster Schritt: visuelle Auswahl-/Overlay-Vorschau der vorgeschlagenen Parts im 3D-Viewport und persistente Formmanifest-Review im realen UI-Ablauf.

## Zwischenprüfung 2026-11-26 – Skin-Weight-Anatomievorschläge im Studio

**Implementierung auf `develop`:** Der tatsächliche Tier-/Arbeitsform-Rigging-Ablauf ist mit der Skin-Weight-Evidenzpipeline verbunden. `prepareDraftRig()` bietet kontrollierte `beforeBind`-/`afterBind`-Hooks. Vor dem Binden erstellt die Pipeline ein quellhashgebundenes Formmanifest, löst das Meshinventar auf und überträgt jede Mesh-ID eindeutig auf das Quellmesh. Nach dem Binden liest sie die stabilen Bone-Metadaten aus, erzeugt das formgebundene Manifest, sammelt die realen `SkinnedMesh`-Skin-Indizes/-Gewichte und klassifiziert Dreiecke konservativ. `prepareDraftRigPair()` führt das getrennt für Tier- und Arbeitsform aus.

Die Ergebnisse werden als getrennte, validierte `clusterSkinAnatomyProposals` im Studio-Projekt gespeichert. Das Studio zeigt pro Form sicher klassifizierte, mehrdeutige und nicht aufgelöste Dreiecke und erlaubt den Export der jeweiligen Vorschlags-Manifeste. Die Vorschläge sind ausdrücklich **nicht bestätigt** und werden nicht automatisch in die aktiven Form-Manifeste übernommen. Der vollständige Ablauf wird mit einem echten GLB-Draft-Rig geprüft; die Testdaten bleiben synthetische Fixture-Geometrie und sind keine visuelle Abnahme des Original-PaKaChi.

**CI auf Commit `360a55299153cc417b17a9b44fab3a7f263e31b7`:**
- [Cluster-Landmark-Workflow #45775567883](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45775567883): **success**.
- 122/122 gezielte Regressionstests bestanden, 0 fehlgeschlagen oder übersprungen.
- Chromium: 2/2 Browser-E2E bestanden.
- TypeScript `npx tsc --noEmit`: erfolgreich.
- Dependency-Audit: 0 Schwachstellen.

**Offen:** Interaktive Prüfung einzelner Part-/Dreiecksvorschläge mit expliziter Bestätigung und Übernahme in das Formmanifest; danach visuelle Qualitäts- und Deformationsabnahme an den Originalreferenzen beider PaKaChi-Formen.

## Zwischenprüfung 2026-11-25 – stabile Draft-Bone-Identitäten

**Änderung auf `develop`:** Der Draft-Rig-Generator schreibt nun jedem erzeugten `THREE.Bone` eine stabile semantische `pakachiRigBoneId` und den zugehörigen Katalog-Part als `pakachiClusterPartId` in `userData`. Die Zuordnung ist für Biped und Quadruped explizit definiert; sie hängt weder vom generierten Anzeigenamen noch von Traversierungsreihenfolge oder CamelCase-Konvertierung ab. `applyDraftRigBoneIdentitiesToManifest()` baut daraus eine form-lokale `ClusterManifest`-Variante mit `ClusterPart.rigBoneIds` und liefert zugleich die exakte Bone-Name→`rigBoneId`-Map für den Skin-Weight-Adapter. Fehlende Katalogteile, doppelte Identitäten, unbekannte Gelenknamen und Formabweichungen führen zum Abbruch.

**CI auf Commit `efceb0f55ce9c68a9544d515654042d0c2ea5969`:**
- [Cluster-Landmark-Workflow #45700211077](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45700211077): **success**.
- 121/121 gezielte Regressionstests bestanden, 0 fehlgeschlagen oder übersprungen.
- Chromium: 2/2 Browser-E2E bestanden.
- TypeScript `npx tsc --noEmit`: erfolgreich.
- Dependency-Audit: 0 Schwachstellen.

**Grenzen / nächster Integrationsschritt:** Die Metadatenbrücke ist getestet, aber noch nicht automatisch in den Studio-Ablauf eingebunden. Der nächste Schritt ist, vor dem Rigging die Quellmesh-IDs anzubinden, nach dem Rigging das form-lokale Manifest mit Bone-IDs aufzubauen, Skin-Weight-Evidenz zu sammeln und die daraus entstehenden Part-Vorschläge im Studio ausschließlich als prüfpflichtige Vorschau anzuzeigen. Noch keine automatische Übernahme in das gespeicherte Manifest.

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

