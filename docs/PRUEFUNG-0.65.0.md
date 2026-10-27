# Prüfbericht 0.65.0

**0.65.0:** Neue sichtgefilterte Pinselstriche berücksichtigen Alpha-Ausschnitte über `alphaTest`, Bildalpha und den Grünkanal einer `alphaMap`. Die Prüfung interpoliert UVs am Strahltreffer und berücksichtigt Texturtransformation, UV-Kanal, Wiederholung, Spiegelung, Flip und Nearest-/Linear-Vergrößerungsfilter. Pixel und Materialdaten werden beim Laden festgehalten. `region.view.alpha: true` zusammen mit `materials: true` speichert die neue Regel; ältere Aufträge behalten ihre bisherige Sichtprüfung.

285 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40545759919)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 8998 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Die Alpha-Prüfung verwendet deterministisch die Basisebene der Textur, keine Mipmaps oder anisotrope Filterung. Dadurch sind Abweichungen zur gerenderten Kante bei Verkleinerung möglich. Unterstützt sind lesbare RGBA-8-Bit-Bilder bis 16.777.216 Pixel pro Textur. Nicht lesbare/komprimierte Texturen, fehlende UVs, Shader-Materialien und Alpha-to-Coverage bleiben verdeckend. Teiltransparenz wird nicht simuliert; Dreiecke bleiben beidseitig. GPU-/Materialqualität und große Modelle sind nicht manuell abgenommen. Neue Alpha-Aufträge benötigen mindestens 0.65.0; kein automatischer Umbau alter Verläufe.

## Bestätigter Prüflauf

Geprüfter Commit: `d22828d7fdc221da5bf2fe000c62cf4a87afb2af`. GitHub bestätigt 285 Node-Tests ohne Fehler, den Produktionsbuild und 21 Browserfälle (5,1 Minuten). Die Browserinstallation benötigte etwa fünf Minuten und war erfolgreich.

Der neue Browserfall dekodiert ein echtes PNG und prüft Alpha-Loch, deckenden Bildbereich, alte Sichtregel sowie unveränderte Pixelkopie nach Bildänderung. Der vorhandene Pinseltest prüft die Alpha-Regel im gespeicherten Verlauf einschließlich Undo/Redo und Wiederladen. Dies ist keine manuelle GPU-/Darstellungsabnahme. Dokumentationsabgleich: 28.10.2026.
