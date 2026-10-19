# Bearbeitete Avatare für einen Model Zoo exportieren

Ab Software 0.29.0 kann ein statischer Katalog neben GLB/glTF auch vollständige Studio-Projekte anbieten. Damit bleiben eigene Punkte, Verbindungen, Posen und Moves beim Bereitstellen erhalten. Der Export veröffentlicht nichts und überschreibt keinen bestehenden Ordner.

## Export vorbereiten

1. Im Studio das bearbeitete Projekt über **Speichern** als `.pakachi.json` herunterladen. Eine lokale Browsersammlung wird vom CLI nicht automatisch gelesen.
2. Im Repository unter Node.js 24 oder neuer ausführen:

```sh
npm run export:zoo -- --project "/pfad/mein-avatar.pakachi.json" --id mein-avatar --output "/pfad/neues-avatar-paket"
```

Der Ausgabeordner darf noch nicht existieren; sein Elternordner muss vorhanden sein. Die ID besteht aus Kleinbuchstaben, Ziffern, `_` und `-`, beginnt mit Buchstabe/Ziffer und ist höchstens 80 Zeichen lang. `pakachi-original`, `local-import` und `saved-…` sind reserviert.

Das Paket enthält:

- `model-zoo/projects/mein-avatar.pakachi.json`: vollständiges Projekt mit eingebettetem Quellmodell und Studio-Daten.
- `model-zoo/catalog.json`: ein Katalog mit genau diesem neuen Eintrag.
- `README.txt`: Hinweise zur manuellen Übernahme.

Das Skript prüft Projektstruktur, IDs und maximal 80 MiB Projekt-JSON. Es übernimmt nur bekannte Projektfelder; zusätzliche Felder außerhalb des Projektformats werden nicht exportiert. Ein Ausgabefehler kann einen unvollständigen neuen Ordner hinterlassen; dieser wird nicht automatisch gelöscht. Eine korrigierte Ausführung benötigt einen neuen Ausgabeordner.

## Kataloge zusammenführen und übernehmen

Ab 0.30.0 im Repository ausführen:

```sh
npm run merge:zoo -- --base public --package "/pfad/neues-avatar-paket" --output "/pfad/neuer-katalog"
```

Beide Quellordner müssen `model-zoo/catalog.json` enthalten. Der Ausgabeordner darf nicht existieren und muss außerhalb beider Quellen liegen; sein Elternordner muss vorhanden sein. Quellen bleiben unverändert. Doppelte IDs oder normalisierte Dateipfade werden abgewiesen, auch bei identischen Dateien. Eine eindeutige ID bereits beim Export wählen.

Vor dem Schreiben prüft das Werkzeug beide Kataloge, referenzierte Dateien, Projekt-IDs, Modellcontainer und externe Ressourcen. Symlinks außerhalb der jeweiligen Quelle werden abgewiesen. Unterstützt werden eigenständige GLB/glTF-Dateien und eingebettete Projektmodelle; zusätzliche externe Texturen/Binärdateien werden nicht mitgenommen. Grenzen: 100 Einträge, 1 MiB je Katalog, 80 MiB je Projekt, 50 MiB je Modell, zusammen 256 MiB referenzierte Quelldateien. Parsing und Kopien benötigen zusätzlichen Arbeitsspeicher.

Die Ausgabe enthält `model-zoo/`, `merge-report.json` mit Größen und SHA-256-Prüfsummen sowie `README.txt`. Modelle und Projekte bleiben bytegenau erhalten, einschließlich eventuell vorhandener zusätzlicher Projektfelder. **Dies ist kein vollständiger Player und kein Ersatz für den ganzen public-Ordner.** Nicht referenzierte Dateien werden nicht kopiert. Ein Schreibfehler kann einen unvollständigen neuen Ausgabeordner hinterlassen; er wird nicht automatisch entfernt.

1. Bericht und zusammengeführten Katalog kontrollieren.
2. Den erzeugten `model-zoo/`-Ordner in einer separaten Testkopie des Players ab 0.29.0 einsetzen. Übrige Anwendungsdateien und Original-PaKaChi-Referenzen beibehalten.
3. Alle Avatare auswählen, Geometrie/Rig/Texturen prüfen, Moves abspielen und Projekte speichern/erneut laden.
4. Erst nach dieser Abnahme den geprüften Katalog mit dem eigenen Hosting-/Repository-Verfahren veröffentlichen.

Manuelles Kopieren der Projektdatei und Ergänzen ihres Eintrags im bestehenden Katalog bleibt möglich. Ein einzelnes Exportpaket darf nicht ungeprüft den vorhandenen Katalog ersetzen. Kein Upload oder Deployment erfolgt automatisch. Paketdateien enthalten das vollständige Modell und sämtliche Studio-Daten. [Prüfbericht zum Merger](PRUEFUNG-0.30.0.md).

## Katalogformat und Laden

Katalogschema bleibt 1 und erhält eine additive Quelle: Ein Eintrag verwendet entweder `model` mit relativem GLB/glTF-Pfad oder `project` mit relativem `.pakachi.json`-Pfad unter `model-zoo/`. Beide Quellen gleichzeitig sind ungültig. Ältere Player unterstützen diese neue Quellenart nicht. Das Projektformat bleibt ebenfalls Version 1.

Bei Projektquellen muss `project.avatar.id` mit der Katalog-ID übereinstimmen. Modellbytes werden aus dem Projekt geladen; die Katalog-ID bleibt für Auswahl und Agentensteuerung erhalten. Eigene Studio-Moves stammen aus den geprüften Projektdaten, nicht aus ungeprüften zusätzlichen Fähigkeiten im Katalog.

Projektabrufe verwenden die konfigurierte Anwendungsbasis, keine im Katalog frei eingebbaren externen URLs, keine Redirects und keine Zugangsdaten. Die tatsächliche Streamgröße wird auf 80 MiB begrenzt; der eingebettete Modellimport bleibt auf 50 MiB begrenzt. Abbruch, falsche IDs, ungültiges JSON und veraltete Ladevorgänge verhindern die Übernahme. Die bestehenden Modell-/Geometrieprüfungen, Rückfragen zu ungespeicherten Änderungen und der Modellwechsel-Verlauf gelten weiterhin.

Das Exportskript prüft die Datenstruktur, keine Anatomie, Texturdarstellung oder Bewegungsqualität. Ein synthetisches reales GLB und der HTTP-Ladeweg sind automatisiert geprüft; der gerenderte Veröffentlichungsablauf ist noch nicht abgenommen. [Prüfbericht](PRUEFUNG-0.29.0.md).
