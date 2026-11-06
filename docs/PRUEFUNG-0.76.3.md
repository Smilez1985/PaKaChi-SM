# Prüfbericht 0.76.3

Zeitstempel: 2026-11-07T00:47:32+01:00 (Europe/Berlin)

## Ausgangsnachweis

[Lauf 42268949543](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42268949543) für 0.76.2: 312 Node-Tests, TypeScript/Build und alle 23 Chromium-Fälle bestanden. Das Navigationsartefakt wurde angesehen; Optionen-Text und Fokus sind erkennbar.

## Scrollprüfung

Neuer Fall mit 1440 × 1000 und 1280 × 600: Zum Posenfeld scrollen, haftende Vorschau am oberen Rand und vollständig im Fenster prüfen; echte Mausradereignisse müssen die Kamera ändern, ohne gespeicherten Studio-Zustand zu ändern. Bei 390 × 844 bleibt die Vorschau im Dokumentfluss, und das Posenfeld lässt sich ohne Überdeckung erreichen und beschreiben. Laufzeitfehler werden erfasst.

Artefakte: `studio-scrolled-1000.png`, `studio-scrolled-600.png`, `studio-mobile-controls.png`. Der endgültige Status des jeweiligen Commits und die Artefakte sind in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verknüpft. Kein Nachweis für subjektives Mausgefühl oder allgemeine Haut-/IK-Qualität.
