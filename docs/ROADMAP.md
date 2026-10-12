# Entwicklungsplan

Teil der [Blaupause](README.md) · [Designdokument](KONZEPT.md) · [Changelog](CHANGELOG.md)

Status: Meilenstein 1 umgesetzt; Gelenkeditor, KI-Generierung und gemeinsame Agentenschnittstellen folgen. Details zum Ist-Stand im Changelog.

## 1. Player und Model Zoo

- [x] Gemeinsame Anwendung mit Player und integriertem Avatar-Studio aufbauen.
- [x] Ein vorhandenes, korrekt geriggtes 3D-Modell laden und darstellen.
- [x] Model Zoo mit Avatar-Auswahl und Fähigkeitslegende aufbauen.
- [x] Vorhandene Animationsclips wiedergeben.
- [x] Dateiformate, Modellkoordinaten und Versionierung festlegen.

Studio in Meilenstein 1: integrierte Ansicht mit Skelettanzeige und Navigation; noch keine Posen- oder Gelenkbearbeitung. Der ursprüngliche PaKaChi-Bildplayer ist zusätzlich mit allen 72 Frames eingebunden. Der Model Zoo nutzt zunächst glTF/GLB und einen versionierten JSON-Katalog.

Abnahme: Ein Avatar lässt sich auswählen; seine tatsächlichen Bewegungen werden angezeigt und abgespielt.

## 2. StateMaschine und externe Steuerung

Der wiederhergestellte Originalplayer besitzt bereits eine eigene Zustandssteuerung und optionales MQTT. Geplant ist deren Integration in eine gemeinsame Steuerung für Bild- und 3D-Avatare.

- [ ] Zustände und einmalige Moves getrennt behandeln.
- [ ] Übergänge, Rückkehrzustand und Unterbrechungsverhalten definieren.
- [ ] Fähigkeiten aus dem Model Zoo über MCP zugänglich machen.
- [ ] MQTT opt-in mit Schalter und Broker-Adresse ergänzen.
- [ ] Ungültige Befehle und Verbindungsabbrüche behandeln.

Abnahme: Ein externer Agent kann verfügbare Fähigkeiten abfragen und unterstützte Zustände beziehungsweise Moves auslösen.

## 3. Integrierter Bewegungseditor

- [ ] Modus „Figur bewegen“ mit verständlichen Griffpunkten umsetzen.
- [ ] Posen, Zeitabstände, Gesichtsausdrücke und Gesamtposition bearbeiten.
- [ ] Zwischenposen berechnen und Vorschau abspielen.
- [ ] Moves mit eindeutigen Schlagworten speichern.
- [ ] Neu, Laden und Speichern für bearbeitbare Projekte umsetzen.

Abnahme: Ein Benutzer erstellt aus wenigen Posen eine flüssige Bewegung; nach erneutem Laden ist sie im Player verfügbar.

## 4. Gelenke korrigieren

- [ ] Modus „Gelenke bearbeiten“ umsetzen.
- [ ] Gelenke hinzufügen, verschieben und löschen.
- [x] Nahzoom mit Mausrad und Verschieben der 3D-Ansicht als Grundlage.
- [ ] Frei platzierbare Gesichtspunkte und unabhängige Punktgruppen ermöglichen.
- [ ] Punktgröße pro Gelenk mit bedienbarer Auswahlfläche einstellen.
- [ ] Punkte frei verbinden und lösen, ohne bestehende Gelenkketten vorauszusetzen.
- [ ] Einflussbereiche auf Mund, Augen und Augenlider getrennt von der sichtbaren Punktgröße behandeln.
- [ ] Verbindungen und Oberflächenzuordnung aktualisieren.
- [ ] Unterschiedliche Körperformen unterstützen.
- [ ] Bestehende Moves nach Skelettänderungen prüfen.
- [ ] Rückgängig/Wiederholen ergänzen.

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
- Authentifizierung und genaue Nachrichtenformate für externe Steuerung.

Diese Reihenfolge ist ein Umsetzungsvorschlag. Das Produktziel bleibt der vollständige, einfache Bild-zu-Avatar-Ablauf.

