# Prüfbericht 0.59.0

**0.59.0:** Hautgewichte lassen sich mit gedrückter linker Maustaste zwischen zwei ausgewählten Knochen übertragen. Der Pinsel verwendet Radius und Anteil, zeigt den räumlichen Einfluss am aktuellen Treffer und setzt Aufträge mit festem räumlichem Abstand. Ein kompletter Strich ist ein Undo-Schritt; Abbruch und Überschreitung des Übertragungslimits nehmen den ganzen Strich zurück. Währenddessen sind Editor-Eingaben und Agentenänderungen gesperrt.

275 Node-Tests, Build und alle 19 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40280964660)).

Vier neue Node-Tests prüfen gleiche Gewichte bei unterschiedlicher Ereignisdichte, unveränderte Grundpose, Abbruch/Limit-Rollback, leere Regionen und Oberflächenlücken, Pointer-Capture mit Freigabe/Abbruch und Navigation sowie Editor-Integration mit gemeinsamem Undo/Redo und gesperrter Bearbeitung. Der neue Chromium-Fall malt auf Mika, exportiert und prüft Undo/Redo und Wiederladen.

Erste Pinselstufe: kugelförmiger Einfluss, auch durch dünne Oberflächen hindurch; keine Beschränkung auf sichtbare Vertices, keine Gewichtsfärbung. Überlappende Aufträge verstärken den Effekt. Höchstens 128 gespeicherte Übertragungen pro Projekt einschließlich Einzelaufträgen; lange Striche können das Limit erreichen. Große Sprünge und fehlende Oberflächentreffer unterbrechen die Verbindung zwischen Aufträgen. Manuelle Hautqualitäts- und Performance-Abnahme bleibt offen.

## GitHub-Nachweis

Geprüfter Commit: `a90b7a3339ff50389af1821bc71b04bb3f6fea15`. [Workflow 40280964660](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40280964660) erfolgreich abgeschlossen. 275 Node-Tests ohne Fehler, Build und 19 Chromium-Fälle bestanden. Der neue Browserfall malt Hautgewichte an Mika und prüft vollständiges Undo/Redo sowie Projekt-Download und Wiederladen. Keine neue manuelle Sichtprüfung oder reale Anbieterabnahme.
