# Changelog

Alle wesentlichen Änderungen an PaKaChi-SM werden hier dokumentiert.

Das Format folgt [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versionen verwenden das Schema MAJOR.MINOR.PATCH. Während der 0.x-Entwicklung wird keine versionsübergreifende Kompatibilität zugesichert; bekannte Formatgrenzen werden je Version benannt.

Zusätzlich zum Versionsdatum wird der Meilenstein mit einem ISO-8601-Zeitstempel einschließlich Zeitzone dokumentiert.
Die Kategorien Added, Changed, Deprecated, Removed, Fixed und Security werden nur bei passenden Einträgen verwendet. Unreleased sammelt Änderungen seit dem letzten Software-Meilenstein. Versionslinks führen zum Prüfbericht oder vergleichen die tatsächlichen Meilenstein-Commits; dafür werden keine nicht vorhandenen Release-Tags vorausgesetzt.

Version 0.0.1 bezeichnet den ursprünglichen Dokumentationsstand. Ab 0.1.0 ist ein lokaler Player vorhanden.

## [Unreleased]

## [0.80.0] - 2026-11-07

Zeitstempel: 2026-11-07T10:12:57+01:00 (Europe/Berlin)

### Added

- Animierte freie Oberflächen-/Gesichtspunkte im GLB-Export als Positions-/Normal-Morph-Ziele. Unterschiedliche Oberflächenposen werden je Mesh dedupliziert und an den ursprünglichen Schlüsselzeiten gewichtet. Mesh-gebundene und globale Punkte bleiben mit Skinning und Figurenbewegung kombinierbar.
- Animationsausgabe auch für Figuren ohne Skelett. Die Schaltfläche heißt jetzt „Move als GLB (Animation)“; vorhandene Rigs bleiben enthalten. Native relative/absolute Morph-Ziele, Gewichte und Namen werden berücksichtigt.
- Vorabgrenzen für Morph-Speicher, Zielanzahl, Kanalwerte und Rechenaufwand. Keine stille Verringerung der Qualität.

### Changed

- Editor und Export verwenden dieselbe additive Oberflächenverformung. Unbeteiligte Oberflächen werden anhand ihres unveränderten Bezugsraums übersprungen.

[Prüfbericht](PRUEFUNG-0.80.0.md) · [Exportanleitung](GLB-EXPORT.md). Originalclip-Übernahme und Retargeting bleiben offen.

## [0.79.0] - 2026-11-07

Zeitstempel: 2026-11-07T09:26:00+01:00 (Europe/Berlin)

### Added

- Ausgewählten eigenen Studio-Move als eigenständige GLB mit Rig und einem Animationsclip exportieren. Knochenbewegung und Gesamtspur für Verschiebung, Drehung um den Figurenmittelpunkt und Größe bleiben enthalten; wiederholte Posen und Schleifenschluss werden berücksichtigt.
- Ausgabe mit 30 Stützstellen pro Sekunde und exakten Segmentgrenzen. Bewegte freie Oberflächenpunkte, Matrixscherung und zu umfangreiche Sequenzen werden abgewiesen; keine stillschweigende Teilausgabe.
- GLB-Rundlauftests für tatsächliche Animation nach dem Laden, Quellschutz, wiederholte Posen, Figurentransformationen und Grenzen; Browserprüfung für Download, erneuten Import und Wiedergabe.

[Prüfbericht](PRUEFUNG-0.79.0.md) · [Exportanleitung](GLB-EXPORT.md). Originalclip-Übernahme, animierte freie Punkte und Retargeting bleiben offen.

## [0.78.1] - 2026-11-07

Zeitstempel: 2026-11-07T09:04:13+01:00 (Europe/Berlin)

### Fixed

- Topologie-Replay nach „Zwischengelenk einfügen → Gewichte vom Elternknochen übertragen → Elternknochen löschen“: Die Einfügeachse berücksichtigt den früheren Elternbezug gelöschter Knochen, statt deren lokale Position fälschlich als Weltposition zu verwenden. Hautgewichte bleiben beim Wiederaufbau erhalten.
- Verschachtelte Löschungen, verschobene/skalierte Figuren, wiederholter Reset, Undo/Redo und Projektladen sind durch einen unabhängigen Gewichtsvergleich abgesichert. Der echte Mika-GLB-Rundlauftest verwendet jetzt die zuvor fehlerhafte Reihenfolge.

### Added

- Chromium-Regression für die Bearbeitungsfolge einschließlich Undo/Redo, Speichern und erneutem Laden.

[Prüfbericht](PRUEFUNG-0.78.1.md). Keine Projektformatänderung.

## [0.78.0] - 2026-11-07

Zeitstempel: 2026-11-07T02:12:55+01:00 (Europe/Berlin)

### Added

- GLB-Export mit bearbeitetem Hautskelett: aktuelle Hierarchie, Gewichte, Bindematrizen und Form bleiben beweglich. Keine Animationsclips oder Studio-Moves; Standbildexport bleibt separat verfügbar.
- Unabhängige Kopien schützen Quelldaten. Nicht unterstützte Rig-/Sichtbarkeitsfälle werden ausdrücklich abgewiesen; bestehende Verwerfungsprüfung bei überholtem Export bleibt erhalten.
- Tatsächliche GLB-Rundlauftests einschließlich Hautbewegung nach dem Laden, bearbeitetem Mika sowie Browser-Download und erneuter Gelenkbearbeitung.

[Prüfbericht](PRUEFUNG-0.78.0.md). Animationsausgabe, Retargeting und das separat reproduzierte Topologie-Replay-Problem bleiben offen.

## [0.77.0] - 2026-11-07

Zeitstempel: 2026-11-07T01:14:27+01:00 (Europe/Berlin)

### Added

- Eigenständiger GLB-Standbildexport im Studio: aktuelle Haut-/Morph-Verformung und Welttransformation werden in statische Geometrie übernommen, einschließlich korrigierter Dreiecksorientierung bei Spiegelungen. Materialien und UVs bleiben erhalten. Kein Rig-/Animations-Export; Studio-Projekt separat speichern.
- Exporter wird bei Bedarf geladen. Projekt- und Quelldaten bleiben erhalten; während der Erstellung überholte Ergebnisse werden nicht heruntergeladen.
- Geometrie-Regressionen und Browserprüfung für Download und erneuten Import der Datei. Instanzen und teilweise ausgeblendete Materialgruppen werden ausdrücklich abgewiesen.

[Prüfbericht](PRUEFUNG-0.77.0.md). GLB-Export mit Rig/Animationen und Retargeting bleiben offen.

## [0.76.3] - 2026-11-07

Zeitstempel: 2026-11-07T00:47:32+01:00 (Europe/Berlin)

### Added

- Gezielte Chromium-Prüfung der haftenden Studio-Vorschau beim Scrollen in normalen und niedrigen Desktopfenstern sowie nicht überdeckter Eingabefelder auf Mobilgeräten. Echte Mausradereignisse prüfen die Erreichbarkeit der Zeichenfläche; Projektdaten bleiben unverändert.
- Screenshots des sichtbaren Bereichs statt Ganzseitenaufnahmen zur Bewertung der haftenden Vorschau.

[Prüfbericht](PRUEFUNG-0.76.3.md). Das subjektive Mausgefühl und anatomische Bewegungsqualität bleiben getrennte manuelle Abnahmen.

## [0.76.2] - 2026-11-06

Zeitstempel: 2026-11-06T19:13:55+01:00 (Europe/Berlin)

### Fixed

- Optionen-Schaltfläche auf dunkler Navigation: helle Textfarbe und lesbare Hover-/Fokuszustände statt dunkler Schrift auf dunklem Hintergrund.
- Versionsanzeige der Oberfläche stammt aus package.json statt aus dem veralteten fest eingetragenen Stand 0.67.0.

### Added

- Chromium-Regression für Paketversion, mindestens 4,5:1 Textkontrast im Normal-/Hoverzustand, sichtbaren Tastaturfokus und Öffnen der Optionen per Enter.

[Prüfbericht und Screenshotbefunde](PRUEFUNG-0.76.2.md).

## [0.76.1] - 2026-11-05

Zeitstempel: 2026-11-05T09:17:35+01:00 (Europe/Berlin)

### Fixed

- Zwei fehlgeschlagene Chromium-Tests des lokalen Model Zoo: Der Selektor für die Speicherbestätigung traf nach der Trennung von Vorgangsstatus und Listenwarnung zwei Elemente. Beide Felder besitzen jetzt eindeutige IDs; die Tests prüfen gezielt den Vorgangsstatus. Keine Abschwächung der Speicher-, F5- oder Mehrtab-Prüfungen.

### Changed

- Actions-Abnahme nach wieder verfügbarem Kontingent aufgenommen. Der erste Lauf bestätigte 312 Node-Tests, Build und 20 Browserfälle einschließlich Mausnavigation. Korrigierter Stand und vollständige CI-Ergebnisse werden in PR #1 geprüft.

[Prüfbericht](PRUEFUNG-0.76.1.md).

## [0.76.0] - 2026-11-04

Zeitstempel: 2026-11-04T14:54:49+01:00 (Europe/Berlin)

### Added

- Umhängen von Knochen mit eigener gleichmäßiger, ungleichmäßiger oder negativer Quellskalierung. Die eigene Skalierung bleibt erhalten; Positions-/Drehungsumrechnung ohne Spiegelungsmehrdeutigkeit.
- Regressionen für sechs Skalierungsvarianten einschließlich Spiegelungen verschiedener Achsen, Hautgeometrie, starre Anbauteile, Posen/Entwurf, Rekonstruktion und Quellwiederherstellung. Nicht invertierbare eigene Skalierungen werden atomar abgewiesen.

[Prüfbericht](PRUEFUNG-0.76.0.md). Elternäste benötigen weiterhin gleiche positive gleichmäßige Gesamtskalierungen; gerenderte Abnahme bleibt offen.

## [0.75.0] - 2026-11-04

Zeitstempel: 2026-11-04T14:51:57+01:00 (Europe/Berlin)

### Added

- Umhängen zwischen Ästen mit gleicher kumulierter positiver gleichmäßiger Skalierung. Die Umrechnung von Grundpose, gespeicherten Posen und Entwurf berücksichtigt die tatsächlichen Quellskalierungen.
- Regressionen für gleich skalierte sowie unterschiedlich aufgebaute Äste (4 × 0,5 gegenüber 2), Hautgeometrie, starre Anbauteile, Projektrekonstruktion und Quellwiederherstellung. Ungleiche, nicht gleichmäßige und negative Astskalierungen bleiben atomar abgewiesen.

[Prüfbericht](PRUEFUNG-0.75.0.md). Gerenderte Haut-/Bewegungsabnahme bleibt offen.

## [0.74.0] - 2026-10-31

Zeitstempel: 2026-10-31T02:45:35+01:00 (Europe/Berlin)

### Added

- Knochen innerhalb eines gemeinsam skalierten Teilbaums umhängen: Die Umrechnung erfolgt relativ zum nächsten gemeinsamen Vorfahren. Gleichmäßige, ungleichmäßige und negative gemeinsame Skalierung bleiben erhalten.
- Regressionen für Hautgeometrie und starre Anbauteile in Grundpose, gespeicherter Pose, Entwurf, Projektrekonstruktion und Quellwiederherstellung; nicht invertierbare gemeinsame Skalierung wird ohne Datenänderung abgewiesen.

[Prüfbericht](PRUEFUNG-0.74.0.md). Unterschiedlich skalierte Äste und gerenderte Qualitätsabnahme bleiben offen.

## [0.73.0] - 2026-10-31

Zeitstempel: 2026-10-31T02:32:53+01:00 (Europe/Berlin)

### Added

- Skalierte Endknochen ohne Kinder oder Anbauteile können gelöscht werden. Hautgewichte werden dem Elternknochen zugeordnet; gespeicherte Posenspuren des entfernten Knochens entfallen.
- Regressionen für gleichmäßige, ungleichmäßige und negative Skalierung, unveränderte Grundgeometrie, Projektrekonstruktion und Wiederherstellung der Quelle. Skalierte Zwischenknochen bleiben geschützt.

[Prüfbericht](PRUEFUNG-0.73.0.md). Gerenderte Haut-/Bewegungsabnahme bleibt offen.

## [0.72.0] - 2026-10-31

Zeitstempel: 2026-10-31T01:51:23+01:00 (Europe/Berlin)

### Added

- Neue Knochenabzweigungen unter skalierten Quellknochen: gleichmäßige, ungleichmäßige und negative Skalierungen werden bei der Welt-/Lokalkoordinaten-Umrechnung berücksichtigt.
- Regressionen für Platzierung, unveränderte Hautgeometrie, gespeicherte Posen, Rekonstruktion und Wiederherstellung der Quelle. Nicht invertierbare Elternmatrizen und extreme lokale Positionen werden atomar abgewiesen.

[Prüfbericht](PRUEFUNG-0.72.0.md). Umhängen/Löschen skalierter Knochen und gerenderte Qualitätsabnahme bleiben offen.


## [0.71.1] - 2026-10-30

Zeitstempel: 2026-10-30T19:06:33+01:00 (Europe/Berlin)

### Added

- Überblendungsbenchmark akzeptiert eigene eigenständige GLB-/glTF-Dateien mit `--model` und 1–10 Wiederholungen pro Fall mit `--runs`. `--help` beschreibt die Optionen.
- Größenlimit von 50 MiB, ausdrückliche Ablehnung von Bildtexturen und Prüfung unveränderter Modelle über alle Messprozesse. Quelldateien bleiben unangetastet.
- CLI-Regressionen für eigene Geometrie, Prüfsummen, unveränderte Quelldateien, ungültige Argumente und nicht unterstützte Eingaben.

[Prüfbericht](PRUEFUNG-0.71.1.md). Große reale Modelle und Browserabnahme bleiben offen.

## [0.71.0] - 2026-10-30

Zeitstempel: 2026-10-30T09:42:50+01:00 (Europe/Berlin)

### Added

- `npm run benchmark:transitions`: reproduzierbare CPU-Messung der Player-Überblendung mit dem mitgelieferten Mika, ohne/einem/allen betroffenen Meshes, jeweils drei eigene Prozesse. JSON-Bericht mit Einzelzeiten, Speicher-Momentaufnahmen und Geometrie-Prüfsummen; kein Rendering- oder FPS-Nachweis.

### Changed

- Oberflächenüberblendungen verwenden Zielpuffer innerhalb eines Übergangs wieder und kopieren zusammenhängende Float32-Attribute direkt. Andere Attributlayouts behalten den allgemeinen Zugriff. Ausgangspose und Zielzustand bleiben getrennt; beim Abschluss oder Abbruch werden die wiederverwendeten Puffer freigegeben.
- Lokale Messreihe für alle Mika-Meshes: Medianzeiten pro Prozess von 24,94–26,86 ms auf 13,10–16,93 ms reduziert. Positionen-/Normalen-Prüfsummen identisch; festgehaltener ArrayBuffer-Bedarf weiterhin rund 8,34 MiB. Keine allgemeine Laufzeitgarantie.

[Prüfbericht](PRUEFUNG-0.71.0.md) · [Messvertrag](TRANSITION-BENCHMARK.md). Gerenderte Abnahme und große reale Importmodelle bleiben offen.

## [0.70.0] - 2026-10-30

Zeitstempel: 2026-10-30T08:51:57+01:00 (Europe/Berlin)

### Added

- Player-Überblendung auch für freie Gesichts-/Oberflächenpunkte: Betroffene Mesh-Positionen werden vorübergehend interpoliert, Normalen und Begrenzungen für die sichtbare Zwischenform neu berechnet.
- Vor jedem Animationsschritt werden Zielpositionen, Zielnormalen und Begrenzungen wiederhergestellt. Pause, wiederholter Wechsel, Abbruch und Rückkehr zum Originalclip erhalten den Zielzustand; gespeicherte Posen und Hautgewichte werden nicht verändert.

### Changed

- Freie Oberflächenpunkte verhindern die Überblendung nicht mehr. Zusätzliche Geometriekopien sind auf Meshes beschränkt, denen solche Punkte zugeordnet sind; Punkte ohne Mesh-Zuordnung betreffen alle Studio-Meshes.

Bearbeitete Knochen-Grundstellung, Knochenumbau, Gewichtsaufträge, geänderte Geometrieidentität und Schertransformationen bleiben ausgeschlossen. Zusätzlicher CPU-/Speicherbedarf während des Übergangs; große Modelle und gerenderte Hautqualität sind noch nicht abgenommen. [Prüfbericht](PRUEFUNG-0.70.0.md).

## [0.69.2] - 2026-10-30

Zeitstempel: 2026-10-30T07:18:04+01:00 (Europe/Berlin)

### Fixed

- Auch bei Überblendungen zwischen Originalclips wird die Mischung vollständig beendet, wenn ein kurzer einmaliger Zielclip bereits seine Endpose erreicht hat. Der beendete Clip bleibt dabei an seinem Ende; manuelle Pause während eines laufenden Clips bleibt wirksam.
- Ein Sprung auf der Zeitleiste beendet die alte Clip-Überblendung und zeigt die gewählte Zielpose ohne Restgewicht des vorherigen Clips. Der manuelle Pausenstatus bleibt erhalten.

Beide Fehler vor der Korrektur durch Regressionstests reproduziert. Entwicklungsstand auf dem Arbeitsbranch; gerenderte Abnahme bleibt offen. [Prüfbericht](PRUEFUNG-0.69.2.md).

## [0.69.1] - 2026-10-29

Zeitstempel: 2026-10-29T21:45:22+01:00 (Europe/Berlin)

### Fixed

- Überblendungen erreichen auch dann die vollständige Zielpose, wenn ein einmaliger Originalclip kürzer als der Übergang ist. Natürliches Clip-Ende wird von manueller Pause unterschieden; manuelle Pause hält die Überblendung weiterhin an.
- Gemeinsame Berechnung der Übergangszeit berücksichtigt fehlenden Grundclip, Tempo und ungültige Framezeiten. Wiederholen oder Springen auf der Zeitleiste hebt den erkannten Abschlusszustand korrekt auf.

Entwicklungsstand auf dem Arbeitsbranch, keine neue gerenderte Browserabnahme. [Prüfbericht](PRUEFUNG-0.69.1.md).

## [0.69.0] - 2026-10-29

Zeitstempel: 2026-10-29T21:13:59+01:00 (Europe/Berlin)

Entwicklungsmeilenstein auf `work/local-verification-model-zoo`; Browserabnahme steht aus.

### Added

- Kurze Überblendung beim Wechsel zwischen Originalclips und Studio-Moves im Player sowie bei der automatischen Rückkehr zur Grundbewegung. Die sichtbare Ausgangspose wird über 0,18 Animationssekunden in die weiterlaufende Zielpose überführt; Position, Rotation, Größe und vorhandene Morph-Gewichte werden berücksichtigt.
- Pause hält die Überblendung an, Tempo skaliert sie. Erneuter Wechsel startet an der sichtbaren Zwischenpose. Springen auf der Zeitleiste oder Öffnen des Studios beendet die temporäre Überblendung; Projekt, Undo-Verlauf und gespeicherte Posen bleiben unverändert.

Nur unveränderte Grundskelette ohne freie Oberflächenpunkte, Knochenumbau oder Gewichtsaufträge. Geänderte Hierarchien und Schertransformationen werden nicht interpoliert; dort bleibt der direkte Wechsel erhalten. Originalclip-Überblendungen untereinander bleiben bestehen. [Prüfbericht](PRUEFUNG-0.69.0.md).

## [0.68.0] - 2026-10-29

Zeitstempel: 2026-10-29T19:35:45+01:00 (Europe/Berlin)

Entwicklungsmeilenstein auf `work/local-verification-model-zoo`; noch nicht in `main`. Chromium-Abnahme steht aus.

### Added

- `npm run benchmark:import` misst Projektdatei, Validierung, Modelldekodierung, Normalisierung und Rig-Aufbau inklusive Gewichtsverlauf getrennt. Wiederholungen in eigenen Prozessen, eigene Projektdateien ohne Änderung, Prüfsummen und JSON-Bericht; Bildtexturen werden ausdrücklich abgewiesen.

- Lokale Sammelbefehle `npm run verify` (Node-Tests und Build) und `npm run verify:full` (zusätzlich Chromium-E2E), jeweils mit Abbruch beim ersten fehlgeschlagenen Schritt. Browserinstallation bleibt ein ausdrücklicher Vorbereitungsschritt.

### Fixed

- Automatische Model-Zoo-Aktualisierungen durch andere Tabs oder Fensterfokus erhalten das Ergebnis des letzten Bedienvorgangs. Listenfehler erscheinen getrennt und verschwinden nach erfolgreicher Aktualisierung.

- Model Zoo unterscheidet Browserkontingent, das 50-Kopien-Limit und Projekte über 80 MiB mit konkreten Hinweisen.
- Bestätigtes Speichern/Löschen bleibt bei nachfolgendem Listenfehler als erfolgreich sichtbar. Veraltete Auswahlen bleiben bis zur erfolgreichen Aktualisierung für Laden/Löschen gesperrt, auch über die gemeinsame Avatar-Auswahl.

### Changed

- Roadmap auf offene Aufgaben und Abnahmen reduziert; erledigte Versionshistorie im Changelog und in den Prüfberichten belassen.

- Direkte Pushes nach `main`, die ausschließlich README, Markdown-Dokumentation oder Benchmark-Messdaten ändern, lösen künftig keinen vollständigen Prüflauf aus. Pull Requests und manuelle Ausführung bleiben unverändert; Prüfsummen in `docs/references` sind nicht ausgenommen.

## [0.67.0] - 2026-10-28

Zeitstempel: 2026-10-28T12:48:55+01:00 (Europe/Berlin)

### Added

- Browserprüfung echter Mausnavigation nach Zoom/Pan: Figurenmitte, Kameraradius, Inversion über Optionen, Loslassen und unveränderte Projektdaten.

**Prüfung:** Produktionsbuild lokal bestanden. Neuer Chromium-Nachweis steht aus. Der bisherige bestätigte Stand umfasst 286 Node-Tests und 21 Browserfälle.

Dies ergänzt den automatisierten Navigationsnachweis; tatsächliches Mausgefühl, komplexe Skelett-/Hautqualität und große reale Modelle bleiben manuell zu prüfen. Keine Änderung am Kameraalgorithmus.

## [0.66.0] - 2026-10-28

Zeitstempel: 2026-10-28T00:52:17+01:00 (Europe/Berlin)

### Added

- Reproduzierbarer CPU-/Speicherbenchmark für geometrische und Alpha-Sichtprüfung bis 80.000 Dreiecke; isolierter Prozess je Fall und JSON-Ausgabe.
- Regressionstest für unterschiedliche UV-Kanäle von Bildalpha und Alpha-Map sowie unveränderliche UV-Kopien.

### Changed

- Nur benötigte UV-Kanäle kopieren; undurchsichtige Dreiecke benötigen keine eigenen UV-Vektoren. Sichtregeln und Projektformat bleiben unverändert.

**Prüfung:** 286 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40665412491)). Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 4758 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Lokale Einzelmessung bei 80.000 Dreiecken: zurückbehaltener JavaScript-Heap einschließlich Testmodell von 166,10 auf 64,85 MiB (undurchsichtig) und 166,12 auf 100,20 MiB (Alpha). Die 1.000 Strahlproben lieferten jeweils dieselben Ergebnisse. Keine Messung des vollständigen Browserimports, Renderings oder Skinning; keine allgemeine Laufzeit-/Speicherzusage. Mipmaps, Teiltransparenz und manuelle Abnahme großer realer Modelle bleiben offen.

## [0.65.0] - 2026-10-27

Zeitstempel: 2026-10-27T17:55:08+01:00 (Europe/Berlin)

### Added

- Deterministische Alpha-Ausschnitte für den sichtbaren Gewichtspinsel mit UV-Interpolation, Material-Grenzwert und unveränderlicher Pixelkopie.
- Gespeicherte Alpha-Regel in Projekten, Katalogen sowie Assistent-/MCP-Schemas; alte Aufträge bleiben unverändert.
- Drei Node-Regressionstests und Browserfall für tatsächlich dekodiertes PNG.

**Prüfung:** 285 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40545759919)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 8998 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Die Alpha-Prüfung verwendet deterministisch die Basisebene der Textur, keine Mipmaps oder anisotrope Filterung. Dadurch sind Abweichungen zur gerenderten Kante bei Verkleinerung möglich. Unterstützt sind lesbare RGBA-8-Bit-Bilder bis 16.777.216 Pixel pro Textur. Nicht lesbare/komprimierte Texturen, fehlende UVs, Shader-Materialien und Alpha-to-Coverage bleiben verdeckend. Teiltransparenz wird nicht simuliert; Dreiecke bleiben beidseitig. GPU-/Materialqualität und große Modelle sind nicht manuell abgenommen. Neue Alpha-Aufträge benötigen mindestens 0.65.0; kein automatischer Umbau alter Verläufe.

## [0.64.0] - 2026-10-27

Zeitstempel: 2026-10-27T17:35:17+01:00 (Europe/Berlin)

### Added

- Sichtprüfung berücksichtigt ausgeblendete Materialgruppen und transparente Materialien mit Opazität 0.
- Gespeicherte Materialregel über Projekt, Katalog, Assistent und MCP; alte Aufträge bleiben geometrisch.
- Regressionstest für Gruppen, Transparenz, Material-Snapshot und alte Verläufe.

**Prüfung:** 282 Node-Tests, Produktionsbuild und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40542963343)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 6254 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Teiltransparente Materialien und Alpha-Texturen gelten weiterhin als undurchsichtige Hindernisse; Dreiecke bleiben beidseitig. Große Modelle und Materialdarstellung sind noch nicht manuell abgenommen. Dateien mit dem neuen Feld benötigen mindestens 0.64.0.

## [0.63.0] - 2026-10-27

Zeitstempel: 2026-10-27T06:48:29+01:00 (Europe/Berlin)

### Added

- Optionale Sichtprüfung für den Gewichtspinsel mit geometrischer Verdeckungsprüfung und Blickfeldbegrenzung.
- Gespeicherte Kamera pro Pinselstrich; `region.view` über Projekt-/Katalogexport und beide MCP-Schemas erhalten, Kamera über `get_studio.view` verfügbar.
- Tests für verdeckte Vertices, eingefrorene Ansicht, umgedrehte Kamera, Wiederladen und ungültige Sichtdaten.

### Changed

- README, Design, Roadmap, Studio-Anleitung und Sprachtexte nachgezogen.

### Fixed

- Zwei-Tab-Browsertest trennt die größenabhängige Kameraprojektion vom weiterhin vollständig verglichenen Studiozustand; Kameraposition bleibt geprüft.

**Prüfung:** 281 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40529588502)); Python-Syntax lokal geprüft. Der Browserimport mit 256 sichtgefilterten Aufträgen dauerte in diesem Lauf 8909 ms; Einzelmessung, keine allgemeine Laufzeitgarantie. Sichtprüfung bezieht sich auf die ursprüngliche Grundpose. Dreiecke gelten beidseitig als undurchsichtige Hindernisse; Transparenz, Alpha-Ausschnitte und Materialgruppen-Sichtbarkeit werden nicht ausgewertet. Die erste Sichtprüfung baut eine Suchstruktur auf und benötigt zusätzlichen Speicher; große Modelle sind noch nicht manuell abgenommen. Ohne Checkbox gilt weiterhin der kugelförmige Pinsel. Projekte mit `region.view` benötigen mindestens 0.63.0.

## [0.62.0] - 2026-10-26

Zeitstempel: 2026-10-26T22:48:12+01:00 (Europe/Berlin)

### Changed

- Gewichtsberechnung durch vorberechnete Weltpositionen, wiederverwendete Zahlenfelder, frühes Überspringen und direkte Pufferkopien beschleunigt.
- README, Design, Roadmap und Bedienanleitung mit getrennten Rig-Reset- und Importmessungen aktualisiert.

### Added

- Deterministischer Vergleich gegen die bisherige Map-Berechnung, einschließlich Duplikaten, Gleichständen, räumlichem Abfall und Interleaved-Attributen.
- `npm run benchmark:weights` für reproduzierbare lokale Messungen mit Mika und 256 Aufträgen.

**Prüfung:** 279 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40407457621)). Der Browserimport mit 256 Aufträgen dauerte in diesem Lauf 6822 ms (vorheriger 0.61.0-Lauf: 19181 ms). Einzelmessungen auf CI-Runnern, keine allgemeine Laufzeitgarantie. Das Budget bleibt bei 1024 Aufträgen. Lokale Messung mit 256 Aufträgen: 1626/1471/1551 ms für den reinen Rig-Reset (Median 1551 ms); vorherige Vergleichsmessung 6375/5903/5718 ms. Dies ist kein vollständiger Browserimport und keine allgemeine Echtzeit-Zusage. Vorberechnete Weltpositionen benötigen 24 Byte pro Vertex statt zuvor 12 Byte für die Positionskopie. Beschränkung des Pinsels auf sichtbare Oberflächen und manuelle Prüfung großer Modelle bleiben offen.

## [0.61.0] - 2026-10-26

Zeitstempel: 2026-10-26T13:25:33+01:00 (Europe/Berlin)

### Changed

- Gemeinsames Budget für Pinsel- und Einzelübertragungen von 128 auf 1024 Aufträge erhöht.
- Neue Gewichtsaufträge werden direkt und atomar auf aktuellen Skinning-Attributen angewendet, ohne den Verlauf oder die Knochenhierarchie pro Auftrag neu aufzubauen.
- README, Design, Roadmap, Bedienanleitung und deutsche/englische Budgethinweise aktualisiert.

### Fixed

- Dem Browser-Ladetest für 256 Gewichtsaufträge eine eigene begrenzte Wartefrist und Ladezeitmessung gegeben, nachdem der erste CI-Lauf an der bisherigen 5-Sekunden-Frist abbrach.

### Added

- Prüfung von 1024 direkten Übertragungen, identischer Wiederherstellung, erhaltenen Posen/Paletten/Attributen, Budgetgrenze und Katalogexport.
- Browserprüfung eines gespeicherten Mika-Projekts mit 256 Gewichtsaufträgen.

**Prüfung:** 278 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40362549729)). Der Import mit 256 Aufträgen dauerte auf diesem CI-Runner 19,181 Sekunden; weitere Ladezeitoptimierung bleibt offen. Projekte mit mehr als 128 Gewichtsaufträgen benötigen mindestens 0.61.0. Das Projektformat bleibt Version 1; ältere Leser lehnen das größere Budget ab. Laden und Undo/Redo rekonstruieren weiterhin den gespeicherten Verlauf. Die manuelle Performance-Abnahme großer Modelle bleibt offen; keine pauschale Echtzeit-Zusage. Sichtbare Oberflächen begrenzen den kugelförmigen Pinsel weiterhin nicht.

## [0.60.0] - 2026-10-26

Zeitstempel: 2026-10-26T08:02:39+01:00 (Europe/Berlin)

### Added

- Farbige Diagnoseansicht tatsächlicher Hautgewichte für den ausgewählten Knochen, mit Legende und Aktualisierung nach Gewichtsänderungen.
- Prüfungen für Gewichtswerte, Auswahl/Pinsel/Undo, Material- und Vertex-Farberhaltung sowie einen gerenderten Browservergleich.

### Changed

- Temporäre Ansicht stellt ursprüngliche Materialien beim Ausschalten, Moduswechsel und Verlassen wieder her; keine Projektänderung.
- README, Design, Roadmap, Bedienanleitung und deutsche/englische Hinweise nachgezogen.

**Prüfung:** 277 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40313636231)). Nur geriggte Oberflächen mit Skinning-Gewichten. Farben werden zwischen Vertices über Dreiecke interpoliert; die Anzeige ist keine Anatomie- oder Qualitätsbewertung. Der bestehende Pinsel bleibt kugelförmig und auf 128 gespeicherte Übertragungen begrenzt. Beschränkung auf sichtbare Vertices, größere Pinselbudgets und manuelle Hautqualitäts-/Performance-Abnahme bleiben offen.

## [0.59.0] - 2026-10-26

Zeitstempel: 2026-10-26T07:37:18+01:00 (Europe/Berlin)

### Added

- Gewichtspinsel mit linker Maustaste, räumlicher Vorschau und festem Abstand zwischen Aufträgen.
- Gemeinsames Undo pro Strich, vollständiger Rollback bei Abbruch oder Budgetüberschreitung und Sperre paralleler Agentenänderungen.
- Prüfungen für Abtastung, leere Bereiche, Abbruch, Navigation und Undo/Redo; Browserfall mit Projekt-Wiederladen.

### Changed

- README, Design, Roadmap, Studio-Anleitung und deutsche/englische Pinselhinweise ergänzt.

**Prüfung:** 275 Node-Tests, Build und alle 19 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40280964660)). Erste Pinselstufe: kugelförmiger Einfluss, auch durch dünne Oberflächen hindurch; keine Beschränkung auf sichtbare Vertices, keine Gewichtsfärbung. Überlappende Aufträge verstärken den Effekt. Höchstens 128 gespeicherte Übertragungen pro Projekt einschließlich Einzelaufträgen; lange Striche können das Limit erreichen. Große Sprünge und fehlende Oberflächentreffer unterbrechen die Verbindung zwischen Aufträgen. Manuelle Hautqualitäts- und Performance-Abnahme bleibt offen.

## [0.58.0] - 2026-10-26

Zeitstempel: 2026-10-26T07:00:49+01:00 (Europe/Berlin)

### Added

- Freie Kindknochen per Mausklick an vorhandenen Knochen setzen, mit Verbindung, Skinning-Palette und Undo/Redo.
- `add_bone` für Assistent sowie Node-/Python-MCP mit Freigabe- und Revisionsprüfung.
- Prüfungen für Gewichterhalt, gezielte Gewichtszuteilung, gemischte Umbaufolgen und Projekt-/Katalogexport.

### Changed

- Projektleser und Katalogexport erhalten freie Knochenabzweigungen. Diese Dateien benötigen mindestens 0.58.0.
- README, Design, Roadmap und Studio-Anleitung aktualisiert.

**Prüfung:** 271 Node-Tests, Build und alle 18 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40277434553)); Python-Syntax lokal geprüft. Benötigt einen vorhandenen Elternknochen; kein neues Skelett auf einer ungeriggten Oberfläche. Neue Knochen wirken erst nach Gewichtsübertragung auf die Haut. Skalierte Knochenketten sind ausgeschlossen. Kontinuierlicher Gewichtspinsel, Gewichtsfärbung und manuelle Hautabnahme bleiben offen. Projekte mit freien Knochen benötigen mindestens 0.58.0; ältere Leser lehnen diese Einträge ab.

## [0.57.0] - 2026-10-26

Zeitstempel: 2026-10-26T02:13:51+01:00 (Europe/Berlin)

### Added

- Sichtbare räumliche Vorschau für Hautgewichtsübertragung mit Radiusgrenze, halber Stärke und transparenter Kugelfläche.
- Aktualisierung bei Gelenkauswahl, Radius, Gelenkverschiebung und Undo/Redo; automatische Ausblendung außerhalb der Bearbeitung.

### Changed

- Deutsche und englische Hinweise für Gewichtsübertragung und Vorschau ergänzt.
- README, Design, Roadmap, Bedienanleitung und Prüfbericht nachgezogen.

**Prüfung:** 268 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40253220224)). Keine farbige Vertex-Gewichtsanalyse, kontinuierlicher Gewichtspinsel oder neue manuelle Hautabnahme.

## [0.56.0] - 2026-10-25

Zeitstempel: 2026-10-25T19:09:43+01:00 (Europe/Berlin)

### Added

- Optionale räumliche Begrenzung der Hautgewichtsübertragung auf eine Kugel mit einstellbarem Radius und weichem Randabfall.
- `region` für Assistent und beide MCP-Server, inklusive Projektpersistenz und Katalogexport.

### Changed

- Bereichsauswahl verwendet ursprüngliche Vertexpositionen in normalisierten Weltkoordinaten; laufende Posen verändern die Auswahl nicht.
- README, Design, Roadmap, Anleitung und Prüfbericht nachgezogen.

**Prüfung:** 266 Node-Tests und Build bestanden, Python-Syntax geprüft. Alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40219939990)). Bereichsvorschau, kontinuierlicher Malpinsel und manuelle Hautabnahme bleiben offen.

## [0.55.0] - 2026-10-25

Zeitstempel: 2026-10-25T18:43:03+01:00 (Europe/Berlin)

### Added

- Anteiliges Übertragen von Hautgewichten zwischen vorhandenen Knochen mit Mausregler, Undo/Redo und Projekt-/Katalogpersistenz.
- Aktion `transfer_weights` für Assistent und beide MCP-Server.
- Prüfgrund `skin-weights` für Posen und Moves; Reihenfolge bei gemischten Topologieänderungen erhalten.

### Changed

- Move-Bindung berücksichtigt Gewichtsbearbeitungen; ursprüngliche Quellgewichte bleiben wiederherstellbar.
- README, Design, Roadmap, Bedienanleitung und Prüfbericht nachgezogen.

**Prüfung:** 264 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40217823978)); Python-Syntax geprüft. Kein räumlicher Malpinsel oder manuelle Hautqualitätsabnahme.

## [0.54.0] - 2026-10-25

Zeitstempel: 2026-10-25T11:13:22+01:00 (Europe/Berlin)

### Added

- Umhängen von Knochen mit starren Anbauteilen und verschachtelten Objektgruppen; Erhalt von Grundstellung, Posen und Befestigung.

### Changed

- Schutzprüfung unterscheidet starre Anbauteile von eingebetteten Knochen/SkinnedMesh; letztere bleiben ausgeschlossen. Knochenlöschen mit Anbauteilen bleibt gesperrt.
- Assistent-/MCP-Beschreibungen, Bedienanleitung, README und Blaupause angepasst.

**Prüfung:** 258 Node-Tests und Build bestanden; Python-Syntax geprüft. Alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40184399914)). Keine manuelle Bewegungsqualität oder neue reale KI-/Python-Host-Abnahme.

## [0.53.0] - 2026-10-25

Zeitstempel: 2026-10-25T00:31:31+02:00 (Europe/Berlin)

### Added

- Echte Knochen im Studio umhängen: neuer Elternknochen, Erhalt der Grundstellung und gespeicherter Einzelposen, Undo/Redo.
- `reparent_bone` für Assistent und beide MCP-Server; tatsächliche Elternknochen in `get_studio`.
- Geordnete Persistenz für gemischtes Einfügen/Löschen/Umhängen einschließlich Katalogexport und Move-Bindung.

### Changed

- Betroffene Posen/Moves nach Umhängen zur Prüfung markieren. Zwischenbewegungen können sich trotz erhaltener Einzelposen ändern.
- README, Design, Roadmap, Bedienanleitung und Prüfbericht nachgezogen.

**Prüfung:** 256 Node-Tests und Build bestanden; Python-Syntax geprüft. Alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40138951275)). Wurzeln, Kreise, fremde Skelettbäume, skalierte Knochenketten und direkte Anbauteile sind ausgeschlossen.

## [0.52.0] - 2026-10-24

Zeitstempel: 2026-10-24T23:29:23+02:00 (Europe/Berlin)

### Added

- Mausregler für die Position neuer Zwischengelenke zwischen 10 und 90 % der vorhandenen Knochenstrecke.
- Optionaler `ratio`-Parameter für Assistent, Node-MCP und Python-MCP; ohne Angabe bleibt die Mitte der Standard.

### Changed

- Prüfungen für außermittige Position, Grenzwerte, Posen, Hautgewichte, Wiederladen und Undo; vorhandene Browserfälle verwenden jetzt 30 %.
- README, Design, Roadmap und Studio-Anleitung nachgezogen.

**Prüfung:** 251 Node-Tests und Build bestanden, Python-Syntax gültig. Alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40134452209)); keine reale Anbieter-/Python-Host- oder manuelle Hautabnahme.

## [0.51.0] - 2026-10-24

Zeitstempel: 2026-10-24T18:47:49+02:00 (Europe/Berlin)

### Added

- Zwei Browserfälle für Einfügen/Löschen echter Knochen über bestätigte Assistentenvorschläge mit Undo.

### Changed

- README und Blaupause mit Prüfumfang und Grenzen aktualisiert.

**Prüfung:** 249 Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40113222944)); Anbieterantworten simuliert.

## [0.50.0] - 2026-10-24

Zeitstempel: 2026-10-24T18:36:37+02:00 (Europe/Berlin)

### Added

- `insert_bone` und `delete_bone` für Studio-Werkzeuge, Node-/Python-MCP und integrierten Assistenten.
- Editor-Test für Freigabe, Modus, Revision und Undo; MCP-Prozesstest um beide Aktionen erweitert.

### Changed

- Werkzeugbeschreibungen unterscheiden echte Knochenentfernung vom Löschen eines Griffs; README und Blaupause nachgezogen.

**Prüfung:** 249 Tests und Build bestanden; Node-MCP-Transport geprüft, Python-Syntax gültig. Neue Browser-/externe Anbieterabnahme steht aus.

## [0.49.0] - 2026-10-24

Zeitstempel: 2026-10-23T21:49:50+02:00 (Europe/Berlin)

### Added

- Gespeicherte Reihenfolge für gemischte Knochen-Einfügungen und -Löschungen; Katalogexport erhält die Reihenfolgemarker.
- Zwei Tests für wiederholte Mischfolgen, Gewichtsrekonstruktion, Markerprüfung und unabhängiges Undo/Redo. Browserfall um Ersatzgelenk und erneutes Laden erweitert.

### Changed

- Einfügen nach Knochenlöschungen ist wieder möglich; Hierarchie und Skinning-Änderungen werden in ihrer tatsächlichen Reihenfolge aufgebaut.
- README und Blaupause nachgezogen. Gemischte Abläufe benötigen Software ab 0.49.0.

**Prüfung:** 248 Tests, Build und alle zwölf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)). Manuelle Hautqualität bleibt offen.

## [0.48.0] - 2026-10-23

Zeitstempel: 2026-10-23T20:23:34+02:00 (Europe/Berlin)

### Added

- Echtes Knochenlöschen mit Übernahme von Kindgelenken und Hautgewichten durch den Elternknochen, Posenumrechnung und einem Undo-/Redo-Schritt.
- Persistente Löschlisten in Projektdateien und Katalogexport sowie Berücksichtigung bei Move-Kompatibilität.
- Vier Tests für Hierarchie, Gewichte, Posen, Persistenz und Fehler-Rollback sowie ein weiterer Chromium-Fall.

### Fixed

- Skelettanzeige rekonstruiert Verbindungslinien nach Hierarchieänderungen.
- Automatische Erkennung stellt tatsächlich gelöschte Knochen nicht als Griffe wieder her.

### Changed

- README, Design, Roadmap, Studio-Anleitung und Prüfstand nachgezogen.
- Projekte mit Knochenlöschungen benötigen Software ab 0.48.0. Weitere Einfügungen nach Löschungen sind vorerst gesperrt; Wurzelknochen, eigene Knochenskalierung und Anbauteile werden geschützt.

**Prüfung:** 246 Tests und Build bestanden; neuer Browsernachweis steht aus. Manuelle Haut-/Bewegungsqualität bleibt offen.

## [0.47.0] - 2026-10-23

Zeitstempel: 2026-10-23T14:50:26+02:00 (Europe/Berlin)

### Added

- Echte Zwischengelenke zwischen vorhandenen Knochen mit automatischer geometrischer Hautgewichtsverteilung und verbundenen Teilstrecken.
- Fünf Geometrie-/Editor-/Persistenztests sowie ein Chromium-Fall für Einfügen, Undo/Redo und Projektdateiaustausch.

### Changed

- Projektdateien und Katalogexport speichern reproduzierbare Knochenunterteilungen; Move-Kompatibilität berücksichtigt die geänderte Hierarchie.
- Vorhandene Posen erhalten die neue Gelenkspur und einen Prüfhinweis. Undo/Redo stellt Hierarchie und Gewichte gemeinsam wieder her.
- README und Blaupause aktualisiert. Projekte mit Zwischengelenken benötigen Software ab 0.47.0.

### Fixed

- Projektlade-Vorprüfung berücksichtigt eingefügte Knochen zusätzlich zum unveränderten Quellskelett; im ersten Browserlauf erkannt und korrigiert.

**Prüfung:** 242 Tests, Build und alle elf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)). Gewichtsqualität erfordert manuelle Prüfung; vollständiges Auto-Rigging und beliebiges Knochenlöschen bleiben offen.

## [0.46.0] - 2026-10-23

Zeitstempel: 2026-10-23T08:34:20+02:00 (Europe/Berlin)

### Added

- Chromium-End-to-End-Prüfung für Move-Download und Dateiauswahl, Importkonflikte, wiederholte Posen, animierte Vorschau, Undo/Redo und abgewiesene Modellbindung.

### Changed

- README, Design, Roadmap und Prüfstand um die Move-Dateiaustauschprüfung ergänzt.

**Prüfung:** 237 Tests, Build und alle zehn Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594)). Ein im ersten Lauf verwendeter, im Studio ausgeblendeter Player-Pauseknopf wurde im Test durch die sichtbare Studio-Bedienfolge ersetzt. Keine funktionale Änderung am Importcode.

## [0.45.0] - 2026-10-23

Zeitstempel: 2026-10-23T06:51:03+02:00 (Europe/Berlin)

### Added

- Automatische Aktualisierung der lokalen Avatar-Listen zwischen Tabs nach bestätigten Speicher-/Löschvorgängen; Fokusaktualisierung als Ergänzung.
- Zwei DOM-Tests und zwei Browserfälle für Benachrichtigungen, F5-Persistenz und mehrere Tabs.

### Changed

- Laufende Vorgänge bündeln weitere Aktualisierungsanforderungen; geladener Avatar und Bearbeitungsstand bleiben erhalten.
- README, Design, Roadmap, Studio-Anleitung und Prüfstand aktualisiert.

**Prüfung:** 237 Tests, Build und alle neun Chromium-Browserfälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987)). Reale Browserquoten bleiben offen.


## [0.44.0] - 2026-10-22

Zeitstempel: 2026-10-22T19:52:21+02:00 (Europe/Berlin)

### Fixed

- Originalwechsel aktualisiert Avatarname, Beschreibung und Modelltyp sowie 3D-Move-/Wiedergabeanzeige.
- Animationen laufen bei niedriger Renderbildrate mit tatsächlich verstrichener Vordergrundzeit statt künstlicher Zeitlupe; Sichtbarkeitswechsel verhindern Nachholen von Hintergrundzeit.

### Added

- Zwei Tests für zeitgerechten Clip-Abschluss bei langsamen Frames und Zurücksetzen der Animationsuhr.

### Changed

- README, Design, Roadmap und Prüfberichte enthalten den ersten tatsächlichen GitHub-Browserbefund: zwei bestandene und fünf fehlgeschlagene Fälle, keine vollständige Abnahme.

**Prüfung:** 235 Tests, Build und alle sieben Chromium-E2E-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209)). Manuelle Maus-/UI-Abnahme und echte Anbieterinferenz bleiben offen.


## [0.43.0] - 2026-10-22

Zeitstempel: 2026-10-22T14:14:40+02:00 (Europe/Berlin)

### Added

- GitHub-Actions-Prüflauf für Node-Tests, Build und Chromium-End-to-End-Tests mit begrenzter Laufzeit und Browserberichten.
- Browser-Szenario für lokale KI-Sequenzvorschau, Wiederherstellung, Übernahme und Undo mit simuliertem Anbieter.

### Changed

- Playwright speichert Fehler-Traces/Screenshots und erstellt in CI einen HTML-Bericht; exklusive Tests sind dort gesperrt.
- README, Design, Roadmap und Prüfstand dokumentieren Einrichtung und tatsächliche Prüfgrenzen.

**Prüfung:** 233 Tests und Build bestanden; sieben Browserfälle aufgelistet. Lokaler Chromium-Start bleibt durch Socket-Berechtigungen blockiert; kein erfolgreicher Browserlauf behauptet.


## [0.42.0] - 2026-10-22

Zeitstempel: 2026-10-22T10:21:26+02:00 (Europe/Berlin)

### Added

- Lokale animierte Vorher-/Nachher-Vorschau für KI-Sequenzvorschläge am Studio-Modell, einschließlich vorhandener Tempo-/Pause-/Seek-Steuerung.
- Temporäre kopierte Sequenz mit Sitzungs-/Revisionsprüfung; Bearbeitungspose nach Ende, Stopp, Panelwechsel und vor Übernahme wiederherstellen.
- Fünf Tests für Sampling, Wiederherstellung, Konflikte, Lebenszyklus und Assistentenpanel.

### Changed

- README, Design, Roadmap, Studio-Anleitung und Prüfstand aktualisiert. Vorschauen ändern weder gespeicherte Moves noch Revision oder Undo-Verlauf.

**Prüfung:** 233 Tests und Build bestanden. Visuelle Browser- und echte Anbieterabnahme bleiben offen.


## [0.41.0] - 2026-10-22

Zeitstempel: 2026-10-22T08:31:15+02:00 (Europe/Berlin)

### Added

- Lokaler Vorher-/Nachher-Vergleich für einzelne und gebündelte Sequenzvorschläge mit Bewegungs-/Posennamen, IDs und einzelnen wiederholten Schritten.
- Revisionsprüfung für alle gelesenen Seiten und Abschlussstatus; ungültige/veraltete Vergleiche sperren die Übernahme.
- Fünf Tests für paginierte Vergleiche, Datenfehler, Textdarstellung und Assistentenpanel.

### Changed

- Assistent zeigt bei Sequenzänderungen lesbare DE/EN-Tabellen zusätzlich zum vollständigen JSON. README, Design, Roadmap, Studio-Anleitung und Prüfstand aktualisiert.

**Prüfung:** 228 Tests und Build bestanden. Animierte Vorschau und echte Browser-/Anbieterabnahme bleiben offen.


## [0.40.0] - 2026-10-22

Zeitstempel: 2026-10-22T07:57:14+02:00 (Europe/Berlin)

### Added

- `update_moves` für gemeinsame Änderungen an bis zu acht bestehenden Bewegungsfolgen, mit vollständiger Vorprüfung, einer Revision und einem Undo-/Redo-Schritt.
- Paketvorschläge im Assistenten und Pakettransport in Node-/Python-MCP; Freigabe und Revisionsprüfung gelten für alle Teiländerungen gemeinsam.
- Vier Tests für gemeinsame Übernahme, vollständige Ablehnung, Grenzen und Assistentenvorschläge; Node-MCP-Transporttest erweitert.

### Changed

- Einzel- und Paketänderung verwenden denselben Editorpfad. README, Design, Roadmap, Studio-/MCP-Anleitung und Prüfstand nachgezogen.

**Prüfung:** 223 Tests und Build bestanden. Python-DTO isoliert geprüft; Browser-/Anbieterabnahme und allgemeine Mehraktionstransaktionen bleiben offen.


## [0.39.0] - 2026-10-21

Zeitstempel: 2026-10-21T23:54:27+02:00 (Europe/Berlin)

### Added

- Automatisches Nachladen paginierter Anthropic-Modelllisten über native Cursor mit gemeinsamem Timeout und Abbruch.
- Schutz vor wiederholten/falschen Cursorn, mehr als zehn Seiten oder 5000 empfangenen Einträgen; nur vollständige Ergebnisse übernehmen.
- Fünf Protokolltests für Seitenfolgen, Fehler, Grenzen und verspätete Antworten.

### Changed

- README, Anbieteranleitung, Design, Roadmap und Prüfstand aktualisiert.

**Prüfung:** 219 Tests und Build bestanden. Echte Konto-/Browserabnahme und zusätzliche Workspace-Auswahl bleiben offen.


## [0.38.0] - 2026-10-21

Zeitstempel: 2026-10-21T23:49:26+02:00 (Europe/Berlin)

### Added

- `update_move` für bestehende Posenfolgen über MCP und Assistent, mit Freigabe, Revisionsprüfung und gemeinsamem Undo-/Redo-Pfad.
- Vollständige, isolierte Posenverweise in paginierten Move-Abfragen.
- Vier Tests für Sequenzbearbeitung, Ablehnungen, Seitengrößen und Assistentenvorschläge; Node-MCP-Transporttest erweitert.

### Changed

- Node-/Python-MCP-Schemata und Assistentenbeschreibung ergänzt; README, Design, Roadmap, Studio-/MCP-Anleitung und Prüfberichte nachgezogen.

**Prüfung:** 214 Tests und Build bestanden. Python-DTO isoliert geprüft; gerenderte Abnahme und externer Anbieter-/Host-Lauf bleiben offen.


## [0.37.0] - 2026-10-21

Zeitstempel: 2026-10-21T23:41:43+02:00 (Europe/Berlin)

### Added

- Bearbeitung bestehender Studio-Move-Folgen: einzelne Posenverweise verschieben, entfernen, einfügen oder ersetzen; wiederholte Posen bleiben einzeln auswählbar.
- Validierung von Ziel, Revision, Bearbeitungsmodus und 2–100 vorhandenen Posen; ein Undo-/Redo-Schritt je Änderung.
- Vier Tests für isolierte Sequenzänderungen, Export, DOM-Bedienung, Prüfposen und veraltete Bewegungsprüfungen.

### Changed

- README, Design, Roadmap, Studio-Anleitung und Prüfstand aktualisiert.

**Prüfung:** 210 Tests und Build bestanden. Zeitwerte bleiben an Projektposen gebunden; Agenten-Sequenzbearbeitung und gerenderte Abnahme sind offen.

## [0.36.0] - 2026-10-21

Zeitstempel: 2026-10-21T07:49:39+02:00 (Europe/Berlin)

### Added

- Direkter Sprung vom Bewegungsbericht zum exakten auffälligen Zeitpunkt als pausierte Vorschau.
- Wiederherstellung der vorherigen Bearbeitungspose bei Stopp; ausdrückliche Übernahme eines Prüfbilds als neue Pose mit Undo/Redo.
- Vier Tests für Vorschau, Wiederherstellung, Posenlimits, veraltete Aufrufe und DOM-Bedienablauf.

### Changed

- README, Design, Roadmap, Studio-Anleitung und Prüfstand nachgezogen.

**Prüfung:** 206 Tests und Build bestanden. Bestehende Moves werden nicht automatisch verändert; Korrekturen und gerenderte Abnahme bleiben offen.

## [0.35.0] - 2026-10-21

Zeitstempel: 2026-10-21T07:45:49+02:00 (Europe/Berlin)

### Added

- Beugegrenzenprüfung eigener Studio-Moves mit 16 Stichprobenschritten je Übergang, Schlüsselposen und Schleifenrückweg.
- Abbrechbarer Bericht mit Winkelbereichen, erstem auffälligem Zeitpunkt und nicht auswertbaren Ketten; Revisions-/Sitzungsschutz gegen veraltete Ergebnisse.
- Fünf Tests für Zwischenverletzungen, begrenzten Zeitplan, Abbruch, unverändertes Projekt und DOM-Bericht.

### Changed

- Wiederverwendete Punkt-/Verbindungsindizes innerhalb der lesenden Kettenmessung.
- README, Design, Roadmap, Studio-Anleitung und Prüfstand nachgezogen.

**Prüfung:** 202 Tests und Build bestanden. Stichproben liefern keinen lückenlosen Nachweis. Originalclips, Kollisionen, automatische Korrektur und gerenderte Bedienabnahme bleiben offen.

## [0.34.0] - 2026-10-21

Zeitstempel: 2026-10-21T06:47:21+02:00 (Europe/Berlin)

### Added

- Lesende Prüfung ausgewählter gespeicherter Posen gegen konfigurierte IK-Beugegrenzen.
- Bericht mit Gelenkname/ID, gemessenem Winkel, erlaubtem Bereich und getrennten Ergebnissen für Verletzungen, degenerierte Segmente und fehlende Ketten.
- Fünf Tests einschließlich tatsächlichem Mika-Modell, unverändertem Szenen-/Projektzustand und DOM-Bericht.

### Changed

- README, Design, Roadmap, Studio-Anleitung und Prüfstand aktualisiert.

**Prüfung:** 197 Tests und Build bestanden. Keine automatische Korrektur oder Änderung von Prüfmarkierungen; Zwischenbilder, Kollisionen und gerenderte Bedienabnahme bleiben offen.

## [0.33.0] - 2026-10-20

Zeitstempel: 2026-10-20T22:20:33+02:00 (Europe/Berlin)

### Added

- Einstellbare IK-Beugegrenzen am mittleren Knochen einer Zweiglied-Kette; Endpunktziehen hält begrenzte Reichweite und Knochenlängen ein.
- Mausregler im Rig-Modus, Undo/Redo, Projekt-/Exportpersistenz und MCP-/Assistentenfeld zum Setzen oder Entfernen von Grenzen.
- Posen-Prüfgrund bei Grenzänderungen; Grenzen werden in der Move-Strukturbindung berücksichtigt.
- Sieben Tests einschließlich tatsächlicher Mika-/Nori-Geometrie und Katalogprojekt-Export; Node-MCP-Transportprüfung erweitert.

### Changed

- README, Design, Roadmap, Studio-/MCP-/Move-Anleitungen und Prüfstand aktualisiert.

**Prüfung:** 192 Tests und Build bestanden. Python-Datenmodell separat geprüft, kein neuer Python-MCP-Livelauf. Grenzen gelten nur für Zweiglied-IK-Ziehen; direkte Drehungen, gespeicherte Moves, Anatomieerkennung und visuelle Abnahme bleiben offen. Neue Grenzwerte/Prüfgründe erfordern für vollständige Interpretation Software ab 0.33.0.

## [0.32.0] - 2026-10-20

Zeitstempel: 2026-10-20T15:51:31+02:00 (Europe/Berlin)

### Added

- `merge:moves` kombiniert zwei statische Move-Sammlungen in einem neuen Ordner, mit Konflikt-, Quellen- und Größenprüfung vor dem Schreiben.
- Bytegenaue Übernahme referenzierter Dateien und Bericht mit Größen/SHA-256-Prüfsummen; keine automatische Veröffentlichung.
- Eigenständige Move-Strukturprüfung für Posen, Transformationen, Fingerabdruckformat und Referenzen; tatsächliche Modell-/Rig-Kompatibilität bleibt eine Prüfung beim Import.
- Sieben Tests mit echten Dateien und CLI-Unterprozess, einschließlich Gesamtgrößenlimit und fortbestehender Modellbindung.

### Changed

- Studio-Dateiimport nutzt die gemeinsame Strukturprüfung zusätzlich zur Zielprojektprüfung.
- README, Design, Roadmap, Sammlungsanleitung und Prüfstand abgeglichen.

**Prüfung:** 185 Tests und Build bestanden. Browserpflege, gerenderte Abnahme, GLB-Clip-Export und Retargeting bleiben offen.

## [0.31.0] - 2026-10-20

Zeitstempel: 2026-10-20T14:03:31+02:00 (Europe/Berlin)

### Added

- Gemeinsame statische Move-Sammlung unter `moves/` mit Katalogauswahl und ausdrücklichem Import im Studio. Die mitgelieferte Sammlung ist leer.
- `export:moves` exportiert eigene Bewegungen eines Projekts als neues Katalogpaket; Quellen und vorhandene Ausgabeordner bleiben unverändert.
- Begrenzte Katalog-/Move-Abrufe, ID-Prüfung, Zeitlimit und Abbruch beim Verlassen des Editors; bestehende Kompatibilitätsprüfung und Undo/Redo bleiben erhalten.
- Sieben Tests für Katalog, Transportgrenzen, tatsächlichen CLI-Export, Editorimport und veraltete Downloads.

### Changed

- README, Design, Roadmap, Studio-/Move-Anleitungen und Prüfstand nachgezogen; neue Sammlungselemente auf Deutsch und Englisch.

**Prüfung:** 178 Tests und Build bestanden. Gerenderte Bedienabnahme, Browserpflege der gemeinsamen Sammlung, GLB-Clip-Export und Retargeting bleiben offen.

## [0.30.0] - 2026-10-19

Zeitstempel: 2026-10-19T21:58:46+02:00 (Europe/Berlin)

### Added

- `merge:zoo` führt zwei statische Model-Zoo-Kataloge in einem neuen Ausgabeordner zusammen. Quelldateien bleiben unverändert; vorhandene Ausgaben werden nicht überschrieben.
- Vorprüfung von IDs, normalisierten Pfaden, Projektzuordnung, Quelldateien, Größen und externen Modellressourcen; Bericht mit Dateigrößen und SHA-256-Prüfsummen.
- Sechs Tests mit echten Dateien und CLI-Unterprozess für Zusammenführung, Konflikte, ungültige Quellen und Überschreibschutz.

### Changed

- README, Design, Roadmap, Export-/Merge-Anleitung und Prüfstand auf den implementierten Ablauf abgeglichen.

**Prüfung:** 171 Tests und Build bestanden. Die Ausgabe enthält nur referenzierte Modelle/Projekte. Visuelle Abnahme und Veröffentlichung bleiben separate, offene Schritte.

## [0.29.0] - 2026-10-19

Zeitstempel: 2026-10-19T16:46:59+02:00 (Europe/Berlin)

### Added

- `export:zoo` erstellt aus einer Projektdatei einen neuen statischen Model-Zoo-Ordner mit Projekt, Katalogeintrag und Übernahmehinweisen. Reservierte IDs und bestehende Ausgabeordner werden abgewiesen; nur bekannte Projektfelder werden übernommen.
- Katalogeinträge können vollständige Studio-Projekte statt GLB/glTF referenzieren. Eigene Punkte, Posen und Moves bleiben erhalten; Projekt- und Katalog-ID müssen übereinstimmen.
- Begrenztes Streaming für Katalogprojekte, sichere relative Quellen und Abbruchprüfung vor der Modellübernahme.
- Sechs Tests für Paket-/GLB-Roundtrip, Pfad-/ID-Prüfungen, ungültige Antworten, tatsächliche Streamgrenzen, Überschreibschutz und realen CLI-Aufruf.

### Changed

- Katalogkarten unterscheiden veröffentlichte Katalogavatare von gespeicherten lokalen Kopien; mitgelieferte Testfiguren bleiben erhalten.
- README, Design, Roadmap, Exportanleitung und Prüfstand aktualisiert.

**Prüfung:** 165 Tests und Build bestanden; Export-/Ladetests zusätzlich gezielt geprüft. Neue Projektquellen benötigen Player ab 0.29.0. Kein automatischer Katalog-Merge oder Deployment; visuelle Abnahme und Modellqualität bleiben offen.

## [0.28.0] - 2026-10-19

Zeitstempel: 2026-10-19T16:09:32+02:00 (Europe/Berlin)

### Added

- Lokal gespeicherte Avatare in gemeinsamer Auswahl, Karten, Zähler und `list_avatars`; dieselbe Katalogfunktion versorgt Player und RPC-Abfrage.
- Validierung gespeicherter Metadaten vor Aufnahme in den Katalog. Liste und Ladeidentität werden nach Speicheroperationen aktualisiert; konkurrierende Auswahl ist währenddessen gesperrt.
- Fünf Tests für gemeinsame IDs, Metadatenumfang, gelöschte aktive Kopien, validierte Listensnapshots und Auswahl über gespeicherte IDs.

### Fixed

- Geladene gespeicherte Avatare behalten ihre eigene ID statt `local-import`; diese Identität wird auch für Fähigkeiten, Befehlsadressierung und Modellwechsel-Verlauf verwendet.
- Gelöschte, bereits geladene Kopien bleiben als Sitzungsavatar sichtbar und nutzbar, ohne fälschlich als gespeichert ausgewiesen zu werden.

### Changed

- README, Design, Roadmap, lokale Sammlung, Agentensteuerung und Prüfstand abgeglichen.

**Prüfung:** 159 Tests und Build bestanden. Browser-/MCP-Liveabnahme bleibt offen; keine automatische Avatarwahl durch KI, keine Tab-Synchronisierung und keine Veröffentlichung der Sammlung.

## [0.27.0] - 2026-10-18

Zeitstempel: 2026-10-18T13:47:58+02:00 (Europe/Berlin)

### Added

- Export und Import einzelner eigener Studio-Moves als `.pakachi-move.json`, einschließlich benötigter Posen, Gesamtspuren, Schleife und Prüfhinweisen.
- Konservative Kompatibilitätsprüfung über SHA-256 von Modell und Gelenkstruktur. Neue Posen-IDs und freie Schlagworte verhindern Überschreiben vorhandener Daten.
- Import als einzelner Undo-/Redo-Schritt mit Revisionsprüfung nach asynchronem Dateilesen und Hashen; keine automatische Wiedergabe.
- Sieben Tests zu Format, Kompatibilität, Konflikten, Wiederholungsposen, Grenzen, Undo/Redo und veralteten Importen.

### Changed

- Studio-Bedienelemente für Move-Dateien auf Deutsch/Englisch; README, Design, Roadmap, Studio-Anleitung und Prüfstand nachgezogen.

**Prüfung:** 154 Tests und Build bestanden. Kein Retargeting oder Export eingebetteter GLB-Clips. Browser-Dateidialog, Download und gerenderte Vorschau bleiben unabgenommen.

## [0.26.0] - 2026-10-18

Zeitstempel: 2026-10-18T12:38:23+02:00 (Europe/Berlin)

### Added

- Lokaler Model Zoo für benannte 3D-Projektkopien mit Modell, Punkten, Posen, Moves und Entwurfspose. IndexedDB-Ablage mit gemeinsamen Transaktionen für Metadaten und Projekt; maximal 50 Einträge und 80 MiB pro Projekt.
- Eigene Auswahl mit Speichern, Laden, Aktualisieren und bestätigtem Löschen. Revisionsgeschütztes Laden nutzt die bestehende Modellübernahme; gleiche Namen überschreiben keine Kopie.
- Sieben Tests für isolierte Projektkopien, ungültige Eingaben, fehlenden Speicher, DOM-Bedienung, Speicherfehler, veraltete Ladevorgänge, Löschbestätigung und Transaktionsabschluss/-abbruch.

### Changed

- Blaupause unter `docs/Design.md`, `docs/ROADMAP.md` und `docs/CHANGELOG.md` zusammengeführt; bisheriger Designpfad verweist auf das aktuelle Dokument.
- Design und Roadmap auf den tatsächlichen Stand von Mehranbieter-Routen, Schlüsseltresor, Assistent, lokaler Generierung, Vorschau und Modellübernahme abgeglichen. README-Verweise aktualisiert.

### Fixed

- Widersprüchliche Offen-Markierungen bereits implementierter Funktionen und veraltete Aussagen zu Schlüsselverlust, fehlender Generatoroberfläche und Fallback-Verhalten korrigiert. Ausstehende Browser-/GPU-Abnahme, Cloud-Fachadapter und Rigging bleiben ausdrücklich offen.

**Prüfung:** 147 Tests und Build bestanden. DOM- und Speicher-Testdoubles ersetzen keine echte IndexedDB-/F5-/Kontingentabnahme. Gerenderte Browser- und GPU-Abnahme bleiben offen. Sammlung bleibt browsergebunden; keine gemeinsame Veröffentlichung oder Cloud-Synchronisierung.

## [0.25.0] - 2026-10-18

Zeitstempel: 2026-10-18T04:55:02+02:00 (Europe/Berlin)

### Added

- Generator-Fallbacks während der Fähigkeitsprüfung mit zehn Sekunden Zeitlimit je Profil und Schutz vor verspäteten Antworten.
- „Nächsten Anbieter versuchen“ nach fehlgeschlagener gestarteter Generierung: ausdrücklicher neuer Auftrag mit verbleibender Route und passenden Schlüsseln je Profil.
- Fünf zusätzliche Tests für Fallback-Grenzen, Zeitlimit, Abbruch, Revisionsschutz, getrennte Schlüssel und bewusste Wiederholung.

### Changed

- Vollständige Generatorroute vor dem Start sichtbar; ausgewählter Anbieter im Auftragsstatus. Projektänderungen sperren Wiederholungen, Tresorsperre und Konfigurationswechsel verwerfen sie.
- README, Design, Roadmap, Anbieter-/Generierungsanleitung und Auftragsvertrag nachgezogen.

**Prüfung:** 140 Tests und Build bestanden. Keine neue Browser- oder GPU-Abnahme; ausführbarer Generator bleibt lokales TripoSR. Keine automatische zweite Generierung nach Ausführungsbeginn.

## [0.24.0] - 2026-10-18

Zeitstempel: 2026-10-18T00:55:06+02:00 (Europe/Berlin)

### Added

- Separate Vorbereitung von 3D-Viewer, Editor und Playback vor der Übernahme. Bestehende Instanzen bleiben bis zur erfolgreichen Veröffentlichung erhalten.
- Rückabwicklung synchroner Übergabefehler mit Wiederherstellung bisheriger DOM-Knoten, Editorsitzung, Viewer und StateMachine-Bindung. Fehlgeschlagene Kandidaten werden freigegeben; der Modellwechsel-Verlauf bleibt unverändert.
- Fünf Tests für DOM-/Binding-Rollback, Vorbereitungsfehler, Cleanup-Reihenfolge, isolierte Kandidaten und normalisierte Rig-Koordinaten. Browser-Test für fehlgeschlagene Veröffentlichung vorbereitet.

### Fixed

- Rig-Aufbau wieder nach der Viewer-Normalisierung, damit Oberflächenpunkte und sichtbare Geometrie dieselben Weltkoordinaten verwenden. Projektstände aus 0.22.0/0.23.0 benötigen bei freien Punkten/Posen eine visuelle Kontrolle; keine automatische Koordinatenmigration.
- Fehler beim Aufräumen des bisherigen Avatars machen eine bereits erfolgreiche Übernahme nicht rückgängig; Cleanup versucht die übrigen Ressourcen weiterhin freizugeben.

### Changed

- README, Design, Roadmap, Studio-/Generierungsanleitung, Auftragsvertrag und Prüfstand aktualisiert.

**Prüfung:** 135 Tests und Build bestanden. Chromium installiert; beide vorbereiteten Browserabläufe scheitern vor dem Anwendungsstart am hier verbotenen Socket-Systemaufruf. Keine gerenderte Browser-, GPU-Inferenz- oder Rigging-Abnahme. Schutz umfasst die 3D-Ladestrecke; Originalplayer-Neustart, Prozessabsturz und GPU-Kontextverlust sind nicht abgedeckt.

## [0.23.0] - 2026-10-17

Zeitstempel: 2026-10-17T17:12:59+02:00 (Europe/Berlin)

### Added

- „Modellwechsel zurück“ und „Modellwechsel wiederholen“ für den letzten Avatar-/Projektwechsel, einschließlich übernommener Generierungsentwürfe und Rückkehr zum Original-Bildplayer.
- Begrenzter Sitzungsverlauf mit vollständigen Projektinhalten, Entwurfspose, Avataridentität und Ungespeichert-Markierung. Änderungen nach einem Wechsel bleiben beim Zurück-/Wiederholen erhalten; fehlgeschlagene Wiederherstellung verbraucht den Verlauf nicht.
- Sechs neue Tests für Verlauf, Race-/Fehlerfälle, Speichergrenze, Projektaufnahme/-rekonstruktion und Geometrieabweisung vor Viewer-Freigabe. Vorbereiteter Browserablauf um Zurück/Wiederholen erweitert.

### Changed

- Isolierte Studio-Projektaufnahme ohne Download oder Dirty-Reset; Wiederherstellung lädt eine neue Editorsitzung und bewahrt die Avataridentität.
- Modellgrenzen werden vor dem Freigeben der bestehenden Viewer-Figur geprüft. Neue Wechsel werden erst nach erfolgreicher Installation in den Verlauf eingetragen.
- README, Blaupause, Studio-/Generierungsanleitung, Architektur und Prüfstand aktualisiert.

**Grenzen:** 130 Tests und Build bestanden. Genau ein Rücksprungpunkt im Arbeitsspeicher, keine Wiederherstellung nach F5; Snapshotgrenze geschätzt 160 MiB. Keine alte Einzelgesten-Historie, Kamera, Agentenfreigabe oder Originalplayer-Abspielposition. Vollständig atomarer Fehler-Rollback, Browserabnahme, echte GPU-Inferenz und Rigging bleiben offen.

## [0.22.0] - 2026-10-17

Zeitstempel: 2026-10-17T12:25:46+02:00 (Europe/Berlin)

### Added

- Integrierter Studio-Abschnitt für PNG/JPEG-Auswahl und Drag & Drop, ausdrücklichen lokalen TripoSR-Aufruf, Phasenstatus, Abbruch und getrennte dreh-/zoombare Ergebnisvorschau.
- Echte GLB-/Geometrieprüfung vor der Vorschau; Verwerfen oder ausdrücklich als neuen Avatar importieren. Zielrevision und laufende Bediengesten schützen zwischenzeitliche Änderungen; Tresorsperre invalidiert auch vorbereitete Importe.
- Anbietervorlage „TripoSR (lokal)“ mit vorausgefüllter Adresse und Modell-ID bei leerer Auswahl. Bestehende Profile und Schlüssel bleiben erhalten.
- Sechs DOM-/Geometrie-Integrationstests und ein vorbereiteter Playwright-Ablauftest für die neue Oberfläche.

### Changed

- GLB-Import meldet Erfolg/Ablehnung und prüft einen optionalen Übernahmeschutz vor und nach asynchronem Laden. Rig und Projektquelle werden vor dem Austausch vorbereitet.
- README, Blaupause, Auftragsvertrag, Anbieteranleitung, Generierungsanleitung und Prüfstand aktualisiert.

**Grenzen:** 124 Tests und Build bestanden. Playwright konnte wegen fehlender Chromium-Programmdatei nicht starten. Keine echte GPU-Inferenz-/Qualitätsabnahme, kein automatisches Rigging, kein Generator-Fallback und noch kein projektübergreifendes Undo für den Modellimport.

## [0.21.0] - 2026-10-17

Zeitstempel: 2026-10-17T12:07:48+02:00 (Europe/Berlin)

### Added

- Ausdrücklich startbarer lokaler TripoSR-HTTP-Dienst (`npm run serve:generator`) mit Token, exaktem Origin-/Hostabgleich, begrenzten PNG-/JPEG-Uploads, einem aktiven Auftrag und unveränderten lokalen Ergebnisberichten.
- Separat registrierbarer `custom-generation`-Adapter für den Auftragskern: Fähigkeiten-/Modellprüfung, begrenzte GLB-Antwort, Abbruchsignal und weiterhin verpflichtende Ergebnisvalidierung. Kein automatischer Projektwechsel.
- Fünf Integrationstests für echten HTTP-Transport bis zur GLB-Prüfung, Zugriffsschutz, Fehlerantworten, parallele Aufträge, Verbindungsabbruch, Antwortgrenzen und Subprozessabbruch. Inferenzbackend im Test synthetisch.

### Changed

- Lokaler Generatorprozess und Python-Vorprüfung nehmen Abbruchsignale entgegen; Zeitlimit/Abbruch signalisiert Prozessende mit erzwungener Beendigung als Rückfall.
- README, Design, Roadmap, Auftragsvertrag, Einrichtung und Prüfstand auf den Transport-Meilenstein abgeglichen.

**Grenzen:** Noch keine Generierungsoberfläche, echte GPU-Inferenz, Qualitätsabnahme oder Rigging. TripoSR ist bildgeführt; Prompts steuern dieses Verfahren nicht. Keine Garantie für vollständigen Prozessbaum-Stopp. 118 Tests und Produktionsbuild bestanden.

## [0.20.0] - 2026-10-17

Zeitstempel: 2026-10-17T03:02:46+02:00 (Europe/Berlin)

### Added

- Schlüsselsitzung ausdrücklich sperren: Sitzungsschlüssel, Schlüsselentwürfe und Passwortfelder leeren; Modelllistenabfragen und Assistenten lokal abbrechen, offene/verspätete Vorschläge verwerfen und laufende Tresoroperationen invalidieren. Profile, Modellwahl, Fallbacks und verschlüsselte Ablage erhalten.
- Drei Integrationstests für Sperre, Anfrageabbruch, späte Vorschläge und erneutes Entsperren.
- Passwortwechsel für den Schlüsseltresor: bisheriges Passwort prüfen, neues Passwort bestätigen und den vollständig gespeicherten Schlüsselbestand neu verschlüsseln. Fehlgeschlagene oder veraltete Operationen ersetzen die bestehende Ablage nicht. Ungespeicherte Sitzungsänderungen werden nicht nebenbei übernommen.
- Zwei Tests für Passwortwechsel, Erhalt aller gespeicherten Schlüssel, Abweisung des bisherigen Passworts, Fehler-/Konfliktschutz und Passwortfelder in der Oberfläche.

## [0.19.0] - 2026-10-16

Zeitstempel: 2026-10-16T22:53:19+02:00 (Europe/Berlin)

### Added

- Optionaler lokaler Schlüsseltresor mit ausdrücklichem verschlüsseltem Speichern und Entsperren nach Seitenneustart. Profilbezogene Sitzungsschlüssel bleiben parallel nutzbar.
- Web-Crypto-Verschlüsselung mit AES-256-GCM und PBKDF2-SHA-256 (600.000 Iterationen); Passwort wird nicht gespeichert. Bestehender Tresor muss vor Aktualisierung erfolgreich entschlüsselt werden.
- Erhalt unbekannter gespeicherter Schlüssel, Berücksichtigung ausdrücklicher Löschungen und Entfernen nicht mehr konfigurierter Profil-/Endpunktbindungen beim Speichern.
- Sechs Tests mit echter Web Crypto für Roundtrip, Zufallswerte, Manipulation, falsche Passwörter, Speicherfehler, veraltete Operationen und Entsperren in der Profiloberfläche.

### Changed

- README, Blaupause, Roadmap, Anbieter-/Assistentenanleitung und Prüfstand auf die optionale dauerhafte Ablage aktualisiert.

**Grenzen:** Kein Passwortreset/-wechsel, keine Sitzungssperre und keine unabhängige Sicherheits-/visuelle Browserabnahme. Entschlüsselte Schlüssel bleiben während der Seitensitzung im Arbeitsspeicher. Fachgenerierung und OAuth bleiben offen.

## [0.18.0] - 2026-10-16

Zeitstempel: 2026-10-16T21:26:33+02:00 (Europe/Berlin)

### Added

- Unabhängiges Hauptprofil und geordnete Fallback-Profile für Assistent, Generator und Rigging; Reihenfolge im Optionsmenü bearbeiten und dauerhaft als Konfiguration speichern.
- Assistenten-Fallback-Ausführung ausschließlich entlang der vorab angezeigten Route, mit passendem Sitzungsschlüssel und eingefrorener Auswahl pro Versuch. Bei Abbruch oder Studio-/Werkzeugkonflikt kein weiterer Versuch.
- Fünf Tests für Routen, alte Konfigurationen, Schlüsseltrennung, Fehler-/Abbruchverhalten und Profilwechsel.

### Fixed

- Anbieter-/Profilwechsel und Dialogschluss löschen nicht mehr Schlüssel und Modellauswahl. Mehrere Profile und deren bearbeitete Modell-/Schlüsselentwürfe bleiben gleichzeitig erhalten.

### Changed

- Schlüssel liegen pro Profil und Zieladresse im Sitzungsspeicher statt nur im geöffneten Dialog. Neuladen löscht weiterhin Sitzungsschlüssel; geschützte dauerhafte Ablage bleibt offen.
- README, Design, Roadmap, Anbieter-/Assistentenanleitung und Prüfstand an die Mehranbieter-Konfiguration angepasst.

**Grenzen:** Generator-/Rigging-Routen sind konfigurierbar, aber noch nicht ausführbar. Keine echte Konto-/Modellabnahme. Keine Schlüssel im Browserspeicher oder Projekt.

## [0.17.1] - 2026-10-16

Zeitstempel: 2026-10-16T19:56:25+02:00 (Europe/Berlin)

### Added

- Sechs Anbietervorlagen setzen Schnittstelle und editierbare Adresse ohne automatische Verbindung. OpenAI, OpenRouter und DeepInfra nutzen den vorhandenen OpenAI-kompatiblen Adapter.

### Changed

- Anbieterauswahl füllt die editierbare Standardadresse für Anthropic, Ollama und LM Studio aus. Eigene Adressentwürfe bleiben beim Wechsel der Schnittstelle erhalten; gespeicherte Profile behalten ihre Adresse. „Standardadresse einsetzen“ setzt sie ausdrücklich zurück. Ein Schnittstellenwechsel leert die bisherige Modell-ID und verwirft Schlüssel/Modellliste.

## [0.17.0] - 2026-10-16

Zeitstempel: 2026-10-16T15:45:53+02:00 (Europe/Berlin)

### Added

- Native Anthropic-Schnittstelle für frei zuordenbare Anbieterprofile, Modelllisten mit API-Schlüssel und Assistentenaufrufe über Messages.
- Übersetzung von Werkzeugdefinitionen und `tool_use`-/`tool_result`-Blöcken in den bestehenden begrenzten Assistentenablauf. Thinking-Blöcke für Folgerunden erhalten, aber nicht als Antwort anzeigen.
- Fünf Tests für Profile, Header, Modelllisten, native Werkzeugfolgen, Fehlerkennzeichnung und ungültige/abgeschnittene Antworten.

### Changed

- README, Anbieter-/Assistentenanleitung, Design, Roadmap und Prüfstand auf 0.17.0 aktualisiert.

**Grenzen:** 97 Tests und Produktionsbuild bestanden; keine echte Anthropic-Konto-/Browserabnahme. Noch kein OAuth, Workspace-Auswahl oder automatische Modelllisten-Pagination. Generator-/Rigging-Ausführung weiterhin offen. Keine API-Schlüssel gespeichert.

## [0.16.0] - 2026-10-16

Zeitstempel: 2026-10-16T02:20:27+02:00 (Europe/Berlin)

### Added

- Integrierter aufklappbarer KI-Assistent mit ausdrücklich gestarteten Aufgaben an das zugeordnete Ollama-, LM-Studio- oder OpenAI-kompatible Profil.
- Begrenzte Werkzeugschleife für Zustand und Studio-Metadaten; sichtbarer einzelner Änderungsvorschlag statt sofortiger Mutation. Übernehmen verwendet den bestehenden RPC-/Editorweg mit Studio-Freigabe, Sitzung/Revision und Undo.
- Anzeige von Zieladresse, Modell und Datenumfang; Sitzungsschlüssel ohne Speicherung, Abbruch, Antwortgrenzen und Verwerfen verspäteter Antworten.
- Acht Tests für Transportformate, Werkzeuggrenzen, ungültige Befehle, Revisionskonflikte, Zeitlimit, Schlüsselbehandlung und explizite Übernahme.

### Changed

- Profilwechsel benachrichtigen den Assistenten und verwerfen laufende Antworten, Vorschläge sowie Schlüssel.
- README, Blaupause, Roadmap, Anbieteranleitung und Prüfstand aktualisiert; Assistentenanleitung ergänzt.

**Grenzen:** 92 Tests und Produktionsbuild bestanden. Protokoll- und DOM-Tests verwenden Testdoubles; keine reale Modell-/Cloud-Abnahme. Noch keine Bilder, automatischen 3D-/Rigging-Aufträge, native Anthropic-API oder OAuth. Jede Aufgabe startet ohne Chatverlauf und kann höchstens einen bestätigten Studio-Befehl erzeugen.

## [0.15.0] - 2026-10-16

Zeitstempel: 2026-10-16T02:05:26+02:00 (Europe/Berlin)

### Added

- Modelllisten-Abfrage für Ollama, LM Studio und OpenAI-kompatible Endpunkte mit optionalem Bearer-Schlüssel nur für den offenen Dialog; Abbruch, Zeitlimit, Antwortgrenzen und Schutz vor verspäteten Antworten.
- Optionaler Ollama-Einrichtungshelfer samt Windows-Startdatei: echte Hardwaremessung, konservative Speicherbudgets, vier exakte kuratierte Tags, eigene Tags und Rückfrage vor Download und Ladetest.
- Prüfung von Modellidentität, 4096 Kontext, CPU-/GPU-Belegung und zwei einfachen Werkzeugaufrufen nach Download; eigener Modellalias und lokaler Ergebnisbericht.
- 16 zusätzliche Tests für Modellabfrage, Schlüsselbehandlung, Hardwaregrenzen und unabhängige lokale/Cloud-Profile für alle Rollen.

### Changed

- README, Design, Roadmap, Anbieteranleitung und Prüfstand auf 0.15.0 aktualisiert; aufgabenbezogene Modellauswahl ergänzt.
- Freie Anbieterwahl ausdrücklich für Assistent, 3D-Generator UND Rigging: lokal oder Cloud je Rolle, einschließlich späterer Fachwerkzeugketten. Ollama-Kuration ist optional und schränkt keine Rolle ein.

**Grenzen:** 84 Tests und Produktionsbuild bestanden. Echte Hardware-/Modellabnahme, komplexe Aufgabenqualität, Studio-Inferenzadapter, native Cloud-Anmeldung und OAuth bleiben offen. Automatische GPU-Vorauswahl derzeit nur für eine messbare NVIDIA-GPU; CPU ausdrücklich wählbar. Keine Modellgewichte im Rahmen dieser Entwicklung heruntergeladen.

## [0.14.0] - 2026-10-15

Zeitstempel: 2026-10-15T18:42:19+02:00 (Europe/Berlin)

### Added

- Eigenständig entwickelter interner Auftragskern mit pro Auftrag festgehaltenem Anbieterprofil, Modell, Eingabe und Studio-Sitzung/Revision.
- Optionaler Adapter-Ausführungsvertrag mit Fortschritt, Abbruchsignal und Ergebnis. Zeitlimit und lokaler Abbruch wirken auch bei nicht reagierenden Testadaptern; späte Antworten werden verworfen.
- Verpflichtender Formatprüfungs-Hook, isolierte Ergebnisvorschau als Datenzustand, ausdrückliche Übernahme/Verwerfung und Sitzungs-/Revisionsabgleich vor der Host-Transaktion.
- Zehn Lebenszyklus- und Konflikttests sowie technische Anleitung zum Auftragskern.

### Changed

- README, Design, Roadmap und Prüfstand unterscheiden den implementierten Kern von noch fehlenden Netzwerkadaptern, sichtbarer Vorschau, produktiver Ergebnisprüfung und Studio-Übernahme mit Undo.

**Grenzen:** Mit simulierten Adaptern geprüft. Noch keine echte KI-Verbindung oder neue Generierungsoberfläche; fernseitiger Abbruch ist nicht bestätigt. Keine automatische Wiederholung und kein Anbieterwechsel.

## [0.13.0] - 2026-10-15

Zeitstempel: 2026-10-15T15:56:12+02:00 (Europe/Berlin)

### Added

- Anbieterprofile im Optionsmenü: Schnittstelle, Serveradresse und manuelle Modell-ID lokal speichern, bearbeiten, entfernen und unabhängig Assistent, 3D-Generator und Rigging zuordnen; Deutsch/English unterstützt.
- Validiertes Profilformat und interne Adapter-Registry mit Modell-/Fähigkeitsprüfung, ausdrücklichem Fehler bei fehlender Unterstützung und ohne automatischen Anbieterwechsel.
- Fünf Tests für Speicherung, ungültige Daten, Fähigkeitsprüfung, Rollenzuordnung, Bearbeitung, Sprachwechsel und Speicherfehler; Anleitung zur Anbieter-Konfiguration.

### Changed

- README, Blaupause und Prüfstand auf die Konfigurationsgrundlage aktualisiert; echte Dienstanbindung, Anmeldung und Generierungsaufträge bleiben ausdrücklich offen.
- Versionsanzeige im Player auf 0.13.0 angeglichen.

- Blaupause um das beschlossene Studio-Harness-Design erweitert: unabhängige Anbieter- und Modellwahl für Assistent, 3D-Generator und Rigging, mehrere Verbindungsprofile, lokale und externe Adapter sowie API-/anbieterspezifische OAuth-Anmeldung.
- Aufgaben von Sprachmodell, Geometriegenerator und Rigging einschließlich Hautgewichten erläutert; Vorschau, Übernahme, Revisionsschutz und gemeinsame MCP-Werkzeuge als Zielablauf festgehalten.
- Roadmap um aufeinander aufbauende Arbeitspakete und Abnahmekriterien für Konfiguration, Fähigkeiten, Aufträge, echte Inferenz und Ergebnisübernahme ergänzt; Blaupausenübersicht entsprechend aktualisiert.

Dokumentationszeitstempel: 2026-10-14T20:58:12+02:00 (Europe/Berlin). Diese vorbereitende Designpflege bezog sich auf Softwarestand 0.12.0; der oben beschriebene Konfigurationsumfang folgt in 0.13.0.

**Hinweise:** Profile sind noch keine aktiven Verbindungen. Es werden keine Anbieter angesprochen und keine API-Schlüssel gespeichert. Automatische Modellabfrage und API-/OAuth-Anmeldung folgen mit den Netzwerkadaptern.

## [0.12.0] - 2026-10-14

Zeitstempel: 2026-10-14T15:20:31+02:00 (Europe/Berlin)

### Added

- Experimenteller lokaler TripoSR-Testadapter mit Python-/CUDA-Vorprüfung, isolierten Laufordnern, Zeitlimit, Protokoll und GLB-Prüfung über den produktiven Modelllader.
- Ergebnisberichte mit Eingabe-/Backend-/Modellhash, Laufzeit und ausdrücklich offener visueller/Rig-/Transformationsfreigabe.
- Vier Tests mit synthetischer Geometrie und simuliertem Backend; Anleitung für getrennte Tier-/Humanoid-Versuche und technische Vorauswahl anhand offizieller Quellen.

### Changed

- README, Blaupause und Roadmap unterscheiden die vorbereitete Teststrecke ausdrücklich von echter Inferenz, anatomischem Rigging und einem fertigen Original-PaKaChi-3D-Modell.

**Hinweise zu dieser Version:** Entwicklerwerkzeug, noch keine Studio-Generierungsoberfläche. Hier fehlen KI-Laufzeit und CUDA; reale Generierung und Qualitätsbewertung bleiben offen. Keine Originalvorlage wurde verändert und kein Avatar ersetzt.

## [0.11.1] - 2026-10-14

Zeitstempel: 2026-10-14T15:08:29+02:00 (Europe/Berlin)

### Fixed

- Mitteltasten-Drehung verwendet die aktuelle Mitte der gesamten Modellgeometrie statt des durch Zoom/Pan verschobenen Kamera-Ziels.
- Drehpunkt bleibt während einer Geste fest; Kameraorientierung und Bildausschnitt bleiben beim Synchronisieren mit Arcball erhalten.
- Reset, feste Ansichten und Rollen verwenden den Figurenmittelpunkt.

### Added

- Zwei Regressionstests für versetzten Zoom-/Pan-Fokus, konstante Abstände und die tatsächliche Arcball-/Mausintegration.

### Changed

- README, Blaupause, Bedienhinweise und Prüfstand auf die Navigationskorrektur abgeglichen.

## [0.11.0] - 2026-10-14

Zeitstempel: 2026-10-14T08:12:44+02:00 (Europe/Berlin)

### Fixed

- Ziehen im Pose-Modus verschiebt Knochen nicht mehr unabhängig aus dem Körper: verbundene Ein-/Zweiglied-Ketten drehen sich mit erhaltenen lokalen Abständen.
- Direkte Mauszüge im Drehmodus verändern jetzt die Ausrichtung; laufende Achsgriff-Gesten werden nicht durch Proxy-Aktualisierung zurückgesetzt.

### Added

- Automatische Linien für das gesamte vorhandene Skelett beim neuen Laden, einschließlich Rumpf, Gliedmaßen und Kopf.
- Reichweitenbegrenzung, stabile Auflösung gerader Ketten und Rumpfverschiebung mit dem gesamten Körper.
- Hand-, Knie-, Fuß- und Halsknochen samt Hautzuordnung in beiden technischen Beispielmodellen (Rig 2).
- Vier Regressionstests für zusammenhängendes Posieren, Ganzkörperverbindungen, direkte Mausbedienung und Posenpersistenz.

### Changed

- Neue Knochenverbindungen müssen zur Quellhierarchie passen; die Oberfläche unterscheidet Gelenkketten und freie Punktgruppen.
- MCP-Positionsbefehle im Pose-Modus verwenden dieselbe Kettensteuerung; Punkteabfragen enthalten `ikChain`.
- README, Blaupause, Roadmap und Anleitungen korrigieren die zuvor unzureichende Bewegungssemantik.

**Hinweise zu dieser Version:** Alte Projekte behalten ihr Modell und bestehende Posen; bereits gestreckte Posen aus der Grundpose korrigieren. Automatik liest Quellknochen, erzeugt noch keine Anatomie aus ungeriggten Oberflächen. Winkelgrenzen, Kollisionen, Ganzkörper-IK und visuelle Nachprüfung bleiben offen.

## [0.10.0] - 2026-10-14

Zeitstempel: 2026-10-14T07:05:35+02:00 (Europe/Berlin)

### Added

- Proportionale Gesamtgröße als gespeicherte Bewegungsspur von 10 % bis 500 %, einschließlich linearer Interpolation und Schleifen.
- Live-Mausregler mit Prozentanzeige und einem Undo-Schritt pro Reglerbewegung.
- `figure.scale` in Studio-Abfragen und Größenänderung per `edit_studio` in Python und Node.
- Drei Tests für Geometrie/Hautbindung, Altdateien, Interpolation, Regler und Agentenschutz; reale Python-Integration um Skalierung erweitert.

### Changed

- README, Designdokument, Roadmap, Bedien-/API-Anleitungen und Prüfstand auf 0.10.0 abgeglichen.

**Hinweise zu dieser Version:** Ältere Projekte verwenden ohne Größenfaktor 100 %. Größenbewegungen benötigen mindestens 0.10.0; ältere Software ignoriert diese Spur. Skalierung ist proportional, keine Optimierung der Modellqualität. Visuelle Abnahme bleibt offen.

## [0.9.0] - 2026-10-14

Zeitstempel: 2026-10-14T00:14:37+02:00 (Europe/Berlin)

### Added

- Zwei weitere MCP-Tools für Python und Node: `get_studio` und `edit_studio` mit Punkten, Verbindungen, Posen, Moves und Undo/Redo.
- Zusätzliche Studio-Freigabe pro Editorsitzung, automatische Rücknahme beim Verlassen, Prüfung von Sitzung/Revision und Schutz laufender Ziehgesten/Vorschauen.
- Begrenzte, paginierte Studio-Abfragen ohne Modellbytes; strikte Feld-/Wertprüfung vor Änderungen.
- Drei reguläre Tests sowie erweiterte reale Python-MCP-/MQTT-Integration bis zum produktiven Studio-Editor.
- Anleitung mit Befehlsreferenz und Beispielablauf für KI-Bearbeitung.

### Changed

- Beide MCP-Server stellen acht Tools bereit. Das MQTT-Status-Topic bleibt auf Playerbefehle beschränkt.
- „Pose anzeigen“ ist als Änderung der Arbeitspose rückgängig machbar und aktualisiert die Bearbeitungsrevision.

**Hinweise zu dieser Version:** Studio-Befehle erzeugen kein neues Quellskelett und keine automatische Anatomieerkennung. Projektdateien weiterhin selbst herunterladen. Visuelle Browser-/externe Host-Abnahme bleibt offen.


## [0.8.0] - 2026-10-14

Zeitstempel: 2026-10-14T00:03:30+02:00 (Europe/Berlin)

### Added

- Gesamtdrehung um den ursprünglichen Modellmittelpunkt als eigene Posen-/Bewegungsspur, auch für knochenlose Modelle.
- Drehgriffe für die gesamte Figur, Quaternion-Interpolation, Projektpersistenz und Undo/Redo.
- Drei Tests für skinned Geometrie und Gesichtspunkte, ungleichmäßig skalierte Eltern, Slerp, Projektdateien und den Editorablauf.

### Changed

- „Gesamte Figur bewegen“ bietet Verschieben und Drehen; die Ansichtsdrehung bleibt davon unabhängig.
- Exakte Root-Matrix während Studio-Moves erhält die Geometrie auch unter ungleichmäßiger Elternskalierung; Originalclips stellen die Ausgangslage wieder her.
- README, Blaupause und Anleitungen beschreiben die Drehspur und Zwischenposen für volle Umdrehungen.

**Hinweise zu dieser Version:** Projekte mit nicht neutraler Gesamtdrehung benötigen mindestens 0.8.0. Volle Umdrehungen benötigen Zwischenposen; Skalierung, Physik und visuelle Browserabnahme bleiben offen.


## [0.7.0] - 2026-10-13

Zeitstempel: 2026-10-13T19:54:01+02:00 (Europe/Berlin)

### Added

- Automatische Prüfhinweise für Posen und zugehörige Moves nach Änderungen an Drehpunkten, freien Punktpositionen, Einflussradien oder entfernten animierten Kontrollpunkten.
- Gründe im Studio, Markierungen im Player sowie `needsReview`/`reviewPoseIds` in den Agentenabfragen; Wiedergabe bleibt möglich.
- Gespeicherte Prüfhinweise, „Pose als geprüft markieren“, Aufheben durch Ersetzen und Rückgängig/Wiederholen.
- Vier automatisierte Prüfungen für Erkennung, ausgenommene Änderungen, Persistenz und den Bedienablauf.

- Zentraler Prüfstand mit den letzten tatsächlichen Testergebnissen, historischen Berichten und ausstehender visueller und externer Abnahme.

### Changed

- README, Blaupausen-Übersicht, Designdokument, Roadmap, Architektur und Anleitungen auf den gemeinsamen Stand 0.6.0 abgeglichen.
- Nachträgliche Versionsanhänge in die passenden Themen integriert; Produktziele von vorhandenen Funktionen und deren Prüfstand getrennt.
- Changelog mit vollständigen Versionsvergleichslinks und Keep-a-Changelog-Kategorien ergänzt; historische Einschränkungen als Versionshinweise erhalten.

### Fixed

- Veraltete Angaben zur linken Maustaste, zum Blaupausenstand, zur Gesamtpositionsspur und zum noch nicht vorhandenen separaten Moves-Ordner berichtigt.
- Umfang der Clip-Überblendung, MCP-Playersteuerung, Dateigrenzen und Projektkompatibilität präzisiert; fehlende Changelog-Links für 0.5.0 und 0.6.0 ergänzt.

**Hinweise zu dieser Version:** Die Prüfung erkennt relevante Änderungen, keine anatomischen Fehler oder Kollisionen; eine automatische Reparatur bleibt offen. Für verlässlich nachgeführte Prüfhinweise mindestens 0.7.0 verwenden. Visuelle Browserabnahme weiterhin offen.

## [0.6.0] - 2026-10-13

Zeitstempel: 2026-10-13T18:34:16+02:00 (Europe/Berlin)

### Added

- Eigene Gesamtpositionsspur pro Pose; funktioniert auch ohne Skelett und ohne Kontrollpunkte.
- „Gesamte Figur verschieben“ im Modus „Figur bewegen“, mit direktem Ziehen, Achsgriffen und Undo/Redo.
- Interpolation, Projektpersistenz und Abspielen der Gesamtspur zusammen mit Gelenk-/Gesichtsbewegungen.
- Rückwärtskompatibles Laden alter Projekte mit neutraler Gesamtposition und Importprüfung des neuen optionalen Kanals.
- Geometrie- und DOM-Tests für geriggte und knochenlose Modelle, Elternskalierung, Undo, Wiedergabe und Rückkehr zur Originalposition.

### Fixed

- Hautbindung nach Gesamtverschiebung auch vor dem nächsten Renderdurchlauf aktualisieren, damit Oberfläche und Kontrollpunkte gemeinsam verschoben werden.
- Neu hinzugefügte Kontrollpunkte auch in einem bestehenden Projektentwurf ergänzen.

**Hinweise zu dieser Version:** Gesamtrotation, Skalierung, physikalische Sprünge und Bodenkollision sind nicht enthalten. Projekte mit Gesamtspur benötigen mindestens Version 0.6.0. Visuelle WebGL-Abnahme bleibt offen.

## [0.5.0] - 2026-10-13

Zeitstempel: 2026-10-13T11:32:34+00:00

### Added

- Zwei Buttons zur Erkennung vorhandener Skelettgelenke und ihrer Verbindungen, ohne vorhandene manuelle Punkte zu überschreiben.
- Verbindungsliste zum einzelnen Entfernen automatischer und selbst angelegter Verbindungen mit Undo/Redo.
- Direkte Punktbewegung per linkem Ziehen und freie Kugeldrehung mit gedrücktem Mausrad; Rechtsziehen verschiebt, Mausrad zoomt.
- Optionsdialog für Deutsch/English und invertierte Drehrichtung, lokal gespeichert.
- Automatisierte Prüfungen für Erkennung, Einzellöschung, direkte Punktbewegung, Mausnavigation und Sprachwechsel.

### Changed

- Im Studio bewegt die linke Maustaste Punkte; die Kamera wird mit der mittleren Maustaste gedreht.

**Hinweise zu dieser Version:** Anatomische KI-Erkennung ohne vorhandenes Skelett ist noch nicht implementiert; die Oberfläche weist darauf hin. Original-Bildplayer und einige technische Meldungen bleiben deutsch. Visuelle WebGL-Abnahme bleibt offen.

## [0.4.0] - 2026-10-13

Zeitstempel: 2026-10-13T07:52:17+02:00 (Europe/Berlin)

### Added

- Freie 3D-Ansichtsdrehung um alle Achsen mit ArcballControls, sechs festen Ansichten und Rolltasten. Im Studio verdeckt kein Sockel die Unterseite.
- Python-MCP-Server mit offiziellem SDK 2.3.0 und optional eingebettetem aMQTT 0.12.1; lokale TCP-/WebSocket-Listener mit Schlüsselanmeldung.
- Bidirektionaler MCP-Kanal über MQTT mit Player-Präsenz, eindeutigen Anfragen, Rückantworten, Timeout, Ablaufzeit und Duplikaterkennung.
- Player-Schalter zur ausdrücklichen Freigabe von Python-MCP über den gewählten MQTT-Broker.
- Echter Integrationstest über Python-stdio-MCP, aMQTT, den produktiven MQTT-Client und den Zustandsrouter; Prüfung von falschem Passwort, ungültigen Befehlen, Duplikaten, Mehrdeutigkeit und Opt-out.
- Windows-Einrichtungsanleitung für den Python-Agentenweg und externen Brokerbetrieb.

### Changed

- Die bisherige vertikale Kamera-Begrenzung ist entfernt. Ansichtsdrehung verändert weder Modell noch gespeicherte Gelenkpositionen.
- MQTT.js übernimmt den bidirektionalen Transport der Hauptoberfläche. Die Originaldateien bleiben unverändert.
- Python ist der bevorzugte MCP-Weg; die bisherige Node-Brücke bleibt als Kompatibilitätsoption verfügbar.

## [0.3.0] - 2026-10-13

Zeitstempel: 2026-10-13T07:15:59+02:00 (Europe/Berlin)

### Added

- Erster integrierter Studio-Editor mit genau zwei Modi: Figur bewegen und Gelenke bearbeiten.
- Frei platzierbare Oberflächen-/Gesichtspunkte mit individueller Punktgröße, separatem Einflussradius und unabhängigen Verbindungen; tatsächliche Oberflächenverformung und gemeinsames Bewegen verbundener freier Punkte.
- Auswahl und Transformation bestehender Skelettgriffe; verschiebbare Drehpunkte mit Erhalt der Grundoberfläche.
- Posen, Übergangszeiten, benannte eigene Moves, Vorschau und Wiedergabe im Player über die bestehende Agentensteuerung.
- Vollständiges versioniertes Studio-Projektformat mit eingebettetem Modell, Arbeitspose, Neu/Laden/Speichern sowie Rückgängig/Wiederholen.
- Geometrie-, Daten- und DOM-Tests für Verformung, Skelettbindung, Hautfolge von Gesichtspunkten, Posen, Projekt-Roundtrip und Bedienablauf.

### Changed

- Externe Steuerbefehle werden während geöffneter Studio-Bearbeitung abgewiesen; danach sind eigene Moves normal steuerbar.
- Die 3D-Ansicht bleibt neben den längeren Studio-Bedienelementen sichtbar.
- Blaupause unterscheidet die vorhandene Kontrollpunktbearbeitung vom noch offenen vollständigen Quellknochenumbau, IK und KI-Generierung.

### Fixed

- Zustandsauswahl wird nach abgeschlossenem Avatarladen wieder freigegeben.

## [0.2.0] - 2026-10-13

Zeitstempel: 2026-10-13T06:46:36+02:00 (Europe/Berlin)

### Added

- Gemeinsame StateMaschine und Zustandsauswahl für Original-PaKaChi und 3D-Avatare; Prüfung tatsächlicher Fähigkeiten und verständliche Fehler.
- Zustandsclips für idle, talking, thinking und working in beiden technischen Testmodellen.
- Gemeinsamer optionaler MQTT-Empfang mit Broker-/Topic-Feldern und Zugangsdaten für die Sitzung.
- Lokaler MCP-stdio-Server mit sechs Tools, authentifizierter WebSocket-Kopplung und Installationsanleitung.
- Tests für Zustandswechsel, MQTT-Routing, Verbindungsabbrüche und echten MCP-Protokoll-Handshake.

### Changed

- Einmalige 3D-Moves kehren zum aktiven Zustand zurück; neue Zustände unterbrechen Moves. Clipwechsel blenden über 180 ms über.
- Die gemeinsame MQTT-Oberfläche übernimmt die Steuerung des eingebetteten Originalplayers; alle Originaldateien und 72 Transformationsbilder bleiben unverändert.
- Blaupause, Architektur und Roadmap auf den Implementierungsstand aktualisiert; visuelle Browser- und externe Live-Abnahme bleiben ausdrücklich offen.

## [0.1.0] - 2026-10-13

Zeitstempel: 2026-10-13T00:59:25+02:00 (Europe/Berlin)

### Added

- Lokal startbarer TypeScript-/Three.js-Player mit Vite-Build und Windows-Startdatei.
- Wiederhergestellter Original-PaKaChi-Player mit allen 72 unveränderten Transformationsbildern, Formsteuerung und optionalem MQTT. Original-PaKaChi ist beim Start ausgewählt.
- Erhaltene Charakterreferenz und korrigierte humanoide Endform als getrennte Stilvorlagen.
- Model Zoo mit versioniertem JSON-Katalog, zwei reproduzierbaren geriggten glTF-Testmodellen und tatsächlicher Clip-Legende.
- GLB-Import für die Sitzung, Wiedergabe/Pause, Tempo und Abspielposition.
- Integrierte Studio-Ansicht mit Skelettanzeige, Mausrad-Nahzoom und verschiebbarer 3D-Ansicht.
- Tests für Katalog, Wiedergabe, unveränderte Originaldateien und Browserabläufe.
- Designanforderungen für frei platzierbare Gesichtspunkte, unabhängige Punktgruppen, freie Verbindungen und individuell einstellbare Punktgrößen.

### Changed

- Blaupause um tatsächlichen Implementierungsstand, Architektur und Herkunft der Originaldateien ergänzt.
- Studio-, KI- und 3D-Agentenfunktionen ausdrücklich von bereits nutzbaren Funktionen getrennt.

## [0.0.1] - 2026-10-12

Zeitstempel: 2026-10-12T21:15:58+02:00 (Europe/Berlin)

### Added

- Projektbeschreibung für PaKaChi-SM (StateMaschine).
- Designdokument mit Player, integriertem PaKaChi-Avatar-Studio und Model Zoo.
- Anforderungen für zwei Bearbeitungsmodi, Gelenkkorrektur, KI-Neuversuch mit Korrekturprompt, Neu/Laden/Speichern und skalierbare Modellqualität.
- Konzept für gespeicherte Posen, interpolierte Bewegungen, Zustände und MCP-/MQTT-Ansteuerung.
- Roadmap mit sechs geplanten Umsetzungsschritten und Abnahmekriterien.
- Einstieg in die Blaupause und versioniertes Changelog.

### Changed

- Bestehendes Bedienkonzept ausdrücklich als Designdokument eingeordnet und mit Roadmap und Changelog verknüpft.

[Unreleased]: https://github.com/Smilez1985/PaKaChi-SM/commits/work/local-verification-model-zoo
[0.20.0]: ./PRUEFUNG-0.20.0.md
[0.19.0]: ./PRUEFUNG-0.19.0.md
[0.18.0]: ./PRUEFUNG-0.18.0.md
[0.17.1]: ./PRUEFUNG-0.17.1.md
[0.17.0]: ./PRUEFUNG-0.17.0.md
[0.16.0]: ./PRUEFUNG-0.16.0.md
[0.15.0]: ./PRUEFUNG-0.15.0.md
[0.14.0]: ./PRUEFUNG-0.14.0.md
[0.13.0]: ./PRUEFUNG-0.13.0.md
[0.12.0]: ./PRUEFUNG-0.12.0.md
[0.11.1]: https://github.com/Smilez1985/PaKaChi-SM/compare/3febc7f6a9c7326bdb7295284d2a042e97bd24f3...207faaac1f0c35dbf0bda71d1142792f1e5bab0c
[0.11.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/fd8fabe5a194d211a4389673f05fc4363b3fa049...3febc7f6a9c7326bdb7295284d2a042e97bd24f3
[0.10.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/b0c0782b4e54f1c15032f98648d0af59fc61028d...fd8fabe5a194d211a4389673f05fc4363b3fa049
[0.9.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/7694667885e57c9ca4573c25396a42799428d33a...b0c0782b4e54f1c15032f98648d0af59fc61028d
[0.8.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/16ea247734a97aa831343f0ec0d2cbb6b51c16a5...7694667885e57c9ca4573c25396a42799428d33a
[0.7.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/1a2cc30de87d3a90ab35e240f413f047bc16fd6a...16ea247734a97aa831343f0ec0d2cbb6b51c16a5
[0.6.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/4ce44c3b70d4dbbba5ecdc4e1bc99d8ea89bb7bc...1a2cc30de87d3a90ab35e240f413f047bc16fd6a
[0.5.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/5d3dd2d9e115e597735bf089c9ea27de1e701545...4ce44c3b70d4dbbba5ecdc4e1bc99d8ea89bb7bc
[0.4.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/085e11ec7576d6e25634526f1c68ecdc7b00020a...5d3dd2d9e115e597735bf089c9ea27de1e701545
[0.3.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/379e517b58280e3aa94b5a2b382002faf7f8befe...085e11ec7576d6e25634526f1c68ecdc7b00020a
[0.2.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/4c54448062977dbee105fe553f5ce1617a788f7f...379e517b58280e3aa94b5a2b382002faf7f8befe
[0.1.0]: https://github.com/Smilez1985/PaKaChi-SM/compare/2fd20e09bb518f1e3edde27e060209c57a56f103...4c54448062977dbee105fe553f5ce1617a788f7f
[0.0.1]: https://github.com/Smilez1985/PaKaChi-SM/tree/2fd20e09bb518f1e3edde27e060209c57a56f103

[0.21.0]: ./PRUEFUNG-0.21.0.md

[0.22.0]: ./PRUEFUNG-0.22.0.md

[0.23.0]: ./PRUEFUNG-0.23.0.md

[0.24.0]: ./PRUEFUNG-0.24.0.md

[0.25.0]: PRUEFUNG-0.25.0.md

[0.26.0]: PRUEFUNG-0.26.0.md

[0.27.0]: PRUEFUNG-0.27.0.md

[0.28.0]: PRUEFUNG-0.28.0.md

[0.29.0]: PRUEFUNG-0.29.0.md

[0.30.0]: PRUEFUNG-0.30.0.md

[0.31.0]: PRUEFUNG-0.31.0.md

[0.32.0]: PRUEFUNG-0.32.0.md

[0.33.0]: PRUEFUNG-0.33.0.md

[0.34.0]: PRUEFUNG-0.34.0.md

[0.35.0]: PRUEFUNG-0.35.0.md

[0.36.0]: PRUEFUNG-0.36.0.md

[0.37.0]: PRUEFUNG-0.37.0.md

[0.38.0]: PRUEFUNG-0.38.0.md

[0.39.0]: PRUEFUNG-0.39.0.md

[0.40.0]: PRUEFUNG-0.40.0.md

[0.41.0]: PRUEFUNG-0.41.0.md

[0.42.0]: PRUEFUNG-0.42.0.md

[0.43.0]: PRUEFUNG-0.43.0.md

[0.44.0]: PRUEFUNG-0.44.0.md

[0.45.0]: PRUEFUNG-0.45.0.md

[0.46.0]: PRUEFUNG-0.46.0.md

[0.47.0]: PRUEFUNG-0.47.0.md

[0.48.0]: PRUEFUNG-0.48.0.md

[0.49.0]: PRUEFUNG-0.49.0.md

[0.50.0]: PRUEFUNG-0.50.0.md

[0.51.0]: PRUEFUNG-0.51.0.md

[0.52.0]: PRUEFUNG-0.52.0.md

[0.53.0]: PRUEFUNG-0.53.0.md

[0.54.0]: PRUEFUNG-0.54.0.md

[0.55.0]: PRUEFUNG-0.55.0.md

[0.56.0]: PRUEFUNG-0.56.0.md

[0.57.0]: PRUEFUNG-0.57.0.md

[0.58.0]: PRUEFUNG-0.58.0.md

[0.59.0]: PRUEFUNG-0.59.0.md

[0.60.0]: PRUEFUNG-0.60.0.md

[0.61.0]: PRUEFUNG-0.61.0.md

[0.62.0]: PRUEFUNG-0.62.0.md

[0.63.0]: PRUEFUNG-0.63.0.md

[0.64.0]: PRUEFUNG-0.64.0.md

[0.65.0]: PRUEFUNG-0.65.0.md

[0.66.0]: PRUEFUNG-0.66.0.md

[0.67.0]: PRUEFUNG-0.67.0.md

[0.68.0]: PRUEFUNG-0.68.0.md

[0.69.0]: PRUEFUNG-0.69.0.md

[0.69.1]: PRUEFUNG-0.69.1.md

[0.69.2]: PRUEFUNG-0.69.2.md

[0.70.0]: PRUEFUNG-0.70.0.md

[0.71.0]: PRUEFUNG-0.71.0.md

[0.71.1]: PRUEFUNG-0.71.1.md

[0.72.0]: PRUEFUNG-0.72.0.md

[0.73.0]: PRUEFUNG-0.73.0.md

[0.74.0]: PRUEFUNG-0.74.0.md

[0.75.0]: PRUEFUNG-0.75.0.md

[0.76.0]: PRUEFUNG-0.76.0.md

[0.76.1]: PRUEFUNG-0.76.1.md

[0.76.2]: PRUEFUNG-0.76.2.md

[0.76.3]: PRUEFUNG-0.76.3.md

[0.77.0]: PRUEFUNG-0.77.0.md

[0.78.0]: PRUEFUNG-0.78.0.md

[0.78.1]: PRUEFUNG-0.78.1.md

[0.79.0]: PRUEFUNG-0.79.0.md

[0.80.0]: PRUEFUNG-0.80.0.md
