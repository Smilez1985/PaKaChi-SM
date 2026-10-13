# Entwicklungsplan

Teil der [Blaupause](README.md) · [Designdokument](KONZEPT.md) · [Changelog](CHANGELOG.md)

Status: Meilensteine 1 und 2 implementiert und automatisiert geprüft; visuelle und externe Live-Abnahme noch offen. Erster Bewegungseditor und freie Kontrollpunkte sind seit 0.3.0 implementiert. Erweiterter Skelettumbau und KI-Generierung folgen. Details zum Ist-Stand im Changelog.

## 1. Player und Model Zoo

- [x] Gemeinsame Anwendung mit Player und integriertem Avatar-Studio aufbauen.
- [x] Ein vorhandenes, korrekt geriggtes 3D-Modell laden und darstellen.
- [x] Model Zoo mit Avatar-Auswahl und Fähigkeitslegende aufbauen.
- [x] Vorhandene Animationsclips wiedergeben.
- [x] Dateiformate, Modellkoordinaten und Versionierung festlegen.

Studio in Meilenstein 1: integrierte Ansicht mit Skelettanzeige und Navigation; noch keine Posen- oder Gelenkbearbeitung. Der ursprüngliche PaKaChi-Bildplayer ist zusätzlich mit allen 72 Frames eingebunden. Der Model Zoo nutzt zunächst glTF/GLB und einen versionierten JSON-Katalog.

Abnahme: Ein Avatar lässt sich auswählen; seine tatsächlichen Bewegungen werden angezeigt und abgespielt.

## 2. StateMaschine und externe Steuerung

Original- und 3D-Avatare verwenden seit 0.2.0 einen gemeinsamen Router. Einrichtung: [Agentensteuerung](ANSTEUERUNG.md). Prüfgrenzen: [Prüfstand](PRUEFUNG-0.2.0.md).

- [x] Zustände und einmalige Moves getrennt behandeln.
- [x] Übergänge, Rückkehrzustand und Unterbrechungsverhalten definieren.
- [x] Fähigkeiten aus dem Model Zoo über MCP zugänglich machen.
- [x] MQTT opt-in mit Schalter und Broker-Adresse ergänzen.
- [x] Ungültige Befehle und Verbindungsabbrüche behandeln.

Abnahme: Ein externer Agent kann verfügbare Fähigkeiten abfragen und unterstützte Zustände beziehungsweise Moves auslösen.

## 3. Integrierter Bewegungseditor

- [x] Modus „Figur bewegen“ mit verständlichen Griffpunkten umsetzen.
- [x] Posen, Zeitabstände und Gesichtspunkte bearbeiten.
- [ ] Globale Position als eigene Spur auch für knochenlose Modelle bearbeiten.
- [x] Zwischenposen berechnen und Vorschau abspielen.
- [x] Moves mit eindeutigen Schlagworten speichern.
- [x] Neu, Laden und Speichern für bearbeitbare Projekte umsetzen.

Abnahme: Ein Benutzer erstellt aus wenigen Posen eine flüssige Bewegung; nach erneutem Laden ist sie im Player verfügbar.

Studio 0.3.0: [Bedienung und Grenzen](STUDIO.md). Eigene Moves werden im geladenen Projekt angeboten; gemeinschaftlicher Model-Zoo-Export und visuelle Abnahme sind noch offen.

## 4. Gelenke korrigieren

- [x] Modus „Gelenke bearbeiten“ umsetzen.
- [x] Freie Oberflächenpunkte hinzufügen, verschieben und löschen; bestehende Skelett-Drehpunkte verschieben.
- [ ] Quellknochen tatsächlich hinzufügen/löschen und Hautgewichte neu zuordnen. Bisher entfernt Löschen bei Quellknochen nur den Editorgriff.
- [x] Nahzoom mit Mausrad und Verschieben der 3D-Ansicht als Grundlage.
- [x] Frei platzierbare Gesichtspunkte und unabhängige Punktgruppen ermöglichen.
- [x] Punktgröße pro Gelenk mit bedienbarer Auswahlfläche einstellen.
- [x] Punkte frei verbinden und lösen, ohne bestehende Gelenkketten vorauszusetzen.
- [x] Einflussbereiche auf Mund, Augen und Augenlider getrennt von der sichtbaren Punktgröße behandeln.
- [x] Freie Punktverbindungen und lokale Oberflächenverformung einschließlich Hautbindung umsetzen.
- [ ] Automatische Gelenkketten, IK und vollständiges Neugewichten des Quellskeletts umsetzen.
- [ ] Unterschiedliche Körperformen unterstützen.
- [ ] Bestehende Moves nach Skelettänderungen prüfen.
- [x] Rückgängig/Wiederholen ergänzen.

Abnahme: Ein fehlendes Knie lässt sich ergänzen und anschließend sinnvoll beugen. Eine Figur mit abweichender Gliedmaßenanzahl lässt sich ebenfalls bearbeiten.

## 5. Bild zu 3D und KI-Korrektur

- [ ] Den bestehenden PaKaChi anhand der erhaltenen Tierform und korrigierten humanoiden Stilreferenz in 3D nachbilden. Beide Formen und die Transformation erhalten.

- [ ] Geeignete Generierungs- und Rigging-Verfahren anhand echter Testfiguren bewerten.
- [ ] Bildimport per Drag & Drop anschließen.
- [ ] Generierungsfortschritt, Fehler und erneuten Versuch verständlich anzeigen.
- [ ] Korrekturprompt und „Skelett neu versuchen“ integrieren.
- [ ] Vorschau übernehmen oder verwerfen, bisheriges Ergebnis bewahren.

Abnahme: Ein Bild durchläuft die tatsächliche Generierung zu einem überprüfbaren, beweglichen Modell. Fehlgeschlagene Generierung wird klar angezeigt; Platzhalter gelten nicht als fertige Funktion.

## 6. Qualität und vollständiger Ablauf

- [ ] Modellqualität und Dateigröße skalieren.
- [ ] Bearbeitbare Quelldaten bewahren.
- [ ] Animationen nach Optimierung prüfen.
- [ ] Gesamten Ablauf ohne Fachwissen erproben.

Abnahme: Bild hineinziehen, Avatar korrigieren, Bewegung erstellen, speichern und durch einen Agenten abspielen lassen – in einer Anwendung.

## Noch zu entscheiden

- Desktop-Verpackung und unterstützte Betriebssysteme.
- Rendering-Technik und endgültige Dateiformate.
- Lokale beziehungsweise externe KI-Verfahren und deren Hardwarebedarf.
- Lizenz.
- Weitergehende Remote-Anbindung; lokale MCP-Kopplung und MQTT-Nachrichtenformat sind in 0.2.0 festgelegt.

Diese Reihenfolge ist ein Umsetzungsvorschlag. Das Produktziel bleibt der vollständige, einfache Bild-zu-Avatar-Ablauf.

