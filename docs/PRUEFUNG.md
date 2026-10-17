# Prüfstand und Abnahme

**Softwarestand: 0.20.0 · Dokumentationsabgleich: 17.10.2026.**

## Nachgewiesen

| Prüfung | Letzter Nachweis | Umfang und Grenze |
| --- | --- | --- |
| `npm test` | 0.20.0: 113 Tests bestanden | Player, Router, Studio-Daten, reale Three.js-Geometrie, DOM/Ereignisse mit happy-dom, Node-MCP und Erhaltungsprüfung. Kein gerenderter Browser. |
| `npm run test:legacy` | 0.9.0: beide Programme bestanden | Originalplayer-Steuerung, MQTT-Verhalten und Lebenszyklus. |
| `npm run build` | 0.20.0: bestanden | TypeScript und Produktionsbuild; Vite meldet weiterhin das große gemeinsame JS-Bundle (rund 1,26 MB / 345 kB gzip). |
| `npm run test:python` mit `PAKACHI_PYTHON` | 0.10.0: Integration bestanden | Echter Python-MCP-Prozess, eingebetteter aMQTT-Broker, produktiver MQTT-Client, Router und Studio-Editor. Acht Tools, Studio-Änderungen einschließlich gültiger/ungültiger Skalierung, fehlende Freigabe und Revisionskonflikte geprüft. |
| Originaldateien | 0.20.0: bytegenau erhalten | 83 wiederhergestellte Dateien einschließlich exakt 72 Transformationsbildern. |

Vier neue Tests in 0.11.0 prüfen Hand-/Fußziele, feste Knochenabstände, den ganzen erkannten Körper, Hals/Kopf und Rumpf, tatsächliche Hautverformung, gespeicherte Posen sowie direktes Ziehen/Drehen mit Undo. Nutzertest von 0.10.0 meldete auseinanderziehbare Knochen und Probleme mit der Ausrichtung; die visuelle Nachprüfung der Korrektur 0.11.0 steht aus.

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
5. Gelenkpose und Gesamtverschiebung, Drehung und Größenänderung aufnehmen, Move abspielen, Projekt speichern und neu laden. Auch ein knochenloses Modell verwenden.
6. Deutsch/English umschalten und kontrollieren, dass eigene Namen erhalten bleiben.
7. Im Player einen eigenen Move über den eingerichteten Agenten auslösen; im Studio muss derselbe Steuerbefehl abgewiesen werden.

Diese Liste beschreibt ausstehende Prüfungen, keine bereits erzielten Ergebnisse.

## Historische Berichte

[0.1.0](PRUEFUNG-0.1.0.md) · [0.2.0](PRUEFUNG-0.2.0.md) · [0.3.0](PRUEFUNG-0.3.0.md) · [0.4.0](PRUEFUNG-0.4.0.md) · [0.5.0](PRUEFUNG-0.5.0.md) · [0.6.0](PRUEFUNG-0.6.0.md) · [0.7.0](PRUEFUNG-0.7.0.md) · [0.8.0](PRUEFUNG-0.8.0.md) · [0.9.0](PRUEFUNG-0.9.0.md)

[Prüfbericht 0.10.0](PRUEFUNG-0.10.0.md)

[Prüfbericht 0.11.0](PRUEFUNG-0.11.0.md)

Nutzerrückmeldung zu 0.11.0: Mitteltasten-Drehung nach Zoom/Pan um Schulter statt Figurenmitte. In 0.11.1 korrigiert und mit Kamera-Mathematik sowie tatsächlichen ArcballControls/DOM-Pointerereignissen geprüft. Visuelle Nachprüfung bleibt offen. [Prüfbericht 0.11.1](PRUEFUNG-0.11.1.md).

[Prüfbericht 0.12.0](PRUEFUNG-0.12.0.md): Generierungsadapter mit Testdoubles geprüft; reale Inferenz und Original-PaKaChi-3D weiterhin offen.

[Prüfbericht 0.13.0](PRUEFUNG-0.13.0.md): Profilverwaltung und interne Fähigkeitsprüfung bestanden; echte Anbieteranbindung und visuelle Optionsdialog-Abnahme stehen aus.

[Prüfbericht 0.14.0](PRUEFUNG-0.14.0.md): Interner Auftragskern mit simulierten Adaptern und Übernahmetransaktionen geprüft; keine echte Anbieter-/Studio-Integration.

[Prüfbericht 0.15.0](PRUEFUNG-0.15.0.md): Modelllisten, Sitzungsschlüssel, Hardwarebudgets und freie Wahl für alle Rollen; echte Modellinferenz weiterhin nicht abgenommen.

[Prüfbericht 0.16.0](PRUEFUNG-0.16.0.md): begrenzter Assistentenablauf, Protokolle und DOM mit Testdoubles geprüft; echte Modell-/Cloud-Abnahme offen.

[Prüfbericht 0.17.0](PRUEFUNG-0.17.0.md): native Anthropic-Protokolle mit Testdoubles geprüft; echte Kontoabnahme offen.

[Prüfbericht 0.17.1](PRUEFUNG-0.17.1.md): Anbieter-Einrichtung, 14 relevante Tests und DOM-Bedienprüfung bestanden; Build geprüft. Letzter vollständiger Testlauf weiterhin 0.17.0.

[Prüfbericht 0.18.0](PRUEFUNG-0.18.0.md): Mehranbieterprofile, erhaltene Sitzungsschlüssel und unabhängige Fallback-Routen geprüft.

[Prüfbericht 0.19.0](PRUEFUNG-0.19.0.md): Schlüsseltresor mit echter Web Crypto und Profiloberfläche geprüft.

Unreleased (17.10.2026): Acht Tresortests einschließlich zweier neuer Passwortwechsel-Prüfungen und Produktionsbuild bestanden. Kein erneuter vollständiger Testlauf oder unabhängiges Sicherheitsaudit für diese Ergänzung.

[Prüfbericht 0.20.0](PRUEFUNG-0.20.0.md): Passwortwechsel und Sitzungssperre zusammen geprüft; 113 Tests und Build bestanden.
