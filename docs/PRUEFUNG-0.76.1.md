# Prüfbericht 0.76.1

Zeitstempel: 2026-11-05T09:17:35+01:00 (Europe/Berlin)

[Lauf 41992106544](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/41992106544) für 0.76.0: 312 Node-Tests und Build bestanden, 20/22 Chromium-Fälle bestanden. Beide Fehlschläge in `local-zoo.spec.ts` sind Strict-Mode-Verletzungen desselben Selektors mit zwei Statusfeldern. Mausnavigation bestanden.

Korrektur: `zoo-operation-status` und `zoo-sync-status` unterscheiden Vorgangsergebnis und Listenwarnung. Die Speicherbestätigung wird gezielt geprüft; die weiteren Assertions für Reload, Posen, Moves und getrennte Tabs bleiben erhalten.

Der korrigierte Stand wird durch den vollständigen Workflow in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) geprüft. Maßgeblich sind die Checks am jeweiligen Commit, nicht ein früherer grüner Lauf. Manuelle visuelle Abnahme bleibt offen.
