# Prüfstand und Abnahme

**Softwarestand: 0.6.0 · Dokumentationsabgleich: 13.10.2026.**

## Nachgewiesen

| Prüfung | Letzter Nachweis | Umfang und Grenze |
| --- | --- | --- |
| `npm test` | 0.6.0: 30 Tests bestanden | Player, Router, Studio-Daten, reale Three.js-Geometrie, DOM/Ereignisse mit happy-dom, Node-MCP und Erhaltungsprüfung. Kein gerenderter Browser. |
| `npm run test:legacy` | 0.6.0: beide Programme bestanden | Originalplayer-Steuerung, MQTT-Verhalten und Lebenszyklus. |
| `npm run build` | 0.6.0: bestanden | TypeScript und Produktionsbuild; Vite meldet weiterhin das große gemeinsame JS-Bundle (rund 1,12 MB / 303 kB gzip). |
| `npm run test:python` mit `PAKACHI_PYTHON` | 0.4.0: Integration bestanden | Echter Python-MCP-Prozess, eingebetteter aMQTT-Broker, produktiver MQTT-Client und Router. Seitdem in 0.5.0/0.6.0 nicht erneut ausgeführt; Python-Code unverändert. |
| Originaldateien | 0.6.0: bytegenau erhalten | 83 wiederhergestellte Dateien einschließlich exakt 72 Transformationsbildern. |

Die anschließende Dokumentationspflege ändert keine Programmfunktionen und zählt nicht als neuer Lauf dieser Prüfungen.

## Noch nicht abgenommen

- Gerenderte WebGL-Ansicht und tatsächliches Mausgefühl: Chromium konnte in der bisherigen Ausführungsumgebung nicht starten. Die DOM-/Geometrietests ersetzen diese Prüfung nicht.
- Vollständiger Ablauf in einem konkreten externen KI-/MCP-Host sowie Anbindung eines externen NanoMQ-Brokers.
- Gesamter Bedienablauf mit Nutzern ohne 3D-Vorkenntnisse und die Verträglichkeit unterschiedlich aufgebauter Importmodelle.
- KI-Generierung, vollständiger Knochenumbau und Optimierung sind noch nicht implementiert und besitzen daher keine Funktionsabnahme.

## Visuelle Abnahme durchführen

1. Original-PaKaChi öffnen und beide Formen sowie die Transformation prüfen.
2. Mika/Nori und eine eigene GLB öffnen; Kamera mit gedrücktem Mausrad drehen, auch zur Rück-/Unterseite, rechts verschieben und per Mausrad bis ins Gesicht zoomen. Inversion in den Optionen prüfen.
3. Gesichtspunkte setzen, verkleinern, direkt ziehen, verbinden und eine einzelne Verbindung entfernen; Zurück/Wiederholen prüfen.
4. Vorhandene Skelettgriffe/Verbindungen erneut erkennen; bei einem Modell ohne Skelett den zutreffenden Hinweis prüfen.
5. Gelenkpose und Gesamtverschiebung aufnehmen, Move abspielen, Projekt speichern und neu laden. Auch ein knochenloses Modell verwenden.
6. Deutsch/English umschalten und kontrollieren, dass eigene Namen erhalten bleiben.
7. Im Player einen eigenen Move über den eingerichteten Agenten auslösen; im Studio muss derselbe Steuerbefehl abgewiesen werden.

Diese Liste beschreibt ausstehende Prüfungen, keine bereits erzielten Ergebnisse.

## Historische Berichte

[0.1.0](PRUEFUNG-0.1.0.md) · [0.2.0](PRUEFUNG-0.2.0.md) · [0.3.0](PRUEFUNG-0.3.0.md) · [0.4.0](PRUEFUNG-0.4.0.md) · [0.5.0](PRUEFUNG-0.5.0.md) · [0.6.0](PRUEFUNG-0.6.0.md)
