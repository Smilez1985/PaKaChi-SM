# Prüfung 0.19.0

16.10.2026. 108 Tests bestanden; TypeScript und Produktionsbuild bestanden. Bestehende Vite-Bundlewarnung bleibt. Original-Erhaltungsprüfung weiterhin bestanden.

Sechs neue Tests verwenden echte Web Crypto (AES-GCM/PBKDF2), keine Kryptografie-Testdoubles: verschlüsselter Roundtrip, frische Zufallswerte, keine sichtbaren Klartextschlüssel/Passwörter in der Ablage, falsches Passwort, manipulierte Chiffretexte, unbekannte Versionen, Eingabegrenzen, Erhalt unbekannter Schlüssel, ausdrückliche Löschung, Endpunktwechsel, Speicherfehler und veraltete Operationen. DOM-Prüfungen testen Passwortbestätigung, Leeren beim Dialogschluss und tatsächliches Entsperren eines vorher gespeicherten Schlüssels in der Profiloberfläche.

Keine echte Cloud-Anfrage, keine Benutzerzugangsdaten und keine Modellinferenz. Keine unabhängige kryptografische Sicherheitsprüfung oder visuelle Browserabnahme. Web-Crypto-Verfahren werden durch die Plattformbibliothek ausgeführt. Sitzungsschlüssel bleiben während der Nutzung im Arbeitsspeicher. Kein Schutz gegen schädlichen Code im entsperrten Browser, keine Passwortwiederherstellung und keine automatische Browser-/Gerätesynchronisierung.

Die Profilkonfiguration bleibt kompatibel; der optionale Tresor hat einen eigenen versionierten Speicherbereich. Python-/MQTT-Integration wurde nicht erneut ausgeführt.

[Anleitung](ANBIETER.md#optionaler-schlüsseltresor-seit-0190) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)
