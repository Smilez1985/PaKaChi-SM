# Prüfbericht 0.76.0

Zeitstempel: 2026-11-04T14:54:49+01:00 (Europe/Berlin)

Eigene Skalierung des umgehängten Knochens geprüft: gleichmäßig, ungleichmäßig, Spiegelung an X/Y/Z und an zwei Achsen. Hautgeometrie und Weltmatrizen starrer Anbauteile bleiben in Grundpose und gedrehter Pose erhalten. Gespeicherte Posen, Entwurf, Projektvalidierung, Rekonstruktion und Quellwiederherstellung einschließlich exakter Quellskalierung geprüft. Nicht invertierbare Skalierung lässt Daten und Hierarchie unverändert.

Keine gerenderte Haut-/Bewegungsabnahme. Ungleiche oder nicht gleichmäßige Elternastskalierungen bleiben ausgeschlossen. Keine Actions gestartet; main unverändert.

`npm run verify`: **312 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen. Danach nur Versionsnummer und Dokumentation angepasst.
