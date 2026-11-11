# Mesh-Audit und sichere Reparatur – PaKaChi

## Diagnose vor Korrektur
Der lesende `auditMeshTopology` prüft unabhängig vom Schnittbudget: ungültige Indizes und NaN/Inf, Nullflächen, doppelte Dreiecke (nach Index), offene und nicht-manifold Kanten, fehlerhafte gemeinsame Kantenorientierung sowie exakt zusammenfallende Eckpunktkoordinaten. Seine Ergebnisse bedeuten **nicht**, dass die Oberfläche geschlossen, kollisionsfrei oder anatomisch korrekt ist. Im Originalformen-Benchmark wird die Topologie einmal pro Ausgangsmodell erfasst, die Schnittprüfung dagegen pro Pose.

## Geometrisch deckungsgleiche Flächen mit getrennten Indizes

Der Audit unterscheidet nun echte **Doppelverwendung derselben Vertex-Indizes** (`duplicateFaces`) von **deckungsgleichen Flächen mit verschiedenen Indizes** (`coincidentFaces`). Letztere entstehen beispielsweise durch getrennte UV-/Material- oder Skinning-Nähte. Die Abbildung nutzt exakte endliche Koordinaten und meldet nur identische Dreiecke unabhängig von der Eckpunktereihenfolge. Nahe, aber nicht exakt identische Flächen sind weiterhin ein gesondertes geometrisches Problem. Beide Kategorien bleiben bei Reparaturvorschlägen unberührt; die Ergebnisse sind **keine** Löschfreigabe.

## Reproduzierbarer GitHub-Nachweis

Der Workflow `PaKaChi real-form intersection evidence` läuft auf `develop` nur bei Änderungen an Audit/Benchmark/Test beziehungsweise manuell. Er speichert ein JSON-Artefakt mit den tatsächlichen Originalform-Messungen, validiert nun aber zusätzlich für **jedes** Teilmodell die Zuordnung von Topologie und Reparaturvorschau sowie die vollständige Aufteilung der Kandidaten in `removable` und `withheld`. Ein grüner Workflow bescheinigt nur einen vollständigen lesenden Bericht, nicht, dass ein Mesh sicher automatisch reparierbar ist.

## Prüfen der Originalformen ohne Umbau

`node scripts/benchmark-pakachi-intersections.mjs` ergänzt für jedes Teilmodell den Abschnitt `repairPreview`. Die Vorschau nutzt die acht tatsächlich gemessenen statischen Hüft-/Kniehaltungen (0°, 22,5°, 45°, 90° je Gelenk). `removable` bezeichnet Nullflächen, die auch in diesen Stichproben keine Fläche haben; `withheld` enthält im Ausgangsnetz auffällige Dreiecke, die in mindestens einer Stichprobe gültig werden. `blocked` bezeichnet ungültige Ausgangsdaten oder ungültige Samples. Es wird **keine** Indexliste im Ergebnis ausgegeben, keine GLB-Datei verändert und nur ein Teilmodell gleichzeitig im Speicher gehalten.

Der Bericht ist eine **Kandidatenliste**, keine automatische Löschfreigabe. Die acht Stichproben decken weder sämtliche gespeicherten Moves noch die kontinuierlichen Zwischenzustände ab.

## Posenbewusste Nullflächen-Vorschau

`proposeStableDegenerateFaceRemoval(restPositions,posePositions,index)` ist eine zusätzliche, rein lesende Vorsichtsprüfung. Sie schlägt nur Dreiecke zur Entfernung vor, die **im Ausgangsnetz und in jeder übergebenen Pose/Morph-Stichprobe** entartet bleiben. Wenn ein Dreieck bei einer Deformation wieder Fläche erhält, wird seine Face-ID in `withheldFaces` ausgewiesen und nicht entfernt. Geometrie mit falscher Frame-Länge oder ungültigen Koordinaten führt zu einem gesperrten Vorschlag. Es werden weder Originalindexfolge noch UVs, Gewichte oder Morph-Ziele geändert.

**Grenze:** Endliche Stichproben ersetzen keine kontinuierliche Prüfung. Vor einer tatsächlichen automatischen Anwendung müssten die gespeicherten Posen, Move-Bilder, Skinning-/Morph-Attribute und Materialgruppen vollständig berücksichtigt und danach die Bewegungen neu vermessen werden.

## Erste sichere Vorschau: Nullflächen

`proposeDegenerateFaceRemoval(positions,index)` erstellt jetzt einen **nicht angewendeten** Index-Vorschlag und listet die originalen Dreiecksnummern der Nullflächen auf. Positionsdaten, Originalindizes, UVs, Skinning, Morph-Ziele, Knochen und Projektdateien bleiben unberührt. Bei kaputten Indizes oder nicht endlichen Koordinaten gibt die Funktion **keinen** Reparaturvorschlag zurück. Doppelte, aber gültige Flächen bleiben erhalten, weil sie absichtliche Renderlagen sein können.

Der Vorschlag ist nur zur Sichtung. Bei nicht indizierten Netzen bildet er die originalen Corner-IDs ab; zum echten Anwenden müssen alle übrigen Vertexattribute und die Materialgruppen explizit abgeglichen werden. Eine automatische Anwendung wäre derzeit nicht sicher und ist nicht aktiviert.

## Manuelle Vorlage und automatisierbarer Ablauf
1. **Blender 3D Print Toolbox:** Check All, Non-Manifold, Degenerate und Intersections prüfen; problematische Flächen selektieren. Vorher Kopie speichern.
2. **Ursache trennen:** Unverbundene UV-Nähte/Felllagen sind nicht automatisch Fehler. Fehlende Dreiecke und offene Flächen können beabsichtigt sein.
3. **Konservative Reparatur:** Gezielte Entfernung eindeutiger Null- und Doppel-Dreiecke auf einer **Kopie**. Niemals allein aufgrund gleicher Positionen Eckpunkte verschweißen; unterschiedliche UVs, Normals, Bone-Gewichte und Morph-Ziele müssten erhalten bleiben.
4. **Wirklich beschädigte Oberflächen:** Saubere lokale Retopologie, Kanten neu verbinden, Normals ausrichten; bei echten Selbstschnitten robustere CGAL-Prädikate und ggf. Triangle-Soup-Autorefinement verwenden.
5. **Vorher/Nachher:** Ausgangs-GLB-Hash, Vertex-/Flächenzahl, Grenzen, Gewichte und Morphziele prüfen; 16 Gelenkposen und alle relevanten Moves vergleichen. Nur nach Regressionstest akzeptieren.

## Nächster Trennungsschritt: Daten erhalten

Rechercheabgleich: 11.11.2026. Dieser Abschnitt beschreibt die nächste Umsetzung; ein allgemeiner Trennungsgenerator ist noch nicht implementiert.

Die [CGAL-API für Autorefinement](https://doc.cgal.org/latest/PMP_Boolean_operations/group__PMP__corefinement__grp.html) unterteilt Schnittflächen, entfernt degenerierte Dreiecke und verwendet zusammenfallende Punkte gemeinsam. Iteratives Snap Rounding kann weitere Änderungen erzeugen; bei erfolgloser begrenzter Suche ist das Ergebnis ausdrücklich nur teilweise gültig. Daraus folgt für PaKaChi: kein direkter Ersatz des geriggten Netzes. Zuerst sind Herkunftsabbildung und Übertragung aller Vertex-/Corner-Attribute einschließlich UVs, Hautgewichten und sämtlicher Morph-Ziele nötig. Eine aufgeteilte Schnittlinie stellt außerdem noch keinen gewünschten Abstand zweier Körperflächen her.

Für die zuerst geplante positionsbasierte Variante bleiben Vertex-/Indexreihenfolge, Gewichte und vorhandene Morph-Ziele erhalten. Die [PositionBasedDynamics-Referenz](https://github.com/InteractiveComputerGraphics/PositionBasedDynamics/blob/master/PositionBasedDynamics/PositionBasedDynamics.h) liefert getrennte Punkt–Dreieck- und Kante–Kante-Abstandsbedingungen. Die folgende Kombination ist unser Umsetzungsvorschlag; sie ist noch kein geprüfter PaKaChi-Solver:

1. Nachgewiesene Schnittpaare mitsamt betroffenen Nachbarflächen erfassen. Ungültige Geometrie und unvollständige Paarberichte zuerst beheben oder den Auftrag ablehnen.
2. Einen kleinen veränderbaren Bereich und feste Randpunkte bestimmen. Zusammenfallende UV-Vertizes nur dann räumlich koppeln, wenn ihre Ausgangslage und tatsächliche verformte Lage kompatibel sind; Indizes und Attribute bleiben getrennt.
3. Trennrichtung aus geometrischer Lage und benachbarten Flächen bestimmen, mehrere begrenzte Richtungsvarianten gegentesten. Eine mehrdeutige Lage darf keine frei erfundene Innen-/Außenseite erhalten.
4. Abstandsbedingungen mit Kantenlängen-/Form- und Volumengegenprüfung kombinieren. Punkt–Dreieck-Abstand allein deckt nicht jeden Kante–Kante-Schnitt ab; reine Kantenentspannung beseitigt keine Durchdringung zuverlässig.
5. Positionsvorschlag in eine gewöhnliche sparse Korrekturform zurückführen. Nicht invertierbare oder schlecht konditionierte Hauttransformationen ablehnen; keine Änderung des Original-Rigs.
6. Alle gespeicherten Posen, Move-Stichproben und zusätzlichen Risikobilder mit den bestehenden Paaridentitäts-, Dehnungs- und Volumensperren prüfen. Erst vollständige Gegenprüfungen erlauben die Vorschau. Weniger Gesamtschnitte dürfen kein neues Paar ausgleichen.

Der [Blender-Diagnoseablauf](https://projects.blender.org/extensions/print3d_toolbox/wiki/Analyze) dient als manuelle Vorlage: Problemflächen gezielt auswählen und betrachten. Drucktauglichkeit und geschlossene Kanten sind keine Belege für animierbare Charakterqualität.

### Abnahme des geplanten Solvers

- Synthetische Punkt–Fläche- und Kante–Kante-Durchdringungen einschließlich unbeweglicher Ränder, Nahtkopien, Mehrdeutigkeiten und Budget-/Abbruchfällen.
- Echte Originalform: tatsächliche automatische Suche statt einer manuell vorbereiteten Trennreferenz. Gespeicherter Vorschlag mit Quell-Hashes und mindestens 65 unabhängigen vollständigen Körper-Paar-/Dehnungs-/Volumenproben je Form.
- Bestehende Schnitte und nicht erfasste Kontakte ausdrücklich ausweisen. Für kontinuierliche Bewegungsfreiheit ist eine gesonderte kontinuierliche Kollisionsprüfung erforderlich; Stichproben ersetzen sie nicht.

## Referenzen
- Blender: https://projects.blender.org/extensions/print3d_toolbox/wiki/Analyze
- PyMesh Cleanup: https://github.com/PyMesh/PyMesh/blob/main/docs/api_local_mesh_cleanup.rst
- Trimesh Validation: https://trimesh.org/trimesh.html
- CGAL Mesh Processing: https://doc.cgal.org/latest/Polygon_mesh_processing/

## GitHub-Actions-Kostenkontrolle
`verify.yml` läuft automatisch erst bei Push auf `main` oder Pull Request gegen `main`. Auf `develop` erfolgen volle Tests nur explizit per `workflow_dispatch`; die beiden aufwendigen Originalformen-Benchmarks laufen ausschließlich manuell. So gibt es keine redundanten 15–25-Minuten-Prüfungen für jeden kleinen Entwicklungscommit. Vor Integration `npm run verify:full` lokal oder eine manuell gestartete vollständige CI abwarten. **Ein fehlender CI-Lauf ist keine grüne CI.**

GitHub rechnet private Actions je nach Kontoplan und tatsächlicher Nutzung ab; Budget/Verbrauch ist in den Billing-Einstellungen des Repository-Eigentümers zu prüfen. Self-hosted Runner sind laut GitHub für die Actions-Laufzeit kostenlos (eigene Hardware/Stromkosten bleiben).
