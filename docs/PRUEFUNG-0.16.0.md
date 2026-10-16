# Prüfung 0.16.0

Datum: 16.10.2026. Projektformat unverändert 1.

- `npm test`: **92 bestanden**, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Produktionsbuild bestanden; weiterhin Vite-Warnung zum gemeinsamen Bundle über 500 kB.
- Bestehende Erhaltungsprüfung bestätigt 83 unveränderte Originaldateien einschließlich 72 Transformationsbildern.
- Acht neue Assistententests prüfen Ollama-/OpenAI-kompatible Anfrage- und Antwortformate, Werkzeugantworten, keine automatische Mutation, Header statt persistierter Schlüssel, unbekannte Werkzeuge/Argumente, erfundene Revisionen, abgeschnittene Antworten, fünf-Runden-Grenze, veränderten Studio-Stand, unsichere Schlüsselübertragung, Timeout/Abbruch und verspätete Antworten.
- DOM-Prüfungen bestätigen ausdrückliches Senden, Darstellung als Text, einmalige Übernahme und Verwerfen von Antworten/Schlüsseln bei Profilwechsel.
- Bestehende Studio-Tests prüfen weiterhin Freigabe, Revision und Undo des verwendeten Editorwegs. Ein bei der Profilbenachrichtigung entdeckter DOM-Ereignisfehler wurde behoben und der vollständige Testlauf wiederholt.

Keine Modellgewichte geladen, keine API-Schlüssel verwendet und keine reale Modellinferenz ausgeführt. HTTP-Antworten der Assistententests sind Testdoubles. Echte Modellqualität, Cloud-/CORS-Kompatibilität und visuelle Browserbedienung sind noch abzunehmen. Die vorhandene Python-/MQTT-Integration wurde in diesem Meilenstein nicht erneut ausgeführt.

Die Änderungsvorschau ist eine konkrete JSON-Befehlsanzeige, keine simulierte 3D-Vorschau. Ein Vorschlag wird erst mit ausdrücklicher Übernahme und gültiger Studio-Freigabe ausgeführt. Der Generator-/Rigging-Auftragskern bleibt separat und erhält durch diesen Meilenstein keinen produktiven Fachadapter.

[Prüfstand](PRUEFUNG.md) · [Assistent](ASSISTENT.md) · [Changelog](CHANGELOG.md)
