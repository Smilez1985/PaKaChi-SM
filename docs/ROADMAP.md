# Roadmap – was kommt

**Softwarestand: 0.49.0 · Abgleich: 24.10.2026.** Teil der [Blaupause](README.md).

Ein Häkchen bedeutet implementiert; es ersetzt keine visuelle oder externe Live-Abnahme. Die Nachweise und Prüfgrenzen stehen im [Prüfstand](PRUEFUNG.md). Die Versionshistorie gehört ins [Changelog](CHANGELOG.md).

## Automatisierte Browserprüfung

- [x] GitHub-Actions-Workflow für Node-Tests, Build und Chromium-E2E mit HTML-Bericht, Fehler-Screenshots und Traces ergänzen (0.43.0).
- [x] E2E-Szenario für Assistentenvorschlag → Vorher/Nachher → Wiederherstellung → Übernahme → Undo vorbereiten (0.43.0).
- [x] Ersten echten Chromium-Lauf auf GitHub durchführen: Original-Transformation und KI-Sequenzvorschau bestehen; fünf weitere Fälle melden Fehler (0.43.0, Auswertung in 0.44.0).
- [x] Erkannte Ursachen korrigieren: Original-Metadaten beim Wechsel aktualisieren und Animationszeit unabhängig von langsamer Renderbildrate fortschreiben (0.44.0).
- [x] Korrigierten Stand 0.44.0 erneut auf GitHub ausführen: alle sieben Chromium-E2E-Fälle bestanden ([Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209)).
- [ ] Screenshots und tatsächliches Mausgefühl manuell auswerten; gerenderte Automatisierung ersetzt diese Gesamtabnahme nicht. Lokales Chromium bleibt beim Socket-Aufbau blockiert.

## Nächste Arbeitspakete

1. **Korrekturen 0.11.0/0.11.1 visuell nachprüfen:** Drehung um die Figurenmitte auch nach Zoom/Pan sowie vollständige Körperverbindungen, Hand-/Fußziele, Rumpfbewegung und direktes Drehen. Nutzertest 0.10.0 meldete auseinanderziehbare Knochen und unbrauchbare Ausrichtung; diese Fehler sind technisch korrigiert, die erneute Nutzerabnahme steht aus. Anschließend Mausnavigation, kleine Gesichtspunkte, Gesamtverschiebung, Speichern/Laden und Agentensteuerung in einer lauffähigen Browserumgebung prüfen.
2. **Gelenkbearbeitung vervollständigen:** Zwischengelenke in vorhandenen Knochenstrecken samt Gewichtsverteilung und Undo/Redo sind seit 0.47.0 vorhanden. Als Nächstes freies Hinzufügen, Löschen und Umhängen von Quellknochen sowie gezielte Hautgewichtsbearbeitung ergänzen; bestehende Moves und Gewichtsqualität prüfen. Ein fehlendes Knie lässt sich nun in eine vorhandene Strecke einfügen und beugen, jedoch noch kein vollständiges Rig aus einer ungeriggten Oberfläche erzeugen.
3. **Studio-Harness anbinden:** auf den Profilen und der Rollen-/Fähigkeitsprüfung aus 0.13.0 aufbauen; Modellauflistung ist seit 0.15.0 vorhanden. Assistenten-Inferenz für Ollama/OpenAI-kompatible APIs ist seit 0.16.0 vorhanden. Als Nächstes reale Modell-/Werkzeugqualität prüfen sowie weitere Fachadapter und offiziell unterstützte OAuth-Verfahren ergänzen. Anthropic und der optionale verschlüsselte Schlüsseltresor sind bereits angebunden. Details und Abnahme in Abschnitt 7.
4. **Aufträge und KI-Verfahren integrieren:** den seit 0.22.0 sichtbaren lokalen Generierungsablauf live prüfen, den Modellwechsel-Rücksprung und die abgesicherte 3D-Übernahme aus 0.24.0 visuell prüfen, weitere Generator-/Rigging-Adapter ergänzen, echte Inferenz und Qualität prüfen, die Generator-Fallbacks aus 0.25.0 live prüfen und anschließend gezielte Skelettkorrekturen mit Vorschau integrieren. Vorhandene Skelettdaten auszulesen ist bereits möglich, aber keine KI-Anatomieerkennung.

Diese Reihenfolge ist ein Umsetzungsvorschlag, kein Terminversprechen. Lokale und externe Dienste sowie getrennte Anbieter je Rolle sind als Architektur festgelegt. Die konkreten zuerst unterstützten Verfahren, Hardwareanforderungen und Lizenzen sind noch zu prüfen.

## 1. Player und Model Zoo

- [x] Gemeinsame Anwendung mit Player, integriertem Studio und Avatar-Auswahl.
- [x] Geriggte 3D-Testmodelle laden und tatsächliche Animationsclips anbieten.
- [x] Original-PaKaChi mit beiden Formen und 72 Bildern bewahren.
- [x] Eigenständige GLB-Dateien lokal importieren; glTF/GLB und JSON-Katalog als aktuelle Formate festlegen.
- [x] Vollständige 3D-Projektkopien in einer lokalen Browsersammlung speichern, auswählen, laden und bestätigt löschen (0.26.0; separate Auswahl neben dem mitgelieferten Katalog).
- [x] Lokale Sammlungslisten nach bestätigten Speicher-/Löschvorgängen zwischen Tabs aktualisieren; beim Fensterfokus nachladen, wartende Meldungen bündeln (0.45.0).
- [x] Zwei Browserfälle für F5-Persistenz einschließlich Posen/Moves und mehrere Tabs mit bestätigtem Löschen vorbereiten (0.45.0).
- [x] IndexedDB-Browserfälle erfolgreich ausführen: F5 erhält Posen, Moves und gespeicherte Identität; zwei Tabs übernehmen bestätigte Listenänderungen (0.45.0, [Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987)).
- [ ] Tatsächliche Speichergrenzen und Quotenfehler prüfen.
- [x] Lokal gespeicherte Avatare in gemeinsame Auswahl, Zähler und `list_avatars` aufnehmen; gespeicherte ID beim Laden und in der Steuerung erhalten (0.28.0).
- [x] Gemeinsame Auswahl inklusive gespeicherter IDs im echten Browser über die integrierte Steuerung prüfen (0.45.0).
- [ ] Gespeicherte Auswahl zusätzlich mit externem MCP-Host abnehmen.
- [x] Bearbeitete Projekte als statisches Katalogprojektpaket exportieren und im Player laden (0.29.0; CLI erstellt neuen Ordner, kein automatisches Deployment).
- [x] Kataloge mit Konflikt-, Quellen- und Größenprüfung in einem neuen Ordner zusammenführen; Quellen unverändert lassen und SHA-256-Bericht erzeugen (0.30.0).
- [ ] Veröffentlichungsablauf ergänzen und zusammengeführte Exportpakete im gerenderten Player abnehmen.
- [x] Eigene Studio-Moves als separate Dateien exportieren/importieren, nur bei identischem Modell und gleicher Bewegungsstruktur; Konflikte ohne Überschreiben lösen und gesamten Import rückgängig machen (0.27.0).
- [x] Browserfall für Dateidialog, Download, Importkonflikte, wiederholte Posen, Wiedergabe, Undo/Redo und unpassende Modellbindung ergänzen (0.46.0).
- [x] Move-Dateiaustausch-Fall im gerenderten Browser erfolgreich ausführen (0.46.0; [CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594)).
- [x] Gemeinsame statische moves/-Sammlung mit Katalog, Export eigener Projekt-Moves und revisionsgeschütztem Studio-Import ergänzen (0.31.0).
- [x] Zwei Move-Sammlungen per CLI mit Struktur-, Konflikt- und Größenprüfung zusammenführen, Quellen bytegenau erhalten und SHA-256-Bericht erzeugen (0.32.0).
- [ ] Sammlung im Browser bearbeiten und visuell abnehmen; GLB-Clip-Export und Retargeting auf andere Rigs ergänzen.

**Abnahme:** Avatar auswählen und vorhandene Bewegungen abspielen. Code und automatisierte Prüfungen vorhanden; visuelle Abnahme offen.

## 2. StateMaschine und externe Steuerung

- [x] Zustände und einmalige beziehungsweise wiederholte Moves unterscheiden; ungültige Befehle abweisen.
- [x] Manuelle Auswahl, MQTT und MCP über denselben Router führen.
- [x] MQTT opt-in mit Broker-Adresse, Topic und optionaler Anmeldung.
- [x] Acht MCP-Tools für Player-Fähigkeiten, Zustände, Moves und freigegebene Studio-Bearbeitung bereitstellen.
- [x] Python-MCP mit optional eingebettetem aMQTT und bestätigten Player-Antworten verbinden.
- [ ] Konkreten externen MCP-Host und externen NanoMQ-Broker live abnehmen.
- [x] Studio über `get_studio`/`edit_studio` abfragen und freigegeben bearbeiten; Sitzungs-/Revisionsprüfung und Undo (0.9.0).

**Abnahme:** Ein externer Agent fragt tatsächliche Fähigkeiten ab und löst einen unterstützten Zustand/Move aus. Reale Python-/MQTT-Prozessintegration einschließlich Studio in 0.9.0 geprüft; konkrete Host-Abnahme offen.

## 3. Posen und Bewegungen

- [x] Genau zwei Modi: „Figur bewegen“ und „Gelenke bearbeiten“.
- [x] Skelettgriffe und freie Gesichtspunkte posieren; Zeitabstände und Zwischenposen berechnen.
- [x] Gesamtposition als eigene Spur bearbeiten, auch ohne Skelett (0.6.0).
- [x] Eigene Moves mit Schlagwort, Vorschau und Wiedergabe im Player.
- [x] Bestehende Move-Posenfolgen per Maus bearbeiten: Einfügen, Ersetzen, Umordnen und Entfernen einzelner Vorkommen mit Undo/Redo (0.37.0).
- [x] Bestehende Sequenzen über MCP und Assistent auslesen und mit `update_move` ändern, einschließlich Freigabe, Revisionsprüfung und Undo (0.38.0).
- [ ] Sequenzbearbeitung im gerenderten Studio und mit externem KI-/MCP-Host abnehmen.
- [x] Neu/Laden/Speichern für vollständige `.pakachi.json`-Projekte; Undo/Redo.
- [x] Gesamtrotation als interpolierte Bewegungsspur ergänzen (0.8.0).
- [x] Gleichmäßige Skalierung als Bewegungsspur mit Mausregler, Posen, Undo/Redo und MCP ergänzen (0.10.0).
- [ ] Überblendung zwischen Originalclips und Studio-Moves ergänzen; bisher nur Originalclips untereinander.

**Abnahme:** Aus Posen eine Bewegung erstellen, speichern, erneut laden und abspielen. Geometrie-/Daten-/DOM-Prüfungen vorhanden; visueller Gesamtablauf offen.

## 4. Gelenke korrigieren

- [x] Freie Oberflächenpunkte hinzufügen, verschieben, löschen und unabhängig verbinden.
- [x] Skelett-Drehpunkte verschieben; vorhandene Oberfläche in der Grundpose erhalten.
- [x] Vorhandene Skelettgriffe und Eltern-Kind-Verbindungen per Button erkennen.
- [x] Automatische und manuelle Verbindungen einzeln entfernen.
- [x] Punktgröße, Auswahlfläche und Einflussradius getrennt behandeln.
- [x] Freie Punktgruppen bewegen und lokale Oberflächenverformung mit Hautbindung nutzen.
- [x] Echten Knochen zwischen vorhandenen Eltern-/Kindknochen einfügen; Hautgewichte anteilig umverteilen, Posen erweitern und markieren, Projektpersistenz und Undo/Redo (0.47.0).
- [x] Zwischengelenk-Bedienung, Undo/Redo und Projektdateiaustausch im Browser erfolgreich prüfen (0.47.0; [Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)).
- [ ] Gewichtsqualität der eingefügten Gelenke manuell prüfen.
- [x] Nicht skalierte Knochen mit Knochen-Eltern entfernen, Kindposen umrechnen und Gewichte zusammenführen; Projektpersistenz, Undo/Redo und Schutzfälle (0.48.0).
- [x] Knochenlöschen mit Undo/Redo und Projektdateiaustausch im Browser prüfen (0.49.0; [Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)).
- [ ] Hautverformung nach Knochenlöschen manuell prüfen.
- [x] Gemischte Einfüge-/Löschfolgen mit gespeicherter Reihenfolge, Rekonstruktion der Gewichte und einzelnen Undo-/Redo-Schritten ermöglichen (0.49.0).
- [x] Löschen, Ersatzgelenk einfügen und erneutes Laden im echten Browser prüfen (0.49.0; [Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)).
- [ ] Hautqualität nach gemischten Umbaufolgen manuell prüfen.
- [ ] Frei hinzufügen/umhängen, skalierte Knochen und Anbauteile unterstützen; Hautgewichte gezielt bearbeiten und neue Topologieaktionen über MCP anbieten.
- [x] Vorhandenes Gesamtskelett automatisch verbinden; beim Posieren Ein-/Zweiglied-Ketten mit erhaltenen Knochenlängen lösen (0.11.0).
- [x] Manuell einstellbare Beugegrenzen am mittleren Knochen einer Zweiglied-IK-Kette berücksichtigen; Grenzen speichern, über MCP bearbeiten und betroffene Posen markieren (0.33.0).
- [ ] Anatomische Gelenkketten aus ungeriggter Oberfläche erzeugen; allgemeine Dreh-/Twistgrenzen, fixierte Füße und gekoppelte Ganzkörper-IK ergänzen.
- [x] Gespeicherte Einzelposen lesend gegen konfigurierte IK-Beugegrenzen prüfen; Winkel, Verletzungen und nicht auswertbare Ketten anzeigen (0.34.0).
- [x] Eigene Studio-Moves einschließlich Zwischenbildern und Schleifenrückweg stichprobenartig gegen Beugegrenzen prüfen; Abbruch und Schutz vor veralteten Ergebnissen (0.35.0).
- [x] Auffällige Stichproben direkt pausiert ansehen, vorherige Bearbeitungspose bei Stopp wiederherstellen und Prüfbilder ausdrücklich als neue Pose übernehmen (0.36.0; ein Undo-Schritt).
- [ ] Beugegrenzen, Posen- und Bewegungsprüfung samt Prüfbildübernahme im gerenderten Studio abnehmen; lückenlose Bewegungsprüfung, direkte Drehgrenzen und Korrekturen ergänzen.
- [ ] Bewegungsfähige Rigs unterschiedlicher Körperformen systematisch prüfen.
- [x] Betroffene Posen/Moves nach Änderungen an Skelett-Grundstellung, freien Punktpositionen und Einflussbereichen zur Prüfung markieren (0.7.0).
- [ ] Bewegungen geometrisch auf Fehlstellungen, Gelenkgrenzen und Kollisionen prüfen und automatisch korrigieren.

**Abnahme:** Ein fehlendes Knie ergänzen und anschließend sinnvoll beugen; ebenso eine Figur mit abweichender Gliedmaßenanzahl bearbeiten. Diese vollständige Abnahme ist noch nicht erreicht.

## 5. Bild zu 3D und KI-Korrektur

- [ ] Bestehenden PaKaChi anhand seiner erhaltenen Tierform und korrigierten humanoiden Stilreferenz in 3D nachbilden; beide Formen und die Transformation erhalten.
- [x] Lokalen TripoSR-HTTP-Dienst und Fachadapter mit Auftragskern verbinden (0.21.0; Transporttest mit synthetischem Backend, keine GPU-Abnahme).
- [x] Technische Vorauswahl und lokales TripoSR-Testwerkzeug mit Vorprüfung/GLB-Berichten vorbereiten (0.12.0).
- [ ] Geeignete Generierungs-/Rigging-Verfahren an echten Testfiguren bewerten. **Echte Inferenz und Qualitätsvergleich stehen weiterhin aus.** [Testlauf](KI-GENERIERUNG.md).
- [x] Bildimport per Drag & Drop, lokalen Generatoraufruf, Phasenstatus und Fehlermeldungen anschließen (0.22.0; Inferenz-/Browserabnahme offen).
- [ ] Freien Korrekturprompt und „Skelett neu versuchen“ integrieren.
- [x] Getrennte Vorschau übernehmen/verwerfen und bisheriges Modell bis dahin erhalten (0.22.0; Übernahme als revisionsgeschützter Import).
- [x] Separaten Rücksprung/Wiederholen für den letzten vollständigen Modellwechsel mit Projektinhalten bereitstellen (0.23.0; ein Sitzungs-Snapshot).
- [x] 3D-Kandidat separat vorbereiten und bei synchronen Übergabefehlern Viewer, Editor, DOM und StateMachine-Bindung wiederherstellen (0.24.0; Fehler-Injektion in DOM-/Komponententests).
- [ ] Diesen Ablauf im gerenderten Browser prüfen; Fehler beim separaten Neustart des Original-Bildplayers und GPU-Kontextverlust gesondert absichern.

**Abnahme:** Ein Bild wird tatsächlich zu einem überprüfbaren, beweglichen Modell. Platzhalter oder nur geladene Skelettdaten erfüllen dieses Ziel nicht.

## 6. Bedienung, Qualität und Export

- [x] Freie Ansichtsdrehung mit gedrücktem Mausrad, Zoomen und Rechtsziehen ohne Tastaturmodifikatoren; Drehpunkt an der aktuellen Figurenmitte statt am verschobenen Zoom-Ziel (0.11.1).
- [x] Rück-/Unterseite zugänglich machen; direkte Punktbewegung und optionale Achsgriffe.
- [x] Deutsch/English für Studio-Bedienelemente sowie invertierbare Drehrichtung lokal speichern.
- [x] Ursprüngliches Modell und bearbeitbare Studio-Daten in der Projektdatei erhalten.
- [ ] Lokalisierung von Originalplayer, Modellbeschreibungen und technischen Meldungen vervollständigen.
- [ ] Modellqualität und Dateigröße skalieren; Quelle neben optimierten Ableitungen bewahren.
- [ ] Animationen nach Optimierungen prüfen; eigenständigen GLB-Export ergänzen.
- [ ] Gesamten Ablauf ohne Fachwissen erproben.

**Abnahme:** Bild hineinziehen, Avatar korrigieren, Bewegung erstellen, speichern und per Agent auslösen – in einer Anwendung.

## 7. Studio-Harness und Anbieteranbindung

Beschlossenes Design: [Anbieter, Rollen und Auftragsablauf](Design.md#11-studio-als-ki-harness-und-freie-anbieterwahl). Die Konfigurationsgrundlage ist seit 0.13.0 umgesetzt; die verbleibenden Schritte bauen darauf auf. Ein gespeichertes Profil ist noch keine geprüfte Verbindung.

- [x] Profilformat, Adaptervertrag für Probe/Modellliste und interne Prüfung von Modellidentität und Rollenfähigkeit definieren (0.13.0; mit Testadaptern geprüft).
- [x] Internen Ausführungsvertrag mit Fortschrittsmeldungen, Abbruchsignal und Ergebnis sowie einen Auftragskern ergänzen (0.14.0; Testadapter).
- [ ] Produktive Adapter implementieren; Fähigkeiten und Auftragsabläufe gegen echte Dienste prüfen.
- [x] Mehrere benannte Profile mit Schnittstelle, Serveradresse und Modell-ID lokal speichern, bearbeiten, entfernen und unabhängig den Rollen zuordnen (0.13.0).
- [x] Optionalen passwortverschlüsselten Browsertresor ergänzen (0.19.0), einschließlich Passwortwechsel und Sitzungssperre (0.20.0); Schlüssel bleiben von Profilen und Projekten getrennt.
- [x] Modelllisten und Verbindungsprüfung für Ollama, LM Studio und OpenAI-kompatible APIs mit optionalem Sitzungsschlüssel; manuelle Modell-ID weiterhin möglich (0.15.0).
- [ ] Weitere native Cloud-Adapter und offiziell unterstützte OAuth-Verfahren ergänzen; Tresor und nativer Anthropic-Adapter sind implementiert.
- [x] Assistententransporte für Ollama, LM Studio, OpenAI-kompatible APIs und Anthropic implementieren (0.16.0/0.17.0; Protokolltests).
- [ ] Unterstützte Fähigkeiten und Modellqualität an realen lokalen Diensten und Cloud-Konten abnehmen.
- [x] Internen Auftragskern mit festem Anbieter/Modell, Fortschritt, Fehlern, Zeitlimit und Abbruch umsetzen; späte Antworten verwerfen und höchstens einmal ausführen (0.14.0); optionale Vorprüfungs-Fallbacks seit 0.25.0.
- [x] Generatoroberfläche mit sichtbarer Route, Phasenstatus, Abbruchhinweis, getrennter Vorschau und ausdrücklichem Versuch beim nächsten Anbieter anbinden (0.22.0/0.25.0).
- [ ] Geeignete lokale und externe 3D- sowie Rigging-Adapter mit echten Eingaben prüfen. Geometrie, vollständige Körperhierarchie und Hautgewichte getrennt bewerten; Original-PaKaChi in beiden Formen und die Transformation zusätzlich prüfen.
- [x] Optionalen integrierten Assistenten an validierte Studio-Werkzeuge anschließen (0.16.0); externe MCP-Clients bleiben unabhängig. Direkte lokale Generierung benötigt keinen zusätzlichen LLM-Aufruf (0.22.0).
- [x] Interne Ergebnisprüfung und Übernehmen/Verwerfen mit Sitzungs-/Revisionsabgleich bereitstellen (0.14.0; noch keine Studio-Transaktion).
- [x] Formatspezifische Geometrieprüfung und sichtbare Vorschau mit revisionsgeschütztem Import anschließen (0.22.0; DOM-/Geometrietests).
- [ ] Korrekturprompt ergänzen und abgesicherte 3D-Übernahme samt Modellwechsel-Rücksprung im gesamten Ablauf visuell prüfen.

**Abnahme:** Ein Nutzer kann drei unterschiedliche geeignete Dienste konfigurieren, Modelle je Rolle wählen und einen vollständigen Bild-zu-Avatar-Auftrag ausführen. Ein lokaler Ablauf benötigt keinen Cloud-Zugang. Fehler, Abbruch oder ein veraltetes Ergebnis überschreiben keine manuellen Änderungen; Neuversuche wechseln nicht unbemerkt Anbieter oder Kostenquelle. Exporte enthalten keine Zugangsdaten. Die Vorschau zeigt ein tatsächlich bewegliches Modell und wird erst nach Übernahme zum Projektstand.

## Noch zu entscheiden

- Desktop-Verpackung und tatsächlich geprüfte Betriebssysteme.
- Priorität und geprüfter Funktionsumfang konkreter lokaler und externer Anbieteradapter, Modelle, Hardwarebedarf und Lizenzen.
- Betriebssystem-Schlüsselbund für eine mögliche Desktop-Fassung und anbieterspezifisch verfügbare OAuth-Verfahren; der optionale Browsertresor ist implementiert.
- Lizenz.
- Erweiterungen der Exportformate und der sicheren Remote-Anbindung.

Three.js, glTF/GLB, JSON-Katalog und Studio-Projektformat 1 sind bereits die Implementierungsbasis; diese Entscheidungen sind nicht mehr pauschal offen.

## 8. Freie Modellwahl und lokale Einrichtung

- [x] Unabhängige Profile für ALLE Rollen; keine feste Bindung zwischen Rolle und lokalem/Cloud-Anbieter.
- [x] Optionaler Ollama-Helfer mit Hardwaremessung, Speicherbudget, exakten Tags, ausdrücklicher Downloadbestätigung und eigenen Tags (0.15.0).
- [x] Nach Download Modellidentität, 4096 Kontext, vollständige GPU-Belegung beziehungsweise ausdrücklichen CPU-Betrieb und zwei einfache Werkzeugaufrufe prüfen; Bericht und eigener Alias.
- [ ] Reale Hardwareabnahme und komplexe deutsche/englische Studio-Aufgaben einschließlich Bilder pro Quantisierung prüfen.
- [ ] AMD/Intel/Apple und mehrere GPUs zuverlässig messen; LM-Studio-Modellinstallation prüfen.
- [ ] Für jede Rolle lokale und Cloud-Ausführung integrieren: direkte Fachmodelle sowie LLM-gesteuerte Werkzeugketten, soweit nachweislich geeignet.
- [x] Native Anthropic-Modelllisten und Messages mit API-Schlüssel anbinden (0.17.0; Protokolltests).
- [ ] Reale Kontoabnahme für Anthropic, OpenAI, DeepInfra und OpenRouter; weitere Authentifizierungswege nur nach offizieller Unterstützung.
- [ ] Fachverfahren für Geometrie und Rigging live validieren und über austauschbare Adapter zugänglich machen. Recherche nur nach diesen Aufgaben, kein Gesamtkatalogscan.

Details: [Modellauswahl](LOKALE-MODELLE.md). Die aktuelle Ollama-Kuration ist eine Einstiegshilfe für die lokale Assistentenrolle und keine Einschränkung der anderen Rollen.

## 9. Integrierter Assistent

- [x] Aufgaben an das unabhängig gewählte Assistentenprofil senden (Ollama, LM Studio, OpenAI-kompatible Chat-API; 0.16.0).
- [x] Begrenzte lesende Werkzeugschleife und konkrete, einzeln bestätigte Studio-Vorschläge mit bestehender Freigabe, Sitzung/Revision und Undo.
- [x] Ziel/Datenumfang anzeigen; keine gespeicherten Chatverläufe; Schlüssel optional im getrennten verschlüsselten Tresor, Abbruch und späte Antworten absichern.
- [ ] Reale Anbieter- und Modellabnahme einschließlich deutscher/englischer Studio-Aufgaben und Browser-CORS.
- [x] Mehrere bestehende Move-Sequenzen gemeinsam ändern: vollständig vorprüfen, einmal bestätigen und als einen Undo-/Redo-Schritt übernehmen (0.40.0).
- [x] Lokale Vorher-/Nachher-Tabellen für einzelne Sequenzvorschläge und Pakete mit Namen, IDs, wiederholten Schritten und Revisionsprüfung anzeigen (0.41.0).
- [x] Vorgeschlagene und bisherige Posenfolgen vor Übernahme einzeln am Studio-Modell abspielen; Bearbeitungspose danach wiederherstellen, ohne Projekt-/Undo-Änderung (0.42.0).
- [ ] Vorschau und Sequenzpakete im gerenderten Browser sowie mit externem Anbieter abnehmen; Bildkontext und Transaktionen für weitere Studio-Aktionen ergänzen.
- [ ] Weitere Cloud-Fachadapter und Rigging-Ausführung unabhängig von der Assistentenrolle integrieren; Anthropic, Tresor und lokaler Generator sind vorhanden.

## 10. Anthropic-Abnahme

- [x] Frei zuordenbare Anthropic-Profile, native Modellliste und Assistenten-Werkzeugablauf (0.17.0).
- [x] API-Schlüssel nur in Headern, unbekannte/abgeschnittene Antworten abweisen, bestehende Studio-Prüfungen erhalten.
- [ ] Echter API-/Browserlauf mit Workspace-gebundenem Schlüssel und passendem Modell.
- [x] Paginierte Anthropic-Modelllisten vollständig innerhalb fester Grenzen laden; Abbruch, gemeinsamer Timeout und Cursorprüfung (0.39.0).
- [ ] Zusätzliche Workspace-Auswahl bei Bedarf ergänzen; paginierte Listen mit echtem Konto/Browser abnehmen.
- [ ] Offiziell unterstütztes OAuth implementieren; API-Schlüssel können bereits optional im Browsertresor gespeichert werden.

- [x] Editierbare Standardadressen und schnittstellenbezogene Adressentwürfe ergänzen (0.17.1).

- [x] Sechs Einrichtungsvorlagen für Anthropic, OpenAI, OpenRouter, DeepInfra, Ollama und LM Studio (0.17.1); echte Konto-/Modellabnahme bleibt offen.

## 11. Mehranbieter-Routen (0.18.0)

- [x] Gleichzeitig gespeicherte Anbieter-/Modellprofile mit unabhängigem Hauptprofil und sortierbaren Fallbacks für alle drei Rollen.
- [x] Profilbezogene Sitzungsschlüssel und Modellwahl beim Umschalten erhalten.
- [x] Assistent führt konfigurierte Route mit passendem Schlüssel je Profil aus; Abbruch und Studio-Konflikte stoppen sie.
- [x] Optionaler passwortverschlüsselter lokaler Schlüsseltresor über Seitenneustarts hinweg (0.19.0).
- [x] Generatorroute: automatische Fallbacks während der Fähigkeitsprüfung, begrenzte Probezeit, Revisionsschutz vor Ausführung und ausdrücklicher Versuch beim nächsten Anbieter nach Auftragsfehler (0.25.0; lokaler TripoSR-Adapter).
- [ ] Weitere Cloud-Generator-/Rigging-Fachadapter und Rigging-Fallback-Ausführung anschließen.
- [ ] Echte Anbieter-/Kontoabnahme der Fallbacks.

## 12. Schlüsseltresor

- [x] Explizites verschlüsseltes Speichern und Entsperren passend zu mehreren Profilen und deren tatsächlichen Zieladressen (0.19.0).
- [x] Falsches Passwort, manipulierte Daten, Speicherfehler und veraltete Operationen abweisen; bestehende Ablage erhalten.
- [ ] Visuelle Browserabnahme sowie unabhängige Sicherheitsprüfung.
- [x] Passwortwechsel mit Prüfung des bisherigen Passworts und Erhalt des gespeicherten Schlüsselbestands (0.20.0).
- [x] Ausdrückliche Sitzungssperre mit Löschen der Sitzungsschlüssel/Schlüsselentwürfe und Verwerfen laufender Ergebnisse (0.20.0).
- [ ] Optional Betriebssystem-Schlüsselbund für spätere Desktop-Verpackung prüfen.
