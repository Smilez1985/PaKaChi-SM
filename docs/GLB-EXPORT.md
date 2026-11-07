# GLB-Export

Stand 0.80.0. Alle Exporte entstehen lokal im Browser. Für weitere Studio-Bearbeitung das vollständige `.pakachi.json`-Projekt zusätzlich speichern.

| Schaltfläche | Inhalt |
| --- | --- |
| Figur als GLB (Standbild) | Aktuell sichtbare Form als statische Geometrie; ohne Rig oder Clips. |
| Figur als GLB (mit Rig) | Aktuelle Form mit bearbeitetem Hautskelett und Gewichten; ohne Clips. |
| Move als GLB (Animation) | Ausgewählter eigener Studio-Move mit genau einem Animationsclip, optionalem Rig und Oberflächen-Morphs. |

## Eine Bewegung exportieren

1. Studio öffnen und die gewünschte eigene Bewegung unter „Eigene Bewegungen“ auswählen.
2. Wiedergabe/Vorschau und aktive Bearbeitung beenden.
3. „Move als GLB (Animation)“ wählen. Dateiname: `<avatar>-<move>.glb`.
4. Die Datei in einem GLB-fähigen Programm öffnen und den Clip abspielen. Die gewünschte Schleifenwiedergabe dort einstellen; glTF speichert keine allgemeine Player-Loop-Einstellung.

Knochenpositionen/-drehungen und die Gesamtfigur mit Position, Drehung um ihren Mittelpunkt und Größe werden ausgegeben. Wiederholte Posen bleiben im zeitlichen Verlauf erhalten. Bei Studio-Schleifen wird der letzte Übergang zur ersten Pose mit ausgegeben.

Die Animation wird mit 30 Stützstellen pro Sekunde abgetastet. Jede Schlüsselpose und jede Segmentgrenze ist enthalten. Dazwischen interpoliert das Zielprogramm; insbesondere Drehung und Skalierung um einen versetzten Mittelpunkt sind zwischen Stützstellen angenähert. Dies ist keine Bildratenzusage für die Wiedergabe.

## Grenzen

Freie Oberflächen-/Gesichtspunkte werden als Morph-Ziele ausgegeben. Unterschiedliche Oberflächenposen werden je betroffenem Mesh zusammengefasst, wiederholte Posen teilen dasselbe Ziel. Positionsverformungen interpolieren zwischen den ursprünglichen Schlüsselzeiten wie im Studio; Normalen werden zwischen Zielposen angenähert interpoliert. Ein vorhandenes Skelett bleibt mit der Oberflächenbewegung kombiniert; ohne Skelett sind Morph- und Figurenanimation ebenfalls möglich.

Vorhandene Positions-/Normal-Morphs bleiben mit ihren konstanten Gewichten und Namen enthalten. Andere vorhandene Morph-Attribute werden bei zusätzlicher Oberflächenanimation ausdrücklich abgewiesen. Die ursprünglichen Studio-Kontrollpunkte sind keine GLB-Bearbeitungspunkte; dafür weiterhin das Studio-Projekt speichern.

Originalclips aus dem geladenen Modell werden nicht automatisch in die Animationsausgabe übernommen. Retargeting auf fremde Rigs ist nicht enthalten. Matrixscherung, Instanzen, ausgeblendete Materialgruppen und nicht exportierbare Knochenhierarchien werden abgewiesen. Standbild und Rig-Export besitzen eigene, in der Oberfläche benannte Grenzen.

Maximal 12.000 Zeitstützstellen und zwei Millionen skalare Kanalwerte. Für Oberflächenanimation zusätzlich höchstens 64 Morph-Ziele pro Mesh und 64 MiB Morph-Attributdaten über die Kopie; ein Arbeitsbudget begrenzt umfangreiche Punkt-/Vertex-/Normalenberechnungen vorab. Bei Überschreitung wird mit einer Meldung abgebrochen. Umfangreichere Sequenzen mit weniger unterschiedlichen Posen oder Punkten exportieren. Es erfolgt keine automatische Verringerung der Abtastrate. Texturen und Modellgeometrie bestimmen zusätzlich Dateigröße und Speicherbedarf.

Quelle, Posen und Undo-Stand werden nicht verändert. Wird das Studio während der Erstellung geändert, geschlossen oder die Wiedergabe gestartet, wird ein überholtes Ergebnis verworfen.
