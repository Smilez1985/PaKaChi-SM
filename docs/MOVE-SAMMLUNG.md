# Gemeinsame Move-Sammlung

Ab 0.31.0 kann das Studio exportierte Bewegungen aus `moves/catalog.json` derselben Anwendung anbieten. Die mitgelieferte Sammlung ist leer. Es gibt keinen automatischen Download beim Start und keine automatische Wiedergabe.

## Sammlung vorbereiten

Ein Projekt mit eigenen Studio-Moves speichern. Im Repository mit Node.js 24 oder neuer:

```sh
npm run export:moves -- --project "/pfad/avatar.pakachi.json" --output "/pfad/neue-move-sammlung"
```

Der neue Ausgabeordner darf nicht existieren; sein Elternordner muss vorhanden sein. Das Werkzeug erstellt `moves/catalog.json` und eine `.pakachi-move.json` je eigener Bewegung. Das Quellprojekt bleibt unverändert. Eingebettete GLB-Animationsclips werden nicht exportiert. Grenze: 80 MiB Quellprojekt, bis zu 100 Moves, 8 MiB je Move-Datei und 64 MiB Move-Dateien insgesamt. Die Ausgabe wird vorab im Speicher vorbereitet; ein Schreibfehler kann einen unvollständigen neuen Ordner hinterlassen.

Den erzeugten `moves/`-Ordner in einer Testkopie der Anwendung unter `public/` einsetzen. Vorhandene Sammlungen nicht ungeprüft ersetzen. Für mehrere Pakete steht seit 0.32.0 merge:moves bereit; IDs und Pfade müssen eindeutig bleiben. Browserbearbeitung der gemeinsamen Dateien ist noch nicht implementiert. `merge:zoo` behandelt ausschließlich Avatar-Kataloge und nimmt moves/ nicht mit.

Katalogbeispiel:

```json
{
  "schemaVersion": 1,
  "moves": [
    {"id": "wave", "name": "Winken", "file": "moves/wave.pakachi-move.json"}
  ]
}
```

Die Katalog-ID muss mit der ID in der Move-Datei übereinstimmen. Erlaubt sind Dateien direkt unter moves/, ohne externe URLs oder Unterverzeichnisse. Namen werden als Text angezeigt. Dateien benötigen keinen Modellinhalt; zum Import muss das passende Modell mit derselben Gelenkstruktur bereits geladen sein.

## Im Studio verwenden

1. Passenden Avatar beziehungsweise Projekt laden und das Studio öffnen.
2. **Sammlung laden** wählen. Nach Änderungen am bereitgestellten Katalog erneut laden.
3. Einen Eintrag auswählen und **Aus Sammlung importieren** anklicken.
4. Vorschau prüfen. **Zurück** nimmt Posen und Bewegung gemeinsam wieder heraus; Wiederholen stellt sie wieder her.

Der Import prüft den vollständigen Move, die Modell-/Rig-Fingerabdrücke und die Projektgrenzen. Konflikte mit bereits vorhandenen Bewegungsnamen/IDs werden wie beim Dateiimport behandelt; eigene Anzeigenamen können gleich sein, IDs erhalten bei Bedarf ein freies Suffix. Die aktuelle Pose bleibt erhalten, eine Bewegung startet nicht automatisch. Ändert sich das Studio während Download oder Prüfung, wird die Übernahme verworfen. Verlassen des Studios und Modellwechsel brechen laufende Abrufe ab. Es gilt ein Zeitlimit von 30 Sekunden.

Die Liste zeigt alle bereitgestellten Einträge, auch solche für andere Rigs. Eine Auswahl ist keine Kompatibilitätszusage; ein unpassender Import wird abgewiesen. Kein Retargeting und keine automatische anatomische Bewertung. Grenzen beim Laden: Katalog 256 KiB, Move-Datei 8 MiB, keine Redirects oder mitgesendeten Zugangsdaten.

Die Quelle der Sammlung ist die aktuelle Anwendung; es gibt keine zentrale Cloud-Synchronisierung. Veröffentlichung erfolgt nach eigener visueller Prüfung über das gewählte Hosting. [Move-Dateiformat](MOVE-DATEIEN.md) · [Prüfbericht](PRUEFUNG-0.31.0.md).

## Sammlungen zusammenführen

Ab 0.32.0:

```sh
npm run merge:moves -- --base public --package "/pfad/neue-move-sammlung" --output "/pfad/kombinierte-sammlung"
```

Beide Quellen müssen `moves/catalog.json` enthalten. Der Ausgabeordner darf nicht existieren und muss außerhalb beider Quellen liegen; sein Elternordner muss vorhanden sein. Die Ausgabe enthält nur `moves/`, `merge-report.json` und `README.txt`, keinen vollständigen Player. Nur den geprüften moves/-Ordner in eine Testkopie der Anwendung übernehmen; übrige public-Dateien erhalten.

Das Werkzeug prüft beide Kataloge und alle referenzierten Move-Dateien vor dem Schreiben. Doppelte IDs oder Pfade werden abgewiesen, auch bei gleichen Dateien. Gegebenenfalls die Schlagworte bereits im Quellprojekt eindeutig benennen und neu exportieren. Es gibt keine automatische Umbenennung. Dateien bleiben bytegenau erhalten; zusätzliche Felder werden nicht bereinigt. Der Bericht dokumentiert Dateigrößen und SHA-256-Prüfsummen.

Erlaubt sind bis zu 100 Einträge, 256 KiB je Katalog, 8 MiB je Move-Datei und 64 MiB Move-Dateien insgesamt. Nur referenzierte reguläre Dateien werden kopiert; Symlinks außerhalb der Quelle werden abgewiesen. Parsing und Kopien benötigen zusätzlichen Arbeitsspeicher. Fehler beim Schreiben können einen unvollständigen neuen Ausgabeordner hinterlassen; Quellen und vorhandene Ausgaben werden nicht verändert.

Verschiedene Modellbindungen dürfen in einem Katalog enthalten sein. Die Strukturprüfung erkennt beispielsweise ungültige Posenreferenzen und Transformationen; die Kompatibilität mit einem tatsächlichen Avatar wird weiterhin erst beim Studio-Import geprüft. Die Fingerabdrücke bestätigen keine Herkunft oder Bewegungsqualität. Vor Veröffentlichung jeden Move mit seinem vorgesehenen Avatar importieren und visuell prüfen. Kein automatisches Deployment. [Prüfbericht](PRUEFUNG-0.32.0.md).
