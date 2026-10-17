# Prüfbericht 0.21.0

Zeitstempel: 2026-10-17T12:07:48+02:00

## Ergebnis

- `npm test`: 118 Tests bestanden, keine Fehler oder übersprungenen Tests. Einschließlich bytegenauem Erhalt der 83 Originaldateien und 72 Transformationsbilder.
- `npm run build`: TypeScript-Prüfung und Produktionsbuild bestanden. Bekannte Vite-Warnung zum gemeinsamen Bundle bleibt bestehen.
- Neun gezielte Generatortests bestanden: vier bisherige Wrapperprüfungen und fünf neue Dienst-/Adapterprüfungen.

## Neuer Nachweis

Der Test öffnet einen tatsächlichen HTTP-Server auf IPv4-Loopback. Der produktive Browseradapter fragt Fähigkeiten ab und sendet Bildbytes. Der Dienst ruft den bestehenden Generator-Wrapper auf; nur dessen Python-Umgebungsprüfung und Inferenzprozess werden ersetzt. Eine gültige synthetische GLB wird durch den echten GLTFLoader geprüft, an den Auftragskern geliefert und dort erneut geprüft. Ein veralteter Zielstand verhindert die Übernahme. Quellenbytes bleiben erhalten und temporäre Uploaddaten werden entfernt.

Weitere Fälle: fehlendes Token, falscher Origin/Host, enge CORS-Vorabprüfung, falsche Bildsignatur, generische Backendfehler ohne Detailleck, belegter Generator und Verbindungsabbruch mit Signal am Backend. Adapter weist entfernte Ziele, falsche Modelle/Rollen, übergroße deklarierte Antworten, falschen Medientyp und ungültige GLB ab. Echte Node-Unterprozesse prüfen Abbruch, Zeitlimit und normalen Abschluss.

## Grenzen

Kein TripoSR-/GPU-Lauf, kein Original-PaKaChi als 3D-Ergebnis und keine Qualitäts- oder Rigging-Abnahme. Das synthetische Dreieck belegt den Transport und die Prüfstrecke, keine generative Leistung. Keine gerenderte WebGL-Prüfung oder reale Browser-CORS-Abnahme. Der Adapter ist noch nicht in einer sichtbaren Generierungsoberfläche registriert. Prozessabbruch ist für den direkten Unterprozess geprüft, nicht für beliebige Kindprozessbäume. Kein Cloud-Generator, keine automatischen Geometrie-Fallbacks.
