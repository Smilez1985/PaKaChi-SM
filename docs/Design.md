# PaKaChi-SM – Designdokument

Teil der [Blaupause](README.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

## Status und Begriffe

Dieses Dokument hält das Produktziel fest. Anforderungen ohne ausdrücklich genannten Implementierungsstand sind keine Zusage einer bereits verfügbaren Funktion. Stand 0.76.1: Player, gemeinsame Agentensteuerung, Gelenk-/Gesichtspunktbearbeitung, Posen/Moves und Gesamtspuren für Position, Drehung und gleichmäßige Größe sind implementiert. [STUDIO.md](STUDIO.md) beschreibt die bedienbaren Funktionen und ihre Grenzen; vollständiger Quellknochenumbau, automatische Anatomieerkennung und die Qualitätsabnahme der angeschlossenen lokalen KI-Generierung bleiben offen.

- **PaKaChi:** Panda-KI-Chimera, das übergeordnete Projekt.
- **PaKaChi-SM:** StateMaschine mit Avatar-Player und integriertem Studio.
- **PaKaChi-Avatar-Studio:** Editor-Bereich innerhalb des Players.
- **Model Zoo:** gemeinsame Sammlung der Modelle, Moves und Zustandszuordnungen.


### Aktuelle Umsetzung auf einen Blick

| Bereich | Implementiert | Noch offen |
| --- | --- | --- |
| Original-PaKaChi | Beide Formen und 72 Transformationsbilder erhalten | Designgetreue 3D-Formen und kompatibler Formwechsel |
| Studio | Zwei Modi, Mausnavigation, Punkte/Verbindungen, bestehende Skelettketten, Posen/Moves | Skalierte Knochenketten, neue Rigs ohne vorhandenes Skelett, Ganzkörper-IK und visuelle Abnahme |
| Anbieter | Mehrere Profile gleichzeitig, drei unabhängige Rollen und Fallback-Routen, editierbare Vorgabeadressen | Weitere Fachadapter, OAuth und reale Kontoabnahme |
| Schlüssel | Optionale verschlüsselte Persistenz, Entsperren nach F5, Passwortwechsel, Sitzungssperre | Betriebssystem-Schlüsselbund und unabhängiges Sicherheitsaudit |
| Assistent | Ollama, LM Studio, OpenAI-kompatible API und Anthropic; einzeln bestätigte Studio-Vorschläge | Bildkontext und mehrschrittige Änderungsvorschau |
| Generierung | Lokaler TripoSR-Dienst, Bildauswahl, getrennte Vorschau, Vorprüfungs-Fallbacks, expliziter weiterer Auftrag | Echte GPU-/Qualitätsabnahme, Cloud-Generatoren, Korrekturprompts und Rigging |
| Übernahme | Revisionsschutz, ein Modellwechsel-Rücksprung, vorbereitete 3D-Installation mit Rückabwicklung | Gerenderte Abnahme, Originalplayer-Neustart und GPU-Kontextverlust |

Lokaler Prüfnachweis für 0.68.0: **291 Node-Tests und Build bestanden** ([Bericht](PRUEFUNG-0.68.0.md)). Letzter vollständiger Browser-Prüfnachweis für Software 0.66.0: **286 Tests, Build und 21 Chromium-Fälle bestanden**. Separate Chromium-Nachweise stehen im Prüfbericht; echte Anbieter-/GPU-Inferenz und manuelle Mausabnahme bleiben offen. Projektformat bleibt Version 1. Freie Punkte/Posen aus 0.22.0/0.23.0 benötigen wegen der korrigierten Normalisierungsreihenfolge eine visuelle Kontrolle; keine automatische Migration. [Prüfbericht](PRUEFUNG-0.66.0.md).

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

Als Schutzkonzept ist eine Vorschau mit Übernehmen oder Verwerfen vorgesehen. Das bisherige Ergebnis und manuelle Korrekturen bleiben bis zur Übernahme erhalten. Rückgängig/Wiederholen ist im manuellen Studio seit 0.3.0 vorhanden; eine getrennte Geometrievorschau ist seit 0.22.0 vorhanden. Die Vorschau einer gezielten KI-Skelettkorrektur bleibt offen.

## 5. Bewegung erstellen

1. Figur in die erste Pose ziehen.
2. **Pose hinzufügen** auswählen.
3. Weitere Posen erstellen, typischerweise drei bis zehn.
4. Reihenfolge und Zeitabstände bestimmen.
5. **Vorschau** abspielen; Zwischenposen werden automatisch berechnet.
6. Eindeutiges Schlagwort und verständlichen Anzeigenamen vergeben.
7. **Als Bewegung speichern** auswählen.

Die Anzahl drei bis zehn beschreibt den typischen Arbeitsablauf, keine bereits festgelegte technische Obergrenze.

Eine Bewegung enthält Zeitpunkte, Gelenktransformationen, gegebenenfalls Gesichtsparameter und die Gesamtposition. Sie benötigt keine Sammlung separat gezeichneter Einzelbilder. Die erste Umsetzung speichert Posen und Moves textbasiert in versionierten `.pakachi.json`-Projekten. Seit 0.6.0 enthält jede neue Pose zusätzlich die globale Verschiebung der gesamten Figur, auch bei Modellen ohne Knochen. Seit 0.8.0 wird auch die Gesamtdrehung um den ursprünglichen Modellmittelpunkt gespeichert und interpoliert. Seit 0.10.0 enthält die Gesamtspur außerdem eine proportionale Skalierung von 10 % bis 500 %, per Mausregler bearbeitbar und zwischen Posen linear interpoliert. Seit 0.27.0 können eigene Studio-Moves als separate Dateien zwischen kompatiblen Projektkopien ausgetauscht werden.

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

Implementiert sind Three.js für die Darstellung, glTF/GLB für Modelle, ein JSON-Katalog und `.pakachi.json` für bearbeitbare Projekte mit eingebettetem Modell. Seit 0.26.0 ergänzt eine lokale IndexedDB-Sammlung die Katalogauswahl mit vollständigen Projektkopien. Separate Move-Dateien sind seit 0.27.0 vorhanden. Seit 0.29.0 erzeugt ein CLI-Werkzeug statische Katalogprojektpakete. Seit 0.30.0 führt ein weiteres CLI-Werkzeug Kataloge in einem neuen Ausgabeordner zusammen. Seit 0.31.0 besteht eine statische moves/-Sammlung mit Katalog, CLI-Export und Studio-Import. Automatische Veröffentlichung und Bearbeiten der gemeinsamen Sammlung im Browser bleiben offen.

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

Jede Rolle erhält eine eigene Kombination aus Verbindung, Anbieter und Modell. Alle drei dürfen unterschiedliche Dienste, API-Konten oder lokale Server verwenden; derselbe Dienst darf auch mehrere Rollen übernehmen, sofern er deren Fähigkeiten erfüllt. Mehrere benannte Verbindungs- und Modellprofile mit unabhängig geordneten Fallbacks je Rolle sind seit 0.18.0 implementiert. Die aktive Auswahl wird für jeden Auftrag festgehalten.

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

OAuth wird nur angeboten, wenn der betreffende Anbieter einen geeigneten offiziellen Zugang für Drittanwendungen ermöglicht. Ein vorhandenes Chat-Abonnement wird nicht als automatisch nutzbarer API-Zugang behandelt. Seit 0.19.0 gibt es einen optionalen passwortverschlüsselten Browsertresor, seit 0.20.0 Passwortwechsel und Sitzungssperre. Eine Betriebssystem-Schlüsselbundanbindung bleibt offen. Zugangsdaten dürfen weder ins Repository noch in Avatar-Projekte oder deren Exporte gelangen.

### Adapter und Auftragsablauf

Die gemeinsame Adapterschicht beschreibt Fähigkeiten, Anmeldung, Modellauflistung beziehungsweise manuelle Modellwahl sowie Start, Status und Ergebnis eines Auftrags. Lange Berechnungen benötigen Fortschritt, verständliche Fehler, Zeitlimits und Abbruch; soweit ein Dienst keinen echten Abbruch unterstützt, muss dies sichtbar sein. Wiederholungen erfolgen ausdrücklich und dürfen nicht stillschweigend weitere kostenpflichtige Aufträge auslösen.

Der normale Ablauf ist: Bild und Wunsch eingeben, optional den Assistenten planen lassen, Geometrie erzeugen, Rigging ausführen und das Ergebnis im Studio visuell prüfen. Erst **Übernehmen** ersetzt den bearbeiteten Projektstand; **Verwerfen** erhält ihn. Zwischenstände, verwendeter Anbieter und Modell, Korrekturprompt und Auftragsstatus bleiben nachvollziehbar. Eine zwischenzeitlich manuell veränderte Projektversion darf nicht durch ein verspätetes Ergebnis überschrieben werden. Übernommene Änderungen müssen sich rückgängig machen lassen.

Vor dem Start zeigt das Studio den tatsächlich empfangenden Dienst und die übertragenen Eingaben an. Kosten werden angezeigt, soweit verlässliche Angaben vorliegen. Es gibt keinen stillen Wechsel von lokal zu Cloud oder zu einem anderen Anbieter. Dies gilt auch für einen vom Assistenten vorgeschlagenen Folgeschritt.

Für lokale 3D-Generierung werden zunächst vorhandene spezialisierte Modelle beziehungsweise Software über Adapter eingebunden. PaKaChi-SM entwickelt die Integration und Bedienung; das Training eines eigenen grundlegenden 3D-KI-Modells ist nicht vorgesehen. Der vorhandene experimentelle TripoSR-Testadapter ist ein Ausgangspunkt zur Bewertung, kein fertiger Generator im Studio.

### Gemeinsame Werkzeuge mit externen Agenten

Der integrierte Assistent und externe MCP-Clients sollen dieselben validierten Studio-Werkzeuge verwenden. Sitzungsfreigabe, Revisionsprüfung, Rückgängig/Wiederholen und Prüfhinweise gelten weiterhin. Ein externer MCP-Client verwaltet seinen KI-Zugang selbst; seine Zugangsdaten werden nicht an PaKaChi weitergereicht. MCP stellt Werkzeuge bereit, MQTT transportiert bereits Befehle und Status; beide ersetzen keine Anbieter-API oder Modelllaufzeit.

Seit 0.15.0 stehen zusätzlich zu Profilen und unabhängiger Rollenzuordnung echte Modelllisten-Abfragen für Ollama, LM Studio und OpenAI-kompatible Endpunkte bereit. API-Schlüssel bleiben seit 0.18.0 je Profil in der Seitensitzung erhalten. Diese Abfrage ist kein Fähigkeitsnachweis und registriert keinen Inferenzadapter. Native Anthropic-Anbindung, optionaler Schlüsseltresor und lokale Generatorausführung sind inzwischen vorhanden. OAuth, weitere Fachadapter und Rigging-Ausführung bleiben offen. Seit 0.16.0 ist eine begrenzte Assistenten-Inferenz über Ollama/OpenAI-kompatible Chat-APIs vorhanden. [Bedienung und Speichergrenzen](ANBIETER.md).

**Freie Wahl für ALLE Rollen:** Jede Rolle unterstützt im Zielbild lokale und Cloud-Verbindungen. Anthropic, OpenAI, DeepInfra und OpenRouter sind gewünschte Cloud-Anbindungen; Ollama und LM Studio sind lokale Optionen, keine feste Rollenzuordnung. Rollen dürfen Anbieter, Modell und Zugang getrennt wählen oder ein geeignetes Profil gemeinsam nutzen. OAuth nur bei offiziell unterstütztem Drittanwendungszugang. Ein LLM kann einen Fachgenerator oder Rigging-Werkzeuge orchestrieren; der Adapter muss dann die vollständige Werkzeugkette und das Ergebnis prüfen. Die Wahl eines Sprachmodells allein ersetzt diese Ausführung nicht.

Der optionale Ollama-Helfer kuratiert derzeit nur Assistentenkandidaten. Er misst die Hardware des ausführenden Rechners, prüft Modellgewichte samt Reserven und lädt erst nach Rückfrage. GPU-Freigabe vorerst nur mit einer messbaren NVIDIA-GPU; CPU ausdrücklich wählbar. Für alle Rollen bleiben eigene Modelle und andere lokale oder Cloud-Dienste vorgesehen. [Auswahl, Prüfung und Grenzen](LOKALE-MODELLE.md).


Das Original-PaKaChi bleibt mit Tierform, humanoider Form und den 72 Transformationsbildern die Designreferenz. Zwei unabhängig erzeugte 3D-Modelle belegen noch keinen kompatiblen Formwechsel; Geometrie, Rigging und Transformation müssen eigens geprüft werden.

### Auftragskern (seit 0.14.0, Stand 0.25.0)

Die eigenständige Implementierung in `ai-jobs.ts` hält Anbieterprofil, Modell, Eingabe und Studio-Sitzung/Revision pro Auftrag fest. Der optionale Adapter-Einstieg `run` liefert Fortschritt und ein Ergebnis. Zeitlimit und Abbruch beenden das lokale Warten auch dann, wenn ein Adapter das Abbruchsignal ignoriert. Späte Ergebnisse dürfen weder Vorschau noch Projekt verändern. Ein fernseitiger Abbruch wird dadurch ausdrücklich nicht als bestätigt ausgegeben.

Eine verpflichtende Formatprüfung steht vor der Ergebnisfreigabe. Der interne Zustand `preview` ist vom sichtbaren Viewer getrennt. Die Generatoroberfläche lädt das geprüfte Modell in eine separate Ansicht. Der synchrone `accept`-Vertrag des Kerns verlangt eine revisionsgeprüfte Host-Transaktion; die tatsächliche Studio-Anbindung bereitet den Import asynchron vor und veröffentlicht ihn mit eigener erneuter Zielprüfung und Rückabwicklung. Ein Auftrag führt höchstens einmal die Generierung aus. Seit 0.25.0 darf ausschließlich die vorgeschaltete Fähigkeitsprüfung weitere konfigurierte Profile versuchen. Details: [Auftragskern](AUFTRAE.md).

### Assistentenablauf (seit 0.16.0, Stand 0.25.0)

Der begrenzte Text-/Werkzeugablauf nutzt die konfigurierte Assistentenroute. Nutzer sehen Zieladressen, Modelle und Datenumfang vor dem Senden. Pro Profil sind bis zu fünf API-Runden und vier lesende Werkzeugaufrufe erlaubt. `get_state` und `get_studio` nutzen denselben RPC-Weg wie MCP. `edit_studio` liefert einen sichtbaren Vorschlag; erst Übernehmen führt den vorhandenen Editorbefehl mit Freigabe, Sitzung/Revision und Undo aus. Anbieterfehler können seit 0.18.0 zum nächsten konfigurierten Profil führen; Abbruch, Studio-Konflikte und ungültige Werkzeugbefehle stoppen die Route. Jede Aufgabe beginnt ohne Chatverlauf. Sitzungsschlüssel bleiben beim Dialog-/Profilwechsel erhalten und können optional im Tresor gespeichert werden. Dieser Ablauf ist vom Generator-/Rigging-Auftragskern getrennt. [Bedienung](ASSISTENT.md).

### Nativer Anthropic-Adapter (0.17.0)

Anthropic ist eine zusätzliche Schnittstellenart für frei zuordenbare Profile. Modelllisten und Messages werden mit `x-api-key` und fester API-Protokollversion angesprochen. Der Assistent übersetzt ausschließlich das Transportformat; Werkzeugfreigabe, Sitzung/Revision, Rundenlimit und explizite Übernahme bleiben identisch. Text-, Werkzeug- und Thinking-Blöcke werden getrennt behandelt; Thinking-Blöcke werden für Folgerunden unverändert weitergereicht, nicht in der Antwort angezeigt. Abgeschnittene oder unbekannte Antwortformate lösen keine Änderung aus. Kein OAuth und keine neue Generator-/Rigging-Ausführung. [Einrichtung und Browsergrenzen](ANBIETER.md#anthropic-seit-0170).

Seit 0.17.1: Die Verbindungsauswahl verwendet editierbare Vorgabeadressen für bekannte Schnittstellen (Anthropic, Ollama, LM Studio). Eigene Endpunkte bleiben je Schnittstellenentwurf erhalten; Profilbearbeitung erhält den gespeicherten Endpunkt. Seit 0.18.0 erhält ein Anbieterwechsel Schlüssel und Modell-ID im jeweiligen Profil/Entwurf; lediglich laufende Modelllistenabfragen werden verworfen.

Seit 0.17.1 ergänzen sechs explizite Anbietervorlagen die freie Schnittstellen-/Adressauswahl. Sie setzen lediglich Adapter und Endpunkt, verändern weder Rollenzuordnung noch Modellfähigkeiten und starten keine Anfrage. Anbieterprofile speichern weiterhin die tatsächliche Adresse; keine Schemaänderung erforderlich.

### Mehrere Anbieter und Rollenrouten (seit 0.18.0)

Jede Rolle hat ein Hauptprofil und eine geordnete Liste weiterer Anbieter-/Modellprofile. Profile und Modellwahl bleiben gleichzeitig bestehen. Schlüssel werden getrennt pro Profil und Endpunkt in der Seitensitzung gehalten; Wechsel und Dialogschluss löschen sie nicht. Ältere Aussagen zur Löschung bei Anbieterwechsel sind damit abgelöst. Die optionale geschützte dauerhafte Ablage ist seit 0.19.0 implementiert.

Der Assistent führt ausdrücklich konfigurierte Fallbacks bei Anbieterfehlern aus. Das Senden autorisiert die vorab sichtbare komplette Route; keine weiteren Anbieter werden automatisch ergänzt. Ein Versuch darf nur lesende Werkzeuge ausführen und höchstens einen zu bestätigenden Vorschlag liefern. Abbruch, Studio-Konflikte oder ungültige Werkzeugbefehle beenden die Route. Für 3D und Rigging sind unabhängige Routen konfigurierbar. Der lokale Generator nutzt seit 0.25.0 Fallbacks während der Vorprüfung sowie einen ausdrücklich ausgelösten nächsten Auftrag; die Rigging-Ausführung bleibt offen. [Verbindliches aktuelles Bedienverhalten](ANBIETER.md).

### Optionale dauerhafte Schlüsselablage (0.19.0; aktueller Stand)

Zusätzlich zur Sitzung kann der Nutzer Schlüssel passwortverschlüsselt im lokalen Browserspeicher halten. AES-256-GCM und PBKDF2-SHA-256 (600.000 Iterationen, frischer Salt und IV) verwenden ausschließlich Web Crypto. Passwort und entschlüsselte Schlüssel werden nicht dauerhaft gespeichert. Nach Neustart wird ausdrücklich entsperrt. Profil-ID, Schnittstelle und tatsächliche Zieladresse binden jeden Schlüssel an seine Verbindung.

Vor dem Überschreiben eines Tresors muss dessen Passwort erfolgreich entschlüsseln. Während der Sitzung unbekannte gespeicherte Schlüssel bleiben beim Speichern erhalten; ausdrückliche Löschungen und nicht mehr konfigurierte Zieladressen werden entfernt. Speicherfehler, Profil-/Tresoränderungen oder Dialogschluss während der Operation verhindern ihre Übernahme. Aktive Sitzungsschlüssel bleiben beim Entsperren maßgeblich. Keine Passwortwiederherstellung, keine automatische Synchronisierung, kein Schutz vor schädlichem Code im entsperrten Browser. [Bedienung](ANBIETER.md).

Seit 0.20.0: Ein expliziter Tresorpasswortwechsel entschlüsselt ausschließlich den gespeicherten Bestand mit dem bisherigen Passwort und verschlüsselt ihn mit frischem Salt/IV unter dem bestätigten neuen Passwort. Vor dem Ersetzen wird auf veraltete Operationen geprüft. Sitzungsänderungen bleiben davon getrennt; kein Passwortreset.

### Sitzungssperre (0.20.0)

Die explizite Sperre löscht den verwendbaren Schlüsselzustand der aktuellen Seite einschließlich Entwürfen, leert Passwortfelder und invalidiert laufende Tresoroperationen sowie Modelllisten- und Assistentenantworten. Sie verändert weder gespeicherte Profile noch den verschlüsselten Tresor. Neues Entsperren stellt gespeicherte Schlüssel wieder her; ungespeicherte Sitzungsschlüssel sind verloren. Bereits gesendete Serveranfragen können weiterlaufen. Keine Tab-übergreifende Anwendungssperre und keine zugesicherte physische Speicherlöschung. Ältere Angaben zu fehlendem Passwortwechsel bzw. fehlender Sitzungssperre sind durch 0.20.0 abgelöst.

### Lokaler Generatortransport (0.21.0)

Der lokale TripoSR-Wrapper ist über einen ausdrücklich gestarteten Loopback-HTTP-Dienst erreichbar. Python-Pfad, Backend-Ordner, Gerät und Auflösung bestimmt der Betreiber beim Start; Browseranfragen enthalten ausschließlich PNG-/JPEG-Bytes. Token, exakter Studio-Origin und Hostprüfung begrenzen den Zugriff. Pro Dienst läuft höchstens eine Generierung; Berichte und Ergebnisse bleiben in getrennten lokalen Auftragsordnern.

Der separat registrierbare `custom-generation`-Adapter prüft das Protokoll und das Modell `triposr`, liefert GLB-Bytes an den bestehenden Auftragskern und verwendet dessen verpflichtende Ergebnisprüfung sowie Revisionsschutz. Er behauptet weder Rigging noch Promptverständnis: TripoSR rekonstruiert aus einem Bild; der Auftrags-Prompt ist nur eine Bezeichnung. Fähigkeiten bestätigen den Transportvertrag, nicht installierte Gewichte oder eine erfolgreiche Inferenz. Die Laufzeitvorprüfung erfolgt vor jedem Generierungslauf.

Abbruch beendet das lokale Warten und signalisiert dem gestarteten Python-Prozess das Ende, bei Bedarf gefolgt von erzwungener Beendigung. Ein vollständiger Prozessbaum-Stopp ist nicht garantiert; der Auftragskern behält daher seine vorsichtige Abbruchmeldung. Seit 0.22.0 registriert die Studio-Oberfläche den Adapter und bietet Bildauswahl, Modellvorschau und ausdrückliche Übernahme. Seit 0.25.0 sind Vorprüfungs-Fallbacks angeschlossen. Die Live-Inferenzabnahme steht weiterhin aus.

### Generierungsoberfläche (0.22.0)

Im integrierten Studio, auch bei ausgewähltem Original-Bildplayer, nimmt ein eigener Abschnitt PNG/JPEG bis 20 MiB an. Bildauswahl und Drag & Drop lösen keine Übertragung aus. Erst der Startbutton prüft die angezeigte Generatorroute und sendet das Bild an das erste erfolgreich geprüfte Profil. Die Vorlage „TripoSR (lokal)“ füllt Adresse und bei leerer Modellwahl `triposr` vor; bestehende Anbieterprofile und Schlüssel bleiben erhalten.

Das Ergebnis durchläuft den echten GLTFLoader sowie Grenzen für Geometrie, Vertices und Knochen. Eine zweite Viewer-Instanz stellt den Entwurf unabhängig vom aktuellen Avatar dar. Verwerfen, Abbruch, Profilwechsel und Tresorsperre räumen Ergebnis/Vorschau auf; späte Antworten sind unwirksam. Schlüssel werden je Auftrag festgehalten und nicht in Projekte geschrieben. Die Tresorsperre invalidiert auch eine bereits vorbereitete Übernahme.

„Als neuen Avatar laden“ nutzt den bestehenden GLB-Import mit zusätzlichem Sitzungs-/Revisionsvergleich vor und nach asynchronem Laden. Laufende Studio-Gesten oder Wiedergabe blockieren die Übernahme. Ungespeicherte Änderungen lösen weiterhin die vorhandene Rückfrage aus. **Dies ist ein revisionsgeschützter Modellimport, keine atomare projektübergreifende Undo-Transaktion.** Vorher speichern bleibt erforderlich. Automatisches Rigging, Cloud-Geometrieadapter, Korrekturprompts und die vollständige Live-Abnahme bleiben eigene Roadmap-Punkte. Die 3D-Übergabe besitzt seit 0.24.0 die unten beschriebene Rückabwicklung. Ein separater Rücksprung für den letzten Modellwechsel ist seit 0.23.0 vorhanden.

### Reversibler Modellwechsel (0.23.0)

Modellwechsel besitzen einen separaten, auf genau einen vorherigen Stand begrenzten Sitzungsverlauf. Vor dem Austausch wird eine isolierte Projektaufnahme mit Entwurfspose, Punkten/Verbindungen, Posen/Moves, Avataridentität und Ungespeichert-Markierung vorbereitet. Nur ein erfolgreicher Austausch aktiviert den neuen Rücksprungpunkt. Zurück/Wiederholen tauscht den gespeicherten Stand mit dem aktuellen Projekt; dadurch bleiben auch spätere Änderungen am jeweils anderen Modell erhalten. Fehlgeschlagene oder veraltete Wiederherstellung verbraucht den Verlauf nicht.

Der Snapshot wird vor dem Austausch gegen eine geschätzte 160-MiB-Grenze geprüft. Original-Bildplayer wird als eigener Zieltyp geführt; seine aktuelle Animationsphase wird nicht gesichert. Wiederherstellung erstellt eine neue Editorsitzung und erteilt keine frühere KI-Freigabe erneut. Einzelgesten-Undo, Kamera und Auswahl werden nicht rekonstruiert. Seit 0.24.0 wird die 3D-Installation bei synchronen Übergabefehlern zurückgerollt. Der separate Originalplayer-Neustart und GPU-Kontextverlust sind davon nicht abgedeckt.

### Vorbereitete 3D-Übernahme mit Rückabwicklung (0.24.0)

Ein 3D-Kandidat erhält einen eigenen, zunächst nicht montierten Viewer, Editor und Playback. Die bisherige Instanz bleibt während der Vorbereitung unverändert. Der neue Rig wird nach der Viewer-Normalisierung aufgebaut, damit Oberflächenpunkte dieselben Weltkoordinaten wie die sichtbare Figur verwenden. Vor Veröffentlichung wird das Ziel nochmals geprüft; zwischen dieser Prüfung und dem synchronen Austausch liegt kein asynchroner Schritt.

Für die Übergabe werden alte Instanzen, echte DOM-Knoten samt Ereignisbehandlung und StateMachine-Bindung gehalten. Bei Fehlern werden diese wieder eingesetzt und nur Kandidatenressourcen verworfen. Erst eine erfolgreiche Veröffentlichung aktiviert neue Editor-Rückmeldungen und den Modellwechsel-Verlauf; anschließend werden alte Ressourcen freigegeben. Ein Fehler beim anschließenden Aufräumen macht den gültig übernommenen Avatar nicht wieder ungültig und wird separat gemeldet.

Der Schutz gilt für die 3D-Ladestrecke einschließlich Import, Generierungsübernahme und 3D-Wiederherstellung. Er ist keine Zusage gegen Prozessabsturz, Speichermangel, GPU-Kontextverlust oder einen selbst scheiternden Rollback. Der separate Neustart des archivierten Original-Bildplayers besitzt weiterhin seinen bisherigen Ablauf. Gerenderte Abnahme steht aus; die Vorbereitungsphase benötigt vorübergehend zusätzliche CPU-/GPU-Ressourcen für alten und neuen Viewer.

## Generator-Fallbacks (0.25.0)

Die Studio-Oberfläche zeigt vor dem Start die vollständige konfigurierte Generatorroute. Profile, Reihenfolge, Bild, Zielrevision und Schlüssel je Profil werden für diesen Versuch festgehalten. Nicht unterstützte oder nicht erreichbare Profile werden ausschließlich während der Fähigkeitsprüfung übersprungen. Jede Prüfung hat ein Zeitlimit von zehn Sekunden; verspätete Antworten starten keinen Auftrag. Unmittelbar vor der Ausführung wird die Studio-Zielrevision erneut geprüft.

Nach Beginn einer Generierung gibt es keinen automatischen weiteren Auftrag, auch nicht bei Zeitlimit oder ungültigem Ergebnis. Falls weitere Profile vorhanden sind, bietet **Nächsten Anbieter versuchen** einen ausdrücklich ausgelösten neuen Versuch mit der verbleibenden Route an. Der vorherige Dienst könnte noch arbeiten. Ein Fehler beim Anzeigen der Vorschau bietet keinen Anbieterwechsel an. Projektänderungen sperren die Wiederholung; Änderungen an Profilen/Schlüsseln, Tresorsperre, Abbruch oder Bildwechsel verwerfen sie.

Der ausführbare Fachadapter bleibt der lokale TripoSR-Dienst. Cloud-Generatoren und automatische Rigging-Dienste sind damit noch nicht implementiert. Bestehende Profile und gespeicherte Schlüssel werden nicht gelöscht.

## Lokale Projektkopien im Model Zoo (0.26.0)

Der Nutzer speichert bewusst eine benannte Kopie des aktuellen 3D-Projekts. Jede Kopie bekommt eine eigene ID; gleiche Namen überschreiben nichts. Metadaten und vollständiges Projekt werden gemeinsam in IndexedDB gespeichert. Die Sammlung gilt pro Browserprofil und Origin und bleibt nach Seitenneuladen verfügbar. Grenzen: 50 Einträge, 80 MiB JSON je Projekt, zusätzlich Browserkontingent. Es werden nur die Metadaten der Sammlung für die Auswahl geladen.

Laden verwendet die vorhandenen Projekt-/Geometrieprüfungen und die vorbereitete Modellübernahme mit Rückabwicklung. Zwischenzeitliche Projektänderungen verhindern einen veralteten Import. Löschen erfordert Bestätigung und entfernt nur die gespeicherte Kopie. Weitere Bearbeitungen werden nicht automatisch gespeichert; die Ungespeichert-Markierung des aktiven Projekts bleibt erhalten. Originalplayer, mitgelieferte Katalogdateien und Anbieterprofile bleiben unverändert. Seit 0.28.0 ergänzt die Sammlung den gemeinsamen Laufzeitkatalog und dessen MCP-Abfrage. Browserdatenlöschung kann sie entfernen, daher zusätzlich Projektdateien sichern. Veröffentlichung, Synchronisierung und echte Browser-Persistenzabnahme bleiben offen. [Anleitung](LOKALER-MODEL-ZOO.md).

## Austausch eigener Moves (0.27.0)

Eine separate `.pakachi-move.json`-Datei enthält genau eine Studio-Bewegung und ihre verwendeten Posen einschließlich Prüfhinweisen und Gesamtspuren. Modell und bewegungsrelevante Rig-Struktur werden durch SHA-256-Fingerabdrücke gebunden; Geometrie und Anbieterzugänge werden nicht exportiert. Die Bindung ist eine konservative Kompatibilitätsprüfung, kein Retargeting und kein Echtheitsnachweis. Kosmetische Punktnamen und Anzeigegrößen dürfen abweichen; unterschiedliche Modelle, Grundstellungen, Einflussbereiche und Verbindungen werden abgewiesen.

Der Import kopiert Posen unter neue IDs und ergänzt bei Schlagwortkonflikten ein freies Suffix. Vorhandene Daten bleiben erhalten. Vor der einzigen Editoränderung werden Dateiformat, Projektgrenzen und der aktuelle Bearbeitungsstand geprüft. Import ist ein Undo-/Redo-Schritt, markiert das Projekt als geändert und startet keine Wiedergabe. Eingebettete GLB-Clips, automatische Übertragung auf andere Rigs und gemeinsame Veröffentlichung bleiben ausgenommen. [Dateiformat und Bedienung](MOVE-DATEIEN.md).

## Gemeinsame Auswahl und Agentenidentität (0.28.0)

Eine gemeinsame Katalogfunktion verbindet Originalplayer, mitgelieferte Avatare, validierte Metadaten gespeicherter Kopien und gegebenenfalls einen nur geladenen Sitzungsavatar. Dropdown, Karten, Zähler und `list_avatars` verwenden dieselbe Liste. Die RPC-Antwort bleibt bei `id`, `name` und `selected`; sie enthält weder Projektbytes noch gespeicherte Zugangsdaten.

Metadaten werden beim Start und bei ausdrücklicher Aktualisierung eingelesen; Speichern/Löschen aktualisiert sie nach Abschluss der Speicheroperation. Ungültige oder verspätete Listen ersetzen den bisherigen Katalog nicht. Geladene Kopien behalten ihre gespeicherte ID in StateMachine und Modellwechsel-Verlauf. Wird die Kopie gelöscht, bleibt die geladene Instanz mit derselben ID als Sitzungsavatar verfügbar. Erst ein späterer Wechsel entfernt diesen nicht mehr gespeicherten Eintrag aus der laufenden Auswahl.

Fähigkeiten und Moves werden erst nach tatsächlichem Laden über die vorhandenen Prüfungen bekanntgegeben. Die KI darf dadurch keine unbekannte gespeicherte Kopie automatisch laden oder neue Fähigkeiten voraussetzen. Eine andere Avatar-ID erfordert weiterhin die bewusste Auswahl im Player. Kein neuer MCP-Schreibbefehl, keine Tab-Synchronisierung und keine gemeinsame Veröffentlichung.

## Statische Katalogprojekte und Export (0.29.0)

Ein Katalogeintrag kann alternativ zur GLB/glTF-Quelle ein vollständiges `.pakachi.json`-Projekt unter der Anwendungsbasis referenzieren. Dadurch bleiben bearbeitete Kontrollpunkte, Posen, Moves und Entwurfspose im veröffentlichten Avatar erhalten. Die Katalog-ID muss mit der Projekt-ID übereinstimmen und wird bei der Installation beibehalten. Modell- und Projektquelle gleichzeitig sind ungültig. Die Erweiterung bleibt in Katalogschema 1, benötigt aber einen Player ab 0.29.0.

Das Exportskript erhält eine heruntergeladene Projektdatei, eine nicht reservierte Ziel-ID und einen neuen Ausgabeordner. Es erzeugt eine Projektdatei, einen einzelnen Katalogeintrag und Hinweise zur Übernahme. Explizite Feldlisten übernehmen nur bekannte Projektinhalte. Bestehende Ordner werden nicht überschrieben. Katalog-Merge, Veröffentlichung und visuelle Qualität bleiben bewusst eigene Schritte.

Der Player begrenzt Projektabrufe auf tatsächliche 80 MiB, verbietet externe Katalogpfade und Redirects, sendet keine Credentials und prüft IDs/Struktur vor dem bestehenden Modellimport. Geometrie, Modell-/Rig-Kompatibilität und Revisionsschutz werden weiterhin beim Laden geprüft. Skriptvalidierung ist keine Garantie für ein anatomisch korrektes oder visuell geprüftes Modell. [Bedienung und Grenzen](MODEL-ZOO-EXPORT.md).

## Zusammenführen statischer Kataloge (0.30.0)

`merge:zoo` liest zwei Paketwurzeln und schreibt ausschließlich in einen neuen Ordner außerhalb beider Quellen. Alle referenzierten Dateien werden vor dem Schreiben validiert und eingelesen. Doppelte IDs, reservierte IDs, normalisierte Pfadkonflikte, fehlende Dateien, entweichende Symlinks und externe Modellressourcen werden abgewiesen. Projekte müssen zur Katalog-ID passen.

Grenzen: 100 Einträge, je Katalog 1 MiB, je Projekt 80 MiB, je Modell 50 MiB und zusammen 256 MiB referenzierte Quelldateien. Der Arbeitsspeicherbedarf liegt wegen Parsing und Kopien darüber. Modelle/Projekte werden bytegenau kopiert; zusätzliche Projektfelder werden dabei nicht entfernt. Der neue Katalog wird normalisiert. Ein Bericht enthält IDs, Dateigrößen und SHA-256-Prüfsummen. Die Ausgabe ist kein vollständiger Player und enthält keine sonstigen public-Dateien. Ein Schreibfehler kann einen unvollständigen neuen Ordner hinterlassen. GLB/glTF-Container- und Ressourcenprüfungen ersetzen weder vollständige Loader-Prüfung noch visuelle Qualitätsabnahme; Veröffentlichung bleibt ein eigener Schritt.

## Gemeinsame statische Move-Sammlung (0.31.0)

`moves/catalog.json` (Schema 1) verweist auf bis zu 100 eigenständige Move-Dateien direkt unter moves/. IDs und Dateipfade sind eindeutig; Namen dienen nur der Anzeige. Die Sammlung wird erst auf Anforderung geladen, nicht automatisch ausgeführt. Katalogeinträge deklarieren keine geprüfte Kompatibilität: Erst der vollständige Import prüft Modell-/Rig-Fingerabdrücke und Projektgrenzen.

Abrufe erfolgen relativ zur Anwendungsbasis, ohne Zugangsdaten und Redirects. Der Katalog ist auf 256 KiB begrenzt, jede Move-Datei auf 8 MiB; tatsächliche Streambytes werden gezählt. Editoroperationen haben 30 Sekunden Zeitlimit und werden beim Verlassen/Entsorgen abgebrochen. Vor und nach asynchroner Importvalidierung gelten Sitzungszustand und Revision. Der bestehende einzelne Undo-/Redo-Schritt bleibt erhalten.

Das CLI exportiert sämtliche eigenen Moves eines Projekts in einen neuen Ordner, prüft alles vor dem Schreiben und überschreibt keine vorhandene Ausgabe. Grenze: 80 MiB Quellprojekt, 64 MiB exportierte Move-Dateien zusammen. Daten werden im Speicher vorbereitet. Kein Export eingebetteter Originalclips, kein Retargeting oder Deployment. Seit 0.32.0 ergänzt merge:moves das Zusammenführen zweier Sammlungen in einem neuen Ordner. Browsergestützte Pflege der gemeinsamen Dateien bleibt offen.

## Move-Sammlungen zusammenführen (0.32.0)

`merge:moves` liest zwei Paketwurzeln mit moves/catalog.json und schreibt ausschließlich in einen neuen Ordner außerhalb beider Quellen. Kataloge und Dateien werden vollständig geprüft und eingelesen, bevor die Ausgabe angelegt wird. Gemeinsame IDs oder Dateipfade werden auch bei identischen Inhalten abgewiesen; keine stillen Ersetzungen oder Umbenennungen. Dateien werden bytegenau kopiert, der kombinierte Katalog normalisiert. Ein Bericht enthält IDs, Pfade, Größen und SHA-256-Prüfsummen.

Die gemeinsame Strukturprüfung für einzelne Move-Dateien überprüft Version, Fingerabdruckformat, Posen/Spuren, Transformationen, Zeitgrenzen und Posenreferenzen. Dafür erzeugte interne Prüfdeskriptoren sind kein Rig und werden nicht exportiert. Die Prüfung bestätigt keine Modellkompatibilität oder Anatomie; dafür gilt weiterhin der vollständige Import gegen das tatsächliche Zielprojekt. Verschiedene Modellbindungen dürfen in einer Sammlung koexistieren. Zusätzliche Felder in Quelldateien bleiben beim bytegenauen Kopieren erhalten.

Grenzen: 100 Einträge, 256 KiB je Katalog, 8 MiB je Move-Datei und 64 MiB Move-Dateien insgesamt. Entweichende Dateisymlinks und nicht reguläre Dateien werden abgewiesen. Snapshots und Parsing benötigen zusätzlichen Arbeitsspeicher. Schreibfehler können eine unvollständige neue Ausgabe hinterlassen. Kein Playerpaket und keine automatische Veröffentlichung; Browserpflege und gerenderte Abnahme bleiben offen.

## Beugegrenzen für Zweiglied-IK (0.33.0)

Skelettpunkte erhalten optional `bendLimit: {min,max}` in Grad. Werte sind endlich, 0 ≤ min ≤ max ≤ 175; Oberflächenpunkte dürfen diese Eigenschaft nicht tragen. Der IK-Löser verwendet die Grenze des mittleren Knochens und beschränkt die Zielentfernung anhand des Kosinussatzes. Lokale Knochenverschiebungen bleiben unverändert. Ohne Grenze bleibt die bestehende Lösung erhalten.

Grenzen sind reine Regeln für das interaktive IK-Ziehen, keine Änderung der Quellgeometrie oder eines physischen Gelenks. Direkte Drehungen und Clip-/Posenwiedergabe sind bewusst nicht automatisch korrigiert. Allgemeine Dreh-/Twistgrenzen, anatomische Erkennung, Fußfixierung und Ganzkörper-IK bleiben offen. Nichtuniform skalierte Hierarchien sind nicht als anatomisch korrekt abgenommen.

Editoränderungen sind einzelne Undo-Schritte. Projektdateien und Katalogprojekt-Export erhalten die Werte; Move-Kompatibilität berücksichtigt sie. Geänderte oder entfernte Grenzen markieren vorhandene Posen mit `bend-limit`, ohne deren Transformationen zu ändern. Der Agent darf Grenzen über update_point nur an Knochen im Rig-Modus bearbeiten, mit der bestehenden Freigabe, Sitzung und Revision. null entfernt die Grenze. Assistent und beide MCP-Transporte kennen das Feld; die finale Prüfung bleibt im Studio.

Projektformat 1 ist additiv erweitert. Ohne Grenzen bleiben bisherige Move-Fingerabdrücke gleich. Dateien mit neuen Grenzen/Prüfgründen benötigen für vollständige Interpretation Software 0.33.0; ältere Versionen können Grenzen ignorieren oder neue Prüfgründe ablehnen. Gerenderte Bedienabnahme steht aus.

## Lesende Posenprüfung (0.34.0)

Gespeicherte Einzelposen lassen sich gegen vorhandene Beugegrenzen prüfen. Der Prüfer ermittelt ausschließlich tatsächliche verbundene Zweiglied-Ketten über dieselbe Kettenauswahl wie der IK-Löser. Aus den gespeicherten lokalen Positionen/Quaternionen und ursprünglichen Knochenskalierungen werden temporäre Matrizen im Anker-Elternraum berechnet. Die lebende Szene, Hautbindungen, Geometrie und Studio-Daten werden nicht verändert.

Pro konfiguriertem mittlerem Gelenk werden Winkel, Bereich und Ergebnis gemeldet; nicht passende Ketten und degenerierte Segmente gelten nicht als bestanden. Die Toleranz beträgt 0,0001 Grad. Das UI zeigt ausschließlich einen flüchtigen Bericht; Auswahlwechsel und Neudarstellung entfernen ihn. Es werden keine Prüfhinweise gelöscht, keine Revision erhöht und keine Undo-Aktion erzeugt. Fehlende/geschlossene oder interaktiv beschäftigte Studios weisen die Prüfung ab.

Die Prüfung ist keine vollständige Bewegungsabnahme. Zwischenbilder, Originalclips, Kollisionen, Twistgrenzen und automatische Korrekturen bleiben offen. Keine Formatänderung, keine neue MCP-Funktion und keine anatomische Garantie; gerenderte Browserabnahme steht aus.

## Stichprobenprüfung eigener Bewegungen (0.35.0)

Auf der lesenden Posenmessung baut eine Prüfung eigener Studio-Moves auf. Die Zeitliste enthält die erste Pose sowie 16 gleichmäßig verteilte Schritte je Übergang einschließlich Endpunkt; Schleifen schließen den Rückweg ein. Mit höchstens 100 Posenreferenzen entstehen maximal 1601 Stichproben. rig.sample liefert dieselben Zwischenwerte wie die Wiedergabe. Die Kettenauswahl verwendet innerhalb einer Einzelmessung vorbereitete Punkt-/Verbindungsindizes.

Die Prüfung verändert keine Szene, Pose, Revision, Undo-Historie oder Prüfmarkierungen. Je Gelenk werden kleinster/größter gemessener Winkel, Verletzungs-/Nichtmessbarkeitszähler und erster auffälliger Zeitpunkt zusammengefasst. Nicht passende Ketten bleiben separat ausgewiesen. Nach jeweils acht Stichproben wird die Ereignisschleife freigegeben und Abbruch, aktive Sitzung, Revision und Interaktionsstatus geprüft. Ein expliziter Abbruch sowie Bearbeitungen/Verlassen/Entsorgen verhindern Ergebnisübernahme. Nur eine solche Prüfung darf je Editor laufen.

Dies ist eine begrenzte Stichprobe, keine kontinuierliche Garantie und keine anatomische Bewertung. Zwischen den Zeitpunkten können Verletzungen unentdeckt bleiben. Keine Prüfung eingebetteter Originalclips, keine Kollisionen, keine automatische Korrektur, keine neue MCP-Funktion und keine Formatänderung. Gerenderte Bedienabnahme bleibt offen.

## Prüfbildvorschau und Posenübernahme (0.36.0)

Ein auffälliger Stichprobenzeitpunkt kann direkt aus dem Bericht als pausierte Vorschau geöffnet werden. Vor dem Öffnen werden aktives Studio, Revision, Interaktionszustand, Move-ID und Zeitbereich geprüft. Die gespeicherte Bearbeitungspose wird als flüchtiger Snapshot erhalten; Stopp oder Wechsel der Wiedergabe stellt sie wieder her. Abtastung erfolgt am exakten Zeitpunkt, auch am Ende eines nicht schleifenden Moves; bei Schleifen gilt die bestehende Rückkehr zur Startpose.

Eine ausdrückliche Übernahme liest das aktuelle pausierte Prüfbild, beendet die Vorschau und erstellt über die bestehende Änderungshistorie eine neue Pose. Undo/Redo umfasst Daten und angezeigte Bearbeitungspose. Bestehende Moves, Posen und Prüfhinweise werden nicht umgeschrieben. Maximal 100 Posen; keine Übernahme bei laufender Wiedergabe oder fehlender Prüfvorschau. Kein automatisches Einfügen, keine Korrektur und kein neuer MCP-Befehl. Die visuelle Abnahme bleibt offen.

## Bearbeiten bestehender Move-Sequenzen (0.37.0)

Die Posenfolge eines eigenen Moves wird als Liste von Vorkommen angeboten. Auswahl und Bearbeitung verwenden den Listenindex, damit wiederholte Posen unabhängig verschoben, ersetzt oder entfernt werden können. Einfügen/Ersetzen verwendet die ausgewählte Projektpose. Nur das poses-Array des Ziel-Moves wird geändert; andere Moves, Posenwerte und Schleifeneinstellung bleiben erhalten.

Vor jeder Änderung werden aktive Sitzung, Pose-Modus, Interaktionszustand, Revision, Ziel-Move, Anzahl 2–100 und Existenz aller Posen geprüft. Die Folge wird kopiert; ein identischer Auftrag erzeugt keinen Undo-Eintrag. Die bestehende Mutation stellt einen Undo-/Redo-Schritt bereit und invalidiert laufende Prüfergebnisse. Das Dateiformat bleibt unverändert; Export und Wiedergabe verwenden die aktualisierte Folge.

Zeitwerte bleiben Eigentum der Projektpose und gelten für jedes ihrer Vorkommen. Keine automatische Zeitaufteilung oder Anpassung anderer Moves. Keine automatische Gelenkkorrektur. Erweiterung der Agentenwerkzeuge und gerenderte Bedienabnahme bleiben offen.


## Agentenbearbeitung bestehender Sequenzen (0.38.0)

`get_studio(section: "moves")` liefert die geordnete Kopie der Posen-IDs einschließlich wiederholter Vorkommen. Die bisherigen Grenzen für Anzahl und UTF-8-Größe je Seite bleiben erhalten; Clients folgen `nextOffset`.

`update_move` ersetzt ausschließlich die Folge eines vorhandenen Moves durch 2–100 Verweise auf vorhandene Projektposen. Derselbe Editorpfad bedient Maus und Agenten. Namen, Schleifenflag, Posenwerte und aktuelle Figur bleiben erhalten. Identische Folgen ändern weder Revision noch Undo-Verlauf. Ein echter Austausch ist ein einzelner Undo-/Redo-Schritt.

Externe Agenten benötigen die Studio-Freigabe und eine aktuelle Sitzung/Revision. Der integrierte Assistent liest zunächst den Stand und legt nur einen Vorschlag zur ausdrücklichen Bestätigung vor. Rig-Modus, laufende Wiedergabe und Ziehgesten sperren Änderungen. Automatische Korrektur, separate Zeitwerte je Vorkommen und gerenderte/Live-Anbieter-Abnahme bleiben offen.


## Paginierte Modellermittlung (0.39.0)

Anthropic-Modelllisten folgen `has_more` und `last_id` als nächstem `after_id`, stets am konfigurierten Endpoint. Es werden keine vom Server gelieferten Folge-URLs aufgerufen. Schlüssel bleiben in Headern; Weiterleitungen sind gesperrt. Die endgültige Auswahl wird erst nach der letzten Seite sortiert und dedupliziert zurückgegeben.

Ein gemeinsamer Timeout und Abbruch gelten für alle Seiten. Pro Antwort bleiben 1 MiB und 1000 Einträge erlaubt; insgesamt maximal zehn Seiten und 5000 empfangene Einträge vor Deduplizierung. Leere Folgeseiten mit Fortsetzungsflag, falsche oder wiederholte Cursor, HTTP-Fehler und Grenzüberschreitungen brechen die komplette Abfrage ab. Vorhandene Profil-/Modellauswahl bleibt über die bestehenden UI-Regeln erhalten. Für andere Schnittstellen bleibt die bisherige Einzelabfrage bestehen.

Vertrag: [Anthropic Models API](https://platform.claude.com/docs/en/api/models/list), geprüft am 21.10.2026. Tests verwenden simulierte Antworten; echte Konto-/CORS-Abnahme und zusätzliche Workspace-Auswahl bleiben offen.


## Gemeinsame Sequenztransaktionen (0.40.0)

`update_moves` enthält 1–8 verschiedene bestehende Moves und ihre vollständigen neuen Posenfolgen. Je Move sind 2–100 Verweise auf vorhandene Posen erlaubt, zusammen höchstens 200 Verweise. Doppelte Ziel-IDs und unbekannte Felder werden abgewiesen. Vor der ersten Mutation werden alle Ziele und Posen geprüft und die Eingaben kopiert.

Die gesamte Änderung nutzt einen gemeinsamen Editorpfad mit der Einzelbearbeitung. Sitzung, Revision, Studio-Freigabe und Posenmodus gelten für das komplette Paket; Wiedergabe und Ziehgesten sperren es. Eine tatsächliche Änderung erhöht die Revision einmal und erzeugt einen gemeinsamen Undo-/Redo-Schritt. Ein unverändertes Paket ist ohne neue Revision erfolgreich. Abgewiesene Pakete verändern weder Daten noch Undo-/Redo-Verlauf. Namen, Schleifenflags, Posenwerte und aktuelle Figur bleiben erhalten.

Der integrierte Assistent zeigt das vollständige Paket als JSON-Vorschlag an und benötigt einmal die ausdrückliche Übernahme. Externe MCP-Clients verwenden die bestehende Studio-Freigabe. Das ist eine Transaktion für Sequenzänderungen, keine allgemeine Aktionsliste, keine gerenderte Vorher-/Nachher-Vorschau und kein Skelettumbau.


## Lesbare Sequenzvorschläge (0.41.0)

Vor der Freigabe von `update_move` oder `update_moves` liest das Assistentenpanel die aktuellen Moves und Posen lokal über paginierte `get_studio`-Abfragen. Jede Seite und eine abschließende Statusabfrage müssen zur vorgeschlagenen Sitzung/Revision und einem geöffneten Studio gehören. Fehlende Ziele, Posen oder inkonsistente Seiten verhindern das Angebot zur Übernahme.

Eine Tabelle je Bewegung zeigt Namen und IDs sowie Vorher-/Nachher-Schritte. Wiederholungen bleiben einzeln sichtbar; fehlende Gegenstücke beim Einfügen/Entfernen werden mit einem Gedankenstrich dargestellt. Projekttexte werden ausschließlich als Textknoten eingefügt. Tabellenbeschriftungen sind Deutsch/Englisch; benutzerdefinierte Namen werden nicht übersetzt. Das vollständige JSON bleibt zur Kontrolle verfügbar.

Die Vergleichsansicht ist rein lesend und lokal, ohne zusätzlichen Anbieteraufruf oder Änderung der Figur. Bestätigung führt weiterhin genau den geprüften Vorschlag über den revisionsgeschützten Editorpfad aus. Eine zwischenzeitliche Änderung wird dort erneut abgewiesen. Die Tabelle bleibt ein Reihenfolgevergleich; seit 0.42.0 ergänzen lokale Abspielknöpfe die Vorschau am Modell (siehe folgenden Abschnitt).


## Temporäre Sequenzvorschau am Modell (0.42.0)

Der Vergleich jedes betroffenen Moves bietet lokales Abspielen seiner bisherigen oder vorgeschlagenen Folge. Das Studio hält dafür eine kopierte temporäre Sequenz in der Wiedergabezeitleiste; die gespeicherte Move-Liste bleibt unverändert. Dauer, Interpolation, Schleifen, Tempo, Pause und Abspielposition verwenden dieselben Studio-Verfahren wie normale Moves.

Vor dem Start prüft der Editor Sitzung, Revision, geöffneten Posenmodus, Ziele und Posen sowie laufende Interaktionen/Beugegrenzenprüfung. Der Nutzer startet die lokale Vorschau ausdrücklich; dafür ist keine KI-Schreibfreigabe erforderlich. Das Speichern des Vorschlags benötigt weiterhin die bestehende Freigabe. Während der Vorschau sind Bearbeitungen gesperrt.

Die bisherige Bearbeitungspose wird separat gehalten und bei Stopp, Ende eines nicht wiederholten Moves, Wechsel der Vorschauseite, Übernahme oder Panel-Reset wiederhergestellt. Beim Verlassen des Studios wird die vorherige Bearbeitungspose als Entwurf erhalten. Modellabbau beendet die Vorschau ebenfalls. Ein verspäteter Aufräumaufruf darf keine inzwischen gestartete andere Wiedergabe stoppen.

Die Vorschau erzeugt keine Revision, keinen Undo-Schritt und keine Änderung an gespeicherten Moves/Posen. Pakete werden Bewegung für Bewegung angesehen und weiterhin gemeinsam übernommen. Es gibt keine parallele geteilte 3D-Ansicht und keine automatische Bewegungskorrektur. Geometrie-/DOM-Tests bestehen; visuelle Browserabnahme bleibt offen.


## Reproduzierbare Browserprüfung (0.43.0)

Der Workflow `.github/workflows/verify.yml` führt auf Ubuntu 24.04 mit Node 24 zuerst `npm ci`, Node-Tests und Build aus. Anschließend installiert er die zur gesperrten Playwright-Version passenden Chromium-Abhängigkeiten und führt die Browserfälle aus. Auslöser sind Push auf main, Pull Requests auf main und manueller Start. Ein neuer Lauf derselben Referenz ersetzt einen noch laufenden älteren Versuch; Zeitgrenze 20 Minuten.

Die Tests verwenden lokale Testdaten und simulierte Anbieterantworten, keine Kontoschlüssel oder reale Inferenz. Workflow-Rechte sind auf Lesen der Repository-Inhalte begrenzt. HTML-Bericht, Fehler-Screenshots, Traces und explizite Testbilder werden als `browser-evidence` für 14 Tage bereitgestellt. In CI werden versehentlich exklusiv markierte Tests abgewiesen; ein Vite-Server wird für den Lauf frisch gestartet.

Das neue Szenario prüft einen echten Studio-/Assistentenablauf bis zur Übernahme und zum Undo. Die bloße Definition und Auflistung dieser Tests ist kein Browsernachweis. Der lokale Chromium-Prozess bricht weiterhin vor dem Seitenstart mit einer Socket-Berechtigungssperre ab; der erfolgreiche Runner-Lauf ist seit 0.44.0 nachgewiesen, die manuelle visuelle Prüfung bleibt erforderlich.


## Browserbefunde und Animationszeit (0.44.0)

Der erste GitHub-Runner konnte Chromium mit WebGL starten. Zwei von sieben Fällen bestanden: Original-Transformation und KI-Sequenzvorschau inklusive Übernahme/Undo. Fünf Fälle schlugen fehl. Quelltextabgleich zeigt fehlende Original-Metadatenaktualisierung und eine Begrenzung der Animationszeit auf 50 ms je Renderbild.

Der Viewer verwendet nun die tatsächlich vergangene Vordergrundzeit. Bei langsamem Software-Rendering laufen Clips dadurch nicht künstlich langsamer. Bei einem Sichtbarkeitswechsel wird die Uhr zurückgesetzt; verborgene Frames liefern null Animationsfortschritt. Damit wird keine lange Hintergrundpause beim Zurückkehren nachgeholt. Ungültige oder rückläufige Zeitstempel verändern die Uhr nicht.

Originalwechsel aktualisieren Name, Beschreibung und Modelltyp, leeren die 3D-Move-Auswahl und synchronisieren die Wiedergabesteuerung. Die ursprünglichen Bilddateien bleiben unverändert. Der [Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209) für Commit `5474cb169515da8a2bb70d66176396f64770c09f` bestätigt die Korrekturen: alle sieben Chromium-E2E-Fälle bestanden. Die manuelle Maus-/UI-Abnahme und echte Inferenz bleiben offen.


## Lokale Sammlung in mehreren Tabs (0.45.0)

Nach einem erfolgreich abgeschlossenen IndexedDB-Speicher- oder Löschvorgang sendet das Panel über den gleichnamigen BroadcastChannel desselben Ursprungs nur die Nachricht `changed`. Es überträgt keine Projekt- oder Zugangsdaten. Empfänger lesen die validierte Metadatenliste erneut aus IndexedDB. Aktiver Avatar, Studio-Revision und Bearbeitungsstand werden nicht ersetzt.

Meldungen während einer laufenden Operation werden zu einer ausstehenden Aktualisierung zusammengefasst. Die ausgewählte gespeicherte ID bleibt erhalten, sofern sie weiter existiert. Zusätzlich wird bei Fensterfokus aktualisiert; bei fehlendem BroadcastChannel bleiben Fokus und manueller Aktualisierungsknopf verfügbar. Fehler beim Benachrichtigen machen einen bereits abgeschlossenen Speichervorgang nicht rückgängig. Beim Abbau werden Kanal und Ereignisbehandlung geschlossen.

Die neuen Browserfälle bestätigen echte IndexedDB-Persistenz nach Reload einschließlich Posen, Move-Verweisen und gespeicherter Identität sowie zwei Tabs mit Löschbestätigung. Alle neun Chromium-Fälle bestehen im [CI-Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987). Die bestehenden Grenzen von 50 Einträgen/80 MiB je Projekt bleiben erhalten; reale Browserquoten sind damit nicht abgenommen.

## Move-Dateiaustausch im Browser (0.46.0)

Der zusätzliche End-to-End-Fall verwendet eine echte heruntergeladene Move-Datei und den Browser-Dateiauswahldialog. Er prüft neue Posen-IDs, den Erhalt wiederholter Posenverweise und die konfliktfreie Move-ID beim erneuten Import in dasselbe Modell. Die importierte Sequenz wird im Studio abgespielt und über den sichtbaren Stoppknopf angehalten. Undo entfernt den gesamten Import; eine anschließend abgewiesene Modellbindung darf den erhaltenen Redo-Schritt nicht verändern. Diese Prüfung ergänzt die bestehenden Daten-/Editor-Tests; sie führt kein Retargeting ein und ersetzt keine manuelle Qualitätsabnahme. 237 Tests, Build und alle zehn Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594)).

## Echte Zwischengelenke (0.47.0)

Das Studio speichert optionale `boneInsertions` als begrenzte Folge von Knochenstrecken-Unterteilungen neben dem unveränderten Quellmodell. Jede Unterteilung verweist auf den vorhandenen Kindknochen und einen Anteil zwischen 0,1 und 0,9; die Oberfläche fügt zunächst in der Mitte ein. Neue Knochen werden am Ende der stabilen Knochenliste geführt. Das Quellkind erhält den neuen Knochen als Elternknoten. Die Grundstellung bewahrt seine Weltposition; vorhandene Posen werden um die zusätzliche lokale Spur ergänzt und ihre Kindposition entsprechend umgerechnet. Alle vorhandenen Posen erhalten einen Prüfhinweis.

Für betroffene SkinnedMeshes wird der neue Knochen in die Skinning-Palette aufgenommen. Vorhandene Einflüsse des Elternknochens werden anhand der projizierten Position auf der Strecke anteilig dem Zwischengelenk zugewiesen. Pro Vertex bleiben höchstens vier normalisierte Einflüsse erhalten; bei Überbelegung werden die stärksten vier verwendet. Das ist eine geometrische Gewichtsheuristik, keine anatomische Erkennung oder Gewichts-Maloberfläche. Die Qualität muss am jeweiligen Modell geprüft werden.

Die Hierarchie und Gewichte werden aus Quellmodell und Unterteilungen reproduziert. Originalclips verwenden wieder das Quellskelett und die ursprünglichen Gewichte; eigene Studio-Moves stellen die Bearbeitungshierarchie wieder her. Undo/Redo umfasst Daten, Hierarchie und Gewichte. Projektdateien, lokale Sammlung und Katalogexport erhalten die Unterteilungen. Move-Kompatibilität berücksichtigt die Hierarchieänderungen. Projektformat bleibt 1; Projekte mit Unterteilungen benötigen Software ab 0.47.0.

Grenzen: vorhandene Knochenstrecke erforderlich, höchstens 64 Unterteilungen und 256 Knochen/Kontrollpunkte. Kein vollständiges Auto-Rigging, kein beliebiges Löschen oder Umhängen von Quellknochen, kein eigenständiger GLB-Export. „Kontrollpunkt löschen“ entfernt weiterhin nur den Griff. Der neue Browserfall bestätigt Einfügen, Undo/Redo und Projekt-Download/-Import. 242 Tests, Build und alle elf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)).

## Knochen entfernen (0.48.0)

Die optionale geordnete Liste `boneDeletions` referenziert stabile Knochenindizes nach den Einfügungen. Entfernte Knochen behalten ihren Indexplatz in den Rekonstruktionsdaten, sind jedoch aus der aktiven Modellhierarchie und den Skinning-Paletten entfernt. Das eingebettete Quellmodell bleibt unverändert. Beim Wiederherstellen des Quellmodells für Originalclips werden ursprüngliche Hierarchie und Gewichte wiederhergestellt.

Direkte Kindknochen wechseln zum überlebenden Elternknochen. Grundstellung, gespeicherte Posen, Entwurf und aktuelle Pose werden durch Komposition der lokalen Positionen und Quaternionen umgerechnet. Die Gewichte des entfernten Knochens werden mit den Gewichten seines Elternknochens zusammengeführt und normalisiert; Palette und Vertex-Indizes werden konsistent verkleinert. Vorhandene Posen werden markiert: Die Welttransformationen verbleibender Kindgelenke bleiben erhalten, die Hautverformung einer entfernten Gelenkspur kann sich dennoch ändern und verlangt Kontrolle.

Die Änderung ist ein Undo-/Redo-Schritt. Fehler rollen Daten und Laufzeitstruktur zurück. Projektdateien, lokale Sammlung und Katalogexport erhalten die Löschliste; Move-Kompatibilität berücksichtigt sie. Die Skelettanzeige baut ihre Linien bei Hierarchieänderungen neu auf.

Geschützt sind Wurzelknochen, Knochen mit eigener Skalierung ungleich 1, Nicht-Knochen-Anbauten und fehlende Elternknochen in einer betroffenen Skinning-Palette. Eltern- und Kindgriffe müssen vorhanden sein. Weitere Einfügungen nach Löschungen sind vorerst gesperrt; Löschungen zuerst per Undo zurücknehmen. Beliebig gemischte Umbaufolgen, Umhängen und gezielte Gewichts-Malwerkzeuge bleiben offen. Neue Bedienung zunächst über die Studio-Oberfläche; kein neuer MCP-Befehl. Projektformat bleibt 1, Projekte mit Löschlisten benötigen Software ab 0.48.0.

## Gemischte Knochenänderungen (0.49.0)

Ein Einfügeeintrag kann `afterDeletions` enthalten: die Anzahl vorausgegangener Löschungen. Fehlende Angaben bedeuten 0 und erhalten das Verhalten älterer Projekte. Die Marker müssen ganzzahlig, monoton und innerhalb der Löschliste sein. Referenzen auf zu diesem Zeitpunkt fehlende Knochen werden bei der Rekonstruktion abgewiesen.

Die Laufzeithierarchie wird nun in der gespeicherten Reihenfolge aufgebaut. Die dazugehörigen Skinning-Palettenänderungen und Gewichtsübertragungen erfolgen ebenfalls in dieser Reihenfolge. Die abschließenden Grundstellungen liefern die Geometrie für die weiterhin angenäherte Gewichtsverteilung. Die ursprünglichen Modellbytes bleiben unverändert. Katalogexport und Move-Bindung erhalten beziehungsweise berücksichtigen die Marker. Undo/Redo setzt jeden Eingriff mit seinem Datenstand zurück.

Die Einfügesperre nach Löschungen entfällt. Projektformat bleibt 1; gemischte Abläufe benötigen Software ab 0.49.0. Schutz vor Wurzellöschung, eigener Knochenskalierung und Anbauteilen bleibt bestehen. Gezielte Gewichtsbearbeitung, freies Umhängen und neue MCP-Topologieaktionen bleiben offen. Lokale Tests prüfen wiederholte Mischfolgen und identische Gewichte nach Rekonstruktion; die zwölf Chromium-Fälle bestehen im [CI-Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795), die manuelle Hautabnahme bleibt offen.


## Knochenbearbeitung durch Agenten (0.50.0)

Seit **0.50.0** unterstützen `edit_studio` und der integrierte Assistent zwei weitere Aktionen: `insert_bone` mit der ID des Kindknochens fügt ein echtes Zwischengelenk mittig ein; `delete_bone` entfernt den angegebenen Knochen und überträgt Kinder und Gewichte an seinen Elternknochen. `delete_point` entfernt weiterhin nur den Griff. Zuerst `get_studio` mit `section: points` lesen, dann im Rig-Modus mit aktueller Sitzung/Revision und erteilter Bearbeitungsfreigabe arbeiten. Der integrierte Assistent legt Änderungen weiterhin zur ausdrücklichen Übernahme vor. Jeder Eingriff ist über Undo/Redo rückgängig machbar; vorhandene Posen danach prüfen. Die Schutzregeln für Wurzeln, skalierte Knochen und Anbauteile bleiben bestehen.

249 Tests und Build bestanden; Node-MCP-Transport mit beiden Aktionen geprüft. Python-Modell und Werkzeugbeschreibung erweitert, Syntax geprüft. Keine neue reale Python-MCP-/Anbieterabnahme; der [CI-Lauf für 0.50.0](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771) ist erfolgreich.


**0.51.0:** Zwei Chromium-Fälle für Assistenten-Vorschlag → ausdrückliche Übernahme → Undo bei `insert_bone` und `delete_bone`. Sie prüfen unveränderte Revision/Geometrie vor Zustimmung und Wiederherstellung der Gelenkdaten nach Undo. Antworten des Anbieters sind simuliert. 249 Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40113222944)). Der vorherige Stand 0.50.0 besteht seine [CI-Prüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771).


**0.52.0:** Zwischengelenke lassen sich über einen Mausregler bei 10–90 % der vorhandenen Knochenstrecke einfügen (vom Elternknochen zum ausgewählten Kind; Standard 50 %). Assistent und beide MCP-Server unterstützen dafür optional `ratio`. Vorhandene Posen, Gewichtsverteilung, Projektpersistenz und Undo/Redo bleiben berücksichtigt. 251 Node-Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40134452209)). Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.


**0.53.0:** Vorhandene Knochen lassen sich im Modus „Gelenke bearbeiten“ einem anderen Elternknochen zuordnen. Grundstellung, gespeicherte Einzelposen und aktuelle Pose werden umgerechnet; Hautgewichte bleiben beim jeweiligen Knochen. Undo/Redo, gemischte Umbaufolgen, Projekt-/Katalogexport und die Aktion `reparent_bone` für Assistent/MCP sind enthalten. `get_studio` liefert `parentBone` und `parentId`. 256 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40138951275)).

Nur innerhalb desselben Skelettbaums; Wurzeln, Kreise, skalierte Knochenketten und Knochen mit direkten Nicht-Knochen-Anbauteilen werden abgewiesen. Gespeicherte Einzelposen bleiben erhalten, interpolierte Bewegungswege können sich ändern und werden zur Prüfung markiert. Keine automatische anatomische Bewertung oder neue reale Anbieter-/Python-Host-Abnahme.


**0.54.0:** Knochen mit starren Anbauteilen können umgehängt werden. Auch verschachtelte starre Objektgruppen mit eigener Drehung und Skalierung bleiben am Knochen befestigt; Grundstellung und gespeicherte Einzelposen behalten ihre Welttransformationen. Anbauteile mit eigenen Knochen oder SkinnedMesh bleiben ausgeschlossen. Löschen eines Knochens mit Anbauteilen ist weiterhin gesperrt. 258 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40184399914)).


**0.55.0:** Oberflächen-Einfluss eines Knochens lässt sich anteilig auf einen anderen übertragen. Mengenregler, Undo/Redo, Projekt-/Katalogpersistenz, gemischte Knochenänderungen und `transfer_weights` für Assistent/MCP sind vorhanden. Die Grundgeometrie bleibt erhalten; Posen werden mit `skin-weights` zur Prüfung markiert. 264 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40217823978)).

Die Übertragung betrifft alle Vertices mit Quellgewicht, ohne räumlichen Malpinsel. Bei mehr als vier Einflüssen bleiben die vier stärksten, anschließend auf Summe 1 normalisiert; dadurch kann der effektive Anteil vom Reglerwert abweichen. Fehlende Zielpaletten, leere Quellen und ungültige Werte werden ohne bleibende Änderung abgewiesen. Manuelle Haut-/Bewegungsqualität und reale Anbieterabnahme bleiben offen.


**0.56.0:** Hautgewichtsübertragungen können auf einen kugelförmigen Bereich um das Quellgelenk begrenzt werden. Radius per Mausregler; Stärke nimmt zum Rand weich auf null ab. Außerhalb bleiben Gewichte unverändert. Assistent/MCP unterstützen optional `region: {center, radius}`; Projekt-/Katalogexport erhalten den Bereich. 266 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40219939990)).

Der Bereich bezieht sich auf normalisierte Weltkoordinaten der ursprünglichen Grundpose, unabhängig von der aktuellen Figurpose. Die Oberfläche nutzt den gespeicherten Gelenkpunkt als Mittelpunkt; API-Aufrufe können einen eigenen Mittelpunkt setzen. Noch kein kontinuierlicher Malpinsel oder sichtbare Bereichsvorschau. Höchstens vier normalisierte Einflüsse pro Vertex; manuelle Hautqualität und echte Anbieterabnahme bleiben offen.


**0.57.0:** Die räumlich begrenzte Gewichtsübertragung zeigt eine Vorschau im Studio: grüne Außenringe markieren den Radius, orange Innenringe die halbe Stärke. Sie folgt Auswahl, Radius und bearbeitetem Gelenkpunkt und wird im Posenmodus sowie außerhalb des Studios ausgeblendet. Die Vorschau verändert weder Projekt noch Undo-Verlauf. 268 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40253220224)).

Die Ringe zeigen den räumlichen Bereich in der ursprünglichen Grundpose, nicht die tatsächlich gewichteten Vertices. Kontinuierlicher Gewichtspinsel und farbige Darstellung der Hautgewichte bleiben offen. Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.

## Freie Knochenabzweigungen

**0.58.0:** Neue Knochen lassen sich als freie Abzweigung an einem ausgewählten Elternknochen platzieren. Verbindung und Skinning-Palette entstehen automatisch; bestehende Hautgewichte bleiben unverändert. Einfluss lässt sich danach gezielt übertragen. Undo/Redo, gespeicherte Posen, Projekt-/Katalogexport und `add_bone` über Assistent/MCP sind berücksichtigt.

271 Node-Tests, Build und alle 18 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40277434553)); Python-Syntax lokal geprüft.

Benötigt einen vorhandenen Elternknochen; kein neues Skelett auf einer ungeriggten Oberfläche. Neue Knochen wirken erst nach Gewichtsübertragung auf die Haut. Skalierte Knochenketten sind ausgeschlossen. Kontinuierlicher Gewichtspinsel, Gewichtsfärbung und manuelle Hautabnahme bleiben offen. Projekte mit freien Knochen benötigen mindestens 0.58.0; ältere Leser lehnen diese Einträge ab.

## Gewichtspinsel

**0.59.0:** Hautgewichte lassen sich mit gedrückter linker Maustaste zwischen zwei ausgewählten Knochen übertragen. Der Pinsel verwendet Radius und Anteil, zeigt den räumlichen Einfluss am aktuellen Treffer und setzt Aufträge mit festem räumlichem Abstand. Ein kompletter Strich ist ein Undo-Schritt; Abbruch und Überschreitung des Übertragungslimits nehmen den ganzen Strich zurück. Währenddessen sind Editor-Eingaben und Agentenänderungen gesperrt.

275 Node-Tests, Build und alle 19 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40280964660)).

Erste Pinselstufe: kugelförmiger Einfluss, auch durch dünne Oberflächen hindurch; keine Beschränkung auf sichtbare Vertices, keine Gewichtsfärbung. Überlappende Aufträge verstärken den Effekt. Höchstens 128 gespeicherte Übertragungen pro Projekt einschließlich Einzelaufträgen; lange Striche können das Limit erreichen. Große Sprünge und fehlende Oberflächentreffer unterbrechen die Verbindung zwischen Aufträgen. Manuelle Hautqualitäts- und Performance-Abnahme bleibt offen.

## Farbige Hautgewichte

**0.60.0:** Die tatsächlichen Hautgewichte des ausgewählten Knochens können farbig angezeigt werden: Blau = 0 %, Grün = 50 %, Rot = 100 %, mit Zwischenfarben. Die Anzeige folgt Auswahl, Gewichtsübertragung, Pinsel und Undo/Redo. Ausschalten, Posenmodus und Verlassen des Studios stellen ursprüngliche Materialien und Vertex-Farben wieder her. Die Ansicht verändert weder Projekt, Revision noch Undo-Verlauf.

277 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40313636231)).

Nur geriggte Oberflächen mit Skinning-Gewichten. Farben werden zwischen Vertices über Dreiecke interpoliert; die Anzeige ist keine Anatomie- oder Qualitätsbewertung. Der bestehende Pinsel bleibt kugelförmig und auf 128 gespeicherte Übertragungen begrenzt. Beschränkung auf sichtbare Vertices, größere Pinselbudgets und manuelle Hautqualitäts-/Performance-Abnahme bleiben offen.

## Größeres Pinselbudget

**0.61.0:** Das gemeinsame Budget für Pinsel- und Einzelübertragungen steigt von 128 auf 1024 Aufträge pro Projekt. Neue Übertragungen werden auf den aktuellen Gewichten berechnet, ohne den bisherigen Verlauf und das Skelett bei jedem Auftrag erneut aufzubauen. Alle betroffenen Oberflächen werden vor der Übernahme geprüft; Fehler hinterlassen keine teilweise geänderten Gewichte. Posen, Skinning-Paletten und bestehende Attribute bleiben während der Übertragung erhalten.

278 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40362549729)). Der Import mit 256 Aufträgen dauerte auf diesem CI-Runner 19,181 Sekunden; weitere Ladezeitoptimierung bleibt offen.

Projekte mit mehr als 128 Gewichtsaufträgen benötigen mindestens 0.61.0. Das Projektformat bleibt Version 1; ältere Leser lehnen das größere Budget ab. Laden und Undo/Redo rekonstruieren weiterhin den gespeicherten Verlauf. Die manuelle Performance-Abnahme großer Modelle bleibt offen; keine pauschale Echtzeit-Zusage. Sichtbare Oberflächen begrenzen den kugelförmigen Pinsel weiterhin nicht.

## Gewichtsverläufe schneller berechnen

**0.62.0:** Die Berechnung langer Gewichtsverläufe verwendet vorberechnete Weltpositionen, wiederverwendete kleine Zahlenfelder und direkte Pufferkopien. Vertices ohne Quellgewicht oder außerhalb des Bereichs werden früh übersprungen. Der Gewichtsvergleich bestätigt dieselben Ergebnisse einschließlich Zusammenführen doppelter Indizes, Sortierung, Normalisierung und Vier-Einfluss-Grenze.

279 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40407457621)). Der Browserimport mit 256 Aufträgen dauerte in diesem Lauf 6822 ms (vorheriger 0.61.0-Lauf: 19181 ms). Einzelmessungen auf CI-Runnern, keine allgemeine Laufzeitgarantie.

Das Budget bleibt bei 1024 Aufträgen. Lokale Messung mit 256 Aufträgen: 1626/1471/1551 ms für den reinen Rig-Reset (Median 1551 ms); vorherige Vergleichsmessung 6375/5903/5718 ms. Dies ist kein vollständiger Browserimport und keine allgemeine Echtzeit-Zusage. Vorberechnete Weltpositionen benötigen 24 Byte pro Vertex statt zuvor 12 Byte für die Positionskopie. Beschränkung des Pinsels auf sichtbare Oberflächen und manuelle Prüfung großer Modelle bleiben offen.

## Pinsel mit Sichtprüfung

**0.63.0:** Die optionale Checkbox „Pinsel nur auf sichtbare Oberfläche“ begrenzt Gewichtsaufträge auf geometrisch sichtbare Vertices im Blickfeld. Eine räumliche Suchstruktur prüft Verdeckung durch andere Dreiecke. Die Kamera wird pro Strich festgehalten und mit den Aufträgen gespeichert; Projekt-/Katalogexport und Undo/Redo reproduzieren die Auswahl. Assistent/MCP können `region.view` aus `get_studio.view` übernehmen.

281 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40529588502)); Python-Syntax lokal geprüft. Der Browserimport mit 256 sichtgefilterten Aufträgen dauerte in diesem Lauf 8909 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Sichtprüfung bezieht sich auf die ursprüngliche Grundpose. Dreiecke gelten beidseitig als undurchsichtige Hindernisse; Transparenz, Alpha-Ausschnitte und Materialgruppen-Sichtbarkeit werden nicht ausgewertet. Die erste Sichtprüfung baut eine Suchstruktur auf und benötigt zusätzlichen Speicher; große Modelle sind noch nicht manuell abgenommen. Ohne Checkbox gilt weiterhin der kugelförmige Pinsel. Projekte mit `region.view` benötigen mindestens 0.63.0.


## Material-Sichtbarkeit des Gewichtspinsels

**0.64.0:** Neue sichtgefilterte Pinselstriche berücksichtigen ausgeblendete Materialien und Materialgruppen sowie transparente Materialien mit Opazität 0. Die ursprünglichen Materialeigenschaften werden beim Laden festgehalten; eine temporäre Gewichtsfärbung verändert die Auswahl nicht. `region.view.materials: true` speichert diese Regel. Ohne das Feld gilt weiterhin die geometrische Sichtprüfung aus 0.63.0, damit alte Verläufe unverändert bleiben.

282 Node-Tests, Produktionsbuild und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40542963343)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 6254 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Teiltransparente Materialien und Alpha-Texturen gelten weiterhin als undurchsichtige Hindernisse; Dreiecke bleiben beidseitig. Große Modelle und Materialdarstellung sind noch nicht manuell abgenommen. Dateien mit dem neuen Feld benötigen mindestens 0.64.0.


## Alpha-Ausschnitte im Gewichtspinsel

**0.65.0:** Neue sichtgefilterte Pinselstriche berücksichtigen Alpha-Ausschnitte über `alphaTest`, Bildalpha und den Grünkanal einer `alphaMap`. Die Prüfung interpoliert UVs am Strahltreffer und berücksichtigt Texturtransformation, UV-Kanal, Wiederholung, Spiegelung, Flip und Nearest-/Linear-Vergrößerungsfilter. Pixel und Materialdaten werden beim Laden festgehalten. `region.view.alpha: true` zusammen mit `materials: true` speichert die neue Regel; ältere Aufträge behalten ihre bisherige Sichtprüfung.

285 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40545759919)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 8998 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Die Alpha-Prüfung verwendet deterministisch die Basisebene der Textur, keine Mipmaps oder anisotrope Filterung. Dadurch sind Abweichungen zur gerenderten Kante bei Verkleinerung möglich. Unterstützt sind lesbare RGBA-8-Bit-Bilder bis 16.777.216 Pixel pro Textur. Nicht lesbare/komprimierte Texturen, fehlende UVs, Shader-Materialien und Alpha-to-Coverage bleiben verdeckend. Teiltransparenz wird nicht simuliert; Dreiecke bleiben beidseitig. GPU-/Materialqualität und große Modelle sind nicht manuell abgenommen. Neue Alpha-Aufträge benötigen mindestens 0.65.0; kein automatischer Umbau alter Verläufe.


## Speicherbedarf der Sichtprüfung

**0.66.0:** Der Sichtfilter kopiert nur UV-Kanäle, die tatsächlich von unterstützten Alpha-Materialien benötigt werden. Undurchsichtige Dreiecke erhalten keine eigenen UV-Vektoren. Die Sichtregeln und gespeicherten Projekte bleiben unverändert. `npm run benchmark:visibility` misst synthetische Flächen mit 5.000/20.000/80.000 Dreiecken, jeweils undurchsichtig und mit Alpha-Ausschnitt; jeder Fall läuft in einem eigenen Prozess.

286 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40665412491)). Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 4758 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Lokale Einzelmessung bei 80.000 Dreiecken: zurückbehaltener JavaScript-Heap einschließlich Testmodell von 166,10 auf 64,85 MiB (undurchsichtig) und 166,12 auf 100,20 MiB (Alpha). Die 1.000 Strahlproben lieferten jeweils dieselben Ergebnisse. Keine Messung des vollständigen Browserimports, Renderings oder Skinning; keine allgemeine Laufzeit-/Speicherzusage. Mipmaps, Teiltransparenz und manuelle Abnahme großer realer Modelle bleiben offen.


## Browserprüfung der Mausnavigation

**0.67.0:** Ein zusätzlicher Browserfall prüft echte Mausrad-, Rechts- und Mitteltastenereignisse im Studio. Nach außermittigem Zoom und Verschieben bleiben beim Drehen Abstand und Bildschirmposition der bekannten Figurenmitte konstant. Der Test wählt die normale und invertierte Drehrichtung über den Optionsdialog, prüft gegensinnige Kamerabewegung und funktionierenden Zoom nach Loslassen. Der übrige Studiozustand einschließlich Revision und Figur bleibt unverändert.

Produktionsbuild lokal bestanden. Neuer Chromium-Nachweis steht aus. Der bisherige bestätigte Stand umfasst 286 Node-Tests und 21 Browserfälle.

Dies ergänzt den automatisierten Navigationsnachweis; tatsächliches Mausgefühl, komplexe Skelett-/Hautqualität und große reale Modelle bleiben manuell zu prüfen. Keine Änderung am Kameraalgorithmus.

## Lokale Prüfbarkeit (0.68.0)

Node-Tests und Produktionsbuild sind gemeinsam über `npm run verify` ausführbar. `npm run verify:full` ergänzt die bestehenden Chromium-Fälle. Beide Abläufe stoppen bei Fehlern und benötigen kein GitHub-Actions-Kontingent; Browser und Systembibliotheken werden separat eingerichtet. Ein erfolgreicher Lauf ohne Browserprüfung gilt nicht als vollständige Abnahme. Die Produkt- und Projektformate ändern sich dadurch nicht.

## Model-Zoo-Speicherfehler (0.68.0)

Konkrete Hinweise unterscheiden volles Browserkontingent, 50 Kopien und Projekte über 80 MiB. Vorhandene Kopien werden nicht automatisch gelöscht. Scheitert nach bestätigtem Speichern oder Löschen nur die Listenabfrage, bleibt der Erfolg sichtbar. Veraltete Auswahlen können bis zu einer erfolgreichen Aktualisierung weder geladen noch gelöscht werden; „Liste aktualisieren“ bleibt nutzbar. Das aktive Projekt bleibt erhalten.

Automatische Listenaktualisierungen erhalten die Meldung zum letzten Bedienvorgang. Eine getrennte Statusmeldung zeigt einen Listenfehler und wird nach erfolgreicher Aktualisierung entfernt. So bleibt eine bestätigte Speicherung auch bei wartenden Tab-Ereignissen erkennbar.

## Messbarkeit des Projektimports (0.68.0)

Der CPU-Importbenchmark trennt Dateilesen, Projektprüfung, Modelldekodierung, Normalisierung und Rig-Aufbau. Er nutzt produktive Loader und Rig-Rekonstruktion, während die Viewer-Normalisierung ohne Renderer nachgebildet wird. Eigene Quelldateien bleiben unverändert. Bildtexturen werden abgewiesen, statt eine unvollständige Browserdekodierung als erfolgreich zu messen. CPU-Zeiten ersetzen keine vollständigen Browserladezeiten oder Hautqualitätsabnahme. [Messvertrag und Aufruf](IMPORT-BENCHMARK.md).

## Übergänge zwischen Wiedergabearten (0.69.0)

Der Player friert beim Wechsel zur anderen Wiedergabeart die sichtbare Ausgangspose ein und überblendet sie über 0,18 Animationssekunden in die fortlaufend berechnete Zielpose. Position und Skalierung werden linear, Rotationen per Quaternion-Slerp interpoliert; vorhandene Morph-Gewichte ebenfalls linear. Vor jedem Animationsschritt wird der unveränderte Zielzustand wiederhergestellt. So fließt die Zwischenpose nicht in die nächste Animationsberechnung zurück und verändert keine gespeicherten Posen.

Pause hält auch den Übergang an; Tempo skaliert seine Dauer. Wiederholter Wechsel übernimmt die sichtbare Zwischenpose als neue Ausgangspose. Zeitleistensprünge, Studioeintritt und Freigabe des Modells entfernen den Übergang. Studio-Vorschauen und Posenbearbeitung verwenden keine solche Überblendung.

Erste Stufe: unveränderte Knochen-Grundstellung ohne Knochenumbau, Gewichtsaufträge oder freie Oberflächenpunkte. Geänderte Hierarchien und Matrizen mit Scherung werden nicht überblendet. Solche Fälle behalten den bisherigen direkten Wechsel; es werden keine inkompatiblen Hautbindungen oder Geometrien interpoliert. Renderer-, große-Modell- und visuelle Hautabnahme bleiben offen.

Seit 0.69.1 wird das natürliche Ende eines einmaligen Originalclips als gehaltene Zielpose behandelt. Eine noch laufende Überblendung erreicht diese Endpose vollständig. Nur eine manuelle Pause hält ihre Zeit an. Ohne aktiven Grundclip läuft der Übergang zur wiederhergestellten Ruhepose ebenfalls zu Ende; ungültige Zeitwerte werden nicht fortgeschrieben.

Seit 0.69.2 läuft bei einem natürlich beendeten Originalclip eine noch aktive Mixer-Überblendung bis zum vollständigen Zielgewicht weiter. Die Clipzeit bleibt am Ende stehen. Springen auf der Zeitleiste entfernt den alten Mischpartner und dessen Fade-Gewicht, bevor die gewünschte Pose ausgewertet wird; ein manuell pausierter Transport bleibt pausiert.

## Oberflächenpunkte in Wiedergabeübergängen (0.70.0)

Freie Gesichtspunkte und andere Oberflächenpunkte sind für die Player-Überblendung zugelassen, solange Grundskelett und Gewichte unverändert sind. Die Übergangsschicht kopiert Positionen und Normalen nur für betroffene Meshes; ohne ausdrückliche Mesh-Zuordnung betrifft ein Punkt alle Studio-Oberflächen. Zwischenformen entstehen durch lineare Interpolation der lokalen Vertex-Positionen. Normalen, Bounding Box und Bounding Sphere werden für die Darstellung neu berechnet.

Vor dem nächsten Animationsschritt werden die exakten Zielpositionen, Normalen und Begrenzungen wiederhergestellt. Die Zwischengeometrie fließt nicht in die nächste Posenberechnung zurück. Bei Abbruch wird ebenfalls die Zielgeometrie wiederhergestellt; bei erneutem Wechsel ist die sichtbare Zwischenform der neue Ausgangspunkt. Ausgetauschte Geometrie, Positions-/Normalenattribute oder Indexpuffer werden nicht überschrieben. Knochen-/Gewichtsumbauten und Schertransformationen bleiben ausgeschlossen.

Der zusätzliche Speicherbedarf hängt von der Vertexzahl der betroffenen Meshes ab. Geometriekopien, Normalen- und Begrenzungsberechnung fallen nur während solcher Übergänge an. Keine pauschale Echtzeit- oder Speicherzusage für große Modelle; visuelle Hautabnahme bleibt offen.

## Laufzeit der Oberflächenüberblendung (0.71.0)

Zielpuffer für Positionen und Normalen werden pro betroffenem Mesh innerhalb eines Übergangs wiederverwendet. Die eingefrorene Ausgangsgeometrie besitzt weiterhin unabhängige Kopien. Vor erneutem Befüllen wird der bisherige Zielzustand wiederhergestellt; Abschluss, Abbruch und inkompatible Zielgeometrie geben die Puffer frei. Nicht normalisierte zusammenhängende Float32-Attribute mit drei Komponenten verwenden direkte Pufferkopien; andere Layouts behalten den allgemeinen Attributzugriff.

Der CPU-Benchmark trennt diese Darstellungskosten von Modellladen, Animator/IK, Benutzeroberfläche und WebGL. Die lokale Mika-Messung zeigt eine Laufzeitverbesserung bei identischen Positionen-/Normalen-Prüfsummen. Speicher-Momentaufnahmen sind keine Spitzenwerte; die beiden festgehaltenen Geometriezustände werden weiterhin benötigt. [Messvertrag](TRANSITION-BENCHMARK.md).

### Eigene Modelle im CPU-Überblendungsbenchmark (0.71.1)

`benchmark:transitions -- --model datei.glb --runs 3` misst eigene eigenständige Geometrie ohne Bildtexturen. Dateigröße ist auf 50 MiB begrenzt; Modellprüfsummen sichern identische Eingaben über alle getrennten Prozesse. Der Lauf importiert keine Studio-Bearbeitungen und ersetzt keine gerenderte Qualitätsabnahme.

### Skalierte Eltern für neue Knochen (0.72.0)

Seit **0.72.0** können neue Knochen auch unter gleichmäßig, ungleichmäßig oder negativ skalierten Quellknochen platziert werden. Die Weltposition wird über die inverse Elternmatrix in die lokale Grundpose umgerechnet; die Skalierung der Quelle bleibt erhalten. Nicht invertierbare Elternmatrizen und lokale Koordinaten außerhalb ±100 werden ohne Änderung der Studio-Daten abgewiesen. Das gilt für neue Abzweigungen, nicht für das Umhängen oder Löschen skalierter Knochen. Anatomische IK-Qualität bleibt separat zu prüfen.

Seit **0.73.0** können skalierte Endknochen ohne Kinder oder Anbauteile gelöscht werden. Ihre Hautgewichte gehen an den Elternknochen; die Grundgeometrie bleibt erhalten. Gespeicherte Posen verlieren die Spur des entfernten Knochens und müssen auf veränderte Bewegung geprüft werden. Skalierte Zwischenknochen sowie Knochen mit Anbauteilen bleiben gesperrt.

Seit **0.74.0** ist Umhängen innerhalb eines gemeinsam skalierten Teilbaums möglich: Nur die beiden Äste unterhalb ihres nächsten gemeinsamen Vorfahren müssen unskaliert sein. Die gemeinsame Transformation entfällt bei der Umrechnung der Grundpose, gespeicherten Posen und des Entwurfs. Gemeinsame gleichmäßige, ungleichmäßige und negative Skalierungen sind unterstützt; nicht invertierbare gemeinsame Skalierungen werden abgewiesen. Unterschiedliche Skalierungen auf den betroffenen Ästen und Anbauteile mit eigenem Skelett bleiben ausgeschlossen.

Seit **0.75.0** können Knochen zwischen Ästen mit gleicher kumulierter positiver gleichmäßiger Skalierung umgehängt werden, etwa zwischen 4 × 0,5 und 2. Die Umrechnung berücksichtigt die tatsächlichen Quellskalierungen unterhalb des gemeinsamen Vorfahren. Bis 0.75.0 musste der verschobene Knochen selbst unskaliert bleiben; seit 0.76.0 bleibt seine eigene invertierbare Quellskalierung beim Umhängen erhalten. Ungleiche, nicht gleichmäßige oder negative Astskalierungen bleiben ausgeschlossen; die gemeinsame Vorfahrenskalierung darf wie seit 0.74.0 ungleichmäßig oder negativ sein. Vorhandene Posen und Hautqualität weiterhin visuell prüfen.

Seit **0.76.0** darf der umgehängte Knochen selbst gleichmäßig, ungleichmäßig oder negativ skaliert sein. Seine Quellskalierung bleibt unverändert; die Positions-/Drehungsumrechnung erfolgt ohne diese eigene Skalierung, damit Spiegelungen nicht in eine falsche Drehung umgewandelt werden. Nicht invertierbare Knochenskalierungen werden abgewiesen. Die Elternäste müssen weiterhin dieselbe positive gleichmäßige Gesamtskalierung besitzen. Gerenderte Haut- und Bewegungsqualität bleiben separat zu prüfen.

**CI-Abnahme 0.76.1:** Actions wieder verfügbar. Zwei mehrdeutige Model-Zoo-Testselektoren korrigiert; Vorgangsstatus und Listenwarnung besitzen eindeutige IDs. Vollständiger Prüfstatus: [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).
