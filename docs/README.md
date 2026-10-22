# Blaupause – PaKaChi-SM

**Softwarestand: 0.43.0 · Dokumentation abgeglichen am 22.10.2026.**

Die Blaupause besteht aus drei Dokumenten. Das Designdokument beschreibt das Produktziel, die Roadmap die Umsetzung und das Changelog die bereits erfolgten Änderungen.

| Dokument | Zweck |
| --- | --- |
| [Designdokument](Design.md) | Begriffe, Bedienprinzip, Anforderungen und noch offene Produktziele. |
| [Roadmap](ROADMAP.md) | Umgesetzte Funktionen, nächste Arbeitspakete und Abnahmekriterien. |
| [Changelog](CHANGELOG.md) | Historie mit Version, Datum und ISO-8601-Zeitstempel. |

## Aktueller Stand

Player, gemeinsame StateMaschine und der integrierte Studio-Editor sind implementiert. Das Studio kann Gelenk-/Gesichtspunkte bearbeiten, vorhandene Skelettdaten erkennen, Punkte frei verbinden, Posen und Moves speichern sowie die gesamte Figur verschieben, drehen und proportional skalieren – auch ohne Skelett. Seit 0.7.0 kennzeichnet das Studio betroffene Posen und Moves nach Gelenkänderungen mit gespeicherten Prüfhinweisen. Seit 0.11.0 bilden vorhandene Skelettlinien nutzbare Ein-/Zweiglied-Ketten des Körpers; Hand- und Fußziele beugen Gelenke ohne Ablösen, Rumpfbewegung trägt die Figur mit. Freie Gesichtspunktgruppen sind davon getrennt. Genau zwei Bearbeitungsmodi bleiben erhalten: **Figur bewegen** und **Gelenke bearbeiten**.

Das Original-PaKaChi mit beiden Formen und 72 Transformationsbildern bleibt unverändert als Bildplayer erhalten. Mika und Nori prüfen die 3D-Technik; sie ersetzen sein Design nicht. Lokale Bild-zu-3D-Generierung ist angeschlossen; ihre reale Inferenz-/Qualitätsabnahme, anatomische Erkennung ohne vorhandenes Skelett, vollständiger Knochenumbau und das 3D-Modell des Original-PaKaChi sind noch offen. Eine automatisierte Prüfung ist keine visuelle Produktabnahme.

## Anbieterarchitektur und Umsetzung

Das Studio soll als spezialisierter **KI-Harness** den Arbeitsablauf koordinieren. **Assistent, 3D-Generator und Rigging-Dienst** erhalten unabhängig wählbare Anbieter, Modelle und mehrere Verbindungsprofile. Geplant sind Cloud-APIs, offiziell unterstützte OAuth-Anmeldungen und lokale Dienste wie Ollama oder LM Studio über geeignete Adapter. Sprachmodelle koordinieren Werkzeuge; tatsächliche Geometrie und Hautgewichte benötigen passende Fachverfahren.

Seit 0.13.0 sind lokale Anbieterprofile, unabhängige Rollenzuordnung im Optionsmenü und eine interne Adapter-/Fähigkeitsprüfung vorhanden. Seit 0.14.0 ergänzt ein interner Auftragskern Fortschritt, Abbruch, Zeitlimit und eine revisionsgeprüfte Übernahme. Seit 0.15.0 sind Modelllisten-Abfragen mit optionalem Sitzungsschlüssel und ein hardwaregeprüfter Ollama-Einrichtungshelfer vorhanden. Seit 0.16.0 ist der Assistent mit Ollama/OpenAI-kompatibler Inferenz und einzeln bestätigten Studio-Vorschlägen nutzbar. Seit 0.17.0 ergänzt ein nativer Anthropic-Adapter Modelllisten und Assistentenaufrufe mit API-Schlüssel. Seit 0.21.0 besteht ein lokaler TripoSR-HTTP-Dienst samt Auftragsadapter. Seit 0.22.0 sind Bildauswahl und getrennte Generierungsvorschau angeschlossen. OAuth, Cloud-Fachadapter, Rigging sowie reale Inferenz-/Browserabnahme bleiben offen. Lokal oder Cloud ist für ALLE drei Rollen unabhängig wählbar; der Ollama-Katalog schränkt diese Wahl nicht ein. Außerdem bestehen die MCP-Studio-Werkzeuge und der experimentelle TripoSR-Testlauf. [Design und Grenzen](Design.md#11-studio-als-ki-harness-und-freie-anbieterwahl) sowie [Umsetzungsschritte und Abnahme](ROADMAP.md#7-studio-harness-und-anbieteranbindung) sind jetzt Bestandteil der Blaupause.

## Anleitungen und technische Dokumente

| Gesucht | Dokument |
| --- | --- |
| Interner Auftragsablauf und Prüfgrenzen | [Auftragskern](AUFTRAE.md) |
| Anbieterprofile und aktuelle Verbindungsgrenzen | [Anbieter und Modelle](ANBIETER.md) |
| Lokaler KI-Geometrietest, Vorlagen und Prüfgrenzen | [Bild-zu-3D-Testlauf](KI-GENERIERUNG.md) |
| Installation und Schnellstart | [Projekt-README](../README.md) |
| Maussteuerung, Gelenke, Posen, Projekte | [Studio-Anleitung](STUDIO.md) |
| Bevorzugter Agentenweg mit Python und MQTT | [Python-MCP](PYTHON-MCP.md) |
| KI-Bearbeitung von Punkten, Posen und Moves | [Studio über MCP](MCP-STUDIO.md) |
| Befehle, Zustände, Browser-API, Node-Kompatibilität | [Agentensteuerung](ANSTEUERUNG.md) |
| Komponenten, Datenformat und technische Grenzen | [Architektur](ARCHITEKTUR.md) |
| Testergebnisse und offene Abnahme | [Prüfstand](PRUEFUNG.md) |
| Originaldesign und Herkunft der erhaltenen Bilder | [Referenzen](references/README.md) |

Softwareversion, Projektformat und historischer Prüfstand sind unterschiedliche Angaben: Die Software steht auf 0.43.0, das Projektformat weiterhin auf Version 1. Ältere Projekte sind lesbar; Dateien mit Gesamtpositionsspur benötigen Software ab 0.6.0; Gesamtdrehung benötigt mindestens 0.8.0; Skalierung mindestens 0.10.0. Ältere Software ignoriert die neue Skalierung. Historische Prüfberichte behalten ihren damaligen Stand.

[Aufgabenbezogene Modellwahl und lokale Einrichtung](LOKALE-MODELLE.md) · [Prüfbericht 0.15.0](PRUEFUNG-0.15.0.md)

[Assistent verwenden](ASSISTENT.md) · [Prüfbericht 0.16.0](PRUEFUNG-0.16.0.md)

[Prüfbericht 0.17.0](PRUEFUNG-0.17.0.md) · [Anthropic einrichten](ANBIETER.md#anthropic-seit-0170)

**0.18.0:** Gleichzeitig eingerichtete Anbieter-/Modellprofile, unabhängige geordnete Fallbacks für alle Rollen und erhaltene Sitzungsschlüssel. Assistenten-Fallbacks sind implementiert; lokale Generatorausführung kam mit 0.21.0/0.22.0 hinzu, Rigging bleibt offen; seit 0.19.0 gibt es einen optionalen verschlüsselten Schlüsseltresor. [Aktuelle Anbieteranleitung](ANBIETER.md).

**0.19.0:** Passwortgeschützter lokaler Schlüsseltresor mit ausdrücklichem Speichern/Entsperren; keine Klartextschlüssel im Browserspeicher. [Anleitung und Grenzen](ANBIETER.md#optionaler-schlüsseltresor-seit-0190).

**0.20.0:** Tresorpasswortwechsel mit Erhalt des gespeicherten Bestands und ausdrückliche Sitzungssperre einschließlich Anfrageabbruch. [Anleitung](ANBIETER.md) · [Prüfbericht](PRUEFUNG-0.20.0.md).

Die folgenden Einträge beschreiben den jeweiligen Meilenstein; der aktuelle Stand ergibt sich aus Design und Roadmap.

**0.21.0:** Lokaler TripoSR-Dienst und Auftragsadapter; echter HTTP-Transport, synthetisches Backend im Test. Keine GPU-/Qualitätsabnahme und noch keine Generierungsoberfläche. [Einrichtung](KI-GENERIERUNG.md#lokaler-generierungsdienst-seit-0210) · [Prüfbericht](PRUEFUNG-0.21.0.md).

**0.22.0:** Bildauswahl/Drag & Drop, lokale Generierung, getrennte Modellvorschau und ausdrücklicher Import im Studio. Seit 0.23.0 mit separatem Rücksprung für den letzten Modellwechsel. [Bedienung](KI-GENERIERUNG.md#bedienung-im-studio-seit-0220) · [Prüfbericht](PRUEFUNG-0.22.0.md).

**0.23.0:** Letzten Modellwechsel zurücknehmen/wiederholen, vollständige Projektinhalte und Ungespeichert-Markierung erhalten. Ein Rücksprungpunkt im Arbeitsspeicher; keine Wiederherstellung nach F5. [Studio-Anleitung](STUDIO.md#modellwechsel-zurück-und-wiederholen-0230) · [Prüfbericht](PRUEFUNG-0.23.0.md).

**0.24.0:** Vorbereitete 3D-Modellübernahme mit Wiederherstellung von Viewer, Editor, DOM und Steuerungsbindung bei Übergabefehlern. [Prüfbericht](PRUEFUNG-0.24.0.md). 135 Tests bestanden; Chromium installiert, Browserstart durch Socket-Beschränkung blockiert.

[Prüfbericht 0.25.0](PRUEFUNG-0.25.0.md): Generator-Fallbacks nur vor Ausführung, bewusster nächster Auftrag und profilbezogene Schlüssel. 140 Tests und Build bestanden; Browser-/GPU-Abnahme weiterhin offen.

**0.26.0:** Lokaler Model Zoo für vollständige Projektkopien. Browsergebundene IndexedDB-Ablage; echter F5-/Kontingenttest noch offen. [Anleitung](LOKALER-MODEL-ZOO.md) · [Prüfbericht](PRUEFUNG-0.26.0.md).

**0.27.0:** Separate Studio-Move-Dateien mit Modell-/Strukturprüfung, Konfliktbehandlung und Undo/Redo. [Anleitung](MOVE-DATEIEN.md) · [Prüfbericht](PRUEFUNG-0.27.0.md).

**0.28.0:** Gemeinsamer Katalog für Original, mitgelieferte und lokal gespeicherte Avatare. Player und `list_avatars` verwenden dieselbe Auswahl; geladene Kopien behalten ihre ID. [Prüfbericht](PRUEFUNG-0.28.0.md).

**0.29.0:** Statische Katalogprojekte und Exportskript für bearbeitete Avatare inklusive Studio-Moves. Keine automatische Veröffentlichung. [Anleitung](MODEL-ZOO-EXPORT.md) · [Prüfbericht](PRUEFUNG-0.29.0.md).

**0.30.0:** Kataloge in einen neuen Ordner zusammenführen, Konflikte vor dem Schreiben prüfen und Dateiprüfsummen dokumentieren. [Anleitung](MODEL-ZOO-EXPORT.md) · [Prüfbericht](PRUEFUNG-0.30.0.md).

**0.31.0:** Gemeinsame statische Move-Sammlung, CLI-Export und Import im Studio mit Kompatibilitäts-/Revisionsprüfung und Undo. [Anleitung](MOVE-SAMMLUNG.md) · [Prüfbericht](PRUEFUNG-0.31.0.md).

**0.32.0:** Zwei Move-Sammlungen mit Quellenprüfung, Konfliktabweisung und Prüfsummen zusammenführen. [Anleitung](MOVE-SAMMLUNG.md#sammlungen-zusammenführen) · [Prüfbericht](PRUEFUNG-0.32.0.md).

**0.33.0:** Manuelle IK-Beugegrenzen für Zweiglied-Ketten mit Undo, Projekt-/Katalogexport, MCP-Bearbeitung und Posen-Prüfhinweisen. [Studio](STUDIO.md#ik-beugegrenzen-0330) · [Prüfbericht](PRUEFUNG-0.33.0.md).

**0.34.0:** Lesende Beugegrenzenprüfung gespeicherter Einzelposen mit Winkelbericht und klarer Kennzeichnung nicht auswertbarer Ketten. [Studio](STUDIO.md#gespeicherte-pose-prüfen-0340) · [Prüfbericht](PRUEFUNG-0.34.0.md).

**0.35.0:** Abbrechbare Stichprobenprüfung eigener Bewegungen einschließlich Zwischenbildern und Schleifenrückweg. [Studio](STUDIO.md#bewegung-stichprobenartig-prüfen-0350) · [Prüfbericht](PRUEFUNG-0.35.0.md).

**0.36.0:** Direkte pausierte Prüfbildvorschau mit Rückkehr zur Bearbeitungspose und ausdrücklicher Übernahme als neue Pose. [Studio](STUDIO.md#prüfbilder-ansehen-und-übernehmen-0360) · [Prüfbericht](PRUEFUNG-0.36.0.md).

**0.37.0:** Bestehende Move-Posenfolgen per Maus bearbeiten, einschließlich wiederholter Posen und Einbau einer übernommenen Prüfpose. [Studio](STUDIO.md#bestehende-posenfolge-bearbeiten-0370) · [Prüfbericht](PRUEFUNG-0.37.0.md).


**0.38.0:** Bestehende Move-Sequenzen über MCP und Assistent bearbeiten; vollständige Posenverweise auslesen, validierte Änderung mit Undo. [Prüfbericht](PRUEFUNG-0.38.0.md).


**0.39.0:** Paginierte Anthropic-Modelllisten mit gemeinsamem Timeout, Abbruch und vollständiger Ergebnisübernahme. [Prüfbericht](PRUEFUNG-0.39.0.md).


**0.40.0:** Atomare Pakete für mehrere bestehende Move-Sequenzen über Assistent und MCP; vollständige Vorprüfung und gemeinsames Undo/Redo. [Prüfbericht](PRUEFUNG-0.40.0.md).


**0.41.0:** Lesbare Vorher-/Nachher-Ansicht für Sequenzvorschläge, lokal und revisionsgebunden, mit DE/EN-Beschriftung. [Prüfbericht](PRUEFUNG-0.41.0.md).


**0.42.0:** Temporäre animierte Vorher-/Nachher-Vorschau für KI-Sequenzvorschläge mit Wiederherstellung der Bearbeitungspose. [Prüfbericht](PRUEFUNG-0.42.0.md).


**0.43.0:** Reproduzierbarer GitHub-Actions-Browserlauf und E2E-Szenario für Sequenzvorschläge vorbereitet; lokale Chromium-Ausführung weiterhin blockiert. [Prüfbericht](PRUEFUNG-0.43.0.md).
