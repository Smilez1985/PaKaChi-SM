# Interner Auftragskern

**Stand 0.15.0.** Diese Entwicklungsschnittstelle ist noch nicht an die sichtbare Generierungsoberfläche oder einen echten KI-Dienst angeschlossen. Die Anbieteroberfläche kann inzwischen Modelllisten abrufen; diese Abfrage ist unabhängig vom Auftragskern und startet keine Inferenz.

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

Assistenten liefern Text; Generator und Rigging liefern Modellbytes. Eingaben dürfen einen Prompt und optional PNG/JPEG oder GLB enthalten. Grenzen: Prompt 16.000 Zeichen, Bild 20 MiB, Modell 50 MiB, Textresultat 1.048.576 Zeichen. Diese Größen-/Typprüfung bestätigt noch keine gültige Geometrie. Der zwingende `validate`-Callback muss das tatsächliche Format prüfen; für Modelle muss der spätere Adapter zum Studio den produktiven Modelllader und passende Rigging-Prüfungen anbinden. In den Lebenszyklustests sind Validatoren und Dienste simuliert.

## Abbruch und Zeitlimit

Das Zeitlimit gilt über Fähigkeitsprüfung, Ausführung und Ergebnisprüfung hinweg: Standard 120 Sekunden, pro Auftrag zwischen 1 Millisekunde und einer Stunde einstellbar. Abbruch und Zeitlimit beenden das lokale Warten unabhängig davon, ob der Adapter reagiert. Das Signal wird weitergegeben. War die Ausführung noch offen, lautet der fernseitige Stopstatus `unconfirmed`: Das ist keine Zusage, dass ein externer Auftrag oder dessen Abrechnung gestoppt wurde. Vor Ausführungsbeginn beziehungsweise während der Ergebnisprüfung ist kein fernseitiger Stop angefordert.

## Übernahme und manuelle Änderungen

`accept(currentRevision, commit)` liest unmittelbar vor der Übernahme die aktuelle Sitzung und Revision. Abweichungen verhindern den Aufruf von `commit`. Die synchrone Host-Transaktion erhält Ergebnis und erwartete Revision und muss entweder vollständig samt Undo-Eintrag übernehmen oder ohne Änderung ablehnen. Asynchrone Commit-Funktionen sind nicht unterstützt. Wirft der Host einen Fehler, bleibt das Ergebnis zur Prüfung verfügbar; bereits erfolgte Host-Schreibzugriffe kann der Auftragskern nicht zurückrollen. Deshalb muss der Host selbst atomar arbeiten.

Diese Host-Anbindung ist noch nicht implementiert. Die Tests prüfen die Abweisung veralteter Ergebnisse und die einmalige Übergabe an simulierte Transaktionen, nicht den Austausch eines realen Studio-Modells. Ein erneuter Versuch benötigt ausdrücklich einen neuen Auftrag mit neu geprüftem Projektstand.

## Noch offen

- Produktive lokale und externe Inferenzadapter samt geschützter Anmeldung; Modelllisten sind separat bereits vorhanden.
- Sichtbare Auftragsliste, Empfängeranzeige, Korrekturprompt und 3D-Vorschau.
- Tatsächliche Format-/Rigging-Prüfung und atomarer Modellwechsel mit Undo im Studio.
- Fernseitige Abbruchbestätigung, Wiederaufnahme nach App-Neustart und begrenzte Auftragshistorie.

[Roadmap](ROADMAP.md#7-studio-harness-und-anbieteranbindung) · [Prüfbericht](PRUEFUNG-0.14.0.md)
