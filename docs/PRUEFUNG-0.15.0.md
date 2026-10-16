# Prüfung 0.15.0

Datum: 16.10.2026. Software 0.15.0; Projektformat unverändert 1.

- `npm test`: **84 bestanden**, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Produktionsbuild bestanden. JS-Bundle 1.234,82 kB, gzip 337,80 kB; bestehende Vite-Größenwarnung bleibt.
- Erhaltungsprüfung im Testlauf: 83 Originaldateien einschließlich 72 Transformationsbildern unverändert.
- Acht neue Discovery-Tests: tatsächlicher lokaler HTTP-Testserver mit Ollama-/OpenAI-Antwortformaten, Header, URL-Regeln, Fehler-/Antwortgrenzen, Timeout/Abbruch und DOM-Lebenszyklus. Keine Live-Abnahme eines echten Ollama-, LM-Studio- oder Cloud-Kontos.
- Sieben neue Setup-Tests: NVIDIA-Messdaten, VRAM/RAM/Platte, unbekannte Hardware, CPU-Opt-in, Manifest-/Pull-Protokoll und Laufzeitprüfung mit API-Testdoubles. 32-GiB-Modell auf 16-GiB-VRAM wird trotz großem RAM ausgeschlossen.
- Zusätzlicher Rollen-Test: jede Rolle kann sowohl lokales als auch Cloud-Profil verwenden, sofern der Testadapter die erforderliche Fähigkeit bestätigt. Kein Beweis für die Fähigkeiten realer Modelle.

Die Registry-Metadaten für einen kuratierten Tag wurden während der Entwicklung erfolgreich gelesen; das ersetzt keinen echten Modelllauf. Keine Gewichte heruntergeladen, kein echter GPU-Ladetest und keine qualitative Modellfreigabe. Der Helfer führt solche lokalen Basistests erst beim Nutzer nach dessen Bestätigung aus. Die zwei einfachen Werkzeugtests decken weder Bildverständnis noch komplexe Studio-Aufgaben ab.

DOM-Tests ersetzen keine visuelle WebGL-/Mausprüfung. Python-/MQTT-Integration und Original-Testprogramme wurden in diesem Meilenstein nicht erneut ausgeführt; ihre letzten Nachweise bleiben im allgemeinen Prüfstand vermerkt. Native Cloud-Adapter, OAuth, geschützte dauerhafte Schlüsselablage sowie echte Generator-/Rigging-Aufträge sind weiterhin offen.

[Prüfstand](PRUEFUNG.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)
