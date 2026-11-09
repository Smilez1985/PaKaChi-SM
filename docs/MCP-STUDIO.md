# Studio über MCP bearbeiten

**Studio-Tools ab 0.9.0; Skalierung ab 0.10.0.** [Python-Einrichtung](PYTHON-MCP.md) · [Studio-Anleitung](STUDIO.md)

## Freigeben und beobachten

1. Einen 3D-Avatar oder ein Projekt laden und das Avatar-Studio öffnen.
2. MCP-Verbindung einrichten; beim Python-Weg MQTT und Python-MCP erlauben.
3. Im Studio **KI darf dieses Studio bearbeiten** aktivieren.
4. Änderungen beobachten; **Zurück/Wiederholen** gilt auch für Agentenaktionen.

Die Zusatzfreigabe startet ausgeschaltet und endet beim Verlassen oder Ersetzen des Studios. Sie wird nicht dauerhaft gespeichert. Lesende Abfragen benötigen keine zusätzliche Schreibfreigabe, wohl aber eine bestehende MCP-Kopplung. Kein Werkzeug schaltet die Freigabe selbst ein. Playerbefehle bleiben während der Studio-Bearbeitung blockiert.

## Lesen: `get_studio`

Argumente: `section` = `info` (Vorgabe), `points`, `poses` oder `moves`; optional `offset` ab 0 und `limit` von 1 bis 32. Wenn `nextOffset` nicht `null` ist, dort weiterlesen. Modellbytes und Dateiinhalte werden nicht übertragen.

Jede Antwort enthält `session`, `revision`, `open`, `editable`, `dirty`, `mode` (`pose`/`rig`), die Transformation von `figure`, Anzahl von Punkten/Posen/Moves/Teiloberflächen und die Verfügbarkeit von Undo/Redo. `points` enthält auch verbundene Punkt-IDs. Posen-/Move-Listen liefern Zusammenfassungen; `apply_pose` lädt eine Pose, danach zeigt eine Punkteabfrage ihre aktuelle Lage. Seit 0.11.0 nennt `ikChain` pro Punkt die beteiligten Vorfahren (nächster zuerst).

Positionen sind die normierten **Weltkoordinaten des Studios**, keine Pixel oder ursprünglichen GLB-Einheiten. Rotation ist eine normierte Quaternion `[x, y, z, w]`. `$figure` bezeichnet die gesamte Figur. `figure.scale` ist ihr Größenfaktor (1 = 100 %), unabhängig von Kamera-Zoom und sichtbarer Punktgröße. Der optionale `mesh`-Index bindet einen freien Punkt an eine Teiloberfläche; gültig sind 0 bis `counts.surfaces - 1`. Ohne Index wirkt der Punkt in seinem Radius über Teiloberflächen hinweg. Die API führt kein Oberflächen-Raycasting aus; der Agent muss die Position angeben.

## Schreiben: `edit_studio`

Das Werkzeug erhält ein Objekt `command`. **Jeder** Befehl benötigt `session`, `expectedRevision` und `action`. Sitzung/Revision stammen aus der letzten Abfrage oder erfolgreichen Änderung. Bei einem Konflikt neu abfragen; nach einem Timeout niemals blind wiederholen. Die Antwort enthält `accepted`, die neue `revision` und gegebenenfalls die neu erzeugte `id`.

| Aktion | Zusätzliche Felder | Voraussetzung |
| --- | --- | --- |
| `set_mode` | `mode`: `rig` oder `pose` | Keine Vorschau/Geste aktiv. |
| `add_point` | `position`; optional `name`, `mesh`, `size`, `radius` | `rig`; erzeugt freien Oberflächenpunkt. |
| `update_point` | `id`; mindestens eines von `name`, `position`, `rotation`, `scale`, `size`, `radius` | `scale` nur für `$figure` in `pose`. Rotation nur in `pose`, für Skelettgriffe oder `$figure`. |
| `delete_point` | `id` | `rig`; bei Quellknochen wird nur der Griff entfernt. |
| `connect_points` | `id`, `target` | `rig`; ergänzt die Verbindung, falls sie fehlt. |
| `disconnect_points` | `id`, `target` | `rig`; entfernt nur diese Verbindung, falls vorhanden. |
| `save_pose` | optional `name`, `seconds` | `pose`; nimmt die aktuelle Haltung auf. |
| `apply_pose` | Posen-`id` | `pose`; lädt die Haltung. |
| `replace_pose` | Posen-`id` | `pose`; übernimmt aktuelle Haltung und entfernt ihre Prüfhinweise. |
| `create_move` | `id`, `name`, `poses` (geordnete Posen-IDs); optional `loop` | `pose`; mindestens zwei Posenreferenzen, freies Schlagwort. |
| `undo` / `redo` | keine | Passender Bearbeitungsschritt vorhanden. |

Grenzen: Position je Achse −100 bis +100; Punktgröße 0,003 bis 0,15; Radius 0,005 bis 0,6; Posenzeit 0,1 bis 30 Sekunden; Namen bis 100 Zeichen. Projektgrenzen gelten unverändert. Bei `$figure` sind Position, Rotation und die proportionale `scale` von 0.1 bis 5 änderbar. Zusätzliche oder für die jeweilige Aktion unpassende Felder werden abgewiesen. JSON-Zahlen verwenden einen Dezimalpunkt.

## Beispiel: zwei Posen für eine Gesamtbewegung

Zuerst `get_studio` aufrufen. Im folgenden Beispiel sind `SESSION` und die Beispielrevision `0` **durch die tatsächlichen Werte zu ersetzen**:

```json
{
  "command": {
    "session": "SESSION",
    "expectedRevision": 0,
    "action": "set_mode",
    "mode": "pose"
  }
}
```

Danach jeweils die zurückgegebene Revision verwenden:

1. `save_pose` mit `name: "Start"`; zurückgegebene Posen-ID merken.
2. `update_point` mit `id: "$figure"` und einer neuen `position`, zum Beispiel `[0, 1.5, 0]`. Die Position bezeichnet den Mittelpunktgriff; als Ausgangspunkt `figure.position` aus der Abfrage verwenden.
3. `save_pose` mit `name: "Oben"`, `seconds: 1`; zweite ID merken.
4. `create_move` mit `id: "huepfen"`, `name: "Hüpfen"`, `poses: [START_ID, OBEN_ID]`, `loop: true`. Die Zeit der Startpose steuert den Rückweg.
5. Im Studio Vorschau prüfen, **Speichern** wählen und zum Player zurückkehren. Nun kann `play_move` das Schlagwort `huepfen` auslösen.

`save_pose` speichert im geöffneten Projekt. Kein Studio-Tool lädt Dateien herunter, importiert Modelle, ruft beliebige URLs auf oder führt Code aus. Für die dauerhafte Sicherung den Projekt-Download im Studio verwenden.

Beispiel für eine Größenänderung: `update_point` mit `id: "$figure"` und `scale: 1.5` vergrößert proportional auf 150 %. Position und Drehung bleiben dabei erhalten. Danach `save_pose` verwenden, um die Größe in einer Bewegung zu speichern.

## Positionsziele am Skelett ab 0.11.0

Bei `update_point` im Modus `pose` bedeutet `position` für einen Skelettpunkt ein IK-Ziel. Die verbundene Kette folgt durch Rotation; der tatsächlich erreichte Punkt kann bei begrenzter Reichweite abweichen. Danach `get_studio` lesen. `rotation` allein richtet den Punkt aus, ohne ihn zu verschieben; mit beiden Feldern folgt die Ausrichtung nach der Zielberechnung. Ein Wurzelpunkt verschiebt die ganze Figur. `connect_points` verbindet Knochen nur entlang tatsächlicher direkter Eltern-Kind-Kanten; freie Punkte bleiben untereinander gruppierbar. Ein Ziel ohne nutzbare Kette wird nicht aus dem Skelett herausgezogen.

## Beugegrenzen (ab 0.33.0)

`get_studio` mit section=points liefert konfigurierte `bendLimit`-Werte. Im Rig-Modus kann `update_point` an einem Knochen `bendLimit: {"min": 20, "max": 110}` setzen oder mit `bendLimit: null` entfernen. Endliche Gradwerte von 0 bis 175 und min ≤ max sind erforderlich. Die Grenze wird am mittleren Knochen einer Zweiglied-Kette ausgewertet, wenn deren Endpunkt gezogen wird. Direkte Drehung und gespeicherte Moves werden nicht begrenzt. Sitzung, Revision, Freigabe und Undo gelten unverändert. Python- und Node-MCP sowie der integrierte Assistent transportieren das Feld; die vollständige Semantik prüft der Studio-Router.


## Bestehende Sequenzen (ab 0.38.0)

1. `get_studio` mit `section: "moves"` aufrufen. Die Einträge enthalten jetzt `poses`, eine geordnete Liste von Posen-IDs. Für weitere Seiten `nextOffset` als `offset` verwenden, bis es `null` ist.
2. Bei Bedarf `section: "poses"` lesen, um Namen und Dauern zuzuordnen.
3. Im Posenmodus und nach Studio-Freigabe mit der zuletzt gelesenen Sitzung und Revision ändern:

```json
{"command":{"session":"SITZUNG_AUS_GET_STUDIO","expectedRevision":12,"action":"update_move","id":"wave","poses":["pose-b","pose-a","pose-b"]}}
```

Die Beispiel-IDs und Revision durch tatsächliche Werte ersetzen. `poses` ist die vollständige neue Folge, kein Patch. Erlaubt sind 2–100 bestehende Posenverweise; Wiederholungen sind möglich. Name und Schleifenflag werden durch diesen Befehl nicht geändert. Jede tatsächliche Änderung ist mit `undo`/`redo` rückgängig beziehungsweise wiederherstellbar. Eine identische Folge ist ohne neue Revision erfolgreich.

Bei Revisionskonflikten erneut lesen und den Vorschlag neu bewerten. Während Wiedergabe, Ziehgesten und im Rig-Modus ist die Änderung gesperrt. Node- und Python-MCP deklarieren den Befehl; die verbindliche Prüfung erfolgt im Editor. Der integrierte Assistent schlägt ihn nach dem Lesen zur ausdrücklichen Bestätigung vor.


## Gemeinsame Sequenzänderungen (ab 0.40.0)

Nach `get_studio(section: "moves")` kann ein Paket mehrere vorhandene Moves gemeinsam ändern:

```json
{"command":{"session":"SITZUNG_AUS_GET_STUDIO","expectedRevision":12,"action":"update_moves","updates":[{"id":"wave","poses":["pose-b","pose-a"]},{"id":"nod","poses":["pose-a","pose-b","pose-a"]}]}}
```

Beispielwerte durch aktuelle Sitzung, Revision und vorhandene IDs ersetzen. Erlaubt sind 1–8 verschiedene Move-IDs, je 2–100 Posenverweise und insgesamt höchstens 200 Verweise. Jeder Eintrag ersetzt die vollständige Folge seines Moves. Wiederholte Posen sind erlaubt; doppelte Move-IDs und zusätzliche Felder sind ungültig.

Alle Einträge werden vor der ersten Änderung geprüft. Ein Fehler verwirft das gesamte Paket. Eine tatsächliche Änderung erhöht die Revision einmal; `undo`/`redo` betrifft das ganze Paket. Identische Folgen verändern Revision und Verlauf nicht. Namen, Schleifenflag und Posenwerte bleiben erhalten. Studio-Freigabe, aktuelle Revision und Posenmodus sind erforderlich; während Wiedergabe oder Ziehen wird abgewiesen.

Node- und Python-MCP deklarieren das Paket; der Editor prüft zusätzlich Existenz, Gesamtumfang und Zustand. Der integrierte Assistent liefert es als vollständigen Vorschlag zur einmaligen ausdrücklichen Bestätigung. Andere Aktionen lassen sich noch nicht zu Transaktionen kombinieren.

## Gemessenen Hautkorrekturvorschlag übernehmen (0.92.0)

`get_studio` liefert einen im Studio berechneten aktuellen Vorschlag unter `automaticSkinCorrection`. Dessen `command` kann mit `edit_studio` übernommen werden: `action=apply_skin_correction`, `id` des vorhandenen Vorschlags und aktuelle Sitzung/Revision. KI-Schreibfreigabe und Posenmodus sind erforderlich. Eine erfundene, veraltete oder bereits verwendete ID wird abgewiesen; die tatsächliche Änderung ist ein Undo-Schritt. Die Befehlsform ist in Node- und Python-MCP-Schemata enthalten. Der neue Suchaufruf `propose_studio_skin_correction` selbst ist noch nicht als externes MCP-Werkzeug registriert; hierfür den integrierten Assistenten oder die lokale Browser-API verwenden. Keine zusätzliche externe Host-/Caddy-Abnahme behauptet.
