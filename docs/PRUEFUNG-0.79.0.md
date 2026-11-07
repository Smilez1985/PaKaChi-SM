# Prüfbericht 0.79.0

Zeitstempel: 2026-11-07T09:26:00+01:00 (Europe/Berlin)

## Animationsausgabe

Ausgewählter eigener Studio-Move mit bearbeitetem Rig und einem Clip. Unabhängige Hierarchie-/Geometriekopien; Knochenkanäle werden auf die kopierten Knoten bezogen. Eine Gesamtspur bildet Position, Rotation und Größe um den ursprünglichen Figurenmittelpunkt ab; der Modellraum wird separat beibehalten. Keine Originalclip-Übernahme und keine animierten freien Oberflächenpunkte.

Zeitstützstellen pro Segment mit 30 Hz einschließlich aller Schlüsselposen und Schleifenschluss. Keine allgemeine exakte Kurvenübereinstimmung zwischen den Stützstellen; keine FPS-Zusage. Umfang und Kanalwerte sind vor der Ausgabe begrenzt. [Anleitung und Grenzen](GLB-EXPORT.md).

## Prüfungen

`npm run verify`: 322 Node-Tests, TypeScript und Produktionsbuild bestanden. Zusätzlicher Rundlauftest exportiert eine echte GLB, lädt sie neu und vergleicht animierte Hautpositionen bei mehreren Zeiten: Knochenbewegung, Figurentransformation mit Drehpunkt, Skalierung, wiederholte Posen und Schleifenschluss. Quelle und Daten bleiben unverändert. Ein Zwischenzeitpunkt wird mit einer zur Abtastung passenden Toleranz verglichen. Nicht unterstützte freie Punkte, Scherung, fehlende Posen und zu große Sequenzen werden geprüft. Knochen ohne Kontrollgriff erhalten ihre Grundpose statt einer zufällig sichtbaren anderen Pose.

Browserfall erstellt einen Mika-Move, lädt die GLB herunter, prüft Clip-/Skindaten und unveränderten Studio-Zustand, importiert sie erneut und spielt den Clip im Player ab. Artefakt `exported-glb-move.png`; maßgeblicher CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1). Bekannte Bundle-Größenwarnung bleibt. Manuelle Bewegungsqualität bleibt offen.
