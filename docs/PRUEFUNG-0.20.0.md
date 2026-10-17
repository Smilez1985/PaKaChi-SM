# Prüfung 0.20.0

17.10.2026. 113 Tests bestanden; TypeScript und Produktionsbuild bestanden. Bestehende Vite-Bundlewarnung bleibt. Original-Erhaltungsprüfung unverändert bestanden.

Fünf zusätzliche Tests gegenüber 0.19.0: Passwortwechsel mit echter Web Crypto, Erhalt mehrerer gespeicherter Schlüssel, Ablehnung des bisherigen Passworts nach Wechsel, falsches Passwort/Schreibfehler/veraltete Operationen, UI-Bestätigung und Leeren von Passwortfeldern; dazu Integration der Sitzungssperre mit Profilverwaltung und Assistent. Geprüft sind Schlüsselentwürfe, Erhalt der Modell-/Profilkonfiguration und verschlüsselter Ablage, abgebrochene Anfrage, verworfene späte Vorschläge und erneutes Entsperren nach invalidierter laufender Entsperrung.

Keine echten Anbieteranfragen oder Kosten. Kein unabhängiges Sicherheitsaudit und keine visuelle Browserabnahme. Eine Sperre kann bereits gesendete Serveranfragen nicht zurücknehmen. Keine Garantie physischer Löschung sämtlicher JavaScript-Speicherkopien; die aktuelle Seite entfernt den verwendbaren Schlüsselzustand. Andere Tabs werden nicht gesperrt. Ungespeicherte Schlüssel gehen verloren; gespeicherte bleiben verschlüsselt erhalten.

[Anleitung](ANBIETER.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)
