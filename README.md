# PaKaChi-SM

**SM steht für StateMaschine.** PaKaChi ist die **Panda-KI-Chimera**, das übergeordnete Projekt. PaKaChi-SM vereint Avatar-Player, Model Zoo und das fest integrierte **PaKaChi-Avatar-Studio**.

**Softwarestand: 0.7.0 · Entwicklungsstand, keine fertige Bild-zu-3D-Lösung.**

Der bestehende PaKaChi mit Tierform, humanoider Arbeitsform und allen 72 Transformationsbildern ist erhalten und beim Start ausgewählt. Mika und Nori sind separate technische 3D-Testavatare. Ein 3D-Modell des Original-PaKaChi und die KI-Generierung stehen noch aus.

## Schnellstart

Voraussetzungen: **Node.js ab Version 24** und ein aktueller Browser. Die 3D-Ansicht benötigt WebGL2 und Hardwarebeschleunigung. Python ist nur für den Python-MCP-Server erforderlich.

```sh
npm ci
npm run dev
```

Die angezeigte Adresse öffnen, normalerweise `http://127.0.0.1:5173`. Unter Windows startet alternativ **Start-Windows.cmd** die Anwendung und öffnet den Browser. Fehlen die Abhängigkeiten, installiert das Skript sie zunächst; dafür ist Internet nötig. Nach einem Update erneut `npm ci` ausführen. Ein EXE-Installer ist noch nicht vorhanden.

Der archivierte Originalplayer lässt sich auch separat ohne Node öffnen: `public/legacy/pakachi/index.html`.

## Was aktuell funktioniert

| Bereich | Stand 0.7.0 |
| --- | --- |
| Player | Avatar-Auswahl, tatsächliche Bewegungen anzeigen, abspielen, pausieren, Tempo und Abspielposition ändern. |
| Modelle | Mika/Nori mit Skeletten und Clips; eigene eigenständige GLB-Dateien laden oder hineinziehen, bis 50 MiB, lokal für die Sitzung. |
| Studio | Genau zwei Modi: **Figur bewegen** und **Gelenke bearbeiten**. Skelettgriffe, frei platzierbare Gesichtspunkte, individuelle Größe und Einflussradius. |
| Verbindungen | Punkte frei verbinden; jede Verbindung einzeln entfernen; vorhandene Skelettgelenke und Eltern-Kind-Verbindungen per Button erkennen. |
| Bewegungen | Posen, Zeitabstände, Vorschau, eigene Moves und Gesamtverschiebung der Figur – auch ohne Skelett. Rückgängig/Wiederholen. |
| Projekte | Neu, Laden und Speichern als `.pakachi.json` mit eingebettetem Modell, Arbeitspose, Kontrollpunkten, Posen und Moves. |
| Agenten | Gemeinsame StateMaschine für manuelle Bedienung, optionales MQTT und MCP; sechs Tools zur Playersteuerung. |
| Bewegungsprüfung | Betroffene Posen/Moves nach Änderungen an Drehpunkten, Oberflächenpunkten oder Einflussradien markieren, anzeigen und manuell als geprüft bestätigen. |
| Optionen | Deutsch/English für Studio-Bedienelemente und invertierbare mittlere Maustaste; lokal im Browser gespeichert. |

Die Erkennungsbuttons lesen vorhandene Skelettdaten. Sie erzeugen noch kein anatomisches Skelett aus einer ungeriggten Figur. Bei Skelettpunkten entfernt „Löschen“ den Editorgriff, nicht den Quellknochen.

## Erste eigene Bewegung

1. Einen 3D-Avatar auswählen oder eine GLB-Datei laden; **Avatar-Studio** öffnen.
2. In **Figur bewegen** einen Punkt ziehen oder **Gesamte Figur verschieben** auswählen.
3. **Aktuelle Pose speichern**, Figur verändern und mindestens eine weitere Pose speichern.
4. Zeiten, Bewegungsname und eindeutiges Schlagwort festlegen; **Bewegung speichern**.
5. Vorschau prüfen und das Projekt mit **Speichern** herunterladen. Im Player steht der eigene Move anschließend auch für MQTT/MCP bereit.

| Mausbedienung im Studio | Wirkung |
| --- | --- |
| Links auf einem Punkt ziehen | Punkt auf der Ansichtsebene verschieben; farbige Griffe erlauben achsengebundene Änderungen. |
| Mausrad drücken und halten, Maus bewegen | Frei um alle Achsen drehen; Bewegungen am Rand der virtuellen Kugel erlauben Rollen. |
| Rechts ziehen | Ansicht verschieben. |
| Mausrad drehen | Zum Detail zoomen. |

Feste Ansichten und Rolltasten sind zusätzliche Hilfen. Details, Punktverbindungen und Dateigrenzen: [Studio-Anleitung](docs/STUDIO.md).

## Zustände und Agenten

Ein **Zustand** wie `idle`, `talking`, `thinking` oder `working` bleibt aktiv, bis ein neuer Zustand angefordert wird. Ein **Move** ist eine gespeicherte einmalige oder wiederholte Bewegung mit eindeutigem Schlagwort. Verfügbar sind nur die Fähigkeiten des ausgewählten Avatars.

Bevorzugter Agentenweg: **MCP-Host → Python-MCP → MQTT-Broker → geöffneter Player → Rückantwort**. Das Projekt verwendet `mcp==2.3.0` und optional einen eingebetteten `amqtt==0.12.1`. Der Browser startet keinen Broker. MQTT und MCP sind zunächst ausgeschaltet; der Nutzer aktiviert sie ausdrücklich.

- [Python-MCP einrichten](docs/PYTHON-MCP.md)
- [MQTT-Nachrichten, StateMaschine, Browser-API und bisherige Node-Brücke](docs/ANSTEUERUNG.md)

MCP steuert bisher den Player, nicht die Gelenkbearbeitung im Studio. Während der Bearbeitung werden externe Zustands-/Move-Befehle abgewiesen. Nach einmaligen Studio-Moves kehrt die Figur zur Grundbewegung zurück. Nur Originalclips untereinander werden überblendet; der Wechsel zu eigenen Moves erfolgt direkt.

## Dateien und Grenzen

GLB-Importe bleiben in der Browsersitzung. **Projekte herunterladen, um die Arbeit dauerhaft zu sichern.** Es gibt keine automatische Projektspeicherung und keinen automatischen Eintrag in den gemeinsamen Model Zoo. Eigene Moves liegen derzeit in der Projektdatei, nicht in separaten `moves/`-Dateien.

Ältere Projektdateien werden in 0.6.0 gelesen. Neu gespeicherte Dateien mit Gesamtpositionsspur benötigen mindestens 0.6.0. Ein Projekt ist kein GLB-Export.

Offen sind insbesondere Bild-zu-3D, anatomische KI-Erkennung, vollständiger Knochenumbau und Hautgewichte, IK, Modelloptimierung sowie Gesamtrotation/-skalierung als Bewegungsspuren. Originalplayer, Modellbeschreibungen und einige technische Meldungen sind noch nicht vollständig englisch lokalisiert.

Das Ziel bleibt: **Bild hineinziehen → 3D-Avatar erzeugen → korrigieren → Bewegungen speichern → per Agent auslösen.** Der Bildimport und die Generierung sind noch nicht implementiert. Der Original-Bildstand hat bekannte Proportions- und Materialschwankungen; [Referenzen und korrigierter Stilanker](docs/references/README.md) sind erhalten.

## Dokumentation

- [Blaupause und Dokumentationsübersicht](docs/README.md)
- [Designdokument: Produktziel und Anforderungen](docs/KONZEPT.md)
- [Roadmap: umgesetzt, offen und nächste Schritte](docs/ROADMAP.md)
- [Changelog: Versionen und Zeitstempel](docs/CHANGELOG.md)
- [Technische Architektur und Projektformat](docs/ARCHITEKTUR.md)
- [Aktueller Prüfstand und offene Abnahme](docs/PRUEFUNG.md)

## Entwicklung und Prüfungen

```sh
npm test
npm run test:legacy
npm run build
```

`npm run preview` zeigt den zuvor gebauten Stand lokal. `npm run generate:avatars` erzeugt ausschließlich Mika und Nori neu. Python-Integration: [Testeinrichtung](docs/PYTHON-MCP.md#tests).

Für Browserprüfungen in einer Umgebung, in der Chromium startet:

```sh
npx playwright install chromium
npm run test:e2e
```

Für 0.7.0 sind 34 Tests, beide Original-Testprogramme und der Build bestanden. Die visuelle WebGL-/Mausabnahme ist wegen der Chromium-Startbeschränkung der bisherigen Ausführungsumgebung noch offen. Details und frühere Nachweise stehen im [Prüfstand](docs/PRUEFUNG.md).

## Lizenz

Noch nicht festgelegt.
