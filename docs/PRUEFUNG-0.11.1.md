# Prüfstand 0.11.1

- `npm test`: 49 Tests bestanden. Zwei neue Regressionstests prüfen Drehung um die gesamte Modellmitte bei versetztem Zoom-/Pan-Ziel, erhaltenen Kameraabstand und Bildausschnitt, Modellverschiebung sowie einen festen Drehpunkt pro Geste. Die Integrationsprüfung verwendet echte ArcballControls und DOM-Pointerereignisse.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung bleibt bestehen (rund 1,14 MB / 309 kB gzip).
- Alle 83 Originaldateien einschließlich 72 Transformationsbildern sind unverändert (reguläre Erhaltungsprüfung).
- Keine erneute gerenderte WebGL-Abnahme; die Korrektur muss im Browser nachgeprüft werden. Python-Prozessintegration zuletzt in 0.10.0, Original-Testprogramme in 0.9.0.

Manuell nachprüfen: Mika öffnen, über einer Schulter zoomen, rechts ziehen und danach mit gedrücktem Mausrad drehen. Die ganze Figur soll um ihre Mitte rotieren und der Bildausschnitt ohne Sprung erhalten bleiben. Nach Gesamtverschiebung der Figur erneut prüfen.
