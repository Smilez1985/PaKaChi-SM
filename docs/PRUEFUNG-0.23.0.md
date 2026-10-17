# Prüfbericht 0.23.0

Zeitstempel: 2026-10-17T17:12:59+02:00

## Ergebnis

- `npm test`: 130 Tests bestanden, keine Fehler oder übersprungenen Tests; einschließlich Erhaltungsprüfung der Originaldateien und exakt 72 Transformationsbilder.
- `npm run build`: TypeScript und Produktionsbuild bestanden. Bekannte Vite-Bundlewarnung bleibt bestehen.
- Sechs neue Tests: vier Verlaufstests sowie Projektaufnahme/-rekonstruktion und frühzeitige Viewer-Geometrieprüfung.

## Umfang

Der Verlauf wird mit Änderungen auf beiden Seiten eines Modellwechsels getestet. Kopien sind isoliert; Undo/Redo tauscht gespeicherten und aktuellen Stand. Abgelehnte und fehlgeschlagene Wiederherstellung lässt den Rücksprung erhalten. Eine konkurrierende Wiederherstellung wird blockiert; ein neuer Checkpoint macht eine alte Operation ungültig. Speichergrenze wird vor dem Restore geprüft, neue Wechsel ersetzen ältere und explizites Leeren entfernt den Verlauf.

Der DOM-/Three.js-Test erzeugt eine veränderte Oberfläche mit Entwurfspose, zwei Posen und einem Move, exportiert einen isolierten Projektstand und rekonstruiert einen echten StudioRig daraus. Der Player-Snapshot bewahrt den Entwurf statt der aktuellen Wiedergabephase; Dirty-Status und Speicherbutton werden geprüft. Ein weiterer Test weist leere Geometrie ab, bevor `Viewer.show` das bestehende Modell freigibt.

## Grenzen

Der vorbereitete Playwright-Test wurde um Original → generierter Entwurf → zurück → wiederholen erweitert. Er wurde in diesem Meilenstein nicht ausgeführt; der dokumentierte Chromium-Fehler aus 0.22.0 ist weiterhin ungelöst. Keine gerenderte Browser-/Mausabnahme, keine tatsächliche GPU-Inferenz oder Riggingprüfung.

Der Verlauf hält einen Sitzungs-Snapshot, keinen dauerhaften Versionsspeicher. Einzelgesten-Undo, Kamera, Auswahl, Agentenfreigabe und laufende Originalplayer-Animation werden nicht rekonstruiert. Zielprüfung und frühzeitige Validierung ersetzen keinen vollständigen Rollback beliebiger Fehler nach dem Modelltausch.
