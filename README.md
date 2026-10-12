# PaKaChi-SM

**SM steht für StateMaschine.** PaKaChi bezeichnet das übergeordnete Projekt **Panda-KI-Chimera**.

PaKaChi-SM soll 3D-Avatare darstellen, ihre Zustände und Bewegungen steuern und das Erstellen eigener Avatare in derselben Anwendung ermöglichen.

> **Projektstand: Konzept und Entwicklungsplanung.** Dieses Repository enthält noch keinen ausführbaren Player, keinen 3D-Editor und keine angeschlossene KI-Generierung. Die folgenden Funktionen beschreiben das Entwicklungsziel.

## Eine Anwendung, drei zusammenhängende Bereiche

- **PaKaChi-Player:** Avatar auswählen, anzeigen und gespeicherte Bewegungen abspielen.
- **PaKaChi-Avatar-Studio:** fest integrierter Editor im Player zum Erstellen und Bearbeiten von Avataren, Gelenken und Bewegungen. Kein eigenständiges Programm.
- **Model Zoo:** gemeinsame Sammlung der Avatare mit ihren jeweiligen Moves, Zuständen und eindeutigen Schlagworten.

## Bedienprinzip

**2D-Bild hineinziehen → 3D-Avatar erzeugen → Figur mit der Maus bewegen → Posen speichern → Bewegung benennen.**

Die Oberfläche soll ohne 3D-Vorkenntnisse verständlich sein. Frei gestaltbare Figuren sind vorgesehen: Menschen, Tiere, Roboter und Fantasiefiguren, auch mit ungewöhnlichem Körperbau.

Das Studio hat genau zwei Bearbeitungsmodi:

1. **Figur bewegen:** Körperteile mit der Maus posieren, Gesichtsausdrücke und die Gesamtposition bearbeiten.
2. **Gelenke bearbeiten:** automatisch erkannte Gelenke direkt an der Figur verschieben, ergänzen oder löschen.

Weitere Grundfunktionen: **Neu, Laden, Speichern**, erneuter KI-Versuch mit freiem Korrekturprompt sowie eine Einstellung für Modellqualität und Dateigröße.

## Bewegungen und Zustände

Aus typischerweise drei bis zehn gespeicherten Posen entsteht ein Bewegungsablauf. Die Zwischenbewegungen werden berechnet. Eine Bewegung erhält ein eindeutiges Schlagwort, etwa `gaehnen`, und wird im Moves-Ordner des zugehörigen Avatars gespeichert.

Einmalige Bewegungen und dauerhafte Zustände werden unterschieden. Die StateMaschine soll Zustände wie `idle`, `talking`, `thinking` und `working` auf die Fähigkeiten des ausgewählten Avatars abbilden.

## Ansteuerung durch Agenten

- Geplante MCP-Schnittstelle zum Abfragen der verfügbaren Avatare, Moves und Zustände sowie zum Auslösen von Bewegungen.
- Optionale MQTT-Anbindung, beispielsweise an NanoMQ: standardmäßig ausgeschaltet, mit Schalter und Feld für die Broker-Adresse.
- Player, Studio und Agenten verwenden dieselben Informationen aus dem Model Zoo.

## Dokumentation

- [Blaupause – Übersicht](docs/README.md)
- [Designdokument und Anforderungen](docs/KONZEPT.md)
- [Roadmap – was kommt](docs/ROADMAP.md)
- [Changelog – was war](docs/CHANGELOG.md)

## Technische Leitlinie

Ein dauerhaftes 3D-Modell mit Skelett und gespeicherten Animationsdaten ersetzt inkonsistente Einzelbilder. Bewegungen lassen sich als Zahlen und Zeitpunkte speichern; der Player berechnet die Zwischenposen während der Wiedergabe.

Die technische Umsetzung, das Dateiformat und die KI-Anbieter sind noch nicht abschließend festgelegt. Aus einem einzelnen Bild müssen verdeckte Bereiche geschätzt werden. Zuverlässiges Rigging beliebiger Figuren ist eine eigene Entwicklungsaufgabe.

## Lizenz

Noch nicht festgelegt.
