# Interner Auftragskern

**Stand 0.22.0.** Der lokale TripoSR-Transportadapter ist für diese Entwicklungsschnittstelle implementiert und per HTTP getestet. Die sichtbare Generierungsoberfläche registriert diesen Adapter seit 0.22.0; echte GPU-Inferenz- und Browserabnahme stehen aus. Die Anbieteroberfläche kann inzwischen Modelllisten abrufen; diese Abfrage ist unabhängig vom Auftragskern und startet keine Inferenz.

## Ablauf

`ProviderJob` wird mit Registry, Anbieter-Konfiguration, Rolle, Eingabe, Studio-Sitzung/Revision und einer verpflichtenden Formatprüfung angelegt. Erst `start()` ruft den zugeordneten Adapter auf. Profil und Eingabe werden beim Anlegen kopiert, sodass spätere Optionsänderungen den Auftrag nicht umleiten.

| Zustand | Bedeutung |
| --- | --- |
| `checking` | Konfiguration bereit; nach Start wird die Modell-/Rollenfähigkeit geprüft. |
| `queued` / `running` | Adapter führt den Auftrag aus und meldet gegebenenfalls Fortschritt. |
| `validating` | Formatprüfung läuft; bisheriges Projekt bleibt unverändert. |
| `preview` | Geprüftes Ergebnis liegt zur späteren Vorschau und ausdrücklichen Übernahme vor. |
| `accepted` / `discarded` | Ergebnis übernommen beziehungsweise verworfen. |
| `stale` | Aktuelle Sitzung oder Revision passt nicht mehr, oder die Host-Transaktion lehnt die Übernahme ab. |
| `failed` / `cancelled` / `timed-out` | Auftrag ist beendet; späte Fortschrittsmeldungen und Ergebnisse bleiben wirkungslos. |

`done` liefert einen Snapshot beim Erreichen von `preview` oder einem vorherigen Endzustand. Nachträgliche Übernahme/Verwerfung ist über `snapshot` beziehungsweise `subscribe` sichtbar. Beobachterfehler ändern den Auftragsstatus nicht. Vorschauzugriffe liefern Kopien, keine veränderbaren internen Ergebnisdaten.

## Adaptervertrag

`ProviderAdapter.run(request)` ist optional; fehlt er, scheitert der Auftrag mit `execution-missing`. Der Aufruf enthält Auftrag-ID, Rolle, eingefrorenes Profil, kopierte Eingabe, ein `AbortSignal` und eine Fortschrittsfunktion. Eine Anbieter-API mit Auftrag-ID und Statusabfrage kann ihr Polling innerhalb dieses Adapters durchführen. Es gibt keine automatische zweite Anfrage, Wiederholung oder Ausweichverbindung im Kern.

Assistenten liefern Text; Generator und Rigging liefern Modellbytes. Eingaben dürfen einen Prompt und optional PNG/JPEG oder GLB enthalten. Grenzen: Prompt 16.000 Zeichen, Bild 20 MiB, Modell 50 MiB, Textresultat 1.048.576 Zeichen. Diese Größen-/Typprüfung bestätigt noch keine gültige Geometrie. Der zwingende `validate`-Callback muss das tatsächliche Format prüfen; die Studio-Anbindung verwendet seit 0.22.0 den produktiven Modelllader und Geometriegrenzen; anatomische Rigging-Prüfungen bleiben offen. In den Lebenszyklustests sind Validatoren und Dienste simuliert.

## Abbruch und Zeitlimit

Das Zeitlimit gilt über Fähigkeitsprüfung, Ausführung und Ergebnisprüfung hinweg: Standard 120 Sekunden, pro Auftrag zwischen 1 Millisekunde und einer Stunde einstellbar. Abbruch und Zeitlimit beenden das lokale Warten unabhängig davon, ob der Adapter reagiert. Das Signal wird weitergegeben. War die Ausführung noch offen, lautet der fernseitige Stopstatus `unconfirmed`: Das ist keine Zusage, dass ein externer Auftrag oder dessen Abrechnung gestoppt wurde. Vor Ausführungsbeginn beziehungsweise während der Ergebnisprüfung ist kein fernseitiger Stop angefordert.

## Übernahme und manuelle Änderungen

`accept(currentRevision, commit)` liest unmittelbar vor der Übernahme die aktuelle Sitzung und Revision. Abweichungen verhindern den Aufruf von `commit`. Die synchrone Host-Transaktion erhält Ergebnis und erwartete Revision und muss entweder vollständig samt Undo-Eintrag übernehmen oder ohne Änderung ablehnen. Asynchrone Commit-Funktionen sind nicht unterstützt. Wirft der Host einen Fehler, bleibt das Ergebnis zur Prüfung verfügbar; bereits erfolgte Host-Schreibzugriffe kann der Auftragskern nicht zurückrollen. Deshalb muss der Host selbst atomar arbeiten.

Diese atomare Host-Anbindung ist noch nicht implementiert; seit 0.22.0 besteht stattdessen der unten beschriebene revisionsgeschützte Import. Die Tests prüfen die Abweisung veralteter Ergebnisse und die einmalige Übergabe an simulierte Transaktionen, nicht den Austausch eines realen Studio-Modells. Ein erneuter Versuch benötigt ausdrücklich einen neuen Auftrag mit neu geprüftem Projektstand.

## Noch offen

- Echte Inferenzabnahme des lokalen TripoSR-Adapters sowie weitere lokale und externe Fachadapter.
- Auftragsliste/Verlauf und Korrekturprompt; Empfängeranzeige und Einzelauftragsvorschau sind seit 0.22.0 vorhanden.
- Anatomische Rigging-Prüfung und atomarer Modellwechsel mit Undo im Studio; Geometrieprüfung ist seit 0.22.0 angeschlossen.
- Fernseitige Abbruchbestätigung, Wiederaufnahme nach App-Neustart und begrenzte Auftragshistorie.

[Roadmap](ROADMAP.md#7-studio-harness-und-anbieteranbindung) · [Prüfbericht](PRUEFUNG-0.14.0.md)

## Lokaler Fachadapter

`createLocalGenerationAdapter(tokenFor, fetcher?)` aus `src/generation-adapter.ts` wird explizit in einer `ProviderRegistry` registriert. Das Profil verwendet `adapter: 'custom-generation'`, `endpoint: 'http://127.0.0.1:8766'` und `model: 'triposr'`. Der Dienststart und sein Zugriffstoken sind in [KI-GENERIERUNG.md](KI-GENERIERUNG.md#lokaler-generierungsdienst-seit-0210) beschrieben. Die Tokenfunktion gehört ausschließlich zur Laufzeit; für einen Auftrag soll der Aufrufer einen festen Schlüsselsnapshot übergeben. Die Studio-Oberfläche verbindet Schlüsselsperren mit `job.cancel()` und invalidiert späte Ergebnisse.

Die Rolle ist ausschließlich `generation`; PNG/JPEG sind erforderlich. `input.prompt` benennt den Auftrag, steuert TripoSR aber nicht. Fortschritt zeigt `running`, keinen erfundenen Prozentwert. Für längere Rekonstruktionen `timeoutMs` ausdrücklich passend zum Dienst setzen (maximal eine Stunde). `validate` muss weiterhin das vollständige GLB mit dem tatsächlichen Loader prüfen. Eine erfolgreiche HTTP-Antwort ersetzt weder Formatprüfung noch visuelle Vorschau und Freigabe. Der Adapter registriert sich nicht selbst in der Anwendung und führt keine automatischen Fallbacks aus.

## Studio-Anbindung (0.22.0)

`mountGenerationPanel` registriert den lokalen Adapter mit einem festen Schlüsselsnapshot und nutzt `ProviderJob` bis zur geprüften Vorschau. `validateGeneration` lädt echte Modellbytes und begrenzt Knochen/Vertices; `showGenerationPreview` hält einen getrennten Viewer. Modellwechsel gehen anschließend über den asynchronen Import des Players mit erneutem Zielvergleich und Operationsschutz. Das synchrone `ProviderJob.accept()` wird für diesen Import bewusst nicht als atomare Transaktion ausgegeben; ein vollständiges Modell-Undo fehlt weiterhin. Siehe [Bedienung](KI-GENERIERUNG.md#bedienung-im-studio-seit-0220).
