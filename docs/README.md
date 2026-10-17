# Blaupause – PaKaChi-SM

**Softwarestand: 0.22.0 · Dokumentation abgeglichen am 17.10.2026.**

Die Blaupause besteht aus drei Dokumenten. Das Designdokument beschreibt das Produktziel, die Roadmap die Umsetzung und das Changelog die bereits erfolgten Änderungen.

| Dokument | Zweck |
| --- | --- |
| [Designdokument](KONZEPT.md) | Begriffe, Bedienprinzip, Anforderungen und noch offene Produktziele. |
| [Roadmap](ROADMAP.md) | Umgesetzte Funktionen, nächste Arbeitspakete und Abnahmekriterien. |
| [Changelog](CHANGELOG.md) | Historie mit Version, Datum und ISO-8601-Zeitstempel. |

## Aktueller Stand

Player, gemeinsame StateMaschine und der integrierte Studio-Editor sind implementiert. Das Studio kann Gelenk-/Gesichtspunkte bearbeiten, vorhandene Skelettdaten erkennen, Punkte frei verbinden, Posen und Moves speichern sowie die gesamte Figur verschieben, drehen und proportional skalieren – auch ohne Skelett. Seit 0.7.0 kennzeichnet das Studio betroffene Posen und Moves nach Gelenkänderungen mit gespeicherten Prüfhinweisen. Seit 0.11.0 bilden vorhandene Skelettlinien nutzbare Ein-/Zweiglied-Ketten des Körpers; Hand- und Fußziele beugen Gelenke ohne Ablösen, Rumpfbewegung trägt die Figur mit. Freie Gesichtspunktgruppen sind davon getrennt. Genau zwei Bearbeitungsmodi bleiben erhalten: **Figur bewegen** und **Gelenke bearbeiten**.

Das Original-PaKaChi mit beiden Formen und 72 Transformationsbildern bleibt unverändert als Bildplayer erhalten. Mika und Nori prüfen die 3D-Technik; sie ersetzen sein Design nicht. KI-Generierung, anatomische Erkennung ohne vorhandenes Skelett, vollständiger Knochenumbau und das 3D-Modell des Original-PaKaChi sind noch offen. Eine automatisierte Prüfung ist keine visuelle Produktabnahme.

## Beschlossene nächste Architektur

Das Studio soll als spezialisierter **KI-Harness** den Arbeitsablauf koordinieren. **Assistent, 3D-Generator und Rigging-Dienst** erhalten unabhängig wählbare Anbieter, Modelle und mehrere Verbindungsprofile. Geplant sind Cloud-APIs, offiziell unterstützte OAuth-Anmeldungen und lokale Dienste wie Ollama oder LM Studio über geeignete Adapter. Sprachmodelle koordinieren Werkzeuge; tatsächliche Geometrie und Hautgewichte benötigen passende Fachverfahren.

Seit 0.13.0 sind lokale Anbieterprofile, unabhängige Rollenzuordnung im Optionsmenü und eine interne Adapter-/Fähigkeitsprüfung vorhanden. Seit 0.14.0 ergänzt ein interner Auftragskern Fortschritt, Abbruch, Zeitlimit und eine revisionsgeprüfte Übernahme. Seit 0.15.0 sind Modelllisten-Abfragen mit optionalem Sitzungsschlüssel und ein hardwaregeprüfter Ollama-Einrichtungshelfer vorhanden. Seit 0.16.0 ist der Assistent mit Ollama/OpenAI-kompatibler Inferenz und einzeln bestätigten Studio-Vorschlägen nutzbar. Seit 0.17.0 ergänzt ein nativer Anthropic-Adapter Modelllisten und Assistentenaufrufe mit API-Schlüssel. Seit 0.21.0 besteht ein lokaler TripoSR-HTTP-Dienst samt Auftragsadapter. Seit 0.22.0 sind Bildauswahl und getrennte Generierungsvorschau angeschlossen. OAuth, Cloud-Fachadapter, Rigging sowie reale Inferenz-/Browserabnahme bleiben offen. Lokal oder Cloud ist für ALLE drei Rollen unabhängig wählbar; der Ollama-Katalog schränkt diese Wahl nicht ein. Außerdem bestehen die MCP-Studio-Werkzeuge und der experimentelle TripoSR-Testlauf. [Design und Grenzen](KONZEPT.md#11-studio-als-ki-harness-und-freie-anbieterwahl) sowie [Umsetzungsschritte und Abnahme](ROADMAP.md#7-studio-harness-und-anbieteranbindung) sind jetzt Bestandteil der Blaupause.

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

Softwareversion, Projektformat und historischer Prüfstand sind unterschiedliche Angaben: Die Software steht auf 0.22.0, das Projektformat weiterhin auf Version 1. Ältere Projekte sind lesbar; Dateien mit Gesamtpositionsspur benötigen Software ab 0.6.0; Gesamtdrehung benötigt mindestens 0.8.0; Skalierung mindestens 0.10.0. Ältere Software ignoriert die neue Skalierung. Historische Prüfberichte behalten ihren damaligen Stand.

[Aufgabenbezogene Modellwahl und lokale Einrichtung](LOKALE-MODELLE.md) · [Prüfbericht 0.15.0](PRUEFUNG-0.15.0.md)

[Assistent verwenden](ASSISTENT.md) · [Prüfbericht 0.16.0](PRUEFUNG-0.16.0.md)

[Prüfbericht 0.17.0](PRUEFUNG-0.17.0.md) · [Anthropic einrichten](ANBIETER.md#anthropic-seit-0170)

**0.18.0:** Gleichzeitig eingerichtete Anbieter-/Modellprofile, unabhängige geordnete Fallbacks für alle Rollen und erhaltene Sitzungsschlüssel. Assistenten-Fallbacks sind implementiert; Fachausführung für Generator/Rigging bleibt offen; seit 0.19.0 gibt es einen optionalen verschlüsselten Schlüsseltresor. [Aktuelle Anbieteranleitung](ANBIETER.md).

**0.19.0:** Passwortgeschützter lokaler Schlüsseltresor mit ausdrücklichem Speichern/Entsperren; keine Klartextschlüssel im Browserspeicher. [Anleitung und Grenzen](ANBIETER.md#optionaler-schlüsseltresor-seit-0190).

**0.20.0:** Tresorpasswortwechsel mit Erhalt des gespeicherten Bestands und ausdrückliche Sitzungssperre einschließlich Anfrageabbruch. [Anleitung](ANBIETER.md) · [Prüfbericht](PRUEFUNG-0.20.0.md).

**0.21.0:** Lokaler TripoSR-Dienst und Auftragsadapter; echter HTTP-Transport, synthetisches Backend im Test. Keine GPU-/Qualitätsabnahme und noch keine Generierungsoberfläche. [Einrichtung](KI-GENERIERUNG.md#lokaler-generierungsdienst-seit-0210) · [Prüfbericht](PRUEFUNG-0.21.0.md).

**0.22.0:** Bildauswahl/Drag & Drop, lokale Generierung, getrennte Modellvorschau und ausdrücklicher Import im Studio. Kein projektübergreifendes Undo. [Bedienung](KI-GENERIERUNG.md#bedienung-im-studio-seit-0220) · [Prüfbericht](PRUEFUNG-0.22.0.md).
