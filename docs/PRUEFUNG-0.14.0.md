# Prüfbericht 0.14.0

Stand: 15.10.2026. Umfang: interner Auftragskern und Adaptervertrag.

- `npm test`: 68 Tests bestanden, darunter zehn neue Tests für Aufträge.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Warnung zum großen JS-Bundle bleibt bestehen.
- Originaldateien unverändert; Erhaltungsprüfung Bestandteil der Tests.

## Geprüfte Risiken

Fester Anbieter-/Eingabestand trotz späterer Änderungen, genau eine ausdrückliche Übernahme, Sitzungs- und Revisionskonflikte, Verwerfen, nicht reagierende Fähigkeitsprüfung und Ausführung, Zeitlimit, Abbruch während Ergebnisprüfung, verspätete Antworten/Fortschrittsmeldungen, monotone Fortschrittswerte, ungeeignete Ergebnisse, Validatorfehler, fehlende Ausführung, Beobachterfehler und abgewiesene Host-Transaktionen. Vorschaukopien und Validatoren können die intern gehaltenen Modellbytes nicht verändern.

## Prüfgrenzen

Alle neuen Dienste, Ergebnisse und Host-Transaktionen sind Testdoubles. Es wurde kein echter KI-Auftrag ausgeführt. Es gibt noch keine neue sichtbare Auftrags-/3D-Vorschauoberfläche und keinen durch diesen Kern ausgeführten Studio-Modellwechsel mit Undo. Die verpflichtende Formatprüfung ist ein Vertrag, noch keine neu implementierte GLB-/Anatomieprüfung. Abbruch bestätigt nur den lokalen Endzustand.

Bestehende DOM-/Geometrieprüfungen ersetzen keine gerenderte Browserabnahme. Python-MCP und die separaten Originalplayer-Tests wurden nicht erneut ausgeführt; die bisherigen Nachweise gelten unverändert. [Prüfstand](PRUEFUNG.md).
