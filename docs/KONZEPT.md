# PaKaChi-SM – Designdokument

Teil der [Blaupause](README.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

## Status und Begriffe

Dieses Dokument hält das Produktziel fest. Stand 0.5.0: Player, gemeinsame Agentensteuerung und ein erster Studio-Editor sind implementiert. [STUDIO.md](STUDIO.md) beschreibt die bedienbaren Funktionen und ihre Grenzen; vollständiger Quellknochenumbau und KI-Generierung bleiben Entwicklungsziele.

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

## 3. Genau zwei Bearbeitungsmodi

### Figur bewegen

Körperteile direkt mit der Maus greifen und in eine Pose ziehen. Gesichtsausdrücke und die Gesamtposition sollen ebenfalls bearbeitbar sein. Verständliche Griffpunkte ersetzen technische Knochenlisten und Zahlenfelder im normalen Arbeitsablauf.

Drehen der Ansicht und Bewegen der Figur müssen klar unterscheidbar sein. Räumliches Positionieren darf kein Wissen über 3D-Koordinaten voraussetzen.

### Gelenke bearbeiten

- Gelenk hinzufügen: gewünschte Stelle an der Figur auswählen.
- Gelenk verschieben: vorhandenen Punkt greifen und versetzen.
- Gelenk löschen: ausgewählten Punkt entfernen.

Beispiel: Fehlt das rechte Knie, fügt der Benutzer dort einen Gelenkpunkt hinzu und kann das Bein anschließend an dieser Stelle beugen.

**Erforderliche Hintergrundarbeit:** Der Editor muss die Skelettverbindungen, die räumliche Tiefe des Gelenks und die Zuordnung der Oberfläche zu den Gelenken bestimmen oder korrigieren. Ein sichtbarer Punkt allein macht das Modell noch nicht beweglich. Bei mehrdeutiger Zuordnung soll eine einfache visuelle Korrektur möglich sein.

### Präzision und frei gestaltbare Kontrollpunkte

- Freie Ansichtsdrehung um alle Achsen, einschließlich Rollen sowie Zugang zu Rückseite und Unterseite. Die Ansichtsdrehung verändert keine gespeicherten Gelenkkoordinaten.
- Mausrad-Zoom bis in kleine Gesichtsbereiche; Ansicht zum gewünschten Detail verschieben und bei Bedarf zurücksetzen.
- Gelenkpunkte frei im 3D-Raum beziehungsweise auf der sichtbaren Oberfläche setzen, auch ohne vorhandene Gelenkkette. Ansichtsdrehung und Tiefenkorrektur ermöglichen präzise Platzierung.
- Sichtbare Punktgröße pro Punkt anpassen: zum Beispiel klein am Mundwinkel, größer am Knie. Ein kleiner gezeichneter Punkt behält eine gut erreichbare Auswahlfläche.
- Punkte gezielt miteinander verbinden oder Verbindungen lösen. Neue Punkte müssen nicht automatisch an das vorhandene Körperskelett angeschlossen werden.
- Beliebige unabhängige Gruppen erlauben: zum Beispiel drei Mundpunkte, ein Punkt pro Auge oder mehrere Punkte pro Augenlid. Der Benutzer bestimmt den Detailgrad.
- Punktgröße, Auswahlfläche und Einfluss auf die Modelloberfläche sind getrennte Eigenschaften. Der Benutzer soll deren Wirkung direkt sehen und korrigieren können.

Ein Gesichtspunkt ist eine verständliche Oberflächensteuerung und muss intern nicht zwingend ein klassischer Skelettknochen sein. Knochen, Oberflächendeformationen und Gesichtsformen können dieselbe einfache Bedienung erhalten. Beliebige logische Verbindungen dürfen intern kein ungültiges oder zyklisches Skelett erzeugen. Die Umsetzung löst diesen Unterschied im Hintergrund.

Nach einer Skelettänderung müssen vorhandene Moves auf Kompatibilität geprüft werden. Eine automatische Anpassung ist nur zu übernehmen, wenn sie ein gültiges Ergebnis liefert; andernfalls wird die betroffene Bewegung zur Korrektur markiert.

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

Eine Bewegung enthält Zeitpunkte, Gelenktransformationen, gegebenenfalls Gesichtsparameter und die Gesamtposition. Sie benötigt keine Sammlung separat gezeichneter Einzelbilder. Die erste Umsetzung speichert Posen und Moves textbasiert in versionierten `.pakachi.json`-Projekten. Separate Move-Dateien und globale Transformationsspuren bleiben offen.

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

Zusätzlich gibt es `get_state`. Die konkrete Einrichtung und Einschränkungen stehen in [ANSTEUERUNG.md](ANSTEUERUNG.md).

MQTT ist opt-in: Schalter zum Aktivieren und ein Feld für die Broker-Adresse, etwa eines NanoMQ-Brokers. Der Player empfängt darüber Zustands- oder Bewegungsbefehle. Seit 0.4.0 kann der ausdrücklich eingerichtete Python-MCP-Prozess einen aMQTT-Broker einbetten; MCP-Anfragen und Bestätigungen laufen ebenfalls darüber. Alternativ wird ein vorhandener Broker verwendet. Die Browseroberfläche startet keinen Broker. Zugangsdaten werden nicht im Model Zoo gespeichert.

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

Die Komplexität gehört in die Software. Ein Benutzer soll eine eigene Figur erstellen, ein fehlendes Gelenk korrigieren und eine Bewegung speichern können, ohne Rigging, Skinning oder Keyframes lernen zu müssen.


Seit 0.5.0: Skelettbasierte Gelenk-/Verbindungserkennung, einzeln entfernbare Verbindungen, direktes Punktziehen, mittlere Maustaste für freie Ansichtsdrehung und lokal gespeicherte Sprach-/Inversionsoptionen. KI-Erkennung an ungeriggten Modellen bleibt offen. Details: [Studio](STUDIO.md).
