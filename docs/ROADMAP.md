# Roadmap – offene Aufgaben

**Entwicklungsstand: 0.101.0 · Abgleich: 22.11.2026.** Teil der [Blaupause](README.md).

Diese Roadmap enthält offene Umsetzung und ausstehende Abnahme. Erledigte Änderungen stehen nach Version im [Changelog](CHANGELOG.md); Nachweise und Grenzen im [Prüfstand](PRUEFUNG.md).

## Verbindliche Original-PaKaChi-Zieldefinition

- **Finales Produktziel:** Ein neuer Original-PaKaChi-Avatar, der der vom Nutzer am 2026-11-13 bestätigten Bildreferenz entspricht und beide Formen enthält: die vierbeinige Tierform und die aufrechte humanoide Arbeitsform. Beide müssen dieselbe erkennbare Charakteridentität bewahren (dunkles Fell, cremefarbene Gesichtszeichnung, grüne Augen und Leuchtakzente, großer schwarz-grüner Schweif, grüner Brustkern, mechanische Gelenke).
- **Keine Verwechslung mit älteren Vorlagen:** Die zuletzt bestätigte gemeinsame Referenzdarstellung ist maßgeblich. Frühere/andere 2D-Ansichtstafeln dürfen nicht ungeprüft als Ersatz für dieses Design oder als abweichende finale Charaktervorgabe behandelt werden.
- **Vorhandene GLBs:** Die bestehenden Tier-/Humanoid-GLBs bleiben unverändert als zusätzliche technische Testmodelle im Repository. Sie dürfen weiterhin für Loader-, Mesh-Inventar-, Cluster-, Geometrie- und Rigging-Tests verwendet werden, sind aber nicht das finale Original-PaKaChi und setzen dessen Design nicht fest.
- **Separates Qualitätsziel:** Original-PaKaChi wird als eigener Modellkandidat mit eigenem Herkunfts-/Versionsnachweis und visueller Abnahme geführt. Technische Tests der Testmodelle ersetzen keine visuelle Prüfung des Original-Avatars.
- **Reihenfolge:** Referenzmerkmale erfassen → beide Originalformen separat modellieren/rekonstruieren → Design-Silhouette und Materialien visuell abnehmen → beide Formen riggen und Bewegungen prüfen → erst danach Morph-Topologie und reversible Transformation umsetzen.


## Generische Bildsegmentierung und Avatar-Zuordnung

- [x] **Referenzdatenmodell und Freigabeprüfung:** Ein versioniertes, quellhashgebundenes Modell für beliebig viele Avatare, Formen, Ansichten und Pixelregionen ist implementiert. Es validiert stabile IDs, Pixelgrenzen, Polygon-/Rechteckgeometrie, eindeutige Elternzuordnungen und geordnete Verknüpfungen. Die Rekonstruktion wird blockiert, bis jede erkannte Region bestätigt und zugeordnet oder ausdrücklich ignoriert wurde.

- [x] **Variable Anzahl im Referenzmodell und Editor:** Datenmodell und manuelle Oberfläche unterstützen beliebig viele markierte Regionen sowie mehrere Avatar-/Form-/Ansichtsgruppen ohne feste Links-/Rechts-Annahme.
- [x] **Visuelle Ähnlichkeit als Prüfhilfe:** Transparente Komponenten erhalten einen einfachen 64-Bit-Helligkeits-Differenzhash. Ähnliche Ausschnitte werden ausschließlich als manuelle Prüfhilfe angezeigt; daraus entstehen keine Identitätsannahmen, Zuordnungen, Beziehungen oder Bestätigungen. Verglichen werden höchstens 64 aktuelle erkannte Ausschnitte; maximal 12 Treffer erscheinen in der Prüfliste. Browser- und Unit-Regression decken Anzeige, Verwerfen veralteter Hashes nach Geometrieänderung sowie die 64/12-Grenzen und deterministische Rangfolge ab.
- [x] **Erklärbare Segmentierungsqualität:** Jede automatisch erkannte Komponente erhält einen geometrischen Qualitätswert mit nachvollziehbaren Evidenzmerkmalen (Flächenfüllung, relative Größe, Randabstand und Boxgröße). Wert und maschinenlesbare Evidenzmerkmale werden am unbestätigten Hilfsbereich gespeichert und im Editor angezeigt; sie behaupten ausdrücklich nicht, ob es ein Avatar, eine Form oder Ansicht ist.
- [x] **Erste automatische Alpha-Segmentierung:** Bei Bildern mit transparentem Hintergrund werden getrennte, ausreichend große Vordergrundkomponenten als unbestätigte Regionen vorgeschlagen. Kleinstrauschen und randverbundene Flächen werden verworfen; Identität und Beziehungen werden nicht automatisch geraten.
- [x] **Erste Segmentierung einfarbiger Hintergründe:** Ein ausreichend einheitlicher, deckender Bildrand wird als Hintergrundprobe verwendet; davon getrennte Vordergrundkomponenten werden als unbestätigte Vorschläge markiert. Uneinheitliche Ränder, randberührende Figuren und Kleinstrauschen werden konservativ abgewiesen. Keine semantische Figuren-/Formerkennung.
- [x] **Wiederholte Erkennung ohne Duplikate:** Neue Alpha- und Einfarbhintergrund-Vorschläge werden gegen alle bereits vorhandenen Regionen mit einer konservativen Bounding-Box-IoU-Prüfung abgeglichen. Stark überlappende Treffer werden übersprungen; manuell markierte, bestätigte und ignorierte Bereiche bleiben unverändert. Unit-Tests decken Duplikatfilter und Grenzwerte ab.
- [ ] **Automatische semantische Erkennung mit Konfidenz:** Figuren-/Formregionen, Ansichten und mögliche Beziehungen anhand visueller Merkmale vorschlagen; unsichere oder überlappende Fälle ausdrücklich zur Klärung vorlegen. Die jetzt gespeicherte Konfidenz bewertet ausdrücklich nur die geometrische Qualität der Segmentierung, nicht die semantische Identität.
- [x] **Erster interaktiver Markierungseditor:** Im integrierten Studio können beliebig viele rechteckige Bereiche direkt im Bild gezeichnet, beschriftet, einzeln gelöscht und einem Avatar, einer Form sowie einer Ansicht zugeordnet werden. Jede Region muss ausdrücklich bestätigt oder ignoriert werden; ein bestätigter Ausschnitt kann gezielt für die 3D-Erzeugung ausgewählt werden. Der Generator erhält nur den ausgewählten Quellbild-Crop.
- [x] **Editor-Ausbau – Rechteckkorrektur und Reihenfolge:** Rechteckkoordinaten können in Quellpixeln nachträglich verschoben und skaliert werden; Werte werden auf das Quellbild begrenzt. Regionen lassen sich per UI auf-/abwärts sortieren, ohne stabile IDs oder Gruppenzuordnungen zu verändern.
- [x] **Direkte Mauskorrektur:** Vorhandene Rechtecke lassen sich im Bild verschieben und über acht Kanten-/Eckgriffe skalieren; Neuzeichnen ist weiterhin durch Ziehen auf freier Fläche möglich. Die Bearbeitung erfolgt in Quellpixeln und bleibt innerhalb des Originalbildes. Auch direkte Zahlenkorrekturen setzen die Bestätigung zurück. Jede Geometrieänderung setzt die Region wieder auf prüfpflichtig; eine erneute Bestätigung ist erforderlich.
- [x] **Editor-Ausbau – getrennte Teilbereiche:** Mehrere eigenständige Rechteck-/Polygonmasken können derselben Ansicht zugeordnet werden; beim Neuzeichnen wird die Gruppierung der aktiven Markierung übernommen.
- [x] **Editor-Ausbau – Konturen teilen und vereinfachen:** Rechtecke können per Schnittlinie in zwei Polygonbereiche umgewandelt werden; einfache Polygonkonturen lassen sich nur bei genau zwei eindeutigen Grenzübertritten teilen; konkave Mehrfachübertritte werden abgewiesen. Die Vereinfachung entfernt nur redundante Punkte, prüft nach jedem Schritt Selbstüberschneidung und begrenzt die Flächenabweichung auf 1 %. Beide Funktionen sind im Editor integriert und setzen die betroffene Region wieder auf prüfpflichtig. Beide Teilflächen bleiben getrennte, unbestätigte Vorschläge; Innenaussparungen können weiterhin nicht geteilt werden.
- [x] **Innenaussparungen / Lochmasken:** Polygonregionen unterstützen mehrere disjunkte Innenringe. Der Editor kann sie zeichnen, entfernen und Eckpunkte verschieben; ungültige Bewegungen werden atomar verworfen. Die Crop-Ausgabe nutzt die Even-Odd-Füllregel. Der gezielte Chromium-Test prüft die tatsächliche PNG-Alpha-Transparenz und das Verschieben eines Loch-Eckpunkts. Konturteilung bei vorhandenen Löchern bleibt bewusst gesperrt, bis ein topologisch sicherer Algorithmus verfügbar ist.
- [x] **Gemeinsamer PaKaChi-Semantikkatalog:** Ein validierter Startkatalog definiert stabile Anatomie-IDs und davon getrennte Oberflächenlagen für beide Formen. Tier- und Arbeitsform teilen die Semantik, ohne vorauszusetzen, dass jedes Teil in beiden Formen existiert.
- [x] **Semantikkatalog bearbeiten und projektweit teilen:** Anatomische Teile und Oberflächen-Layer können im integrierten Studio mit stabilen IDs hinzugefügt, umbenannt, neu zugeordnet und sicher gelöscht werden. Eltern-/Kindbeziehungen, Landmarken- und Layer-Referenzen werden validiert; Katalogänderungen unterstützen Undo/Redo. Der Katalog wird in Studio-Projekten gespeichert und vom Bildreferenz-Editor gemeinsam genutzt.
- [x] **Zusammengesetzte Regionen konservativ behandeln:** Enthält ein bestätigter Crop mehrere anatomische oder Oberflächen-Ziele, bleibt die Klassifikation ungelöst; räumliche Nähe darf die Mehrdeutigkeit nicht verdecken. Regressionen decken unterschiedliche Part- und Layer-Ziele ab.
- [x] **2D-Vorschläge im Editor prüfen:** Die Zuordnungen erscheinen auf Anforderung in einer separaten Liste mit Grund und Konfidenz. Nur bestätigte Regionen liefern Landmarken-Evidenz; die Vorschau übernimmt oder bestätigt nichts automatisch.
- [x] **Semantik aus Katalog auswählen:** Anatomie- und Oberflächen-IDs sind auswählbar statt frei eintippen zu müssen; unbekannte Bestandswerte bleiben kompatibel.
- [x] **Beschriften und gruppieren – Regionsart:** Jede Region kann benannt und als Avatar, Form, Ansicht, Detailreferenz oder Hilfsregion klassifiziert werden. Änderungen an Regionsart, Beschriftung oder Avatar-/Form-/Ansichtszuordnung setzen die Bestätigung zurück und sperren die 3D-Auswahl bis zur erneuten Prüfung. Die hierarchische Zuordnung zu Avatar/Form/Ansicht ist separat editierbar.
- [x] **Explizite Regionsbeziehungen:** Der Editor kann Regionen über stabile IDs als gleicher Avatar, andere Form, weitere Ansicht oder gerichtetes Detail-von verknüpfen und Beziehungen wieder entfernen. Beim Anlegen einer Beziehung werden beide beteiligten Regionen erneut prüfpflichtig; ignorierte Bereiche werden aus Beziehungen entfernt. Validator prüft Endpunkte, Selbstbezüge, globale IDs und doppelte symmetrische Beziehungen. Alte Version-1-Projekte ohne `relations` bleiben gültig.
- [ ] **Bestätigung und Korrektur:** Bei Mehrdeutigkeit nachfragen. Nutzerkorrekturen haben Vorrang, bleiben versioniert und werden durch erneute automatische Erkennung nicht überschrieben.
- [ ] **Getrennte Rekonstruktionsziele:** Pro Avatar und pro Form/Ansicht ein nachvollziehbar verknüpftes Ziel erzeugen. Keine Vermischung mehrerer Avatare oder unabhängiger Formen.

## Bildgetriebene 2D-zu-3D-Rekonstruktion (verbindlich)

- [x] **Referenzmetadaten im Studio-Projekt:** Bestätigte Bildregionen, Quellhash, Pixelmaße und Avatar-/Form-/Ansichtszuordnungen werden beim Übernehmen in die Studio-Projektdatei eingebettet und beim Laden validiert.
- [x] **Originalbild als Quellasset sichern:** PNG/JPEG-Quelldateien bis 20 MiB werden bytegetreu als Base64-Asset mit Medientyp, SHA-256 und Pixelmaßen zusammen mit den Metadaten eingebettet; Bildsignatur und SHA-256 werden beim Laden verifiziert. Alte Projekte ohne Asset bleiben ladbar; das Speichern und der lokale Model Zoo begrenzen die gesamte Projektdatei auf 80 MiB.
- [x] **Gespeicherte Bildreferenz wieder öffnen:** Beim Laden eines Studio-Projekts wird das eingebettete Originalbild rekonstruiert und mit vorhandenen Regionen, Bestätigungsstatus und Avatar-/Form-/Ansichtszuordnungen in den Bildeditor geladen. Bestehende IDs und Zuordnungen bleiben beim Bearbeiten erhalten; neu gezeichnete Regionen können ergänzt werden. Alte Metadaten ohne Quellasset bleiben ladbar, können aber nicht als Bildeditor-Sitzung wiederhergestellt werden.
- [x] **Bestätigten Einzelcrop als Generierungspaket übergeben:** Der Editor erzeugt für genau eine bestätigte Region den PNG-Crop plus einen getrennten Provenienzdatensatz mit Quell-SHA-256, Originalpixelmaßen, Crop-Grenzen, Regions-ID/-Art sowie Avatar-/Form-/Ansichts-IDs und -Namen. Nur die Crop-PNG-Bytes gehen als Bildeingabe an TripoSR; der kleine Metadatensatz wird separat über `X-PaKaChi-Reference` übertragen und vom lokalen Dienst strikt auf Schema, Größen und Pixelgrenzen geprüft. Zusätzlich wird der SHA-256-Hash des hochgeladenen Crop-PNG gegen den Manifesthash geprüft. Das vollständige Kompositbild wird nicht an den Generator gesendet.
- [ ] **Kompositbild segmentieren:** Im bestätigten PaKaChi-Bild linke Figur als Tierform (animal) und rechte Figur als Arbeitsform (humanoid) getrennt ausschneiden/maskieren. Crop-Rechtecke und Segmentmasken müssen auf Originalpixel zurückführbar und manuell korrigierbar sein; Originalbild niemals überschreiben.
- [x] **Pixelgebundener Beobachtungsvertrag:** Silhouetten/Polygonkonturen, Landmarken-basierte Proportionsmessungen, RGBA-Farbproben und Materialgrenzen lassen sich als optionale Bildbeobachtungen mit Quellpixelkoordinaten und Konfidenz im Referenzprojekt speichern. Validierung prüft Region-/Landmarkenbezüge, Pixelgrenzen und Wertebereiche; es entstehen weder 3D-Tiefe noch automatische Materialzuordnungen.
- [x] **Manuelle Beobachtungserfassung im Editor:** RGBA-Farbproben und Materialgrenzen können in bestätigten Regionen erfasst, visuell überlagert, gespeichert und einzeln gelöscht werden. Materialgrenzen bleiben reine 2D-Quellpixel-Polylinien; es wird keine Materialklasse automatisch vergeben.
- [ ] **Bildkonditionierte Rekonstruktion umsetzen:** Das 2D-Bild bzw. daraus abgeleitete Masken/Konturen/Depth-/Feature-Maps müssen den Generator tatsächlich steuern. Rein textbasierte Neu-Erfindung ist für das finale Original-PaKaChi unzulässig; Prompts dürfen Bildbeobachtungen nicht überschreiben.
- [ ] **Fehlende 3D-Information kontrolliert ergänzen:** Tiefe, Rückseiten und Verdecktes als inferiert kennzeichnen; Unsicherheit und Methode speichern. Bei mehrdeutigen Bereichen zusätzliche Ansichten oder Nutzerentscheidung statt freier Erfindung verlangen.
- [ ] **Iterative Rückkopplung:** 3D-Kandidat aus Referenzkamera rendern, ausrichten und gegen Originalregion vergleichen; Pixel-/Farbfehler, Silhouette, Konturen, Landmarken und regionale Fehlerkarten (insbesondere Gesicht, Schweif, Pfoten/Hände, Brustkern und Gelenke) getrennt auswerten. Hochauflösende Detail-/Pixelprüfung ist Teil der Abnahme.
- [ ] **Design-Drift verhindern:** Jede Form braucht einen versionierten Vergleichsbericht mit Quellhash, Crop-/Maskenversion, Kameramodell, Metriken, Fehlerkarten und offenen inferierten Bereichen. Erst nach visueller Nutzerabnahme darf sie als finales Original-PaKaChi gelten.

## Übergabe und nächster Schritt

**Übergabe aktualisiert:** 2026-11-19T18:06:00+01:00 (Europe/Berlin).

- **Main-Meilenstein:** Version 0.101.0 wurde nach erfolgreicher PR-Prüfung #122 über [PR #2](https://github.com/Smilez1985/PaKaChi-SM/pull/2) am 2026-11-11T13:25:26Z nach `main` übernommen; Main-Commit `5d2733c1b9ed8aeabb9b73024d591f82b76e91a9`. CI #122 für den eingefrorenen Kandidaten `39eee8854a44f64e2e16d1d146726506998ccbd4` ist vollständig erfolgreich: **512/512 Node-Tests**, Produktionsbuild, **49/49 Browserfälle**, 0 Flaky-/Skip-Fälle und drei Importmessungen (3.404,6 / 3.035,8 / 3.167,9 ms; Median 3.167,9 ms). Ein separater main-only Nachlauf wird hier nicht behauptet. [Prüfnachweis](PRUEFUNG.md#version-01010).
- **Arbeitsbranch:** `develop`. Der Bildreferenz-Vertrag enthält optionale explizite Region-Beziehungen (`same-avatar`, `other-form`, `additional-view`, gerichtetes `detail-of`) mit stabilen IDs und strenger Validierung. Der Editor unterstützt manuelle Beziehungen und zeigt jetzt zusätzlich konservative Hierarchie-Vorschläge an, die nur per ausdrücklicher Übernahme gespeichert werden; betroffene Bereiche müssen danach erneut bestätigt werden. Der fokussierte Lauf [#44270550630](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/44270550630) auf `78c323c` ist erfolgreich: **68 Node-Tests**, **9 Chromium-Browserfälle**, TypeScript-Prüfung erfolgreich. Der Audit erkennt weiterhin ausdrücklich eine temporäre, ausschließlich dev-seitige Upstream-Ausnahme für `GHSA-fc5q-39xc-vjpf` (picomatch 4.0.7); es wird kein sauberer Null-Befund behauptet. Alle übrigen unerwarteten Audit-Befunde lassen den CI-Check fehlschlagen. `main` bleibt unverändert.
- **Topologie-Baseline / Lauf #5:** Beide Originalformen wurden vollständig lesend geprüft. Je Form: 28 starre `_shell`-Finger-/Zehen-Teilmodelle mit zusammen 672 dauerhaft flächenlosen Pol-Dreiecken (24 je Kapsel); keines wurde in den geprüften Posen wieder gültig. Keine ungültige Geometrie und keine deckungsgleichen Dreiecke. Ursache damit auf die neu erzeugten starren Kapseln eingegrenzt.
- **Originalformen-Lauf #6:** Der gezielte Workflow lief für `c1f9ac0` erfolgreich durch; Artefakt `13862826873` wurde heruntergeladen und ausgewertet. Humanoid/Arbeitsform: 92 Meshes, 190.375 Vertices; Tierform: 90 Meshes, 231.739 Vertices. Beide Berichte enthalten exakt 28 `_shell`-Teilmodelle und weisen in sämtlichen Meshes 0 Nullflächen, ungültige Indizes/nicht-endliche Dreiecke und doppelte Indexflächen aus. Die lesende Reparaturvorschau umfasst pro Mesh alle 8 Stichproben; beide Formen melden 0 entfernbare und 0 zurückgehaltene Flächen. **Wichtige Messgrenze:** Bei den 8 Hüft-/Knieproben pro Form war jeweils nur `PaKaChi_body` messbar; 91 (humanoid) bzw. 89 (Tierform) Meshes blieben wegen `coplanar-or-touching` unmessbar. Das ist keine Kollisionsfreigabe. Die gespeicherten `surfaceIssues` zeigen weiterhin Auffälligkeiten, besonders an der Tierform-Hüfte. [Artefakt und Einzelwerte](PRUEFUNG.md#originalformen-lauf-6).
- **Generator-Korrektur:** Commit `c1f9ac0` entfernt beim Erzeugen ausschließlich die flächenlosen Pol-Dreiecke aus dem Indexbuffer neuer starrer Kapseln. Positionen, UVs, Normalen und Knochenbindungen bleiben unverändert; importierte Fremdmodelle werden nicht verändert. Drei gezielte Kapselvarianten prüfen 24 → 0 Nullflächen, unveränderte Vertexattribute und Idempotenz. `prepare-pakachi.mjs` nimmt `pakachi-paws.mjs` in den Pipeline-Hash auf, daher regeneriert `--if-needed` die GLBs nach dieser Codeänderung.
- **Studio-Diagnose:** Der Browserfall `tests/e2e/mesh-topology-markers.spec.ts` prüft Anzeige/Zurücksetzen ohne Projektänderung, verwendet aber Mika. Ein neuer isolierter Test `tests/studio-view-topology.test.ts` erzeugt ein synthetisches Nullflächen-Dreieck und prüft Markeranzahl, Schwerpunktposition, Löschen sowie unveränderte Quellpuffer. Der gezielte Workflow [#43145313187](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/43145313187) ist mit 1/1 Test erfolgreich; die Markerlogik ist damit im isolierten View-Test nachgewiesen. Die echte gerenderte Sichtbarkeit im vollständigen Player bleibt manuell abzunehmen.
- **Automatische Cluster-Pipeline:** [Cluster-Architektur](CLUSTER-ARCHITEKTUR.md) ist als generische Stufe im Bild-zu-3D-Ablauf festgelegt: 2D-Analyse → 3D-Geometrie → automatische Anatomie-/Oberflächenzuordnung → Studio-/LLM-Korrektur → geschützte Neuberechnung → Rigging → Validierung. Sie darf weder getrennte Generator-Meshes noch vorhandene Skin-Gewichte voraussetzen. Segmentierte und zusammenhängende Meshes benötigen denselben Manifestvertrag.
- **Cluster-Vertrag – erster Laufzeitkern auf `develop`:** `src/cluster-architecture.ts` enthält Manifest, Validator, kontrollierte User-/LLM-Operationen und geschützte Neuberechnung. `src/cluster-inventory.ts` inventarisiert die echten Tier-/Arbeitsform-GLBs mit Quellhash und GLTF-Provenienz. `resolveClusterMeshBindings()` bindet jede stabile Mesh-ID an das exakte Three.js-Mesh, mesh-lokale Positions-/Indexpuffer und die Weltmatrix; Skinning und Morph-Targets werden bis zu einer expliziten Restpose-Anbindung abgewiesen. Die 2D-Landmarken-Triangulation prüft kalibrierte Mehransichten, Parallaxe, Residuen und positive Kameratiefe; der Pipeline-Adapter erzeugt nur validierte Kandidaten und wendet nichts automatisch an. **CI #43427196738 auf `develop`: 29/29 Cluster-Tests bestanden, TypeScript-Prüfung erfolgreich.** Die echte Kamera-/Landmarkenvalidierung steht weiterhin aus: Die separaten Tier-/Arbeitsform-Ansichtstafeln zeigen je vier beschriftete Drehwinkel (0°, 90°, 180°, 270°), enthalten aber keine Kameraintrinsik oder Extrinsik. Die stichprobenartig geprüften Legacy-Frames 001, 012, 024, 036, 048, 060 und 072 zeigen wechselnde Posen und einen Formübergang; die 72 Frames sind keine simultanen Ansichten desselben statischen Modells und dürfen nicht zur Triangulation zusammengeführt werden. Nächster Schritt: Bildserie und Referenztafeln inventarisieren, Sicht-/Posenbeziehungen feststellen und nur bei belastbarer Kamerageometrie reale Landmarkenbeobachtungen in die Pipeline einspeisen. Original-GLBs bleiben unverändert.
- **CI-Kostenregel:** Vollständige CI nur bei PR/main oder manueller Auslösung; die Originalformen-Benchmarks bleiben auf den gezielten Workflow begrenzt. Keine unnötige Wiederholung der bereits erfolgreichen 65er-Geometrieabnahme.
- **Charakter und Reihenfolge:** Gesicht, Pfoten, Fell, Fingerproportionen sowie Hüft-/Schulteranschlüsse weiter designgetreu verbessern. Erst Charakterqualität und Rigging, danach gemeinsame Morph-Topologie und die gespeicherte reversible Standard-Verwandlung.
- **Lokale Hardware:** Die [fünf Verbindungsschritte](LOKALE-WERKZEUGE.md#verbindung-zu-deinem-rechner) bleiben verfügbar. Reale Windows-/Caddy-/GPU-Abnahme und ein externer Aufruf von `local_get_status` stehen aus; CPU-basierte Entwicklung läuft unabhängig weiter.
## Prioritäten

1. **Bild-zu-3D und automatische Korrekturqualität erweitern:** Körper-/Gliedmaßenerkennung, passende Grundpose und besseres initiales Skinning weiterentwickeln.  Gewichts- und geometrische Kandidaten sowie separate adaptive Move-Diagnose sind implementiert. Bessere geometrische Kandidaten am Originalcharakter, mehrere abgestimmte Änderungen, adaptive Gegenprüfung im Auftrag und echte Fachmodell-Abnahme fehlen.
2. **Charakter und Rig verfeinern:** Beide Formen besitzen seit 0.85.0 dieselbe 59-Gelenk-Hierarchie einschließlich 14 beweglicher Finger/Zehen und echte Hautgewichte. Gesicht, Fell und lokale Pfotenflächen sind überarbeitet; die Körpernetze haben geschlossene, konsistent orientierte Kanten. Finger-/Pfotenproportionen, Anschlüsse bei großen Beugungen, verdeckte Flächen und Hüft-/Schulterübergänge weiter korrigieren und designgetreu abnehmen.
3. **Gemeinsame Morph-Topologie:** Die umformungsbedingten Hautbrücken der unabhängig rekonstruierten Netze beseitigen. Ein Charakter mit kompatibler Netzstruktur und geprüftem Rig für beide Formen.
4. **Standard-Verwandlung:** Danach eine gespeicherte Animation Normalform → Arbeitsform implementieren; dieselbe Animation rückwärts, Endform halten und laufende Bewegung ohne Sprung umkehren. Zustandszuordnung wie im Originalplayer.
5. **Reale Generatorqualität:** TripoSR-CPU-Inferenz bleibt belegt. GPU-Abnahme und qualitativer Verfahrensvergleich auf den beiden tatsächlichen Vorlagen bleiben offen.
6. **Abnahme am tatsächlichen Ablauf:** Kamera, Haut, Posen und Speichern/Laden an beiden Formen weiter prüfen. [Nachweise und Grenzen](PRUEFUNG.md#version-0850).

## Lokale Hardware anbinden

Die Umsetzung des integrierten MCP-Arbeitsplatzes, der Caddy-/DuckDNS-Konfiguration, der OAuth-Freigaben, des offiziellen Tunnel-Clients und des ACP-v1-Clients ist in [0.86.0 dokumentiert](CHANGELOG.md). Offen ist die reale Abnahme:

- [ ] Auf Steffens Windows-Rechner `Start-Windows.cmd` ausführen, MCP einschalten, Player koppeln und die tatsächlichen Blender-/Python-Pfade sowie GPU/PyTorch prüfen.
- [ ] Den vorhandenen Caddy/DuckDNS-Zugang mit dem erzeugten Abschnitt verbinden, den MCP-Server in ChatGPT hinzufügen und die OAuth-Verbindungsanfrage lokal freigeben. Keine zusätzliche öffentliche Portfreigabe.
- [ ] `local_get_status` über diese externe MCP-Verbindung erfolgreich aufrufen und die tatsächlichen Werkzeugfreigaben, Player-Kopplung und Programm-/GPU-Prüfergebnisse prüfen.
- [ ] Einen tatsächlichen Python-/Blender-Auftrag über MCP starten, Ergebnisdateien abrufen und einen GLB-Import ins Studio prüfen.
- [ ] Den alternativen Secure MCP Tunnel auf Windows/macOS mit einem berechtigten OpenAI-Konto sowie einen produktiven authentifizierten ACP-Agenten live abnehmen. Diese Alternativen sind keine Voraussetzung für den Caddy-Weg.

## Automatisierte Browserprüfung

- [ ] Weitere Screenshots und tatsächliches Mausgefühl manuell auswerten; haftende Vorschau und mobile Posenfelder wurden in 0.76.3 automatisiert und anhand dreier sichtbarer Bereichsaufnahmen geprüft; vier Artefaktbilder wurden in 0.76.2 stichprobenartig bewertet, Optionen-Kontrast und Versionsanzeige korrigiert; gerenderte Automatisierung ersetzt diese Gesamtabnahme nicht. Die automatisierten Charakter- und Arbeitsplatzabläufe sind im vollständigen Chromium-CI-Lauf von 0.86.0 belegt; die manuelle Gesamtabnahme bleibt offen.

## 1. Player und Model Zoo

- [ ] Tatsächliche Speichergrenzen und Quotenfehler in realen Browsern prüfen.
- [ ] Gespeicherte Auswahl zusätzlich mit externem MCP-Host abnehmen.
- [ ] Veröffentlichungsablauf ergänzen und zusammengeführte Exportpakete im gerenderten Player abnehmen.
- [ ] Sammlung im Browser bearbeiten und visuell abnehmen; Sichere Originalclip-Übernahme und Retargeting auf andere Rigs ergänzen. Freie Oberflächenpunkte sind seit 0.80.0 als Morph-Animation exportierbar. Eigene Studio-Moves mit Knochen-/Figurenbewegung sind seit 0.79.0 als GLB exportierbar.

## 2. StateMaschine und externe Steuerung

- [ ] Konkreten externen MCP-Host und externen NanoMQ-Broker live abnehmen.

## 3. Posen und Bewegungen

- [ ] Sequenzbearbeitung im gerenderten Studio und mit externem KI-/MCP-Host abnehmen.
- [ ] Überblendung Originalclip ↔ Studio-Move im gerenderten Player abnehmen, einschließlich kurzer einmaliger Clips, Originalclip-Überblendungen, Zeitleistensprüngen und manueller Pause; Unterstützung für bearbeitete Grundskelette und geänderte Hautgewichte ergänzen. Freie Oberflächenpunkte sind seit 0.70.0 implementiert; deren gerenderte Qualität und CPU-/Speicherbedarf auf großen Importmodellen prüfen. Mika-CPU-Messung und erste Optimierung sind seit 0.71.0 vorhanden ([Messvertrag](TRANSITION-BENCHMARK.md)); seit 0.71.1 können eigene eigenständige GLB-/glTF-Modelle ohne Bildtexturen gemessen werden.

## 4. Gelenke korrigieren

- [ ] Gewichtsqualität der eingefügten Gelenke manuell prüfen.
- [ ] Hautverformung nach Knochenlöschen manuell prüfen.
- [ ] Hautqualität nach gemischten Umbaufolgen manuell prüfen.
- [ ] Umhängen zwischen Ästen mit nicht gleichmäßiger oder negativer Skalierung, weitere Umbauten skalierter Knochenketten und Anbauteile mit eigenem Skelett unterstützen; Löschen mit Anbauteilen ergänzen. Neue Abzweigungen unter skalierten Eltern sind seit 0.72.0, das Löschen skalierter Endknochen ohne Kinder/Anbauteile seit 0.73.0 implementiert; Umhängen unter gemeinsam skalierten Vorfahren ist seit 0.74.0 und zwischen positiv gleichmäßig skalierten Ästen mit gleicher Gesamtskalierung seit 0.75.0 möglich; seit 0.76.0 bleibt auch die eigene invertierbare Skalierung des verschobenen Knochens erhalten. Seit 0.82.0 werden unterschiedliche positive gleichmäßige Astmaßstäbe durch eine rekonstruierte lokale Skalierung ausgeglichen; gerenderte Haut-/IK-Abnahme bleibt offen.
- [ ] Haut- und Bewegungsqualität nach Umhängen manuell prüfen.
- [ ] Anatomische Gelenkketten aus ungeriggter Oberfläche erzeugen; allgemeine Dreh-/Twistgrenzen, fixierte Füße und gekoppelte Ganzkörper-IK ergänzen.
- [ ] Beugegrenzen, Posen- und Bewegungsprüfung samt Prüfbildübernahme im gerenderten Studio abnehmen; lückenlose Bewegungsprüfung, direkte Drehgrenzen und Korrekturen ergänzen.
- [ ] Bewegungsfähige Rigs unterschiedlicher Körperformen systematisch prüfen.
- [ ] Die seit 0.87.0 vorhandene Dreiecks-Dehnungsprüfung einzelner Posen nach der Move-Stichprobenprüfung und komponentenweisen Volumenschätzung nach den adaptiven Diagnose-Zwischenbildern um Kontakt- und Teilmodell-Kollisionen, lokale Volumenerhaltung und Referenzansichten erweitern (unabhängige Dreiecksschnitte innerhalb der Körpernetze sind jetzt statisch vollständig messbar); die seit 0.88.0 begrenzte Gewichtssuche und die seit 0.91.0 auf Ellenbogen und Knie erweiterten Korrekturformen um weitere Gelenke, durchgehende kombinierte Bewegungen und charakterbezogene Qualitätskriterien ergänzen. Die aktuellen Warnschwellen sind keine anatomische Abnahme.

## 5. Bild zu 3D und KI-Korrektur

- [ ] Bestehenden PaKaChi anhand seiner erhaltenen Tierform und korrigierten humanoiden Stilreferenz in 3D nachbilden; beide Formen und die Transformation erhalten.
- [ ] Geeignete Generierungs-/Rigging-Verfahren qualitativ vergleichen. Echte TripoSR-CPU-Inferenz beider Originalformen ist seit 0.83.0 belegt; GPU-Abnahme und der Vergleich mit einem weiteren Verfahren bleiben offen. [Testlauf](KI-GENERIERUNG.md).
- [ ] Freien Korrekturprompt und „Skelett neu versuchen“ integrieren.
- [ ] Diesen Ablauf im gerenderten Browser prüfen; Fehler beim separaten Neustart des Original-Bildplayers und GPU-Kontextverlust gesondert absichern.

## 6. Bedienung, Qualität und Export

- [ ] Lokalisierung von Originalplayer, Modellbeschreibungen und technischen Meldungen vervollständigen.
- [ ] Modellqualität und Dateigröße skalieren; Quelle neben optimierten Ableitungen bewahren.
- [ ] Animationen nach Optimierungen prüfen; Originalclip-Übernahme in Animations-GLB ergänzen. Statischer GLB-Export ist seit 0.77.0, GLB mit bearbeitetem Hautskelett seit 0.78.0 und mit ausgewähltem Studio-Move (Knochen/Figur) seit 0.79.0 und mit freien Oberflächenpunkten als Morph-Animation seit 0.80.0 implementiert.
- [ ] Gesamten Ablauf ohne Fachwissen erproben.

## 7. Studio-Harness und Anbieteranbindung

- [ ] Produktive Adapter implementieren; Fähigkeiten und Auftragsabläufe gegen echte Dienste prüfen.
- [ ] Weitere native Cloud-Adapter und offiziell unterstützte OAuth-Verfahren ergänzen; Tresor und nativer Anthropic-Adapter sind implementiert.
- [ ] Unterstützte Fähigkeiten und Modellqualität an realen lokalen Diensten und Cloud-Konten abnehmen.
- [ ] Geeignete lokale und externe 3D- sowie Rigging-Adapter mit echten Eingaben prüfen. Geometrie, vollständige Körperhierarchie und Hautgewichte getrennt bewerten; Original-PaKaChi in beiden Formen und die Transformation zusätzlich prüfen.
- [ ] Korrekturprompt ergänzen und abgesicherte 3D-Übernahme samt Modellwechsel-Rücksprung im gesamten Ablauf visuell prüfen.

## 8. Freie Modellwahl und lokale Einrichtung

- [ ] Reale Hardwareabnahme und komplexe deutsche/englische Studio-Aufgaben einschließlich Bilder pro Quantisierung prüfen.
- [ ] AMD/Intel/Apple und mehrere GPUs zuverlässig messen; LM-Studio-Modellinstallation prüfen.
- [ ] Für jede Rolle lokale und Cloud-Ausführung integrieren: direkte Fachmodelle sowie LLM-gesteuerte Werkzeugketten, soweit nachweislich geeignet.
- [ ] Reale Kontoabnahme für Anthropic, OpenAI, DeepInfra und OpenRouter; weitere Authentifizierungswege nur nach offizieller Unterstützung.
- [ ] Fachverfahren für Geometrie und Rigging live validieren und über austauschbare Adapter zugänglich machen. Recherche nur nach diesen Aufgaben, kein Gesamtkatalogscan.

## 9. Integrierter Assistent

- [ ] Reale Anbieter- und Modellabnahme einschließlich deutscher/englischer Studio-Aufgaben und Browser-CORS.
- [ ] Vorschau und Sequenzpakete im gerenderten Browser sowie mit externem Anbieter abnehmen; Bildkontext und Transaktionen für weitere Studio-Aktionen ergänzen.
- [ ] Weitere Cloud-Fachadapter und Rigging-Ausführung unabhängig von der Assistentenrolle integrieren; Anthropic, Tresor und lokaler Generator sind vorhanden.

## 10. Anthropic-Abnahme

- [ ] Echter API-/Browserlauf mit Workspace-gebundenem Schlüssel und passendem Modell.
- [ ] Zusätzliche Workspace-Auswahl bei Bedarf ergänzen; paginierte Listen mit echtem Konto/Browser abnehmen.
- [ ] Offiziell unterstütztes OAuth implementieren; API-Schlüssel können bereits optional im Browsertresor gespeichert werden.

## 11. Mehranbieter-Routen

- [ ] Weitere Cloud-Generator-/Rigging-Fachadapter und Rigging-Fallback-Ausführung anschließen.
- [ ] Echte Anbieter-/Kontoabnahme der Fallbacks.

## 12. Schlüsseltresor

- [ ] Visuelle Browserabnahme sowie unabhängige Sicherheitsprüfung.
- [ ] Optional Betriebssystem-Schlüsselbund für spätere Desktop-Verpackung prüfen.

## Knochenbearbeitung durch Agenten

- [ ] Neue Topologieaktionen mit echtem externem MCP-Host und Anbieter abnehmen.

- [ ] Vertex-Auswahl ergänzen; Hautqualität manuell prüfen.

## Freie Knochenabzweigungen

- [ ] Anatomisches erstes Skelett auf beliebiger ungeriggter Oberfläche erkennen und zuverlässig binden. Proportionale Ausgangsvorlagen für neue statische Generatorausgaben sind seit 0.95.0 vorhanden; manuelle Abnahme und KI-Anatomie fehlen.

## Gewichtspinsel

- [ ] Gerenderte Alpha-Kanten/Mipmaps, Teiltransparenz sowie große Modelle und Ladezeiten manuell prüfen.

## Gewichtsverläufe schneller berechnen

- [ ] Mit dem [CPU- und Browser-Importbenchmark](IMPORT-BENCHMARK.md) große reale Projekte einschließlich Texturen auf Zielhardware messen und anschließend gezielt optimieren. Das Browser-Messwerkzeug ist seit 0.81.0 implementiert; repräsentative Großmodelle, GPU-Fertigstellung und manuelle Performance-Abnahme bleiben offen.

## Abgeschlossen: Bildreferenz-Erkennung

- [x] Für transparente Komponenten einen kleinen perceptual hash ergänzen und visuell ähnliche Ausschnitte als reine manuelle Prüfhilfe anzeigen; keine automatische Identitäts-, Form- oder Ansichtszuordnung.

## 2D-Clusterkern und Landmarken

- [x] Separaten 2D-Semantikvertrag mit stabilen Anatomie-/Oberflächen-IDs, quellpixelgebundenen Landmarken und Avatar-/Form-/Ansichts-/Posen-Provenienz ergänzen.
- [x] Konservative 2D-Regionsklassifikation auf bestätigte Bildregionen begrenzen; automatische Vorschläge bleiben unbestätigt, Mehrdeutigkeit und Ansichts-/Posenvermischung bleiben ungelöst.
- [x] Landmarken im integrierten Bildeditor auf bestätigten Bildregionen setzen, per Maus oder Zahlenfeldern verschieben, semantisch beschriften und löschen; Speicherung im bestehenden Bildreferenz-Dokument.
- [x] Manuelle RGBA-Farbproben direkt aus dem unveränderten Quellbild erfassen, an eine bestätigte Region binden, in Quellpixeln persistieren, visualisieren und einzeln löschen; keine automatische Materialklassifikation.
- [ ] Materialgrenzen als manuell gezeichnete Quellpixel-Polylinien im Bildeditor erfassen, korrigieren und löschen.
- [x] Persistierte Landmarken über die explizite Region-/Ansicht-/Form-/Avatar-Hierarchie in 2D-Klassifikator-Seeds überführen.
- [ ] Landmarken-Undo/Redo und eine auswählbare, charakterweite Part-/Surface-Layer-Katalogverwaltung im Studio ergänzen.
- [x] Resolver für explizit geprüfte 2D/3D-Oberflächenkorrespondenzen ergänzen: 2D-Quellhash und Avatar/Form/Ansicht/Pose, 3D-Assethash, Mesh-/Dreiecks-ID und baryzentrischer Oberflächenpunkt werden validiert; keine Tiefenableitung aus Einzelbildern. ([Vertrag](CLUSTER-2D-3D-KORRESPONDENZ.md))
- [x] Persistenzvertrag für geprüfte Oberflächenkorrespondenzen im Studio-Projekt ergänzen: begrenzte Liste, eindeutige Landmarken-IDs, Quellhashabgleich mit Bildreferenz, bestätigte Evidenz und baryzentrische Validierung. Studio-History-Snapshots enthalten den Datensatz automatisch.
- [x] 3D-Ansicht um einen expliziten `surface-pick`-Raycast-Modus ergänzen: sichtbaren Mesh-Treffer, Dreiecksindex und baryzentrische Koordinaten im Mesh-Lokalraum erfassen; transformierte und entartete Dreiecke regressionsprüfen.
- [x] Studio-Bedienoberfläche angebunden: bestätigte 2D-Landmarke auswählen, 3D-Treffer voranzeigen, lokalen Radius festlegen und erst nach separater Nutzerbestätigung mit SHA-256-gebundener stabiler Mesh-ID persistieren. Die Inventarisierung verwendet die unveränderten GLB-Quellbytes; Undo/Redo umfasst die bestätigte Zuordnung. Ein Chromium-Browserfall klickt den echten Canvas und prüft Raycast-Mesh, Dreieck und baryzentrische Koordinaten. Die vollständige UI-Bestätigung mit einem realen PaKaChi-Modell bleibt manuell abzunehmen.
- [x] Adapter für explizit bestätigte Studio-Mesh-Treffer ergänzen: Trefferindex wird in eine SHA-256-gebundene stabile Mesh-ID aufgelöst; 2D-Provenienz wird aus der bestätigten Landmarke übernommen. Mausmodus, Vorschau, explizite UI-Bestätigung und Persistenz sind integriert.
- [ ] Tier- und Arbeitsform gegen denselben Charakterkatalog prüfen und 3D-Mesh-Zuordnungen über gemeinsame semantische IDs vergleichen.

## Noch zu entscheiden

- Desktop-Verpackung und geprüfte Betriebssysteme.
- Priorität, Hardwarebedarf und Lizenzen konkreter Generierungs-/Rigging-Verfahren.
- Projektlizenz.
- Erweiterungen der Exportformate und sichere Remote-Anbindung.

Three.js, glTF/GLB, JSON-Katalog, Studio-Projektformat 1 und unabhängige Anbieterprofile pro Rolle sind festgelegt.