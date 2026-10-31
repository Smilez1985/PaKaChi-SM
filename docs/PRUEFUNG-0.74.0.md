# Prüfbericht 0.74.0

Zeitstempel: 2026-10-31T02:45:35+01:00 (Europe/Berlin)

Umhängen unter gemeinsam gleichmäßig, ungleichmäßig und negativ skaliertem Vorfahren geprüft: unveränderte Hautgeometrie und Weltmatrizen starrer Anbauteile in Grundpose und gedrehter Pose; Entwurf, Projektvalidierung, Rekonstruktion und Quellwiederherstellung. Nicht invertierbare gemeinsame Skalierung lässt Daten und Hierarchie unverändert. Bestehende Schutzregeln für Skalierungen auf unterschiedlichen Ästen bleiben getestet.

Keine gerenderte Haut-/Bewegungsabnahme und keine Unterstützung unterschiedlicher Astskalierungen. Keine Actions gestartet; main unverändert.

`npm run verify`: **308 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen. Danach nur Versionsnummer und Dokumentation angepasst.
