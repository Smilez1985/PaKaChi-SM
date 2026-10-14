# Blaupause – PaKaChi-SM

**Softwarestand: 0.12.0 · Dokumentation abgeglichen am 14.10.2026.**

Die Blaupause besteht aus drei Dokumenten. Das Designdokument beschreibt das Produktziel, die Roadmap die Umsetzung und das Changelog die bereits erfolgten Änderungen.

| Dokument | Zweck |
| --- | --- |
| [Designdokument](KONZEPT.md) | Begriffe, Bedienprinzip, Anforderungen und noch offene Produktziele. |
| [Roadmap](ROADMAP.md) | Umgesetzte Funktionen, nächste Arbeitspakete und Abnahmekriterien. |
| [Changelog](CHANGELOG.md) | Historie mit Version, Datum und ISO-8601-Zeitstempel. |

## Aktueller Stand

Player, gemeinsame StateMaschine und der integrierte Studio-Editor sind implementiert. Das Studio kann Gelenk-/Gesichtspunkte bearbeiten, vorhandene Skelettdaten erkennen, Punkte frei verbinden, Posen und Moves speichern sowie die gesamte Figur verschieben, drehen und proportional skalieren – auch ohne Skelett. Seit 0.7.0 kennzeichnet das Studio betroffene Posen und Moves nach Gelenkänderungen mit gespeicherten Prüfhinweisen. Seit 0.11.0 bilden vorhandene Skelettlinien nutzbare Ein-/Zweiglied-Ketten des Körpers; Hand- und Fußziele beugen Gelenke ohne Ablösen, Rumpfbewegung trägt die Figur mit. Freie Gesichtspunktgruppen sind davon getrennt. Genau zwei Bearbeitungsmodi bleiben erhalten: **Figur bewegen** und **Gelenke bearbeiten**.

Das Original-PaKaChi mit beiden Formen und 72 Transformationsbildern bleibt unverändert als Bildplayer erhalten. Mika und Nori prüfen die 3D-Technik; sie ersetzen sein Design nicht. KI-Generierung, anatomische Erkennung ohne vorhandenes Skelett, vollständiger Knochenumbau und das 3D-Modell des Original-PaKaChi sind noch offen. Eine automatisierte Prüfung ist keine visuelle Produktabnahme.

## Anleitungen und technische Dokumente

| Gesucht | Dokument |
| --- | --- |
| Lokaler KI-Geometrietest, Vorlagen und Prüfgrenzen | [Bild-zu-3D-Testlauf](KI-GENERIERUNG.md) |
| Installation und Schnellstart | [Projekt-README](../README.md) |
| Maussteuerung, Gelenke, Posen, Projekte | [Studio-Anleitung](STUDIO.md) |
| Bevorzugter Agentenweg mit Python und MQTT | [Python-MCP](PYTHON-MCP.md) |
| KI-Bearbeitung von Punkten, Posen und Moves | [Studio über MCP](MCP-STUDIO.md) |
| Befehle, Zustände, Browser-API, Node-Kompatibilität | [Agentensteuerung](ANSTEUERUNG.md) |
| Komponenten, Datenformat und technische Grenzen | [Architektur](ARCHITEKTUR.md) |
| Testergebnisse und offene Abnahme | [Prüfstand](PRUEFUNG.md) |
| Originaldesign und Herkunft der erhaltenen Bilder | [Referenzen](references/README.md) |

Softwareversion, Projektformat und historischer Prüfstand sind unterschiedliche Angaben: Die Software steht auf 0.12.0, das Projektformat weiterhin auf Version 1. Ältere Projekte sind lesbar; Dateien mit Gesamtpositionsspur benötigen Software ab 0.6.0; Gesamtdrehung benötigt mindestens 0.8.0; Skalierung mindestens 0.10.0. Ältere Software ignoriert die neue Skalierung. Historische Prüfberichte behalten ihren damaligen Stand.
