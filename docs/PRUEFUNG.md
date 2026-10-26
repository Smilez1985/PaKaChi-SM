# Prüfstand und Abnahme

**Softwarestand: 0.57.0 · Dokumentationsabgleich: 26.10.2026.**

## Nachgewiesen

| Prüfung | Letzter Nachweis | Umfang und Grenze |
| --- | --- | --- |
| `npm test` | 0.56.0: 266 Tests bestanden | Player, Router, Studio-Daten, reale Three.js-Geometrie, DOM/Ereignisse mit happy-dom, Node-MCP und Erhaltungsprüfung. Kein gerenderter Browser. |
| `npm run test:e2e` | 0.56.0: 17 Chromium-Fälle bestanden | GitHub-Runner mit Software-WebGL; simulierte Anbieter, keine manuelle Maus-/KI-Qualitätsabnahme. |
| `npm run test:legacy` | 0.9.0: beide Programme bestanden | Originalplayer-Steuerung, MQTT-Verhalten und Lebenszyklus. |
| `npm run build` | 0.56.0: bestanden | TypeScript und Produktionsbuild; Vite meldet weiterhin das große gemeinsame JS-Bundle (rund 1,33 MB / 369 kB gzip). |
| `npm run test:python` mit `PAKACHI_PYTHON` | 0.10.0: Integration bestanden | Echter Python-MCP-Prozess, eingebetteter aMQTT-Broker, produktiver MQTT-Client, Router und Studio-Editor. Acht Tools, Studio-Änderungen einschließlich gültiger/ungültiger Skalierung, fehlende Freigabe und Revisionskonflikte geprüft. |
| Originaldateien | 0.49.0: bytegenau erhalten | 83 wiederhergestellte Dateien einschließlich exakt 72 Transformationsbildern. |

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

**0.46.0:** 237 Tests, Build und alle zehn Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594)). Der zusätzliche Fall bestätigt Move-Download, Dateiauswahl, konfliktfreien Import, Wiedergabe, Undo/Redo und Ablehnung einer unpassenden Modellbindung. [Prüfbericht](PRUEFUNG-0.46.0.md).

**0.47.0:** 242 Tests und Build bestanden. Fünf neue Tests prüfen echte Knochen, Hautgewichte, Grundformerhalt, Beugung, Posen, Undo/Redo, Projekt-/Katalogpersistenz, mehrere Unterteilungen sowie Mika und Nori. 242 Tests, Build und alle elf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)). Der neue Fall bestätigt Einfügen, Undo/Redo und Projekt-Download/-Import. [Prüfbericht](PRUEFUNG-0.47.0.md).

**0.48.0:** 246 Tests und Build bestanden. Vier zusätzliche Tests prüfen echte Knochenentfernung, Gewichtsübernahme, Posenumrechnung, Undo/Redo, Rekonstruktion und Fehler-Rollback. Ein weiterer Browserfall für das ursprüngliche Mika-Knie ist vorbereitet; neuer CI-Nachweis steht aus. [Prüfbericht](PRUEFUNG-0.48.0.md).

**0.49.0:** 248 Tests und Build bestanden. Zwei neue Tests prüfen wiederholte Mischfolgen, Rekonstruktion identischer Gewichte, Markerprüfung und einzelne Undo-/Redo-Schritte. 248 Tests, Build und alle zwölf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)). Der erweiterte Browserfall bestätigt Löschen, anschließendes Einfügen und erneuten Dateiaustausch. [Prüfbericht](PRUEFUNG-0.49.0.md).


## Knochenbearbeitung durch Agenten (0.50.0)

Seit **0.50.0** unterstützen `edit_studio` und der integrierte Assistent zwei weitere Aktionen: `insert_bone` mit der ID des Kindknochens fügt ein echtes Zwischengelenk mittig ein; `delete_bone` entfernt den angegebenen Knochen und überträgt Kinder und Gewichte an seinen Elternknochen. `delete_point` entfernt weiterhin nur den Griff. Zuerst `get_studio` mit `section: points` lesen, dann im Rig-Modus mit aktueller Sitzung/Revision und erteilter Bearbeitungsfreigabe arbeiten. Der integrierte Assistent legt Änderungen weiterhin zur ausdrücklichen Übernahme vor. Jeder Eingriff ist über Undo/Redo rückgängig machbar; vorhandene Posen danach prüfen. Die Schutzregeln für Wurzeln, skalierte Knochen und Anbauteile bleiben bestehen.

249 Tests und Build bestanden; Node-MCP-Transport mit beiden Aktionen geprüft. Python-Modell und Werkzeugbeschreibung erweitert, Syntax geprüft. Keine neue reale Python-MCP-/Anbieterabnahme; der [CI-Lauf für 0.50.0](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771) ist erfolgreich.


**0.51.0:** Zwei Chromium-Fälle für Assistenten-Vorschlag → ausdrückliche Übernahme → Undo bei `insert_bone` und `delete_bone`. Sie prüfen unveränderte Revision/Geometrie vor Zustimmung und Wiederherstellung der Gelenkdaten nach Undo. Antworten des Anbieters sind simuliert. 249 Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40113222944)). Der vorherige Stand 0.50.0 besteht seine [CI-Prüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771).


**0.52.0:** Zwischengelenke lassen sich über einen Mausregler bei 10–90 % der vorhandenen Knochenstrecke einfügen (vom Elternknochen zum ausgewählten Kind; Standard 50 %). Assistent und beide MCP-Server unterstützen dafür optional `ratio`. Vorhandene Posen, Gewichtsverteilung, Projektpersistenz und Undo/Redo bleiben berücksichtigt. 251 Node-Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40134452209)). Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.


**0.53.0:** Vorhandene Knochen lassen sich im Modus „Gelenke bearbeiten“ einem anderen Elternknochen zuordnen. Grundstellung, gespeicherte Einzelposen und aktuelle Pose werden umgerechnet; Hautgewichte bleiben beim jeweiligen Knochen. Undo/Redo, gemischte Umbaufolgen, Projekt-/Katalogexport und die Aktion `reparent_bone` für Assistent/MCP sind enthalten. `get_studio` liefert `parentBone` und `parentId`. 256 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40138951275)).

Nur innerhalb desselben Skelettbaums; Wurzeln, Kreise, skalierte Knochenketten und Knochen mit direkten Nicht-Knochen-Anbauteilen werden abgewiesen. Gespeicherte Einzelposen bleiben erhalten, interpolierte Bewegungswege können sich ändern und werden zur Prüfung markiert. Keine automatische anatomische Bewertung oder neue reale Anbieter-/Python-Host-Abnahme.


**0.54.0:** Knochen mit starren Anbauteilen können umgehängt werden. Auch verschachtelte starre Objektgruppen mit eigener Drehung und Skalierung bleiben am Knochen befestigt; Grundstellung und gespeicherte Einzelposen behalten ihre Welttransformationen. Anbauteile mit eigenen Knochen oder SkinnedMesh bleiben ausgeschlossen. Löschen eines Knochens mit Anbauteilen ist weiterhin gesperrt. 258 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40184399914)).


**0.55.0:** Oberflächen-Einfluss eines Knochens lässt sich anteilig auf einen anderen übertragen. Mengenregler, Undo/Redo, Projekt-/Katalogpersistenz, gemischte Knochenänderungen und `transfer_weights` für Assistent/MCP sind vorhanden. Die Grundgeometrie bleibt erhalten; Posen werden mit `skin-weights` zur Prüfung markiert. 264 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40217823978)).

Die Übertragung betrifft alle Vertices mit Quellgewicht, ohne räumlichen Malpinsel. Bei mehr als vier Einflüssen bleiben die vier stärksten, anschließend auf Summe 1 normalisiert; dadurch kann der effektive Anteil vom Reglerwert abweichen. Fehlende Zielpaletten, leere Quellen und ungültige Werte werden ohne bleibende Änderung abgewiesen. Manuelle Haut-/Bewegungsqualität und reale Anbieterabnahme bleiben offen.


**0.56.0:** Hautgewichtsübertragungen können auf einen kugelförmigen Bereich um das Quellgelenk begrenzt werden. Radius per Mausregler; Stärke nimmt zum Rand weich auf null ab. Außerhalb bleiben Gewichte unverändert. Assistent/MCP unterstützen optional `region: {center, radius}`; Projekt-/Katalogexport erhalten den Bereich. 266 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40219939990)).

Der Bereich bezieht sich auf normalisierte Weltkoordinaten der ursprünglichen Grundpose, unabhängig von der aktuellen Figurpose. Die Oberfläche nutzt den gespeicherten Gelenkpunkt als Mittelpunkt; API-Aufrufe können einen eigenen Mittelpunkt setzen. Noch kein kontinuierlicher Malpinsel oder sichtbare Bereichsvorschau. Höchstens vier normalisierte Einflüsse pro Vertex; manuelle Hautqualität und echte Anbieterabnahme bleiben offen.


**0.57.0:** Die räumlich begrenzte Gewichtsübertragung zeigt eine Vorschau im Studio: grüne Außenringe markieren den Radius, orange Innenringe die halbe Stärke. Sie folgt Auswahl, Radius und bearbeitetem Gelenkpunkt und wird im Posenmodus sowie außerhalb des Studios ausgeblendet. Die Vorschau verändert weder Projekt noch Undo-Verlauf. 268 Node-Tests und Build bestanden; neuer Chromium-Nachweis steht aus.

Die Ringe zeigen den räumlichen Bereich in der ursprünglichen Grundpose, nicht die tatsächlich gewichteten Vertices. Kontinuierlicher Gewichtspinsel und farbige Darstellung der Hautgewichte bleiben offen. Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.
