# Prüfbericht 0.27.0

Zeitstempel: 2026-10-18T13:47:58+02:00 (Europe/Berlin)

- `npm test`: 154 Tests bestanden, einschließlich Originaldatei-Erhaltung.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlegrößenwarnung bleibt bestehen.
- Fünf neue Dateiformattests: nur verwendete Posen, Reihenfolge und Wiederholungen, Prüfhinweise, Gesamtspuren; neue IDs und Schlagwortkonflikte; Modell-/Punkt-/Verbindungsgrenzen gegenüber kosmetischen Änderungen; ungültige Versionen/Daten und Gesamtkapazität; Einzelpose mit mehrfacher Referenz. Web Crypto berechnet echte SHA-256-Werte.
- Zwei neue Editorprüfungen mit happy-dom und Three.js: Import als einzelne Änderung mit Undo/Redo, unveränderter aktueller Pose und ohne Wiedergabestart; Ablehnung nach manueller Änderung, Ziehbeginn, Verlassen oder Dispose während des Hashens.
- Kein echter Dateidialog-/Downloadtest, keine gerenderte Bewegungsvorschau und kein Retargeting-Nachweis. Browserstart war zuvor durch einen verbotenen Socket-Systemaufruf blockiert; nicht erneut versucht. GPU-/Anbieterabnahme bleibt offen.
