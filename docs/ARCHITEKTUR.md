# Technischer Stand 0.2.0

## Lokale Anwendung

TypeScript und Three.js bilden den 3D-Player. Vite startet einen lokalen Entwicklungsserver und erstellt den Produktionsbuild. Es gibt noch keinen Desktop-Installer. Nach der Installation werden keine CDN-Dateien benötigt. Ein Browser mit WebGL2 ist für 3D notwendig; der bestehende Bildplayer benötigt kein WebGL.

## Model Zoo

`public/model-zoo/catalog.json` ist ein Katalog mit `schemaVersion: 1`. Jeder 3D-Eintrag hat eine ID, einen Namen, eine Beschreibung, den relativen Modellpfad, die Rig-Version und deklarierte Moves. Ein Move hat `id`, `name`, `clip` und `loop`. Optional verweist `defaultMove` auf eine Grundbewegung. Optional ordnet `states` Zustandsnamen vorhandenen Move-IDs zu. Nur deklarierte Clips, die tatsächlich im Modell enthalten sind, werden angeboten.

Modelle verwenden glTF 2.0 beziehungsweise GLB, ein rechtshändiges Koordinatensystem und Y nach oben. Die Vorschau normalisiert die Größe durch einen übergeordneten Knoten; sie verändert nicht die Animationsdaten oder die Skelettbindung. Das Katalogformat umfasst noch keine editierbaren Studio-Projekte oder separaten Move-Dateien. Deren Format entsteht mit dem Bewegungseditor.

Mika und Nori werden durch `scripts/generate-avatars.mjs` reproduzierbar erzeugt. Beide besitzen ein tatsächliches Skin/Skelett und eingebettete Animationsclips. Die Testmodelle benötigen keine externen Texturen.

## Wiedergabe und Import

`src/playback.ts` kapselt Clip-Wiedergabe, Pause, Abspielposition, Tempo und Rückkehr zur Grundbewegung. `src/control.ts` prüft alle manuellen, MQTT- und MCP-Befehle anhand der geladenen Fähigkeiten. Einmalige Moves kehren zum aktiven Zustand zurück; neue Zustände unterbrechen sie. Übergänge zwischen 3D-Clips werden über 180 ms überblendet.

Ein GLB-Import bis 50 MB bleibt nur für die Browser-Sitzung erhalten. Externe Modellressourcen werden blockiert. Draco-/KTX2-komprimierte Importe benötigen zusätzliche Decoder und werden derzeit nicht unterstützt. Ein Modell ohne Clips bleibt als Standbild sichtbar.

`src/viewer.ts` verwaltet Kamera, Beleuchtung, Skelettanzeige und GPU-Ressourcen. Mausrad-Zoom zum Zeiger, Drehen mit linker Maustaste und Verschieben mit rechter Maustaste erlauben die Detailansicht. Gelenkpunkte sind noch nicht editierbar.

## Original-PaKaChi

Der wiederhergestellte Bildplayer ist in derselben Oberfläche eingebettet und beim Start ausgewählt. Beim Wechsel zu 3D wird sein Dokument entladen. Seine separate MQTT-Oberfläche wird beim Einbetten ausgeblendet; die gemeinsame Verbindung bleibt beim Avatarwechsel bestehen und adressiert den aktuell ausgewählten Avatar. Der Originalplayer samt 72 Bildern bleibt zusätzlich direkt unter `public/legacy/pakachi/index.html` nutzbar.

Das unveränderte vorhandene MQTT-Modul wird auch in der Hauptoberfläche verwendet. `src/agent-panel.ts` bietet Zustandsauswahl und opt-in MQTT/MCP. `server/mcp.mjs` stellt über das offizielle MCP-SDK sechs stdio-Tools bereit; `server/bridge.mjs` verbindet sie nach Schlüssel- und Origin-Prüfung mit genau einem lokalen Player. Es werden keine Broker automatisch gestartet. Details stehen in [ANSTEUERUNG.md](ANSTEUERUNG.md).

## Studio

Die Studio-Ansicht ist integriert. Für 3D-Modelle sind Ansicht, Nahzoom und Skelettanzeige verfügbar. Gelenke bearbeiten, freie Gesichtspunkte, Posen speichern, KI-Generierung und Qualitätsoptimierung sind noch offen. Beim Original-PaKaChi wird weiterhin sein vorhandener Player gezeigt, da kein 3D-Skelett vorliegt.
