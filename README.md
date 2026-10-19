# PaKaChi-SM

**SM steht für StateMaschine.** PaKaChi ist die **Panda-KI-Chimera**, das übergeordnete Projekt. PaKaChi-SM vereint Avatar-Player, Model Zoo und das fest integrierte **PaKaChi-Avatar-Studio**.

**Softwarestand: 0.29.0 · Entwicklungsstand, keine fertige Bild-zu-3D-Lösung.**

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

| Bereich | Stand 0.29.0 |
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

Für 0.29.0 sind 165 Tests und der Build bestanden. Die unveränderten Original-Testprogramme wurden zuletzt in 0.9.0 geprüft. Die visuelle WebGL-/Mausabnahme ist wegen der Chromium-Startbeschränkung der bisherigen Ausführungsumgebung noch offen. Die reale Python-MCP-/MQTT-Integration mit Studio-Editor wurde zuletzt in 0.10.0 erfolgreich geprüft. Details und frühere Nachweise stehen im [Prüfstand](docs/PRUEFUNG.md).

## Lizenz

Noch nicht festgelegt.

## Bild zu 3D ausprobieren (0.22.0)

1. TripoSR-Laufzeit einrichten und den [lokalen Generierungsdienst](docs/KI-GENERIERUNG.md#lokaler-generierungsdienst-seit-0210) starten.
2. Optionen → Anbietervorlage **TripoSR (lokal)**: Adresse `http://127.0.0.1:8766`, Modell `triposr`, Dienst-Token eintragen und Profil der Rolle **3D-Generator** zuordnen. Alle anderen Anbieter bleiben erhalten.
3. **Avatar-Studio → Bild → 3D-Entwurf**: PNG/JPEG auswählen oder hineinziehen; „3D-Entwurf erzeugen“ ausdrücklich starten.
4. Getrennte Vorschau drehen/zoomen und entweder verwerfen oder **„Als neuen Avatar laden“** wählen. Der letzte Modellwechsel lässt sich mit **„Modellwechsel zurück“** und **„Modellwechsel wiederholen“** zurücknehmen und wiederholen (seit 0.23.0). Projekte zusätzlich auf Datenträger speichern.

TripoSR liefert bildbasierte Geometrie, kein fertiges Skelett und keine promptgesteuerte Korrektur. Der lokale Dienst muss separat laufen. Generator-Fallbacks erfolgen nur bei fehlgeschlagener Anbieterprüfung vor dem Start. Nach Ausführungsbeginn erfordert der nächste Anbieter einen ausdrücklichen Klick. Die Bedienlogik ist automatisiert geprüft; WebGL-Browserprüfung und tatsächliche GPU-Inferenz sind noch offen.

Der Modellwechsel-Verlauf hält genau einen vorherigen Projektstand in der aktuellen Seitensitzung: Modellbytes, Kontrollpunkte, Entwurfspose, gespeicherte Posen/Moves und Ungespeichert-Markierung. Eine weitere neue Auswahl ersetzt diesen Rücksprungpunkt. Auch zum Original-Bildplayer lässt sich zurückkehren; dessen laufende Animation wird dabei neu gestartet. Der Verlauf überlebt F5 nicht. [Details und Grenzen](docs/STUDIO.md#modellwechsel-zurück-und-wiederholen-0230).

Seit **0.24.0** wird ein neuer 3D-Avatar mit eigener Ansicht, Editor und Wiedergabe vorbereitet, bevor er den bisherigen Stand ersetzt. Fehler bei Vorbereitung oder Übergabe erhalten beziehungsweise restaurieren den alten Editor und seine Steuerungsbindung. Die bisherigen Ressourcen werden erst nach erfolgreichem Wechsel freigegeben. Die gerenderte Browserprüfung bleibt blockiert: Chromium wurde installiert, startet hier jedoch wegen eines verbotenen Socket-Systemaufrufs nicht.

Seit **0.26.0** lassen sich vollständige 3D-Projektkopien im **lokalen Model Zoo** speichern, auswählen, laden und nach Bestätigung löschen. Die browsergebundene Sammlung bleibt nach F5 erhalten; Projektdateien zusätzlich sichern. Kein gemeinsamer Repository-Export oder Cloud-Sync. [Anleitung und Grenzen](docs/LOKALER-MODEL-ZOO.md).

Seit **0.27.0**: **Move exportieren / Move importieren** im Studio. Austausch zwischen identischem Modell und gleicher Gelenkstruktur, neue Posen-IDs statt Überschreiben und ein Undo-Schritt pro Import. [Anleitung und Kompatibilitätsgrenzen](docs/MOVE-DATEIEN.md).

Seit **0.28.0** erscheinen gespeicherte eigene Avatare in der gemeinsamen Auswahl und in `list_avatars`. Ihre gespeicherte ID bleibt beim Laden und in der Player-Steuerung erhalten. Fähigkeiten/Moves werden weiterhin ausschließlich für den geladenen Avatar angeboten. [Lokaler Model Zoo](docs/LOKALER-MODEL-ZOO.md).

Seit **0.29.0** erstellt `npm run export:zoo -- --project DATEI --id AVATAR-ID --output NEUER-ORDNER` ein statisches Model-Zoo-Paket mit vollständigem Studio-Projekt und Katalogeintrag. Bestehende Ordner werden nicht überschrieben; Zusammenführen und Veröffentlichen erfolgen ausdrücklich. [Exportanleitung](docs/MODEL-ZOO-EXPORT.md).
