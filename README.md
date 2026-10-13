# PaKaChi-SM

**SM steht für StateMaschine.** PaKaChi bezeichnet das übergeordnete Projekt **Panda-KI-Chimera**.

PaKaChi-SM soll 3D-Avatare darstellen, ihre Zustände und Bewegungen steuern und das Erstellen eigener Avatare in derselben Anwendung ermöglichen.

> **Projektstand: 0.3.0 – erster integrierter Studio-Editor.** Der bestehende PaKaChi mit allen 72 Transformationsbildern ist erhalten und standardmäßig ausgewählt. Zusätzlich gibt es einen 3D-Player mit Model Zoo, zwei technischen Testavataren und lokalem GLB-Import. Das Studio bietet frei platzierbare Kontrollpunkte, Posen, eigene Moves und vollständige Projektdateien. KI-Generierung, tiefgreifender Skelettumbau und die 3D-Übertragung des Original-PaKaChi folgen noch.

## Starten

Voraussetzung für die neue Oberfläche: **Node.js 24 LTS** und ein aktueller Browser. 3D benötigt WebGL2/Hardwarebeschleunigung.

```sh
npm ci
npm run dev
```

Die angezeigte lokale Adresse öffnen (normalerweise `http://127.0.0.1:5173`). Unter Windows kann alternativ **Start-Windows.cmd** gestartet werden. Der erste Start installiert die Abhängigkeiten und benötigt Internet. Es gibt noch keinen EXE-Installer.

Der wiederhergestellte Originalplayer lässt sich auch ohne Node starten: `public/legacy/pakachi/index.html` direkt im Browser öffnen.

## Bereits nutzbar

- PaKaChi-Originalplayer: Tierform, humanoide Arbeitsform, 72 Bilder, Formwechsel auf Signal, optionaler MQTT-Empfang (standardmäßig aus).
- 3D-Testavatare Mika und Nori mit echten Skeletten und unterschiedlichen Animationsclips. Sie ersetzen nicht das PaKaChi-Design.
- Avatar-Auswahl, Bewegungslegende, Abspielen/Pause, Tempo und Abspielposition.
- Eigene, eigenständige GLB-Dateien bis 50 MB für die aktuelle Sitzung laden oder hineinziehen. Kein Upload.
- Integrierter Studio-Editor mit „Figur bewegen“ und „Gelenke bearbeiten“, Skelettgriffen und unabhängigen Gesichtspunkten. Mausrad zoomt bis ins Detail; linke Maustaste dreht, rechte verschiebt die Ansicht.
- Individuelle Punktgrößen und Einflussbereiche, freie Verbindungen, Rückgängig/Wiederholen, Posen und eigene Bewegungen.
- Neu, Projekt laden und Speichern als vollständige `.pakachi.json` mit eingebettetem Modell. [Studio-Anleitung und Grenzen](docs/STUDIO.md).

Der ursprüngliche Bildstand hat bekannte Proportions- und Materialfehler. Die korrigierte humanoide Stilreferenz ist separat erhalten; siehe [Originalvorlagen](docs/references/README.md).

Die folgenden Abschnitte beschreiben das vollständige Produktziel; noch offene Funktionen stehen in der Roadmap.

## Eine Anwendung, drei zusammenhängende Bereiche

- **PaKaChi-Player:** Avatar auswählen, anzeigen und gespeicherte Bewegungen abspielen.
- **PaKaChi-Avatar-Studio:** fest integrierter Editor im Player zum Erstellen und Bearbeiten von Avataren, Gelenken und Bewegungen. Kein eigenständiges Programm.
- **Model Zoo:** gemeinsame Sammlung der Avatare mit ihren jeweiligen Moves, Zuständen und eindeutigen Schlagworten.

## Bedienprinzip

**2D-Bild hineinziehen → 3D-Avatar erzeugen → Figur mit der Maus bewegen → Posen speichern → Bewegung benennen.**

Die Oberfläche soll ohne 3D-Vorkenntnisse verständlich sein. Frei gestaltbare Figuren sind vorgesehen: Menschen, Tiere, Roboter und Fantasiefiguren, auch mit ungewöhnlichem Körperbau.

Das Studio hat genau zwei Bearbeitungsmodi:

1. **Figur bewegen:** Körperteile mit der Maus posieren, Gesichtsausdrücke und die Gesamtposition bearbeiten.
2. **Gelenke bearbeiten:** automatisch erkannte Gelenke direkt an der Figur verschieben, ergänzen oder löschen. Im ersten Editor werden bei vorhandenen Skelettpunkten nur die Griffe gelöscht; das Quellskelett bleibt erhalten.

Weitere Grundfunktionen: **Neu, Laden, Speichern**, erneuter KI-Versuch mit freiem Korrekturprompt sowie eine Einstellung für Modellqualität und Dateigröße.

## Bewegungen und Zustände

Aus typischerweise drei bis zehn gespeicherten Posen entsteht ein Bewegungsablauf. Die Zwischenbewegungen werden berechnet. Eine Bewegung erhält ein eindeutiges Schlagwort, etwa `gaehnen`, und wird im Moves-Ordner des zugehörigen Avatars gespeichert.

Einmalige Bewegungen und dauerhafte Zustände werden unterschieden. Die gemeinsame StateMaschine bildet Zustände wie `idle`, `talking`, `thinking` und `working` auf die Fähigkeiten des ausgewählten Avatars ab. Einmalige 3D-Moves kehren zum aktiven Zustand zurück; Übergänge werden überblendet.

## Ansteuerung durch Agenten

- Lokaler MCP-Server zum Abfragen verfügbarer Avatare und der tatsächlichen Fähigkeiten sowie zum Auslösen von Zuständen und Moves.
- Optionale MQTT-Anbindung, beispielsweise an NanoMQ: standardmäßig ausgeschaltet, mit Schalter und Feld für die Broker-Adresse.
- Manuelle Zustandsauswahl, MQTT und MCP verwenden denselben Router und die Fähigkeiten des geladenen Avatars.

Einrichtung und Befehle: [Agentensteuerung](docs/ANSTEUERUNG.md). Nach einem Update vor dem Start erneut `npm ci` ausführen.

## Dokumentation

- [Blaupause – Übersicht](docs/README.md)
- [Designdokument und Anforderungen](docs/KONZEPT.md)
- [Roadmap – was kommt](docs/ROADMAP.md)
- [Changelog – was war](docs/CHANGELOG.md)
- [Technischer Stand](docs/ARCHITEKTUR.md)
- [Erhaltene PaKaChi-Vorlagen](docs/references/README.md)

## Technische Leitlinie

Ein dauerhaftes 3D-Modell mit Skelett und gespeicherten Animationsdaten ersetzt inkonsistente Einzelbilder. Bewegungen lassen sich als Zahlen und Zeitpunkte speichern; der Player berechnet die Zwischenposen während der Wiedergabe.

Der erste Player verwendet TypeScript, Three.js, glTF/GLB und einen JSON-Katalog. Das Studio nutzt ein versioniertes JSON-Projektformat mit eingebettetem Modell. Die KI-Anbieter sind noch nicht festgelegt. Aus einem einzelnen Bild müssen verdeckte Bereiche geschätzt werden. Zuverlässiges Rigging beliebiger Figuren ist eine eigene Entwicklungsaufgabe.

## Entwicklung und Prüfungen

```sh
npm test
npm run test:legacy
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run preview` startet den gebauten Stand lokal. `npm run generate:avatars` erzeugt ausschließlich die beiden technischen 3D-Testmodelle neu.

## Lizenz

Noch nicht festgelegt.

