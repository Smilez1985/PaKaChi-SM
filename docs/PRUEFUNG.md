## Zwischenprüfung 2026-11-28 – kalibrierter Pixel-Silhouettenvergleich

**Implementierung auf `develop`:** `src/cluster-form-silhouette.ts` projiziert die tatsächlichen Mesh-Geometrien über ihre Weltmatrizen und eine explizite Kamera-zu-Welt-Kalibrierung in den Bildraum. Die Funktion verlangt identische `coordinateFrameId`-Werte für Kamera und Modell, validiert die starre Kameramatrix, Intrinsiken, Bildgröße und vollständige eindeutige Quellmesh-Bindungen. Dreiecke vor der Near Plane werden abgeschnitten; die Rasterung nutzt einen Tiefenpuffer, damit verdeckte Flächen nicht mehrfach als sichtbare Silhouette gezählt werden.

**Pixelvergleich:** Eine bestätigte Bildregion kann als Rechteck oder Polygon mit optionalen Innenlöchern vorliegen. Die Funktion erzeugt eine Region-Binärmaske und eine projizierte Modell-Binärmaske. Der Bericht enthält Pixelanzahlen, Schnittmenge, Vereinigungsmenge, False Positives/Negatives sowie IoU, Precision und Recall. Leere/ungültige Geometrien und überschrittene Pixelbudgets werden kontrolliert behandelt. Die Funktion ist read-only: keine Geometrie-, Material-, Manifest- oder Szenenmutation und keine automatische Übernahme.

**Regressionen:** Exakte Projektion einer bekannten Dreiecksfläche (IoU/Precision/Recall = 1), falscher Koordinatenrahmen, fehlende/fremde/doppelte Mesh-Bindungen, Geometrie hinter der Kamera, Polygonlöcher und ungültige Bildregion.

**CI [Cluster-Landmark #46173737289](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46173737289):** Dependency-Audit, Cluster-/Landmark-/Inventar-Regressionen, Chromium-E2E und TypeScript: **success**.

**Grenzen / nächster Schritt:** Der geometrische Vergleichskern ist implementiert und getestet, aber noch nicht als Bedienoberfläche im Studio angeschlossen. Dafür müssen die ausgewählte bestätigte Referenzregion, die zugehörige Kamerakalibrierung und die passenden Quellmesh-Bindings gemeinsam ausgewählt werden. Erst danach kann der Bericht in einer synchronisierten 2D-/3D-Ansicht angezeigt werden. Die Originalformen sind weiterhin nicht visuell freigegeben.

## Zwischenprüfung 2026-11-28 – anklickbares 3D-Overlay für 2D→3D-Review

**Implementierung auf `develop`:** `collectClusterSkinOverlayFromBindings()` erstellt die 3D-Dreiecksvorschau aus den exakten `ClusterMeshBinding`-Objekten, die unmittelbar zuvor für die Mehrmesh-Triangulation aufgelöst wurden. Mesh-Identität, Quellinventar, Vertex-/Dreieckszahlen und Indexgrenzen werden erneut geprüft. Es sind keine zusätzlichen `userData`-Marker am Live-Modell erforderlich. Die Dreieckpositionen werden über die aktuelle Mesh-Weltmatrix in denselben Szenenraum wie das Studio-Overlay überführt.

**Interaktion und Sicherheit:** Ein Klick auf ein Overlay-Dreieck markiert nur den eindeutig passenden Review-Listeneintrag und zeigt Status/Provenienz an. Es erfolgt keine Übernahme. Die separate Schaltfläche übernimmt weiterhin genau ein Dreieck als `origin=user` / `policy=locked`. Nach Übernahme wird das Overlay aus dem neuen Manifest aktualisiert und zeigt den gesperrten Zustand. Undo aktualisiert es auf den tatsächlichen vorherigen Manifestzustand; bei einem zuvor unzugeordneten Dreieck ist das `unmapped`, nicht automatisch `automatic`.

**CI [Cluster-Landmark #46173296280](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46173296280):** Dependency-Audit, Cluster-/Landmark-/Inventar-Regressionen, Chromium-E2E (3D-Klick ohne Übernahme, Übernahme → `locked`, Undo → vorheriger Status) und TypeScript: **success**.

**Grenzen / nächster Schritt:** Die technische 2D→3D-Kandidatenprüfung ist jetzt direkt im Studio-Viewport reviewbar. Die geometrische Qualität hängt weiterhin von korrekten Kamera-Kalibrierungen, gemeinsamen Koordinatenrahmen und Landmarken ab. Die Original-PaKaChi-Tier- und Arbeitsform sind noch nicht visuell gegen die freigegebenen Vorlagen abgenommen; `main` bleibt deshalb unverändert.

## Zwischenprüfung 2026-11-28 – Einzelreview und Undo für triangulierte Dreiecke

**Implementierung auf `develop`:** Die kalibrierte Mehrmesh-Pipeline erzeugt weiterhin nur einen Review-Kandidaten. `ClusterLandmarkSeed` trägt nun die stabile Landmark-ID; der Dreieckklassifikator speichert die nächstgelegenen, gleichwertigen Landmark-IDs als optionale Provenienz im Kandidatenmanifest. `createClusterLandmarkTriangulationPreview()` validiert Quellasset, Form, Meshinventar und Bildhash und erzeugt daraus einzelne Review-Einträge. Die vorhandene Studio-Review-Oberfläche erlaubt die Übernahme eines Dreiecks nach dem anderen. Die Übernahme wird als `origin=user`, `policy=locked` mit exakten Landmark-IDs im Override-Protokoll festgeschrieben. Es werden keine Nachbardreiecke verändert.

**Undo:** Ein kompakter Undo-Stack speichert nur das betroffene Dreieck, den vorherigen Assignment-Datensatz, die Revision, die Override-Länge und den vorherigen Zeitstempel. Dadurch muss pro Klick nicht das vollständige Manifest mit allen Meshes kopiert werden. Undo stellt nur die letzte Einzelübernahme wieder her; weitere bereits bestätigte Zuweisungen bleiben bestehen. Der Browser-Test führt Übernahme → Undo → erneute Übernahme aus.

**CI [Cluster-Landmark #46099826978](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46099826978):** Dependency-Audit, alle Cluster-/Landmark-/Inventar-Regressionen, Chromium-E2E (3D-Picking, Review-Undo und Wiederübernahme) sowie TypeScript: **success**. Der zugehörige Mehrmesh-/Koordinatenrahmen-Pipeline-Lauf [Image-Reference #46099586101](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46099586101) ist ebenfalls vollständig **success**.

**Abgeschlossen:** Die räumliche Darstellung der triangulierten Kandidatendreiecke als farbige, anklickbare 3D-Overlay-Vorschau ist inzwischen implementiert und separat in der folgenden Zwischenprüfung dokumentiert. Die Original-PaKaChi-Formen müssen weiterhin visuell gegen die Referenzvorlagen abgenommen werden; `main` bleibt unverändert.

## Zwischenprüfung 2026-11-28 – Mehrmesh-2D→3D-Kandidatenlauf im Avatar-Studio

**Implementierung auf `develop`:** Der Avatar-Studio-Editor bietet eine explizite Kandidatenerzeugung aus kalibrierten 2D-Landmarken. Der Nutzer wählt Bildreferenz-Avatar, Bildreferenz-Form, Pose, Zielmodell-Form, Koordinatenrahmen-ID und Einflussradius. Die Formzuordnung erfordert die vorhandene ausdrückliche Bestätigung. Das Studio erstellt das Quellmanifest, prüft das vollständige Meshinventar und löst jede Mesh-ID an die tatsächliche Geometrie auf. Für jedes Mesh wird `mesh.matrixWorld` in den Modell-Root-Rahmen überführt (`inverse(root.matrixWorld) × mesh.matrixWorld`) und zusammen mit dem gemeinsamen Koordinatenrahmen an die Mehrmesh-Pipeline übergeben. Das Ergebnis ist ein Review-JSON mit dem Kandidatenmanifest und per-Mesh Triangulations-, Ablehnungs- und Dreiecksstatistik. Das aktive Modell und das Ausgangsmanifest werden nicht verändert; es gibt keine automatische Übernahme. Geskinntes oder morph-verformtes Mesh wird ohne explizite Restpose-Geometrie abgewiesen.

**Zusätzliche Pipeline-Sicherungen:** Die Batch-Pipeline verlangt eine explizite Zielmodell-Form, die mit dem Manifest übereinstimmt, einen passenden Quellasset-Hash, eine nichtleere und eindeutige Mesh-Bindungsliste sowie denselben Koordinatenrahmen für alle Kamerabeobachtungen und das Zielmesh. Ohne triangulierte Landmarken wird kein Kandidat exportiert.

**CI:**
- [Cluster-Landmark #46099146479](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46099146479): Dependency-Audit, Cluster-/Inventar-/Landmark-Regressionen, Chromium-3D-Oberflächenwahl und TypeScript: **success**.
- [Image-Reference #46099160733](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46099160733): Dependency-Audit, Image-Reference-/Triangulations-/Multi-Mesh-Pipeline-Regressionen, Chromium einschließlich Koordinatenrahmen-Eingabe und TypeScript: **success**.

**Grenzen / nächster Schritt:** Der Kandidat enthält automatisch berechnete, weiterhin nur vorgeschlagene Dreieckszuordnungen. Er besitzt noch keine Studio-interne Dreieck-für-Dreieck-Vorschau mit expliziter Übernahme und Undo. Außerdem bleibt die visuelle Qualität der beiden Original-PaKaChi-Formen gegen die freigegebenen Referenzen abzunehmen. `main` bleibt unverändert.

## Zwischenprüfung 2026-11-28 – Gemeinsamer Koordinatenrahmen für Kameras und Zielmesh

**Implementierung auf `develop`:** Neue Kamerakalibrierungen im Bildreferenz-Editor erhalten eine explizite `coordinateFrameId`. Der Hinweis im Editor stellt klar, dass diese ID keine Transformation durchführt: Kamera-Translationen und -Rotationen müssen tatsächlich im selben 3D-Rahmen wie der Zielmodell-Root gemessen werden. Die Low-Level-Triangulation lehnt Mehransicht-Beobachtungen derselben Landmarke ab, wenn Rahmen-IDs gemischt oder nur teilweise vorhanden sind. Die Bildreferenz→Mesh-Pipeline verlangt zusätzlich eine explizite `meshCoordinateFrameId` und blockiert fehlende oder abweichende IDs. Bestehende Projektdateien bleiben lesbar; Kalibrierungen ohne ID sind jedoch nicht für die Modellrekonstruktion verwendbar, bis sie neu gespeichert wurden.

**CI:**
- [Cluster-Landmark #46098767261](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46098767261): Dependency-Audit, Cluster-/Inventar-/Landmark-Regressionen, Chromium-Browserregression und TypeScript: **success**.
- [Image-Reference #46098798502](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46098798502): Dependency-Audit, Image-Reference-/Triangulations-/Pipeline-Regressionen, Chromium einschließlich Speicherung der Koordinatenrahmen-ID und TypeScript: **success**.

**Grenzen / nächster Schritt:** Die Rahmen-ID bestätigt nur, dass Kamera- und Meshdaten denselben benannten Bezug verwenden sollen. Sie verschiebt, dreht oder skaliert keine Kameras und korrigiert keine Kalibrierung. Die tatsächliche 2D→3D-Kandidatenpipeline ist weiterhin ein explizit aufzurufender Review-Schritt; ihre automatisch vorgeschlagenen Dreieckszuordnungen werden nicht übernommen. Als Nächstes wird dieser Kandidatenlauf im Studio mit dem aktuellen Modell, dessen echten Mesh-World-Matrizen und der ausgewählten Form/Pose bedienbar gemacht. Visuelle Abnahme der Original-PaKaChi-Tier- und Arbeitsform bleibt offen; `main` bleibt unverändert.

## Zwischenprüfung 2026-11-28 – Triangulationsqualität als read-only Editorprüfung

**Implementierung auf `develop`:** `createLandmarkTriangulationQualityReport()` verbindet die streng quellhash- und formgebundene Kalibrierungs-/Landmarkenauflösung mit `triangulateLandmarkSeeds()`. Die vorhandene Strahlgeometrie bewertet Mindestparallaxe (Standard 3°), Strahlfehler (Standard 0,05 Welteinheiten), Punkte hinter Kameras und numerische Stabilität. Der Referenz-Editor zeigt pro Landmarke, ob die Triangulation die Qualitätsgrenzen erfüllt oder warum sie abgelehnt wurde. Der Diagnosebericht verwirft die errechneten Positionen: Es werden keine 3D-Punkte exportiert, gespeichert oder auf ein Modell angewendet. Die Diagnose benutzt einen neutralen Einheitsradius nur intern; daraus wird keine reale Modellgröße abgeleitet.

**CI [Image-Reference-Workflow #46083187656](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46083187656):**
- npm ci und Dependency-Audit: **success**.
- Landmark-Projektion und Triangulations-Qualitätsregressionen (erfolgreicher Mehransicht-Fall, Einansicht-Ablehnung, fehlende Kalibrierungen): **success**.
- Chromium-E2E einschließlich Editoranzeige des Einansicht-Ablehnungsgrunds: **success**.
- TypeScript `npx tsc --noEmit`: **success**.

**Grenzen / nächster Schritt:** Die Editorprüfung ist ein Qualitätsgate, keine Modellrekonstruktion. Sie liefert keine dauerhaften 3D-Landmarken, keine Oberflächenprojektion und keine automatische Skalierung. Vor einer tatsächlichen Übernahme müssen die Kamera- und Mesh-Weltkoordinatensysteme explizit verbunden und die resultierenden Punkte gegen die Originalreferenz und die reale Modellgeometrie geprüft werden. Die visuelle Original-PaKaChi-Abnahme bleibt offen; `main` bleibt unverändert.

## Zwischenprüfung 2026-11-28 – Landmark-Kalibrierungsabdeckung im Referenz-Editor

**Implementierung auf `develop`:** `createLandmarkCalibrationCoverageReport()` liefert einen read-only Bericht je korrespondierender bestätigter Landmarke. Die Zuordnung wird auf die explizite Avatar-/Form-/Pose-Identität und den Quellbildhash begrenzt. Der Referenz-Editor bietet die Aktion „Landmark-Kalibrierungsabdeckung prüfen“ und zeigt kalibrierte sowie fehlende Ansichten pro anatomischem Part. Die Prüfung verändert keine Daten und schätzt keine Kalibrierung. Zwei Ansichten werden nur als Mindestabdeckung für einen späteren Triangulationsversuch markiert; Parallaxe und Gültigkeit einer 3D-Lösung sind nicht geprüft. Ein Chromium-E2E-Test prüft eine Frontansicht mit vorhandener Kalibrierung und fehlender Seitenansicht.

**CI [Image-Reference-Workflow #46082880514](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46082880514):**
- npm ci und Dependency-Audit: **success**.
- Image-Reference-Hierarchie, Landmark-Projektion, Crop-Planung, Generation-Gates, Transport/Provenienz und persistierte Formpaar-Metadaten: **success**.
- Chromium-Browserregressionen einschließlich der neuen Abdeckungsprüfung: **success**.
- TypeScript `npx tsc --noEmit`: **success**.

**Grenzen / nächster Schritt:** Der Bericht misst nur Kalibrierungsabdeckung. Er prüft weder die geometrische Parallaxe noch die Konditionierung einer Triangulation und erzeugt keine 3D-Koordinaten. Als nächster fachlicher Schritt kann eine explizite Parallaxen-/Triangulationsgüteprüfung vorbereitet werden. Die visuelle Abnahme der Original-PaKaChi-Tier- und Arbeitsform gegen die freigegebenen Referenzen bleibt weiterhin offen; `main` bleibt unverändert.

## Zwischenprüfung 2026-11-27 – vollständiger Browser-Korrekturpfad für Skin-Anatomie

**Implementierung auf `develop`, Commit `dc11e34a837ebc3386fbd5c1a483441a638b5c98`:** Der echte Chromium-Ablauf klickt das gerenderte Skin-Overlay im Canvas an. Die Auswahl wird der korrekten Form zugeordnet und füllt Mesh-, Dreiecks- und Part-Feld sowie den Status der Review-Maske. Die ausdrückliche Korrekturaktion speichert den Override als `origin: user` und `policy: locked`; der Projekt-Export und der erneute Editor-Aufbau stellen den Override wieder her. Die Gegenform behält ihre automatische Zuordnung. Ursache des zuvor roten E2E-Tests war die konkurrierende Pointer-Interaktion des Transform-Gizmos. Der neue `cluster-pick`-Modus deaktiviert diese Interaktion während der Overlay-Auswahl und stellt beim Ausblenden den vorherigen Studio-Modus wieder her.

**CI:**
- [Cluster-Landmark-Workflow #46077928608](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46077928608): **success** – npm ci, Dependency-Audit, Cluster-/Anatomie-/Landmark-Regressionen, 4/4 Chromium-E2E und TypeScript.
- [Studio-Topology-Workflow #46077928613](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46077928613): **success** – gezielte Studio-Topology-Regression und Dependency-Audit.

**Grenzen / nächster Schritt:** Der technische Browser-Korrekturpfad ist abgeschlossen. Offen bleibt die visuelle Abnahme der Original-PaKaChi-Tier- und Arbeitsform gegen die freigegebenen 2D-Referenzen. Technische E2E-Tests ersetzen diese Abnahme nicht. `main` bleibt unverändert.

## Zwischenprüfung 2026-11-27 – Editor-Korrekturpfad und Persistenzregressionen

**Implementierung auf `develop`, Commit `788961776ff5951c19e37c7b500bee43539a99a4`:** Zwei gezielte Regressionen prüfen den Übergang vom 3D-Pick in den Editor. Ein eindeutiger Treffer mit Quellhash und Mesh-ID füllt die Formularfelder der richtigen Form vor; stale Hashes und mehrdeutige Bindungen beider Formen werden abgewiesen. Die manuelle Korrektur wird erst nach expliziter Aktion als `origin: user` und `policy: locked` gespeichert. Der Export enthält den Override nur für die betroffene Form; ein neu aufgebauter Editor stellt ihn nach dem Projekt-Roundtrip weiterhin als gesperrte Korrektur her.

**CI [Cluster-Landmark-Workflow #46036286231](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46036286231):**
- npm ci: **success**.
- Dependency-Audit: **success**.
- Cluster-/Anatomie-/Landmark- und Editor-Regressionen: **success**.
- Chromium-Browserregression für reales 3D-Overlay-Face-Picking: **success**.
- TypeScript `npx tsc --noEmit`: **success**.

**Grenzen / nächster Schritt:** Der Editor-Callback, Formularzustand, explizite Korrektur und Projekt-Roundtrip sind durch Editor-Regressionen abgesichert, aber noch nicht als durchgehender Playwright-Ablauf in einem echten Browser. Der nächste technische Schritt ist dieser Browserpfad. Danach bleibt die visuelle Abnahme von Tier- und Arbeitsform gegen die freigegebenen Original-2D-Referenzen zwingend; technische Tests ersetzen diese Abnahme nicht. `main` bleibt unverändert.

## Zwischenprüfung 2026-11-27 – echtes Skin-Overlay-Face-Picking

**Implementierung auf develop, Commit aa4b5d12f98483bba3d48785ad49a9062b6d1f30:** Ein dedizierter Playwright-Test klickt das tatsächlich gerenderte Overlay-Face im Canvas an und prüft den vollständigen Callback-Treffer. Die Fixture-Quelle verwendet absichtlich triangleIndex: 42, obwohl das Overlay nur ein Face enthält. Damit wird nachgewiesen, dass faceIndex über die beim Aufbau gespeicherte Referenztabelle auf den ursprünglichen Quell-Dreiecksindex zurückgeführt wird und nicht versehentlich als Quellindex behandelt wird. Erwartet und erhalten werden Mesh-ID, Quellindex, SHA-256, Status locked und Part-ID.

**CI [Cluster-Landmark-Workflow #46035605039](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/46035605039):**
- npm ci: **success**.
- Dependency-Audit: **success**.
- Cluster-/Anatomie-/Landmark-Regressionen: **success**.
- Chromium-Browserregression für Surface- und Overlay-Picking: **success**.
- TypeScript npx tsc --noEmit: **success**.

**Grenzen / nächster Schritt:** Der Test beweist die reale 3D-Raycaster-Zuordnung bis zum Viewport-Callback. Er testet noch nicht den Editor-Callback, die Formularfelder, das Speichern einer manuellen Korrektur oder den erneuten Import des gespeicherten Projekts. Als Nächstes wird dieser UI-Pfad gegen falsche/alte Form- und Quellhashbindungen abgesichert. Die visuelle Abnahme an den Original-PaKaChi-Referenzen bleibt offen; main bleibt unverändert.

## Zwischenprüfung 2026-11-27 – 3D-Viewport-Dreiecksauswahl

**Implementierung auf `develop`:** Das Overlay speichert beim Aufbau für jedes gerenderte Face eine explizite Referenz auf Quell-Mesh-ID, Quell-Dreiecksindex, Quellhash, Klassifizierungsstatus und Part-ID. Der Raycaster löst `faceIndex` über genau diese Referenzliste auf; es gibt keine Ableitung aus Mesh-Namen, Traversierungsreihenfolge oder Overlay-Index. Der Editor akzeptiert den Treffer nur, wenn genau eines der beiden Form-Manifeste denselben Quellhash und die Mesh-ID enthält. Danach werden die passenden Felder der Tier- oder Arbeitsform-Korrekturmaske befüllt. Die Auswahl ist nur vorgemerkt und schreibt keine Korrektur; Speichern und gemeinsame Manifestübernahme bleiben explizite Aktionen.

**CI auf Commit `c8729bba9bfe600ea6bb4ed3fab793d0ad38076d`:**
- [Cluster-Landmark-Workflow #45898033306](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45898033306): **success**, Cluster-Regressionen, 2/2 Chromium-E2E (Landmarkenexport und reales 3D-Surface-Picking), TypeScript und Dependency-Audit erfolgreich.
- [Image-Reference-Workflow #45898033253](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45898033253): **success**, 21/21 Chromium-E2E, TypeScript und Dependency-Audit erfolgreich.
- [Studio-Topology-Workflow #45898029118](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45898029118): **success**, 17/17 gezielte Regressionen, Dependency-Audit erfolgreich.

**Grenzen / nächster Schritt:** Die CI prüft die bestehende echte Canvas-Surface-Pick-Interaktion und die Cluster-Regressionen, enthält aber noch keinen dedizierten Browser-Test, der das farbige Skin-Overlay anklickt und die Formularfelder bis zur Korrekturspeicherung durchläuft. Visuelle Abnahme an den Original-PaKaChi-Referenzen ist weiterhin offen; `main` bleibt unverändert.

## Zwischenprüfung 2026-11-26 – quellgebundenes Skin-Anatomie-Overlay

**Implementierung auf `develop`:** `src/cluster-skin-anatomy-overlay.ts` erzeugt aus dem aktiven Szenenbaum einen read-only Snapshot klassifizierter Dreiecke. Meshes werden ausschließlich über `pakachiClusterMeshId` und `pakachiClusterSourceAssetSha256` gebunden; Namen und Traversierungsreihenfolge werden nicht als Identität verwendet. Quellhash, vollständige Inventarzuordnung, Vertex-/Dreieckszahlen und Triangle-Indizes werden validiert. Indexierte und nicht indexierte BufferGeometries werden unterstützt.

`StudioView.setClusterSkinOverlay()` rendert vier getrennte Zustände: automatische Zuordnung, mehrdeutig, unaufgelöst und manuell gesperrt. Das Review-Panel bietet je Form eine explizite Anzeige und Ausblendung. Das Overlay ist ein separater Render-Layer und verändert weder Modellgeometrie noch Skin-Weights. Bei fehlenden, doppelten oder veralteten Identitäten wird die Anzeige verweigert.

**CI auf Commit `0d5ac386e5c4e8791d57a841b988f69005912d09`:**
- [Cluster-Landmark-Workflow #45882535878](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45882535878): **success**, 130/130 gezielte Regressionen, 2/2 Chromium-E2E, TypeScript erfolgreich, Dependency-Audit 0 Schwachstellen.
- [Image-Reference-Workflow #45882535827](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/45882535827): **success**, 21/21 Chromium-E2E, TypeScript und Dependency-Audit erfolgreich.

**Grenzen / nächster Schritt:** Die Viewport-Auswahlbindung ist inzwischen implementiert; siehe Zwischenprüfung vom 2026-11-27. Ein dedizierter E2E-Test für Overlay-Klick bis Korrekturspeicherung und die visuelle Abnahme an den Original-PaKaChi-Referenzen bleiben offen. `main` bleibt unverändert.

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

