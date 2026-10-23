# Prüfstand und Abnahme

**Softwarestand: 0.46.0 · Dokumentationsabgleich: 23.10.2026.**

## Nachgewiesen

| Prüfung | Letzter Nachweis | Umfang und Grenze |
| --- | --- | --- |
| `npm test` | 0.45.0: 237 Tests bestanden | Player, Router, Studio-Daten, reale Three.js-Geometrie, DOM/Ereignisse mit happy-dom, Node-MCP und Erhaltungsprüfung. Kein gerenderter Browser. |
| `npm run test:e2e` | 0.45.0: 9 Chromium-Fälle bestanden | GitHub-Runner mit Software-WebGL; simulierte Anbieter, keine manuelle Maus-/KI-Qualitätsabnahme. |
| `npm run test:legacy` | 0.9.0: beide Programme bestanden | Originalplayer-Steuerung, MQTT-Verhalten und Lebenszyklus. |
| `npm run build` | 0.45.0: bestanden | TypeScript und Produktionsbuild; Vite meldet weiterhin das große gemeinsame JS-Bundle (rund 1,33 MB / 369 kB gzip). |
| `npm run test:python` mit `PAKACHI_PYTHON` | 0.10.0: Integration bestanden | Echter Python-MCP-Prozess, eingebetteter aMQTT-Broker, produktiver MQTT-Client, Router und Studio-Editor. Acht Tools, Studio-Änderungen einschließlich gültiger/ungültiger Skalierung, fehlende Freigabe und Revisionskonflikte geprüft. |
| Originaldateien | 0.45.0: bytegenau erhalten | 83 wiederhergestellte Dateien einschließlich exakt 72 Transformationsbildern. |

Vier neue Tests in 0.11.0 prüfen Hand-/Fußziele, feste Knochenabstände, den ganzen erkannten Körper, Hals/Kopf und Rumpf, tatsächliche Hautverformung, gespeicherte Posen sowie direktes Ziehen/Drehen mit Undo. Nutzertest von 0.10.0 meldete auseinanderziehbare Knochen und Probleme mit der Ausrichtung; die visuelle Nachprüfung der Korrektur 0.11.0 steht aus.

## Noch nicht abgenommen

- Manuelle Prüfung der WebGL-Darstellung und des tatsächlichen Mausgefühls. Automatisierte Chromium-Fälle laufen auf GitHub mit Software-WebGL; lokal bleibt der Browserstart blockiert.
- Vollständiger Ablauf in einem konkreten externen KI-/MCP-Host sowie Anbindung eines externen NanoMQ-Brokers.
- Gesamter Bedienablauf mit Nutzern ohne 3D-Vorkenntnisse und die Verträglichkeit unterschiedlich aufgebauter Importmodelle.
- Lokale KI-Generierung ist an die Oberfläche angeschlossen, besitzt aber noch keine echte GPU-/Qualitätsabnahme. Vollständiger Knochenumbau und Optimierung bleiben Entwicklungsziele.

## Visuelle Abnahme durchführen

1. Original-PaKaChi öffnen und beide Formen sowie die Transformation prüfen.
2. Mika/Nori und eine eigene GLB öffnen; Kamera mit gedrücktem Mausrad drehen, auch zur Rück-/Unterseite, rechts verschieben und per Mausrad bis ins Gesicht zoomen. Inversion in den Optionen prüfen.
3. Gesichtspunkte setzen, verkleinern, direkt ziehen, verbinden und eine einzelne Verbindung entfernen; Zurück/Wiederholen prüfen.
4. Vorhandene Skelettgriffe/Verbindungen erneut erkennen; bei einem Modell ohne Skelett den zutreffenden Hinweis prüfen.
5. Gelenkpose und Gesamtverschiebung, Drehung und Größenänderung aufnehmen, Move abspielen, Projekt speichern und neu laden. Auch ein knochenloses Modell verwenden.
6. Deutsch/English umschalten und kontrollieren, dass eigene Namen erhalten bleiben.
7. Im Player einen eigenen Move über den eingerichteten Agenten auslösen; im Studio muss derselbe Steuerbefehl abgewiesen werden.

Diese Liste beschreibt ausstehende Prüfungen, keine bereits erzielten Ergebnisse.

## Historische Berichte

[0.1.0](PRUEFUNG-0.1.0.md) · [0.2.0](PRUEFUNG-0.2.0.md) · [0.3.0](PRUEFUNG-0.3.0.md) · [0.4.0](PRUEFUNG-0.4.0.md) · [0.5.0](PRUEFUNG-0.5.0.md) · [0.6.0](PRUEFUNG-0.6.0.md) · [0.7.0](PRUEFUNG-0.7.0.md) · [0.8.0](PRUEFUNG-0.8.0.md) · [0.9.0](PRUEFUNG-0.9.0.md)

[Prüfbericht 0.10.0](PRUEFUNG-0.10.0.md)

[Prüfbericht 0.11.0](PRUEFUNG-0.11.0.md)

Nutzerrückmeldung zu 0.11.0: Mitteltasten-Drehung nach Zoom/Pan um Schulter statt Figurenmitte. In 0.11.1 korrigiert und mit Kamera-Mathematik sowie tatsächlichen ArcballControls/DOM-Pointerereignissen geprüft. Visuelle Nachprüfung bleibt offen. [Prüfbericht 0.11.1](PRUEFUNG-0.11.1.md).

[Prüfbericht 0.12.0](PRUEFUNG-0.12.0.md): Generierungsadapter mit Testdoubles geprüft; reale Inferenz und Original-PaKaChi-3D weiterhin offen.

[Prüfbericht 0.13.0](PRUEFUNG-0.13.0.md): Profilverwaltung und interne Fähigkeitsprüfung bestanden; echte Anbieteranbindung und visuelle Optionsdialog-Abnahme stehen aus.

[Prüfbericht 0.14.0](PRUEFUNG-0.14.0.md): Interner Auftragskern mit simulierten Adaptern und Übernahmetransaktionen geprüft; keine echte Anbieter-/Studio-Integration.

[Prüfbericht 0.15.0](PRUEFUNG-0.15.0.md): Modelllisten, Sitzungsschlüssel, Hardwarebudgets und freie Wahl für alle Rollen; echte Modellinferenz weiterhin nicht abgenommen.

[Prüfbericht 0.16.0](PRUEFUNG-0.16.0.md): begrenzter Assistentenablauf, Protokolle und DOM mit Testdoubles geprüft; echte Modell-/Cloud-Abnahme offen.

[Prüfbericht 0.17.0](PRUEFUNG-0.17.0.md): native Anthropic-Protokolle mit Testdoubles geprüft; echte Kontoabnahme offen.

[Prüfbericht 0.17.1](PRUEFUNG-0.17.1.md): Anbieter-Einrichtung, 14 relevante Tests und DOM-Bedienprüfung bestanden; Build geprüft. Letzter vollständiger Testlauf weiterhin 0.17.0.

[Prüfbericht 0.18.0](PRUEFUNG-0.18.0.md): Mehranbieterprofile, erhaltene Sitzungsschlüssel und unabhängige Fallback-Routen geprüft.

[Prüfbericht 0.19.0](PRUEFUNG-0.19.0.md): Schlüsseltresor mit echter Web Crypto und Profiloberfläche geprüft.

Zwischenprüfung vor 0.20.0 (17.10.2026): Acht Tresortests einschließlich zweier neuer Passwortwechsel-Prüfungen und Produktionsbuild bestanden. Kein erneuter vollständiger Testlauf oder unabhängiges Sicherheitsaudit für diese Ergänzung.

[Prüfbericht 0.20.0](PRUEFUNG-0.20.0.md): Passwortwechsel und Sitzungssperre zusammen geprüft; 113 Tests und Build bestanden.

[Prüfbericht 0.21.0](PRUEFUNG-0.21.0.md): echter lokaler Generatortransport mit synthetischem Inferenzbackend; keine GPU-/Qualitätsabnahme.

[Prüfbericht 0.22.0](PRUEFUNG-0.22.0.md): Bildauswahl, Vorschau-Lebenszyklus, Importfreigabe und Sperren geprüft; Playwright-Start wegen fehlender Chromium-Datei blockiert.

[Prüfbericht 0.23.0](PRUEFUNG-0.23.0.md): Modellwechsel-Verlauf, vollständige Projektaufnahme und frühzeitige Geometrieabweisung geprüft; gerenderte Browserabnahme bleibt offen.

[Prüfbericht 0.24.0](PRUEFUNG-0.24.0.md): fünf neue Vorbereitungs-/Rollbacktests. Zwei Playwright-Tests vor Anwendungsstart blockiert: Chromium vorhanden, `socket() failed: Operation not permitted`.

[Prüfbericht 0.25.0](PRUEFUNG-0.25.0.md): Generator-Fallbacks nur vor Ausführung, bewusster nächster Auftrag und profilbezogene Schlüssel. 140 Tests und Build bestanden; Browser-/GPU-Abnahme weiterhin offen.

[Prüfbericht 0.26.0](PRUEFUNG-0.26.0.md): lokale Projektkopien und Sammlung; DOM und Transaktions-Testdouble geprüft, echte IndexedDB-Browserabnahme ausstehend.

[Prüfbericht 0.27.0](PRUEFUNG-0.27.0.md): Move-Dateien mit realer SHA-256-Berechnung, Kompatibilitätsprüfung, Editor-Undo/Redo und Race-Schutz; gerenderte Browserabnahme ausstehend.

[Prüfbericht 0.28.0](PRUEFUNG-0.28.0.md): gemeinsamer Katalog, Metadatenvalidierung, gespeicherte Ladeidentität und Sitzungsreste nach Löschen geprüft; Browser-/MCP-Liveabnahme offen.

[Prüfbericht 0.29.0](PRUEFUNG-0.29.0.md): Exportpaket, realer CLI-Prozess, GLB-Roundtrip, relative Katalogpfade und begrenzte Projektabrufe geprüft; gerenderter Veröffentlichungsablauf offen.

[Prüfbericht 0.30.0](PRUEFUNG-0.30.0.md): sechs neue Tests mit echten Dateien und CLI-Prozess für Zusammenführung, Konflikte, Quellenprüfung und Überschreibschutz. 171 Tests und Build bestanden; visuelle Veröffentlichung weiterhin offen.

[Prüfbericht 0.31.0](PRUEFUNG-0.31.0.md): sieben neue Tests für Move-Katalog, begrenztes Laden, echten CLI-Export, Editor-Undo und veraltete Downloads. 178 Tests und Build bestanden; gerenderte Bedienabnahme offen.

[Prüfbericht 0.32.0](PRUEFUNG-0.32.0.md): sieben neue Tests mit tatsächlichen Dateien/CLI, Strukturprüfung, Konflikten, Größenlimit und erhaltenen Modellbindungen. 185 Tests und Build bestanden; gerenderte Abnahme offen.

[Prüfbericht 0.33.0](PRUEFUNG-0.33.0.md): sieben neue Tests für Beugegrenzen, echte Mika-/Nori-Geometrie, Editor-Undo, Datenprüfung und Export; Node-MCP-Test um Setzen/Entfernen erweitert. 192 Tests und Build bestanden. Python-Datenmodell separat geprüft; kein neuer Python-MCP-Livelauf oder gerenderter Browser.

[Prüfbericht 0.34.0](PRUEFUNG-0.34.0.md): fünf neue Tests für lesende Posenprüfung, Grenzfälle, Skalen-/Rotationsraum, UI-Bericht und tatsächliches Mika-Modell. 197 Tests und Build bestanden; Zwischenbilder, Kollisionen und gerenderte Abnahme offen.

[Prüfbericht 0.35.0](PRUEFUNG-0.35.0.md): fünf neue Tests zu Zwischenverletzungen, Zeitplan/Schleifen, Abbruch, veralteten Ergebnissen und UI-Bericht. 202 Tests und Build bestanden; kontinuierliche Garantie und gerenderte Abnahme offen.

[Prüfbericht 0.36.0](PRUEFUNG-0.36.0.md): vier neue Tests für exakte pausierte Inspektion, Wiederherstellung, Posenübernahme/Undo und den tatsächlichen DOM-Ablauf vom Bericht. 206 Tests und Build bestanden; gerenderte Abnahme offen.

[Prüfbericht 0.37.0](PRUEFUNG-0.37.0.md): vier neue Tests zu isolierter Sequenzänderung, Export/Undo, Grenzen, Mausbedienung und übernommenen Prüfposen. 210 Tests und Build bestanden; gerenderte Abnahme und Agenten-Sequenzbearbeitung offen.


**0.38.0:** 214 Tests und Build bestanden; vier neue Tests sowie erweiterter Node-MCP-Transporttest für Sequenzänderungen. Python-DTO isoliert geprüft, kein neuer Python-MCP-Livelauf. [Prüfbericht](PRUEFUNG-0.38.0.md).


**0.39.0:** 219 Tests und Build bestanden. Fünf neue Tests prüfen paginierte Anthropic-Modellermittlung einschließlich Cursorfehlern, Grenzen, späteren HTTP-Fehlern und Abbruch/Timeout. Kein echter Kontoaufruf. [Prüfbericht](PRUEFUNG-0.39.0.md).


**0.40.0:** 223 Tests und Build bestanden. Vier neue Tests für Sequenzpakete und Assistentenvorschläge; Node-MCP-Transporttest erweitert, Python-DTO isoliert geprüft. [Prüfbericht](PRUEFUNG-0.40.0.md).


**0.41.0:** 228 Tests und Build bestanden. Fünf neue Tests prüfen lokal paginierte Vergleiche, Revisionskonflikte, ungültige Daten, Textdarstellung/DE–EN und einmalige Übernahme im Assistentenpanel. [Prüfbericht](PRUEFUNG-0.41.0.md).


**0.42.0:** 233 Tests und Build bestanden. Fünf neue Tests prüfen temporäre Sequenzanimation, Positions-/Dauersampling, Pause/Seek, Wiederherstellung, Lebenszyklus, Konflikte und Panelsteuerung. [Prüfbericht](PRUEFUNG-0.42.0.md).


## Browser-Prüflauf ab 0.43.0

`npm run test:e2e` umfasst sieben Fälle in drei Dateien. `npx playwright test --list` erkennt alle sieben; TypeScript/Build bestehen. Sechs vorhandene Fälle wurden lokal gestartet, scheiterten aber vor dem Seitenaufruf beim Chromium-Prozessstart: `socket() failed: Operation not permitted`. Der Browser wurde zuvor erfolgreich vom zweiten Downloadserver installiert. Das ist ein Umgebungsfehler, kein bestandener Anwendungstest.

Der neue Workflow [verify.yml](../.github/workflows/verify.yml) installiert Chromium samt Betriebssystemabhängigkeiten auf einem GitHub-Runner und stellt `browser-evidence` bereit. HTML-Bericht öffnen und bei Fehlern die Traces mit `npx playwright show-trace <datei.zip>` ansehen. Ein erfolgreicher Lauf muss zusätzlich auf sichtbare Fehler und brauchbares Mausgefühl geprüft werden. Echte Cloud-Inferenz wird von den simulierten Anbieterfällen nicht abgenommen. [Prüfbericht](PRUEFUNG-0.43.0.md).


## Erster echter Chromium-Lauf und Korrektur 0.44.0

[GitHub-Lauf 39776867884](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39776867884) für 0.43.0: Node-Tests und Build erfolgreich; Browserstart erfolgreich, **2 von 7 E2E-Fällen bestanden**. Original-Transformation und KI-Sequenzvorschau sind damit erstmals im automatisierten Browser nachgewiesen. Fünf Fälle sind fehlgeschlagen; der Gesamtlauf ist rot.

0.44.0 korrigiert die fehlenden Original-Metadaten und die bei niedriger Bildrate künstlich verlangsamte Animationszeit. 235 Node-Tests und Build bestehen. Der [Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209) für Commit `5474cb169515da8a2bb70d66176396f64770c09f` besteht **alle sieben Browserfälle** (1,8 Minuten). Das bestätigt die automatisierten Abläufe, ersetzt aber keine vollständige manuelle Maus-/UI-Abnahme. [Prüfbericht](PRUEFUNG-0.44.0.md).


**0.45.0:** 237 Tests, Build und alle neun Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987)). Die beiden neuen Fälle bestätigen echte IndexedDB-Persistenz nach F5 und Listenänderungen zwischen zwei Tabs. [Prüfbericht](PRUEFUNG-0.45.0.md).

**0.46.0:** Ein zusätzlicher Chromium-Fall für Move-Download, Dateiauswahl, konfliktfreien Import, Wiedergabe, Undo/Redo und Modellbindungsfehler vorbereitet; insgesamt zehn Browserfälle. Neuer CI-Nachweis steht aus. [Prüfbericht](PRUEFUNG-0.46.0.md).
