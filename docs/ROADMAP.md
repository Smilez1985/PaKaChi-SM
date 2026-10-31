# Roadmap – offene Aufgaben

**Entwicklungsstand: 0.73.0 · Abgleich: 31.10.2026.** Teil der [Blaupause](README.md).

Diese Roadmap enthält offene Umsetzung und ausstehende Abnahme. Erledigte Änderungen stehen nach Version im [Changelog](CHANGELOG.md); Nachweise und Grenzen im [Prüfstand](PRUEFUNG.md). Eine implementierte Funktion ist nicht automatisch manuell oder mit realen Anbietern abgenommen.

## Prioritäten

1. **Browser- und Bedienabnahme:** Korrigierten Mausnavigationstest und vollständige Chromium-Suite bestätigen, anschließend Kamera, Körperketten, Hautverformung und Mausgefühl manuell prüfen. Actions-Kontingent laut Inhaber seit 28.10.2026 erschöpft; lokales Chromium startet hier nicht. Keine neuen Actions-Läufe bis zur verfügbaren Kapazität.
2. **Ladezeiten nachvollziehbar messen:** Die CPU-Messung ist seit 0.68.0 vorhanden; als Nächstes große reale Projekte und vollständiges Browserladen messen. Erst aus diesen Ergebnissen weitere Optimierungen ableiten.
3. **Gelenkbearbeitung vervollständigen:** Skalierte Knochenketten, Löschen mit Anbauteilen und neue Rigs auf ungeriggten Oberflächen; anschließend Ganzkörper-IK und Qualitätsabnahme.
4. **KI-Verfahren und Anbieter:** Geometrie/Rigging-Fachadapter, echte Inferenzqualität und unabhängige Rollen/Fallbacks live prüfen; unterstützte OAuth-Verfahren ergänzen.

Der Arbeitsstand liegt auf `work/local-verification-model-zoo`; `main` bleibt bis zur Übernahme unverändert. Offene Abnahmen werden nicht wegen fehlender Laufzeit oder Konten als erledigt markiert.

## Automatisierte Browserprüfung

- [ ] Screenshots und tatsächliches Mausgefühl manuell auswerten; gerenderte Automatisierung ersetzt diese Gesamtabnahme nicht. Lokales Chromium bleibt beim Socket-Aufbau blockiert.

## 1. Player und Model Zoo

- [ ] Tatsächliche Speichergrenzen und Quotenfehler in realen Browsern prüfen.
- [ ] Gespeicherte Auswahl zusätzlich mit externem MCP-Host abnehmen.
- [ ] Veröffentlichungsablauf ergänzen und zusammengeführte Exportpakete im gerenderten Player abnehmen.
- [ ] Sammlung im Browser bearbeiten und visuell abnehmen; GLB-Clip-Export und Retargeting auf andere Rigs ergänzen.

## 2. StateMaschine und externe Steuerung

- [ ] Konkreten externen MCP-Host und externen NanoMQ-Broker live abnehmen.

## 3. Posen und Bewegungen

- [ ] Sequenzbearbeitung im gerenderten Studio und mit externem KI-/MCP-Host abnehmen.
- [ ] Überblendung Originalclip ↔ Studio-Move im gerenderten Player abnehmen, einschließlich kurzer einmaliger Clips, Originalclip-Überblendungen, Zeitleistensprüngen und manueller Pause; Unterstützung für bearbeitete Grundskelette und geänderte Hautgewichte ergänzen. Freie Oberflächenpunkte sind seit 0.70.0 implementiert; deren gerenderte Qualität und CPU-/Speicherbedarf auf großen Importmodellen prüfen. Mika-CPU-Messung und erste Optimierung sind seit 0.71.0 vorhanden ([Messvertrag](TRANSITION-BENCHMARK.md)); seit 0.71.1 können eigene eigenständige GLB-/glTF-Modelle ohne Bildtexturen gemessen werden.

## 4. Gelenke korrigieren

- [ ] Gewichtsqualität der eingefügten Gelenke manuell prüfen.
- [ ] Hautverformung nach Knochenlöschen manuell prüfen.
- [ ] Hautqualität nach gemischten Umbaufolgen manuell prüfen.
- [ ] Weitere Umbauten skalierter Knochenketten und Anbauteile mit eigenem Skelett unterstützen; Löschen mit Anbauteilen ergänzen. Neue Abzweigungen unter skalierten Eltern sind seit 0.72.0, das Löschen skalierter Endknochen ohne Kinder/Anbauteile seit 0.73.0 implementiert; gerenderte Haut-/IK-Abnahme bleibt offen.
- [ ] Haut- und Bewegungsqualität nach Umhängen manuell prüfen.
- [ ] Anatomische Gelenkketten aus ungeriggter Oberfläche erzeugen; allgemeine Dreh-/Twistgrenzen, fixierte Füße und gekoppelte Ganzkörper-IK ergänzen.
- [ ] Beugegrenzen, Posen- und Bewegungsprüfung samt Prüfbildübernahme im gerenderten Studio abnehmen; lückenlose Bewegungsprüfung, direkte Drehgrenzen und Korrekturen ergänzen.
- [ ] Bewegungsfähige Rigs unterschiedlicher Körperformen systematisch prüfen.
- [ ] Bewegungen geometrisch auf Fehlstellungen, Gelenkgrenzen und Kollisionen prüfen und automatisch korrigieren.

## 5. Bild zu 3D und KI-Korrektur

- [ ] Bestehenden PaKaChi anhand seiner erhaltenen Tierform und korrigierten humanoiden Stilreferenz in 3D nachbilden; beide Formen und die Transformation erhalten.
- [ ] Geeignete Generierungs-/Rigging-Verfahren an echten Testfiguren bewerten. **Echte Inferenz und Qualitätsvergleich stehen weiterhin aus.** [Testlauf](KI-GENERIERUNG.md).
- [ ] Freien Korrekturprompt und „Skelett neu versuchen“ integrieren.
- [ ] Diesen Ablauf im gerenderten Browser prüfen; Fehler beim separaten Neustart des Original-Bildplayers und GPU-Kontextverlust gesondert absichern.

## 6. Bedienung, Qualität und Export

- [ ] Lokalisierung von Originalplayer, Modellbeschreibungen und technischen Meldungen vervollständigen.
- [ ] Modellqualität und Dateigröße skalieren; Quelle neben optimierten Ableitungen bewahren.
- [ ] Animationen nach Optimierungen prüfen; eigenständigen GLB-Export ergänzen.
- [ ] Gesamten Ablauf ohne Fachwissen erproben.

## 7. Studio-Harness und Anbieteranbindung

- [ ] Produktive Adapter implementieren; Fähigkeiten und Auftragsabläufe gegen echte Dienste prüfen.
- [ ] Weitere native Cloud-Adapter und offiziell unterstützte OAuth-Verfahren ergänzen; Tresor und nativer Anthropic-Adapter sind implementiert.
- [ ] Unterstützte Fähigkeiten und Modellqualität an realen lokalen Diensten und Cloud-Konten abnehmen.
- [ ] Geeignete lokale und externe 3D- sowie Rigging-Adapter mit echten Eingaben prüfen. Geometrie, vollständige Körperhierarchie und Hautgewichte getrennt bewerten; Original-PaKaChi in beiden Formen und die Transformation zusätzlich prüfen.
- [ ] Korrekturprompt ergänzen und abgesicherte 3D-Übernahme samt Modellwechsel-Rücksprung im gesamten Ablauf visuell prüfen.

## 8. Freie Modellwahl und lokale Einrichtung

- [ ] Reale Hardwareabnahme und komplexe deutsche/englische Studio-Aufgaben einschließlich Bilder pro Quantisierung prüfen.
- [ ] AMD/Intel/Apple und mehrere GPUs zuverlässig messen; LM-Studio-Modellinstallation prüfen.
- [ ] Für jede Rolle lokale und Cloud-Ausführung integrieren: direkte Fachmodelle sowie LLM-gesteuerte Werkzeugketten, soweit nachweislich geeignet.
- [ ] Reale Kontoabnahme für Anthropic, OpenAI, DeepInfra und OpenRouter; weitere Authentifizierungswege nur nach offizieller Unterstützung.
- [ ] Fachverfahren für Geometrie und Rigging live validieren und über austauschbare Adapter zugänglich machen. Recherche nur nach diesen Aufgaben, kein Gesamtkatalogscan.

## 9. Integrierter Assistent

- [ ] Reale Anbieter- und Modellabnahme einschließlich deutscher/englischer Studio-Aufgaben und Browser-CORS.
- [ ] Vorschau und Sequenzpakete im gerenderten Browser sowie mit externem Anbieter abnehmen; Bildkontext und Transaktionen für weitere Studio-Aktionen ergänzen.
- [ ] Weitere Cloud-Fachadapter und Rigging-Ausführung unabhängig von der Assistentenrolle integrieren; Anthropic, Tresor und lokaler Generator sind vorhanden.

## 10. Anthropic-Abnahme

- [ ] Echter API-/Browserlauf mit Workspace-gebundenem Schlüssel und passendem Modell.
- [ ] Zusätzliche Workspace-Auswahl bei Bedarf ergänzen; paginierte Listen mit echtem Konto/Browser abnehmen.
- [ ] Offiziell unterstütztes OAuth implementieren; API-Schlüssel können bereits optional im Browsertresor gespeichert werden.

## 11. Mehranbieter-Routen

- [ ] Weitere Cloud-Generator-/Rigging-Fachadapter und Rigging-Fallback-Ausführung anschließen.
- [ ] Echte Anbieter-/Kontoabnahme der Fallbacks.

## 12. Schlüsseltresor

- [ ] Visuelle Browserabnahme sowie unabhängige Sicherheitsprüfung.
- [ ] Optional Betriebssystem-Schlüsselbund für spätere Desktop-Verpackung prüfen.

## Knochenbearbeitung durch Agenten

- [ ] Neue Topologieaktionen mit echtem externem MCP-Host und Anbieter abnehmen.

- [ ] Vertex-Auswahl ergänzen; Hautqualität manuell prüfen.

## Freie Knochenabzweigungen

- [ ] Erstes Skelett auf einer ungeriggten Oberfläche erstellen und binden.

## Gewichtspinsel

- [ ] Gerenderte Alpha-Kanten/Mipmaps, Teiltransparenz sowie große Modelle und Ladezeiten manuell prüfen.

## Gewichtsverläufe schneller berechnen

- [ ] Mit dem [CPU-Importbenchmark](IMPORT-BENCHMARK.md) große reale Projekte messen; vollständige Browserzeiten einschließlich Texturen/Rendering ergänzen und anschließend gezielt optimieren. Manuelle Performance-Abnahme bleibt offen.

## Noch zu entscheiden

- Desktop-Verpackung und geprüfte Betriebssysteme.
- Priorität, Hardwarebedarf und Lizenzen konkreter Generierungs-/Rigging-Verfahren.
- Projektlizenz.
- Erweiterungen der Exportformate und sichere Remote-Anbindung.

Three.js, glTF/GLB, JSON-Katalog, Studio-Projektformat 1 und unabhängige Anbieterprofile pro Rolle sind festgelegt.
