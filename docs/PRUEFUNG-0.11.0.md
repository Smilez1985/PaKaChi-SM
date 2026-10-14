# Prüfstand 0.11.0

Auslöser: Im Browser meldete der Nutzer bei 0.10.0 auseinanderziehbare Körperteile, fehlende Kettenbewegung und Probleme mit der Ausrichtung. Die Korrektur ist automatisiert geprüft, noch nicht erneut visuell abgenommen.

- `npm test`: 47 Tests bestanden. Vier neue Tests umfassen Handziele, maximale/minimale Reichweite, gerade Ausgangsketten, feste Knochenabstände, tatsächliche SkinnedMesh-Verformung, Quaternion-Ausrichtung, Figurtransformation, Datei-/Posenrundlauf, entfernte Verbindungen und echte DOM-Pointerereignisse mit Undo.
- Für Mika und Nori: vollständige automatische Skelettverbindungen, beide Fuß-/Beinketten, Rumpfbewegung und Hals-/Kopfverbindung geprüft.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung (rund 1,14 MB / 309 kB gzip).
- `npm run generate:avatars`: beide technischen Testmodelle mit Hand-, Knie-, Fuß- und Halsknochen als Rig 2 erzeugt.
- Alle 83 Originaldateien einschließlich 72 Transformationsbildern bleiben bytegenau erhalten (reguläre Erhaltungsprüfung).
- Python-MCP-/aMQTT-Prozessintegration zuletzt in 0.10.0 bestanden; Original-Testprogramme zuletzt in 0.9.0. Node-MCP läuft in den regulären Tests.

Noch offen: gerenderte WebGL-/Maus-Nachprüfung, anatomische Winkelgrenzen, Kollisionen, Bodenfixierung, vollständige Körper-IK, komplexe Import-Rigs und anatomische Generierung ohne Skelett. DOM und Geometrie ersetzen keine visuelle Abnahme.
