# PaKaChi-SM

**SM steht für StateMaschine.** PaKaChi ist die **Panda-KI-Chimera**, das übergeordnete Projekt. PaKaChi-SM vereint Avatar-Player, Model Zoo und das fest integrierte **PaKaChi-Avatar-Studio**.

**Softwarestand: 0.70.0 · Entwicklungsstand, keine fertige Bild-zu-3D-Lösung.**

Der bestehende PaKaChi mit Tierform, humanoider Arbeitsform und allen 72 Transformationsbildern ist erhalten und beim Start ausgewählt. Mika und Nori sind separate technische 3D-Testavatare. Ein 3D-Modell des Original-PaKaChi und die Qualitätsabnahme echter KI-Ergebnisse stehen noch aus.

## Schnellstart

Voraussetzungen: **Node.js ab Version 24** und ein aktueller Browser. Die 3D-Ansicht benötigt WebGL2 und Hardwarebeschleunigung. Python ist nur für den Python-MCP-Server erforderlich.

```sh
npm ci
npm run dev
```

Die angezeigte Adresse öffnen, normalerweise `http://127.0.0.1:5173`. Unter Windows startet alternativ **Start-Windows.cmd** die Anwendung und öffnet den Browser. Fehlen die Abhängigkeiten, installiert das Skript sie zunächst; dafür ist Internet nötig. Nach einem Update erneut `npm ci` ausführen. Ein EXE-Installer ist noch nicht vorhanden.

Der archivierte Originalplayer lässt sich auch separat ohne Node öffnen: `public/legacy/pakachi/index.html`.

Seit **0.11.1** dreht die mittlere Maustaste um die Mitte der ganzen Figur, auch nach Zoom zum Mauszeiger und Verschieben des Bildausschnitts.

**0.68.0 auf dem Arbeitsbranch:** Model-Zoo-Speicherfehler sind abgesichert; die [Roadmap](docs/ROADMAP.md) enthält offene Arbeit statt erledigter Versionshistorie. `npm run benchmark:import` misst CPU-Importphasen ([Anleitung](docs/IMPORT-BENCHMARK.md)). Noch keine Übernahme nach `main` oder neue Browserabnahme.

## Überblendung im Player (0.70.0)

Originalclips und Studio-Moves gehen bei unverändertem Grundskelett über 0,18 Animationssekunden ineinander über, auch bei der Rückkehr zur Grundbewegung. Pause und Tempo gelten auch für den Übergang. Seit 0.69.1 läuft die Überblendung bei natürlich beendeten kurzen Clips bis zur vollständigen Endpose weiter; manuelle Pause bleibt davon getrennt. Freie Gesichts-/Oberflächenpunkte werden seit 0.70.0 ebenfalls überblendet; dafür werden die betroffenen Meshes vorübergehend interpoliert. Knochen-/Gewichtsumbauten und Schertransformationen verwenden weiterhin den direkten Wechsel. Seit 0.69.2 enden auch Übergänge zwischen kurzen Originalclips vollständig; Zeitleistensprünge zeigen die gewählte Pose ohne Restgewicht des vorherigen Clips. Im Studio bleibt die Posenbearbeitung exakt, ohne Wiedergabeüberblendung. [Nachweis und Grenzen](docs/PRUEFUNG-0.70.0.md).

## Lokal prüfen

Nach `npm ci` führt `npm run verify` die Node-Tests und den Produktionsbuild aus. `npm run verify:full` führt anschließend zusätzlich alle Chromium-Browserfälle aus; bei einem Fehler stoppt die Kette mit einem Fehlerstatus. Beide Befehle funktionieren ohne GitHub Actions.

Für die vollständige Prüfung einmalig `npx playwright install chromium` ausführen; unter Linux gegebenenfalls `npx playwright install --with-deps chromium` für Systembibliotheken verwenden. Die Installation benötigt Internet, Systembibliotheken können Administratorrechte benötigen. Der Prüfaufruf selbst installiert nichts. HTML-Bericht: `playwright-report/index.html`; Fehlerartefakte: `test-results/`. [Prüfstand und Grenzen](docs/PRUEFUNG.md).

## Korrektur der Körpersteuerung in 0.11.0

Mika/Nori frisch auswählen: Hand ziehen beugt Schulter/Ellenbogen, Fuß ziehen Hüfte/Knie. Rumpf ziehen nimmt den ganzen Körper mit; Hals/Kopf bleiben verbunden. Unter **Griffe → Drehen** kann ein Gelenk direkt mit der Maus ausgerichtet werden. Die mitgelieferten Testmodelle besitzen jetzt Hand-, Knie-, Fuß- und Halsgelenke. Alte Projektdateien behalten ihr eingebettetes Modell; sie erhalten diese neuen Knochen nicht automatisch. [Bedienung und Grenzen](docs/STUDIO.md#verbundener-körper-statt-auseinanderziehen).

## Experimenteller Bild-zu-3D-Testlauf

Seit 0.21.0 ergänzt `npm run serve:generator` einen tokengeschützten lokalen TripoSR-Dienst und einen Adapter für den Auftragskern. Seit 0.22.0 gibt es im Avatar-Studio eine Bildauswahl, getrennte Ergebnisvorschau und ausdrückliche Übernahme; [Einrichtung und Entwicklervertrag](docs/KI-GENERIERUNG.md#lokaler-generierungsdienst-seit-0210).

Seit 0.12.0 gibt es `npm run generate:model` für eine eingerichtete lokale TripoSR-Umgebung: Vorprüfung, Generierungsaufruf und GLB-/Ergebnisbericht. **Noch kein erzeugter Original-PaKaChi in 3D und keine reale Inferenzabnahme.** Hier wurde der Ablauf mit Testdaten geprüft; echte Inferenz ist mangels KI-Laufzeit/GPU offen. [Einrichtung, beide Vorlagen und genaue Prüfgrenzen](docs/KI-GENERIERUNG.md).

## Anbieter und Modelle

Seit **0.20.0** kann das Tresorpasswort geändert und die **Schlüsselsitzung gesperrt** werden. Sperren leert Sitzungsschlüssel und Schlüsselentwürfe, bricht lokales Warten auf Anfragen ab und verwirft Vorschläge. Anbieter, Modelle, Fallbacks und verschlüsselte Ablage bleiben erhalten. Danach lassen sich gespeicherte Schlüssel erneut entsperren. Ungespeicherte Schlüssel gehen beim Sperren verloren.


**Seit 0.18.0:** Mehrere Anbieter-/Modellprofile gleichzeitig einrichten. Jede Rolle hat ein Hauptprofil und eine eigene geordnete Fallback-Liste (↑/↓). Schlüssel und Modellwahl bleiben beim Wechsel erhalten. Mehrere Modelle desselben Anbieters werden als eigene Profile angelegt. Der Assistent versucht bei Anbieterfehlern die ausdrücklich eingetragenen Fallbacks der Reihe nach; Generator-Routen unterstützen seit 0.25.0 automatische Fallbacks ausschließlich vor Ausführungsbeginn; Rigging-Fallbacks bleiben offen. Seit 0.19.0 lassen sich Schlüssel optional verschlüsselt im Browser speichern und nach Neuladen mit einem Tresorpasswort entsperren. [Profile und Fallbacks](docs/ANBIETER.md).


Seit 0.17.1: **Anbietervorlage einsetzen** bietet Anthropic, OpenAI, OpenRouter, DeepInfra, Ollama und LM Studio mit editierbaren Adressen. Eigene Endpunkte bleiben möglich. Die Vorlagen lösen keine Anfrage aus und bestätigen keine Modellfähigkeit.

**Alle drei Rollen sind unabhängig wählbar:** Assistent, 3D-Generator und Rigging-Dienst können jeweils lokal oder in der Cloud laufen. Vorhandene Dienste und eigene Modelle sollen über passende Adapter nutzbar sein. Entscheidend ist die nachgewiesene Aufgabenfähigkeit, nicht der Anbietername.

Seit 0.15.0 können unter **Optionen → KI-Anbieter** Modelllisten von Ollama, LM Studio und OpenAI-kompatiblen Endpunkten ausdrücklich abgerufen werden. API-Schlüssel werden je Profil für die laufende Seitensitzung gehalten. Modelllisten bestätigen noch keine Rollenfähigkeit; Assistentenaufrufe sind seit 0.16.0 verfügbar; Anthropic ist seit 0.17.0 nativ angebunden; OAuth folgt. [Anleitung](docs/ANBIETER.md).

Für die optionale lokale Ollama-Einrichtung: **Ollama-Einrichten.cmd** oder `npm run setup:ollama`. Der Helfer misst RAM, dedizierten VRAM und freien Modellspeicher, bietet passende Kandidaten an und fragt vor Download und Ladetest nach. Eigene Tags bleiben möglich. Der aktuelle kuratierte Satz betrifft Assistentenmodelle; er beschränkt die freie Anbieterwahl für keine Rolle. [Aufgabenbezogene Auswahl und Hardwaregrenzen](docs/LOKALE-MODELLE.md).

Seit **0.16.0** gibt es unterhalb der Agentensteuerung den aufklappbaren **KI-Assistenten**: Aufgabe an das zugeordnete Modell senden, Studio-Metadaten bei Bedarf abfragen lassen und einen konkreten Änderungsvorschlag prüfen. Erst **Übernehmen** führt ihn mit Studio-Freigabe und Revisionsprüfung aus; Undo bleibt verfügbar. Ollama, LM Studio, passende OpenAI-kompatible APIs sowie seit 0.17.0 Anthropic Messages werden unterstützt. Keine Bilder, keine automatische 3D-/Rigging-Ausführung. [Bedienung und Grenzen](docs/ASSISTENT.md).

Seit 0.14.0 besteht zusätzlich der interne [Auftragskern](docs/AUFTRAE.md): feste Anbieterwahl pro Auftrag, Fortschritt, Zeitlimit, Abbruch, Ergebnisprüfung und revisionsgeschützte Übernahme. Seit 0.21.0 verbindet ein lokaler HTTP-Dienst den vorhandenen TripoSR-Wrapper mit einem Fachadapter für diesen Kern. Der Transport ist mit echtem HTTP und einer synthetischen Backend-Ausgabe geprüft; Die Generierungs-/Vorschauoberfläche ist seit 0.22.0 angeschlossen; GPU-Inferenz und visuelle Browserabnahme stehen aus.

## Was aktuell funktioniert

| Bereich | Stand 0.70.0 |
| --- | --- |
| Player | Avatar-Auswahl, tatsächliche Bewegungen anzeigen, abspielen, pausieren, Tempo und Abspielposition ändern. |
| Modelle | Mika/Nori mit Skeletten und Clips; eigene eigenständige GLB-Dateien laden oder hineinziehen, bis 50 MiB, lokal für die Sitzung. |
| Studio | Genau zwei Modi: **Figur bewegen** und **Gelenke bearbeiten**. Skelettgriffe, frei platzierbare Gesichtspunkte, individuelle Größe und Einflussradius. |
| Verbindungen | Gesamtes vorhandenes Skelett automatisch als Linien anzeigen; Gelenkketten beim Ziehen beugen, statt Knochen auseinanderzuziehen. Freie Gesichtspunkte separat gruppieren. |
| Bewegungen | Posen, Zeitabstände, Vorschau, eigene Moves und Gesamtverschiebung/-drehung/-skalierung der Figur – auch ohne Skelett. Rückgängig/Wiederholen. |
| Projekte | Neu, Laden und Speichern als `.pakachi.json` mit eingebettetem Modell, Arbeitspose, Kontrollpunkten, Posen und Moves. |
| Agenten | Gemeinsame StateMaschine für manuelle Bedienung, optionales MQTT und MCP; acht Tools für Player und freigegebenes Studio. |
| Bewegungsprüfung | Betroffene Posen/Moves nach Änderungen an Drehpunkten, Oberflächenpunkten oder Einflussradien markieren, anzeigen und manuell als geprüft bestätigen. |
| Optionen | Deutsch/English, invertierbare mittlere Maustaste sowie lokale Anbieterprofile mit unabhängiger Rollenzuordnung; Modelllisten und Assistent mit überprüfbaren Änderungsvorschlägen. |

Die Erkennungsbuttons lesen vorhandene Skelettdaten. Sie erzeugen noch kein anatomisches Skelett aus einer ungeriggten Figur. Bei Skelettpunkten entfernt „Löschen“ den Editorgriff, nicht den Quellknochen.

## Erste eigene Bewegung

1. Einen 3D-Avatar auswählen oder eine GLB-Datei laden; **Avatar-Studio** öffnen.
2. In **Figur bewegen** einen Punkt ziehen oder **Gesamte Figur bewegen** auswählen.
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

Seit 0.9.0 kann MCP mit zusätzlicher Freigabe auch Punkte, Verbindungen, Posen und Moves im Studio bearbeiten. [Anleitung und Befehle](docs/MCP-STUDIO.md). Während der Bearbeitung werden externe Zustands-/Move-Befehle abgewiesen. Nach einmaligen Studio-Moves kehrt die Figur zur Grundbewegung zurück. Nur Originalclips untereinander werden überblendet; der Wechsel zu eigenen Moves erfolgt direkt.

## Dateien und Grenzen

GLB-Importe bleiben in der Browsersitzung. **Projekte herunterladen, um die Arbeit dauerhaft zu sichern.** Es gibt keine automatische Projektspeicherung und keinen automatischen Eintrag in den gemeinsamen Model Zoo. Eigene Moves bleiben im Projekt erhalten und können seit 0.27.0 zusätzlich als einzelne `.pakachi-move.json`-Dateien ausgetauscht werden; ein verwalteter gemeinsamer `moves/`-Ordner bleibt offen.

Ältere Projektdateien bleiben lesbar. Dateien mit Gesamtpositionsspur benötigen mindestens 0.6.0, mit Gesamtdrehung mindestens 0.8.0, mit Skalierung mindestens 0.10.0. Ältere Versionen ignorieren die Skalierung. Ein Projekt ist kein GLB-Export.

Offen sind insbesondere echte Bild-zu-3D-Inferenz-/Qualitätsabnahme, anatomische KI-Erkennung, vollständiger Knochenumbau und Hautgewichte, anatomische Winkelgrenzen, Ganzkörper-IK und Modelloptimierung. Originalplayer, Modellbeschreibungen und einige technische Meldungen sind noch nicht vollständig englisch lokalisiert.

Das Ziel bleibt: **Bild hineinziehen → 3D-Avatar erzeugen → korrigieren → Bewegungen speichern → per Agent auslösen.** Bildimport und lokaler Generierungsaufruf mit Vorschau sind seit 0.22.0 implementiert. Rigging und echte Inferenz-/Qualitätsabnahme bleiben offen. Der Original-Bildstand hat bekannte Proportions- und Materialschwankungen; [Referenzen und korrigierter Stilanker](docs/references/README.md) sind erhalten.

## Dokumentation

- [Blaupause und Dokumentationsübersicht](docs/README.md)
- [Designdokument: Produktziel und Anforderungen](docs/Design.md)
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

Für 0.66.0 sind 286 Tests, Build und alle 21 Chromium-Browserfälle bestanden. Die unveränderten Original-Testprogramme wurden zuletzt in 0.9.0 geprüft. Die manuelle WebGL-/Mausabnahme bleibt offen; automatisierte Browserprüfungen laufen auf GitHub. Die reale Python-MCP-/MQTT-Integration mit Studio-Editor wurde zuletzt in 0.10.0 erfolgreich geprüft. Details und frühere Nachweise stehen im [Prüfstand](docs/PRUEFUNG.md).

## Lizenz

Noch nicht festgelegt.

## Bild zu 3D ausprobieren (0.22.0)

1. TripoSR-Laufzeit einrichten und den [lokalen Generierungsdienst](docs/KI-GENERIERUNG.md#lokaler-generierungsdienst-seit-0210) starten.
2. Optionen → Anbietervorlage **TripoSR (lokal)**: Adresse `http://127.0.0.1:8766`, Modell `triposr`, Dienst-Token eintragen und Profil der Rolle **3D-Generator** zuordnen. Alle anderen Anbieter bleiben erhalten.
3. **Avatar-Studio → Bild → 3D-Entwurf**: PNG/JPEG auswählen oder hineinziehen; „3D-Entwurf erzeugen“ ausdrücklich starten.
4. Getrennte Vorschau drehen/zoomen und entweder verwerfen oder **„Als neuen Avatar laden“** wählen. Der letzte Modellwechsel lässt sich mit **„Modellwechsel zurück“** und **„Modellwechsel wiederholen“** zurücknehmen und wiederholen (seit 0.23.0). Projekte zusätzlich auf Datenträger speichern.

TripoSR liefert bildbasierte Geometrie, kein fertiges Skelett und keine promptgesteuerte Korrektur. Der lokale Dienst muss separat laufen. Generator-Fallbacks erfolgen nur bei fehlgeschlagener Anbieterprüfung vor dem Start. Nach Ausführungsbeginn erfordert der nächste Anbieter einen ausdrücklichen Klick. Die Bedienlogik ist automatisiert geprüft; WebGL-Browserprüfung und tatsächliche GPU-Inferenz sind noch offen.

Der Modellwechsel-Verlauf hält genau einen vorherigen Projektstand in der aktuellen Seitensitzung: Modellbytes, Kontrollpunkte, Entwurfspose, gespeicherte Posen/Moves und Ungespeichert-Markierung. Eine weitere neue Auswahl ersetzt diesen Rücksprungpunkt. Auch zum Original-Bildplayer lässt sich zurückkehren; dessen laufende Animation wird dabei neu gestartet. Der Verlauf überlebt F5 nicht. [Details und Grenzen](docs/STUDIO.md#modellwechsel-zurück-und-wiederholen-0230).

Seit **0.24.0** wird ein neuer 3D-Avatar mit eigener Ansicht, Editor und Wiedergabe vorbereitet, bevor er den bisherigen Stand ersetzt. Fehler bei Vorbereitung oder Übergabe erhalten beziehungsweise restaurieren den alten Editor und seine Steuerungsbindung. Die bisherigen Ressourcen werden erst nach erfolgreichem Wechsel freigegeben. Die automatisierte gerenderte Browserprüfung läuft seit 0.44.0 erfolgreich auf GitHub. Lokal verhindert weiterhin ein verbotener Socket-Systemaufruf den Chromium-Start; die manuelle Maus-/Darstellungsabnahme bleibt offen.

Seit **0.26.0** lassen sich vollständige 3D-Projektkopien im **lokalen Model Zoo** speichern, auswählen, laden und nach Bestätigung löschen. Die browsergebundene Sammlung bleibt nach F5 erhalten; Projektdateien zusätzlich sichern. Kein gemeinsamer Repository-Export oder Cloud-Sync. [Anleitung und Grenzen](docs/LOKALER-MODEL-ZOO.md).

Seit **0.27.0**: **Move exportieren / Move importieren** im Studio. Austausch zwischen identischem Modell und gleicher Gelenkstruktur, neue Posen-IDs statt Überschreiben und ein Undo-Schritt pro Import. [Anleitung und Kompatibilitätsgrenzen](docs/MOVE-DATEIEN.md).

Seit **0.28.0** erscheinen gespeicherte eigene Avatare in der gemeinsamen Auswahl und in `list_avatars`. Ihre gespeicherte ID bleibt beim Laden und in der Player-Steuerung erhalten. Fähigkeiten/Moves werden weiterhin ausschließlich für den geladenen Avatar angeboten. [Lokaler Model Zoo](docs/LOKALER-MODEL-ZOO.md).

Seit **0.29.0** erstellt `npm run export:zoo -- --project DATEI --id AVATAR-ID --output NEUER-ORDNER` ein statisches Model-Zoo-Paket mit vollständigem Studio-Projekt und Katalogeintrag. Bestehende Ordner werden nicht überschrieben; Zusammenführen und Veröffentlichen erfolgen ausdrücklich. [Exportanleitung](docs/MODEL-ZOO-EXPORT.md).

Seit **0.30.0** führt `npm run merge:zoo -- --base public --package /pfad/avatar-paket --output /pfad/neuer-katalog` zwei Kataloge zusammen. Der neue Ausgabeordner enthält die referenzierten Modelle/Projekte und einen Prüfbericht; Quellen und bestehende Ordner bleiben unverändert. [Anleitung und Grenzen](docs/MODEL-ZOO-EXPORT.md).

Seit **0.31.0** lädt das Studio eine gemeinsame Move-Sammlung über **Sammlung laden → Aus Sammlung importieren**. `npm run export:moves -- --project DATEI --output NEUER-ORDNER` exportiert alle eigenen Studio-Moves eines Projekts als `moves/`-Paket. Die Anwendung startet mit leerer Sammlung. [Einrichtung und Bedienung](docs/MOVE-SAMMLUNG.md).

Seit **0.32.0** führt `npm run merge:moves -- --base public --package /pfad/move-paket --output /pfad/neue-sammlung` zwei Move-Sammlungen in einem neuen Ordner zusammen. Strukturprüfung, Konfliktabweisung und Dateiprüfsummen sind enthalten. [Anleitung](docs/MOVE-SAMMLUNG.md#sammlungen-zusammenführen).

Seit **0.33.0** lassen sich im Modus **Gelenke bearbeiten** am Ellenbogen-/Kniepunkt **IK-Beugegrenzen** einstellen. Sie begrenzen das Ziehen des Endpunkts einer verbundenen Zweiglied-Kette, ohne Knochen zu strecken. Gespeicherte Moves und direkte Drehung bleiben unverändert. [Bedienung und Grenzen](docs/STUDIO.md#ik-beugegrenzen-0330).

Seit **0.34.0** prüft **Beugegrenzen der Pose prüfen** eine ausgewählte gespeicherte Pose. Der Bericht zeigt Winkel, Grenzverletzungen und nicht auswertbare Ketten, ohne Projekt oder aktuelle Pose zu ändern. Zwischenbilder und Kollisionen bleiben ungeprüft. [Bedienung](docs/STUDIO.md#gespeicherte-pose-prüfen-0340).

Seit **0.35.0** prüft **Beugegrenzen der Bewegung prüfen** eigene Studio-Moves mit 16 Stichprobenschritten je Übergang, einschließlich Schleifenrückweg. Der abbrechbare Bericht zeigt Winkelbereich und ersten auffälligen Zeitpunkt. Kein lückenloser Nachweis oder automatische Korrektur. [Anleitung](docs/STUDIO.md#bewegung-stichprobenartig-prüfen-0350).

Seit **0.36.0** öffnet **Auffälliges Bild ansehen** eine pausierte Vorschau direkt aus dem Bewegungsbericht. Stopp stellt die vorherige Bearbeitungspose wieder her; **Prüfbild als neue Pose übernehmen** legt ausdrücklich eine rückgängig machbare Pose an. [Anleitung](docs/STUDIO.md#prüfbilder-ansehen-und-übernehmen-0360).

Seit **0.37.0** lässt sich die **Posenfolge dieser Bewegung** im Studio bearbeiten: einzelne Vorkommen verschieben/entfernen und oben ausgewählte Posen einfügen oder als Ersatz einsetzen. Jede Änderung unterstützt Undo/Redo. [Anleitung](docs/STUDIO.md#bestehende-posenfolge-bearbeiten-0370).


Seit **0.38.0** können Assistent und MCP-Clients bestehende Posenfolgen auslesen und mit `update_move` ändern. Freigabe, Revisionsprüfung und Undo gelten auch hier. [MCP-Anleitung](docs/MCP-STUDIO.md#bestehende-sequenzen-ab-0380).


Seit **0.39.0** lädt die Anthropic-Modellauswahl Folgeseiten automatisch nach. Gemeinsamer Timeout, Größen-/Seitengrenzen und Cursorprüfung verhindern unvollständige oder endlose Abfragen. Eigene Modell-IDs bleiben frei eintragbar. [Anbieter](docs/ANBIETER.md).


Seit **0.40.0** kann ein Assistentenvorschlag mehrere bestehende Bewegungsfolgen gemeinsam ändern: eine Bestätigung, eine Revision und ein Undo-/Redo-Schritt. Ungültige Teiländerungen weisen das ganze Paket ab. [MCP-Anleitung](docs/MCP-STUDIO.md#gemeinsame-sequenzänderungen-ab-0400).


Seit **0.41.0** zeigt der Assistent vorgeschlagene Posenfolgen zusätzlich als **Vorher-/Nachher-Vergleich** mit Bewegungs- und Posennamen an. Die lokale Ansicht berücksichtigt alle betroffenen Moves und sperrt veraltete Vorschläge. Sie ist ein Reihenfolgevergleich, keine animierte Vorschau.


Seit **0.42.0** lassen sich KI-Sequenzvorschläge vor der Übernahme am Studio-Modell abspielen: **Vorher abspielen**, **Nachher abspielen** und **Vorschau beenden**. Die Vorschau verändert keine gespeicherten Moves; Stoppen und Übernehmen stellen zuerst die vorherige Bearbeitungspose wieder her. Die visuelle Browserabnahme bleibt offen.


Seit **0.43.0** ist ein [GitHub-Actions-Prüflauf](.github/workflows/verify.yml) für Tests, Build und Chromium vorbereitet. Sieben Browserfälle umfassen Originalplayer, 3D/Studio, Generierung mit simuliertem Dienst und die KI-Sequenzvorschau. Berichte und Fehler-Traces werden als `browser-evidence` aufbewahrt. Lokal: `npx playwright install --with-deps chromium`, dann `npm run test:e2e`. **Historischer Stand 0.43.0; automatisierte Chromium-Prüfungen bestehen inzwischen auf GitHub.** In der bisherigen Umgebung blockiert `socket() failed: Operation not permitted` den Chromium-Start.


**Browserbefund 0.44.0:** Der erste echte GitHub-Chromium-Lauf besteht Original-Transformation und KI-Sequenzvorschau, meldet aber fünf weitere Fehler. Korrigiert sind die veraltete Beschriftung beim Originalwechsel und die verlangsamte Animation bei niedriger Bildrate. Der [Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209) besteht **alle sieben Chromium-E2E-Fälle**, zusätzlich zu 235 Tests und Build. Die manuelle Maus-/UI-Abnahme bleibt offen. [Prüfbericht](docs/PRUEFUNG-0.44.0.md).


Seit **0.45.0** aktualisiert sich die lokale Avatar-Liste auch in anderen geöffneten Tabs nach Speichern oder Löschen. Beim erneuten Fensterfokus wird sie ebenfalls nachgeladen. Der aktuell geladene Avatar wird dadurch nicht ausgetauscht. Alle neun Chromium-Browserfälle einschließlich F5-Persistenz und mehrerer Tabs sind bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987)).

Seit **0.46.0** ergänzt ein Browserfall die Prüfung des Move-Dateiaustauschs: Download, Dateiauswahl, konfliktfreier Import, wiederholte Posen, Wiedergabe, Undo/Redo und Ablehnung einer unpassenden Modellbindung. 237 Tests, Build und alle zehn Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594)).

Seit **0.47.0** lassen sich im Modus „Gelenke bearbeiten“ echte Zwischengelenke einfügen: Endpunkt einer vorhandenen Knochenstrecke auswählen → „Knochen dazwischen einfügen“. Das Studio ergänzt den Knochen in der Mitte, verbindet beide Teilstrecken und verteilt vorhandene Hautgewichte um. Danach lässt sich das Gelenk verschieben und posieren. Die Änderung wird mit dem Projekt gespeichert und ist als ein Schritt rückgängig machbar. Freies Erzeugen eines ganzen Skeletts und beliebiges Löschen von Quellknochen bleiben offen. Projekte mit Zwischengelenken benötigen mindestens Version 0.47.0.

242 Tests, Build und alle elf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)).

Seit **0.48.0** entfernt „Gelenke bearbeiten → Knochen wirklich löschen“ den ausgewählten Knochen aus Hierarchie und Skinning-Palette. Kindgelenke und Hautgewichte gehen an seinen Elternknochen; gespeicherte Kindposen werden umgerechnet und alle Posen zur Prüfung markiert. Undo/Redo und Projektdateien erhalten die vollständige Änderung. Wurzelknochen, Knochen mit eigener Skalierung oder angehängten Nicht-Knochen-Objekten werden abgewiesen. Diese Version sperrte weiteres Einfügen nach Löschungen; die Sperre entfällt mit 0.49.0. Projekte mit Knochenlöschungen benötigen Version 0.48.0 oder neuer.

Seit **0.49.0** können Knochen abwechselnd gelöscht und wieder eingefügt werden, ohne vorherige Löschungen rückgängig zu machen. Die Projektdatei und der Katalogexport erhalten die Reihenfolge; Undo/Redo behandelt weiterhin jeden Eingriff einzeln. Gemischte Abläufe benötigen mindestens 0.49.0. 248 Tests, Build und alle zwölf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)).


## Knochenbearbeitung durch Agenten (0.50.0)

Seit **0.50.0** unterstützen `edit_studio` und der integrierte Assistent zwei weitere Aktionen: `insert_bone` mit der ID des Kindknochens fügt ein echtes Zwischengelenk mittig ein; `delete_bone` entfernt den angegebenen Knochen und überträgt Kinder und Gewichte an seinen Elternknochen. `delete_point` entfernt weiterhin nur den Griff. Zuerst `get_studio` mit `section: points` lesen, dann im Rig-Modus mit aktueller Sitzung/Revision und erteilter Bearbeitungsfreigabe arbeiten. Der integrierte Assistent legt Änderungen weiterhin zur ausdrücklichen Übernahme vor. Jeder Eingriff ist über Undo/Redo rückgängig machbar; vorhandene Posen danach prüfen. Die Schutzregeln für Wurzeln, skalierte Knochen und Anbauteile bleiben bestehen.

249 Tests und Build bestanden; Node-MCP-Transport mit beiden Aktionen geprüft. Python-Modell und Werkzeugbeschreibung erweitert, Syntax geprüft. Keine neue reale Python-MCP-/Anbieterabnahme; der [CI-Lauf für 0.50.0](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771) ist erfolgreich.


**0.51.0:** Zwei Chromium-Fälle für Assistenten-Vorschlag → ausdrückliche Übernahme → Undo bei `insert_bone` und `delete_bone`. Sie prüfen unveränderte Revision/Geometrie vor Zustimmung und Wiederherstellung der Gelenkdaten nach Undo. Antworten des Anbieters sind simuliert. 249 Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40113222944)). Der vorherige Stand 0.50.0 besteht seine [CI-Prüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771).


**0.52.0:** Zwischengelenke lassen sich über einen Mausregler bei 10–90 % der vorhandenen Knochenstrecke einfügen (vom Elternknochen zum ausgewählten Kind; Standard 50 %). Assistent und beide MCP-Server unterstützen dafür optional `ratio`. Vorhandene Posen, Gewichtsverteilung, Projektpersistenz und Undo/Redo bleiben berücksichtigt. 251 Node-Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40134452209)). Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.


**0.53.0:** Vorhandene Knochen lassen sich im Modus „Gelenke bearbeiten“ einem anderen Elternknochen zuordnen. Grundstellung, gespeicherte Einzelposen und aktuelle Pose werden umgerechnet; Hautgewichte bleiben beim jeweiligen Knochen. Undo/Redo, gemischte Umbaufolgen, Projekt-/Katalogexport und die Aktion `reparent_bone` für Assistent/MCP sind enthalten. `get_studio` liefert `parentBone` und `parentId`. 256 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40138951275)).

Nur innerhalb desselben Skelettbaums; Wurzeln, Kreise, skalierte Knochenketten und Knochen mit direkten Nicht-Knochen-Anbauteilen werden abgewiesen. Gespeicherte Einzelposen bleiben erhalten, interpolierte Bewegungswege können sich ändern und werden zur Prüfung markiert. Keine automatische anatomische Bewertung oder neue reale Anbieter-/Python-Host-Abnahme.


**0.54.0:** Knochen mit starren Anbauteilen können umgehängt werden. Auch verschachtelte starre Objektgruppen mit eigener Drehung und Skalierung bleiben am Knochen befestigt; Grundstellung und gespeicherte Einzelposen behalten ihre Welttransformationen. Anbauteile mit eigenen Knochen oder SkinnedMesh bleiben ausgeschlossen. Löschen eines Knochens mit Anbauteilen ist weiterhin gesperrt. 258 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40184399914)).


**0.55.0:** Oberflächen-Einfluss eines Knochens lässt sich anteilig auf einen anderen übertragen. Mengenregler, Undo/Redo, Projekt-/Katalogpersistenz, gemischte Knochenänderungen und `transfer_weights` für Assistent/MCP sind vorhanden. Die Grundgeometrie bleibt erhalten; Posen werden mit `skin-weights` zur Prüfung markiert. 264 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40217823978)).

Die Übertragung betrifft alle Vertices mit Quellgewicht, ohne räumlichen Malpinsel. Bei mehr als vier Einflüssen bleiben die vier stärksten, anschließend auf Summe 1 normalisiert; dadurch kann der effektive Anteil vom Reglerwert abweichen. Fehlende Zielpaletten, leere Quellen und ungültige Werte werden ohne bleibende Änderung abgewiesen. Manuelle Haut-/Bewegungsqualität und reale Anbieterabnahme bleiben offen.


**0.56.0:** Hautgewichtsübertragungen können auf einen kugelförmigen Bereich um das Quellgelenk begrenzt werden. Radius per Mausregler; Stärke nimmt zum Rand weich auf null ab. Außerhalb bleiben Gewichte unverändert. Assistent/MCP unterstützen optional `region: {center, radius}`; Projekt-/Katalogexport erhalten den Bereich. 266 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40219939990)).

Der Bereich bezieht sich auf normalisierte Weltkoordinaten der ursprünglichen Grundpose, unabhängig von der aktuellen Figurpose. Die Oberfläche nutzt den gespeicherten Gelenkpunkt als Mittelpunkt; API-Aufrufe können einen eigenen Mittelpunkt setzen. Noch kein kontinuierlicher Malpinsel oder sichtbare Bereichsvorschau. Höchstens vier normalisierte Einflüsse pro Vertex; manuelle Hautqualität und echte Anbieterabnahme bleiben offen.


**0.57.0:** Die räumlich begrenzte Gewichtsübertragung zeigt eine Vorschau im Studio: grüne Außenringe markieren den Radius, orange Innenringe die halbe Stärke. Sie folgt Auswahl, Radius und bearbeitetem Gelenkpunkt und wird im Posenmodus sowie außerhalb des Studios ausgeblendet. Die Vorschau verändert weder Projekt noch Undo-Verlauf. 268 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40253220224)).

Die Ringe zeigen den räumlichen Bereich in der ursprünglichen Grundpose, nicht die tatsächlich gewichteten Vertices. Kontinuierlicher Gewichtspinsel und farbige Darstellung der Hautgewichte bleiben offen. Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.

## Freie Knochenabzweigungen

**0.58.0:** Neue Knochen lassen sich als freie Abzweigung an einem ausgewählten Elternknochen platzieren. Verbindung und Skinning-Palette entstehen automatisch; bestehende Hautgewichte bleiben unverändert. Einfluss lässt sich danach gezielt übertragen. Undo/Redo, gespeicherte Posen, Projekt-/Katalogexport und `add_bone` über Assistent/MCP sind berücksichtigt.

271 Node-Tests, Build und alle 18 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40277434553)); Python-Syntax lokal geprüft.

Benötigt einen vorhandenen Elternknochen; kein neues Skelett auf einer ungeriggten Oberfläche. Neue Knochen wirken erst nach Gewichtsübertragung auf die Haut. Skalierte Knochenketten sind ausgeschlossen. Kontinuierlicher Gewichtspinsel, Gewichtsfärbung und manuelle Hautabnahme bleiben offen. Projekte mit freien Knochen benötigen mindestens 0.58.0; ältere Leser lehnen diese Einträge ab.

## Gewichtspinsel

**0.59.0:** Hautgewichte lassen sich mit gedrückter linker Maustaste zwischen zwei ausgewählten Knochen übertragen. Der Pinsel verwendet Radius und Anteil, zeigt den räumlichen Einfluss am aktuellen Treffer und setzt Aufträge mit festem räumlichem Abstand. Ein kompletter Strich ist ein Undo-Schritt; Abbruch und Überschreitung des Übertragungslimits nehmen den ganzen Strich zurück. Währenddessen sind Editor-Eingaben und Agentenänderungen gesperrt.

275 Node-Tests, Build und alle 19 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40280964660)).

Erste Pinselstufe: kugelförmiger Einfluss, auch durch dünne Oberflächen hindurch; keine Beschränkung auf sichtbare Vertices, keine Gewichtsfärbung. Überlappende Aufträge verstärken den Effekt. Höchstens 128 gespeicherte Übertragungen pro Projekt einschließlich Einzelaufträgen; lange Striche können das Limit erreichen. Große Sprünge und fehlende Oberflächentreffer unterbrechen die Verbindung zwischen Aufträgen. Manuelle Hautqualitäts- und Performance-Abnahme bleibt offen.

## Farbige Hautgewichte

**0.60.0:** Die tatsächlichen Hautgewichte des ausgewählten Knochens können farbig angezeigt werden: Blau = 0 %, Grün = 50 %, Rot = 100 %, mit Zwischenfarben. Die Anzeige folgt Auswahl, Gewichtsübertragung, Pinsel und Undo/Redo. Ausschalten, Posenmodus und Verlassen des Studios stellen ursprüngliche Materialien und Vertex-Farben wieder her. Die Ansicht verändert weder Projekt, Revision noch Undo-Verlauf.

277 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40313636231)).

Nur geriggte Oberflächen mit Skinning-Gewichten. Farben werden zwischen Vertices über Dreiecke interpoliert; die Anzeige ist keine Anatomie- oder Qualitätsbewertung. Der bestehende Pinsel bleibt kugelförmig und auf 128 gespeicherte Übertragungen begrenzt. Beschränkung auf sichtbare Vertices, größere Pinselbudgets und manuelle Hautqualitäts-/Performance-Abnahme bleiben offen.

## Größeres Pinselbudget

**0.61.0:** Das gemeinsame Budget für Pinsel- und Einzelübertragungen steigt von 128 auf 1024 Aufträge pro Projekt. Neue Übertragungen werden auf den aktuellen Gewichten berechnet, ohne den bisherigen Verlauf und das Skelett bei jedem Auftrag erneut aufzubauen. Alle betroffenen Oberflächen werden vor der Übernahme geprüft; Fehler hinterlassen keine teilweise geänderten Gewichte. Posen, Skinning-Paletten und bestehende Attribute bleiben während der Übertragung erhalten.

278 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40362549729)). Der Import mit 256 Aufträgen dauerte auf diesem CI-Runner 19,181 Sekunden; weitere Ladezeitoptimierung bleibt offen.

Projekte mit mehr als 128 Gewichtsaufträgen benötigen mindestens 0.61.0. Das Projektformat bleibt Version 1; ältere Leser lehnen das größere Budget ab. Laden und Undo/Redo rekonstruieren weiterhin den gespeicherten Verlauf. Die manuelle Performance-Abnahme großer Modelle bleibt offen; keine pauschale Echtzeit-Zusage. Sichtbare Oberflächen begrenzen den kugelförmigen Pinsel weiterhin nicht.

## Gewichtsverläufe schneller berechnen

**0.62.0:** Die Berechnung langer Gewichtsverläufe verwendet vorberechnete Weltpositionen, wiederverwendete kleine Zahlenfelder und direkte Pufferkopien. Vertices ohne Quellgewicht oder außerhalb des Bereichs werden früh übersprungen. Der Gewichtsvergleich bestätigt dieselben Ergebnisse einschließlich Zusammenführen doppelter Indizes, Sortierung, Normalisierung und Vier-Einfluss-Grenze.

279 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40407457621)). Der Browserimport mit 256 Aufträgen dauerte in diesem Lauf 6822 ms (vorheriger 0.61.0-Lauf: 19181 ms). Einzelmessungen auf CI-Runnern, keine allgemeine Laufzeitgarantie.

Das Budget bleibt bei 1024 Aufträgen. Lokale Messung mit 256 Aufträgen: 1626/1471/1551 ms für den reinen Rig-Reset (Median 1551 ms); vorherige Vergleichsmessung 6375/5903/5718 ms. Dies ist kein vollständiger Browserimport und keine allgemeine Echtzeit-Zusage. Vorberechnete Weltpositionen benötigen 24 Byte pro Vertex statt zuvor 12 Byte für die Positionskopie. Beschränkung des Pinsels auf sichtbare Oberflächen und manuelle Prüfung großer Modelle bleiben offen.

## Pinsel mit Sichtprüfung

**0.63.0:** Die optionale Checkbox „Pinsel nur auf sichtbare Oberfläche“ begrenzt Gewichtsaufträge auf geometrisch sichtbare Vertices im Blickfeld. Eine räumliche Suchstruktur prüft Verdeckung durch andere Dreiecke. Die Kamera wird pro Strich festgehalten und mit den Aufträgen gespeichert; Projekt-/Katalogexport und Undo/Redo reproduzieren die Auswahl. Assistent/MCP können `region.view` aus `get_studio.view` übernehmen.

281 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40529588502)); Python-Syntax lokal geprüft. Der Browserimport mit 256 sichtgefilterten Aufträgen dauerte in diesem Lauf 8909 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Sichtprüfung bezieht sich auf die ursprüngliche Grundpose. Dreiecke gelten beidseitig als undurchsichtige Hindernisse; Transparenz, Alpha-Ausschnitte und Materialgruppen-Sichtbarkeit werden nicht ausgewertet. Die erste Sichtprüfung baut eine Suchstruktur auf und benötigt zusätzlichen Speicher; große Modelle sind noch nicht manuell abgenommen. Ohne Checkbox gilt weiterhin der kugelförmige Pinsel. Projekte mit `region.view` benötigen mindestens 0.63.0.


## Material-Sichtbarkeit des Gewichtspinsels

**0.64.0:** Neue sichtgefilterte Pinselstriche berücksichtigen ausgeblendete Materialien und Materialgruppen sowie transparente Materialien mit Opazität 0. Die ursprünglichen Materialeigenschaften werden beim Laden festgehalten; eine temporäre Gewichtsfärbung verändert die Auswahl nicht. `region.view.materials: true` speichert diese Regel. Ohne das Feld gilt weiterhin die geometrische Sichtprüfung aus 0.63.0, damit alte Verläufe unverändert bleiben.

282 Node-Tests, Produktionsbuild und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40542963343)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 6254 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Teiltransparente Materialien und Alpha-Texturen gelten weiterhin als undurchsichtige Hindernisse; Dreiecke bleiben beidseitig. Große Modelle und Materialdarstellung sind noch nicht manuell abgenommen. Dateien mit dem neuen Feld benötigen mindestens 0.64.0.


## Alpha-Ausschnitte im Gewichtspinsel

**0.65.0:** Neue sichtgefilterte Pinselstriche berücksichtigen Alpha-Ausschnitte über `alphaTest`, Bildalpha und den Grünkanal einer `alphaMap`. Die Prüfung interpoliert UVs am Strahltreffer und berücksichtigt Texturtransformation, UV-Kanal, Wiederholung, Spiegelung, Flip und Nearest-/Linear-Vergrößerungsfilter. Pixel und Materialdaten werden beim Laden festgehalten. `region.view.alpha: true` zusammen mit `materials: true` speichert die neue Regel; ältere Aufträge behalten ihre bisherige Sichtprüfung.

285 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40545759919)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 8998 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Die Alpha-Prüfung verwendet deterministisch die Basisebene der Textur, keine Mipmaps oder anisotrope Filterung. Dadurch sind Abweichungen zur gerenderten Kante bei Verkleinerung möglich. Unterstützt sind lesbare RGBA-8-Bit-Bilder bis 16.777.216 Pixel pro Textur. Nicht lesbare/komprimierte Texturen, fehlende UVs, Shader-Materialien und Alpha-to-Coverage bleiben verdeckend. Teiltransparenz wird nicht simuliert; Dreiecke bleiben beidseitig. GPU-/Materialqualität und große Modelle sind nicht manuell abgenommen. Neue Alpha-Aufträge benötigen mindestens 0.65.0; kein automatischer Umbau alter Verläufe.


## Speicherbedarf der Sichtprüfung

**0.66.0:** Der Sichtfilter kopiert nur UV-Kanäle, die tatsächlich von unterstützten Alpha-Materialien benötigt werden. Undurchsichtige Dreiecke erhalten keine eigenen UV-Vektoren. Die Sichtregeln und gespeicherten Projekte bleiben unverändert. `npm run benchmark:visibility` misst synthetische Flächen mit 5.000/20.000/80.000 Dreiecken, jeweils undurchsichtig und mit Alpha-Ausschnitt; jeder Fall läuft in einem eigenen Prozess.

286 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40665412491)). Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 4758 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Lokale Einzelmessung bei 80.000 Dreiecken: zurückbehaltener JavaScript-Heap einschließlich Testmodell von 166,10 auf 64,85 MiB (undurchsichtig) und 166,12 auf 100,20 MiB (Alpha). Die 1.000 Strahlproben lieferten jeweils dieselben Ergebnisse. Keine Messung des vollständigen Browserimports, Renderings oder Skinning; keine allgemeine Laufzeit-/Speicherzusage. Mipmaps, Teiltransparenz und manuelle Abnahme großer realer Modelle bleiben offen.


## Browserprüfung der Mausnavigation

**0.67.0:** Ein zusätzlicher Browserfall prüft echte Mausrad-, Rechts- und Mitteltastenereignisse im Studio. Nach außermittigem Zoom und Verschieben bleiben beim Drehen Abstand und Bildschirmposition der bekannten Figurenmitte konstant. Der Test wählt die normale und invertierte Drehrichtung über den Optionsdialog, prüft gegensinnige Kamerabewegung und funktionierenden Zoom nach Loslassen. Der übrige Studiozustand einschließlich Revision und Figur bleibt unverändert.

Produktionsbuild lokal bestanden. Neuer Chromium-Nachweis steht aus. Der bisherige bestätigte Stand umfasst 286 Node-Tests und 21 Browserfälle.

Dies ergänzt den automatisierten Navigationsnachweis; tatsächliches Mausgefühl, komplexe Skelett-/Hautqualität und große reale Modelle bleiben manuell zu prüfen. Keine Änderung am Kameraalgorithmus.

## Model-Zoo-Speicherfehler (0.68.0)

Konkrete Hinweise unterscheiden volles Browserkontingent, 50 Kopien und Projekte über 80 MiB. Vorhandene Kopien werden nicht automatisch gelöscht. Scheitert nach bestätigtem Speichern oder Löschen nur die Listenabfrage, bleibt der Erfolg sichtbar. Veraltete Auswahlen können bis zu einer erfolgreichen Aktualisierung weder geladen noch gelöscht werden; „Liste aktualisieren“ bleibt nutzbar. Das aktive Projekt bleibt erhalten.
