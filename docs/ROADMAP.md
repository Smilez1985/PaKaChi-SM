# Roadmap – was kommt

**Softwarestand: 0.17.0 · Abgleich: 16.10.2026.** Teil der [Blaupause](README.md).

Ein Häkchen bedeutet implementiert; es ersetzt keine visuelle oder externe Live-Abnahme. Die Nachweise und Prüfgrenzen stehen im [Prüfstand](PRUEFUNG.md). Die Versionshistorie gehört ins [Changelog](CHANGELOG.md).

## Nächste Arbeitspakete

1. **Korrekturen 0.11.0/0.11.1 visuell nachprüfen:** Drehung um die Figurenmitte auch nach Zoom/Pan sowie vollständige Körperverbindungen, Hand-/Fußziele, Rumpfbewegung und direktes Drehen. Nutzertest 0.10.0 meldete auseinanderziehbare Knochen und unbrauchbare Ausrichtung; diese Fehler sind technisch korrigiert, die erneute Nutzerabnahme steht aus. Anschließend Mausnavigation, kleine Gesichtspunkte, Gesamtverschiebung, Speichern/Laden und Agentensteuerung in einer lauffähigen Browserumgebung prüfen.
2. **Gelenkbearbeitung vervollständigen:** echte Quellknochen hinzufügen/löschen, Hautgewichte zuordnen und vorhandene Moves nach Änderungen prüfen. Erst damit wird das Beispiel „fehlendes Knie ergänzen und beugen“ vollständig erfüllt.
3. **Studio-Harness anbinden:** auf den Profilen und der Rollen-/Fähigkeitsprüfung aus 0.13.0 aufbauen; Modellauflistung ist seit 0.15.0 vorhanden. Assistenten-Inferenz für Ollama/OpenAI-kompatible APIs ist seit 0.16.0 vorhanden. Als Nächstes reale Modell-/Werkzeugqualität prüfen sowie native Cloud-Anmeldung und Fachadapter ergänzen. Details und Abnahme in Abschnitt 7.
4. **Aufträge und KI-Verfahren integrieren:** den Auftragskern aus 0.14.0 an geeignete Generator-/Rigging-Adapter und den Studio-Editor anschließen, echte Inferenz und Qualität prüfen, anschließend Korrekturvorschau und Übernahme integrieren. Vorhandene Skelettdaten auszulesen ist bereits möglich, aber keine KI-Anatomieerkennung.

Diese Reihenfolge ist ein Umsetzungsvorschlag, kein Terminversprechen. Lokale und externe Dienste sowie getrennte Anbieter je Rolle sind als Architektur festgelegt. Die konkreten zuerst unterstützten Verfahren, Hardwareanforderungen und Lizenzen sind noch zu prüfen.

## 1. Player und Model Zoo

- [x] Gemeinsame Anwendung mit Player, integriertem Studio und Avatar-Auswahl.
- [x] Geriggte 3D-Testmodelle laden und tatsächliche Animationsclips anbieten.
- [x] Original-PaKaChi mit beiden Formen und 72 Bildern bewahren.
- [x] Eigenständige GLB-Dateien lokal importieren; glTF/GLB und JSON-Katalog als aktuelle Formate festlegen.
- [ ] Bearbeitete Projekte in den gemeinsamen Model Zoo exportieren.
- [ ] Separate Move-Dateien und deren Austausch ergänzen.

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
- [ ] Quellknochen tatsächlich hinzufügen/löschen und Hautgewichte neu zuordnen. Bisher entfernt Löschen eines Skelettpunkts nur den Griff.
- [x] Vorhandenes Gesamtskelett automatisch verbinden; beim Posieren Ein-/Zweiglied-Ketten mit erhaltenen Knochenlängen lösen (0.11.0).
- [ ] Anatomische Gelenkketten aus ungeriggter Oberfläche erzeugen; Winkelgrenzen, fixierte Füße und gekoppelte Ganzkörper-IK ergänzen.
- [ ] Bewegungsfähige Rigs unterschiedlicher Körperformen systematisch prüfen.
- [x] Betroffene Posen/Moves nach Änderungen an Skelett-Grundstellung, freien Punktpositionen und Einflussbereichen zur Prüfung markieren (0.7.0).
- [ ] Bewegungen geometrisch auf Fehlstellungen, Gelenkgrenzen und Kollisionen prüfen und automatisch korrigieren.

**Abnahme:** Ein fehlendes Knie ergänzen und anschließend sinnvoll beugen; ebenso eine Figur mit abweichender Gliedmaßenanzahl bearbeiten. Diese vollständige Abnahme ist noch nicht erreicht.

## 5. Bild zu 3D und KI-Korrektur

- [ ] Bestehenden PaKaChi anhand seiner erhaltenen Tierform und korrigierten humanoiden Stilreferenz in 3D nachbilden; beide Formen und die Transformation erhalten.
- [x] Technische Vorauswahl und lokales TripoSR-Testwerkzeug mit Vorprüfung/GLB-Berichten vorbereiten (0.12.0).
- [ ] Geeignete Generierungs-/Rigging-Verfahren an echten Testfiguren bewerten. **Echte Inferenz und Qualitätsvergleich stehen weiterhin aus.** [Testlauf](KI-GENERIERUNG.md).
- [ ] Bildimport per Drag & Drop, tatsächliche Generierung, Fortschritt und Fehlermeldungen anschließen.
- [ ] Freien Korrekturprompt und „Skelett neu versuchen“ integrieren.
- [ ] Vorschau übernehmen/verwerfen, bisheriges Ergebnis bis dahin erhalten.

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

Beschlossenes Design: [Anbieter, Rollen und Auftragsablauf](KONZEPT.md#11-studio-als-ki-harness-und-freie-anbieterwahl). Die Konfigurationsgrundlage ist seit 0.13.0 umgesetzt; die verbleibenden Schritte bauen darauf auf. Ein gespeichertes Profil ist noch keine geprüfte Verbindung.

- [x] Profilformat, Adaptervertrag für Probe/Modellliste und interne Prüfung von Modellidentität und Rollenfähigkeit definieren (0.13.0; mit Testadaptern geprüft).
- [x] Internen Ausführungsvertrag mit Fortschrittsmeldungen, Abbruchsignal und Ergebnis sowie einen Auftragskern ergänzen (0.14.0; Testadapter).
- [ ] Produktive Adapter implementieren; Fähigkeiten und Auftragsabläufe gegen echte Dienste prüfen.
- [x] Mehrere benannte Profile mit Schnittstelle, Serveradresse und Modell-ID lokal speichern, bearbeiten, entfernen und unabhängig den Rollen zuordnen (0.13.0).
- [ ] Geschützte Zugangsdatenverwaltung ergänzen; Profile enthalten bislang bewusst keine Authentifizierungsfelder.
- [x] Modelllisten und Verbindungsprüfung für Ollama, LM Studio und OpenAI-kompatible APIs mit optionalem Sitzungsschlüssel; manuelle Modell-ID weiterhin möglich (0.15.0).
- [ ] Dauerhafte geschützte Zugangsdatenverwaltung, native Cloud-Adapter und offiziell unterstützte OAuth-Verfahren ergänzen.
- [ ] Adapter für passende OpenAI-kompatible Dienste einschließlich lokaler Ollama-/LM-Studio-Anbindungen und erforderliche native Anbieteradapter entwickeln; unterstützte Fähigkeiten und getestete Modelle dokumentieren.
- [x] Internen Auftragskern mit festem Anbieter/Modell, Fortschritt, Fehlern, Zeitlimit und Abbruch umsetzen; späte Antworten verwerfen und weder automatisch wiederholen noch den Anbieter wechseln (0.14.0).
- [ ] Auftragsoberfläche mit Empfängeranzeige vor Datenübertragung, ausdrücklichem Neuversuch und fernseitigem Abbruchstatus anbinden.
- [ ] Geeignete lokale und externe 3D- sowie Rigging-Adapter mit echten Eingaben prüfen. Geometrie, vollständige Körperhierarchie und Hautgewichte getrennt bewerten; Original-PaKaChi in beiden Formen und die Transformation zusätzlich prüfen.
- [ ] Optionalen integrierten Assistenten an die validierten Studio-Werkzeuge anschließen; externe MCP-Clients weiter unabhängig unterstützen. Direkte Generierung ohne zusätzlichen LLM-Aufruf ermöglichen.
- [x] Interne Ergebnisprüfung und Übernehmen/Verwerfen mit Sitzungs-/Revisionsabgleich bereitstellen (0.14.0; noch keine Studio-Transaktion).
- [ ] Formatspezifische Prüfung, Korrekturprompt, sichtbare Vorschau und atomare Studio-Übernahme samt Undo anschließen; gesamte Integration mit manuellen Zwischenänderungen testen.

**Abnahme:** Ein Nutzer kann drei unterschiedliche geeignete Dienste konfigurieren, Modelle je Rolle wählen und einen vollständigen Bild-zu-Avatar-Auftrag ausführen. Ein lokaler Ablauf benötigt keinen Cloud-Zugang. Fehler, Abbruch oder ein veraltetes Ergebnis überschreiben keine manuellen Änderungen; Neuversuche wechseln nicht unbemerkt Anbieter oder Kostenquelle. Exporte enthalten keine Zugangsdaten. Die Vorschau zeigt ein tatsächlich bewegliches Modell und wird erst nach Übernahme zum Projektstand.

## Noch zu entscheiden

- Desktop-Verpackung und tatsächlich geprüfte Betriebssysteme.
- Priorität und geprüfter Funktionsumfang konkreter lokaler und externer Anbieteradapter, Modelle, Hardwarebedarf und Lizenzen.
- Geschützte lokale Zugangsdatenverwaltung und anbieterspezifisch verfügbare OAuth-Verfahren.
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
- [x] Ziel/Datenumfang anzeigen; keine persistenten Schlüssel oder Chatverläufe, Abbruch und späte Antworten absichern.
- [ ] Reale Anbieter- und Modellabnahme einschließlich deutscher/englischer Studio-Aufgaben und Browser-CORS.
- [ ] Mehrschrittige Vorschau, Bildkontext und zusammenhängende Änderungstransaktionen ergänzen.
- [ ] Native Cloud-Adapter, geschützte Anmeldung und Generator-/Rigging-Ausführung unabhängig von der Assistentenrolle integrieren.

## 10. Anthropic-Abnahme

- [x] Frei zuordenbare Anthropic-Profile, native Modellliste und Assistenten-Werkzeugablauf (0.17.0).
- [x] API-Schlüssel nur in Headern, unbekannte/abgeschnittene Antworten abweisen, bestehende Studio-Prüfungen erhalten.
- [ ] Echter API-/Browserlauf mit Workspace-gebundenem Schlüssel und passendem Modell.
- [ ] Workspace-Auswahl und paginierte Modelllisten bei Bedarf ergänzen.
- [ ] Offiziell unterstütztes OAuth und geschützte dauerhafte Zugangsdatenverwaltung implementieren.
