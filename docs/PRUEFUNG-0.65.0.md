# Prüfbericht 0.65.0

**0.65.0:** Neue sichtgefilterte Pinselstriche berücksichtigen Alpha-Ausschnitte über `alphaTest`, Bildalpha und den Grünkanal einer `alphaMap`. Die Prüfung interpoliert UVs am Strahltreffer und berücksichtigt Texturtransformation, UV-Kanal, Wiederholung, Spiegelung, Flip und Nearest-/Linear-Vergrößerungsfilter. Pixel und Materialdaten werden beim Laden festgehalten. `region.view.alpha: true` zusammen mit `materials: true` speichert die neue Regel; ältere Aufträge behalten ihre bisherige Sichtprüfung.

285 Node-Tests und Produktionsbuild bestanden; Python-Syntax geprüft. Neuer Chromium-Nachweis steht aus.

Die Alpha-Prüfung verwendet deterministisch die Basisebene der Textur, keine Mipmaps oder anisotrope Filterung. Dadurch sind Abweichungen zur gerenderten Kante bei Verkleinerung möglich. Unterstützt sind lesbare RGBA-8-Bit-Bilder bis 16.777.216 Pixel pro Textur. Nicht lesbare/komprimierte Texturen, fehlende UVs, Shader-Materialien und Alpha-to-Coverage bleiben verdeckend. Teiltransparenz wird nicht simuliert; Dreiecke bleiben beidseitig. GPU-/Materialqualität und große Modelle sind nicht manuell abgenommen. Neue Alpha-Aufträge benötigen mindestens 0.65.0; kein automatischer Umbau alter Verläufe.
