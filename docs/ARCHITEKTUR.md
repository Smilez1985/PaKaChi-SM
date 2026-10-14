# Technischer Stand 0.10.0

## Lokale Anwendung

TypeScript und Three.js bilden den 3D-Player. Vite startet einen lokalen Entwicklungsserver und erstellt den Produktionsbuild. Es gibt noch keinen Desktop-Installer. Nach der Installation werden keine CDN-Dateien benötigt. Ein Browser mit WebGL2 ist für 3D notwendig; der bestehende Bildplayer benötigt kein WebGL.

## Model Zoo

`public/model-zoo/catalog.json` ist ein Katalog mit `schemaVersion: 1`. Jeder 3D-Eintrag hat eine ID, einen Namen, eine Beschreibung, den relativen Modellpfad, die Rig-Version und deklarierte Moves. Ein Move hat `id`, `name`, `clip` und `loop`. Optional verweist `defaultMove` auf eine Grundbewegung. Optional ordnet `states` Zustandsnamen vorhandenen Move-IDs zu. Nur deklarierte Clips, die tatsächlich im Modell enthalten sind, werden angeboten.

Modelle verwenden glTF 2.0 beziehungsweise GLB, ein rechtshändiges Koordinatensystem und Y nach oben. Die Vorschau normalisiert die Größe durch einen übergeordneten Knoten; sie verändert nicht die Animationsdaten oder die Skelettbindung. Der gemeinsame Katalog bleibt unverändert. Editierbare Projekte verwenden separat `format: pakachi-studio`, `version: 1` und enthalten Modellbytes als Base64, Avatar-Metadaten, Kontrollpunkte, Skelett-Grundtransformationen, Verbindungen, Arbeitspose, gespeicherte Posen und Moves. Das ist noch kein GLB-Export.

Mika und Nori werden durch `scripts/generate-avatars.mjs` reproduzierbar erzeugt. Beide besitzen ein tatsächliches Skin/Skelett und eingebettete Animationsclips. Die Testmodelle benötigen keine externen Texturen.

## Wiedergabe und Import

`src/playback.ts` kapselt Clip-Wiedergabe, Pause, Abspielposition, Tempo und Rückkehr zur Grundbewegung. `src/control.ts` prüft alle manuellen, MQTT- und MCP-Befehle anhand der geladenen Fähigkeiten. Einmalige Moves kehren zum aktiven Zustand zurück; neue Zustände unterbrechen sie. Übergänge zwischen 3D-Clips werden über 180 ms überblendet.

Ein GLB-Import bis 50 MiB bleibt nur für die Browser-Sitzung erhalten. Externe Modellressourcen werden blockiert. Draco-/KTX2-komprimierte Importe benötigen zusätzliche Decoder und werden derzeit nicht unterstützt. Ein Modell ohne Clips bleibt als Standbild sichtbar.

`src/viewer.ts` verwaltet Kamera, Beleuchtung, Skelettanzeige und GPU-Ressourcen. `mouse-navigation.ts` übernimmt die Drehung mit gedrückter mittlerer Maustaste über eine virtuelle Kugel, einschließlich Rollen und optionaler Inversion. ArcballControls übernehmen Mausrad-Zoom zum Zeiger und Verschieben mit rechter Maustaste. Im Studio ist linkes Kameradrehen abgeschaltet, damit Punkte direkt gezogen werden können. Sechs feste Ansichten und Rolltasten ergänzen die Navigation. Im Studio wird der Sockel ausgeblendet, damit die Unterseite zugänglich ist. Modell- und Gelenkkoordinaten bleiben von der Ansichtsdrehung unabhängig. Der Editor ergänzt TransformControls und gut auswählbare Punktgriffe; Kamera und Editor teilen sich dieselbe Szene.

## Original-PaKaChi

Der wiederhergestellte Bildplayer ist in derselben Oberfläche eingebettet und beim Start ausgewählt. Beim Wechsel zu 3D wird sein Dokument entladen. Seine separate MQTT-Oberfläche wird beim Einbetten ausgeblendet; die gemeinsame Verbindung bleibt beim Avatarwechsel bestehen und adressiert den aktuell ausgewählten Avatar. Der Originalplayer samt 72 Bildern bleibt zusätzlich direkt unter `public/legacy/pakachi/index.html` nutzbar.

Die Hauptoberfläche verwendet seit 0.4.0 MQTT.js für direkten Status-Empfang und den bidirektionalen MCP-Kanal; das ursprüngliche MQTT-Modul bleibt unverändert im Originalplayer. `src/agent-panel.ts` bietet Zustandsauswahl und opt-in MQTT/MCP. `server/mcp.mjs` stellt über das offizielle MCP-SDK acht stdio-Tools bereit; `server/bridge.mjs` verbindet sie nach Schlüssel- und Origin-Prüfung mit genau einem lokalen Player. `server/python/pakachi_mcp.py` ist der bevorzugte MCP-Server mit offiziellem SDK 2.3.0. Sein vom Host gestarteter Prozess enthält optional aMQTT 0.12.1, lokal gebunden und mit Schlüsselanmeldung. `src/mqtt-agent.ts` überträgt korrelierte Anfragen, Antworten und flüchtige Präsenzmeldungen. Der Browser startet keinen Broker; der eingebettete Broker läuft mit dem ausdrücklich eingerichteten MCP-Prozess. Ein externer Broker lässt sich alternativ konfigurieren. Details stehen in [ANSTEUERUNG.md](ANSTEUERUNG.md).

## Studio

`studio-data.ts` validiert Projektdateien und hält eine begrenzte Snapshot-Historie. `studio-rig.ts` bearbeitet Skelettgriffe und freie Oberflächenpunkte. Skelett-Drehpunktänderungen aktualisieren die Studio-Bindematrizen; beim Originalclip wird die originale Bindung wiederhergestellt. Freie Punkte wirken mit glattem radialem Abfall auf das Mesh vor der Hautverformung. Die sichtbaren Griffe folgen der Hautmatrix am nächsten Vertex. Punktgröße und Einflussradius bleiben getrennt.

`studio-view.ts` verbindet Raycasting, Mindest-Auswahlfläche und TransformControls. `studio-editor.ts` verwaltet genau zwei Bearbeitungsmodi, Posen, Interpolation, Projekt-Download und eigene Moves. Während der Bearbeitung pausieren Originalclips, externe Mutationen werden abgewiesen. Eigene Moves werden beim Laden des Projekts in die aktive Fähigkeitsliste aufgenommen und kehren einmalig zum Grundzustand zurück.

Der Editor unterstützt noch keinen beliebigen Quellknochenumbau, IK, automatische Gewichte, Bild-zu-3D oder GLB-Export. Ein gelöschter Skelettgriff entfernt nicht den Quellknochen. Beim Original-PaKaChi bleibt der Bildplayer aktiv, da sein 3D-Modell noch fehlt. Details: [Studio](STUDIO.md).

`studio-detection.ts` liest vorhandene Knochen und ihre Eltern-Kind-Beziehungen. Eigene Punkte bleiben erhalten; Verbindungen sind ungerichtete Bearbeitungsgruppen, kein automatisch neu erzeugtes Skelett. `options.ts` speichert Sprache und invertierte Drehrichtung lokal und übersetzt die Studio-Bedienelemente. Benutzerdefinierte Namen werden nicht übersetzt; Projektdateien und Broker-Zugangsdaten werden darüber nicht gespeichert.

## Gesamtposition ab 0.6.0

Der reservierte Posenkanal `$figure` speichert die Verschiebung in normierten Weltkoordinaten; er ist unabhängig von den maximal 256 Kontrollpunkten. `StudioRig` rechnet die Verschiebung über die Elternmatrix in die lokalen Root-Koordinaten um. Die Hautbindung wird vor Geometrie- und Griffabfragen aktualisiert. Oberflächenpunkte ohne Mesh-Zuordnung folgen ebenfalls der Gesamtverschiebung.

Der optionale Kanal ergänzt das Projektformat 1. Ältere Dateien ohne Kanal bleiben lesbar und verwenden `[0, 0, 0]`. Dateien mit dem neuen Kanal benötigen PaKaChi-SM ab 0.6.0; ältere Player lehnen sie ab. Seit 0.8.0 enthält die Rotation im Gesamtkanal eine normierte Quaternion; ältere Software akzeptiert hier nur die Einheitsquaternion. Ungültige oder unvollständige Werte werden beim Import abgewiesen. Originalclips setzen die Studio-Gesamtverschiebung zurück.

## Änderungsprüfung ab 0.7.0

`studio-review.ts` vergleicht den Rig-Zustand vor und nach einer Editoränderung. Ein Vergleich pro abgeschlossenem Ziehvorgang hält Undo/Redo und die Prüfung zusammen. `Pose.review` ist eine optionale, deduplizierte Liste validierter Gründe: `bone-rest`, `surface-rest`, `surface-radius`, `point-removed`. Namen und Gruppierungsverbindungen verändern keine gespeicherten Transformationen und werden ausgenommen. Skelett-Grundänderungen werden konservativ für alle Posen gemeldet.

Betroffene Moves werden aus ihren referenzierten Posen abgeleitet. Die aktiven Fähigkeiten enthalten für Studio-Moves `needsReview` und `reviewPoseIds`; MQTT/MCP-Antworten reichen diese Felder wie die übrigen Move-Daten weiter. Die Prüfung verändert keine gespeicherten Bewegungswerte und sperrt keine Wiedergabe. Hinweise werden beim expliziten Bestätigen oder Ersetzen der Pose entfernt; ältere Dateien ohne Hinweise bleiben gültig. Ein fehlender Hinweis bescheinigt keine anatomische Richtigkeit.

## Gesamtdrehung ab 0.8.0

Der `$figure`-Kanal kombiniert Weltverschiebung und Gesamtdrehung um den beim Laden ermittelten Modellmittelpunkt. Die gewünschte Welttransformation wird über die inverse Elternmatrix auf die ursprüngliche Root-Matrix angewendet. Während eigener Posen bleibt die exakte Root-Matrix aktiv; so geht auch bei ungleichmäßig skalierten Eltern keine Scherkomponente durch Zerlegung verloren. Rückkehr zur Grundpose beziehungsweise zu Originalclips stellt die ursprüngliche Root-Matrix und `matrixAutoUpdate` wieder her.

Die Rotationsinterpolation verwendet Quaternion-Slerp entlang des kürzeren Wegs. Für volle oder mehrfache Umdrehungen sind Zwischenposen mit weniger als 180 Grad Abstand nötig; eine gesonderte Umdrehungsanzahl wird nicht gespeichert. Die Gesamtbewegung ändert keine Skelett-Grundwerte und erzeugt daher keine Rig-Prüfhinweise.

## Studio-RPC ab 0.9.0

`get_studio` liefert JSON-Metadaten ohne Modellbytes. Listen sind auf maximal 32 Elemente und etwa 40 kB Nutzdaten pro Seite begrenzt, damit die Rückantwort unter dem 64-KiB-Limit beider Brücken bleibt. `nextOffset` setzt die Abfrage fort. Punkte enthalten Weltposition, Quaternion, Grundposition, Größe, Radius und Verbindungs-IDs; Posen und Moves werden als Zusammenfassungen geliefert.

`edit_studio` verwendet `studio-command.ts` zur strikten Validierung der pro Aktion erlaubten Felder. Editorseitige Vorbedingungen prüfen Existenz, Modus, Limits, zusätzliche Freigabe, Studiositzung und monotone Revision. Während Gesten/Vorschauen wird nicht geschrieben. Manuelle oder externe Datenänderungen erhöhen die Revision; wiederholte veraltete Befehle werden abgewiesen. Normale Undo-Snapshots und Posen-Prüfhinweise werden auch für externe Änderungen benutzt. Die Freigabe gehört nur zur geladenen Editorsitzung und kann nicht per RPC eingeschaltet werden.

Python und Node stellen dieselben acht Tools bereit. Der MQTT-Anfragekanal erlaubt die beiden Studio-Methoden ausdrücklich; das direkte Status-Topic bleibt auf Zustands-/Move-Befehle begrenzt. `save_pose` speichert im aktuellen Projekt, nicht auf der Festplatte. Es gibt keine Datei-, URL-, Codeausführungs- oder Importoperation über diese Werkzeuge.

## Gleichmäßige Gesamtskalierung ab 0.10.0

`$figure.scale` ist ein optionaler endlicher Faktor von 0.1 bis 5; fehlende Werte werden als 1 gelesen. Nur der Gesamtkanal darf dieses Feld enthalten, weder Punkttransformationen noch `boneRest`. Die Matrix wird als `T(center + offset) * R * S * T(-center)` auf die ursprüngliche Root-Weltmatrix angewendet. Die bestehenden exakten Eltern-/Hautmatrizen bleiben erhalten. `sample` interpoliert den Faktor linear, auch zum Schleifenanfang; Reset und Originalclips setzen ihn auf 1 zurück.

Der Mausregler nutzt eine gemeinsame Gestenaufnahme für Vorschau, Undo und Revisionsschutz. Der Agent liest `figure.scale` und schreibt über `update_point` mit `id: "$figure"`, ausschließlich im Pose-Modus. Beide MCP-Schemas und die Browserprüfung begrenzen den Wert. Projektformat 1 bleibt bestehen; ältere Software ignoriert das Zusatzfeld und kann die Größenbewegung nicht wiedergeben.
