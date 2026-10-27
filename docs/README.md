# Blaupause – PaKaChi-SM

**Softwarestand: 0.64.0 · Dokumentation abgeglichen am 27.10.2026.**

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

Softwareversion, Projektformat und historischer Prüfstand sind unterschiedliche Angaben: Die Software steht auf 0.63.0, das Projektformat weiterhin auf Version 1. Ältere Projekte sind lesbar; Dateien mit Gesamtpositionsspur benötigen Software ab 0.6.0; Gesamtdrehung benötigt mindestens 0.8.0; Skalierung mindestens 0.10.0. Ältere Software ignoriert die neue Skalierung. Historische Prüfberichte behalten ihren damaligen Stand.

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


**0.44.0:** Erste echte CI-Browserbefunde ausgewertet; Original-Metadaten und bildratenabhängige Animationsverlangsamung korrigiert. [Prüfbericht](PRUEFUNG-0.44.0.md).

**Browsernachweis 0.44.0:** [Alle sieben Chromium-E2E-Fälle bestanden](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209), einschließlich Sequenzvorschau, Übernahme/Undo und Modellwechsel-Rücksprung.


**0.45.0:** Automatische Aktualisierung der lokalen Avatar-Sammlung zwischen Tabs; Alle neun Chromium-Fälle einschließlich F5-Persistenz und mehrerer Tabs bestanden. [Prüfbericht](PRUEFUNG-0.45.0.md).

**0.46.0:** Move-Dateiaustausch einschließlich Wiedergabe und Undo/Redo im Browser nachgewiesen; alle zehn Chromium-Fälle bestanden. [Prüfbericht](PRUEFUNG-0.46.0.md).

**0.47.0:** Echte Zwischengelenke mit Hautgewichten, Projektpersistenz und Undo/Redo. 242 Tests, Build und elf Chromium-Fälle bestanden. [Prüfbericht](PRUEFUNG-0.47.0.md).

**0.48.0:** Echtes Knochenlöschen mit Übernahme von Kindgelenken und Hautgewichten, Posenumrechnung und Undo/Redo. [Prüfbericht](PRUEFUNG-0.48.0.md).

**0.49.0:** Gemischte Einfüge-/Löschfolgen mit gespeicherter Reihenfolge und Undo/Redo. [Prüfbericht](PRUEFUNG-0.49.0.md).

248 Tests, Build und alle zwölf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)). Manuelle Haut-/Mausabnahme bleibt offen.


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
