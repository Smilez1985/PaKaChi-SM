# Prüfbericht 0.52.0

**0.52.0:** Zwischengelenke lassen sich über einen Mausregler bei 10–90 % der vorhandenen Knochenstrecke einfügen (vom Elternknochen zum ausgewählten Kind; Standard 50 %). Assistent und beide MCP-Server unterstützen dafür optional `ratio`. Vorhandene Posen, Gewichtsverteilung, Projektpersistenz und Undo/Redo bleiben berücksichtigt. 251 Node-Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40134452209)). Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.

Geprüft: Positionen 10/30/90 %, unveränderte Grundgeometrie und posierte Endpunkte, identische Gewichte nach Rekonstruktion; UI- und Agentenpfad mit 30 %, Undo/Redo sowie Ablehnung ungültiger Werte. Node-MCP transportiert den Parameter; Python-Syntax kompiliert. Zwei bestehende Browserfälle wurden für 30 % erweitert (UI/Dateiaustausch und Assistent/Zustimmung).

Geprüfter Commit: `1ac8978d32c7cbc4bd98bb4ad148d0da1f85ead0`. GitHub Actions: 251 Tests, 0 Fehler; Build erfolgreich; alle 14 Chromium-Fälle in 2,7 Minuten bestanden. Browserbelege wurden als Artefakt hochgeladen.
