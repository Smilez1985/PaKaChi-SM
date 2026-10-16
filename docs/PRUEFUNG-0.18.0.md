# Prüfung 0.18.0

16.10.2026. 102 Tests bestanden; TypeScript und Produktionsbuild bestanden. Bestehende Vite-Bundlewarnung bleibt. Original-Erhaltungsprüfung weiterhin bestanden.

Fünf neue Tests prüfen unabhängige Rollenrouten und ihre Speicherung, alte Konfigurationen ohne Fallbacks, doppelte/ungültige Referenzen, Profilentfernung, Schlüsseltrennung nach Profil und Endpunkt, tatsächliche Assistenten-Reihenfolge mit richtigem Schlüssel, Abbruch/Studio-Konflikte ohne Fallback und DOM-Profilwechsel einschließlich bearbeiteter Modell- und Schlüsselentwürfe. Bestehende Tests wurden an die ausdrücklich geänderte Anforderung angepasst: Dialogschluss und Profilwechsel dürfen Schlüssel nicht mehr löschen.

Fallback-Ausführung wurde mit Testadaptern geprüft, keine echten Konten verwendet. Generator-/Rigging-Routen sind konfigurierbar, ihre Fachausführung fehlt weiterhin. Schlüssel sind nur im Arbeitsspeicher der Seitensitzung und nicht über Neuladen hinweg erhalten. Profil-/Routenkonfiguration ist dauerhaft im Browserspeicher. Keine visuelle Browser-, echte Modell- oder neue Python-/MQTT-Abnahme.

[Anbieter](ANBIETER.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)
