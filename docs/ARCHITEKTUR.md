# Technischer Stand 0.4.0

## Lokale Anwendung

TypeScript und Three.js bilden den 3D-Player. Vite startet einen lokalen Entwicklungsserver und erstellt den Produktionsbuild. Es gibt noch keinen Desktop-Installer. Nach der Installation werden keine CDN-Dateien benötigt. Ein Browser mit WebGL2 ist für 3D notwendig; der bestehende Bildplayer benötigt kein WebGL.

## Model Zoo

`public/model-zoo/catalog.json` ist ein Katalog mit `schemaVersion: 1`. Jeder 3D-Eintrag hat eine ID, einen Namen, eine Beschreibung, den relativen Modellpfad, die Rig-Version und deklarierte Moves. Ein Move hat `id`, `name`, `clip` und `loop`. Optional verweist `defaultMove` auf eine Grundbewegung. Optional ordnet `states` Zustandsnamen vorhandenen Move-IDs zu. Nur deklarierte Clips, die tatsächlich im Modell enthalten sind, werden angeboten.

Modelle verwenden glTF 2.0 beziehungsweise GLB, ein rechtshändiges Koordinatensystem und Y nach oben. Die Vorschau normalisiert die Größe durch einen übergeordneten Knoten; sie verändert nicht die Animationsdaten oder die Skelettbindung. Der gemeinsame Katalog bleibt unverändert. Editierbare Projekte verwenden separat `format: pakachi-studio`, `version: 1` und enthalten Modellbytes als Base64, Avatar-Metadaten, Kontrollpunkte, Skelett-Grundtransformationen, Verbindungen, Arbeitspose, gespeicherte Posen und Moves. Das ist noch kein GLB-Export.

Mika und Nori werden durch `scripts/generate-avatars.mjs` reproduzierbar erzeugt. Beide besitzen ein tatsächliches Skin/Skelett und eingebettete Animationsclips. Die Testmodelle benötigen keine externen Texturen.

## Wiedergabe und Import

`src/playback.ts` kapselt Clip-Wiedergabe, Pause, Abspielposition, Tempo und Rückkehr zur Grundbewegung. `src/control.ts` prüft alle manuellen, MQTT- und MCP-Befehle anhand der geladenen Fähigkeiten. Einmalige Moves kehren zum aktiven Zustand zurück; neue Zustände unterbrechen sie. Übergänge zwischen 3D-Clips werden über 180 ms überblendet.

Ein GLB-Import bis 50 MB bleibt nur für die Browser-Sitzung erhalten. Externe Modellressourcen werden blockiert. Draco-/KTX2-komprimierte Importe benötigen zusätzliche Decoder und werden derzeit nicht unterstützt. Ein Modell ohne Clips bleibt als Standbild sichtbar.

`src/viewer.ts` verwaltet Kamera, Beleuchtung, Skelettanzeige und GPU-Ressourcen. ArcballControls erlauben freie Ansichtsdrehung um alle Achsen ohne Polwinkelbegrenzung, Rollen, Mausrad-Zoom zum Zeiger und Verschieben mit rechter Maustaste. Sechs feste Ansichten und Rolltasten ergänzen die Navigation. Im Studio wird der Sockel ausgeblendet, damit die Unterseite zugänglich ist. Modell- und Gelenkkoordinaten bleiben von der Ansichtsdrehung unabhängig. Der Editor ergänzt TransformControls und gut auswählbare Punktgriffe; Kamera und Editor teilen sich dieselbe Szene.

## Original-PaKaChi

Der wiederhergestellte Bildplayer ist in derselben Oberfläche eingebettet und beim Start ausgewählt. Beim Wechsel zu 3D wird sein Dokument entladen. Seine separate MQTT-Oberfläche wird beim Einbetten ausgeblendet; die gemeinsame Verbindung bleibt beim Avatarwechsel bestehen und adressiert den aktuell ausgewählten Avatar. Der Originalplayer samt 72 Bildern bleibt zusätzlich direkt unter `public/legacy/pakachi/index.html` nutzbar.

Die Hauptoberfläche verwendet seit 0.4.0 MQTT.js für direkten Status-Empfang und den bidirektionalen MCP-Kanal; das ursprüngliche MQTT-Modul bleibt unverändert im Originalplayer. `src/agent-panel.ts` bietet Zustandsauswahl und opt-in MQTT/MCP. `server/mcp.mjs` stellt über das offizielle MCP-SDK sechs stdio-Tools bereit; `server/bridge.mjs` verbindet sie nach Schlüssel- und Origin-Prüfung mit genau einem lokalen Player. `server/python/pakachi_mcp.py` ist der bevorzugte MCP-Server mit offiziellem SDK 2.3.0. Sein vom Host gestarteter Prozess enthält optional aMQTT 0.12.1, lokal gebunden und mit Schlüsselanmeldung. `src/mqtt-agent.ts` überträgt korrelierte Anfragen, Antworten und flüchtige Präsenzmeldungen. Der Browser startet keinen Broker; der eingebettete Broker läuft mit dem ausdrücklich eingerichteten MCP-Prozess. Ein externer Broker lässt sich alternativ konfigurieren. Details stehen in [ANSTEUERUNG.md](ANSTEUERUNG.md).

## Studio

`studio-data.ts` validiert Projektdateien und hält eine begrenzte Snapshot-Historie. `studio-rig.ts` bearbeitet Skelettgriffe und freie Oberflächenpunkte. Skelett-Drehpunktänderungen aktualisieren die Studio-Bindematrizen; beim Originalclip wird die originale Bindung wiederhergestellt. Freie Punkte wirken mit glattem radialem Abfall auf das Mesh vor der Hautverformung. Die sichtbaren Griffe folgen der Hautmatrix am nächsten Vertex. Punktgröße und Einflussradius bleiben getrennt.

`studio-view.ts` verbindet Raycasting, Mindest-Auswahlfläche und TransformControls. `studio-editor.ts` verwaltet genau zwei Bearbeitungsmodi, Posen, Interpolation, Projekt-Download und eigene Moves. Während der Bearbeitung pausieren Originalclips, externe Mutationen werden abgewiesen. Eigene Moves werden beim Laden des Projekts in die aktive Fähigkeitsliste aufgenommen und kehren einmalig zum Grundzustand zurück.

Der Editor unterstützt noch keinen beliebigen Quellknochenumbau, IK, automatische Gewichte, Bild-zu-3D oder GLB-Export. Ein gelöschter Skelettgriff entfernt nicht den Quellknochen. Beim Original-PaKaChi bleibt der Bildplayer aktiv, da sein 3D-Modell noch fehlt. Details: [Studio](STUDIO.md).
