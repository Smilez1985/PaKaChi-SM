# Prüfung 0.17.0

Datum: 16.10.2026. Projektformat weiterhin 1.

- `npm test`: 97 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bestehende Warnung zum großen gemeinsamen Bundle bleibt.
- Original-Erhaltungsprüfung weiterhin bestanden: 83 Dateien einschließlich 72 Transformationsbildern unverändert.
- Fünf neue Anthropic-Tests: unabhängige Rollen/Profile, Endpunktpräfixe, native Authentifizierungsheader, vollständige Modelllisten, Werkzeughin-/rückweg einschließlich Thinking-Blöcken, keine automatische Mutation, Fehlerkennzeichnung und Abweisung unbekannter/abgeschnittener/mehrfacher Werkzeugantworten.

Tests verwenden Fetch-/RPC-Testdoubles. Keine API-Schlüssel benutzt, keine echte Cloud-Anfrage und keine Kosten ausgelöst. Kein Nachweis für tatsächliche Modellqualität oder Konto-/Browser-CORS. Bestehende Assistenten-, DOM- und Studio-Tests wurden im vollständigen Lauf erneut ausgeführt. Python-/MQTT-Liveintegration und visuelle Browserabnahme wurden nicht wiederholt.

Die native Schnittstelle ersetzt keine Fachverfahren für 3D oder Rigging. Profilzuordnung bleibt für alle Rollen möglich; ausgeführt wird derzeit nur der Assistent. OAuth, Workspace-Auswahl, vollständige Pagination und geschützte dauerhafte Schlüsselablage bleiben offen.

[Anbieter](ANBIETER.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)
