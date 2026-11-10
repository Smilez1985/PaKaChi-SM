# Roadmap – offene Aufgaben

**Entwicklungsstand: 0.100.0 · Abgleich: 11.11.2026.** Teil der [Blaupause](README.md).

Diese Roadmap enthält offene Umsetzung und ausstehende Abnahme. Erledigte Änderungen stehen nach Version im [Changelog](CHANGELOG.md); Nachweise und Grenzen im [Prüfstand](PRUEFUNG.md). Eine implementierte Funktion ist nicht automatisch manuell oder mit realen Anbietern abgenommen.

## Übergabe und nächster Schritt

**Übergabe aktualisiert:** 2026-11-11T00:43:16+01:00 (Europe/Berlin). Entwicklungsstand **0.100.0**, letzter geprüfter main-Meilenstein **0.99.0**.

- **Arbeitsbranch:** `develop`. Laufende Änderungen dort committen; geprüfte Meilensteine nach `main` integrieren. 0.95.0 ist über [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) zusammengeführt. Die vollständige CI läuft nun auch auf `develop`. Diese Arbeitsweise ist in `AGENTS.md` festgehalten.
- **Neuester nachweislich grüner Entwicklungsstand:** Programmcommit `78be49d`, Version **0.99.0**, auf `develop` vollständig geprüft und unverändert nach `main` integriert. [CI #113](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42910426008): 497/497 Node-Tests, Build, 48/48 Browserfälle und drei Importmessungen; Abschlussartefakt ausgewertet. Auch der zusätzliche [main-Lauf #114](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42914511447) ist vollständig erfolgreich: 497 Tests, 48 Browserfälle, Build und drei Importmessungen; Artefakt geprüft. Abschlussnachtrag enthält ausschließlich Dokumentation/Messdaten.
- **Freigegebener Meilenstein:** **0.99.0 auf `main`**. Allgemeiner Schnitt-Gegenschritt und budgetbegrenzte Rückgabe vollständig geprüfter Vorschläge im Studio-/KI-Auftrag. Tierform-Standardauftrag: 760 → 747 Dehnungswarnungen ohne zusätzliche Körper-Schnittpaare an vier Winkeln. Bestehende Schnitte und weitere Charakter-/Anatomiequalität bleiben offen. [Nachweis](PRUEFUNG.md#version-0990).
- **Bild-zu-3D:** Seit 0.95.0 optionales erstes Zweibeiner-/Vierbeinerskelett mit Hautbindung auf statischer Generatorausgabe, getrennte Vorschau, Beugewarnungen und Übernahme ins Studio. Seit 0.96.0 unterstützen getrennte Standflächen die Körperausrichtung, Pfoten-/Fußanker und Vierbeiner-Rumpfhöhe; die Ausgangspose „Arme unten“ ist ergänzt. Echte Anatomieerkennung und zuverlässige Charakterqualität bleiben offen. [Ablauf](KI-GENERIERUNG.md#erster-beweglicher-entwurf-seit-0950).
- **Aktuelle Erweiterung 0.100.0:** Allgemeine Abschwächung statt vollständigem Einfrieren, strenge Paaridentitäts-Sperre und Einbezug der auffälligen tatsächlichen Bewegungsstichprobe. Die explizite Tierform-Referenz behält 551 → 545 Körperschnitte bei 65 vollständigen Paarproben ohne neue Paare. Vollständige CI und main-Abnahme stehen aus; der vorbereitete Trennungskandidat ist noch kein automatischer Generator. [Nachweis](PRUEFUNG.md#version-01000).
- **Vorherige Erweiterung 0.97.0:** Lokaler Kantenlängenfit als geometrische Korrektur im Studio und integrierten KI-Assistenten. Arbeitsform-Entwurf 784 → 765 auffällige Dreiecke, Gegenprüfung gespeicherter Posen/33 Move-Bilder; Tierform ohne akzeptierten Vorschlag. [Messbericht](PRUEFUNG.md#version-0970). Vollständige CI und Artefaktprüfung abgeschlossen.
- **Neue Grundlage:** Automatischer Auftrag vergleicht Gewichtsänderungen mit lokalen poseabhängigen geometrischen Korrekturformen; gemeinsame Pose-/Move-Gegenprüfung, Original-/Korrekturvorschau, KI-Aufruf, Undo und Projekt-/GLB-Export. Zusätzliche adaptive Bewegungsdiagnose und begrenzte separate Schnittdiagnose sind vorhanden. [Prüfbericht](PRUEFUNG.md#version-0940).
- **Eigener Schnittmessungs-Workflow:** `PaKaChi real-form intersection evidence` läuft bei Änderungen am Prüfer bzw. auf `workflow_dispatch` getrennt von der vollständigen CI. Er bereitet die existierenden GLB-Rigs vor, führt den lesenden Hüft-/Knie-Prüfauftrag für beide Formen aus, überprüft alle 16 statischen Stichproben und sichert `pakachi-intersections.json` als Actions-Artefakt. **Ein erfolgreiches Workflow-Ergebnis ist nur ein vollständiger Messbericht, keine Kollisionsfreiheit.** Messwerte und Modellqualität erst aus dem Artefakt beurteilen; Messlauf #2 ist erfolgreich und sein Artefakt ausgewertet; die damaligen Körper-/Fellprüfungen endeten am Budget. Die neue räumliche Suche misst beide Körpernetze in allen 16 statischen Proben ohne Budgetabbruch ([Nachweis](PRUEFUNG.md#räumliche-körper-schnittdiagnose--entwicklung-nach-0970)); Kontakte und ungültige Dreiecke bleiben ausdrücklich ungeklärt.
- **Neue belastbare Fehlerlokalisierung:** Körpernetz der Tierform: 0 Schnitte neutral, 551 bei 22,5° Hüfte, 936 bei 45°, 2.229 bei 90°; am Knie 77 bei 45° und 613 bei 90°. Arbeitsform: ein neutraler Körper-Schnitt, 21 bei 90° Hüfte. Diese vorhandenen Geometriefehler werden jetzt sichtbar; Körper-/Fellnetze wurden nicht verändert. Vollständige Baselines machen die bestehende automatische Schnittsperre auf den großen Körpernetzen nutzbar.
- **Gegenprobe verworfen:** Eine lokale Gewichtsübertragung an der Tierform-Schwanzbasis senkt bei 22,5° Hüfte die Dehnungsfehler 760 → 733, erhöht aber Schnitte 551 → 567. Die bestehende automatische Schnittsperre lehnt den Kandidaten mit vollständiger Körperabdeckung ab. Neue Formziele müssen diese Schnitte gemeinsam mit Dehnung und Volumen verbessern; bloßes Umverteilen zur Schwanzbasis genügt nicht.
- **Nächste Aktion:** 0.100.0 vollständig auf `develop` prüfen und den verifizierten Meilenstein nach `main` übernehmen. Danach aus der expliziten Trennreferenz einen allgemeinen, regionsgestützten Studio-/KI-Kandidaten entwickeln: Richtung, lokale Formerhaltung und dichte Paar-Gegenprüfung gemeinsam lösen. Körper-/Gliedmaßenerkennung und passende Anfangsbindungen weiterentwickeln. Erst danach gemeinsame Morph-Topologie und reversible Standard-Verwandlung abschließen.
- **Charakterstand:** 21 akzeptierte Korrekturhaltungen der Arbeitsform (fünf zusätzliche linke Hüfthaltungen), 11 der Tierform. Schulterkandidaten und weitere Hüftkandidaten bleiben nach den Messungen verworfen; die zugrunde liegenden Fehler bestehen weiter.
- **Danach:** Eine gespeicherte Standard-Verwandlung auf dieser Oberfläche, vorwärts und rückwärts mit identischen Zwischenformen; Qualität auch zwischen den Endposen prüfen.
- **Hardware parallel:** Die [fünf Verbindungsschritte](LOKALE-WERKZEUGE.md#verbindung-zu-deinem-rechner) bleiben verfügbar. Windows-/Caddy-/GPU-Abnahme ist offen, blockiert die CPU-basierte Charakter-/Rigarbeit jedoch nicht. Ein tatsächlicher externer Aufruf von `local_get_status` bleibt der erste Verbindungsnachweis.

## Prioritäten

1. **Bild-zu-3D und automatische Korrekturqualität erweitern:** Körper-/Gliedmaßenerkennung, passende Grundpose und besseres initiales Skinning weiterentwickeln.  Gewichts- und geometrische Kandidaten sowie separate adaptive Move-Diagnose sind implementiert. Bessere geometrische Kandidaten am Originalcharakter, mehrere abgestimmte Änderungen, adaptive Gegenprüfung im Auftrag und echte Fachmodell-Abnahme fehlen.
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
- [ ] Die seit 0.87.0 vorhandene Dreiecks-Dehnungsprüfung einzelner Posen nach der Move-Stichprobenprüfung und komponentenweisen Volumenschätzung nach den adaptiven Diagnose-Zwischenbildern um Kontakt- und Teilmodell-Kollisionen, lokale Volumenerhaltung und Referenzansichten erweitern (unabhängige Dreiecksschnitte innerhalb der Körpernetze sind jetzt statisch vollständig messbar); die seit 0.88.0 begrenzte Gewichtssuche und die seit 0.91.0 auf Ellenbogen und Knie erweiterten Korrekturformen um weitere Gelenke, durchgehende kombinierte Bewegungen und charakterbezogene Qualitätskriterien ergänzen. Die aktuellen Warnschwellen sind keine anatomische Abnahme.

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

- [ ] Anatomisches erstes Skelett auf beliebiger ungeriggter Oberfläche erkennen und zuverlässig binden. Proportionale Ausgangsvorlagen für neue statische Generatorausgaben sind seit 0.95.0 vorhanden; manuelle Abnahme und KI-Anatomie fehlen.

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
