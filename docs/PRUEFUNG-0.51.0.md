# Prüfbericht 0.51.0

**0.51.0:** Zwei Chromium-Fälle für Assistenten-Vorschlag → ausdrückliche Übernahme → Undo bei `insert_bone` und `delete_bone`. Sie prüfen unveränderte Revision/Geometrie vor Zustimmung und Wiederherstellung der Gelenkdaten nach Undo. Antworten des Anbieters sind simuliert. 249 Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40113222944)). Der vorherige Stand 0.50.0 besteht seine [CI-Prüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771).

Der bisherige Node-Testbestand umfasst 249 Tests. Die beiden neuen Fälle verwenden Mika und den echten Assistentendialog mit simuliertem Ollama-Transport. Sie lesen zunächst Gelenke und schlagen danach genau einen revisionsgebundenen Eingriff vor. Prüfung: keine Änderung vor Übernahme, ein Revisionsschritt nach Übernahme, erwartete Gelenkzahl, Wiederherstellung sämtlicher Gelenkdaten nach Undo und keine JavaScript-Seitenfehler.

Keine neue reale Anbieter-, Python-MCP-Host- oder manuelle Hautabnahme.

Geprüfter Commit: `6e18e9edb36e99f7f6c4d8961097ffdd8c5e97bd`. GitHub Actions bestätigt 249 bestandene Node-Tests (0 fehlgeschlagen), erfolgreichen Produktionsbuild und 14 bestandene Chromium-Fälle in 3,4 Minuten. Beide Fälle in `assistant-bones.spec.ts` wurden ausgeführt. Browserbelege wurden im selben Lauf als Artefakt hochgeladen.
