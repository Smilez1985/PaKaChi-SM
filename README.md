# PaKaChi-SM

PaKaChi ist die **Panda-KI-Chimera**. PaKaChi-SM vereint den Avatar-Player, den Model Zoo und das fest integrierte **PaKaChi-Avatar-Studio**. SM steht für StateMaschine.

**Softwarestand: 0.97.0 · Entwicklungsversion.**

Der Original-PaKaChi mit Normalform, humanoider Arbeitsform und 72 Transformationsbildern ist als Bildplayer erhalten und beim Start ausgewählt. Im Model Zoo stehen außerdem **PaKaChi · Normalform · Rig** und **PaKaChi · Arbeitsform · Rig**: bearbeitete Originalrekonstruktionen mit gemeinsamem 59-Gelenk-Aufbau, Hautgewichten, grünen 3D-Augen und Fellfasern. Im integrierten Studio lassen sie sich posieren und speichern. Geprüfte poseabhängige Korrekturformen verbessern ausgewählte Ellenbogen- und Kniehaltungen an Körper und Fell bei unveränderter Gelenkbewegung; sie sind zum Vergleich abschaltbar und blenden bei erkannten unpassenden Bewegungskombinationen aus. Die ursprünglichen ungeriggten Entwürfe sowie Mika/Nori bleiben erhalten. Der saubere 3D-Formwechsel und die abschließende Charakterqualität stehen noch aus. [Ergebnisse und Bedienung](docs/KI-GENERIERUNG.md#rigging-und-charakteraufbereitung).

**Bild → 3D:** PNG/JPEG an den eingerichteten lokalen Generator senden, den drehbaren Entwurf prüfen und optional ein erstes Zweibeiner-/Vierbeinerskelett mit Hautbindung vorbereiten. Seit 0.96.0 helfen getrennte Standflächen bei Körpermitte und Ausrichtung, sodass ein großer seitlicher Schwanz den Rahmen nicht mehr automatisch verschiebt; unklare Fälle werden angezeigt. Gelenke und Beugungen anschließend im Studio korrigieren, Posen speichern und GLB exportieren. Die neue Proportionsvorlage ist keine KI-Anatomieerkennung; ein fertiger designgetreuer Charakter entsteht noch nicht zuverlässig mit einem Klick. [Ablauf und Grenzen](docs/KI-GENERIERUNG.md#erster-beweglicher-entwurf-seit-0950).

**Automatische Hautkorrektur:** Das Studio und sein KI-Assistent können zusätzlich eine lokale Form aus den Netzverbindungen ableiten. Am rekonstruierten Arbeitsform-Entwurf verbessert eine geprüfte Beugung sich von 784 auf 765 auffällige Dreiecke; die Tierform liefert noch keinen akzeptierten Vorschlag. Vorschau, Undo und Projekt-/Animations-GLB-Export sind eingebunden. [Messung und Grenzen](docs/PRUEFUNG.md#version-0970).

## Starten

Voraussetzungen: Node.js ab Version 24 und ein aktueller Browser mit WebGL2 für die 3D-Ansicht.

```sh
npm ci
npm run local -- --open
```

Die angezeigte Adresse öffnen, normalerweise `http://127.0.0.1:8787`. `npm run dev` bleibt für die Webentwicklung verfügbar. Unter Windows übernimmt **Start-Windows.cmd** den Start. Ein EXE-Installer ist noch nicht vorhanden. Der archivierte Bildplayer lässt sich separat über `public/legacy/pakachi/index.html` öffnen.

**Lokale Werkzeuge** konfiguriert Blender/Python, GPU-Prüfung, Dateien, Rechenaufträge, Caddy/DuckDNS, den offiziellen Secure MCP Tunnel und optionale ACP-Agenten. Dein vorhandener Reverse Proxy genügt; der Tunnel verbindet sich ausgehend. [Einrichten und verbinden](docs/LOKALE-WERKZEUGE.md).

## Player und Studio

| Bereich | Verfügbare Funktionen |
| --- | --- |
| Player | Avatar auswählen, Clips und eigene Moves abspielen, pausieren, Tempo und Abspielposition ändern. |
| Model Zoo | Mitgelieferte Avatare auswählen, eigene GLB-Dateien laden und Projektkopien im lokalen Browserbestand verwalten. |
| Avatar-Studio | Zwei Modi: **Figur bewegen** und **Gelenke bearbeiten**. Vorhandene Skelettketten, freie Gesichtspunkte, Posen und Moves bearbeiten, Oberflächendehnung prüfen, lokale Hautkorrekturen bei erhaltener Zielpose suchen und eine schonendere Pose als eigenen Prüfkandidaten erstellen; Änderungen rückgängig machen. |
| Projekte und Export | Projekte mit eingebettetem Modell speichern/laden, einzelne Moves austauschen sowie GLB-Standbilder, bearbeitete Rigs und ausgewählte Studio-Moves exportieren. |
| Agenten | Zustände und Moves über optionales MQTT und MCP steuern; Studio-Änderungen nur nach Freigabe. |
| KI-Anbindung | Unabhängige Anbieterprofile für Assistent, 3D-Generator und Rigging; Assistentenvorschläge prüfen und ausdrücklich übernehmen. |

Eigenständige GLB-Dateien bis 50 MiB lassen sich laden oder hineinziehen. **Figur bewegen** steuert vorhandene Gelenkketten; **Gelenke bearbeiten** korrigiert deren Aufbau. Die Erkennungsbuttons lesen vorhandene Skelettdaten und erzeugen noch kein anatomisches Rig aus einer ungeriggten Oberfläche.

Mausrad drücken und ziehen dreht die Ansicht, Rechtsziehen verschiebt sie, das Mausrad zoomt. Drehrichtung und Sprache lassen sich in den Optionen ändern. [Studio-Anleitung](docs/STUDIO.md).

## Erste eigene Bewegung

1. Einen 3D-Avatar auswählen oder eine GLB laden und **Avatar-Studio** öffnen.
2. Eine Pose einstellen und **Aktuelle Pose speichern** wählen.
3. Mindestens eine weitere Pose speichern und daraus eine Bewegung mit Zeiten und Schlagwort erstellen.
4. Vorschau prüfen und das Projekt speichern. Im Player steht der eigene Move anschließend auch für MQTT/MCP bereit.

Projekte als Datei herunterladen, um sie unabhängig vom Browserbestand zu sichern. Format, Speichergrenzen und Übertragbarkeit stehen in der [Studio-Anleitung](docs/STUDIO.md), der [Model-Zoo-Anleitung](docs/LOKALER-MODEL-ZOO.md) und der [GLB-Exportanleitung](docs/GLB-EXPORT.md).

## Bild zu 3D und Original-PaKaChi

Ziel: **Bild hineinziehen → 3D-Avatar erzeugen → korrigieren → Bewegungen speichern → per Agent auslösen.** Der namensgebende PaKaChi und ein echter Bild-zu-3D-Lauf haben Vorrang; seine beiden Formen bleiben verbindliche Designvorlagen.

Das Studio besitzt eine Bildauswahl, einen lokalen TripoSR-Aufruf und eine getrennte Ergebnisvorschau mit ausdrücklicher Übernahme. Eine eingerichtete KI-Laufzeit ist dafür erforderlich. Echte CPU-Inferenz für beide Originalformen ist belegt. Designgetreue Geometrie, GPU-Abnahme, anatomisches Rigging und die 3D-Transformation zwischen beiden Formen bleiben offen.

- [Converter einrichten und beide Referenzen verwenden](docs/KI-GENERIERUNG.md)
- [Originalbilder und korrigierter Stilanker](docs/references/README.md)
- [Nächste Aufgaben](docs/ROADMAP.md)

## Anbieter und externe Steuerung

Assistent, 3D-Generator und Rigging-Dienst haben unabhängig wählbare Profile und Routen. Verfügbare Ausführung hängt vom jeweiligen Adapter ab. Der Assistent unterstützt Ollama, LM Studio, passende OpenAI-kompatible Endpunkte und Anthropic; allgemeine Cloud-Generierung und Rigging sind noch keine fertigen Funktionen. [Anbieter einrichten](docs/ANBIETER.md) · [Assistent verwenden](docs/ASSISTENT.md).

Ein Zustand wie `idle`, `talking`, `thinking` oder `working` bleibt bis zur nächsten Anforderung aktiv. Moves sind gespeicherte einmalige oder wiederholte Bewegungen. Verfügbar sind die Fähigkeiten des ausgewählten Avatars.

MQTT und MCP sind zunächst ausgeschaltet. Für lokale Programme und den Zugang über Caddy oder Secure MCP Tunnel den [integrierten MCP-Arbeitsplatz](docs/LOKALE-WERKZEUGE.md) verwenden. Der Python-MCP-Server mit MQTT bleibt als getrennter Steuerungsweg verfügbar. Während der Studio-Bearbeitung werden externe Wiedergabebefehle abgewiesen. [Python-MCP](docs/PYTHON-MCP.md) · [Steuerungsprotokoll](docs/ANSTEUERUNG.md) · [Studio über MCP](docs/MCP-STUDIO.md).

## Entwicklung

```sh
npm run verify
```

Für die zusätzliche Browserprüfung einmalig Chromium installieren und anschließend die vollständige Prüfung starten:

```sh
npx playwright install chromium
npm run verify:full
```

Unter Linux können Systembibliotheken über `npx playwright install --with-deps chromium` erforderlich sein. `npm run preview` zeigt den zuvor gebauten Stand. `npm run generate:avatars` erzeugt ausschließlich Mika und Nori neu.

Prüfergebnisse, CI-Nachweise und offene Abnahmen stehen gesammelt in [docs/PRUEFUNG.md](docs/PRUEFUNG.md). Automatisierte Tests ersetzen keine manuelle Haut-, Bewegungs- oder Bedienabnahme.

## Dokumentation

- [Übersicht und Anleitungen](docs/README.md)
- [Design und Produktziel](docs/Design.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog – vollständige Versionshistorie](docs/CHANGELOG.md)
- [Architektur und Projektformat](docs/ARCHITEKTUR.md)

## Lizenz

Noch nicht festgelegt.
