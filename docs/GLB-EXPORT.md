# GLB-Export

Stand 0.79.0. Alle Exporte entstehen lokal im Browser. Für weitere Studio-Bearbeitung das vollständige `.pakachi.json`-Projekt zusätzlich speichern.

| Schaltfläche | Inhalt |
| --- | --- |
| Figur als GLB (Standbild) | Aktuell sichtbare Form als statische Geometrie; ohne Rig oder Clips. |
| Figur als GLB (mit Rig) | Aktuelle Form mit bearbeitetem Hautskelett und Gewichten; ohne Clips. |
| Move als GLB (mit Rig) | Ausgewählter eigener Studio-Move mit Rig und genau einem Animationsclip. |

## Eine Bewegung exportieren

1. Studio öffnen und die gewünschte eigene Bewegung unter „Eigene Bewegungen“ auswählen.
2. Wiedergabe/Vorschau und aktive Bearbeitung beenden.
3. „Move als GLB (mit Rig)“ wählen. Dateiname: `<avatar>-<move>.glb`.
4. Die Datei in einem GLB-fähigen Programm öffnen und den Clip abspielen. Die gewünschte Schleifenwiedergabe dort einstellen; glTF speichert keine allgemeine Player-Loop-Einstellung.

Knochenpositionen/-drehungen und die Gesamtfigur mit Position, Drehung um ihren Mittelpunkt und Größe werden ausgegeben. Wiederholte Posen bleiben im zeitlichen Verlauf erhalten. Bei Studio-Schleifen wird der letzte Übergang zur ersten Pose mit ausgegeben.

Die Animation wird mit 30 Stützstellen pro Sekunde abgetastet. Jede Schlüsselpose und jede Segmentgrenze ist enthalten. Dazwischen interpoliert das Zielprogramm; insbesondere Drehung und Skalierung um einen versetzten Mittelpunkt sind zwischen Stützstellen angenähert. Dies ist keine Bildratenzusage für die Wiedergabe.

## Grenzen

Bewegte freie Oberflächen-/Gesichtspunkte werden im Animations-GLB noch nicht ausgegeben. Der Export bricht dann mit einer Meldung ab; die vorhandene Move-Datei und das Studio-Projekt erhalten diese Daten weiterhin. Für eine einzelne aktuelle Gesichtsform kann der Standbild- oder Rig-Export verwendet werden.

Originalclips aus dem geladenen Modell werden nicht automatisch in die Animationsausgabe übernommen. Retargeting auf fremde Rigs ist nicht enthalten. Matrixscherung, Instanzen, ausgeblendete Materialgruppen und nicht exportierbare Knochenhierarchien werden abgewiesen. Standbild und Rig-Export besitzen eigene, in der Oberfläche benannte Grenzen.

Maximal 12.000 Zeitstützstellen und zwei Millionen skalare Kanalwerte; umfangreichere Sequenzen mit einer kürzeren Auswahl exportieren. Es erfolgt keine automatische Verringerung der Abtastrate. Texturen und Modellgeometrie bestimmen zusätzlich Dateigröße und Speicherbedarf.

Quelle, Posen und Undo-Stand werden nicht verändert. Wird das Studio während der Erstellung geändert, geschlossen oder die Wiedergabe gestartet, wird ein überholtes Ergebnis verworfen.
