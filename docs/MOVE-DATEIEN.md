# Einzelne Bewegungen austauschen

Seit 0.27.0 kann das integrierte Avatar-Studio eigene Bewegungen als `*.pakachi-move.json` exportieren und wieder importieren. Das Projektformat bleibt Version 1; das separate Move-Format verwendet `format: pakachi-move` und `version: 1`.

## Bedienung

1. Im Studio unter **Eigene Bewegungen** eine gespeicherte Bewegung auswählen.
2. **Move exportieren** lädt eine separate JSON-Datei herunter. Der Browser bestimmt den Downloadort; es wird kein Repository-Ordner automatisch beschrieben.
3. Ein passendes Avatar-Projekt öffnen und **Move importieren** wählen.
4. Nach erfolgreicher Prüfung wird die importierte Bewegung ausgewählt. **Vorschau** startet sie ausdrücklich; der Import spielt nichts automatisch ab.
5. Projekt speichern oder eine neue Kopie im lokalen Model Zoo anlegen. **Zurück/Wiederholen** nimmt den gesamten Import als einen Bearbeitungsschritt zurück beziehungsweise stellt ihn wieder her.

Exportiert werden ausschließlich Studio-Moves und deren benötigte Posen, einschließlich Reihenfolge, Übergangszeiten, Schleife, Prüfhinweisen sowie Gesamtposition, Gesamtdrehung und Skalierung. Mehrfache Verwendung derselben Pose bleibt erhalten. Nicht enthalten sind Geometrie, Texturen, Anbieterprofile oder Schlüssel. Bereits in der GLB enthaltene Animationsclips sind keine separat exportierbaren Studio-Moves.

## Kompatibilität und Schutz bestehender Arbeit

Die Datei enthält SHA-256-Fingerabdrücke des eingebetteten Quellmodells und der Bewegungsstruktur: Knochen-Grundtransformationen, Punkt-IDs, Punkttyp, Knochen-/Mesh-Zuordnung, Grundposition, Einflussradius und Verbindungen. Namen und gezeichnete Punktgrößen gehören nicht zur Kompatibilitätsprüfung. Die Berechnung verwendet Web Crypto und benötigt dessen Unterstützung im Browser (üblicherweise HTTPS oder localhost).

Importiert wird nur bei identischen Fingerabdrücken. Damit lassen sich Moves zwischen Projektkopien desselben Modells mit gleicher Bewegungsstruktur austauschen. Ein neu exportiertes oder anders aufgebautes Modell kann trotz ähnlichen Aussehens abgewiesen werden. **Kein Retargeting**, keine anatomische Prüfung und keine Sicherheits-/Echtheitszusage: Die Hashwerte schützen vor versehentlicher falscher Zuordnung, nicht vor einer absichtlich manipulierten Datei. Die normalen Datenprüfungen gelten unabhängig davon.

Bestehende Posen bleiben unverändert. Importierte Posen erhalten neue IDs; bei belegtem Schlagwort wird ein freies Suffix wie `wave-2` gewählt, auch bei Konflikten mit eingebetteten Clips. Dateigrenze: 8 MiB; Projektgrenzen: insgesamt 100 Posen und 100 Studio-Moves. Ungültige Dateien, fehlende Posen oder überschrittene Grenzen werden vor der Änderung abgewiesen.

Während Wiedergabe oder Ziehgesten ist der Import nicht verfügbar. Ändert sich das Studio während Dateilesen oder Fingerabdruckprüfung, wird der Import verworfen. Ebenso bei Verlassen oder Schließen des Editors. Importierte Prüfhinweise bleiben sichtbar. Freie Punkte/Posen aus Software 0.22.0/0.23.0 brauchen weiterhin die dokumentierte visuelle Kontrolle.

## Prüfgrenzen

Automatisiert geprüft sind Dateiformat, echte SHA-256-Berechnung, Kompatibilitätsgrenzen, Kollisionen, Posenreihenfolge, Gesamtspuren, Projektlimits, Editor-Undo/Redo und veraltete asynchrone Importe. Der tatsächliche Browser-Dateidialog und Download sowie eine gerenderte Bewegungsvorschau sind noch nicht abgenommen. [Prüfbericht](PRUEFUNG-0.27.0.md).

Seit 0.31.0 lassen sich dieselben Move-Dateien über einen gemeinsamen statischen Katalog auswählen und importieren. [Move-Sammlung einrichten](MOVE-SAMMLUNG.md).
