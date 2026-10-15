# Changelog

Alle wesentlichen Änderungen an PaKaChi-SM werden hier dokumentiert.

Das Format folgt [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versionen verwenden das Schema MAJOR.MINOR.PATCH. Während der 0.x-Entwicklung wird keine versionsübergreifende Kompatibilität zugesichert; bekannte Formatgrenzen werden je Version benannt.

Zusätzlich zum Versionsdatum wird der Meilenstein mit einem ISO-8601-Zeitstempel einschließlich Zeitzone dokumentiert.
Die Kategorien Added, Changed, Deprecated, Removed, Fixed und Security werden nur bei passenden Einträgen verwendet. Unreleased sammelt Änderungen seit dem letzten Software-Meilenstein. Versionslinks führen zum Prüfbericht oder vergleichen die tatsächlichen Meilenstein-Commits; dafür werden keine nicht vorhandenen Release-Tags vorausgesetzt.

Version 0.0.1 bezeichnet den ursprünglichen Dokumentationsstand. Ab 0.1.0 ist ein lokaler Player vorhanden.

## [Unreleased]

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

[Unreleased]: https://github.com/Smilez1985/PaKaChi-SM/commits/main
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
