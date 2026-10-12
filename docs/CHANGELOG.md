# Changelog

Alle wesentlichen Änderungen an PaKaChi-SM werden hier dokumentiert.

Das Format folgt [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Zusätzlich zum Versionsdatum wird der Meilenstein mit einem ISO-8601-Zeitstempel einschließlich Zeitzone dokumentiert.
Version 0.0.1 bezeichnet den ursprünglichen Dokumentationsstand. Ab 0.1.0 ist ein lokaler Player vorhanden.

## [Unreleased]

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
[0.1.0]: ./ARCHITEKTUR.md
[0.0.1]: ./README.md

