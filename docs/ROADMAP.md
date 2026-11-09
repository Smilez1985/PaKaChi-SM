# Roadmap – offene Aufgaben

**Entwicklungsstand: 0.93.0 · Abgleich: 09.11.2026.** Teil der [Blaupause](README.md).

Diese Roadmap enthält offene Umsetzung und ausstehende Abnahme. Erledigte Änderungen stehen nach Version im [Changelog](CHANGELOG.md); Nachweise und Grenzen im [Prüfstand](PRUEFUNG.md). Eine implementierte Funktion ist nicht automatisch manuell oder mit realen Anbietern abgenommen.

## Übergabe und nächster Schritt

**Übergabe aktualisiert:** 2026-11-09T10:52:35+01:00 (Europe/Berlin). Softwarestand **0.93.0**.

- **Arbeitsbranch:** `work/local-verification-model-zoo`, [Entwurfs-PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1); noch nicht nach `main` zusammengeführt.
- **Neue Grundlage:** Automatischer lokaler Hautkorrekturauftrag: Diagnose, Gelenkauswahl aus der tatsächlichen Haut, begrenzte Suche, Gegenprüfung sämtlicher gespeicherter Posen und eigener Move-Stichproben, Original-/Korrekturvorschau und einmalige Undo-fähige Übernahme. Zusätzlich komponentenweise Volumenschätzung geschlossener Netze mit messwertgebundener Gegenprüfung; offene Flächen bleiben nicht messbar. Aufruf durch integrierten KI-Assistenten möglich. [Prüfbericht](PRUEFUNG.md#version-0920).
- **Nächste Aktion:** Kandidaten über lokale Gewichtsübertragungen hinaus erzeugen: geprüfte Korrekturformen und bessere Schulter-/Hüftverformung; Lokale Volumenerhaltung, Silhouette und Selbstüberschneidungen in die Gegenprüfung aufnehmen; die neue globale Schätzung allein erkennt nicht jede lokale Einschnürung. Mehrere abgestimmte Korrekturen pro Auftrag und adaptive Zwischenbildprüfung ergänzen. Der bestehende Auftrag bleibt begrenzt und darf bei fehlender Verbesserung ablehnen. Fachadapter der Rigging-Rolle und externe MCP-Suche anschließend anbinden.
- **Charakterstand:** 21 akzeptierte Korrekturhaltungen der Arbeitsform (fünf zusätzliche linke Hüfthaltungen), 11 der Tierform. Schulterkandidaten und weitere Hüftkandidaten bleiben nach den Messungen verworfen; die zugrunde liegenden Fehler bestehen weiter.
- **Danach:** Eine gespeicherte Standard-Verwandlung auf dieser Oberfläche, vorwärts und rückwärts mit identischen Zwischenformen; Qualität auch zwischen den Endposen prüfen.
- **Hardware parallel:** Die [fünf Verbindungsschritte](LOKALE-WERKZEUGE.md#verbindung-zu-deinem-rechner) bleiben verfügbar. Windows-/Caddy-/GPU-Abnahme ist offen, blockiert die CPU-basierte Charakter-/Rigarbeit jedoch nicht. Ein tatsächlicher externer Aufruf von `local_get_status` bleibt der erste Verbindungsnachweis.

## Prioritäten

1. **Automatische Korrekturqualität erweitern:** Begrenzter Gewichts-Korrekturauftrag ist implementiert. Weitere geometrische Kandidaten, mehrere abgestimmte Änderungen, adaptive Move-Prüfung und echte Fachmodell-Abnahme fehlen.
2. **Charakter und Rig verfeinern:** Beide Formen besitzen seit 0.85.0 dieselbe 59-Gelenk-Hierarchie einschließlich 14 beweglicher Finger/Zehen und echte Hautgewichte. Gesicht, Fell und lokale Pfotenflächen sind überarbeitet; die Körpernetze haben geschlossene, konsistent orientierte Kanten. Finger-/Pfotenproportionen, Anschlüsse bei großen Beugungen, verdeckte Flächen und Hüft-/Schulterübergänge weiter korrigieren und designgetreu abnehmen.
3. **Gemeinsame Morph-Topologie:** Die umformungsbedingten Hautbrücken der unabhängig rekonstruierten Netze beseitigen. Ein Charakter mit kompatibler Netzstruktur und geprüftem Rig für beide Formen.
4. **Standard-Verwandlung:** Danach eine gespeicherte Animation Normalform → Arbeitsform implementieren; dieselbe Animation rückwärts, Endform halten und laufende Bewegung ohne Sprung umkehren. Zustandszuordnung wie im Originalplayer.
5. **Reale Generatorqualität:** TripoSR-CPU-Inferenz bleibt belegt. GPU-Abnahme und qualitativer Verfahrensvergleich auf den beiden tatsächlichen Vorlagen bleiben offen.
6. **Abnahme am tatsächlichen Ablauf:** Kamera, Haut, Posen und Speichern/Laden an beiden Formen weiter prüfen. [Nachweise und Grenzen](PRUEFUNG.md#version-0850).

## Lokale Hardware anbinden

Die Umsetzung des integrierten MCP-Arbeitsplatzes, der Caddy-/DuckDNS-Konfiguration, der OAuth-Freigaben, des offiziellen Tunnel-Clients und des ACP-v1-Clients ist in [0.86.0 dokumentiert](CHANGELOG.md). Offen ist die reale Abnahme:

- [ ] Auf Steffens Windows-Rechner `Start-Windows.cmd` ausführen, MCP einschalten, Player koppeln und die tatsächlichen Blender-/Python-Pfade sowie GPU/PyTorch prüfen.
- [ ] Den vorhandenen Caddy/DuckDNS-Zugang mit dem erzeugten Abschnitt verbinden, den MCP-Server in ChatGPT hinzufügen und die OAuth-Verbindungsanfrage lokal freigeben. Keine zusätzliche öffentliche Portfreigabe.
- [ ] `local_get_status` über diese externe MCP-Verbindung erfolgreich aufrufen und die tatsächlichen Werkzeugfreigaben, Player-Kopplung und Programm-/GPU-Prüfergebnisse prüfen.
- [ ] Einen tatsächlichen Python-/Blender-Auftrag über MCP starten, Ergebnisdateien abrufen und einen GLB-Import ins Studio prüfen.
- [ ] Den alternativen Secure MCP Tunnel auf Windows/macOS mit einem berechtigten OpenAI-Konto sowie einen produktiven authentifizierten ACP-Agenten live abnehmen. Diese Alternativen sind keine Voraussetzung für den Caddy-Weg.

## Automatisierte Browserprüfung

- [ ] Weitere Screenshots und tatsächliches Mausgefühl manuell auswerten; haftende Vorschau und mobile Posenfelder wurden in 0.76.3 automatisiert und anhand dreier sichtbarer Bereichsaufnahmen geprüft; vier Artefaktbilder wurden in 0.76.2 stichprobenartig bewertet, Optionen-Kontrast und Versionsanzeige korrigiert; gerenderte Automatisierung ersetzt diese Gesamtabnahme nicht. Die automatisierten Charakter- und Arbeitsplatzabläufe sind im vollständigen Chromium-CI-Lauf von 0.86.0 belegt; die manuelle Gesamtabnahme bleibt offen.

## 1. Player und Model Zoo

- [ ] Tatsächliche Speichergrenzen und Quotenfehler in realen Browsern prüfen.
- [ ] Gespeicherte Auswahl zusätzlich mit externem MCP-Host abnehmen.
- [ ] Veröffentlichungsablauf ergänzen und zusammengeführte Exportpakete im gerenderten Player abnehmen.
- [ ] Sammlung im Browser bearbeiten und visuell abnehmen; Sichere Originalclip-Übernahme und Retargeting auf andere Rigs ergänzen. Freie Oberflächenpunkte sind seit 0.80.0 als Morph-Animation exportierbar. Eigene Studio-Moves mit Knochen-/Figurenbewegung sind seit 0.79.0 als GLB exportierbar.

## 2. StateMaschine und externe Steuerung

- [ ] Konkreten externen MCP-Host und externen NanoMQ-Broker live abnehmen.

## 3. Posen und Bewegungen

- [ ] Sequenzbearbeitung im gerenderten Studio und mit externem KI-/MCP-Host abnehmen.
- [ ] Überblendung Originalclip ↔ Studio-Move im gerenderten Player abnehmen, einschließlich kurzer einmaliger Clips, Originalclip-Überblendungen, Zeitleistensprüngen und manueller Pause; Unterstützung für bearbeitete Grundskelette und geänderte Hautgewichte ergänzen. Freie Oberflächenpunkte sind seit 0.70.0 implementiert; deren gerenderte Qualität und CPU-/Speicherbedarf auf großen Importmodellen prüfen. Mika-CPU-Messung und erste Optimierung sind seit 0.71.0 vorhanden ([Messvertrag](TRANSITION-BENCHMARK.md)); seit 0.71.1 können eigene eigenständige GLB-/glTF-Modelle ohne Bildtexturen gemessen werden.

## 4. Gelenke korrigieren

- [ ] Gewichtsqualität der eingefügten Gelenke manuell prüfen.
- [ ] Hautverformung nach Knochenlöschen manuell prüfen.
- [ ] Hautqualität nach gemischten Umbaufolgen manuell prüfen.
- [ ] Umhängen zwischen Ästen mit nicht gleichmäßiger oder negativer Skalierung, weitere Umbauten skalierter Knochenketten und Anbauteile mit eigenem Skelett unterstützen; Löschen mit Anbauteilen ergänzen. Neue Abzweigungen unter skalierten Eltern sind seit 0.72.0, das Löschen skalierter Endknochen ohne Kinder/Anbauteile seit 0.73.0 implementiert; Umhängen unter gemeinsam skalierten Vorfahren ist seit 0.74.0 und zwischen positiv gleichmäßig skalierten Ästen mit gleicher Gesamtskalierung seit 0.75.0 möglich; seit 0.76.0 bleibt auch die eigene invertierbare Skalierung des verschobenen Knochens erhalten. Seit 0.82.0 werden unterschiedliche positive gleichmäßige Astmaßstäbe durch eine rekonstruierte lokale Skalierung ausgeglichen; gerenderte Haut-/IK-Abnahme bleibt offen.
- [ ] Haut- und Bewegungsqualität nach Umhängen manuell prüfen.
- [ ] Anatomische Gelenkketten aus ungeriggter Oberfläche erzeugen; allgemeine Dreh-/Twistgrenzen, fixierte Füße und gekoppelte Ganzkörper-IK ergänzen.
- [ ] Beugegrenzen, Posen- und Bewegungsprüfung samt Prüfbildübernahme im gerenderten Studio abnehmen; lückenlose Bewegungsprüfung, direkte Drehgrenzen und Korrekturen ergänzen.
- [ ] Bewegungsfähige Rigs unterschiedlicher Körperformen systematisch prüfen.
- [ ] Die seit 0.87.0 vorhandene Dreiecks-Dehnungsprüfung einzelner Posen nach der Move-Stichprobenprüfung und komponentenweisen Volumenschätzung um adaptive Zwischenbilder, Selbstüberschneidung, lokale Volumenerhaltung und Referenzansichten erweitern; die seit 0.88.0 begrenzte Gewichtssuche und die seit 0.91.0 auf Ellenbogen und Knie erweiterten Korrekturformen um weitere Gelenke, durchgehende kombinierte Bewegungen und charakterbezogene Qualitätskriterien ergänzen. Die aktuellen Warnschwellen sind keine anatomische Abnahme.

## 5. Bild zu 3D und KI-Korrektur

- [ ] Bestehenden PaKaChi anhand seiner erhaltenen Tierform und korrigierten humanoiden Stilreferenz in 3D nachbilden; beide Formen und die Transformation erhalten.
- [ ] Geeignete Generierungs-/Rigging-Verfahren qualitativ vergleichen. Echte TripoSR-CPU-Inferenz beider Originalformen ist seit 0.83.0 belegt; GPU-Abnahme und der Vergleich mit einem weiteren Verfahren bleiben offen. [Testlauf](KI-GENERIERUNG.md).
- [ ] Freien Korrekturprompt und „Skelett neu versuchen“ integrieren.
- [ ] Diesen Ablauf im gerenderten Browser prüfen; Fehler beim separaten Neustart des Original-Bildplayers und GPU-Kontextverlust gesondert absichern.

## 6. Bedienung, Qualität und Export

- [ ] Lokalisierung von Originalplayer, Modellbeschreibungen und technischen Meldungen vervollständigen.
- [ ] Modellqualität und Dateigröße skalieren; Quelle neben optimierten Ableitungen bewahren.
- [ ] Animationen nach Optimierungen prüfen; Originalclip-Übernahme in Animations-GLB ergänzen. Statischer GLB-Export ist seit 0.77.0, GLB mit bearbeitetem Hautskelett seit 0.78.0 und mit ausgewähltem Studio-Move (Knochen/Figur) seit 0.79.0 und mit freien Oberflächenpunkten als Morph-Animation seit 0.80.0 implementiert.
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

- [ ] Mit dem [CPU- und Browser-Importbenchmark](IMPORT-BENCHMARK.md) große reale Projekte einschließlich Texturen auf Zielhardware messen und anschließend gezielt optimieren. Das Browser-Messwerkzeug ist seit 0.81.0 implementiert; repräsentative Großmodelle, GPU-Fertigstellung und manuelle Performance-Abnahme bleiben offen.

## Noch zu entscheiden

- Desktop-Verpackung und geprüfte Betriebssysteme.
- Priorität, Hardwarebedarf und Lizenzen konkreter Generierungs-/Rigging-Verfahren.
- Projektlizenz.
- Erweiterungen der Exportformate und sichere Remote-Anbindung.

Three.js, glTF/GLB, JSON-Katalog, Studio-Projektformat 1 und unabhängige Anbieterprofile pro Rolle sind festgelegt.

