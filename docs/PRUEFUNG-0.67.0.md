# Prüfbericht 0.67.0

**0.67.0:** Ein zusätzlicher Browserfall prüft echte Mausrad-, Rechts- und Mitteltastenereignisse im Studio. Nach außermittigem Zoom und Verschieben bleiben beim Drehen Abstand und Bildschirmposition der bekannten Figurenmitte konstant. Der Test wählt die normale und invertierte Drehrichtung über den Optionsdialog, prüft gegensinnige Kamerabewegung und funktionierenden Zoom nach Loslassen. Der übrige Studiozustand einschließlich Revision und Figur bleibt unverändert.

Produktionsbuild lokal bestanden. Neuer Chromium-Nachweis steht aus. Der bisherige bestätigte Stand umfasst 286 Node-Tests und 21 Browserfälle.

Dies ergänzt den automatisierten Navigationsnachweis; tatsächliches Mausgefühl, komplexe Skelett-/Hautqualität und große reale Modelle bleiben manuell zu prüfen. Keine Änderung am Kameraalgorithmus.

## Nachtrag zum Startabbruch

Am 28.10.2026 bestätigte der Repository-Inhaber das aufgebrauchte Actions-Kontingent. Die zuvor nicht aus den Jobdaten erkennbare Ursache ist damit geklärt. Die Korrektur des Mausnavigationstests bleibt ohne erfolgreichen Bestätigungslauf; weder ein erneuter Push noch eine Wiederholung bei unverändertem Kontingent liefert diesen Nachweis.
