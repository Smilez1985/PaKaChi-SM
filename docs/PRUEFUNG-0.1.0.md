# Prüfung von 0.1.0

Datum: 13.10.2026

## Bestanden

- TypeScript-Prüfung und Vite-Produktionsbuild.
- Katalogvalidierung, reale Clip-Zuordnung und Unterdrückung fehlender Fähigkeiten.
- Animationssteuerung: Schleifen, einmalige Moves, Rückkehr zur Grundbewegung, Pause, Tempo, Scrubbing und erneutes Abspielen.
- Wiederhergestellter Originalplayer: vorhandene Tests für Formwechsel, Halten, Richtungswechsel, ungültige Nachrichten sowie MQTT-Opt-in und Wiederverbindung.
- SHA-256-Abgleich aller 83 Originaldateien aus dem wiederhergestellten ZIP, einschließlich exakt 72 PNG-Frames.

## Grenzen

- Die Browser-Abnahmetests sind hinterlegt, konnten in dieser Ausführungsumgebung aber nicht ausgeführt werden: Chromium scheitert beim Start an einer gesperrten Betriebssystem-Socket-Funktion. Es gibt daher noch keine bestätigte visuelle Browserabnahme oder Mobilprüfung.
- Kein Test gegen einen echten NanoMQ-Broker. Die vorhandenen Legacy-Tests verwenden Testgegenstellen beziehungsweise simulierte Verbindungen.
- Kein Windows-Installer; die Windows-Startdatei wurde hier nicht auf Windows ausgeführt.
- Der Build meldet einen Größenhinweis zum Three.js-Bundle, keinen Buildfehler.
- PaKaChi-Bildanimation bleibt der erhaltene Entwurf mit bekannten visuellen Mängeln; eine neue 3D-Version ist noch nicht erstellt.

Lokale Browserprüfung: `npx playwright install chromium`, anschließend `npm run test:e2e`.
