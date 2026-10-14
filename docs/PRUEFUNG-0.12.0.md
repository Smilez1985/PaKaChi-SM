# Prüfstand 0.12.0

- `npm test`: 53 Tests bestanden, davon vier neue Tests für lokale Generierungsabläufe, Fehlerberichte, getrennte Ausgaben und echte GLB-Ladung über den produktiven Player-Lader. Backend-Aufrufe sind Testdoubles; die Geometrie ist synthetisch.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung unverändert.
- `npm run generate:model -- --check`: tatsächlich ausgeführt; Exitcode 2/ready=false. Python vorhanden, aber torch/tsr/rembg/xatlas/torchmcubes fehlen; keine verfügbare CUDA-Laufzeit. Keine Generierung gestartet.
- Originaldateien unverändert: reguläre Prüfung aller 83 Dateien einschließlich 72 Transformationsbildern.
- Python-MCP-Integration zuletzt in 0.10.0, Original-Testprogramme in 0.9.0 bestanden.

Kein echter TripoSR-Inferenzlauf, kein erzeugter Original-PaKaChi in 3D, kein Qualitätsvergleich, kein automatisches Rigging und keine WebGL-Abnahme. Die 0.12.0-Teststrecke schafft die Voraussetzungen zur späteren Messung; sie ersetzt deren Nachweis nicht.
