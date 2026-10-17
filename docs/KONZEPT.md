# PaKaChi-SM – Designdokument

Teil der [Blaupause](README.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

## Status und Begriffe

Dieses Dokument hält das Produktziel fest. Anforderungen ohne ausdrücklich genannten Implementierungsstand sind keine Zusage einer bereits verfügbaren Funktion. Stand 0.20.0: Player, gemeinsame Agentensteuerung, Gelenk-/Gesichtspunktbearbeitung, Posen/Moves und Gesamtspuren für Position, Drehung und gleichmäßige Größe sind implementiert. [STUDIO.md](STUDIO.md) beschreibt die bedienbaren Funktionen und ihre Grenzen; vollständiger Quellknochenumbau und KI-Generierung bleiben Entwicklungsziele.

- **PaKaChi:** Panda-KI-Chimera, das übergeordnete Projekt.
- **PaKaChi-SM:** StateMaschine mit Avatar-Player und integriertem Studio.
- **PaKaChi-Avatar-Studio:** Editor-Bereich innerhalb des Players.
- **Model Zoo:** gemeinsame Sammlung der Modelle, Moves und Zustandszuordnungen.

## Bestehender PaKaChi-Avatar

Tierform und humanoide Arbeitsform bleiben derselbe bestehende Charakter. Die 72 Transformationsbilder und der bisherige Player sind als Originalstand erhalten. Die spätere 3D-Umsetzung übernimmt sein Design; technische Testfiguren ersetzen ihn nicht.

Verbindliche Merkmale aus dem erhaltenen Animationsplan: weiches schwarzes künstliches Fell, cremefarbene Schnauze und Brauen, grüne Augen, Wangenflächen und Ohrinnenseiten, buschiger schwarz-grün geringelter Schwanz, dunkle mechanische Gelenke und grüner Brustkern. Kopfgröße, Gesicht und Schwanzmasse sollen konsistent bleiben. Keine neue Panzerung oder zusätzliche Spezies.

[Referenzen und Herkunft](references/README.md) unterscheiden den ursprünglichen, visuell noch fehlerhaften Transformationsstand von der korrigierten Endform als Stilanker. Die 72 Bilder sind ausschließlich die Verwandlung ohne Tablet/Stift; eigene Arbeitsschleifen bleiben eine spätere Ergänzung.

## 1. Player und Model Zoo

Der Player bietet eine Dropdown-Auswahl für die Avatare im Model Zoo. Nach der Auswahl zeigt eine Legende die vom Avatar tatsächlich unterstützten Bewegungen und Zustände samt Schlagworten an.

Ein Button öffnet das Avatar-Studio innerhalb derselben Anwendung. Gespeicherte Änderungen stehen anschließend im Player bereit. Im Studio und im Player wird dieselbe Datenbasis verwendet.

Jeder Avatar besitzt sein eigenes Modell, Skelett, Gesichtssteuerungen, Bewegungen und Zustandszuordnungen. Bewegungen dürfen nicht ungeprüft auf ein inkompatibles Skelett angewendet werden.

## 2. Bild zu Avatar

1. Ein 2D-Bild per Drag & Drop einfügen.
2. Die Generierung erstellt ein 3D-Modell und versucht, ein passendes Skelett samt beweglicher Oberfläche zu erzeugen.
3. Den Avatar drehen und aus verschiedenen Blickwinkeln prüfen.
4. Ergebnis übernehmen oder mit einem Korrekturprompt erneut versuchen.

Es gibt keine Beschränkung auf humanoide Figuren. Zusätzliche Arme, Flügel, Schwänze und andere Körperformen gehören zum Zielumfang.

**Technische Grenze:** Ein einzelnes Bild enthält keine vollständige 3D-Information. Rückseite, Tiefe und verdeckte Teile müssen geschätzt werden. Die Bedienung kann einfach sein, auch wenn die automatische Erzeugung mehrere Versuche benötigt.

Seit 0.12.0 ist ein experimenteller lokaler TripoSR-Testlauf als separates Entwicklerwerkzeug vorhanden. Er erzeugt bei eingerichteter Laufzeit einen zu prüfenden GLB-Entwurf; die produktive Inferenz und Designqualität sind noch nicht nachgewiesen. Tier- und humanoide Form werden einzeln getestet. Ein erfolgreicher Import ersetzt weder anatomisches Rigging noch den abgestimmten Formwechsel. Details: [KI-Testlauf](KI-GENERIERUNG.md).

Die geplante Auswahl unabhängiger Generator- und Rigging-Anbieter beschreibt [Studio als KI-Harness](#11-studio-als-ki-harness-und-freie-anbieterwahl).

## 3. Genau zwei Bearbeitungsmodi

### Figur bewegen

Körperteile direkt mit der Maus greifen und in eine Pose ziehen. Die Gelenklinien bilden zusammenhängende Bewegungsketten des gesamten Körpers: Hand–Ellenbogen–Schulter, Fuß–Knie–Hüfte sowie Rumpf–Hals–Kopf. Ziehen muss die Kette beugen, ohne Körperteile zu trennen oder Knochen künstlich zu verlängern. Gesichtsausdrücke und die Gesamtposition sollen ebenfalls bearbeitbar sein. Verständliche Griffpunkte ersetzen technische Knochenlisten und Zahlenfelder im normalen Arbeitsablauf.

Drehen der Ansicht und Bewegen der Figur müssen klar unterscheidbar sein. Räumliches Positionieren darf kein Wissen über 3D-Koordinaten voraussetzen.

### Gelenke bearbeiten

- Gelenk hinzufügen: gewünschte Stelle an der Figur auswählen.
- Gelenk verschieben: vorhandenen Punkt greifen und versetzen.
- Gelenk löschen: ausgewählten Punkt entfernen.

Beispiel: Fehlt das rechte Knie, fügt der Benutzer dort einen Gelenkpunkt hinzu und kann das Bein anschließend an dieser Stelle beugen.

**Erforderliche Hintergrundarbeit:** Der Editor muss die Skelettverbindungen, die räumliche Tiefe des Gelenks und die Zuordnung der Oberfläche zu den Gelenken bestimmen oder korrigieren. Ein sichtbarer Punkt allein macht das Modell noch nicht beweglich. Bei mehrdeutiger Zuordnung soll eine einfache visuelle Korrektur möglich sein.

Seit 0.11.0 wird das gesamte vorhandene Skelett beim neuen Laden verbunden. Ein-/Zweiglied-Ketten drehen sich beim Ziehen mit festen lokalen Knochenabständen; Rumpfbewegung trägt den Körper mit. Die Ausrichtung ist durch direktes Ziehen im Drehmodus änderbar. Anatomische Winkelgrenzen und Ganzkörper-IK bleiben offen. Seit 0.5.0 erkennen zwei Buttons vorhandene Skelettgriffe und Eltern-Kind-Verbindungen. Manuelle Verbindungen lassen sich gezielt ergänzen und einzeln entfernen. Diese Erkennung wertet Modelldaten aus; anatomische KI-Erkennung für Figuren ohne Skelett bleibt offen.

### Präzision und frei gestaltbare Kontrollpunkte

- Ansichtsdrehung um den aktuellen Mittelpunkt der gesamten Figur, unabhängig von Gelenkauswahl und Zoom-Ziel. Seit 0.11.1 bleibt der Drehpunkt für eine Geste fest. Freie Ansichtsdrehung durch Drücken/Halten des Mausrads und Bewegen der Maus; im Optionsmenü invertierbar. Drehung um alle Achsen, einschließlich Rollen sowie Zugang zu Rückseite und Unterseite. Die Ansichtsdrehung verändert keine gespeicherten Gelenkkoordinaten.
- Mausrad-Zoom bis in kleine Gesichtsbereiche; Ansicht zum gewünschten Detail verschieben und bei Bedarf zurücksetzen.
- Gelenkpunkte frei im 3D-Raum beziehungsweise auf der sichtbaren Oberfläche setzen, auch ohne vorhandene Gelenkkette. Ansichtsdrehung und Tiefenkorrektur ermöglichen präzise Platzierung.
- Sichtbare Punktgröße pro Punkt anpassen: zum Beispiel klein am Mundwinkel, größer am Knie. Ein kleiner gezeichneter Punkt behält eine gut erreichbare Auswahlfläche.
- Punkte gezielt miteinander verbinden oder Verbindungen lösen. Neue Punkte müssen nicht automatisch an das vorhandene Körperskelett angeschlossen werden.
- Beliebige unabhängige Gruppen erlauben: zum Beispiel drei Mundpunkte, ein Punkt pro Auge oder mehrere Punkte pro Augenlid. Der Benutzer bestimmt den Detailgrad.
- Punktgröße, Auswahlfläche und Einfluss auf die Modelloberfläche sind getrennte Eigenschaften. Der Benutzer soll deren Wirkung direkt sehen und korrigieren können.

Ein Gesichtspunkt ist eine verständliche Oberflächensteuerung und muss intern nicht zwingend ein klassischer Skelettknochen sein. Knochen, Oberflächendeformationen und Gesichtsformen können dieselbe einfache Bedienung erhalten. Beliebige logische Verbindungen dürfen intern kein ungültiges oder zyklisches Skelett erzeugen. Die Umsetzung löst diesen Unterschied im Hintergrund.

Seit 0.7.0 werden Posen und daraus bestehende Moves bei relevanten Gelenkänderungen automatisch zur Prüfung markiert. Die Änderungsprüfung erkennt mögliche Auswirkungen; sie bewertet keine Anatomie oder Kollisionen. Eine geometrische Kompatibilitätsprüfung bleibt offen. Eine automatische Anpassung ist nur zu übernehmen, wenn sie ein gültiges Ergebnis liefert; andernfalls wird die betroffene Bewegung zur Korrektur markiert.

## 4. KI-Neuversuch und Korrekturprompt

Ein gut sichtbarer Button **„Skelett neu versuchen“** und ein freies Textfeld ermöglichen beispielsweise:

> Das rechte Knie fehlt. Der Schwanz soll an drei Stellen beweglich sein.

Der Neuversuch muss sich auf die gewünschte Korrektur beziehen. Bei einer Skelettkorrektur soll das Aussehen erhalten bleiben, soweit die notwendige Oberflächenanpassung dies erlaubt.

Als Schutzkonzept ist eine Vorschau mit Übernehmen oder Verwerfen vorgesehen. Das bisherige Ergebnis und manuelle Korrekturen bleiben bis zur Übernahme erhalten. Rückgängig/Wiederholen ist im manuellen Studio seit 0.3.0 vorhanden; die KI-Vorschau bleibt ein Entwicklungsziel.

## 5. Bewegung erstellen

1. Figur in die erste Pose ziehen.
2. **Pose hinzufügen** auswählen.
3. Weitere Posen erstellen, typischerweise drei bis zehn.
4. Reihenfolge und Zeitabstände bestimmen.
5. **Vorschau** abspielen; Zwischenposen werden automatisch berechnet.
6. Eindeutiges Schlagwort und verständlichen Anzeigenamen vergeben.
7. **Als Bewegung speichern** auswählen.

Die Anzahl drei bis zehn beschreibt den typischen Arbeitsablauf, keine bereits festgelegte technische Obergrenze.

Eine Bewegung enthält Zeitpunkte, Gelenktransformationen, gegebenenfalls Gesichtsparameter und die Gesamtposition. Sie benötigt keine Sammlung separat gezeichneter Einzelbilder. Die erste Umsetzung speichert Posen und Moves textbasiert in versionierten `.pakachi.json`-Projekten. Seit 0.6.0 enthält jede neue Pose zusätzlich die globale Verschiebung der gesamten Figur, auch bei Modellen ohne Knochen. Seit 0.8.0 wird auch die Gesamtdrehung um den ursprünglichen Modellmittelpunkt gespeichert und interpoliert. Seit 0.10.0 enthält die Gesamtspur außerdem eine proportionale Skalierung von 10 % bis 500 %, per Mausregler bearbeitbar und zwischen Posen linear interpoliert. Separate Move-Dateien bleiben offen.

Glatte Interpolation allein garantiert keine natürlichen Bewegungen oder Kollisionsfreiheit. Gelenkgrenzen und geeignete Übergänge sind Teil der Umsetzung.

## 6. Neu, Laden, Speichern und Qualität

- **Neu:** neues Projekt beginnen; ungespeicherte Änderungen vorher sichern oder bewusst verwerfen.
- **Laden:** Avatar samt bearbeitbaren Daten und Moves wiederherstellen.
- **Speichern:** Modell, Skelett, Gelenkkorrekturen, Posen, Moves, Schlagworte und Zustandszuordnungen sichern.
- **Avatar-Qualität:** verständliche Skalierung von Detailgrad und Dateigröße.

Vorgeschlagene Qualitätsstufen: Klein, Standard, Hoch und Maximum. Die tatsächliche Dateigröße wird nach der Berechnung angezeigt. Qualität betrifft insbesondere Geometrie und Texturen. Skelett und Bewegungsfähigkeiten sollen erhalten bleiben und nach Optimierungen geprüft werden.

Bearbeitbare Quelldaten sollen erhalten bleiben, damit ein kleiner Export nicht die einzige verbleibende Modellfassung ist.

## 7. StateMaschine

Ein **Zustand** bleibt aktiv, bis ein neuer Zustand angefordert wird. Eine **Bewegung** kann einmalig ablaufen oder wiederholt werden.

Beispiele:

| Eingabe | Bedeutung |
| --- | --- |
| idle | Agent wartet |
| talking | Agent spricht |
| thinking | Agent denkt |
| working | Agent arbeitet |
| gaehnen | Einmalige Bewegung |

Die Zuordnung zu konkreten Animationen gehört zum jeweiligen Avatar. Nicht jeder Avatar muss dieselben Fähigkeiten besitzen.

Implementiert sind die Rückkehr aus einmaligen Moves und das Abweisen ungültiger Befehle. Der letzte gültige neue Zustand gewinnt; es gibt keine Befehlswarteschlange. Die Überblendung ist bisher auf Originalclips untereinander beschränkt. Details: [Agentensteuerung](ANSTEUERUNG.md).

## 8. MCP und MQTT

Die lokale MCP-Schnittstelle beschreibt seit 0.2.0 die tatsächlich geladenen Fähigkeiten. Implementierte Operationen:

| Operation | Zweck |
| --- | --- |
| list_avatars | Avatare im Model Zoo auflisten |
| get_avatar_capabilities | Moves und Zustände eines Avatars abfragen |
| list_moves | Verfügbare Bewegungen auflisten |
| play_move | Gespeicherte Bewegung auslösen |
| set_state | Dauerhaften Zustand auswählen |

Zusätzlich gibt es `get_state` sowie seit 0.9.0 `get_studio` und `edit_studio`. Die konkrete Einrichtung und Einschränkungen stehen in [ANSTEUERUNG.md](ANSTEUERUNG.md).

MQTT ist opt-in: Schalter zum Aktivieren und ein Feld für die Broker-Adresse, etwa eines NanoMQ-Brokers. Der Player empfängt darüber Zustands- oder Bewegungsbefehle. Seit 0.4.0 kann der ausdrücklich eingerichtete Python-MCP-Prozess einen aMQTT-Broker einbetten; MCP-Anfragen und Bestätigungen laufen ebenfalls darüber. Alternativ wird ein vorhandener Broker verwendet. Die Browseroberfläche startet keinen Broker. Zugangsdaten werden nicht im Model Zoo gespeichert.

Seit 0.9.0 können Agenten das Studio abfragen und mit zusätzlicher Sitzungsfreigabe vorhandene Skelettgriffe sowie freie Punkte, Verbindungen, Posen und Moves bearbeiten. Jeder Schreibbefehl prüft Sitzung und Bearbeitungsrevision; manuelle Änderungen machen alte Befehle ungültig. Undo/Redo und die Posen-Prüfhinweise gelten auch für KI-Änderungen. Die Schnittstelle erzeugt selbst kein KI-Modell und kein neues Quellskelett. Details: [MCP-Studio](MCP-STUDIO.md).

MCP und MQTT verwenden dieselbe Befehlsprüfung und StateMaschine. Unbekannte Avatare, Moves und ungültige Nachrichten dürfen die Anwendung nicht zum Absturz bringen.

## 9. Vorgeschlagene Datenorganisation

Die logische Struktur des Model Zoo:

- Ein Verzeichnis je Avatar mit stabiler ID.
- Modell und zugehörige Materialien/Texturen.
- Avatar-Beschreibung mit Fähigkeiten und Skelettversion.
- Ein eigener **moves/**-Ordner mit den Bewegungen dieses Avatars.
- Zustandszuordnungen und bearbeitbare Studio-Daten.

Implementiert sind Three.js für die Darstellung, glTF/GLB für Modelle, ein JSON-Katalog und `.pakachi.json` für bearbeitbare Projekte mit eingebettetem Modell. Der vorgeschlagene separate moves/-Ordner und der gemeinsame Export bearbeiteter Projekte in den Model Zoo stehen noch aus.

## 10. Bedienziel

Die Studio-Bedienelemente lassen sich seit 0.5.0 auf Deutsch oder Englisch umschalten. Vollständige Lokalisierung einschließlich Originalplayer und technischer Meldungen bleibt offen.

Die Komplexität gehört in die Software. Ein Benutzer soll eine eigene Figur erstellen, ein fehlendes Gelenk korrigieren und eine Bewegung speichern können, ohne Rigging, Skinning oder Keyframes lernen zu müssen.

## 11. Studio als KI-Harness und freie Anbieterwahl

**Beschlossenes Produktdesign; Konfigurationsgrundlage seit 0.13.0 teilweise implementiert.** Das Studio wird zu einem kleinen, spezialisierten KI-Harness: Es stellt Projektkontext, Werkzeuge und kontrollierte Arbeitsabläufe bereit und verbindet dafür austauschbare Dienste. Es bleibt Teil derselben Anwendung mit genau zwei Bearbeitungsmodi. Anbieter und Modelle werden im Optionsmenü eingestellt.

### Drei unabhängig konfigurierbare Rollen

| Rolle | Aufgabe | Erwartetes Ergebnis |
| --- | --- | --- |
| Assistent | Wünsche und gegebenenfalls Bilder verstehen, Schritte planen und Studio-Werkzeuge aufrufen | Nachvollziehbare Aktionen und Korrekturvorschläge |
| 3D-Generator | Aus Bildvorlagen Geometrie und gegebenenfalls Materialien erzeugen | Importierbares, überprüfbares 3D-Modell |
| Rigging-Dienst | Körperstruktur erkennen, Skelett und Hierarchie erzeugen, Oberfläche den Knochen zuordnen | Zusammenhängendes Skelett mit Hautgewichten und gegebenenfalls Bewegungssteuerungen |

Jede Rolle erhält eine eigene Kombination aus Verbindung, Anbieter und Modell. Alle drei dürfen unterschiedliche Dienste, API-Konten oder lokale Server verwenden; derselbe Dienst darf auch mehrere Rollen übernehmen, sofern er deren Fähigkeiten erfüllt. Mehrere benannte Verbindungs- und Modellprofile je Rolle sind vorgesehen. Die aktive Auswahl wird für jeden Auftrag festgehalten.

Ein Rigging-Dienst ist eine technische Funktion, kein zwingend externes Abonnement und kein notwendigerweise sprachbasiertes Modell. Er muss beispielsweise Füße–Beine–Becken, Arme–Schultern–Rumpf und Kopf–Hals–Rumpf passend verbinden. Sichtbare Linien allein reichen nicht: Hautgewichte bestimmen, welche Oberfläche sich mitbewegt. Gelenkgrenzen und IK steuern anschließend die Bewegung; sie ersetzen weder Skelett noch Hautgewichte. Gesichtspunkte können eigene unabhängige Gruppen behalten.

Ein Sprach- oder Bildverständnismodell wird durch die Auswahl als „3D-Generator“ oder „Rigging-Dienst“ nicht automatisch zu einem entsprechenden Fachmodell. Lokal über Ollama oder LM Studio betriebene Modelle können geeignete Werkzeuge koordinieren; die eigentliche Geometrie- oder Rigging-Berechnung benötigt einen passenden Dienst. Ein direkter Bild-zu-3D-Auftrag soll auch ohne zusätzlichen LLM-Assistenten möglich sein.

### Verbindungen und Anmeldung

Der geplante Einrichtungsablauf lautet:

1. Benannte Verbindung hinzufügen: Anbieter oder eigene Serveradresse wählen.
2. Mit API-Schlüssel/Token oder einem offiziell unterstützten OAuth-Verfahren anmelden; lokale Dienste können je nach Einrichtung ohne Anmeldung erreichbar sein.
3. Erreichbarkeit und unterstützte Fähigkeiten testen.
4. Modell aus der vom Dienst bereitgestellten Liste wählen; andernfalls Modell-ID manuell eingeben und prüfen.
5. Verbindung und Modell unabhängig dem Assistenten, Generator oder Rigging zuweisen.

Cloud-Anbieter und lokale Dienste wie Ollama und LM Studio sollen über Adapter schrittweise angebunden werden. Ein gemeinsamer Adapter für OpenAI-kompatible Schnittstellen deckt passende Dienste ab; abweichende Protokolle benötigen eigene Adapter. Kompatible Transportformate garantieren keine Bildverarbeitung, Werkzeugaufrufe, 3D-Ausgabe oder Rigging. Verfügbarkeit und Fähigkeiten werden je Modell und Auftrag geprüft. Es gibt keine fest eingebaute Bindung an einen Anbieter und keine Zusage, bereits alle Anbieter zu unterstützen.

OAuth wird nur angeboten, wenn der betreffende Anbieter einen geeigneten offiziellen Zugang für Drittanwendungen ermöglicht. Ein vorhandenes Chat-Abonnement wird nicht als automatisch nutzbarer API-Zugang behandelt. Zugangsdaten gehören in eine lokale, geschützte Verwaltung; die konkrete Backend-/Betriebssystemablage ist noch festzulegen. Sie dürfen weder ins Repository noch in Avatar-Projekte oder deren Exporte gelangen.

### Adapter und Auftragsablauf

Die gemeinsame Adapterschicht beschreibt Fähigkeiten, Anmeldung, Modellauflistung beziehungsweise manuelle Modellwahl sowie Start, Status und Ergebnis eines Auftrags. Lange Berechnungen benötigen Fortschritt, verständliche Fehler, Zeitlimits und Abbruch; soweit ein Dienst keinen echten Abbruch unterstützt, muss dies sichtbar sein. Wiederholungen erfolgen ausdrücklich und dürfen nicht stillschweigend weitere kostenpflichtige Aufträge auslösen.

Der normale Ablauf ist: Bild und Wunsch eingeben, optional den Assistenten planen lassen, Geometrie erzeugen, Rigging ausführen und das Ergebnis im Studio visuell prüfen. Erst **Übernehmen** ersetzt den bearbeiteten Projektstand; **Verwerfen** erhält ihn. Zwischenstände, verwendeter Anbieter und Modell, Korrekturprompt und Auftragsstatus bleiben nachvollziehbar. Eine zwischenzeitlich manuell veränderte Projektversion darf nicht durch ein verspätetes Ergebnis überschrieben werden. Übernommene Änderungen müssen sich rückgängig machen lassen.

Vor dem Start zeigt das Studio den tatsächlich empfangenden Dienst und die übertragenen Eingaben an. Kosten werden angezeigt, soweit verlässliche Angaben vorliegen. Es gibt keinen stillen Wechsel von lokal zu Cloud oder zu einem anderen Anbieter. Dies gilt auch für einen vom Assistenten vorgeschlagenen Folgeschritt.

Für lokale 3D-Generierung werden zunächst vorhandene spezialisierte Modelle beziehungsweise Software über Adapter eingebunden. PaKaChi-SM entwickelt die Integration und Bedienung; das Training eines eigenen grundlegenden 3D-KI-Modells ist nicht vorgesehen. Der vorhandene experimentelle TripoSR-Testadapter ist ein Ausgangspunkt zur Bewertung, kein fertiger Generator im Studio.

### Gemeinsame Werkzeuge mit externen Agenten

Der integrierte Assistent und externe MCP-Clients sollen dieselben validierten Studio-Werkzeuge verwenden. Sitzungsfreigabe, Revisionsprüfung, Rückgängig/Wiederholen und Prüfhinweise gelten weiterhin. Ein externer MCP-Client verwaltet seinen KI-Zugang selbst; seine Zugangsdaten werden nicht an PaKaChi weitergereicht. MCP stellt Werkzeuge bereit, MQTT transportiert bereits Befehle und Status; beide ersetzen keine Anbieter-API oder Modelllaufzeit.

Seit 0.15.0 stehen zusätzlich zu Profilen und unabhängiger Rollenzuordnung echte Modelllisten-Abfragen für Ollama, LM Studio und OpenAI-kompatible Endpunkte bereit. API-Schlüssel bleiben seit 0.18.0 je Profil in der Seitensitzung erhalten. Diese Abfrage ist kein Fähigkeitsnachweis und registriert keinen Inferenzadapter. Weitere native Anbieteradapter, geschützte dauerhafte Zugangsdatenverwaltung, OAuth und Generator-/Rigging-Ausführung bleiben offen. Seit 0.16.0 ist eine begrenzte Assistenten-Inferenz über Ollama/OpenAI-kompatible Chat-APIs vorhanden. [Bedienung und Speichergrenzen](ANBIETER.md).

**Freie Wahl für ALLE Rollen:** Jede Rolle unterstützt im Zielbild lokale und Cloud-Verbindungen. Anthropic, OpenAI, DeepInfra und OpenRouter sind gewünschte Cloud-Anbindungen; Ollama und LM Studio sind lokale Optionen, keine feste Rollenzuordnung. Rollen dürfen Anbieter, Modell und Zugang getrennt wählen oder ein geeignetes Profil gemeinsam nutzen. OAuth nur bei offiziell unterstütztem Drittanwendungszugang. Ein LLM kann einen Fachgenerator oder Rigging-Werkzeuge orchestrieren; der Adapter muss dann die vollständige Werkzeugkette und das Ergebnis prüfen. Die Wahl eines Sprachmodells allein ersetzt diese Ausführung nicht.

Der optionale Ollama-Helfer kuratiert derzeit nur Assistentenkandidaten. Er misst die Hardware des ausführenden Rechners, prüft Modellgewichte samt Reserven und lädt erst nach Rückfrage. GPU-Freigabe vorerst nur mit einer messbaren NVIDIA-GPU; CPU ausdrücklich wählbar. Für alle Rollen bleiben eigene Modelle und andere lokale oder Cloud-Dienste vorgesehen. [Auswahl, Prüfung und Grenzen](LOKALE-MODELLE.md).


Das Original-PaKaChi bleibt mit Tierform, humanoider Form und den 72 Transformationsbildern die Designreferenz. Zwei unabhängig erzeugte 3D-Modelle belegen noch keinen kompatiblen Formwechsel; Geometrie, Rigging und Transformation müssen eigens geprüft werden.

### Implementierungsstand des Auftragskerns (0.14.0)

Die eigenständige Implementierung in `ai-jobs.ts` hält Anbieterprofil, Modell, Eingabe und Studio-Sitzung/Revision pro Auftrag fest. Der optionale Adapter-Einstieg `run` liefert Fortschritt und ein Ergebnis. Zeitlimit und Abbruch beenden das lokale Warten auch dann, wenn ein Adapter das Abbruchsignal ignoriert. Späte Ergebnisse dürfen weder Vorschau noch Projekt verändern. Ein fernseitiger Abbruch wird dadurch ausdrücklich nicht als bestätigt ausgegeben.

Eine verpflichtende, vom Aufrufer bereitzustellende Formatprüfung steht vor der Ergebnisfreigabe. `preview` bezeichnet hier einen internen Ergebniszustand, noch keine sichtbare 3D-Vorschau. Erst eine ausdrückliche Übernahme prüft Sitzung und Revision erneut und ruft die synchrone Übernahmetransaktion des Hosts auf. Der Host muss atomare Änderung und Undo gewährleisten; die tatsächliche Verbindung zur Studio-Transaktion steht noch aus. Kein automatischer Neuversuch und kein Anbieterwechsel. Details: [Auftragskern](AUFTRAE.md).

### Assistentenablauf (0.16.0)

Ein eigener, begrenzter Text-/Werkzeugablauf nutzt ausschließlich das gewählte Assistentenprofil. Nutzer sehen Zieladresse, Modell und Datenumfang vor dem Senden. Bis zu fünf API-Runden und vier lesende Werkzeugaufrufe sind erlaubt. `get_state` und `get_studio` nutzen denselben RPC-Weg wie MCP. `edit_studio` liefert zunächst nur einen sichtbaren Vorschlag; erst Übernehmen führt den vorhandenen Editorbefehl mit Freigabe, Sitzung/Revision und Undo aus. Kein automatischer Anbieterwechsel oder Neuversuch. Geheimnisse bleiben seit 0.18.0 je Profil in der Seitensitzung; nur ausdrückliches Löschen oder Seitenneuladen entfernt sie. Jede Aufgabe beginnt ohne Chatverlauf. Dieser Ablauf ist vom Generator-/Rigging-Auftragskern getrennt und behauptet keine Fachgenerierung. [Bedienung](ASSISTENT.md).

### Nativer Anthropic-Adapter (0.17.0)

Anthropic ist eine zusätzliche Schnittstellenart für frei zuordenbare Profile. Modelllisten und Messages werden mit `x-api-key` und fester API-Protokollversion angesprochen. Der Assistent übersetzt ausschließlich das Transportformat; Werkzeugfreigabe, Sitzung/Revision, Rundenlimit und explizite Übernahme bleiben identisch. Text-, Werkzeug- und Thinking-Blöcke werden getrennt behandelt; Thinking-Blöcke werden für Folgerunden unverändert weitergereicht, nicht in der Antwort angezeigt. Abgeschnittene oder unbekannte Antwortformate lösen keine Änderung aus. Kein OAuth und keine neue Generator-/Rigging-Ausführung. [Einrichtung und Browsergrenzen](ANBIETER.md#anthropic-seit-0170).

Seit 0.17.1: Die Verbindungsauswahl verwendet editierbare Vorgabeadressen für bekannte Schnittstellen (Anthropic, Ollama, LM Studio). Eigene Endpunkte bleiben je Schnittstellenentwurf erhalten; Profilbearbeitung erhält den gespeicherten Endpunkt. Seit 0.18.0 erhält ein Anbieterwechsel Schlüssel und Modell-ID im jeweiligen Profil/Entwurf; lediglich laufende Modelllistenabfragen werden verworfen.

Seit 0.17.1 ergänzen sechs explizite Anbietervorlagen die freie Schnittstellen-/Adressauswahl. Sie setzen lediglich Adapter und Endpunkt, verändern weder Rollenzuordnung noch Modellfähigkeiten und starten keine Anfrage. Anbieterprofile speichern weiterhin die tatsächliche Adresse; keine Schemaänderung erforderlich.

### Mehrere Anbieter und Rollenrouten (0.18.0; maßgeblicher aktueller Stand)

Jede Rolle hat ein Hauptprofil und eine geordnete Liste weiterer Anbieter-/Modellprofile. Profile und Modellwahl bleiben gleichzeitig bestehen. Schlüssel werden getrennt pro Profil und Endpunkt in der Seitensitzung gehalten; Wechsel und Dialogschluss löschen sie nicht. Ältere Aussagen zur Löschung bei Anbieterwechsel sind damit abgelöst. Geschützte dauerhafte Ablage bleibt offen.

Der Assistent führt ausdrücklich konfigurierte Fallbacks bei Anbieterfehlern aus. Das Senden autorisiert die vorab sichtbare komplette Route; keine weiteren Anbieter werden automatisch ergänzt. Ein Versuch darf nur lesende Werkzeuge ausführen und höchstens einen zu bestätigenden Vorschlag liefern. Abbruch, Studio-Konflikte oder ungültige Werkzeugbefehle beenden die Route. Für 3D und Rigging sind unabhängige Routen konfigurierbar; deren tatsächliche Fachausführung und Fallback-Integration bleiben offen. [Verbindliches aktuelles Bedienverhalten](ANBIETER.md).

### Optionale dauerhafte Schlüsselablage (0.19.0; aktueller Stand)

Zusätzlich zur Sitzung kann der Nutzer Schlüssel passwortverschlüsselt im lokalen Browserspeicher halten. AES-256-GCM und PBKDF2-SHA-256 (600.000 Iterationen, frischer Salt und IV) verwenden ausschließlich Web Crypto. Passwort und entschlüsselte Schlüssel werden nicht dauerhaft gespeichert. Nach Neustart wird ausdrücklich entsperrt. Profil-ID, Schnittstelle und tatsächliche Zieladresse binden jeden Schlüssel an seine Verbindung.

Vor dem Überschreiben eines Tresors muss dessen Passwort erfolgreich entschlüsseln. Während der Sitzung unbekannte gespeicherte Schlüssel bleiben beim Speichern erhalten; ausdrückliche Löschungen und nicht mehr konfigurierte Zieladressen werden entfernt. Speicherfehler, Profil-/Tresoränderungen oder Dialogschluss während der Operation verhindern ihre Übernahme. Aktive Sitzungsschlüssel bleiben beim Entsperren maßgeblich. Keine Passwortwiederherstellung, keine automatische Synchronisierung, keine zusätzliche Sitzungssperre und kein Schutz vor schädlichem Code im entsperrten Browser. [Bedienung](ANBIETER.md).

Seit 0.20.0: Ein expliziter Tresorpasswortwechsel entschlüsselt ausschließlich den gespeicherten Bestand mit dem bisherigen Passwort und verschlüsselt ihn mit frischem Salt/IV unter dem bestätigten neuen Passwort. Vor dem Ersetzen wird auf veraltete Operationen geprüft. Sitzungsänderungen bleiben davon getrennt; kein Passwortreset.

### Sitzungssperre (0.20.0)

Die explizite Sperre löscht den verwendbaren Schlüsselzustand der aktuellen Seite einschließlich Entwürfen, leert Passwortfelder und invalidiert laufende Tresoroperationen sowie Modelllisten- und Assistentenantworten. Sie verändert weder gespeicherte Profile noch den verschlüsselten Tresor. Neues Entsperren stellt gespeicherte Schlüssel wieder her; ungespeicherte Sitzungsschlüssel sind verloren. Bereits gesendete Serveranfragen können weiterlaufen. Keine Tab-übergreifende Anwendungssperre und keine zugesicherte physische Speicherlöschung. Ältere Angaben zu fehlendem Passwortwechsel bzw. fehlender Sitzungssperre sind durch 0.20.0 abgelöst.
