# Prüfbericht 0.51.0

**0.51.0:** Zwei Chromium-Fälle für Assistenten-Vorschlag → ausdrückliche Übernahme → Undo bei `insert_bone` und `delete_bone`. Sie prüfen unveränderte Revision/Geometrie vor Zustimmung und Wiederherstellung der Gelenkdaten nach Undo. Antworten des Anbieters sind simuliert. Build bestanden, 14 Browserfälle aufgelistet; neuer CI-Nachweis steht aus. Der vorherige Stand 0.50.0 besteht seine [CI-Prüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771).

Der bisherige Node-Testbestand umfasst 249 Tests. Die beiden neuen Fälle verwenden Mika und den echten Assistentendialog mit simuliertem Ollama-Transport. Sie lesen zunächst Gelenke und schlagen danach genau einen revisionsgebundenen Eingriff vor. Prüfung: keine Änderung vor Übernahme, ein Revisionsschritt nach Übernahme, erwartete Gelenkzahl, Wiederherstellung sämtlicher Gelenkdaten nach Undo und keine JavaScript-Seitenfehler.

Keine neue reale Anbieter-, Python-MCP-Host- oder manuelle Hautabnahme.
