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

## In einen bestehenden Player übernehmen

1. Eine im Zielkatalog noch nicht vorhandene ID wählen; Namensgleichheit ist kein Ersatz für eindeutige IDs.
2. Die Projektdatei nach `public/model-zoo/projects/` der Zielanwendung kopieren. Bestehende Dateien nicht ungeprüft überschreiben.
3. Den einzelnen Eintrag aus dem erzeugten `avatars`-Array in das vorhandene `public/model-zoo/catalog.json` übernehmen. **Nicht den vorhandenen Katalog durch das Eintragspaket ersetzen.**
4. Den Player mit Version 0.29.0 oder neuer starten. Den Avatar auswählen, Geometrie/Rig prüfen, eigene Moves abspielen und ein gespeichertes Projekt erneut laden.
5. Erst nach dieser Prüfung die eigenen Dateien mit dem gewünschten Hosting-/Repository-Verfahren veröffentlichen.

Es gibt noch keinen automatischen Katalog-Merger, Upload oder Deployment. Die Paketdateien können bewusst weitergegeben werden; sie enthalten das vollständige Modell und sämtliche Studio-Daten. Nur dafür geeignete Inhalte veröffentlichen.

## Katalogformat und Laden

Katalogschema bleibt 1 und erhält eine additive Quelle: Ein Eintrag verwendet entweder `model` mit relativem GLB/glTF-Pfad oder `project` mit relativem `.pakachi.json`-Pfad unter `model-zoo/`. Beide Quellen gleichzeitig sind ungültig. Ältere Player unterstützen diese neue Quellenart nicht. Das Projektformat bleibt ebenfalls Version 1.

Bei Projektquellen muss `project.avatar.id` mit der Katalog-ID übereinstimmen. Modellbytes werden aus dem Projekt geladen; die Katalog-ID bleibt für Auswahl und Agentensteuerung erhalten. Eigene Studio-Moves stammen aus den geprüften Projektdaten, nicht aus ungeprüften zusätzlichen Fähigkeiten im Katalog.

Projektabrufe verwenden die konfigurierte Anwendungsbasis, keine im Katalog frei eingebbaren externen URLs, keine Redirects und keine Zugangsdaten. Die tatsächliche Streamgröße wird auf 80 MiB begrenzt; der eingebettete Modellimport bleibt auf 50 MiB begrenzt. Abbruch, falsche IDs, ungültiges JSON und veraltete Ladevorgänge verhindern die Übernahme. Die bestehenden Modell-/Geometrieprüfungen, Rückfragen zu ungespeicherten Änderungen und der Modellwechsel-Verlauf gelten weiterhin.

Das Exportskript prüft die Datenstruktur, keine Anatomie, Texturdarstellung oder Bewegungsqualität. Ein synthetisches reales GLB und der HTTP-Ladeweg sind automatisiert geprüft; der gerenderte Veröffentlichungsablauf ist noch nicht abgenommen. [Prüfbericht](PRUEFUNG-0.29.0.md).
