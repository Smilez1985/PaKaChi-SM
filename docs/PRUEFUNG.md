# Prüfstand und Protokolle

**Softwarestand: 0.101.0 · Dokumentationsabgleich: 2026-11-11T22:03:00+01:00 (Europe/Berlin).**

Alle Prüfnachweise stehen in dieser Datei: ein Abschnitt je Softwareversion sowie gesonderte Abschnitte für datierte Zwischenprüfungen. Die Ergebnisse und Grenzen gelten für den jeweils genannten Stand. Spätere Läufe stehen als Nachtrag im selben Abschnitt. Produktänderungen gehören in den [Changelog](CHANGELOG.md), offene Aufgaben in die [Roadmap](ROADMAP.md).

## Zwischenprüfung 2026-11-11 – Originalformen-Topologie und Kapselkorrektur

**Ausgangsbefund:** Der lesende Originalformen-Lauf #5 bestand. Beide Formen besitzen jeweils 28 starre `_shell`-Teilmodelle; darin lagen insgesamt 672 dauerhaft flächenlose Pol-Dreiecke je Form (24 je Teilmodell). In den geprüften Posen wurde keines wieder gültig. Ungültige Geometrie und deckungsgleiche Dreiecke wurden nicht festgestellt. Die Ursache ist auf die neu erzeugten starren Finger-/Zehen-Kapseln eingegrenzt.

**Generatoränderung:** Auf `develop`, Commit [`c1f9ac0`](https://github.com/Smilez1985/PaKaChi-SM/commit/c1f9ac0490fa16782551c09270487d2bf7d08455), entfernt `pruneDegenerateCapsuleFaces` ausschließlich Nullflächen aus dem Indexbuffer neu erzeugter starrer Kapseln. Positionen, UVs, Normalen und Knochenbindungen bleiben unverändert; die Funktion ist nicht für beliebige importierte, geskinnte oder Morph-Target-Modelle vorgesehen. `tests/pakachi-paws-cleanup.test.mjs` prüft drei Kapselabmessungen, exakt 24 entfernte Polflächen, unveränderte Vertexattribute und wiederholte Anwendung ohne weitere Änderungen.

**Regenerierungsschutz:** `scripts/prepare-pakachi.mjs` berücksichtigt `pakachi-paws.mjs` im Pipeline-SHA-256. Der Workflow `pakachi-intersections.yml` führt deshalb bei `--if-needed` eine neue Erzeugung aus und verlangt danach je Form genau 28 `_shell`-Teilmodelle ohne Nullflächen sowie vollständige Topologie-/Reparaturberichte und alle acht statischen Gelenkproben. Der tatsächliche Ergebnisbericht des Folgelaufs #6 ist in diesem Nachtrag noch nicht ausgewertet; die Regenerierung wird daher nicht als bestanden behauptet.

**Studio-Browserfall:** `tests/e2e/mesh-topology-markers.spec.ts` ist vorhanden und prüft das read-only Anzeigen/Zurücksetzen, unveränderte Projekt-Revision und fehlende Browserfehler. Der Fall lädt Mika und verlangt noch keine nichtleere Markeranzahl an einer gezielt eingebrachten Nullfläche. Eine echte visuelle Markerabnahme bleibt offen.

## Version 0.101.0

Stand: 2026-11-11T13:25:26Z. Freigabekandidat `39eee8854a44f64e2e16d1d146726506998ccbd4`; [PR #2](https://github.com/Smilez1985/PaKaChi-SM/pull/2) nach erfolgreicher CI #122 nach `main` gemerged (Main-Commit `5d2733c1b9ed8aeabb9b73024d591f82b76e91a9`).

Die automatische Paar-Sperre vergleicht alle gespeicherten Posen und alle vorhandenen Move-Stichproben. Bis zu zwölf Viertelschritt-Proben ergänzen vier Intervalle um die gemessene innere Risikohaltung. Exakte Duplikate werden einmal geprüft; unterschiedliche nahe Drehungen bleiben getrennt. Vor jeder vollständigen Einzelabfrage werden Steuerung, Abbruch- und Revisionsprüfung bedient. Eine vorzeitig abgelehnte Sequenz wird nicht als vollständig geprüft gemeldet.

Die positionelle Nachkorrektur bearbeitet nur eine Haltung mit neu bewiesenem Paar; nach jeder Änderung gelten erneut alle Dehnungs-, Volumen-, Pose-/Move- und Paar-Sperren. Höchstens vier Gegenläufe teilen das bestehende Budget. Die Kantenentspannung prüft zuerst den Bereich am tatsächlichen Gelenk und danach einen abweichenden Hotspot. Die Grenzen bleiben 100.000.000 Vertex-Stichproben und 12.000.000 Kantenoperationen.

### Tatsächliche automatische Originalformen-Aufträge

Der separate [GitHub-Lauf #1](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42976768820) für `397ebd2a19f4a94fc35c5e2724b5902287f61b82` ist vollständig erfolgreich. Er bereitet beide Formen frisch vor, führt die tatsächliche automatische Suche aus und prüft deren tatsächlich zurückgegebenen Vorschlag an je 65 unabhängigen Körpernetz-Haltungen. Der Runner verlangt vollständig erfasste Paaridentitäten, keine neuen Paare, keine gemessene Dehnungs-/Volumenverschlechterung und unveränderte Quelldaten.

| Auftrag | Arbeitsform | Tierform |
| --- | ---: | ---: |
| Linke Hüfte / Achse | 90° / X | 22,5° / X |
| Dehnungswarnungen vorher → nachher | 367 → 345 | 760 → 756 |
| Körper-Schnittpaare in der Zielhaltung | 21 → 8 | 551 → 551 |
| Vollständige unabhängige Paar-/Dehnungs-/Volumenproben | 65 | 65 |
| Neue Paaridentitäten / gemessene Regressionen | 0 / 0 | 0 / 0 |
| Kantenoperationen | 4.067.066 | 3.533.661 |
| Vertex-Stichproben | 99.946.875 | 99.879.509 |
| Suche an Vertex-Grenze beendet | ja | ja |

Die Tierform behält ihre bestehenden Körperschnitte; ihre Reduktion ist damit weiterhin offen. Ein zuvor stärkerer Tierform-Hotspot-Vorschlag (760 → 746 Warnungen) erzeugte neue Paare in 19 der 65 Haltungen und wurde verworfen. Bei 7/16 der Bewegung war die Gesamtzahl sogar unverändert 221 → 221, ein altes Paar wurde aber durch ein neues ersetzt. Reine Gesamtzahlen sind daher keine Freigabe.

[Maschinenlesbare Zusammenfassung](benchmarks/pakachi-motion-correction-2026-11-11-summary.json). Das [Abschlussartefakt](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42976768820/artifacts/13836975489) enthält die tatsächlich gefundenen Vorschläge, alle Einzelproben und die überprüften Original-GLBs. SHA-256 des Archivs: `865e9a0d066c50587b36837e64c4e9ee1a865283681afdbca24a133216d5c4a4`.

Reproduktion: `node scripts/benchmark-correction-motion.mjs --output test-results/pakachi-motion-correction.json`. Mit `--replay <JSON>` lässt sich ein gespeicherter tatsächlicher Vorschlag ohne erneute Suche prüfen. Atomare Zwischenstände verhindern den Verlust abgeschlossener Teilproben.

### Kern- und Browserprüfung

Die Kernregression weist nach, dass eine zuvor akzeptierte 180°-Gewichtsvariante bei 174,375° 432 neue Paare erzeugt und jetzt abgelehnt wird. Erfolgreiche Bedien-/Berechtigungs-/Budgetprüfungen verwenden eine korrigierbare 160°-Vorlage; der ursprüngliche 180°-Fehlerfall bleibt als ausdrückliche Ablehnung erhalten. Eine weitere Sequenzregression erfasst eine von End-/Mittelproben übersehene achte Haltung, bewahrt Quelldaten und prüft Abbruch vor der nächsten Abfrage.

Lokal bestanden 504 verfügbare allgemeine Tests, drei aufwendige Charakterfälle und zuletzt 32 gezielte Automatik-/Geometrie-/Sequenzprüfungen; TypeScript und Build erfolgreich. Der Arbeitscontainer fiel danach mit `exec-server transport disconnected` aus. Unfertige lokale Messungen sind keine Nachweise. Die vollständige Abnahme wurde auf GitHub fortgesetzt.

Der normale [CI-Lauf #119](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42976768681) ist mit Fehler beendet: **508/508 Node-Tests**, keine Fehler oder Skips; Build erfolgreich; **45/49 Browserfälle bestanden**. Drei Browserprüfungen gaben nach der bisherigen Fünf-Sekunden-Erwartung auf, während die erweiterte automatische Gegenprüfung noch lief. Sie warten nun bis zu 30 Sekunden auf das tatsächliche Abschluss-/Übernahmeelement; die drei vollständigen Bedienfälle haben maximal 60 Sekunden. Ergebnis-, Vorschau-, Übernahme-, Undo-, Speicher- und Fehlertests bleiben aktiv. Der vierte Fehler verlangte mindestens fünf behobene Tierform-Warnungen, während der unabhängig an 65 Haltungen geprüfte Vorschlag 760 → 756 liefert; der Browser-Mindestwert wird auf diese belegten vier Verbesserungen abgeglichen. Die vollständige normale CI wird mit diesen Testanpassungen neu ausgeführt. Importmessungen und Abschlussvalidierung waren in #119 nach dem Browserfehler nicht ausgeführt und werden nicht als bestanden gewertet. Frühere Läufe #116 bis #118 wurden durch Folgecommits abgelöst und abgebrochen; sie gelten nicht als erfolgreiche vollständige Nachweise.

Freigabelauf #120 für den eingefrorenen Kandidaten: 511/512 Tests bestanden, ein Fehler im parallel ergänzten Topologie-Test. Die Audit-Funktion zählt bei einer doppelten Fläche die zwei zusätzlich gleichgerichteten Kanten korrekt; die Erwartung `0` war falsch und wurde auf `2` korrigiert. Alle vier unveränderten Audit-Funktionen/Fixtures wurden mit den korrekten Erwartungen unabhängig geprüft; die reine Funktionsimplementierung blieb dabei unverändert. Der vollständige Node-/Browser-Freigabelauf ist erneut erforderlich; #120 enthält keinen Browser-/Importnachweis.

Freigabelauf [#121](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42984914930) für `db6c047b`: **512/512 Node-Tests**, keine Fehler oder Skips; Produktionsbuild erfolgreich; **47/49 Browserfälle bestanden**. Beide Originalform-Fälle bestanden die automatische Suche, Qualitätswerte, Vorschau, Übernahme, Undo/Redo und Prüfung der heruntergeladenen Projektdaten. Erst beim erneuten Dateiimport lief die bisherige Fünf-Sekunden-Erwartung auf die Fertigmeldung ab. Der Import setzt die Dateiauswahl zurück und lädt asynchron; die Prüfungen warten nun auf den tatsächlichen Abschluss (initial 30, beim größeren Korrekturprojekt 60 Sekunden) und verlangen zusätzlich eine neue Studio-Sitzung. Das Ergebnis darf nicht aus dem alten Studio stammen. Importmessungen und Abschlussvalidierung wurden nach dem Browserfehler nicht ausgeführt; #121 ist keine vollständige Freigabe.

Abgeschlossener Freigabelauf [#122](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42992027559) für den eingefrorenen PR-Kandidaten `39eee8854a44f64e2e16d1d146726506998ccbd4`: **512/512 Node-Tests**, Produktionsbuild und **49/49 Browserfälle** erfolgreich; 0 unerwartete, instabile oder übersprungene Fälle. Drei Produktionsbrowser-Importmessungen vollständig: 3.404,6 / 3.035,8 / 3.167,9 ms Frame-Grenzen, Median **3.167,9 ms**. Das Browser-/Import-Abschlussartefakt wurde erstellt und die PR #2 anschließend am 2026-11-11T13:25:26Z nach `main` übernommen. Diese Messung belegt den PR-Freigabekandidaten; ein separater main-only Nachlauf wird hier nicht behauptet. Die unabhängige erfolgreiche 65er-Geometrieabnahme wird wegen des unveränderten Programmstands nicht erneut gestartet.

Grenzen: 65 diskrete Körpernetzproben sind keine kontinuierliche Kollisionsfreiheit. Bestehende Schnitte, Kontakte, angrenzende Dreiecke, getrennte Teilmodelle und allgemeine Anatomiequalität bleiben offen.


## Version 0.100.0

Stand: 2026-11-11T00:43:16+01:00 (Europe/Berlin). Entwicklung auf `develop`; vollständige GitHub-Prüfung einschließlich Artefaktprüfung erfolgreich, Meilensteinübernahme nach `main` ausstehend. Letzter vollständig geprüfter main-Programmstand bleibt 0.99.0 (`78be49d`).

Der neue allgemeine Abschwächungsschritt sucht für neue Schnittpaare kleine getestete Skalierungen einzelner Verschiebungen, Nahtgruppen oder betroffener Flächen. Lokale Zwei-Flächen-Proben bestimmen Vorschläge; vollständige räumliche Bereichsabfragen über alle übergebenen Haltungen bestätigen sie. Unvollständige Kontakte/Geometrie-/Budgetberichte liefern keine Korrektur. Der Transformationscache wird verweigert, falls der zusätzliche Formtreiber bestehende Treibergewichte verändern würde. Alle Datenänderungen bleiben auf der Kandidatenkopie; Arbeitsbudget, Abbruch und Revisionskontrolle gelten weiter. Nachgeschaltet werden erneut sämtliche gewöhnlichen Pose-/Move-, Dehnungs-, Volumen- und Vollnetz-Schnittprüfungen.

Die abschließende Schnittsperre vergleicht Paaridentitäten statt nur Gesamtzahlen. Die zusätzliche Gegenhaltung enthält jetzt die tatsächlich gewählte auffällige Bewegungsstichprobe; exakte Duplikate und Haltungen ohne Beitrag des zusätzlichen Treibers brauchen keinen gesonderten Nachkorrekturlauf. Die Radiusreihenfolge berücksichtigt geschätzte incident-Kantenkosten und die vorhandenen Solvergrenzen. Diese Schätzung sortiert Varianten, schließt sie aber nicht aus; die globalen Grenzen bleiben 100.000.000 Vertex-Stichproben und 12.000.000 gemeinsame Kantenoperationen.

[Explizit vorbereitete Tierform-Referenz](benchmarks/pakachi-attenuation-2026-11-11.json), reproduzierbar mit `node --test tests/corrective-attenuation-character.test.ts`: Ausgehend vom gespeicherten 0.99.0-Vorschlag reduziert die unverfeinerte Trennprobe 551 → 543 Ziel-Schnitte, erzeugt aber in neun der 65 Zwischenhaltungen neue Paare. Zwei begrenzte Abschwächungs-/Dehnungsdurchläufe erhalten **551 → 545** Ziel-Schnitte und **747 → 746** Dehnungswarnungen. An allen 65 unabhängigen Körpernetzproben sind die Paarberichte vollständig, kein neues Paar bleibt und keine gemessene Dehnungs-/Volumenverschlechterung tritt auf. Das bisherige vollständige Einfrieren verlor diese Schnittverbesserung. **Der allgemeine Gegenschritt ist in der automatischen Suche integriert; die explizit vorbereitete Trennung ist noch kein automatischer Trennungsgenerator.**

[Vollständige automatische Originalform-Aufträge](benchmarks/pakachi-attenuation-automatic-2026-11-11.json), mit `node scripts/benchmark-edge-relaxation.mjs` reproduzierbar:

| Standardauftrag | Arbeitsform | Tierform |
| --- | ---: | ---: |
| Linke Hüfte | 90° | 22,5° |
| Dehnungswarnungen vorher → nachher | 367 → 345 | 760 → 745 |
| Körper-Schnittpaare in der Zielhaltung | 21 → 8 | 551 → 551 |
| Gespeicherte Posen / Move-Stichproben | 2 / 33 | 2 / 33 |
| Zusätzliche unabhängige Dehnungs-/Volumenhaltungen | 65 | 65 |
| Vollständig gemessene Körper-Schnitthaltungen | 4 | 4 |
| Vertex-Stichproben | 99.946.875 | 99.879.509 |
| Gemeinsame Kantenoperationen | 4.629.135 | 7.214.399 |
| Suche an Vertex-Grenze beendet | ja | ja |

Die automatische Arbeitsform-Körpermessung lautet 1 / 1 / 2 / 21 → 1 / 1 / 1 / 8 an 22,5° / 45° / 67,5° / 90°. Die Tierform misst 74 / 256 / 398 / 551 → 74 / 252 / 396 / 551 an 5,625° / 11,25° / 16,875° / 22,5°. Alle vier Paaridentitäts-Sperren akzeptieren die jeweiligen Vorschläge vollständig. Die zusätzliche 65er-Gegenprobe dieser automatischen Vorschläge deckt Dehnung/Volumen ab; sie ist von den 65 vollständigen Paarproben der gesonderten expliziten Trennreferenz zu unterscheiden. Die gespeicherten Gelenk-/Move-Daten bleiben unverändert. Beide Suchen enden am unveränderten Vertexbudget und liefern nur den zuvor vollständig geprüften besten Vorschlag.

Lokal vor dem Commit: **48/48 Kernprüfungen**, beide Originalcharakterprüfungen und die dichte Tierform-Referenz erfolgreich; TypeScript und Produktionsbuild erfolgreich. Die vollständige [GitHub-Prüfung #115](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42926070961) für `b89c730a7592600b7750f3dbdb6bb58c904d055a` ist abgeschlossen: **505/505 Node-Tests**, keine Fehler, Abbrüche oder übersprungenen Fälle; Produktionsbuild, **48/48 Browserfälle** und drei Importmessungen erfolgreich. Abschlussartefakt `13816326902` heruntergeladen und geprüft: SHA-256 `5117d5c7c1950eac5fc22a9d7abc1cdfcbccbb96cd0d110929726b1621bad917`; Browserbericht ohne unerwartete, instabile oder übersprungene Fälle; Originalform-Hashes stimmen mit der Referenz überein. Import-Framegrenzen: 3.313 / 3.804,9 / 3.486,3 ms, Median 3.486,3 ms.

Wiederaufnahme 2026-11-11T06:49:19+01:00: Nach diesem Commit liegen zusätzliche zeitliche Mittelpunktproben als **nicht integrierter Versuch** vor. Erneute lokale Gegenprüfung: 18/23 Kernprüfungen bestanden, fünf bestehende automatische Aufträge liefern keinen Vorschlag; Build erfolgreich. Das ist ausdrücklich kein Fehlerstatus des grünen Programmcommits. Vor weiterer Freigabe müssen die neu erfassten Paarbefunde untersucht werden. [Wiederherstellungspunkt mit Patch, Skripten, Referenz und nächsten Schritten](benchmarks/pakachi-recovery-2026-11-11.json).

Grenzen: Stichproben belegen keine kontinuierliche Kollisionsfreiheit. Bestehende Selbstschnitte, Kontakte, angrenzende Dreiecke, getrennte Teilnetze und allgemeine Anatomiequalität bleiben offen. Keine abgeschlossene Charakterfreigabe oder zuverlässige 2D-zu-fertigem-Charakter-Zusage.

## Version 0.99.0

Stand: 2026-11-10T23:26:35+01:00 (Europe/Berlin). Programmcommit `78be49d069c03cfa0fd50e22a661ccfc867e9144`, auf `develop` vollständig geprüft und unverändert nach `main` integriert. [Vollständige Entwicklungsprüfung #113](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42910426008): **497/497 Node-Tests**, keine Fehler, Abbrüche oder übersprungenen Fälle; TypeScript-/Produktionsbuild; **48/48 Browserfälle** ohne Flaky-/Skip-Fälle; drei Produktionsimportmessungen. Auch der zusätzliche [main-Lauf #114](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42914511447) ist vollständig erfolgreich: 497/497 Node-Tests ohne Fehler, Abbrüche oder übersprungene Fälle, TypeScript-/Produktionsbuild, 48/48 Browserfälle (19,1 Minuten) und drei Importmessungen.

Allgemeiner Schnitt-Gegenschritt für sparse positionelle Korrekturformen: Eine räumlich begrenzte Abfrage umfasst jedes Paar mit mindestens einer an einem veränderten Vertex liegenden Fläche, auch gegen unveränderte Flächen außerhalb der Region. Paaridentitäten unterscheiden neue von bestehenden Schnitten. Betroffene Verschiebungen einschließlich ihrer ausgewählten Nahtkopien werden eingefroren. Unvollständige Kontakt-/Geometrie-/Budgetberichte liefern keinen verfeinerten Vorschlag. Acht begrenzte Durchläufe; ausschließlich Kandidatenkopien werden geändert. Sämtliche gewöhnlichen Vollnetz-, Dehnungs-, Volumen- und Bewegungsprüfungen bleiben nachgeschaltet.

Erreicht die Suche das Vertex-Arbeitsbudget, wird ausschließlich ein früher bereits vollständig gegengeprüfter Vorschlag zurückgegeben. Die gerade unvollständig geprüfte Variante wird verworfen. Ohne früheren Vorschlag bleibt der Auftrag abgelehnt. Abbruch und Revisionswechsel werden weiterhin weitergegeben. Die Grenze bleibt bei 100.000.000 Vertex-Stichproben; Studio und KI-Ausgabe kennzeichnen die beendete Suche. Das ist keine Zusage, dass alle Varianten untersucht oder ein globales Optimum gefunden wurden.

[Reproduzierbare Originalform-Aufträge und normalisierte Gegenprobe](benchmarks/pakachi-collision-refinement-2026-11-10.json), mit `node scripts/benchmark-edge-relaxation.mjs` lesend ausführbar:

| Standardauftrag | Arbeitsform | Tierform |
| --- | ---: | ---: |
| Linke Hüfte | 90° | 22,5° |
| Dehnungswarnungen vorher → nachher | 367 → 347 | 760 → 747 |
| Körper-Schnittpaare in der Zielhaltung | 21 → 11 | 551 → 551 |
| Gespeicherte Posen / Move-Stichproben | 2 / 33 | 2 / 33 |
| Unabhängige Zwischenhaltungen | 65 | 65 |
| Vertex-Stichproben | 97.091.250 | 99.879.509 |
| Suche an Vertex-Grenze beendet | nein | ja |

Die Tierform wählt Radius 0,1437889077780341 selbst, untersucht 27 Varianten und liefert 878 Korrekturvertices. Auch mit der Viewer-Normalisierung entsteht 760 → 747; der entsprechende Weltradius beträgt 0,3383341797245892. Keine gemessene Dehnungs-/Volumenverschlechterung über die 65 zusätzlichen Haltungen. Die vier Tierform-Körper-Schnittzahlen bleiben vollständig gemessen bei 74 / 256 / 398 / 551 an 5,625° / 11,25° / 16,875° / 22,5°. Der neue Browserfall startet den Auftrag über die normale Schaltfläche ohne Radiusvorgabe, prüft den Budgethinweis und durchläuft Vorschau, ausdrückliche Übernahme, Undo/Redo, Speichern und Projekt-Replay; Posen und Moves bleiben erhalten.

[Abschlussartefakt](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42910426008/artifacts/13808168533) geprüft: ZIP-SHA256 `28a2a5b70f109c065c201d33c1a10e6a80826952be117543c6fb0fc8a103e8ff`. Der eingebettete HTML-Bericht enthält genau 48 erwartete Erfolge, keine Fehler, Flaky- oder Skip-Fälle. Alle vier Original-/Korrekturansichten sind vorhanden. Beide frisch erzeugten Charakterdateien stimmen bytegenau mit den unabhängig geprüften Quellen überein. Drei Importmessungen: 2616,5 / 2782,3 / 2716,7 ms; Median 2716,7 ms unter Software-WebGL. Keine GPU-/Zielhardware-Zusage oder kontrollierte Leistungsgegenüberstellung.

Der unabhängige [Schnittlauf #4](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42905047788) für den unverändert gebliebenen Schnittkern ist ebenfalls erfolgreich; ZIP-SHA256 `17f428f6726b50d0bdc47494f0001cc1a6dd9c8c629cbb8ac8edca0e7e28aad0`. Beide Quell-Hashes stimmen, alle 16 Körpernetzproben sind vollständig; die bestehenden Schnittzahlen bleiben unverändert. Zuvor bestand bereits [CI #112](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42905047861) für `24f183e` mit 495 Tests, 48 Browserfällen und drei Importmessungen. Anschließend wurde die Budgetlücke des Standardauftrags behoben und mit #113 vollständig erneut geprüft.

Lokal: 32 Schnitt-/Gegenlauf-/Auftrags-Kerntests, beide echten Charakterprüfungen, TypeScript und Produktionsbuild erfolgreich. Der wiederhergestellte lokale Quellstand enthält nur Archivbild 001 von 72; der vollständige Erhaltungstest ist durch die erfolgreiche GitHub-Gesamtsuite abgedeckt. Lokales Chromium beendet sich vor Teststart mit SIGSEGV; die Browserabnahme stammt deshalb ausdrücklich aus GitHub.

Grenzen: vorhandene Selbstschnitte werden durch diesen Gegenschritt nicht allgemein repariert. Kontakte, ungültige dekorative Dreiecke, Kollisionen zwischen getrennten Teilnetzen, angrenzende Flächen und kontinuierliche Bewegungen bleiben offen. Keine anatomische oder abschließende Charakterfreigabe.


### Main-Abschluss und Geometrie-Gegenprobe nach 0.99.0

Abschlussnachtrag: 2026-11-10T23:59:31+01:00 (Europe/Berlin). [main-Abschlussartefakt](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42914511447/artifacts/13809548896) geprüft: ZIP-SHA256 `08429d7d34db979093facc3e1ef2ba903352f006fea279c8478e684b737833fc`. HTML-Bericht: genau 48 erwartete Erfolge, keine Fehler, Flaky- oder Skip-Fälle; vier Original-/Korrekturansichten vorhanden. Beide frisch erzeugten Charakterdateien stimmen bytegenau mit den unabhängig geprüften Quellen überein. Drei vollständige Importmessungen: 3532,5 / 3653 / 3412,7 ms; Median 3532,5 ms unter Software-WebGL. Entwicklung und main sind damit für denselben Programmstand vollständig geprüft.

Anschließend wurde eine **nicht integrierte** Flächentrennung an der echten Tierform untersucht. Ausgangspunkt war der vorhandene 0.99.0-Vorschlag mit 747 Dehnungswarnungen und 551 Körper-Schnittpaaren bei 22,5° linker Hüfte. Die Probe wählt die ursprüngliche Dreiecksseite aus der Grundform als Trennungsrichtung, glättet Verschiebungen und passt sie als gewöhnliche sparse Korrekturform an. Referenzradius 0,22 und Stärke 0,3 sind explizite Versuchsvorgaben; sie belegen keine allgemeine automatische Regions- oder Anatomieerkennung. Quell-GLB und laufende Benutzerprojekte wurden nicht geändert.

| Lesender Versuch | Dehnungswarnungen in der Zielpose | Körper-Schnittpaare in der Zielpose | Haltungen mit neuen Paaren unter 65 Proben |
| --- | ---: | ---: | ---: |
| Vorhandene 0.99.0-Korrektur | 747 | 551 | Vergleichsbasis |
| Neue Trennungsform nach grober Gegenprüfung | 746 | 543 | 9 |
| Nach gezieltem Entfernen der problematischen Verschiebungen | 746 | 551 | 0 |

Die zunächst günstigere Zielpose und vier Schnittstichproben reichen hier nicht. Auch alle 65 zusätzlichen Dehnungs-/Volumenproben bestehen, während die dichtere Schnittprüfung neue transversale Dreieckspaare findet. Beispiel bei 20,390625°: insgesamt weiterhin 491 Schnittpaare, aber zwei neue und zwei entfernte Paare. Bei 20,7421875° sinkt die Summe 500 → 496, trotzdem kommt ein neues Paar hinzu. Die Gegenprobe vergleicht deshalb vollständige Paaridentitäten in allen 65 Körperberichten; sämtliche Berichte sind vollständig.

Der vorhandene Gegenschritt wurde danach an den drei Haltungen mit den meisten neuen Paaren und der Zielpose erneut ausgeführt, gefolgt von der Dehnungsprüfung. Die erneute 65-Haltungen-Gegenprobe meldet keine neuen Paare und keine Dehnungs-/Volumenverschlechterung. Der Gegenschritt verwendet 2.650.886 von 12.000.000 reservierten Kanten-/Schnittoperationen; die zusätzlichen lesenden Diagnoseproben sind separat. Allerdings verschwindet damit die angestrebte Schnittreduktion in der Zielpose. **Keine Übernahme als neue Reparaturfunktion oder Charakteränderung.** Weitere Arbeit muss die Trennungsrichtung, Erhaltung lokaler Form und Bewegung gemeinsam lösen, statt nur die Zielpose oder Schnittsumme zu verbessern.

[Messdaten und virtuelle Eingaben zum Wiederholen der Gegenprobe](benchmarks/pakachi-separation-prototype-2026-11-10.json) enthalten Quell-Hash, Pose, vorhandene Korrektur, verworfene Trennungsform, bereinigte Form und beide vollständigen 65-Haltungen-Ergebnisse. Der Dateistatus ist ausdrücklich `not-integrated`. Der Produktcode bleibt unverändert; weiter offen sind die allgemeine Studio-/KI-Integration einer tatsächlich wirksamen Trennung, andere Gelenke, die weitere Aktivierungskurve und kontinuierliche Bewegungen.

## Räumliche Körper-Schnittdiagnose – Entwicklung nach 0.97.0

Die neue 3D-Baumsuche wurde lokal mit den unveränderten, vorbereiteten GLBs aus [CI #108](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42842240601) gemessen. Die vollständige CI dieses Ausgangscommits `f07db67` besteht 473 Node-Tests, Build, 46 Browserfälle und drei Importmessungen; der bisherige [Schnittmesslauf #2](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42842240844) ist ebenfalls erfolgreich. Diese früheren grünen Läufe gelten nicht als Prüfung der neuen Baumsuche. Der neue Programmcommit `3ca3e78cbdbb6f893eb2c2b6e570b0241dd72fef` ist durch [vollständige CI #109](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42857939759) erfolgreich geprüft: **479/479 Node-Tests**, keine Fehler, Abbrüche oder übersprungenen Fälle; TypeScript-/Produktionsbuild; **46/46 Browserfälle (16,0 Minuten)** ohne als flaky gemeldete Fälle; drei Produktionsimportmessungen. Der [unabhängige Schnittmesslauf #3](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42857939781) ist ebenfalls erfolgreich. Dessen vollständiges JSON ist mit der lokalen Ausgabe identisch; beide frischen Quell-Hashes stimmen überein. Abschlussnachtrag: 2026-11-10T18:18:18+01:00 (Europe/Berlin).

[Messdaten mit Quell-Hashes, Grenzen und Körper-/Fellresultaten aller 16 Proben](benchmarks/pakachi-spatial-coverage-2026-11-10.json). Reproduzieren: `node scripts/benchmark-pakachi-intersections.mjs`. Beide Körpernetze erreichen jetzt in allen acht Haltungen je Form `checked: true`; kein Teilnetz der 16 Gesamtproben bricht am Arbeitsbudget ab. `checked: true` bedeutet vollständige Prüfung der **unabhängigen Dreieckspaare innerhalb dieses Teilnetzes**, auch wenn dabei Schnitte gefunden werden.

| Körpernetz: transversale Schnittpaare | Arbeitsform, 99.176 Dreiecke | Tierform, 160.976 Dreiecke |
| --- | ---: | ---: |
| Neutral | 1 | 0 |
| Linke Hüfte 22,5° | 1 | 551 |
| Linke Hüfte 45° | 1 | 936 |
| Linke Hüfte 90° | 21 | 2.229 |
| Linkes Knie 22,5° | 1 | 0 |
| Linkes Knie 45° | 1 | 77 |
| Linkes Knie 90° | 1 | 613 |

Vorher endete der X-Sweep bei allen Körperproben nach 228 (Arbeitsform) bzw. 220 (Tierform) exakten Dreieckstests am räumlichen Budget. Jetzt sind je Körperprobe 13.485–14.884 bzw. 21.152–62.800 exakte Tests erforderlich; die räumlichen Teilbaumprüfungen bleiben unter 6,4 Millionen. Das ist mehr Messabdeckung und **keine Geometriereparatur oder beschleunigte Laufzeitgarantie**. Die zusätzlich gefundenen Schnitte waren vorher nicht messbar. Bei vollständiger Baseline kann die bestehende Korrektursperre nun auch an diesen großen Netzen neu nachgewiesene Schnitte verwerfen.

Abschlussartefakt ebenfalls vollständig geprüft: [Browsernachweise](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42857939759/artifacts/13785741902), ZIP-SHA256 `5a08cbf03720c26c3530259a5a2a915ec3e807155e3156bd47db47c8dbf2a230`. Beide frisch erzeugten GLBs stimmen bytegenau mit den unabhängig gemessenen Quellen überein. Der Produktionsimportbericht enthält genau drei vollständige Messungen; Frame-Grenzen 4275 / 4312.9 / 4276.2 ms, Median 4276.2 ms unter Software-WebGL. Keine kontrollierte Leistungsgegenüberstellung und keine GPU-/Zielhardware-Zusage.

Zusätzliche reale Gegenprobe auf der Tierform: Eine nur lesend evaluierte Gewichtsübertragung von linker Hüfte/Knie zur Schwanzbasis verwendet `amount * smoothstep(originalTailWeight, 0.5, 0.95)` in der bestehenden Palette. Bei 22,5° sinken mit vollem Übertragungsanteil die Dehnungsfehler **760 → 733**, während nachgewiesene Körper-Schnittpaare **551 → 567** steigen. `checkCandidateIntersectionRegression` liefert tatsächlich `accepted: false`, `checkedMeshes: 1`, `unmeasurableMeshes: 0`, `newIntersections: 16`, `complete: true`. Auch 45° und 90° zeigen mehr Schnitte (936 → 947 bzw. 2.229 → 2.374). **Kandidat verworfen**, keine Geometrie-/Gewichtsübernahme. Das ist ein konkreter Nachweis der nun nutzbaren vorhandenen Korrektursperre am großen Originalnetz; die charakterbezogene Testmaske ist kein allgemeines Erkennungsverfahren.

Grenzen bleiben sichtbar: pro Haltung sind weiterhin 63/61 Teilnetze wegen Kontakt-/Coplanar-Unklarheiten und je 28 wegen ungültiger Dreiecke unvollständig. Das Fell meldet in neutraler Pose 176/243 Schnitte, bleibt wegen Kontakten unvollständig. Keine Freigabe angrenzender Dreiecke, getrennter Teilnetz-Kollisionen oder kontinuierlicher Bewegungen. Insbesondere die Tierform-Hüfte ist weiterhin deutlich fehlerhaft.

Lokal: 14 Schnitt-Kernprüfungen einschließlich vollständiger Paarvergleichsreferenz bestanden; 57 gemeinsame Schnitt-/Korrektur-/Volumen-/Move-Prüfungen, TypeScript und Produktionsbuild bestanden. Die vorhandenen neun echten Charakterprüfungen bestehen ebenfalls. Beide zusätzlichen Körpernetz-Regressionen sind erfolgreich (acht Tests in der vollständigen Körper-Testdatei); der vollständige neue GitHub-Gesamtlauf ist wie oben dokumentiert erfolgreich abgeschlossen.

## Gemessene Originalformen – statische Schnittproben (10. November 2026)

**Quelle:** [GitHub Actions, eigenständiger Messlauf #1](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42826070965), Commit `a7ed2122bfca7b101d898139e06d75abded744cd`, [JSON-Artefakt](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42826070965/artifacts/13769627616). Sowohl dieser Messlauf als auch [die vollständige CI #107](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42826070904) sind erfolgreich abgeschlossen. Das bedeutet ausschließlich, dass Messung, Bericht und übrige automatisierte Tests funktioniert haben; **keine der Originalformen ist auf Kollisionsfreiheit geprüft**.

| Statische Messung | Arbeitsform | Tierform |
| --- | ---: | ---: |
| Vertices | 190.375 | 231.739 |
| Teilmodelle | 92 | 90 |
| Vollständig geprüfte Teilmodelle je Haltung | 0 | 0 |
| Kontakt-/Coplanar-Unklarheiten je Haltung | 62 | 60 |
| Ungültige Geometrien je Haltung | 28 | 28 |
| Budgetbedingte Abbrüche je Haltung | 2 | 2 |
| Nachgewiesene transversale Schnitte (Untergrenze) je Haltung | 36 | 38 |

| Gelenk/Winkel | Arbeitsform: Dehnungswarnungen | Tierform: Dehnungswarnungen |
| --- | ---: | ---: |
| Hüfte 0° | 0 | 0 |
| Hüfte 22,5° | 134 | 760 |
| Hüfte 45° | 239 | 1.258 |
| Hüfte 90° | 367 | 1.566 |
| Knie 0° | 0 | 0 |
| Knie 22,5° | 6 | 11 |
| Knie 45° | 62 | 47 |
| Knie 90° | 1 | 86 |

Beim Tierform-Knie bei 90° wurde außerdem **eine** Volumenwarnung gemessen, sonst keine. Die 36 bzw. 38 gefundenen Schnittpaare sind eine *Untergrenze in unvollständigen Teilmodellprüfungen*, keine verifizierte Gesamtzahl. Sie bleiben in dieser Stichprobe über die acht Gelenkhaltungen konstant. Das kann aus statischen/dekorativen Teilnetzen stammen und belegt **keine** gute oder schlechte Kollisionsentwicklung in den betroffenen Beugeflächen. Der ursprüngliche JSON-Bericht trunciert die Darstellung der Teilnetze auf die ersten 32; die nächste Berichtsversion priorisiert Körper-/Fellnetze und erfasst je Pose alle Teilnetze kompakt für die Ursachenanalyse.

Die Ausgangs-GLBs wurden nur gelesen, nicht überschrieben. Echte Gliedmaßen- und Anatomiequalität sowie Kontakte zwischen getrennten Meshes, angrenzende Dreiecke und kontinuierliche Bewegungen sind offen.

## Aktueller Entwicklungsnachweis – 10. November 2026

Der unveränderte Programmstand auf `develop`, Commit `37c730e219a0e6d0c482c45c659ef1f879227053`, ist durch [GitHub Actions #106](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42820898880) **vollständig erfolgreich** geprüft: **473/473 Node-Tests**, TypeScript-/Produktionsbuild, **46/46 Chromium-Browserfälle** und Produktionsbrowser-Importbenchmark. Das Ergebnis wurde aus Jobstatus und Joblogs geprüft. Der Lauf bestätigt diese konkrete Commit-Version, nicht spätere Programmänderungen. Die reale anatomische Qualität sowie der neue lesende Schnittbenchmark an den beiden echten rigged GLBs sind weiterhin **nicht** separat abgenommen.

Der vorangehende [Lauf #105](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42811738719) für `5e44e6d` war **rot**, obwohl 473 Node-Tests und der Build bestanden: Der Browserfall `closed skin keeps volume warnings visible ...` prüfte fälschlich den inzwischen ersetzten KI-Eintrag `unchecked: self-intersections`; nur 45 von 46 Browserfällen bestanden. Die Browsererwartung wurde in `37c730e` auf den vorhandenen Teilmodell-Schnittbericht sowie die noch ungeprüften Kollisionen umgestellt. Frühere fehlgeschlagene oder wegen Push-Konkurrrenz abgebrochene Läufe dürfen nicht als erfolgreich gezählt werden.

## Nachgewiesen

| Prüfung | Bestätigter Stand | Umfang und Grenze |
| --- | --- | --- |
| Node-Tests | [0.97.0](#version-0970): 460 in vollständiger CI bestanden | Einschließlich echter MCP-/OAuth-/Python-/ACP-Prozesse; keine manuelle Qualitätsabnahme. |
| TypeScript und Produktionsbuild | [0.97.0](#version-0970): vollständige CI bestanden | Bekannte Bundle-Größenwarnung; keine Aussage über Zielhardware-Leistung. |
| Chromium-Browserfälle | [0.97.0](#version-0970): alle 46 im vollständigen CI-Lauf bestanden | Software-WebGL, simulierte KI-Anbieter; keine reale KI-Inferenzabnahme. |
| Produktionsbrowser-Importmessung | [0.97.0](#version-0970): drei CI-Durchläufe bestanden | Mika mit 256 Gewichtsaufträgen; keine allgemeine Laufzeitgarantie. |
| Legacy-Testprogramme | [0.9.0](#version-090): beide bestanden | Steuerung, MQTT-Verhalten und Lebenszyklus des Originalplayers. |
| Python-MCP-/MQTT-Integration | [0.10.0](#version-0100): bestanden | Echter Python-Prozess und eingebetteter Testbroker; keine allgemeine externe Hostabnahme. |
| Originaldateien | [0.49.0](#version-0490): bytegenau erhalten | 83 Originaldateien einschließlich 72 Transformationsbildern. |

Vollständig ausgewerteter CI-Funktionsnachweis für 0.86.0: [Lauf 42486376327](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42486376327), Commit `05cf07ce6d81a0c0de76194470c9c47e642e8322`: 359 Node-Tests, TypeScript/Build, alle 36 Chromium-Browserfälle und drei Produktionsimportmessungen bestanden. Dieser Nachweis ist an den genannten Software-Commit gebunden; nachfolgende Dokumentationsänderungen sind keine neue Hardware- oder Verbindungsabnahme. Weitere CI-Ergebnisse stehen commitbezogen in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1). Ein erfolgreicher Testlauf ist keine visuelle oder anatomische Produktfreigabe.

## Lokal prüfen

Nach `npm ci`:

```sh
npm run verify
```

Für die zusätzliche Browserprüfung einmalig Chromium installieren und dann die vollständige Prüfung starten:

```sh
npx playwright install chromium
npm run verify:full
```

Bei fehlenden Linux-Systembibliotheken kann `npx playwright install --with-deps chromium` erforderlich sein. Die Prüfkommandos installieren selbst nichts und enden beim ersten Fehler mit Fehlerstatus. Ein fehlender oder blockierter Browser zählt nicht als bestandene Prüfung. HTML-Bericht: `playwright-report/index.html`; Fehlerartefakte: `test-results/`.

Der Workflow prüft Pull Requests vollständig. Direkte Pushes nach `main` sind nur bei ausschließlich passenden Dokumentationspfaden ausgenommen; gemischte Änderungen und `docs/references/original-sha256.json` bleiben prüfpflichtig. Alte Actions-Kontingentabbrüche sind keine Testergebnisse. `workflow_dispatch` bleibt verfügbar.

## Noch nicht abgenommen

- Designgetreuer 3D-Original-PaKaChi in beiden Formen und GPU-Inferenz auf Zielhardware. Erste echte CPU-Inferenz beider Formen ist seit 0.83.0 belegt.
- Anatomische Haut-/Bewegungsqualität, tatsächliches Mausgefühl und der gesamte Ablauf mit Nutzern ohne 3D-Vorkenntnisse.
- Echte lokale und Cloud-Anbieter sowie ein konkreter externer MCP-Host und NanoMQ-Broker.
- Große reale Importmodelle, Zielhardware und reale Browserkontingente.

## Visuelle Abnahme durchführen

1. Original-PaKaChi öffnen und beide Formen sowie die Transformation prüfen.
2. Mika/Nori und eine eigene GLB öffnen; Kamera mit gedrücktem Mausrad drehen, rechts verschieben, per Mausrad zoomen und Inversion prüfen.
3. Gesichtspunkte setzen, skalieren, verschieben und verbinden; Zurück/Wiederholen prüfen.
4. Vorhandene Skelettdaten erneut erkennen und den zutreffenden Hinweis bei ungeriggten Modellen prüfen.
5. Posen und Moves bearbeiten, abspielen, speichern und neu laden; Haut und Gelenkketten aus allen Richtungen prüfen.
6. Deutsch/English umschalten; eigene Namen müssen erhalten bleiben.
7. Im Player per Agent steuern; im Studio müssen externe Wiedergabebefehle abgewiesen werden.

Diese Liste beschreibt ausstehende Abnahmen.

## Prüfungen nach Version

Die jüngste Version steht zuerst. Für eine bestimmte Version die Dokumentgliederung oder die Browser-Suche verwenden.

## Version 0.98.0

Abschlussnachweis: Programmcommit `0c950b2c1f4d1ab11a056457d082af5db2231fa4` auf `develop` vollständig geprüft und als Meilenstein nach `main` integriert. Sowohl [Entwicklungsprüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42876664696) als auch [erneute main-Prüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42880474033) sind **erfolgreich abgeschlossen**: je **491/491 Node-Tests**, keine Fehler, Abbrüche oder übersprungenen Fälle; TypeScript-/Produktionsbuild; **47/47 Browserfälle** ohne als flaky gemeldete Fälle und jeweils **drei Produktionsimportmessungen**. Der neue Browserfall führt die echte Arbeitsformkorrektur über den Studio-Auftrag aus und prüft Vorschau, Übernahme, Undo/Redo und Projekt-Replay. Prüfzeit: 2026-11-10T20:26:38+01:00 (Europe/Berlin).

Beide Browser-ZIPs sind vollständig heruntergeladen, anhand der von GitHub gemeldeten SHA256 geprüft und inhaltlich ausgewertet. Die frischen Arbeits-/Tierform-GLBs stimmen bytegenau mit den dokumentierten Eingaben überein. Importmessung unter Software-WebGL, Frame-Grenzen: develop **2576.1 / 2775.6 / 2810.5 ms**, main **3643.4 / 3371.8 / 3484.9 ms**; Median **2775.6 / 3484.9 ms**. Keine kontrollierte Leistungsgegenüberstellung und keine GPU-/Zielhardware-Zusage.

Artefakt-SHA256: develop `1198bd5075ac0da1a62ee87383caf5ba70746191f4484bb3ee1c9e3253bb42d8`, main `e98f70ee5e1d198afa0d7dc8c2f4bb6ca52dfa3b271b5d3b52cb9c1bdce875b2`. Dieser Abschlussnachtrag ändert ausschließlich Dokumentation und Messdaten; der geprüfte Programmstand bleibt identisch.

Neue allgemeine Kantenentspannung mit virtuellen Positionsprojektionen, festen Randpunkten und gebundenen exakten UV-Nahtduplikaten. Die erzeugte Form wird auf die bestehende lineare Haut zurückgerechnet. Der Gegenhaltungs-Schritt friert sparse Vertices ein, die in acht gleichmäßig verteilten Beugehaltungen neue lokale Dehnungs-/Kompressions-/Flächenverstöße erzeugen. Die endgültige Form muss anschließend die bisherigen Ganznetz-Dehnungs-/Volumenprüfungen sämtlicher gespeicherter Posen und Move-Stichproben bestehen. Zusätzlich werden Zielpose, drei direkte Zwischenhaltungen und die ausgewählten Move-Schnittbilder gegengeprüft. Kein anatomischer Erkenner, keine kontinuierliche Kollisionsfreigabe.

[Reproduzierbare Messdaten](benchmarks/edge-relaxation-2026-11-10.json), erzeugt durch `node scripts/benchmark-edge-relaxation.mjs` mit unveränderten Original-GLBs:

| Referenzauftrag | Ergebnis |
| --- | --- |
| Arbeitsform, linke Hüfte, 90° X | Vollständiger automatischer Auftrag wählt `edge-relaxation`; 367 → 347 Dehnungswarnungen, 21 → 11 unabhängige Körper-Schnittpaare. |
| Gespeicherte Daten | Zwei Posen und eine eigene Schleife mit 33 geprüften Move-Stichproben; Quellzustand bleibt unverändert. |
| Unabhängige Gegenprobe | 65 Beugehaltungen ohne gemessene Dehnungs-/Volumenregression. Bei 22,5° / 45° / 67,5° bleiben Körper-Schnitte 1 → 1 / 1 → 1 / 2 → 1. |
| Tierform, 22,5° X | Ein explizit erzeugter und lokal beschnittener Kandidat bleibt wegen zusätzlicher Schnitte verworfen; keine übernommene Tierformkorrektur. |

Die Arbeitsformkorrektur betrifft 882 Vertices. Die Suche vergleicht weiterhin vorhandene Gewichts- und geometrische Verfahren und nutzt dieselben Revisions-, Vorschau- und Übernahme-Mechanismen im Studio und integrierten Assistenten. Die konkrete Arbeitsformprobe mit Move-Gegenprüfung wählt die neue Form; ohne Move kann eine andere bereits verfügbare Gewichtsvariante die Zielpose stärker verbessern. Die isolierte Zielpose ist daher kein Ersatz für die gesamte Bewegung.

Lokal: neue Kernel-/Gegenhaltungs-Prüfungen sowie die vorhandenen automatischen/geometrischen und Bildrekonstruktionsfälle erfolgreich; beide Originalformen wurden mit realer Geometrie geprüft. Der neue Browserfall führt den echten Auftrag aus, vergleicht Original/Korrektur und prüft ausdrückliche Übernahme, Undo/Redo und Projekt-Replay. Importierte namenlose Morphattribute behalten ihre ursprünglichen Wörterbuchnamen; der neue Regressionstest und die Live-/Pure-Vorschau am Originalcharakter bestehen. Der vollständige CI-/Artefaktnachweis steht am Anfang dieses Abschnitts.

Grenzen: Der Positionsfit ist ein lokales iteratives Verfahren und kann in einem unbrauchbaren Minimum enden. Höchstens 200.000 Vertices, 600.000 Indizes, 8.192 aktive Vertices, 30.000 relevante Kanten und 128 Projektionen je Kante pro Fit; höchstens vier gespeicherte Formen/32.768 sparse Vertices. Der Gegenhaltungs-Schritt ist auf acht Posen, acht Beschneidungsschritte und 12.000 betroffene Dreiecke je Teilnetz begrenzt. Aufwandsreserve bleibt gemeinsam bei zwölf Millionen Kanten-/Dreiecksoperationen; der Auftrag hat weiter 100 Millionen reservierte Vertex-Stichproben. Komplexe Aufträge können diese Grenzen erreichen. Nicht messbare Volumen-/Kontaktfälle werden nicht als behoben ausgegeben. Teilmodell-Kollisionen, weitere Winkel, kombinierte Gelenkbewegungen und sichtbare Charakterqualität bleiben offen.

## Version 0.97.0

Abschlussnachweis: [vollständiger CI-Lauf 42767317803](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42767317803), Quellcommit `4e85604bcb9f562fb43eda2784f286a457a729f9` auf `develop`: **460 Node-Tests ohne Fehler, Abbrüche oder übersprungene Fälle**, TypeScript/Produktionsbuild, **alle 46 Chromium-Fälle (14,9 Minuten)** und **drei Produktionsbrowser-Importmessungen** erfolgreich. Bytegenaue Prüfung aller erhaltenen Originaldateien einschließlich 72 Frames bestanden. Abschlusslogs und Browseraufnahmen geprüft; die kleine Hautänderung ersetzt keine visuelle/anatomische Charakterabnahme.

Artefakte verifiziert: Browser-ZIP SHA256 `2f987dca41553394c6f9a0220a36f1eff6f377d67b2eb5471569c39d62b9a976`; Quellen-ZIP SHA256 `6c24b178a1f32abff47fdba6141137b9a8e61937c31f452941e81148658ea0fa`. Beide Rohrekonstruktionen stimmen bytegenau mit den lokalen Eingaben überein. Frisch vorbereitete 59-Gelenk-Charakterdateien entsprechen weiterhin dem validierten vorherigen Stand. Mika/256 Gewichtsaufträge unter Software-WebGL: Frame-Grenzen **4.188,5 / 4.447,4 / 4.310,0 ms**, Median **4.310,0 ms**. Keine kontrollierte Leistungsgegenüberstellung oder Zusage für Zielhardware. Nach dieser vollständigen Prüfung von `develop` nach `main` integriert. Der Abschlussnachtrag ändert nur Dokumentation/Messdaten; derselbe geprüfte Quellstand wird ohne zweiten identischen CI-Lauf integriert.

Prüfzeit: 2026-11-10T07:14:26+01:00 (Europe/Berlin). Neue allgemeine lokale Kantenform im automatischen Studio-/KI-Auftrag, keine neue Inferenz und keine Änderung der bisherigen 59-Gelenk-Charakterdateien. Lokal **459 Node-Tests ohne Fehler/Abbrüche/übersprungene Fälle** sowie TypeScript/Produktionsbuild und **alle fünf gezielten Chromium-Fälle** erfolgreich (bekannte Bundle-Größenwarnung). Der wegen des unvollständigen lokalen Frame-Checkouts dort ausgesparte Originaldateitest ist in der vollständigen CI ebenfalls bestanden.

- Fehlerdiagnose ordnet Hautfehler aktiven Knochen/Vorfahren zu und schätzt die betroffene Grundformfläche. Virtueller begrenzter Kantenlängenfit wird in das vorhandene sparse Korrekturformat zurückgerechnet. Originalgewichte, Posewerte, Moves und Quelldateien bleiben erhalten. Relative freie/importierte/poseabhängige Morphbeiträge sind in der Fit-Ausgangsposition enthalten.
- Sieben neue Kernprüfungen: verbesserte Kantenmetrik, unveränderte Randpunkte/Eingaben, identische Nahtpunkte, Aufwandgrenze, Abbruch und Revisionswechsel, Morph-/Skinmatrix-Parität, Live-/Pure-Vorschau, Replay, aktive Vorfahren und echte Rohrekonstruktion. Unabhängige 65-Bild-Schleife und alle gespeicherten Posen bestehen dieselben komponentenweisen Dehnungs-/Volumengegenprüfungen.
- [Reproduzierbare Messung](benchmarks/automatic-draft-correction-2026-11-10.json): `node scripts/benchmark-automatic-draft-correction.mjs --moves`. Je Form erstes generisches Skelett, vier einzelne 30°-X-Beugen, neutrale Pose und Rest↔schlechteste-Pose-Schleife. Arbeitsform: **784 → 765** auffällige Dreiecke am rechten Ellenbogen; übrige Proben **302 / 115 / 469** unverändert. 1.952 betroffene Vertices, 30 Varianten, 2.056.870 reservierte Kanteniterationen, 33 Move-Stichproben und keine neue gemessene Volumenwarnung. Tierform: **kein akzeptierter Vorschlag**; Dreiecksfehler **34 / 147 / 112 / 147**, linke Ellenbogenprobe weiter mit einer Volumenwarnung. Quelldaten bleiben identisch. Das ist ein kleiner Fortschritt, keine reparierte Figur.
- Neuer Browserfall verwendet die echte Rohrekonstruktion, berechnet ihr erstes Skelett und den Korrekturauftrag produktiv. Er prüft Original-/Korrekturvorschau, unveränderte Revision während der Suche, gesperrtes Speichern im Vergleich, explizite Übernahme, Undo/Redo, Projekt-Replay mit erhaltenen Posen/Moves und Standard-Morphspur im Animations-GLB. Bilder `edge-fit-draft-original.png` / `edge-fit-draft-candidate.png`. Keine simulierte Geometrie in diesem Fall; Anbieter-/GPU-Abnahme wird dadurch nicht behauptet.

Zusätzliche Tierform-Gegenprobe: Die volle lokale Kantenform am linken Knie senkt in der 30°-Zielpose die Dreiecksfehler von **147 auf 77** und besteht dort alle vier gespeicherten Beugeposen. Bei 22,5° sinkt zwar die Gesamtzahl **94 → 50**, aber stark kollabierte Dreiecke steigen **1 → 2**. Dieser Kandidat wird deshalb verworfen; weitere Move-Bilder erhöhen einzelne Grenzüberschreitungen. Die Messkategorien werden nicht zugunsten einer besseren Gesamtsumme übergangen. Details im bestehenden Messbericht unter `supplementalRejectedCandidateProbe`; separate direkte Diagnose mit `buildEdgeFitCorrection`, `correctionSamples` und derselben 33-Bild-Schleife, keine übernommene Projektänderung.

Grenzen: nicht konvexe, begrenzte Suche auf vorhandenen Einflusspaletten; symmetrische oder ungünstige Regionen können ohne Kandidat bleiben. Kein generalisierter Anatomiedetektor. Automatische Gegenprüfung bleibt bei 16 Schritten je Übergang; die zusätzlichen 65 Bilder sind Testabdeckung dieses einen Beispiels. Keine kontinuierliche Kollisions-/Bewegungsfreigabe, keine lokale Volumengarantie. Absolute Morphs und nicht unterstützte Morphattribute werden für den neuen Fit ausgelassen. Budgets und Formatgrenzen im [Studio-Ablauf](STUDIO.md#hautform-aus-netzverbindungen-0970).

## Version 0.96.0

Abschlussnachweis: [CI-Lauf 42717633143](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42717633143), Quellcommit `8a74be06746bcb084814ccfef5c49527152e9ef6` auf `develop`: **453 Node-Tests ohne Fehler, Abbrüche oder übersprungene Fälle**, TypeScript/Produktionsbuild, **alle 45 Chromium-Fälle (11,2 Minuten)** und drei Produktionsbrowser-Importmessungen erfolgreich. Bytegenaue Originalprüfung einschließlich aller 72 Frames bestanden. Abschlusslogs und Artefakte geprüft; aktuelle Vorher-/Nachher-Aufnahmen zeigen auf dem ausdrücklich synthetischen Prüfkörper die vom großen seitlichen Anbauteil unabhängige Skelettplatzierung. Kein neuer Nachweis anatomischer oder visueller Charakterqualität.

Artefakt-ZIP SHA256 `c633ac175b06468c3f2127f280c638977bae57976946f72364bb8b47fabef9be` verifiziert. Beide bisherigen 59-Gelenk-Charakter-GLBs entsprechen bytegenau dem validierten 0.95.0-Stand. Mika/256 Gewichtsaufträge unter Software-WebGL: Frame-Grenzen 3.713,1 / 3.341,0 / 3.508,7 ms, Median 3.508,7 ms. Keine kontrollierte Leistungsvergleichsmessung oder Leistungszusage für Zielhardware. Nach erfolgreicher Prüfung zur Integration nach main freigegeben; dieser Nachtrag verändert ausschließlich Dokumentation.


Prüfzeit: 2026-11-10T00:00:33+01:00 (Europe/Berlin). Generischer Standflächenrahmen für neue Skelettentwürfe, keine neue Inferenz oder Anatomiefreigabe.

- Zwei/vier räumlich getrennte Bodengruppen, begrenztes belegungsbasiertes Raster, 24 Gruppierungsiterationen, Horizontalachsen und optionale Rumpfhöhe. Kein Import der gemessenen PaKaChi-Punkte in die Laufzeit. Maximal 4.096 Bodenrasterzellen und bisherige Modellbudgets. Bei uneindeutiger Gruppierung ausdrücklicher Rückfall auf Gesamtmaßvorlage; diese ist zusätzlich manuell wählbar.
- Vier neue Tests prüfen große seitliche Anbauteile, verschobene/gleichmäßig skalierte/um Y gedrehte Figuren, vier Pfoten, kontinuierlichen Sockel, manuelle Vergleichsvorlage sowie beide realen Rohrekonstruktionen. Auf 16 zuvor gemessenen Arm-/Beinpunkten verbessert sich die RMS-Platzierung bei denselben Vorlagen: Arbeitsform 0,2890 → 0,1235; Tierform 0,2849 → 0,1127 Modelleinheiten. Gesenkte Armvorlage Arbeitsform: 0,0876. [Sechs Varianten mit Einzelwerten](benchmarks/draft-body-frame-2026-11-10.json).
- Bestehende Neutralform-, Gewichts-, GLB-/Projekt-Replay-, Abbruch- und Vorschauprüfungen bleiben erfolgreich. Drei gezielte Chromium-Fälle bestanden: synthetische Figur mit großem seitlichem Schwanz, bisherige/nach Standflächen ausgerichtete Vorschau, Originalrückkehr, Übernahme, IK, Undo/Redo, Speichern/Laden und gespeicherte Rahmenmetadaten. Generator simuliert, Skelett-/Hautberechnung produktiv.
- Lokaler vollständiger Node-Lauf: 452 Tests ohne Fehler, Abbrüche oder übersprungene Fälle; TypeScript und Produktionsbuild bestanden (bekannte Bundle-Größenwarnung). Der Originaldatei-Test bleibt lokal wegen des unvollständigen Frame-Checkouts ausgespart; die vollständige CI prüft ihn. Vier direkte gerenderte Vergleiche der echten Rekonstruktionen (je Form Gesamtmaße/Standflächen) gesichtet: Körpermitte und Pfotenanker liegen deutlich passender, Hals-/Schulter-/Hüft-/Schwanzdetails bleiben sichtbar unzureichend. Vollständige CI auf dem genannten Quellcommit abgeschlossen; Freigabe und Nachweise siehe oben.

Grenzen: Geometrische Schätzung für stehende Figuren. Keine allgemeine Körper-/Gliedmaßensegmentierung, Anatomie-/Pose-/Orientierungserkennung, Finger-/Gesichtsrig oder korrekte Schwanzkette. Alle vier 30°-Proben je Form haben weiterhin Oberflächenwarnungen. Eine Tierform-Ellenbogenprobe erhält trotz weniger Dreiecksfehlern eine neue Volumenwarnung; auch in der Arbeitsform verschlechtern sich einzelne Beugemetriken. Bessere Gelenkplatzierung bedeutet keine allgemeine Hautfreigabe. Grundform/Originalbilder und bisherige bearbeitete 59-Gelenk-Avatare werden nicht ersetzt. Spärliche Netze, fehlende Standflächen, bodennahe Anbauteile und ungewöhnliche Proportionen benötigen Nacharbeit.

## Version 0.95.0

Abschlussnachweis: [CI-Lauf 42706009235](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42706009235), Commit `46a4d57`: 449 Node-Tests, Build, alle 45 Chromium-Fälle (8,3 Minuten) und drei Produktionsimportmessungen erfolgreich. Abschlusslogs, bytegenaue Originalprüfung und Browserartefakte ausgewertet. Über PR #1 als `67f5ea0` nach main übernommen; develop wurde von diesem Stand angelegt.

Prüfzeit: 2026-11-09T22:46:22+01:00 (Europe/Berlin). Allgemeine erste Skelettvorlagen für den Bild-zu-3D-Ablauf; keine neue Generatorinferenz oder anatomische Freigabe.

- Eigener proportionaler Aufbau für Zweibeiner und Vierbeiner, geometrische Hautbindung mit vier Einflüssen, linke/rechte Übergangszone und normale glTF-Skelette. Quelle bleibt bytegleich; unabhängige Meshgewichte auch bei ursprünglich gemeinsam genutzter Geometrie. Neutrale Weltpositionen, UVs und Materialien bleiben erhalten.
- Neue Tests prüfen tatsächlich verformte Gliedmaßen ohne Mitziehen der Gegenseite, transformierte Szenen, gültige Gewichte, GLB-/Projekt-Replay und Move-Erfassung; Abbruch und ungeeignete Quellen hinterlassen keinen halben Skelettaufbau. UI-Tests prüfen Originalrückkehr, beide Vorlagen, getrennte Übernahme, Fehler und verspätete Ergebnisse.
- Drei gezielte Chromium-Fälle bestanden: neue echte Skelett-/Hautberechnung auf synthetischer Geometrie, ursprünglicher Generierungsablauf und Rollback bei fehlgeschlagener Veröffentlichung. Neuer Fall bewegt eine IK-Kette, prüft Undo/Redo, speichert und lädt das Projekt. Bildgenerator ist im Browserfall simuliert; die Skelett-/Exportberechnung ist produktiv. Vorschau-/Posenaufnahmen gesichtet, synthetischer Prüfkörper klar erkennbar.
- Beide echten PaKaChi-Rohrekonstruktionen lokal mit passender Vorlage gebunden. 50.870 / 81.388 Vertices, maximal 0,0000000267 / 0,0000000269 Grundformabweichung. Vier einzelne 30°-Proben je Modell liefern weiter Oberflächenwarnungen; Tierform-Knie links zusätzlich zwei Volumenwarnungen. Keine automatische Freigabe, keine Änderung an Originaldateien oder veröffentlichten Charaktermodellen. [Messbericht](benchmarks/draft-rigs-2026-11-09.json).
- Abschließender lokaler Node-Lauf: 448 Tests ohne Fehler, Abbrüche oder übersprungene Fälle. Der Originaldatei-Test bleibt lokal wegen des unvollständigen Frame-Checkouts ausgespart; die vollständige CI prüft ihn. TypeScript und Produktionsbuild bestanden (bekannte Bundle-Größenwarnung). Vollständige CI einschließlich frischer CPU-Aufbereitung, sämtlicher Browserfälle und drei Produktionsimportmessungen wird commitbezogen in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) ausgewertet.

Grenzen: geeignete Grundpose und Y-up/+Z-front vorausgesetzt; keine Orientierungs-/Anatomieerkennung, kein Finger-/Gesichtsrig, keine hochwertige automatische Gewichtskorrektur und keine Kollisionsfreigabe. Zusätzliche Vorbereitung läuft lokal ohne Anbieteraufruf; die vorausgehende Bildgenerierung benötigt weiterhin eine separat eingerichtete TripoSR-Laufzeit. GPU-/Caddy-Abnahme und bessere Generatorqualität bleiben offen.

## Version 0.94.0

Abschlussnachweis: [CI-Lauf 42690314577](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42690314577), Commit `99950b3576c0c604e6446554e053aa626ebded7e`: 441 Node-Tests, Produktionsbuild, alle 44 Chromium-Fälle und drei Produktionsimportmessungen erfolgreich. Abschlusslogs und Artefakte einschließlich der neuen Korrekturaufnahmen geprüft.

**Prüfzeitpunkt:** 2026-11-09T20:52:52+01:00 (Europe/Berlin).

- Allgemeiner geometrischer Kandidat am geschlossenen 90°-Prüfarm: Volumenverhältnis rund 0,634 → über 0,8 bei unveränderten Gelenk- und Posewerten. Tatsächliche Oberfläche, reine Vorausberechnung und gespeichertes Replay stimmen überein. DQ-Mathematik mit starren Referenztransformationen geprüft; echte Skalierung/Reflexion und singuläre volle 180°-Bindung werden nicht geometrisch freigegeben.
- Native und neue Formen behalten getrennte Treibergruppen; mehrere neue Formen werden gemeinsam ausgewertet. Ursprüngliche Knochennamen mit Leerzeichen bleiben über einen echten GLB-Rundlauf eindeutig gebunden. Geometrische Vorschau erhält Daten und stellt importierte Morph-Attribute und Livepose wieder her. Übernahme ist eine Undo-/Redo-Aktion, erhält die gespeicherten Posekanäle und Move-Folgen und setzt Prüfhilfen.
- Neue eigenständige Tests für Kandidaten, native/pure/live-Parität, Speichern/Laden, Model Zoo, Move-Kompatibilität, valide Daten-/Vertexlimits, Abbruch-/Revisionsschutz durch den vorhandenen Auftrag und tatsächliche GLB-Animation einschließlich Zwischenbildern. Rigged-GLB erhält native Treiber; gebackener Animations-GLB spielt in einem gewöhnlichen AnimationMixer ohne PaKaChi-Treiber.
- Gerenderter neuer Ablauf prüft Auswahl der geometrischen Variante, Original-/Korrekturansichten, tatsächlich verschwundene Volumenwarnung, explizite Übernahme, Undo/Redo, Speichern und erneutes Laden. Der vorhandene volle 180°-Prüffall wird ausdrücklich als Suchziel gewählt und prüft weiterhin den Gewichtskandidaten mit verbleibender Volumenwarnung.
- Tatsächliche neue Knie-/Hüftproben beider PaKaChi-Formen mit Radien 0,3/0,6 und Stärken 0,25/0,5/1 untersucht. Keine Variante besteht die gemeinsame Ziel-Gegenprüfung: teilweise weniger Dreiecksfehler (Tierform-Hüfte etwa 1566 → 1545), aber schlechtere Teilmetriken; deshalb verworfen. Keine neue akzeptierte Charakterkorrektur behauptet. [Reproduzierbare Messdaten](benchmarks/geometric-corrections-2026-11-09.json), erneut mit `node scripts/benchmark-geometric-corrections.mjs` erzeugbar.
- Gesamtbewertung über alle Stichproben getestet: Eine geometrische Variante verbessert ein isoliertes Zwischenbild, lässt aber die volle Kollaps-Haltung schlechter als eine Gewichtsvariante; die Suche wählt die insgesamt bessere Gewichtsvariante. Unabhängige gewöhnliche Morph-/Gesichtseinflüsse bleiben beim Reset und Vergleich erhalten.
- Die vorherigen Ergänzungen adaptiver Move-Diagnose und der eigenständigen Schnittdiagnose werden in diesen Meilenstein aufgenommen. Letzter vorheriger [CI-Lauf 42640052991](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42640052991), Commit `6958574`, vollständig erfolgreich; kein Nachweis für die neuen geometrischen Formen.

**Verfahren und Grenzen:** Eigene Implementierung eines starren Dualquaternion-Vergleichs nach [Kavan et al., Skinning with Dual Quaternions](https://users.cs.utah.edu/~ladislav/kavan07skinning/kavan07skinning.html), keine übernommene Quellcodebibliothek. Der Vergleich liefert ein Formziel, keine Qualitätsgarantie. Die Umrechnung in lineare Haut-Morphs verlangt eine nicht singuläre Bindung. Maximal vier Formen, 32.768 betroffene Vertices insgesamt, bis zu acht Kontextknochen; höchstens 32 native Treiber je Teilmodell. Absolute native Morphs und umgebaute Hautbindungen werden für die neue Erzeugung ausgeschlossen. Gegenprüfung aller gespeicherten Posen und bisherigen 16 Move-Schritte je Übergang, keine kontinuierliche oder adaptive Auftragsprüfung. Keine automatische Selbstüberschneidungs-/Anatomiefreigabe. Neue Projektfelder und Treibergruppen benötigen mindestens 0.94.0; ältere Leser können sie ignorieren. Lokale Prüfung abgeschlossen: 440 Fälle im abschließenden Gesamtlauf bestanden; darunter neue Regressionen für gewöhnliche Morph-Einflüsse sowie deaktivierte Formen nach Knochenlöschung und deren Wiederherstellung. TypeScript/Produktionsbuild und sechs gezielte Browserfälle bestanden; vier Korrektur-/KI-Fälle nach dem letzten Bindungs-Fix erneut grün, einschließlich tatsächlicher Knochenlöschung und Undo nach dem Laden einer geometrischen Form. Vorher-/Nachher-Aufnahmen des neuen 90°-Prüfarms gesichtet: sichtbare Einschnürung deutlich verringert, keine Anatomiefreigabe. Frische CPU-Aufbereitung mit Pipelinehash `cb22146972091016b945f526b0a18848e2e3ef78f01fed2418309146df4b7dff`; beide GLBs sind bytegleich zum zuvor validierten Charakterstand. Vollständiger neuer CI-Lauf wird commitbezogen in PR #1 ausgewertet.

## Version 0.93.1

**Prüfzeitpunkt:** 2026-11-09T14:23:44+01:00 (Europe/Berlin).

- Vollständigen 0.93.0-CI-Fehler lokal reproduziert: Die alte Pose-Suche endete bei 1/16, obwohl ein kleinerer Anteil die neue Volumenprüfung besteht. Tatsächlicher Mika-Projektstand: 450 auffällige Dreiecke und Volumenverhältnis 4,7040× in der Ausgangspose; bei 1/16 null Dreieckswarnungen, aber weiterhin 1,2315× Volumen; bei 1/32 beide Prüfungen bestanden.
- Suchbereich auf zwölf begrenzte Proben bis 1/1024 erweitert. Grenzwerte und Pflichtprüfungen bleiben unverändert. Eine neutrale Nullbewegung wird nicht als Korrektur ausgegeben; keine Änderung der Hautgewichte oder Quelldaten.
- Neuer unabhängiger Regressionstest mit kleinem geschlossenem Tetraedernetz scheitert vor der Korrektur und besteht danach bei 1/512. Prüft Oberflächen-/Volumengrenzen und Erhalt von Livepose, gespeicherter Pose und Geometrie. 19 betroffene Node-Fälle bestanden. Produktionsbuild und vier gezielte Chromium-Fälle bestanden: der zuvor fehlgeschlagene Mika-Ablauf einschließlich tatsächlicher Volumenmessung sowie die drei automatischen Studio-/KI-Korrekturfälle. Vollständiger neuer Lauf wird in PR #1 ausgewertet.

**Grenzen:** Schonendere Pose erhält einen kleineren Bewegungsumfang und repariert kein Rig. Die Grenzen der algebraischen Volumenschätzung aus 0.93.0 bleiben bestehen.

**CI-Nachtrag:** [Lauf 42625352516](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42625352516), Commit `15ef43b`: 424 Node-Tests ohne Fehler/Abbrüche/übersprungene Fälle, Produktionsbuild, alle 43 Chromium-Fälle (13,8 Minuten), drei Importmessungen und Artefakte erfolgreich. Der zuvor fehlgeschlagene Mika-Fall ist bestanden. Frische Modellbytes und Pipelinehash stimmen mit dem lokal validierten Stand überein. Mika/256 Aufträge, Software-WebGL: 4.191,4 / 4.389,1 / 4.607,8 ms; Median 4.389,1 ms. Keine Zielhardware-Leistungszusage.

## Version 0.93.0

**Prüfzeitpunkt:** 2026-11-09T10:52:35+01:00 (Europe/Berlin).

- Geschlossene Komponenten werden über exakte Grundform-Positionsgleichheit und orientierte Kanten-/Vertex-Fächer erkannt. Algebraisches Volumen mit komponentenlokalem Bezugspunkt und kompensierter Summe; starre Bewegung und Größenverhältnisse analytisch geprüft. Keine Änderung von Quelldaten.
- Offene, entartete, ungültige, nicht-mannigfaltige oder inkonsistent orientierte Netze und verschwindende Referenzvolumen werden nicht als erfolgreiche Volumenmessung ausgegeben. Pose-Nahttrennung, ungültige Koordinaten, Orientierungsumkehr und Kollaps geprüft. Zwei getrennte Schalen mit sich rechnerisch aufhebenden Volumenänderungen erzeugen getrennte Warnungen.
- Tatsächlicher geschlossener 180°-Hautprüffall: Ausgangsvolumenverhältnis 1/3. Lokale Korrektur verbessert die Dreiecksdehnung, das Volumen bleibt unter 0,8× und deshalb weiterhin auffällig. Zusätzlicher Fall hat ausschließlich eine Volumenwarnung; der automatische Auftrag kann ihn selbst auswählen und verbessern. Sämtliche Move-Stichproben werden weiterhin gegengeprüft.
- Gemeinsamer Schutz verwirft Kandidaten bei erhöhten Grenzüberschreitungen oder Verlust messbarer Netzteile. Reine Volumenwarnungen erscheinen in Pose-/Move-Berichten und KI-Ausgaben. Neuer gerenderter Ablauf zeigt nach Übernahme weiterhin die Volumenwarnung bei null Dreiecksdehnungswarnungen, liefert dieselben KI-Messwerte und öffnet das auffällige Move-Bild. Sechs gezielte Chromium-Fälle bestanden. Aufnahme gesichtet: deutliche Einschnürung bleibt, daher keine Körperformfreigabe.

- Lokal 421 Tests im Gesamtlauf bestanden; anschließend der hinzugefügte neunte Volumentest und betroffene Diagnose-/KI-/Editorfälle erfolgreich nachgeprüft (422 unterschiedliche Fälle insgesamt). TypeScript und Produktionsbuild bestanden; bekannte Bundle-Größenwarnung. Eine bytegenaue Originaldatei-Prüfung folgt zusätzlich in vollständiger CI.
- Tatsächliche PaKaChi-Grundformen vermessen: Körper der Arbeitsform drei, Tierform elf geschlossene messbare Komponenten, jeweils Verhältnis 1. Fellkomponenten offen und nicht messbar. [Messabdeckung samt Modell-Hashes](benchmarks/studio-volume-2026-11-09.json). Keine neue Prüfung aller verformten Charakterhaltungen auf Volumenerhaltung.
- Reale Gegenprobe mit weitreichendem Gewichtstransfer: 32 → 0 Dreieckswarnungen, aber Volumenverhältnis 0,3333 → 0,2972. Gemeinsame Gegenprüfung und lokale Suche verwerfen diese Variante. KI-Details priorisieren auffällige/große Netze vor der Begrenzung auf 32 Teilmodelle.

**Verfahren und Grenzen:** Geschlossene Komponenten werden getrennt geschätzt; 0,8–1,2× ist eine feste technische Warnschwelle. Kein Selbstüberschneidungstest, keine Erkennung jeder lokalen Einschnürung, kein physikalischer Volumen- oder Anatomienachweis. Offene Fellflächen bleiben nicht messbar. Drei Radien, vier Gelenke und sechs lokale Transfers je Radius; unveränderte Stichproben-/Vertexbudgets. Keine Änderung der PaKaChi-GLBs oder ihrer CPU-Aufbereitung. [Fachlicher Bezug: CGAL, Volumen geschlossener Dreiecksnetze](https://doc.cgal.org/latest/Polygon_mesh_processing/group__PMP__measure__grp.html); eigene Implementierung ohne CGAL-Abhängigkeit.

**CI-Nachtrag 0.93.0:** [Lauf 42599717976](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42599717976), Commit `a0a5f2a9d6d0d0e70a9e2758b52a703c4e742fd4`: 423 Node-Tests ohne Fehler/Abbrüche/übersprungene Fälle und Produktionsbuild bestanden. 42 von 43 Browserfällen bestanden; „surface warning and gentler pose“ scheitert wegen der zu früh endenden Suche, nicht durch Timeout oder fehlenden Browser. Produktionsimportmessungen wurden deshalb nicht ausgeführt. Fehler ist mit 0.93.1 gezielt korrigiert; keine vollständige CI-Freigabe für 0.93.0 behauptet.

## Version 0.92.0

**Prüfzeitpunkt:** 2026-11-09T07:15:16+01:00 (Europe/Berlin).

- Lokaler automatischer Korrekturauftrag am tatsächlichen synthetischen Hautmodell getestet: Gelenkauswahl ohne Namen oder manuelle Auswahl, automatische Radiensuche, Verbesserung bei unveränderten Posen/Livewerten/Geometrie und vollständige unabhängige Gegenprüfung der Move-Stichproben. Ergebnisse und fehlende Verbesserung werden getrennt behandelt.
- Gegenprobe mit tatsächlicher Interpolation: Eine lokale Korrektur besteht alle gespeicherten Einzelposen und bisherige Neutral-Zielpose-Proben, verschlechtert jedoch ein Move-Zwischenbild. Der automatische Auftrag verwirft sie. Abbruch, Revision, zu große Aufträge, neutrale Ziele und spätere Suchvarianten geprüft.
- Vorschau stimmt vertexweise mit der reinen Kandidatenberechnung überein, erhält gespeicherte Daten und stellt ursprüngliche Attribute/Livepose wieder her. Native Korrekturtreiber sind im Original aktiv, bei temporären veränderten Gewichten deaktiviert und danach wiederhergestellt.
- Übernahme erhält Posewerte und Move-Folgen, markiert Posen zur Sichtprüfung und ist eine Undo-/Redo-Aktion. Unbekannte/veraltete/verwendete Vorschlags-IDs und fehlende KI-Freigabe werden abgewiesen.
- Zwei neue gerenderte Browserfälle bestanden: kompletter Studio-Auftrag mit Original-/Korrekturvergleich, Übernahme, Undo, Speichern/Laden; integrierter Assistent delegiert eine echte lokale Suche an das Studio, wertet deren Ergebnisse aus, bietet Vergleich und übernimmt erst nach Zustimmung. Anbieterantworten simuliert, Geometrieberechnung tatsächlich ausgeführt.
- Abschließender gezielter Browserlauf: fünf Fälle bestanden, einschließlich bisheriger Move-Diagnose, KI-Sequenzvorschau und manueller lokaler Gewichtssuche. Vorher-/Nachher-Aufnahmen gesichtet: Kollaps wird gemindert, deutliche Einschnürung bleibt sichtbar. Keine Volumen- oder Anatomieabnahme.
- 413 Node-Tests lokal bestanden, TypeScript und Produktionsbuild erfolgreich (bekannte Bundle-Größenwarnung). Python-MCP-Modul syntaktisch geprüft. Die eine bytegenaue Originaldatei-Prüfung läuft in vollständiger CI; lokal sind nicht alle unveränderten Originalframes vorhanden.

**Grenzen:** Höchstens vier Gelenke, zwei Radien und sechs Transfers je Radius, 512 Ausgangsstichproben und 100 Millionen Vertex-Auswertungen je Auftrag. Eine Gewichtsübertragung je angebotener Änderung. Keine neue ungeriggte Anatomie, freie Mesh-Korrekturen, Kollisionen, Volumenfreigabe oder lückenlose Bewegungsgarantie. Kein echter Anbieter-/Caddy-/GPU-Lauf. PaKaChi-Geometrie und die charakterspezifische Aufbereitung bleiben auf dem vorherigen Stand.

**CI-Vorgänger vollständig ausgewertet:** [Lauf 42539989715](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42539989715), Commit `fe8ae105d84d35fc1d401dfdda84ebff78ffa9b8`: 404 Node-Tests, Build, 40 Browserfälle, drei Importmessungen und Artefakte erfolgreich. Frischer Pipelinehash und beide GLB-Hashes stimmen mit dem lokal validierten Modellstand überein. Neuer Lauf wird commitbezogen in PR #1 geprüft.

**CI-Nachtrag:** [Lauf 42572232538](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42572232538), Commit `b895bb84d475ccc770100264c688d6b7dc82d138`: 414 Node-Tests ohne Fehler, Abbrüche oder übersprungene Fälle; TypeScript/Produktionsbuild, alle 42 Chromium-Fälle (13,6 Minuten), drei Produktionsimportmessungen und Artefakte erfolgreich. Bytegenaue Prüfung von 83 Originaldateien einschließlich 72 Frames bestanden. Frischer Pipelinehash und beide GLB-Hashes entsprechen dem lokal validierten Charakterstand. Mika/256 Aufträge, Software-WebGL: 4.646,5 / 4.579,0 / 4.472,7 ms, Median 4.579,0 ms; keine kontrollierte Leistungsvergleichsmessung. Original-/Korrekturbilder gesichtet, Einschnürung bleibt; keine Volumen-/Anatomiefreigabe für diesen Stand.

## Version 0.91.0

**Prüfzeitpunkt:** 2026-11-09T01:19:09+01:00 (Europe/Berlin).

- Lokal 380 allgemeine Node-Tests und 23 Originalmodelltests bestanden (403 insgesamt). Die einzelne bytegenaue 83-Originaldateien-Prüfung wird in vollständiger CI ausgeführt; lokal sind nur die für Modellarbeit benötigten Quelldateien vorhanden. TypeScript und Produktionsbuild bestanden (bekannte Bundle-Größenwarnung). Alle drei Originalmodell-Browserfälle und der neue Move-Diagnosefall bestanden. Der Tierformfall wurde nach einem durch die Versionsänderung ausgelösten Vite-Seitenneustart auf stabilem Stand wiederholt und bestand in 51,5 Sekunden bei unverändertem 90-Sekunden-Limit.
- Neue Tests weisen einen Kollaps zwischen zwei einzeln unauffälligen Posen nach. 17 Stichproben ohne Schleife bzw. 33 einschließlich Schleifenschluss; weder Rig, Geometrie, Gewichte, Livepose noch gespeicherte Daten werden verändert. Abbruch, Revision, Bewegungswechsel, Verlassen, zu große und nicht auswertbare Geometrie geprüft.
- KI-Werkzeug wartet auf asynchrone echte Diagnose, lehnt unbeobachtete/veraltete Revisionen ab und propagiert Abbruch. Integrierter Assistent und lokale Browser-API; keine Behauptung neuer externer MCP-Werkzeuge oder einer vollständigen automatischen Reparatur.
- Neuer gerenderter Browserfall bestanden: unauffällige Schlüsselposen, auffälliges Zwischenbild, Schleifenschluss, direkter Werkzeugaufruf, pausiertes Prüfbild, unverändertes Speichern und erneute Prüfung nach Import. Bericht und Kollapsaufnahme gesichtet.
- Frische CPU-Aufbereitung: 48 Kandidaten je Form, Arbeitsform 21 und Tierform 11 akzeptierte Korrekturhaltungen. Fünf neue linke Hüftziele; Schulterkandidaten und andere neue Hüftziele werden abgelehnt. Endgültiger Satz an 562 bzw. 178 Posen gegen ursprüngliche Hautbewegung geprüft. Arbeitsform 14.212.880, Tierform 17.813.052 Byte. [Messbericht, Formatversion 5](benchmarks/pakachi-rigging-2026-11-07.json). Unabhängige ursprüngliche Körper-Digests bleiben bestanden.
- Echter Animations-GLB-Rundlauf jetzt mit gleichzeitigem Ellenbogen, beiden Knien und linker Hüfte; Wiedergabe mit gewöhnlichem AnimationMixer und Vergleich tatsächlicher Hautvertices bestanden.

**Grenzen:** Messwerte sind Stichproben und keine anatomische Freigabe. Eine neue Warnprüfung repariert noch keine Haut. PaKaChi-Aufbereitung ist weiterhin charakterspezifisch; allgemeines Auto-Rigging, automatische Reparaturschleife, gemeinsame Morph-Oberfläche und Verwandlung bleiben offen.

**CI:** Vollständiger vorheriger [0.90.0-Lauf 42536161638](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42536161638) für `5af4a91efcdf9c319c41066f2e4219b1f10c8fa1` erfolgreich: 396 Node-Tests, Build, 39 Chromium-Fälle, drei Produktionsimportmessungen und Artefakte. Neuer Lauf wird commitbezogen in PR #1 ausgewertet.

## Version 0.90.0

**Prüfzeitpunkt:** 2026-11-09T00:32:51+01:00 (Europe/Berlin).

- `npm run verify`: alle 396 Node-Tests, TypeScript und Produktionsbuild bestanden. Darunter tatsächliche Originalmodelle, gemeinsame Posen und binärer GLB-Animationsexport mit drei gleichzeitig korrigierten Gelenken; normale AnimationMixer-Wiedergabe stimmt an geprüften Vertices mit der Studio-Vorhersage überein. Bekannte Bundle-Größenwarnung bleibt bestehen.
- Tatsächliche Original-GLBs: 16 übernommene Korrekturziele an linkem Ellenbogen/beiden Knien der Arbeitsform, 11 an rechtem Ellenbogen/linkem Knie der Tierform. Alle 24 ±90°-Kandidaten je Form werden geprüft; ungeeignete oder über dem 16-Ziel-Budget liegende Kandidaten verworfen. Die frühere linke Ellenbogenkorrektur der Tierform wird wegen schlechterer Mischachsenproben nicht weiter ausgeliefert.
- Nach Abschluss der Auswahl werden alle aufgenommenen Prüfspezifikationen und sämtliche Zielhaltungs-Paare verschiedener Gelenke mit dem endgültigen Korrektursatz erneut ausgewertet: 347 bzw. 178 eindeutige Posen an Körper und Fell. Kein Anstieg der gemessenen Fehlerzahl oder maximalen Hauptdehnung über Toleranz 0,00001, keine ungültigen Messungen. An jeder übernommenen Zielhaltung weniger auffällige Körperdreiecke. Vollständige Daten, Parameter und Ausgabe-Hashes im [Charakterbericht](benchmarks/pakachi-rigging-2026-11-07.json), Formatversion 4.
- Gemeinsame Kontextberechnung für Vorbereitung, Vorschau, reine Prüfung und Export. Schutzbereiche für benannte Nachbargelenke blenden innerhalb 0,5° aus; ein optionaler Achsenkegel ist implementiert und synthetisch geprüft. Unabhängige Gelenke behalten Gewicht 1; überlappende Ziele desselben Gelenks werden gemeinsam begrenzt. Reziproke Kontextübergänge und der endgültige Satz werden nachgeprüft. Grenzen und ungültige Metadaten sind getestet.
- Fellbüschel erhalten je drei Vertices dieselbe relative Verschiebung ihres Körperansatzes, ihre Korrektur-Normalen sind null. Dadurch wird ihre ursprüngliche Hautverformung nicht um zusätzliche Büschelverzerrung ergänzt. Die unabhängigen Golden-Digests der ursprünglichen Körperattribute aus 0.88.0 bleiben unverändert.
- Verlustfreie sparse glTF-Accessors: echter binärer GLTFLoader-Rundlauf für Basis-/Morphdaten, Bildbytes und unveränderte Extras; interleavte Daten, Uint32-Indizes über 65.535, negative Null und ausschließlich Nullwerte geprüft. Fehlerhafte Grenzen und nicht endliche Werte werden abgewiesen. Die abgeleiteten Dateien belegen 13.804.988 bzw. 17.813.052 Byte. Dies ist eine Dateispeicher-, keine Grafik-/RAM-Einsparungszusage.
- Drei gezielte Chromium-Headless-Shell-Fälle bestanden: beide Originalformen posieren, Undo/Redo, Finger, Projekt-Rundlauf und mehrere Ansichten; Arbeitsform zusätzlich Ellenbogen und beide Knie gemeinsam, Oberflächenvergleich an/aus und erneutes Laden derselben kombinierten Pose. Die Ansichtsaufnahmen wurden stichprobenartig gesichtet. Weiterhin sichtbare Verdrehungen und Oberflächenfehler verhindern eine anatomische Gesamtfreigabe.

**Grenzen:** Stichproben einzelner und kombinierter Haltungen, keine lückenlose Bewegungsfreigabe. Kontext-Ausblendung repariert keine weiterhin fehlerhafte ursprüngliche Verformung. Keine Kollisions-, Volumen-, Silhouetten- oder allgemeine anatomische Abnahme. 180°-Stresshaltung, gemeinsame Morph-Oberfläche und Standard-Verwandlung bleiben offen; Windows/Caddy/GPU wurden nicht live abgenommen.

**CI:** Die vollständige CI für 0.89.0 wurde erfolgreich ausgewertet. Der Lauf dieses Meilensteins wird commitbezogen in PR #1 geprüft.

## Version 0.89.0

**Prüfzeitpunkt:** 2026-11-08T22:19:25+01:00 (Europe/Berlin).

- `npm run verify`: 388 Node-Tests, TypeScript und Produktionsbuild bestanden. Abschließend acht gezielte Korrektur-/Originalmodellfälle und TypeScript erneut erfolgreich geprüft. Bekannte Bundle-Größenwarnung bleibt bestehen.
- Neue Korrekturformen an den tatsächlichen Original-GLBs: Arbeitsform sechs akzeptierte linke Ellenbogenhaltungen, Tierform eine. Die übrigen fünf Tierform-Kandidaten werden wegen schlechterer Ziel-/Zwischenmessungen verworfen. Die Aufbereitung prüft je Kandidat Körper und Fell bei 0°, 45°, 67,5°, 90°, 112,5°, 135° und 180° in der jeweiligen Richtung. Fehlerzahl und maximale Hauptdehnung dürfen in diesen Stichproben nicht steigen; an der Zielpose müssen weniger Körperdreiecke auffällig sein.
- Beispiele am Körpernetz: Arbeitsform +90° um Y von 442 auf 61 auffällige Dreiecke, maximale Hauptdehnung 25,205× → 2,504×; −90° um X 503 → 30, 38,503× → 3,470×. Tierform −90° um Z 511 → 425, 39,338× → 5,560×. Verbleibende Fehler sind ausdrücklich vorhanden. Alle Kandidaten und Winkelproben samt GLB-SHA-256 im [Charakterbericht](benchmarks/pakachi-rigging-2026-11-07.json), Formatversion 3.
- Grundoberfläche, Basisnormalen, Farben, Dreiecksindizes und ursprüngliche Hautgewichte beider Körpernetze stimmen bytegenau mit 0.88.0 überein. Ein unabhängiger Golden-Digest wird im Originalmodelltest geprüft: humanoid `d0d2786c7f8e464bad2e0cf6fc5657bcc9474f09829262c86a6369c8e67d418c`, Tierform `7b042901ab603b683e24779231aaf327f4a064fd8c7d4494af5ba575ba0fbf58`. Die Originaldatei-Prüfung bleibt bestanden; 59 Gelenke und Pfotenaufbau bleiben erhalten.
- Reine Vorhersage stimmt an Körper und Fell mit tatsächlichen korrigierten Three.js-Vertices überein. Quaternion-Vorzeichen, exakte Grund-/Zielhaltung, weiche Einblendung und ausgeschalteter Zustand außerhalb des Winkelbereichs geprüft. Bei 180°-Stresshaltung sowie reiner Handgelenk-/Kopfbewegung sind die Korrekturgewichte null. Die vollständige Zielrotation bleibt gespeichert und ausgeführt.
- Projekt-Einstellung, inkompatible Rig-/Gewichtsänderung und Prüfung des ursprünglichen Bindungsrahmens abgesichert. Zusätzliche Viewer-Normalisierung erhält die Kompatibilität; eine andere neutrale Skelettstellung wird erkannt. Inkompatible Rig-Exporte tragen keine ausführbaren Korrekturtreiber.
- Animationsaufnahme kombiniert native Korrekturziele und freie Oberflächenpunkte in gewöhnlichen Morph-Kurven. Ein tatsächlicher binärer GLB-Export wird erneut geladen; ein gewöhnlicher Three.js-AnimationMixer spielt ihn ohne PaKaChi-Treiber ab. Die unabhängige Wiedergabe vergleicht Vertices auch zwischen den mit 30 Hz gebackenen Abtastpunkten; die Toleranz des synthetischen Tests beträgt 0,0005 Modelleinheiten. Keine Aussage über eine allgemeine lückenlose Bewegungs- oder Zielprogrammabnahme.
- Neuer gerenderter Chromium-Headless-Shell-Fall bestanden: tatsächliche Arbeitsform laden, vollen 90°-Ellenbogen per Studio-Befehl einstellen, Korrektur an/aus und Oberflächenbericht vergleichen, Projekt speichern und wieder laden. Die Vorher-/Nachher-Aufnahmen zeigen, dass die lange Hautspitze an der Hüfte in dieser Pose verschwindet. Beide bisherigen Original-Rig-Browserfälle mit Posieren, Fingern, Undo/Redo, Projekt-Rundlauf und mehreren Ansichten zusätzlich bestanden (drei gezielte Fälle insgesamt).
- Abgeleitete GLBs: Arbeitsform 36.396.504 Byte, Tierform 20.707.832 Byte; beide unter 50 MiB. Die größeren Dateien erfordern mehr Import-/Grafikspeicher. Keine Ziel-GPU-Leistungsabnahme.

**Grenzen:** Korrekturen gelten nur nahe den übernommenen linken Ellenbogenhaltungen; der maximale Quaternion-Abstand beträgt 45°. Keine allgemeine Reparatur beliebiger Modelle, weiterer Gelenke oder kombinierter Bewegungen. Keine Kollisions-, Volumen-, Silhouetten- oder anatomische Gesamtabnahme. Die 180°-Stresshaltung bleibt unkorrigiert. Eine neue gemeinsame Oberfläche zwischen den Formen und die Standard-Verwandlung werden hierdurch nicht erzeugt.

**CI-Nachtrag:** [Lauf 42525441374](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42525441374), Commit `c6582a46ff016928bfa95740bee32072927943f9`, vollständig erfolgreich: 388 Node-Tests, TypeScript/Build, alle 39 Chromium-Fälle und drei Produktionsbrowser-Importmessungen. Job-Protokoll nach Abschluss ausgewertet.

## Version 0.88.0

**Prüfzeitpunkt:** 2026-11-08T20:56:00+01:00 (Europe/Berlin).

- `npm run verify`: alle 380 Node-Tests und TypeScript/Produktionsbuild bestanden. Bekannte Bundle-Größenwarnung bleibt bestehen. Die abschließenden gezielten Oberflächen-/Korrekturfälle und TypeScript zusätzlich geprüft.
- Neue synthetische Armgeometrie mit absichtlich kollabierendem 50/50-Übergang und voller 180°-Drehung: Gewichtssuche verbessert die gemessene Dehnung bei exakt unveränderten Posekanälen, gleicher Move-Sequenz und erhaltener Grundform innerhalb der Rechentoleranz. Vertices außerhalb des lokalen Bereichs bleiben unverändert. Vorschau verändert weder Geometrie, Matrizen, Gewichte, Daten noch Dirty-/Revisionsstand. Tatsächliche Gewichtsübertragung und erneute Messung bestätigen das Ergebnis; nach Projektvalidierung/reinem Replay entstehen dieselben korrigierten Positionen.
- Gegenprobe: Eine weitere gespeicherte, stark verschobene Pose macht die Varianten unzulässig. Die Suche liefert `null`, statt die gewählte Pose auf Kosten der anderen zu optimieren. Abbruch, anderer ausgewählter Punkt, Studioänderung und Verlassen verhindern veraltete Ergebnisse. Übernahme ist ausdrücklich, markiert gespeicherte Posen zur Nachprüfung und ist eine Undo-/Redo-Aktion.
- Bestehender unabhängiger Map-Vergleich des nun gemeinsam verwendeten Gewichtskerns sowie manuelle/regionale Übertragung, Pinsel, vier Einflüsse, Gleichstände, Mehrfachindizes, gemischte Topologie, Interleaved-Attribute und Wiederherstellung bestehen weiter.
- Neuer gerenderter Chromium-Headless-Shell-Ablauf mit echter Rig-GLB im Projekt: Kollaps anzeigen, Warnung prüfen, unverändernden Vorschlag suchen, ausdrücklich übernehmen, erneut messen, Undo/Redo, Projekt speichern und laden. Posekanäle und Moves bleiben gleich. Vorher-/Nachher-Ansichten geprüft: Der gemessene Kollaps am mittleren Ring sinkt, eine sichtbare Einschnürung bleibt; kein Nachweis vollständiger Form-/Volumenkorrektur.
- Tatsächliche humanoide und tierische Original-GLBs mit 180°-Drehung von `LeftElbow` um dessen lokale Y-Achse, Radius 0,3: vorher 1.458 bzw. 687 auffällige Dreiecke, in beiden Fällen **kein akzeptierter Vorschlag**. Tests bestätigen unveränderte Daten und Hautgewichte. [Reproduzierbare Messdaten samt Asset-SHA-256](benchmarks/pakachi-weight-correction-2026-11-08.json), Befehl `npm run check:pakachi-surface -- --weights`.

**Grenzen:** Begrenzte Suche in sechs lokalen Übertragungen, keine allgemeine Gewichtsoptimierung. Verglichen werden aggregierte Messwerte pro Teilmodell: Fehlerzahlen, Kategorien und Überschreitungen der Hauptdehnungsgrenzen. Keine Aussage über einzelne neu betroffene Dreiecke bei gleicher Fehlerzahl, Kollisionen, Silhouette, Volumen oder Charakterdesign. Alle gespeicherten Posen und drei Zwischenposen der gewählten Grundform-Zielpose-Strecke werden verglichen; nicht alle Übergänge gespeicherter Moves. Modell, Hautbindung und Referenzbildqualität müssen weiter verbessert werden. Gemeinsame Morph-Oberfläche und Standard-Verwandlung bleiben offen.

**CI:** Vorheriger vollständiger Stand 0.87.0 erfolgreich, siehe folgenden Abschnitt. Der vollständige [Lauf 42517700197](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42517700197) für `50bed4aa828e008d1265c16b15400fe72e9bc482` ist erfolgreich. Die ausgewerteten Joblogs bestätigen 380 Node-Tests, TypeScript/Build, alle 38 Chromium-Fälle (7,8 Minuten), drei Produktionsimportmessungen und Browserartefakte. Dieser Nachweis gilt für 0.88.0.

## Version 0.87.0

**Prüfzeitpunkt:** 2026-11-08T20:33:00+01:00 (Europe/Berlin).

- `npm run verify`: alle 372 Node-Tests bestanden, keine Fehler und keine übersprungenen Fälle; TypeScript und Produktionsbuild bestanden. Nach abschließender Ergänzung der Bindungsprüfung die 13 gezielten Oberflächenfälle und den Build erneut erfolgreich geprüft. Bekannte Bundle-Größenwarnung bleibt bestehen.
- Neuer gerenderter Chromium-Headless-Shell-Fall: eine übertriebene freie Oberflächenverschiebung als Projekt laden, Warnbericht ohne Datenänderung, schonenderer Prüfkandidat als zusätzliche Pose, erneute Prüfung innerhalb der Grenzwerte, Undo/Redo sowie Speichern/Laden. Originalpose und Moves bleiben gleich. Berichtaufnahme visuell geprüft. Dieser lokale Lauf ersetzt keinen vollständigen aktuellen CI-Lauf.
- Reine Vorausberechnung der Hautpositionen stimmt mit den tatsächlichen Three.js-Vertices überein: gewichtete Knochen, an Knochen befestigte Teile, freie Oberflächenpunkte, bestehende Morphziele, bearbeitete Bindungsrahmen und getrennte Hautbindung. Die Prüfung verändert weder Modellmatrizen noch gespeicherte Daten.
- Analytische Fälle prüfen starre Drehung/Verschiebung, Dehnung, Scherung, Flächenkollaps, kleine Maßstäbe, fehlerhafte Indizes, nicht endliche Werte und degenerierte Ausgangsdreiecke. Abbruch, Studioänderung, Posewechsel und Verlassen verhindern veraltete Korrekturen; der ausdrücklich erzeugte Kandidat ist eine Undo-Aktion.
- Beide tatsächlichen Original-PaKaChi-Rigs geladen. Grundposen ohne Dehnungsüberschreitung; 672 bereits degenerierte Dreiecke je Modell separat ausgewiesen, keines davon am Körpernetz. An Körper, Fell und Augen stimmen die vorausberechneten Positionen bei mehreren echten Knochendrehungen mit dem gerenderten Hautmodell rechnerisch überein.
- CPU-Diagnose erneut ausführbar mit `npm run check:pakachi-surface`. [Messdaten mit GLB-SHA-256](benchmarks/pakachi-surface-2026-11-08.json): absichtlich ungeeigneter Umbau nur der Knochenpositionen zur jeweils anderen Form erzeugt am humanoiden Körper 6.787 auffällige von 99.176 Dreiecken (maximale Hauptdehnung ca. 150×), am Tierkörper 11.914 von 160.976 (ca. 103×). Das belegt Fehlererkennung, keine behobene Transformation.

**Verfahren und Grenzen:** Eigenwerte der relativen Dreiecks-Grammatrix liefern die beiden Hauptdehnungen, das Verhältnis der Determinanten die Flächenänderung. Die festen Grenzen 0,25–3× und Fläche mindestens 0,1× sind technische Warnschwellen. Die Suche prüft sechs absteigende Bewegungsanteile und übernimmt höchstens eine zusätzliche Pose nach Oberflächen- und vorhandener Beugeprüfung. Keine Gewichts-/Topologiereparatur, kein ARAP-Optimierer, kein Bildvergleich, kein Kollisions-/Volumennachweis und keine lückenlose Zwischenbildprüfung. Bereits unbrauchbare, aber unveränderte Grundformen können die Prüfung bestehen. Gemeinsame Morph-Topologie und designgetreue Charakterabnahme bleiben offen.

**CI:** Der vorherige Dokumentationsstand `243f88dd5f1d54e4acfb41456c74100a9ca61719` ist im [Lauf 42512496731](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42512496731) erfolgreich. Dieser Lauf gilt für 0.86.0. Der nachfolgende [Lauf 42515722341](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42515722341) für `d08b9171d1364187026917794e15000b25940fbd` ist vollständig erfolgreich: Die ausgewerteten Joblogs bestätigen 372 Node-Tests, TypeScript/Build, alle 37 Chromium-Fälle (10,3 Minuten), drei Produktionsimportmessungen und die Bereitstellung der Browsernachweise. Dieser Nachweis gilt für 0.87.0, nicht für die nachfolgende lokale Gewichtssuche.

## Version 0.86.0

359 Node-Tests und der TypeScript-/Produktionsbuild bestanden. Bekannte Bundle-Größenwarnung bleibt bestehen.

**Prüfzeitpunkt:** 2026-11-08T14:38:11+01:00 (Europe/Berlin).

- `npm run verify` nach Wiederaufnahme: alle 359 Node-Tests bestanden, kein Fehler und kein übersprungener Fall; TypeScript und Produktionsbuild bestanden. Die bekannte Bundle-Größenwarnung bleibt bestehen.
- Regression bei Abbruch während der Skriptvorbereitung gefunden und behoben: Vor der Korrektur startete der bereits abgebrochene Auftrag trotzdem einen Prozess. Ein gezielt blockierter Vorbereitungsablauf beweist, dass nach Abbruch kein Prozessstart mehr stattfindet. ACP verarbeitet außerdem über Transportblöcke geteiltes UTF-8 korrekt und redigiert Zugangsschlüssel auch über mehrere Textnachrichten.
- Echter lokaler HTTP-MCP-Client: 17 Werkzeuge, Dateieingabe, Python-Skript, asynchroner Auftrag, unveränderte Eingabedatei, Ausgabe und blockweises Lesen samt SHA-256. Kein eingebauter Shell-/Einstellungs-/Tunnel-Schlüsselzugriff über MCP.
- OAuth mit tatsächlichem SDK-Client ohne vorgegebenen Bearer: Discovery über Caddy-artigen HTTPS-Host und `/pakachi`-Präfix, dynamische Registrierung, lokale Zustimmung/Ablehnung, PKCE, Resource, bestehende Callback-Parameter, einmaliger Code, Refresh-Rotation und Ausschalten. Der Proxy wird im Test nachgebildet; kein Zugriff auf Steffens Caddy.
- Verwaltungsgrenzen: ausgeschalteter Start, Loopback-/Host-/Origin-/Proxyprüfung, Sitzung und CSRF; öffentlich simulierte Verwaltung verweigert. Assets prüfen Traversal, Symlink-Ausbruch, Upload-Konflikte und Dateierhalt.
- Tatsächlicher Python-Prozess: Abbruch während der Skriptvorbereitung verhindert den Prozessstart; gleichzeitige Starts werden serialisiert/abgewiesen, MCP-Abbruch beendet den Auftrag, Entzug der Skriptfreigabe beendet den Nachfolgeauftrag. Fremde API-Schlüssel aus der Elternumgebung werden nicht vererbt.
- ACP-v1-Testagent als echter Unterprozess: initialize/session/new/session/prompt, lokale Berechtigungswahl, tatsächlicher stdio-MCP-Client mit den 17 Werkzeugen; Ablehnung und Abbruch räumen Anfragen auf, eine neue Sitzung bleibt nutzbar. Das ist ein Protokolltestagent, kein produktiv authentifizierter KI-Anbieter.
- Tunneltests mit kontrollierten Release-/Prozessantworten prüfen offiziellen Downloadpfad und Digest, beide Binärdateien, ZIP-CRC, doppelte Einträge/Symlinks, Windows-Dateinamen, Start/Stopp, echte Bereitschaftsbedingung, Diagnoseargumente und geheimnisfreie Konfigurationsdatei. Tatsächlich aus OS-Pipes über mehrere Blöcke ausgegebene Geheimnisse werden redigiert.
- Zusätzlich echtes offizielles Linux-x64-Archiv v0.0.20 heruntergeladen: SHA-256 `2f06ce5a17425c74a827e7038692936e973ae388e7eec728c40efee1fb5f139d`. Extraktion von Client, Cloudflared und Begleitdateien bestanden; tatsächliche `run --help` und `doctor --help` ausgeführt. Kein Runtime-API-Schlüssel und kein live angemeldeter OpenAI-Tunnel verwendet.
- Vollständiger lokaler Headless-Shell-Lauf: 35 Fälle bestanden, ein horizontaler Überlauf der mobilen Navigation gefunden. Nach echtem Zeilenumbruch im Layout alle fünf betroffenen Player-/Arbeitsplatzfälle erneut bestanden. Der nachfolgende vollständige GitHub-Lauf bestätigt alle 36 Fälle mit regulärem Chromium; siehe CI-Nachtrag unten.
- Neuer gerenderter Browserablauf bestanden: ausgeschalteter Arbeitsplatz, Caddy-Abschnitt, echte Player-/MCP-Kopplung, echter Python-Auftrag, Ergebnisdownload und GLB-Upload mit Import ins Studio. Bildschirmaufnahme des lokalen Dialogs geprüft. Der Ablauf fand und korrigierte eine Einbettungssperre des erhaltenen Originalplayers.

### CI-Nachtrag und Übergabe

**Dokumentiert:** 2026-11-08T19:54:23+01:00 (Europe/Berlin). [Lauf 42486376327](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42486376327) für Software-Commit `05cf07ce6d81a0c0de76194470c9c47e642e8322` ist vollständig mit `success` abgeschlossen. Die Joblogs bestätigen 359 bestandene Node-Tests ohne Fehler, TypeScript/Produktionsbuild und alle 36 Chromium-Browserfälle in 8,4 Minuten. Die drei Produktionsimportmessungen mit Mika und 256 Gewichtsaufträgen sowie die Artefaktbereitstellung sind ebenfalls erfolgreich. Der vorher lokal gefundene mobile Navigationsüberlauf ist damit auch in der vollständigen CI nach der Korrektur geprüft.

[Browsernachweise](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42486376327/artifacts/13620265509). Keine zusätzliche Prüfdatei: Dieser Abschnitt bleibt der gemeinsame Nachweis für 0.86.0.

Für die Fortsetzung den Branch `work/local-verification-model-zoo` aus [Entwurfs-PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verwenden und die [fünf Verbindungsschritte](LOKALE-WERKZEUGE.md#verbindung-zu-deinem-rechner) ausführen. Erst ein erfolgreicher externer `local_get_status`-Aufruf und die reale Programm-/GPU-Prüfung belegen die Anbindung von Steffens Rechner.

**Offene reale Abnahme:** Windows/macOS-Prozesse, Blender, Ziel-GPU/PyTorch, Steffens Caddy/DuckDNS, ein autorisierter ChatGPT-Tunnel und ein produktiver ACP-Agent. Keine Behauptung eines bereits verbundenen Benutzerrechners. Charakterqualität, gemeinsame Morph-Topologie und Standard-Verwandlung bleiben offen.

## Version 0.85.0

Zeitstempel: 2026-11-07T21:01:23+01:00 (Europe/Berlin).

**Charakterarbeit vor der Verwandlung:** Beide erhaltenen Rekonstruktionen werden mit derselben erweiterten 59-Gelenk-Hierarchie aufbereitet. 28 zusätzliche Gelenke führen 14 voneinander unabhängige Finger/Zehen mit echten starren Gliedern und grünen Spitzen. Je Vorderpfote drei Finger und ein Daumen, je Hinterpfote drei Zehen; je zwei Glieder. Die Hände der Arbeitsform drehen um die Handgelenksnaht. Tiefenpositionen mehrerer Handgelenke und Pfoten sind an reale Querschnitte angepasst. Bei der Tierform entscheidet der Abstand zu den tatsächlichen Körperketten über die Schwanzzuordnung; die Kopfregion wird zusätzlich räumlich gegen den Rumpf abgegrenzt. Eine starre Tiefengrenze darf keine Hinterpfote dem Vorderbein zuschlagen.

**Netzkorrektur:** Humanoide Fäustlinge und vordere Zehenflächen sind lokal ausgeschnitten, Kanten geteilt und Schnittflächen geschlossen. Die übrigen Fellpfoten bleiben erhalten. Quellvertices werden mit Toleranz 0,00001 verschweißt, doppelte/degenerierte Flächen bereinigt und einfache Randringe geschlossen; nicht eindeutige Ränder oder Kanten mit mehr als zwei Flächen brechen die Aufbereitung ab. Die tatsächlichen ausgegebenen Körpernetze besitzen ausschließlich zwei gegensinnig orientierte Flächen je Kante. Das gilt für die Körper, nicht für die absichtlich offenen Fellfasern. Es bestätigt keine Selbstüberschneidungs- oder Kollisionsfreiheit und noch keine gemeinsame Morph-Topologie. Eingaben bleiben bytegleich; Details im [aktuellen Aufbereitungsbericht](benchmarks/pakachi-rigging-2026-11-07.json).

**Nachweise:**

- `npm run verify`: alle 345 Node-Tests und TypeScript/Produktionsbuild bestanden; bekannte Bundle-Größenwarnung.
- Acht zusätzliche Fälle an den tatsächlichen GLBs: Körperkanten samt Orientierung, jedes der 28 neuen Gelenke mit tatsächlich bewegter Spitze bei unveränderter Handfläche/Nachbarfinger/Körperprobe, gespeicherte Fingerpose und Rig-GLB-Rundlauf samt weiterer Bewegung nach Import. Der Vorher/Nachher-Lauf an derselben Quellrekonstruktion zeigt für die rechte Hinterpfote: Vor der Korrektur bewegte eine Ellenbogendrehung 178 von 1151 Stichprobenvertices um bis zu 0,1049 Modelleinheiten; danach bewegen sich davon null Vertices. Zusätzliche Anatomieproben halten beide Hinterpfoten bei Schulter-/Ellenbogenbewegung und den hinteren Rücken der Tierform bei Hals-/Kopfbewegung fest. Bestehende Haut-, Kamera-, Material-, Farb- und Quellerhaltungsprüfungen bestehen weiter.
- Beide erweiterten Headless-Shell-/SwiftShader-Browserfälle bestanden und nach der Anatomiekorrektur erneut erfolgreich: Armbeugung, einzelne Fingerpose, Undo/Redo, Speichern/Laden und Front-/Rück-/Seitenansichten. Charakterbilder und Ansichten geprüft. Keine manuelle Benutzerabnahme.
- Erzwungene Neuerzeugung beider GLBs bytegleich; `--if-needed` behält die Änderungszeiten unveränderter Ausgaben.
- Vollständiger regulärer Chromium-CI-Lauf und Produktionsimportmessungen sind commitgebunden in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) nachzuverfolgen; lokale Teilprüfung wird nicht als vollständige Browserprüfung bezeichnet.

**CI-Zeitbudget:** [Lauf 42410125768](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42410125768) bestand 345 Node-Tests und Build; 33 von 35 Browserfällen bestanden. Die zwei vollständigen Charakterabläufe überschritten das allgemeine 45-Sekunden-Budget. Beide Traces bestätigen erfolgreiche Arm-/Fingerprüfung, Projektübernahme und erneute Werteprüfung; der Abbruch geschah erst bei den Schlussansichten (Arbeitsform: Seite, Normalform: Front). Diese beiden Fälle erhalten wie andere umfangreiche Import-/Exportabläufe 90 Sekunden Gesamtbudget und 15 Sekunden je tatsächlichem Modell-/Projektimport. Körper-GLBs aus dem CI-Artefakt sind bytegleich mit den lokal geprüften Ausgaben. Der korrigierte vollständige CI-Lauf ist am PR verknüpft.

**Grenzen:** Anschlussqualität und Proportionen der mechanischen Finger/Zehen bei großen Beugungen weiter prüfen. Die Schulter-/Hüftbrücken der großen Umformung sind damit noch nicht behoben. Keine ausgelieferte Morph-Animation, keine endgültige Charakterfreigabe und kein allgemeines KI-Auto-Rigging. Ältere Projekte behalten ihren eingebetteten 31-Gelenk-Modellstand; alte Moves benötigen für den erweiterten Rig eine ausdrückliche Übertragung.

## Version 0.84.0

Zeitstempel: 2026-11-07T19:14:08+01:00 (Europe/Berlin).

**Rigging vor Morph:** Normal- und Arbeitsform werden aus den unveränderten realen TripoSR-Quellen reproduzierbar aufbereitet. Beide besitzen 31 Gelenke mit gleicher Hierarchie, eigene anatomische Grundpositionen, zwei SkinnedMeshes (Körper/Fell) und starre Gesichts-/Pfotenanbauten. Vier Gewichte je Vertex maximal, normalisierte Summen, keine erfundenen Clips. Details, Eingabe-/Ausgabehashes, Pipelinehash, Einflussabdeckung und Querschnittspunkte: [Bericht](benchmarks/pakachi-rigging-2026-11-07.json).

**Geometrie und Darstellung:** Explizite Normalen, nichtmetallisches raues Fell, Grün-/Cremezeichnung erhalten und dunkle Fellfarben korrigiert, echte Augen/Pupillen/Lichtpunkte/Nase/Mundlinie und Pfotenakzente. Körper/Tail tragen kurze skinnbare Fasern. 16 Taubin-Teilschritte; maximale Körpervertex-Verschiebung etwa 0,0032 Modelleinheiten. 25 beziehungsweise 40 nahezu flächenlose Dreiecke entfernt. Keine vollständige Retopologie, kein wasserdichtes Mesh zugesichert. Originaldateien unverändert.

**Reproduzierbarkeit:** Fehlende Buildprodukte aus den erhaltenen Quellen neu erzeugt; erneute erzwungene Aufbereitung liefert byteidentische GLBs. Bei unveränderten Eingaben/Ergebnissen schreibt `--if-needed` die Dateien nicht erneut.

**Lokale Nachweise:** 337 Node-Tests sowie TypeScript/Produktionsbuild bestanden. Sechs neue geometrische Fälle prüfen beide tatsächlichen GLBs: gemeinsame Hierarchie, normalisierte Hautgewichte, Normalen und Materialien, Quelldateihashes, reale Vertexbewegung bei Ellenbogen/Knie/Kopf/Schwanz, unveränderte Knochenabstände und unbeteiligte Körperbereiche. Schwanzbewegung darf keine bodennahen Pfotenvertices verschieben. Studio-Projekt-Rundlauf vergleicht tatsächlich gebeugte Hautvertices nach erneutem Laden. Kamera-Mittelpunkt wird gegen den unabhängig transformierten Grundkörper geprüft.

Zwei zusätzliche lokale Browserfälle bestanden mit Chromium Headless Shell 141/SwiftShader: Handgelenk beugen, sichtbare Hautänderung, Undo/Redo, Projektdatei und wiederhergestellte Pose; Screenshots von Charakter, Pose sowie Front/Rückseite/Seite für beide Formen geprüft. Die reguläre Chromium-Variante scheitert lokal beim Unix-Socket-Aufbau; Headless Shell startet erfolgreich. Die CI verwendet weiterhin die reguläre Chromium-Konfiguration und die vollständige Suite; commitgebundene Ergebnisse stehen in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

**CI-Nachtrag:** [Lauf 42400685757](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42400685757) für `100f5add743f51badc0642a78f383014b2f33237` vollständig erfolgreich: 337 Node-Tests, Produktionsbuild, alle 35 Chromium-Fälle und drei Produktionsimportmessungen. Aufbereitung und Artefaktbereitstellung ebenfalls erfolgreich.

**Formwechselprobe:** Eine große Skelettumformung zwischen den Grundformen zeigte aufgezogene Hautbrücken. Sie wurde verworfen und gehört nicht zu den ausgelieferten Assets. Die Standardanimation vorwärts/rückwärts bleibt bis zur Korrektur der gemeinsamen Netzstruktur offen. Der verbesserte Rigging-/Charakterstand ersetzt keine endgültige visuelle Freigabe; Finger-/Pfotenseparation, verdeckte Flächen, große Gelenkbeugungen und Designnähe bleiben weiter zu prüfen. Kein universelles KI-Auto-Rigging, keine neuen Anbieter/GPU-Messungen.

## Version 0.83.0

Zeitstempel: 2026-11-07T17:13:02+01:00 (Europe/Berlin).

**Erstmals echte Original-PaKaChi-Inferenz**, keine simulierte Generierung. Die unveränderten Referenzen wurden mit TripoSR auf CPU rekonstruiert. Beide 256er GLBs stehen als getrennte, ausdrücklich ungeriggte Entwürfe im Model Zoo. Sie sind noch nicht als fertiger Charakter freigegeben.

| Form / Auflösung | Laufzeit ohne Einrichtung/Vorprüfung | Vertices | Dreiecke |
| --- | --- | --- | --- |
| Humanoid / 128 | 66,97 s | 12.147 | 24.220 |
| Tierform / 128 | 85,87 s | 19.139 | 38.164 |
| Humanoid / 256 | 186,08 s | 50.870 | 101.564 |
| Tierform / 256 | 173,56 s | 81.388 | 162.500 |

Alle vier Ergebnisse mit dem produktiven GLTFLoader geladen: jeweils ein Mesh, null Knochen und null Clips. Vollständige Messdaten, Logs und SHA-256-Werte: [Inferenzbericht](benchmarks/pakachi-generation-2026-11-07.json). TripoSR `107cefdc244c39106fa830359024f6a2f1c78871`, PyTorch `2.5.1+cpu`, Python `3.12.14`, acht CPU-Threads. Gewichte tatsächlich heruntergeladen und gehasht; der allgemeine Adapter nutzt weiterhin die Standardrevision. Keine GPU-Laufzeitmessung.

Die getestete Backend-Revision wurde mit dem erhaltenen Transparenzpatch ergänzt. Ein anfänglicher Stock-Backend-Versuch wurde während der Hintergrundentferner-Initialisierung abgebrochen und zählt nicht als abgeschlossener Lauf. Der Patch wurde am genannten Stand auf Anwendbarkeit geprüft. Vorlagen selbst blieben bytegleich.

TripoSR-Koordinaten werden über einen neuen GLB-Wurzelknoten ausgerichtet. Der Regressionstest prüft Weltachsen, unveränderte Binärdaten und Schutz gegen doppelte Rotation. Die native Ausgabe bleibt bei neuen Läufen als `mesh-native.glb` erhalten. Der humanoide 256er Lauf entstand vor dieser Adapteränderung und wurde anschließend mit genau demselben Helfer ausgerichtet; der tierische 256er Lauf enthält die Ausrichtung bereits im Auftragsbericht.

**Lokale Softwareprüfung:** 331 Node-Tests und TypeScript/Produktionsbuild bestanden. Der Sammlungstest vergleicht nun alle vier Originalmodelle byteweise beim Zusammenführen. Neuer Chromium-Fall lädt beide tatsächlichen GLBs, prüft sichtbare WebGL-Ansicht und leere Bewegungsfähigkeiten und erzeugt Screenshots. Die komplette Branch-CI umfasst damit 33 Browserfälle plus Produktions-Importmessung; commitgebundene Ergebnisse stehen in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

**Erster CI-Lauf und Testkorrektur:** [Lauf 42391787006](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42391787006), Commit `3c0a27a72a7d84d03fa47cbf1cf336179c3f22d7`: 331 Node-Tests und Build bestanden; 32 Browserfälle bestanden, der neue Fall scheiterte nach dem ersten erfolgreichen Modellladen an einer falschen Reload-Erwartung. Der Player startet nach F5 wie bisher mit dem Original-Bildplayer. Der Test wählt nun beide weiterhin vorhandenen Katalogentwürfe nach dem Neuladen erneut aus und prüft anschließend Studio, statische Fähigkeiten und Rückwechsel zu Mika. Keine Tests übersprungen und keine Zeitlimits erhöht. Die Produktions-Importmessung wurde im fehlgeschlagenen Lauf nicht ausgeführt. Der korrigierte vollständige Lauf wird separat ausgewertet.

**Meshdiagnose:** Trimesh 4.0.5, ohne Reparatur oder Vertexverschweißung, nach Anwendung der GLB-Szenentransformationen. Humanoid: drei Flächenkomponenten (65.892 / 35.584 / 88 Dreiecke), 336 offene Randkanten, keine Kanten mit mehr als zwei Flächen, keine Dreiecke ohne Fläche. Tierform: zwölf Komponenten, davon 162.378/162.500 Dreiecke in der größten, 506 offene Randkanten, zwei Kanten mit mehr als zwei Flächen und zwei Dreiecke ohne Fläche. Beide Meshes sind nicht wasserdicht; die Flächenorientierung ist jeweils konsistent. Diagnostik und Modellhashes stehen im Inferenzbericht. Diese Werte beschreiben Prüfstellen; getrennte Teile und offene Ränder schließen Skinning nicht grundsätzlich aus. Modelle bleiben bytegleich.

**Sichtprüfung und Grenze:** Vier Richtungen und eine Umlaufansicht aus der vom Player-Lader geladenen, nach PLY abgeflachten Geometrie mit Software-OpenGL (llvmpipe) gerendert. Dafür wurde kein weiteres Bildmodell verwendet. Kopf, Ringelschweif und Grundformen sind erkennbar. Gesicht/Augen, Finger/Pfoten, Fell-/Materialwirkung, seitliche Körpermasse und verdeckte Flächen weichen sichtbar ab; höhere Meshauflösung behebt das nur begrenzt. Diese Bilder ersetzen keine vollständige Browser-/Materialabnahme. Kein anatomisches Rig, keine Hautgewichte, keine Animation und keine 3D-Transformation erzeugt. Nächster Charakter-Schritt ist die Korrektur dieser Entwürfe und ein qualitativer Verfahrensvergleich vor dem Rigging.

## Version 0.82.0

Zeitstempel: 2026-11-07T12:30:50+01:00 (Europe/Berlin)

### Umhängen mit Skalierungsausgleich

Die beiden Äste unter ihrem nächsten gemeinsamen Knochen dürfen unterschiedliche positive gleichmäßige Maßstäbe besitzen. Das Verhältnis Quellast/Zielast wird als fester positiver Faktor auf die lokale Skalierung des verschobenen Knochens angewandt. Der gemeinsame Vorfahr darf weiterhin invertierbar ungleichmäßig oder negativ skaliert sein. Die eigene Skalierung des verschobenen Knochens wird aus der Drehungsumrechnung herausgehalten; ihre Spiegelungsachsen bleiben erhalten.

Grundstellung, gespeicherte Schlüsselposen, Entwurf und aktuelle Pose werden vor dem Umschalten umgerechnet. Nicht endliche, außerhalb des Projektbereichs liegende oder nicht verlustfrei rekonstruierbare Rahmen werden abgewiesen. Replay rekonstruiert den Ausgleich aus Quellmodell und Umbaufolge. Die ursprüngliche Quelle einschließlich lokaler Skalierungen bleibt wiederherstellbar; bei bisher unterstützten gleichen Astmaßstäben bleibt Faktor 1 erhalten.

### Nachweise

- 330 Node-Tests lokal bestanden, keine Fehler oder übersprungenen Tests. TypeScript und Produktionsbuild lokal bestanden; die bekannte Bundle-Größenwarnung bleibt.
- Drei ungleiche Astverhältnisse, verschachtelte Eltern, gemeinsame nicht gleichmäßige Spiegelung, eigene Skalierung/Spiegelung des verschobenen Knochens, Gesamtfigurenbewegung, gespeicherte Posen/Entwurf und verschachtelte starre Anbauteile. Verglichen werden Weltvertices und Anbaumatrizen; mehrfacher Reset darf den Faktor nicht erneut aufmultiplizieren.
- Gemischte Folge aus Umhängen ganzer Teilbäume, Rückhängen, Gewichtsübertragung, Einfügen, Löschen und Projektladen: identische Gewichte und rekonstruierte Skalierungen. Zu kleiner nicht invertierbarer Ausgleich wird vor Änderung von Daten oder Hierarchie abgewiesen.
- Mika und Nori mit Quellastmaßstab 2, Zielastmaßstab 3 und eigener gespiegelter Fußskalierung: alle Hautvertices vor/nach Umhängen und erneutem Laden verglichen.
- Animierter GLB-Rundlauf mit tatsächlicher Skinning- und Anbaumatrixprüfung an vier Zeitpunkten; Export verändert den Quellstand nicht. Gespeicherte Beugeprüfung mit unabhängigem geometrischem Winkelvergleich.
- Zusätzlicher Chromium-Fall für entsprechend angepassten Mika mit starrem Anbauteil: echte UI-Umhängung, erhaltene Weltposition, Undo/Redo, Projektdatei und erneutes Laden. Artefakt `reparented-scaled-bone.png`. Ergebnis, vollständige Logs und Artefakte des getesteten Commits sind in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verknüpft. Die Suite umfasst jetzt 32 Browserfälle; kein lokaler Browsernachweis, da Chromium hier weiterhin beim Socket-Aufbau blockiert ist.

### Format und Grenzen

Projektformat bleibt Version 1, keine neue freie Skalierungsspur oder neue Bedienoption. Der Faktor wird deterministisch rekonstruiert. Projekte mit diesem neuen Fall benötigen mindestens 0.82.0; ältere Versionen weisen die ungleichen Astmaßstäbe beim Wiederaufbau ab. Bisherige gleiche Astmaßstäbe behalten ihre Interpretation.

Nicht gleichmäßige oder negative Skalierung auf den getrennten Elternästen, Wurzel-/Kreis-/Fremdskelettverbindungen, eigene Skelette an Anbauteilen und numerisch nicht invertierbare Fälle bleiben gesperrt. Das Löschen mit Anbauteilen und weitere Umbauten skalierter Zwischenknochen bleiben eigene Aufgaben. Schlüsselposen sind erhalten; eine unveränderte Zwischenbewegung wird wegen der geänderten Elternhierarchie nicht zugesichert. Haut-/IK-Qualität und manuelles Mausgefühl bleiben separat abzunehmen. Keine bestehenden Tests übersprungen oder Zeitlimits erhöht.

### CI-Nachtrag zum getesteten Commit

Commit `86260c50781b39b77587d80dd4a3613c0d4b7c65` besteht im [Lauf 42368610532](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42368610532) alle 330 Node-Tests, TypeScript/Build, alle 32 Chromium-Fälle (5,0 Minuten) und drei Produktionsmessungen. Keine Fehler, Flakes oder übersprungenen Fälle. Vollständige Logs, Berichtsstatistik, JSON und Screenshot geprüft. [Browserartefakte](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42368610532/artifacts/13573086519). Der bewusst skalierte Testavatar ist keine anatomische Haut-/IK-Abnahme.

## Version 0.81.0

Zeitstempel: 2026-11-07T11:46:22+01:00 (Europe/Berlin)

### Browserimport messen

Das neue Kommando baut einmal eine temporäre Produktionsausgabe und startet einen Server ausschließlich auf 127.0.0.1. Drei Messungen mit Mika/256 Gewichtsaufträgen sind voreingestellt; eigene Studio-Projektdateien und 1–10 Wiederholungen werden unterstützt. Pro Sample ein neuer Browserkontext; keine Änderung an Quelldateien, bestehenden Benutzerprofilen oder Produktcode.

Die Messsonde wird ausschließlich vom Benchmark injiziert. Sie startet vor dem produktiven change-Handler des Projektdateifelds, misst File.text, beobachtet die Bereitschaft des neu installierten Avatars und prüft echte WebGL2-Zeichenaufrufe auf dessen neuem Canvas. Eine folgende Animationsframe-Grenze beendet die Messung. Der noch sichtbare Vorgängeravatar darf keinen erfolgreichen Messwert erzeugen. Fehler und Kontextverlust werden abgewiesen; SHA-256 vor/nach jedem Durchlauf schützt den Nachweis unveränderter Eingaben. Die Sonde verändert keine Rig-/Projektfunktionen.

### Nachweise

- Lokal: 325 Node-Tests bestanden, 0 fehlgeschlagen/übersprungen; TypeScript und Produktionsbuild bestanden.
- Lokaler Chromium-Start und Produktionsbenchmark versucht: Browser beendet sich vor dem Teststart mit `socket() failed: Operation not permitted`. Kein lokaler Browser- oder Laufzeitnachweis daraus abgeleitet.
- Neuer Chromium-Fall misst einen selbst enthaltenen PNG-Texturimport zweimal, prüft Bilddekodierung, Messreihenfolge, neuen Canvas, Quelldateiprüfsumme und unveränderte Datei. Zweiter Fall prüft den Fehlerpfad bei ungültigem Projekt mit vorhandenem Vorgängeravatar.
- CI für Commit `7c706bb480f1562f7d60186c76103bd15fe7802e`: **325 Node-Tests, TypeScript/Build, alle 31 Chromium-Fälle (6,3 Minuten) und drei Produktionsmessungen bestanden**. [Lauf 42365460756](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42365460756) · [Browserartefakte](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42365460756/artifacts/13571608579). Job-Schritte und vollständige Logs geprüft; kein übersprungener oder nach Wiederholung bestandener Browserfall.
- Ergebnisabgleich: 2026-11-07T11:58:34+01:00. Der Screenshot `textured-import.png` zeigt die vollständig gerenderte grüne Testdreiecksfläche; beide Textur-Samples enthalten genau eine erfolgreich dekodierte ImageBitmap. Das ist ein konkreter Textur-/Rendernachweis, keine allgemeine visuelle Qualitätsabnahme.
- Die PNG-Testvorbereitung erzeugt das Bild anschließend direkt im leeren Fixture-Tab. Dadurch läuft während der beiden eigentlichen Messungen kein zusätzlicher Originalplayer als unnötige Konkurrenz. Prüfungen und Zeitlimits bleiben erhalten. Der vollständige CI-Nachweis des abschließenden Dokumentations-/Teststands wird am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verlinkt.

### Referenzmessung

[Unveränderte JSON-Rohdaten](benchmarks/browser-import-0.81.0.json) aus dem genannten Lauf: Mika mit 256 Gewichtsaufträgen, 979.550 Byte Projektgröße, drei neue Browserkontexte, Chromium 141.0.7390.37, Node v24.22.2, Linux x64, AMD EPYC 9V74, erzwungenes Software-WebGL.

| Sample | Datei lesen | Avatar bereit | Erste Zeichnung | Folgende Frame-Grenze |
| --- | --- | --- | --- | --- |
| 1 | 7,3 ms | 3.090,2 ms | 3.180,2 ms | 3.275,3 ms |
| 2 | 5,2 ms | 3.236,6 ms | 3.321,5 ms | 3.374,4 ms |
| 3 | 5,4 ms | 3.247,2 ms | 3.334,6 ms | 3.387,9 ms |

Median der Frame-Grenze: **3.374,4 ms**. Alle drei Eingabeprüfsummen stimmen überein. Mika selbst enthält keine Bildtexturen; deren Dekodierung ist separat durch die oben beschriebene PNG-Regression nachgewiesen. Das ist eine Referenzmessung, kein Vorher/Nachher-Nachweis einer Optimierung und keine Zusage für große reale Figuren oder die Hardware des Nutzers.

### Grenzen

[Metriken, Aufruf und Grenzen](IMPORT-BENCHMARK.md). Enthalten: produktives Lesen/Validieren/Dekodieren, Texturen, Rig-Replay, UI und WebGL-Zeichnungsabgabe. Nicht enthalten: Dateiauswahl, Playwright-Dateiübertragung, Programm-/Serverstart, IndexedDB-Speicherung, GPU-Fertigstellung oder physische Anzeige. Browserprozess sowie OS-/GPU-Treibercaches können warm sein. Software-WebGL wird ausdrücklich ausgewiesen; kein Nachweis für die Ziel-GPU, große reale Modelle, anatomische Hautqualität oder manuelles Mausgefühl.

Projektformat bleibt Version 1. Keine bestehenden Tests übersprungen und keine bestehenden Zeitlimits erhöht. Bekannte Bundle-Größenwarnung bleibt.

### Abschlussprüfung

Der [Abschlusslauf 42366220398](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42366220398) für Commit `0f61862f5775558432c0f5a0a856257af831f8cb` bestätigt erneut 325 Node-Tests, Build, alle 31 Chromium-Fälle und drei Produktionsmessungen. Vollständige Logs, JSON und Textur-Screenshot geprüft; keine Fehler, Flakes oder übersprungenen Fälle.

## Version 0.80.0

Zeitstempel: 2026-11-07T10:12:57+01:00 (Europe/Berlin)

### Oberflächenanimation

Freie Punktverformung wird mit derselben reinen Geometrieberechnung wie im Editor erzeugt. Pro betroffenem Mesh ein Morph-Ziel je unterschiedlicher Oberflächenpose; unverformte Posen verwenden Nullgewichte. Gewichte interpolieren an den ursprünglichen Schlüsselzeiten. Skinning und Figurenkanäle bleiben erhalten, auch Animationen ohne Skelett sind möglich.

Vorhandene relative und absolute Positions-/Normal-Morphs behalten ihre konstanten Gewichte. Bei absoluten vorhandenen Zielen wird die Wirkung auf den verformten Basiszustand berücksichtigt. Native Namen bleiben erhalten. Normalen sind an den Zielposen berechnet und dazwischen interpoliert, keine allgemeine pixelgenaue Rendergarantie.

### Regressionen

Echte GLB-Ausgabe und erneutes Laden für vier Kombinationen (mit/ohne Skelett, relative/absolute native Morphs): animierte Vertexpositionen, mesh-gebundene/globale Punkte, bestehende Morph-Gewichte/-Namen, deduplizierte Oberflächenposen, Figurenbewegung, wiederholte Posen und Schleifenschluss. Quelle, Daten und Geometrie bleiben unverändert. Budgettests lehnen zu viele Ziele und zu große Attributdaten vor dem Kopieren der Figur ab.

Browserfall erstellt einen freien Punkt und Move auf einer ungeriggten Oberfläche, lädt die GLB herunter, prüft Morph-/Clipdaten und den unveränderten Projektstand, importiert erneut und spielt den Clip ab. Artefakt `exported-glb-surface-move.png`. Aktueller vollständiger CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

### Grenzen

64 Ziele je Mesh, 64 MiB Morph-Attributdaten einschließlich nativer Daten und Ergänzungen, 20 Millionen geschätzte Punkt-/Vertex-/Normalen-Arbeitseinheiten sowie die bisherigen Sample-/Kanalbudgets. Versteckte Meshes erhalten keine neuen Morph-Spuren. Andere native Morph-Attribute als Position/Normal werden mit Hinweis abgewiesen. Originalclip-Übernahme und Retargeting bleiben offen.

Lokaler Nachweis: `npm run verify` erfolgreich, **324 Node-Tests bestanden**, TypeScript und Produktionsbuild bestanden. Normalen werden zusätzlich an Schlüsselposen verglichen; unsichtbare ungebundene Knochen erzeugen keine ungültigen Animationsspuren. Bekannte Bundle-Größenwarnung bleibt.

CI-Korrektur (2026-11-07): Der erste Lauf bestand 28 von 29 Browsertests. Der neue Test verwendete beim Anlegen des Oberflächenpunkts einen unzulässigen Radius von 2 (Befehlsgrenze: 0,6). Der Test setzt den Punkt jetzt mit zulässigem Radius direkt auf einen Vertex der normalisierten Dreiecksfigur und prüft zusätzlich eine tatsächlich positive Verformung im exportierten Morph-Ziel. Keine Produktionsgrenze geändert, kein Test übersprungen und kein Zeitlimit erhöht. Vollständiges Ergebnis des korrigierten Stands siehe PR #1.

## Version 0.79.0

Zeitstempel: 2026-11-07T09:26:00+01:00 (Europe/Berlin)

### Animationsausgabe

Ausgewählter eigener Studio-Move mit bearbeitetem Rig und einem Clip. Unabhängige Hierarchie-/Geometriekopien; Knochenkanäle werden auf die kopierten Knoten bezogen. Eine Gesamtspur bildet Position, Rotation und Größe um den ursprünglichen Figurenmittelpunkt ab; der Modellraum wird separat beibehalten. Keine Originalclip-Übernahme und keine animierten freien Oberflächenpunkte.

Zeitstützstellen pro Segment mit 30 Hz einschließlich aller Schlüsselposen und Schleifenschluss. Keine allgemeine exakte Kurvenübereinstimmung zwischen den Stützstellen; keine FPS-Zusage. Umfang und Kanalwerte sind vor der Ausgabe begrenzt. [Anleitung und Grenzen](GLB-EXPORT.md).

### Prüfungen

`npm run verify`: 322 Node-Tests, TypeScript und Produktionsbuild bestanden. Zusätzlicher Rundlauftest exportiert eine echte GLB, lädt sie neu und vergleicht animierte Hautpositionen bei mehreren Zeiten: Knochenbewegung, Figurentransformation mit Drehpunkt, Skalierung, wiederholte Posen und Schleifenschluss. Quelle und Daten bleiben unverändert. Ein Zwischenzeitpunkt wird mit einer zur Abtastung passenden Toleranz verglichen. Nicht unterstützte freie Punkte, Scherung, fehlende Posen und zu große Sequenzen werden geprüft. Knochen ohne Kontrollgriff erhalten ihre Grundpose statt einer zufällig sichtbaren anderen Pose.

Browserfall erstellt einen Mika-Move, lädt die GLB herunter, prüft Clip-/Skindaten und unveränderten Studio-Zustand, importiert sie erneut und spielt den Clip im Player ab. Artefakt `exported-glb-move.png`; maßgeblicher CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1). Bekannte Bundle-Größenwarnung bleibt. Manuelle Bewegungsqualität bleibt offen.

## Version 0.78.1

Zeitstempel: 2026-11-07T09:04:13+01:00 (Europe/Berlin)

### Fehler und Korrektur

Der neue Regressionstest schlug vor der Korrektur mit „Der Quellknochen hat keinen übertragbaren Oberflächen-Einfluss“ fehl. Ursache: Gewichtsbearbeitungen laufen nach dem Hierarchieumbau; ein gelöschter Einfügeanker besitzt dann keinen Elternknoten mehr. Seine lokale Transformation wurde damit fälschlich in einem anderen Weltbezug ausgewertet.

Der Wiederaufbau merkt sich die früheren Elternbezüge gelöschter Knochen. Nur die Berechnung der Einfügeachse rekonstruiert diese Bezüge über die endgültigen Grundtransformationen; die gelöschten Knochen werden nicht wieder in die Szene eingehängt. Bestehende Fehlerprüfungen für tatsächlich wirkungslose Gewichtsübertragungen bleiben erhalten. Kein neues Projektformat.

### Regressionen

Unabhängiger Vergleich der Gewichte nach logischen Knochen-IDs: Nach der Löschung geht nur der verbleibende Anteil des gelöschten Knochens auf seinen Elternknochen über; vorher übertragener Anteil bleibt beim neuen Gelenk. Prüft einfache/verschachtelte Löschung, versetzten/skalierten Modellraum und gedrehten Vorfahren, vorherige Figurtransformation, drei Resets, Daten-Undo/Redo und Projektvalidierung/-rekonstruktion. Der echte Mika-GLB-Rundlauftest verwendet wieder die ursprüngliche Problemfolge.

Neuer Browserfall bedient die Folge über die Studio-Oberfläche, prüft Undo/Redo, lädt eine gespeicherte Projektdatei neu und erstellt `topology-weight-replay.png`. Maßgeblicher CI-Nachweis für den jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1). Allgemeine Haut-/Bewegungsqualität bleibt manuell zu prüfen.

Lokaler Nachweis: `npm run verify` erfolgreich, **319 Node-Tests bestanden**, TypeScript und Produktionsbuild bestanden. Der anschließend um einen gedrehten Vorfahren erweiterte Regressionstest besteht ebenfalls. Bekannte Bundle-Größenwarnung bleibt.

## Version 0.78.0

Zeitstempel: 2026-11-07T02:12:55+01:00 (Europe/Berlin)

### Rig-Export

Eigenständige GLB mit aktuellem Hautskelett, Gewichten und Bindematrizen; keine Clips oder Studio-Moves. Die Figurenhierarchie wird mit neu zugeordneten Knochen kopiert, Geometrie und Materialien sind unabhängig, Texturbilder werden nur gelesen. Die Welttransformation der Quelle bleibt trotz externer Viewer-Normalisierung erhalten.

Node-Tests exportieren und laden eine echte GLB erneut: verformte Weltpositionen bleiben erhalten, Knochendrehung bewegt die Haut nach dem Laden. Ein bearbeiteter Mika mit eingefügtem Gelenk, Knochenlöschung und anschließender Gewichtsübertragung behält geprüfte Vertexpositionen und Hautgewichte. Quellgeometrie, Materialien und Skelett werden nicht durch Freigabe der Kopie entsorgt. Modelle ohne Hautskelett sowie versteckte/externe Knochen werden abgewiesen.

Browserfall: Mika-Gelenk einfügen, GLB mit Rig herunterladen, Skin-/Bufferdaten prüfen, Projektstand vergleichen, Datei wieder laden und ein Gelenk über die Studio-Schnittstelle drehen. Aktueller vollständiger CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

### Bekannter separater Befund

Einfügen eines Zwischengelenks → Gewichte vom Elternknochen auf das neue Gelenk übertragen → denselben Elternknochen löschen kann beim Topologie-Replay die frühere Übertragung als wirkungslos ablehnen. Dieser Fehler entsteht vor dem Export und ist in der Roadmap offen. Der Mika-Rundlauftest löscht zuerst und überträgt danach. Keine pauschale Freigabe aller gemischten Topologiefolgen.

### Grenzen

Keine Animationsausgabe, kein Retargeting, keine allgemeine Material-/Texturqualitätsabnahme. Studio-Projekt zusätzlich speichern.

Lokaler Nachweis: `npm run verify` erfolgreich, **318 Node-Tests bestanden**, TypeScript und Produktionsbuild bestanden. Bekannte Bundle-Größenwarnung bleibt.

## Version 0.77.0

Zeitstempel: 2026-11-07T01:14:27+01:00 (Europe/Berlin)

### Implementierung und lokale Prüfung

Statische GLB-Ausgabe der sichtbaren Figur mit gebackener Haut-/Morph-Verformung und Welttransformation. Geometriekopien erhalten UVs und Materialeigenschaften; Spiegelungen korrigieren die Dreiecksorientierung. Unsichtbare Zweige werden übersprungen. Kein Rig, keine Animationen, kein Retargeting. Instanzen und teilweise ausgeblendete Materialgruppen werden abgewiesen.

`npm run verify`: 314 Node-Tests bestanden, 0 fehlgeschlagen; TypeScript und Produktionsbuild erfolgreich. Neue Tests prüfen tatsächliche Vertexpositionen nach Skinning/Morphing/Spiegelung, Quellschutz, Materialkopien und nicht unterstützte Eingaben. Bekannte Bundle-Warnung bleibt; GLTFExporter wird als eigener Chunk erst bei Bedarf geladen.

Browserfall: Mika verschieben/vergrößern, GLB herunterladen, Header und selbst enthaltenen Buffer sowie fehlende Rig-/Clipdaten prüfen, Projektzustand vergleichen und Datei erneut laden. Aktueller CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

### Grenzen

Keine allgemeine Material-/Texturqualitätsabnahme. Statische Form; für Bearbeitung Studio-Projekt zusätzlich speichern. Manuelle anatomische Bewegungsabnahme bleibt offen.

## Version 0.76.3

Zeitstempel: 2026-11-07T00:47:32+01:00 (Europe/Berlin)

### Ausgangsnachweis

[Lauf 42268949543](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42268949543) für 0.76.2: 312 Node-Tests, TypeScript/Build und alle 23 Chromium-Fälle bestanden. Das Navigationsartefakt wurde angesehen; Optionen-Text und Fokus sind erkennbar.

### Scrollprüfung

Neuer Fall mit 1440 × 1000 und 1280 × 600: Zum Posenfeld scrollen, haftende Vorschau am oberen Rand und vollständig im Fenster prüfen; echte Mausradereignisse müssen die Kamera ändern, ohne gespeicherten Studio-Zustand zu ändern. Bei 390 × 844 bleibt die Vorschau im Dokumentfluss, und das Posenfeld lässt sich ohne Überdeckung erreichen und beschreiben. Laufzeitfehler werden erfasst.

Artefakte: `studio-scrolled-1000.png`, `studio-scrolled-600.png`, `studio-mobile-controls.png`. Der endgültige Status des jeweiligen Commits und die Artefakte sind in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verknüpft. Kein Nachweis für subjektives Mausgefühl oder allgemeine Haut-/IK-Qualität.

## Version 0.76.2

Zeitstempel: 2026-11-06T19:13:55+01:00 (Europe/Berlin)

### Ausgangsnachweis

[Lauf 41993440271](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/41993440271) für Commit 8d93ee0: 312 Node-Tests, TypeScript/Build und alle 22 Chromium-Fälle bestanden. Job-Logs wurden geprüft.

### Visuelle Stichprobe

Aus Artefakt 13398979447 wurden `studio.png`, `mobile.png`, `orbit-normal.png` und `player-3d.png` betrachtet. Optionen ist auf der dunklen Navigation kaum lesbar; der sichtbare Entwicklungsstand ist veraltet. Beides wird in 0.76.2 korrigiert. Der Importfehler in Player-/Mobile-Bildern gehört zum absichtlich ungültigen Import im Test; der vorherige Avatar bleibt sichtbar.

Die große Leerfläche oberhalb der haftenden Studio-Vorschau im Ganzseitenbild ist nicht als Live-Layoutfehler bestätigt. Eine Aufnahme des sichtbaren Bereichs bzw. manuelles Scrollen ist für diese Bewertung erforderlich. Kein Nachweis für Mausgefühl, flüssige Bewegungen oder allgemeine anatomische Qualität. Die übrigen Artefaktbilder wurden in dieser Stichprobe nicht bewertet.

### Korrekturprüfung

Neue Chromium-Prüfung liest die erwartete Version aus package.json, misst den tatsächlichen CSS-Textkontrast in Normal-/Hoverzuständen (mindestens 4,5:1), prüft Tastaturfokus und öffnet Optionen per Enter. Das neue Artefakt `navigation-readable.png` zeigt den sichtbaren Bereich. Vollständiger aktueller CI-Nachweis in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

## Version 0.76.1

Zeitstempel: 2026-11-05T09:17:35+01:00 (Europe/Berlin)

[Lauf 41992106544](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/41992106544) für 0.76.0: 312 Node-Tests und Build bestanden, 20/22 Chromium-Fälle bestanden. Beide Fehlschläge in `local-zoo.spec.ts` sind Strict-Mode-Verletzungen desselben Selektors mit zwei Statusfeldern. Mausnavigation bestanden.

Korrektur: `zoo-operation-status` und `zoo-sync-status` unterscheiden Vorgangsergebnis und Listenwarnung. Die Speicherbestätigung wird gezielt geprüft; die weiteren Assertions für Reload, Posen, Moves und getrennte Tabs bleiben erhalten.

Der korrigierte Stand wird durch den vollständigen Workflow in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) geprüft. Maßgeblich sind die Checks am jeweiligen Commit, nicht ein früherer grüner Lauf. Manuelle visuelle Abnahme bleibt offen.

### Ergänzende damalige Prüfnotizen

Actions ist laut Inhaber seit 05.11.2026 wieder verfügbar. [Lauf 41992106544](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/41992106544) prüfte 0.76.0: 312 Node-Tests und Build erfolgreich; 20 von 22 Browserfällen bestanden, einschließlich Mausnavigation. Beide Fehler betrafen denselben mehrdeutigen Statusselektor im Model-Zoo-Test. 0.76.1 vergibt eindeutige Status-IDs und korrigiert die Tests. Der Korrekturlauf [41993440271](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/41993440271) bestätigt 312 Node-Tests, Build und alle 22 Chromium-Fälle für 0.76.1. 0.80.0 ist durch [Lauf 42359935481](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/42359935481) mit 324 Node-Tests, Build und 29 Chromium-Fällen vollständig bestätigt. Der vollständige Prüfstatus des aktuellen Stands ist in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verknüpft. Die alten Kontingentabbrüche sind weiterhin keine Testergebnisse.

## Version 0.76.0

Zeitstempel: 2026-11-04T14:54:49+01:00 (Europe/Berlin)

Eigene Skalierung des umgehängten Knochens geprüft: gleichmäßig, ungleichmäßig, Spiegelung an X/Y/Z und an zwei Achsen. Hautgeometrie und Weltmatrizen starrer Anbauteile bleiben in Grundpose und gedrehter Pose erhalten. Gespeicherte Posen, Entwurf, Projektvalidierung, Rekonstruktion und Quellwiederherstellung einschließlich exakter Quellskalierung geprüft. Nicht invertierbare Skalierung lässt Daten und Hierarchie unverändert.

Keine gerenderte Haut-/Bewegungsabnahme. Ungleiche oder nicht gleichmäßige Elternastskalierungen bleiben ausgeschlossen. Keine Actions gestartet; main unverändert.

`npm run verify`: **312 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen. Danach nur Versionsnummer und Dokumentation angepasst.

## Version 0.75.0

Zeitstempel: 2026-11-04T14:51:57+01:00 (Europe/Berlin)

Umhängen zwischen Ästen gleicher kumulierter positiver gleichmäßiger Skalierung geprüft, einschließlich verschiedener Hierarchien (4 × 0,5 gegenüber 2). Hautgeometrie und Weltmatrizen starrer Anbauteile bleiben in Grundpose, gedrehter gespeicherter Pose und Entwurf erhalten; Projektvalidierung, Rekonstruktion und Quellwiederherstellung geprüft. Ungleiche, nicht gleichmäßige und negative Astskalierungen lassen Daten und Hierarchie unverändert.

Keine gerenderte Haut-/Bewegungsabnahme. Keine Actions gestartet; main unverändert.

`npm run verify`: **310 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen. Danach nur Versionsnummer und Dokumentation angepasst.

## Version 0.74.0

Zeitstempel: 2026-10-31T02:45:35+01:00 (Europe/Berlin)

Umhängen unter gemeinsam gleichmäßig, ungleichmäßig und negativ skaliertem Vorfahren geprüft: unveränderte Hautgeometrie und Weltmatrizen starrer Anbauteile in Grundpose und gedrehter Pose; Entwurf, Projektvalidierung, Rekonstruktion und Quellwiederherstellung. Nicht invertierbare gemeinsame Skalierung lässt Daten und Hierarchie unverändert. Bestehende Schutzregeln für Skalierungen auf unterschiedlichen Ästen bleiben getestet.

Keine gerenderte Haut-/Bewegungsabnahme und keine Unterstützung unterschiedlicher Astskalierungen. Keine Actions gestartet; main unverändert.

`npm run verify`: **308 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen. Danach nur Versionsnummer und Dokumentation angepasst.

## Version 0.73.0

Zeitstempel: 2026-10-31T02:32:53+01:00 (Europe/Berlin)

Löschen skalierter Endknochen für gleichmäßige, ungleichmäßige und negative Skalierungen geprüft: Hautgewichte an Elternknochen, unveränderte Grundgeometrie, entfernte Posenspur, Projektvalidierung und Rekonstruktion sowie Wiederherstellung von Quellhierarchie, Skalierung und Gewichten. Wurzeln und skalierte Zwischenknochen bleiben geschützt.

Gerenderte Haut-/Bewegungsabnahme bleibt offen. Keine Actions gestartet; main unverändert.

`npm run verify`: **306 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen. Danach nur Versionsnummer und Dokumentation angepasst.

## Version 0.72.0

Zeitstempel: 2026-10-31T01:51:23+01:00 (Europe/Berlin)

Neue Abzweigungen mit gleichmäßiger, ungleichmäßiger und negativer Quellskalierung geprüft: gewünschte Weltposition, unveränderte Hautgeometrie, Pose, Projektvalidierung und Rekonstruktion sowie Quellwiederherstellung. Nicht invertierbare und extreme Umrechnungen lassen Daten und aktuelle Pose unverändert. Bestehende Maus-/Agenten- und Undo-/Redo-Tests bleiben erhalten.

Keine gerenderte Haut-/IK-Abnahme. Umhängen und Löschen skalierter Knochen sowie Löschen mit Anbauteilen bleiben eingeschränkt. Keine Actions gestartet; Arbeitsbranch bleibt getrennt von main.

`npm run verify`: **305 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen.

## Version 0.71.1

Zeitstempel: 2026-10-30T19:06:33+01:00 (Europe/Berlin)

Eigene minimale glTF-Geometrie in drei getrennten Messprozessen geprüft: keine/eine/alle Oberflächen, erwartete Vertex-Anzahl und Modellprüfsumme, Quelldatei unverändert. Fehlerfälle für Bildtexturen, defekten GLB-Header und ungültige CLI-Optionen geprüft. Zusätzlich Standard-Mika mit einer Wiederholung pro Fall erfolgreich gemessen.

Keine neue reale Großmodellmessung und keine gerenderte Browserabnahme. Keine Actions gestartet.

`npm run verify`: **303 Node-Tests bestanden, 0 fehlgeschlagen**; TypeScript und Produktionsbuild erfolgreich. Bekannte Bundle-Größenwarnung bleibt bestehen. Der geprüfte Code wurde anschließend lediglich mit Versionsnummer 0.71.1 und Dokumentation versehen.

## Version 0.71.0

Zeitstempel: 2026-10-30T09:42:50+01:00 (Europe/Berlin)

### Messung und Regression

Vorher-/Nachher-Messung mit identischem Mika und identischem Benchmark: jeweils neun eigene Prozesse, drei Wiederholungen pro Fall. Alle Positionen-/Normalen-Prüfsummen stimmen zwischen den beiden Implementierungen überein. Bei allen betroffenen Meshes sinken die Medianzeiten pro Prozess von 24,94–26,86 ms auf 13,10–16,93 ms. Festgehaltener ArrayBuffer-Zuwachs weiterhin rund 8,34 MiB. [Rohdaten und Messvertrag](TRANSITION-BENCHMARK.md).

Ein neuer Regressionstest ändert die Zielgeometrie in jedem Übergangsschritt und vergleicht zusammenhängende Float32-Attribute mit verschachtelten Attributen. Zielzustände werden korrekt wiederhergestellt, die Ausgangsgeometrie bleibt unabhängig, benachbarte Datenfelder bleiben unverändert und Normalen stimmen überein. Die bisherigen Tests für Pause, Abbruch, erneuten Wechsel, Skinning, freie Punkte und Geometriewechsel bleiben erhalten.

### Lokale Prüfung

`npm run verify` erfolgreich: **301 Node-Tests bestanden, 0 fehlgeschlagen**. TypeScript-Prüfung und Produktionsbuild bestanden. Der Build meldet weiterhin das große JavaScript-Bundle (rund 1,39 MB / 385 kB gzip).

### Grenzen

Keine neue gerenderte Browserabnahme. CPU-Messung ohne Modellladen, Animator/IK, UI oder WebGL; keine allgemeine Bildratenzusage. Speicher-Momentaufnahmen sind keine Spitzenwerte. Große reale Importmodelle und sichtbare Qualität bleiben offen. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.

## Version 0.70.0

Zeitstempel: 2026-10-30T08:51:57+01:00 (Europe/Berlin)

### Gezielte Nachweise

Sieben Übergangstests bestanden, davon zwei neue Fälle:

- Zwischengeometrie und Begrenzung bei halbem Übergang; exakte Wiederherstellung der Zielpositionen, Zielnormalen, Bounding Box und Bounding Sphere. Wiederholter Wechsel startet an der sichtbaren Zwischenform, Abbruch stellt das Ziel wieder her. Eine ausgetauschte Geometrie wird nicht überschrieben.
- Ein frei gesetzter Mundpunkt verformt eine echte Three.js-Fläche. Originalclip → Studio-Move → Originalclip überblendet deren Vertex-Positionen in beide Richtungen, einschließlich Pause. Projektdaten und Dirty-Status bleiben unverändert.

Die bestehenden Transformations-, Morph-, Skinning-, Kurzclip- und Hierarchieprüfungen bleiben erhalten. Es werden keine Hautgewichte interpoliert oder gespeichert.

### Gesamtprüfung

`npm run verify`: **300 Node-Tests und TypeScript-/Produktionsbuild bestanden**. Die zusätzliche Kontrolle eines nicht betroffenen Meshes wurde anschließend im gezielten Übergangstest geprüft.

### Grenzen

Node/Three.js und happy-dom, kein gerenderter Browsernachweis. Kombinationen mit großen skinned Modellen und die sichtbare Normalen-/Hautqualität bleiben manuell zu prüfen. Bearbeitete Knochen-Grundstellung, Topologie-/Gewichtsumbauten und Schertransformationen verwenden weiterhin den direkten Wechsel. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.

## Version 0.69.2

Zeitstempel: 2026-10-30T07:18:04+01:00 (Europe/Berlin)

### Fehler und Nachweis

Zwei neue Regressionstests scheiterten zunächst am unveränderten Stand 0.69.1:

- Ein 50-ms-Originalclip erreichte bei einer 180-ms-Mixer-Überblendung zwar sein zeitliches Ende, behielt aber Restgewicht des vorherigen Clips.
- Ein Zeitleistensprung während der Mischung zeigte nicht ausschließlich die gewünschte Zielpose.

Nach der Korrektur bestehen alle zehn gezielten Playback-/Übergangstests. Sie prüfen vollständige Endpose, unveränderte Endzeit, Wiederholen, manuelle Pause und anschließendes Weiterspielen. Die bisherigen Studio-/Skinning-Übergangstests bleiben erfolgreich.

### Gesamtprüfung

`npm run verify`: **298 Node-Tests und TypeScript-/Produktionsbuild bestanden**.

### Grenzen

Node/Three.js und happy-dom; keine neue Chromium- oder visuelle Qualitätsabnahme. Die Ausschlüsse aus 0.69.0 für bearbeitete Rigs bleiben bestehen. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.

## Version 0.69.1

Zeitstempel: 2026-10-29T21:45:22+01:00 (Europe/Berlin)

### Gezielte Prüfung

Acht Wiedergabetests bestanden, davon zwei neue Regressionstests. Ein 50-ms-Originalclip endet vor der 180-ms-Überblendung: Die Zielpose wird trotzdem vollständig erreicht. Vorheriges manuelles Pausieren friert die sichtbare Pose ein. Wiederholen startet neu; Zeitleistensprung löst den Abschlusszustand. Ein Übergang ohne Grundclip endet auch bei pausiertem leerem Transport; Tempo und ungültige Framezeiten sind geprüft.

Die Berechnung der Übergangszeit wird von Anwendung und Tests gemeinsam verwendet. Bestehende Skinning-, Transformations-, Morph-, Hierarchie- und Datenunverändertheitsprüfungen bestehen weiterhin.

### Gesamtprüfung

`npm run verify`: **296 Node-Tests und TypeScript-/Produktionsbuild bestanden**.

### Grenzen

Node/Three.js und happy-dom, kein gerenderter Browsernachweis. Die Ausschlüsse aus 0.69.0 für bearbeitete Rigs bleiben bestehen. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.

## Version 0.69.0

Zeitstempel: 2026-10-29T21:13:59+01:00 (Europe/Berlin)

### Lokale Ergebnisse

294 Node-Tests und Produktionsbuild bestanden. Drei neue Tests prüfen:

- Zwischenwerte für Position, Quaternion-Rotation, Skalierung und Morph-Gewichte; exakte Wiederherstellung der Zielmatrix und ihrer Aktualisierungsart, Pause, wiederholter Wechsel und Abbruch.
- Direkter Wechsel bei geänderter Hierarchie oder Schertransformation.
- Originalclip → Studio-Move → Originalclip mit echtem Three.js-Skelett und Skinning, Hautposition ohne Sprung am Start, Pause, Zeitleistensprung und automatische Rückkehr zur Grundbewegung; unveränderte Projektdaten und Dirty-Status. Studioeintritt beendet den Übergang; freie Oberflächenpunkte und bearbeitete Knochen-Grundstellung sind ausgeschlossen.

Die Ergänzung der Ausschlussfälle wurde zusätzlich im gezielten Testlauf geprüft. Die bekannte Bundle-Größenwarnung bleibt bestehen.

### Grenzen

Kein neuer Chromium-/WebGL-Nachweis, keine manuelle Bewertung des Übergangs. Die Tests laufen mit Three.js und happy-dom, nicht mit einem Renderer. Die erste Stufe unterstützt keine bearbeiteten Grundskelette, Gewichtsumbauten oder freien Oberflächenpunkte; dort bleibt der direkte Wechsel bestehen. Der alte Original-PaKaChi-Bildplayer und seine 72 Transformationsbilder werden nicht geändert.

Entwicklungsmeilenstein auf `work/local-verification-model-zoo`; main unverändert. Keine Actions gestartet.

## Version 0.68.0

Zeitstempel: 2026-10-29T19:35:45+01:00 (Europe/Berlin)

Entwicklungsmeilenstein auf dem Arbeitsbranch, noch nicht in main. Model-Zoo-Fehlerbehandlung, lokale Prüfkommandos und Dokumentationsfilter sind gebündelt. Letzter lokaler Nachweis vor der Dokumentationspflege: 290 Node-Tests und Build bestanden. Finale Prüfung des Meilensteins folgt unten. Chromium-Nachweis und reale Browserkontingente bleiben offen.

### Ergebnis

- `npm run verify`: 291 Node-Tests und TypeScript-/Produktionsbuild bestanden.
- Nach Ergänzung der ausdrücklichen Bildtextur-Abweisung: gezielter CLI-Regressionstest erneut bestanden, einschließlich ungültigem Projekt, Bildtexturen, unveränderten Quelldateien und wiederholbarer Rekonstruktion.
- Node-Tests simulieren Model-Zoo-Kontingent-/Listenfehler und Tab-Ereignisse; reale Browserquoten bleiben offen.
- Bekannte Warnung zum großen JavaScript-Bundle bleibt bestehen.
- Keine neuen Actions-Läufe, kein neuer Chromium-Nachweis. Version 0.68.0 ist ein Entwicklungsmeilenstein auf dem Arbeitsbranch, keine vollständige Browserfreigabe.

### Importmessung

Mika mit 256 Gewichtsaufträgen, drei getrennte Node-Prozesse: CPU-Importzeiten 1922.96, 1940.57, 1901.99 ms; Median **1922.96 ms**. Rig-Aufbau einschließlich Wiederherstellung des Verlaufs: 1758.21, 1779.44, 1743.1 ms. Projekt- und Skin-Prüfsummen sind zwischen den Messungen identisch.

Einzelner lokaler Hardware-/Laufzeitstand; kein Vorher/Nachher-Vergleich und keine allgemeine Laufzeitzusage. Die erzeugte Mika-Projektkopie enthält keine Bildtexturen. UI, WebGL, Browserdatenbank und Zeit bis zum sichtbaren Bild sind ausgeschlossen. Große eigene Projekte und texturierte Modelle bleiben zu messen. [Rohdaten](benchmarks/project-import-0.68.0.json) · [Messvertrag](IMPORT-BENCHMARK.md).

### Dokumentationsabgleich

README, Design, Blaupausenindex, Roadmap, Changelog und Prüfstand sind abgeglichen. Paket und Lockdatei tragen 0.68.0. Erledigte Roadmap-Historie ist entfernt; zuvor offene Aufgaben sind erhalten. Das Changelog verwendet Unreleased, einen datierten Versionsabschnitt, passende Änderungskategorien und zusätzlich einen ISO-8601-Zeitstempel mit Europe/Berlin-Zeitzone.

### Ergänzende damalige Prüfnotizen

Auf dem Arbeitsbranch ist mit 0.68.0 eine Workflow-Anpassung vorbereitet: Direkte Pushes nach `main` überspringen den Workflow nur dann, wenn **alle** geänderten Dateien unter `README.md`, `docs/**/*.md` oder `docs/benchmarks/*.json` fallen. Gemischte Änderungen, Code, Tests, Abhängigkeiten, Workflow-Dateien und `docs/references/original-sha256.json` lösen weiterhin die vollständige Prüfung aus. Pull Requests bleiben ungefiltert, damit verpflichtende Checks nicht durch einen Pfadfilter auf „Pending“ verbleiben. `workflow_dispatch` bleibt verfügbar.

## Version 0.67.0

**0.67.0:** Ein zusätzlicher Browserfall prüft echte Mausrad-, Rechts- und Mitteltastenereignisse im Studio. Nach außermittigem Zoom und Verschieben bleiben beim Drehen Abstand und Bildschirmposition der bekannten Figurenmitte konstant. Der Test wählt die normale und invertierte Drehrichtung über den Optionsdialog, prüft gegensinnige Kamerabewegung und funktionierenden Zoom nach Loslassen. Der übrige Studiozustand einschließlich Revision und Figur bleibt unverändert.

Produktionsbuild lokal bestanden. Neuer Chromium-Nachweis steht aus. Der bisherige bestätigte Stand umfasst 286 Node-Tests und 21 Browserfälle.

Dies ergänzt den automatisierten Navigationsnachweis; tatsächliches Mausgefühl, komplexe Skelett-/Hautqualität und große reale Modelle bleiben manuell zu prüfen. Keine Änderung am Kameraalgorithmus.

### Nachtrag zum Startabbruch

Am 28.10.2026 bestätigte der Repository-Inhaber das aufgebrauchte Actions-Kontingent. Die zuvor nicht aus den Jobdaten erkennbare Ursache ist damit geklärt. Die Korrektur des Mausnavigationstests bleibt ohne erfolgreichen Bestätigungslauf; weder ein erneuter Push noch eine Wiederholung bei unverändertem Kontingent liefert diesen Nachweis.

## Version 0.66.0

**0.66.0:** Der Sichtfilter kopiert nur UV-Kanäle, die tatsächlich von unterstützten Alpha-Materialien benötigt werden. Undurchsichtige Dreiecke erhalten keine eigenen UV-Vektoren. Die Sichtregeln und gespeicherten Projekte bleiben unverändert. `npm run benchmark:visibility` misst synthetische Flächen mit 5.000/20.000/80.000 Dreiecken, jeweils undurchsichtig und mit Alpha-Ausschnitt; jeder Fall läuft in einem eigenen Prozess.

286 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40665412491)). Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 4758 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Lokale Einzelmessung bei 80.000 Dreiecken: zurückbehaltener JavaScript-Heap einschließlich Testmodell von 166,10 auf 64,85 MiB (undurchsichtig) und 166,12 auf 100,20 MiB (Alpha). Die 1.000 Strahlproben lieferten jeweils dieselben Ergebnisse. Keine Messung des vollständigen Browserimports, Renderings oder Skinning; keine allgemeine Laufzeit-/Speicherzusage. Mipmaps, Teiltransparenz und manuelle Abnahme großer realer Modelle bleiben offen.

### Lokaler Vorher-/Nachher-Vergleich

Node v24.22.1, frischer Prozess pro Fall mit expliziter Garbage Collection. Speicherwerte enthalten das synthetische Quellmodell. Einzelmessungen, kein statistischer Benchmark. Die erste Strahlabfrage enthält den Aufbau des Suchbaums.

| Dreiecke | Material | Heap vorher/nachher (MiB) | Erste Abfrage vorher/nachher (ms) | Sichtbar von 1.000, vorher/nachher |
| --- | --- | --- | --- | --- |
| 5000 | opaque | 10.85 / 4.16 | 40.5 / 29.6 | 0 / 0 |
| 5000 | alpha-cutout-uv2 | 10.55 / 6.44 | 39.8 / 32.7 | 502 / 502 |
| 20000 | opaque | 41.86 / 16.63 | 186.9 / 101 | 0 / 0 |
| 20000 | alpha-cutout-uv2 | 41.67 / 25.18 | 155.8 / 141.8 | 502 / 502 |
| 80000 | opaque | 166.1 / 64.85 | 518.6 / 411.6 | 0 / 0 |
| 80000 | alpha-cutout-uv2 | 166.12 / 100.2 | 564.1 / 481.6 | 502 / 502 |

Rohdaten: [vorher](benchmarks/visibility-0.65.0.json), [nachher](benchmarks/visibility-0.66.0.json). Aufruf: `npm run benchmark:visibility`. Kein automatischer Zeitgrenzwert, weil Laufzeit und Garbage Collection hardwareabhängig sind.

Der erste lokale Testlauf meldete eine abweichende Kopie von Originalframe `034.png`. Das Bild auf GitHub wurde anhand seiner SHA-256-Prüfsumme verifiziert, die lokale Abweichung gesichert und die lokale Kopie wiederhergestellt. Der erneute vollständige Lauf besteht alle 286 Tests einschließlich der 83 Originaldateien und 72 Transformationsbilder. Keine Avatar-Binärdatei ist Bestandteil dieses Meilenstein-Commits.

### CI-Bestätigung

Geprüfter Commit: `425a85a0d2394c509c8fe0249fe1387a072a2916`. Der GitHub-Lauf besteht 286 Node-Tests ohne Fehler, den Build und alle 21 Browserfälle (3,0 Minuten). Dies umfasst den PNG-Alpha-Fall, den Pinselverlauf mit Undo/Redo und Wiederladen sowie die Prüfung der Originaldateien. Keine manuelle Qualitäts-/GPU-Abnahme.

## Version 0.65.0

**0.65.0:** Neue sichtgefilterte Pinselstriche berücksichtigen Alpha-Ausschnitte über `alphaTest`, Bildalpha und den Grünkanal einer `alphaMap`. Die Prüfung interpoliert UVs am Strahltreffer und berücksichtigt Texturtransformation, UV-Kanal, Wiederholung, Spiegelung, Flip und Nearest-/Linear-Vergrößerungsfilter. Pixel und Materialdaten werden beim Laden festgehalten. `region.view.alpha: true` zusammen mit `materials: true` speichert die neue Regel; ältere Aufträge behalten ihre bisherige Sichtprüfung.

285 Node-Tests, Produktionsbuild und alle 21 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40545759919)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 8998 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Die Alpha-Prüfung verwendet deterministisch die Basisebene der Textur, keine Mipmaps oder anisotrope Filterung. Dadurch sind Abweichungen zur gerenderten Kante bei Verkleinerung möglich. Unterstützt sind lesbare RGBA-8-Bit-Bilder bis 16.777.216 Pixel pro Textur. Nicht lesbare/komprimierte Texturen, fehlende UVs, Shader-Materialien und Alpha-to-Coverage bleiben verdeckend. Teiltransparenz wird nicht simuliert; Dreiecke bleiben beidseitig. GPU-/Materialqualität und große Modelle sind nicht manuell abgenommen. Neue Alpha-Aufträge benötigen mindestens 0.65.0; kein automatischer Umbau alter Verläufe.

### Bestätigter Prüflauf

Geprüfter Commit: `d22828d7fdc221da5bf2fe000c62cf4a87afb2af`. GitHub bestätigt 285 Node-Tests ohne Fehler, den Produktionsbuild und 21 Browserfälle (5,1 Minuten). Die Browserinstallation benötigte etwa fünf Minuten und war erfolgreich.

Der neue Browserfall dekodiert ein echtes PNG und prüft Alpha-Loch, deckenden Bildbereich, alte Sichtregel sowie unveränderte Pixelkopie nach Bildänderung. Der vorhandene Pinseltest prüft die Alpha-Regel im gespeicherten Verlauf einschließlich Undo/Redo und Wiederladen. Dies ist keine manuelle GPU-/Darstellungsabnahme. Dokumentationsabgleich: 28.10.2026.

## Version 0.64.0

**0.64.0:** Neue sichtgefilterte Pinselstriche berücksichtigen ausgeblendete Materialien und Materialgruppen sowie transparente Materialien mit Opazität 0. Die ursprünglichen Materialeigenschaften werden beim Laden festgehalten; eine temporäre Gewichtsfärbung verändert die Auswahl nicht. `region.view.materials: true` speichert diese Regel. Ohne das Feld gilt weiterhin die geometrische Sichtprüfung aus 0.63.0, damit alte Verläufe unverändert bleiben.

282 Node-Tests, Produktionsbuild und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40542963345)); Python-Syntax lokal geprüft. Der Browserimport von 256 Aufträgen dauerte in diesem Lauf 6254 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Teiltransparente Materialien und Alpha-Texturen gelten weiterhin als undurchsichtige Hindernisse; Dreiecke bleiben beidseitig. Große Modelle und Materialdarstellung sind noch nicht manuell abgenommen. Dateien mit dem neuen Feld benötigen mindestens 0.64.0.

Geprüfter Commit: `f1be0869b0675baa0664502717d49b2fd621f479`. Regressionstest umfasst ausgeblendete Einzelmaterialien und Gruppen, transparente Opazität 0, Teiltransparenz, Opazität 0 ohne Transparenzmodus, unveränderliche Material-Snapshots und alte geometrische Aufträge. Projekt-/Katalogreplay und MCP-Transport erhalten die neue Regel. Der Browser-Pinseltest prüft sie beim Speichern und Wiederladen. Keine manuelle Material-/GPU-Abnahme.

## Version 0.63.0

**0.63.0:** Die optionale Checkbox „Pinsel nur auf sichtbare Oberfläche“ begrenzt Gewichtsaufträge auf geometrisch sichtbare Vertices im Blickfeld. Eine räumliche Suchstruktur prüft Verdeckung durch andere Dreiecke. Die Kamera wird pro Strich festgehalten und mit den Aufträgen gespeichert; Projekt-/Katalogexport und Undo/Redo reproduzieren die Auswahl. Assistent/MCP können `region.view` aus `get_studio.view` übernehmen.

281 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40529588502)); Python-Syntax lokal geprüft. Der Browserimport mit 256 sichtgefilterten Aufträgen dauerte in diesem Lauf 8909 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Zwei neue Node-Tests prüfen vordere/hintere Dreiecke, Kamerawechsel und eingefrorene Kamera, unveränderte verdeckte Vertices, Projekt-/Katalogreplay, Blickfeldgrenzen und ungültige Kameradaten. Der Node-MCP-Transporttest umfasst `region.view`. Der vorhandene Browser-Pinseltest aktiviert die Checkbox und prüft gespeicherte Kameradaten beim Undo/Redo und Wiederladen sowie beim langen Verlauf.

Sichtprüfung bezieht sich auf die ursprüngliche Grundpose. Dreiecke gelten beidseitig als undurchsichtige Hindernisse; Transparenz, Alpha-Ausschnitte und Materialgruppen-Sichtbarkeit werden nicht ausgewertet. Die erste Sichtprüfung baut eine Suchstruktur auf und benötigt zusätzlichen Speicher; große Modelle sind noch nicht manuell abgenommen. Ohne Checkbox gilt weiterhin der kugelförmige Pinsel. Projekte mit `region.view` benötigen mindestens 0.63.0.

### CI-Korrektur und Bestätigung

Der erste Lauf [40457475022](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40457475022) bestand 19 von 20 Browserfällen. Der Zwei-Tab-Test verglich zusätzlich die neue Kameraprojektion, die sich bei einer Änderung der Ansichtsgröße anpasst. Der korrigierte Test prüft weiterhin den vollständigen übrigen Studiozustand und die Kameraposition sowie eine endliche Projektionsmatrix. Keine Änderung des Anwendungscodes war erforderlich.

Geprüfter Commit: `388e4cd7aadd659e24f307140af9f78492442bf1`. Der Bestätigungslauf besteht alle 20 Browserfälle (5,0 Minuten), 281 Node-Tests und den Build.

## Version 0.62.0

**0.62.0:** Die Berechnung langer Gewichtsverläufe verwendet vorberechnete Weltpositionen, wiederverwendete kleine Zahlenfelder und direkte Pufferkopien. Vertices ohne Quellgewicht oder außerhalb des Bereichs werden früh übersprungen. Der Gewichtsvergleich bestätigt dieselben Ergebnisse einschließlich Zusammenführen doppelter Indizes, Sortierung, Normalisierung und Vier-Einfluss-Grenze.

279 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40407457621)). Der Browserimport mit 256 Aufträgen dauerte in diesem Lauf 6822 ms (vorheriger 0.61.0-Lauf: 19181 ms). Einzelmessungen auf CI-Runnern, keine allgemeine Laufzeitgarantie.

Ein zusätzlicher deterministischer Test vergleicht die optimierte Berechnung komponentengenau mit der bisherigen Map-Rechenweise. Enthalten sind 256 Vertices, verschiedene Gewichtskonstellationen, doppelte Indizes, Gleichstände, Abschneiden auf vier Einflüsse, transformierte Originalpositionen und normale/interleaved Attribute. Die bestehenden Tests prüfen weiterhin Atomarität, lange Verläufe, Undo/Redo und Export.

Das Budget bleibt bei 1024 Aufträgen. Lokale Messung mit 256 Aufträgen: 1626/1471/1551 ms für den reinen Rig-Reset (Median 1551 ms); vorherige Vergleichsmessung 6375/5903/5718 ms. Dies ist kein vollständiger Browserimport und keine allgemeine Echtzeit-Zusage. Vorberechnete Weltpositionen benötigen 24 Byte pro Vertex statt zuvor 12 Byte für die Positionskopie. Beschränkung des Pinsels auf sichtbare Oberflächen und manuelle Prüfung großer Modelle bleiben offen.

### GitHub-Nachweis

Geprüfter Commit: `3ea14cdbc8464a2ddfac6e55692bf481c5bff490`. [Workflow 40407457621](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40407457621): 279 Node-Tests ohne Fehler, Build und alle 20 Chromium-Fälle bestanden (4,1 Minuten). Der unveränderte Ladetest mit 256 Gewichtsaufträgen meldete 6822 ms, gegenüber 19181 ms im erfolgreichen 0.61.0-Lauf. Diese Browsermessung schließt Dateiübergabe und Warten auf die Bereitschaftsmeldung ein und ist nicht mit dem reinen Rig-Reset gleichzusetzen. Sämtliche erneut exportierten Aufträge stimmten überein. Keine neue manuelle Hautqualitäts- oder reale GPU-Abnahme.

## Version 0.61.0

**0.61.0:** Das gemeinsame Budget für Pinsel- und Einzelübertragungen steigt von 128 auf 1024 Aufträge pro Projekt. Neue Übertragungen werden auf den aktuellen Gewichten berechnet, ohne den bisherigen Verlauf und das Skelett bei jedem Auftrag erneut aufzubauen. Alle betroffenen Oberflächen werden vor der Übernahme geprüft; Fehler hinterlassen keine teilweise geänderten Gewichte. Posen, Skinning-Paletten und bestehende Attribute bleiben während der Übertragung erhalten.

278 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40362549729)). Der Import mit 256 Aufträgen dauerte auf diesem CI-Runner 19,181 Sekunden; weitere Ladezeitoptimierung bleibt offen.

Ein neuer Node-Test wendet 1024 Übertragungen an und prüft null Rig-Resets, unveränderte Pose sowie Identität der Palette und Attribute. Rekonstruktion und Katalogexport liefern identische Gewichte; Auftrag 1025 wird ohne Änderung zurückgewiesen. Der bestehende Abbruchtest verwendet jetzt die neue Budgetgrenze. Der Browserfall für den Pinsel lädt und exportiert zusätzlich ein Projekt mit 256 Aufträgen.

Projekte mit mehr als 128 Gewichtsaufträgen benötigen mindestens 0.61.0. Das Projektformat bleibt Version 1; ältere Leser lehnen das größere Budget ab. Laden und Undo/Redo rekonstruieren weiterhin den gespeicherten Verlauf. Die manuelle Performance-Abnahme großer Modelle bleibt offen; keine pauschale Echtzeit-Zusage. Sichtbare Oberflächen begrenzen den kugelförmigen Pinsel weiterhin nicht.

### Erster CI-Lauf

[Workflow 40322516300](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40322516300): 278 Node-Tests und Build bestanden, 19 von 20 Chromium-Fällen bestanden. Der erweiterte Pinseltest erreichte beim Laden des 256-Aufträge-Projekts die bisherige 5-Sekunden-Erwartungsfrist; die Oberfläche meldete noch „Avatar wird geladen“. Der gezielte Ladeabschnitt erhält 30 Sekunden, der kombinierte Test mit mehreren Imports insgesamt 90 Sekunden. Er protokolliert die tatsächliche Ladezeit und prüft weiterhin alle exportierten Gewichtsaufträge. Der folgende Wiederholungslauf ist erfolgreich abgeschlossen.

### Erfolgreicher Wiederholungslauf

Geprüfter Commit: `24a93d98cea917a43c1fe0798eb92541d7d1e6a6`. [Workflow 40362549729](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40362549729): 278 Node-Tests ohne Fehler, Build und alle 20 Chromium-Fälle bestanden (5,1 Minuten). Der Import des Mika-Projekts mit 256 Aufträgen benötigte 19.181 ms einschließlich Dateiübergabe und Warten auf die Bereitschaftsmeldung. Alle erneut exportierten Aufträge stimmten überein. Die Messung ist ein einzelner CI-Wert, kein allgemeiner Leistungsnachweis. Das JSON-Testartefakt `weight-history-replay` enthält die Ladezeit. Laden/Undo bleiben Optimierungsziele; keine neue manuelle Hautqualitätsabnahme.

## Version 0.60.0

**0.60.0:** Die tatsächlichen Hautgewichte des ausgewählten Knochens können farbig angezeigt werden: Blau = 0 %, Grün = 50 %, Rot = 100 %, mit Zwischenfarben. Die Anzeige folgt Auswahl, Gewichtsübertragung, Pinsel und Undo/Redo. Ausschalten, Posenmodus und Verlassen des Studios stellen ursprüngliche Materialien und Vertex-Farben wieder her. Die Ansicht verändert weder Projekt, Revision noch Undo-Verlauf.

277 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40313636231)).

Zwei neue Node-Tests prüfen Farben aus Skinning-Paletten, Gewichtsänderungen, ursprüngliche Materialidentität und Vertex-Farben, Materialarrays und Ressourcenfreigabe. Mit echtem StudioView/Editor werden unveränderte Revision/Daten, Pinsel, Auswahl, Undo/Redo, Moduswechsel und Verlassen/Wiederbetreten geprüft. Ein neuer Chromium-Fall vergleicht die gerenderte Mika-Oberfläche vor/nach Aktivierung und nach Deaktivierung und prüft den unveränderten Projektstatus.

Nur geriggte Oberflächen mit Skinning-Gewichten. Farben werden zwischen Vertices über Dreiecke interpoliert; die Anzeige ist keine Anatomie- oder Qualitätsbewertung. Der bestehende Pinsel bleibt kugelförmig und auf 128 gespeicherte Übertragungen begrenzt. Beschränkung auf sichtbare Vertices, größere Pinselbudgets und manuelle Hautqualitäts-/Performance-Abnahme bleiben offen.

### GitHub-Nachweis

Geprüfter Commit: `ea9bf6cec92127945a2be56f93e86ede227fcb0a`. [Workflow 40313636231](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40313636231) erfolgreich abgeschlossen. 277 Node-Tests ohne Fehler, Build und 20 Chromium-Fälle bestanden. Der neue Browserfall vergleicht die gerenderte Mika-Oberfläche vor/nach Ein- und Ausschalten der Gewichtsfarben und prüft unveränderte Revision und Änderungsstatus. Keine neue manuelle Sichtprüfung oder reale Anbieterabnahme.

## Version 0.59.0

**0.59.0:** Hautgewichte lassen sich mit gedrückter linker Maustaste zwischen zwei ausgewählten Knochen übertragen. Der Pinsel verwendet Radius und Anteil, zeigt den räumlichen Einfluss am aktuellen Treffer und setzt Aufträge mit festem räumlichem Abstand. Ein kompletter Strich ist ein Undo-Schritt; Abbruch und Überschreitung des Übertragungslimits nehmen den ganzen Strich zurück. Währenddessen sind Editor-Eingaben und Agentenänderungen gesperrt.

275 Node-Tests, Build und alle 19 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40280964660)).

Vier neue Node-Tests prüfen gleiche Gewichte bei unterschiedlicher Ereignisdichte, unveränderte Grundpose, Abbruch/Limit-Rollback, leere Regionen und Oberflächenlücken, Pointer-Capture mit Freigabe/Abbruch und Navigation sowie Editor-Integration mit gemeinsamem Undo/Redo und gesperrter Bearbeitung. Der neue Chromium-Fall malt auf Mika, exportiert und prüft Undo/Redo und Wiederladen.

Erste Pinselstufe: kugelförmiger Einfluss, auch durch dünne Oberflächen hindurch; keine Beschränkung auf sichtbare Vertices, keine Gewichtsfärbung. Überlappende Aufträge verstärken den Effekt. Höchstens 128 gespeicherte Übertragungen pro Projekt einschließlich Einzelaufträgen; lange Striche können das Limit erreichen. Große Sprünge und fehlende Oberflächentreffer unterbrechen die Verbindung zwischen Aufträgen. Manuelle Hautqualitäts- und Performance-Abnahme bleibt offen.

### GitHub-Nachweis

Geprüfter Commit: `a90b7a3339ff50389af1821bc71b04bb3f6fea15`. [Workflow 40280964660](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40280964660) erfolgreich abgeschlossen. 275 Node-Tests ohne Fehler, Build und 19 Chromium-Fälle bestanden. Der neue Browserfall malt Hautgewichte an Mika und prüft vollständiges Undo/Redo sowie Projekt-Download und Wiederladen. Keine neue manuelle Sichtprüfung oder reale Anbieterabnahme.

## Version 0.58.0

**0.58.0:** Neue Knochen lassen sich als freie Abzweigung an einem ausgewählten Elternknochen platzieren. Verbindung und Skinning-Palette entstehen automatisch; bestehende Hautgewichte bleiben unverändert. Einfluss lässt sich danach gezielt übertragen. Undo/Redo, gespeicherte Posen, Projekt-/Katalogexport und `add_bone` über Assistent/MCP sind berücksichtigt.

271 Node-Tests, Build und alle 18 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40277434553)); Python-Syntax lokal geprüft.

Drei neue Node-Tests prüfen Gewichterhalt und gezielte Übertragung, neue Kindketten, gemischtes Einfügen/Löschen, Export und Rekonstruktion, transformierte Eltern, ungültige Positionen/Einträge mit Rollback sowie Maus-/Agentenbedienung mit Undo/Redo und Freigabe/Revisionsschutz. Der Node-MCP-Transporttest umfasst auch `add_bone`. Ein neuer Chromium-Fall setzt einen Kindknochen per Maus an Mika und prüft Undo/Redo sowie Speichern/Laden.

Benötigt einen vorhandenen Elternknochen; kein neues Skelett auf einer ungeriggten Oberfläche. Neue Knochen wirken erst nach Gewichtsübertragung auf die Haut. Skalierte Knochenketten sind ausgeschlossen. Kontinuierlicher Gewichtspinsel, Gewichtsfärbung und manuelle Hautabnahme bleiben offen. Projekte mit freien Knochen benötigen mindestens 0.58.0; ältere Leser lehnen diese Einträge ab.

### GitHub-Nachweis

Geprüfter Commit: `5e55d3302de18345d2242ace25ada7cc5a44866c`. [Workflow 40277434553](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40277434553) erfolgreich abgeschlossen. 271 Node-Tests ohne Fehler, Build und 18 Chromium-Fälle bestanden. Der neue Browserfall setzt per Mausklick einen echten Kindknochen an Mika und prüft Elternverbindung, Undo/Redo sowie Projekt-Download und Wiederladen. Keine neue manuelle Sichtprüfung oder reale Python-MCP-Host-Abnahme.

## Version 0.57.0

**0.57.0:** Die räumlich begrenzte Gewichtsübertragung zeigt eine Vorschau im Studio: grüne Außenringe markieren den Radius, orange Innenringe die halbe Stärke. Sie folgt Auswahl, Radius und bearbeitetem Gelenkpunkt und wird im Posenmodus sowie außerhalb des Studios ausgeblendet. Die Vorschau verändert weder Projekt noch Undo-Verlauf. 268 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40253220224)).

Zwei neue Tests prüfen Geometrie, Radius, halbe Stärke, ungültige Bereiche, Freigabe der Grafikressourcen und Integration mit dem echten StudioView/Editor: Auswahl, Radius, Gelenkverschiebung, Undo/Redo, Moduswechsel und Verlassen/Wiederbetreten. Das Einschalten der Vorschau verändert weder Daten, Revision noch Änderungsstatus. Der bestehende Chromium-Fall vergleicht die Canvas-Bilder vor/nach Einschalten und erstellt einen Screenshot der Bereichsvorschau.

Die Ringe zeigen den räumlichen Bereich in der ursprünglichen Grundpose, nicht die tatsächlich gewichteten Vertices. Kontinuierlicher Gewichtspinsel und farbige Darstellung der Hautgewichte bleiben offen. Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.

### GitHub-Nachweis

- Geprüfter Software-Commit: `a7e0751dee95598dac6abb7ed91a5c8a8dfe569e`.
- [Workflow 40253220224](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40253220224), abgeschlossen am 26.10.2026 um 02:22:53 Uhr (Europe/Berlin).
- 268 Node-Tests bestanden, 0 fehlgeschlagen; TypeScript und Produktionsbuild bestanden.
- Alle 17 Chromium-Fälle bestanden (4,2 Minuten), einschließlich Canvas-Vergleich der Bereichsvorschau sowie Gewichtsübertragung mit Undo/Redo und Speichern/Wiederladen.
- Browsernachweise als Workflow-Artefakt hochgeladen. Der automatisierte Bildvergleich ersetzt keine manuelle Sichtprüfung.

## Version 0.56.0

**0.56.0:** Hautgewichtsübertragungen können auf einen kugelförmigen Bereich um das Quellgelenk begrenzt werden. Radius per Mausregler; Stärke nimmt zum Rand weich auf null ab. Außerhalb bleiben Gewichte unverändert. Assistent/MCP unterstützen optional `region: {center, radius}`; Projekt-/Katalogexport erhalten den Bereich. 266 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40219939990)).

Zwei zusätzliche Tests prüfen weichen Randabfall, unveränderte Außenpunkte, Transformation/Skalierung des Ursprungsmodells und der aktuellen Figur, Rekonstruktion/Katalogexport, kopierte Bereichsdaten sowie ungültige und leere Bereiche ohne bleibende Änderung. Der Mika-Test verwendet den im Browser geprüften Radius 0,5. Node-MCP transportiert den Bereich; Python-Syntax geprüft. Der bestehende Chromium-Fall verwendet Checkbox und Radiusregler sowie Undo/Redo und Wiederladen.

Der Bereich bezieht sich auf normalisierte Weltkoordinaten der ursprünglichen Grundpose, unabhängig von der aktuellen Figurpose. Die Oberfläche nutzt den gespeicherten Gelenkpunkt als Mittelpunkt; API-Aufrufe können einen eigenen Mittelpunkt setzen. Noch kein kontinuierlicher Malpinsel oder sichtbare Bereichsvorschau. Höchstens vier normalisierte Einflüsse pro Vertex; manuelle Hautqualität und echte Anbieterabnahme bleiben offen.

Nachweis abgeglichen am 26.10.2026. Geprüfter Commit: `742729107aad78273d85afc94c4339abd24006e2`. GitHub Actions bestätigt 266 Node-Tests (0 Fehler), erfolgreichen Build und alle 17 Chromium-Fälle in 4,1 Minuten. Browserbelege wurden als Artefakt hochgeladen.

## Version 0.55.0

**0.55.0:** Oberflächen-Einfluss eines Knochens lässt sich anteilig auf einen anderen übertragen. Mengenregler, Undo/Redo, Projekt-/Katalogpersistenz, gemischte Knochenänderungen und `transfer_weights` für Assistent/MCP sind vorhanden. Die Grundgeometrie bleibt erhalten; Posen werden mit `skin-weights` zur Prüfung markiert. 264 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40217823978)).

Sechs gezielte Fälle prüfen Gewichtsverschmelzung, Grundgeometrie und veränderte posierte Haut; gemischte Topologie/Katalogexport/Move-Bindung; ungültige Eingaben und Rollback; Begrenzung auf vier normalisierte Einflüsse; UI/Agent mit Freigabe, Revision, Posenmarkierung und Undo; Mika mit echten Paletten und rekonstruierter Projektdatei. Node-MCP transportiert den Befehl; Python-Syntax geprüft. Ein Chromium-Fall prüft den Mausregler, Undo/Redo und Speichern/Laden.

Die Übertragung betrifft alle Vertices mit Quellgewicht, ohne räumlichen Malpinsel. Bei mehr als vier Einflüssen bleiben die vier stärksten, anschließend auf Summe 1 normalisiert; dadurch kann der effektive Anteil vom Reglerwert abweichen. Fehlende Zielpaletten, leere Quellen und ungültige Werte werden ohne bleibende Änderung abgewiesen. Manuelle Haut-/Bewegungsqualität und reale Anbieterabnahme bleiben offen.

Geprüfter Commit: `922a1a9db572f17e9788829ead348b1ecb992c26`. GitHub Actions bestätigt 264 Node-Tests (0 Fehler), erfolgreichen Build und alle 17 Chromium-Fälle in 4,1 Minuten. Der neue Fall prüft 30 % Übertragung von Mikas linkem Knie auf den linken Fuß einschließlich Undo/Redo und Wiederladen.

## Version 0.54.0

**0.54.0:** Knochen mit starren Anbauteilen können umgehängt werden. Auch verschachtelte starre Objektgruppen mit eigener Drehung und Skalierung bleiben am Knochen befestigt; Grundstellung und gespeicherte Einzelposen behalten ihre Welttransformationen. Anbauteile mit eigenen Knochen oder SkinnedMesh bleiben ausgeschlossen. Löschen eines Knochens mit Anbauteilen ist weiterhin gesperrt. 258 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40184399914)).

Geprüft werden Weltmatrizen einer verschachtelten, gedrehten und nicht gleichmäßig skalierten starren Objektgruppe in Grundstellung und gespeicherter Pose sowie nach Wiederladen und Rückkehr zur Quellhierarchie. Das Anbauteil folgt dem neuen Elternzweig. UI-/Agenten-Undo wird mit Anbauteil ausgeführt. Eigene Knochen und SkinnedMesh unter Anbauteilen sowie Löschen mit Anbauteilen werden abgewiesen. Der bestehende Chromium-Fall verwendet Mika mit einem ausschließlich für diesen Test ergänzten starren Mesh; die mitgelieferten Modelle bleiben unverändert.

Keine neue reale Anbieter-/Python-MCP-Host- oder manuelle Haut-/Bewegungsabnahme.

Geprüfter Commit: `6253b786bcc71439ef097b4d42e1d0dca8e1eb10`. Der korrigierte GitHub-Lauf bestätigt 258 Node-Tests (0 Fehler), erfolgreichen Build und alle 16 Chromium-Fälle in 2,4 Minuten.

Der [erste Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40183900791) bestand Node-Tests und Build, scheiterte aber in einem Browserfall: Das Test-Anbauteil verwendete dieselbe Mesh-Definition wie die geriggte Figur und wurde ohne gültiges Skelett geladen. Der korrigierte Test verwendet eine eigene starre Mesh-Definition ohne Gelenk-/Gewichtsattribute. Ein zusätzlicher Importtest prüft die tatsächlichen Objekttypen, das Umhängen und die Rekonstruktion.

## Version 0.53.0

**0.53.0:** Vorhandene Knochen lassen sich im Modus „Gelenke bearbeiten“ einem anderen Elternknochen zuordnen. Grundstellung, gespeicherte Einzelposen und aktuelle Pose werden umgerechnet; Hautgewichte bleiben beim jeweiligen Knochen. Undo/Redo, gemischte Umbaufolgen, Projekt-/Katalogexport und die Aktion `reparent_bone` für Assistent/MCP sind enthalten. `get_studio` liefert `parentBone` und `parentId`. 256 Node-Tests, Build und alle 16 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40138951275)).

Fünf neue Tests prüfen: Grundstellung/gedrehte Posen/Entwurf/aktuelle Pose und Hautpunkte; gemischte Umbaufolge samt Katalogexport und Move-Bindung; ungültige Ziele/Schema/Kreise; UI und freigegebener Agent mit Revision und Undo/Redo; sämtliche Hautpunkte von Mika und Nori nach Umhängen und Wiederladen. Der Node-MCP-Prozesstest transportiert die neue Aktion. Python wurde auf Syntax geprüft. Zwei neue Chromium-Fälle decken UI/Dateiaustausch und Assistent/Zustimmung/Undo ab.

Nur innerhalb desselben Skelettbaums; Wurzeln, Kreise, skalierte Knochenketten und Knochen mit direkten Nicht-Knochen-Anbauteilen werden abgewiesen. Gespeicherte Einzelposen bleiben erhalten, interpolierte Bewegungswege können sich ändern und werden zur Prüfung markiert. Keine automatische anatomische Bewertung oder neue reale Anbieter-/Python-Host-Abnahme.

Geprüfter Commit: `5286effe3a15c644289b845bf1ea8b8a8fd73eb4`. GitHub Actions bestätigt 256 Node-Tests (0 Fehler), erfolgreichen Build und alle 16 Chromium-Fälle in 2,6 Minuten. Browserbelege wurden als Artefakt hochgeladen.

## Version 0.52.0

**0.52.0:** Zwischengelenke lassen sich über einen Mausregler bei 10–90 % der vorhandenen Knochenstrecke einfügen (vom Elternknochen zum ausgewählten Kind; Standard 50 %). Assistent und beide MCP-Server unterstützen dafür optional `ratio`. Vorhandene Posen, Gewichtsverteilung, Projektpersistenz und Undo/Redo bleiben berücksichtigt. 251 Node-Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40134452209)). Keine neue manuelle Hautqualitäts- oder reale Anbieterabnahme.

Geprüft: Positionen 10/30/90 %, unveränderte Grundgeometrie und posierte Endpunkte, identische Gewichte nach Rekonstruktion; UI- und Agentenpfad mit 30 %, Undo/Redo sowie Ablehnung ungültiger Werte. Node-MCP transportiert den Parameter; Python-Syntax kompiliert. Zwei bestehende Browserfälle wurden für 30 % erweitert (UI/Dateiaustausch und Assistent/Zustimmung).

Geprüfter Commit: `1ac8978d32c7cbc4bd98bb4ad148d0da1f85ead0`. GitHub Actions: 251 Tests, 0 Fehler; Build erfolgreich; alle 14 Chromium-Fälle in 2,7 Minuten bestanden. Browserbelege wurden als Artefakt hochgeladen.

## Version 0.51.0

**0.51.0:** Zwei Chromium-Fälle für Assistenten-Vorschlag → ausdrückliche Übernahme → Undo bei `insert_bone` und `delete_bone`. Sie prüfen unveränderte Revision/Geometrie vor Zustimmung und Wiederherstellung der Gelenkdaten nach Undo. Antworten des Anbieters sind simuliert. 249 Tests, Build und alle 14 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40113222944)). Der vorherige Stand 0.50.0 besteht seine [CI-Prüfung](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771).

Der bisherige Node-Testbestand umfasst 249 Tests. Die beiden neuen Fälle verwenden Mika und den echten Assistentendialog mit simuliertem Ollama-Transport. Sie lesen zunächst Gelenke und schlagen danach genau einen revisionsgebundenen Eingriff vor. Prüfung: keine Änderung vor Übernahme, ein Revisionsschritt nach Übernahme, erwartete Gelenkzahl, Wiederherstellung sämtlicher Gelenkdaten nach Undo und keine JavaScript-Seitenfehler.

Keine neue reale Anbieter-, Python-MCP-Host- oder manuelle Hautabnahme.

Geprüfter Commit: `6e18e9edb36e99f7f6c4d8961097ffdd8c5e97bd`. GitHub Actions bestätigt 249 bestandene Node-Tests (0 fehlgeschlagen), erfolgreichen Produktionsbuild und 14 bestandene Chromium-Fälle in 3,4 Minuten. Beide Fälle in `assistant-bones.spec.ts` wurden ausgeführt. Browserbelege wurden im selben Lauf als Artefakt hochgeladen.

## Version 0.50.0

Seit **0.50.0** unterstützen `edit_studio` und der integrierte Assistent zwei weitere Aktionen: `insert_bone` mit der ID des Kindknochens fügt ein echtes Zwischengelenk mittig ein; `delete_bone` entfernt den angegebenen Knochen und überträgt Kinder und Gewichte an seinen Elternknochen. `delete_point` entfernt weiterhin nur den Griff. Zuerst `get_studio` mit `section: points` lesen, dann im Rig-Modus mit aktueller Sitzung/Revision und erteilter Bearbeitungsfreigabe arbeiten. Der integrierte Assistent legt Änderungen weiterhin zur ausdrücklichen Übernahme vor. Jeder Eingriff ist über Undo/Redo rückgängig machbar; vorhandene Posen danach prüfen. Die Schutzregeln für Wurzeln, skalierte Knochen und Anbauteile bleiben bestehen.

249 Tests und Build bestanden; Node-MCP-Transport mit beiden Aktionen geprüft. Python-Modell und Werkzeugbeschreibung erweitert, Syntax geprüft. Keine neue reale Python-MCP-/Anbieterabnahme; neuer CI-Nachweis steht aus.

Der neue Editor-Test prüft fehlende Freigabe, falschen Modus, veraltete Revision, fehlende ID und `$figure` als unzulässiges Ziel sowie Einfügen/Löschen mit zwei Undo-Schritten. Der bestehende Node-MCP-Prozesstest transportiert beide neuen Befehle unverändert. Python wurde nur auf Syntax geprüft. Die zuletzt bestandenen zwölf Chromium-Fälle beziehen sich auf 0.49.0.

### Ergänzende damalige Prüfnotizen

249 Tests und Build bestanden; Node-MCP-Transport mit beiden Aktionen geprüft. Python-Modell und Werkzeugbeschreibung erweitert, Syntax geprüft. Keine neue reale Python-MCP-/Anbieterabnahme; der [CI-Lauf für 0.50.0](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40112365771) ist erfolgreich.

## Version 0.49.0

- 248 Node-Tests und TypeScript-/Produktionsbuild bestanden; bekannte Bundle-Warnung.
- 248 Tests, Build und alle zwölf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)).
- Geprüfter Commit: `f44a4d7230cbf65693608dc50b8d0c3b16545334`; Job `120880655112`; Chromium-Laufzeit 2,5 Minuten.

Zwei neue Tests prüfen wiederholtes Einfügen/Löschen/Einfügen, identische Hautgewichte und Vertex-Indizes nach Katalogexport und Rekonstruktion, unveränderte Grundgeometrie und tatsächliche Oberflächenverformung durch das Ersatzgelenk. Ungültige, rückläufige und außerhalb der Löschliste liegende Reihenfolgemarker werden abgewiesen. Der DOM-Test nimmt Löschen und anschließendes Einfügen unabhängig per Undo/Redo zurück und stellt beide Eingriffe wieder her.

Der bestehende Browserfall entfernt das ursprüngliche Mika-Knie, lädt das Projekt, fügt ein Ersatzgelenk ein und speichert/lädt erneut. Dieser Ablauf ist im erfolgreichen CI-Lauf nachgewiesen. Für den vorausgehenden 0.48.0-Commit meldete GitHub bei der erneuten Abfrage weiterhin keine Workflow-Läufe.

Die Gewichtsverteilung ist weiterhin eine geometrische Näherung. Manuelle Haut-/Bewegungsprüfung, freies Umhängen, eigene Knochenskalierung, Anbauteile und MCP-Topologieaktionen bleiben offen. Original-PaKaChi-Assets bleiben unverändert.

### Ergänzende damalige Prüfnotizen

**0.49.0:** 248 Tests und Build bestanden. Zwei neue Tests prüfen wiederholte Mischfolgen, Rekonstruktion identischer Gewichte, Markerprüfung und einzelne Undo-/Redo-Schritte. 248 Tests, Build und alle zwölf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40096800795)). Der erweiterte Browserfall bestätigt Löschen, anschließendes Einfügen und erneuten Dateiaustausch. [Prüfbericht](PRUEFUNG.md#version-0490).

## Version 0.48.0

- 246 Node-Tests und TypeScript-/Produktionsbuild bestanden; bekannte Bundle-Warnung.
- Zwölf Chromium-Fälle vorbereitet; neuer CI-Nachweis steht aus.

Vier zusätzliche Tests prüfen eingefügte und ursprüngliche Knochen: Entfernung aus Hierarchie und Skinning-Palette, Zusammenführen der Gewichte, Erhalt der Grundform, Kindposen-Umrechnung, Undo/Redo, Projektrekonstruktion, Katalogexport und Verhinderung erneuter automatischer Erkennung gelöschter Knochen. Der Mika-Test erhält Position und Orientierung des Fußes aus einer gebeugten Kniepose. Ein Test mit unvollständiger Palette erzwingt einen Fehler und prüft die vollständige Wiederherstellung. Ungültige Löschindizes, Wurzeln und skalierte Knochen werden abgewiesen.

Der neue Browserfall entfernt das ursprüngliche Mika-Knie bei eingeschalteter Skelettanzeige, prüft die neue Fuß-Hüfte-Verbindung, Undo/Redo, Download, erneutes Laden und automatische Gelenkerkennung. Bis zum tatsächlichen CI-Ergebnis ist er nur vorbereitet.

Manuelle Haut-/Bewegungsqualität bleibt offen. Entfernung einer Gelenkspur kann deren Hautbewegung verändern, auch wenn Kindtransformationen erhalten bleiben. Wurzeln, skalierte Knochen, Anbauteile und Einfügen nach Löschungen werden noch nicht unterstützt. Kein neuer MCP-Befehl und kein GLB-Export. Original-PaKaChi-Assets bleiben unverändert.

### Ergänzende damalige Prüfnotizen

**0.48.0:** 246 Tests und Build bestanden. Vier zusätzliche Tests prüfen echte Knochenentfernung, Gewichtsübernahme, Posenumrechnung, Undo/Redo, Rekonstruktion und Fehler-Rollback. Ein weiterer Browserfall für das ursprüngliche Mika-Knie ist vorbereitet; neuer CI-Nachweis steht aus. [Prüfbericht](PRUEFUNG.md#version-0480).

## Version 0.47.0

- 242 Node-Tests bestanden, keine Fehler oder übersprungenen Tests.
- TypeScript und Produktionsbuild bestanden; bekannte Bundle-Warnung.
- 242 Tests, Build und alle elf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)).
- Geprüfter Commit: `cb7d567f266029dc54cec4f704daaebb61f41354`; Chromium-Laufzeit 2,6 Minuten.

### Neue Nachweise

Fünf Tests prüfen echte Eltern-/Kindhierarchie, Skinning-Palette und normalisierte Gewichte, unveränderte Grundgeometrie, tatsächliche Oberflächenbewegung und erhaltene Segmentlängen beim Beugen eines ergänzten Knies. Weitere Prüfschritte decken bestehende Posen, ungültige Eingaben, Move-Kompatibilität, einen vollständigen Undo-/Redo-Schritt, wiederholte Unterteilungen und Katalogexport ab. Mika und Nori behalten beim Einfügen ihre Grundgeometrie, folgen anschließend dem neuen Knochen und lassen sich aus dem gespeicherten Projekt rekonstruieren. Die ursprünglichen Gewichte und das Quellskelett werden wiederhergestellt.

Ein Browserfall für Mika prüft den sichtbaren Einfügeknopf, Undo/Redo, echten Download und erneutes Laden des Projekts. Er ist im erfolgreichen CI-Lauf nachgewiesen.

Die Gewichte werden geometrisch angenähert. Anatomische Qualität, manuelle Maus-/Darstellungskontrolle, beliebiges Löschen/Umhängen von Quellknochen und vollständiges Auto-Rigging bleiben offen. Die Original-PaKaChi-Bilddateien wurden nicht verändert.

### Erster Browserlauf

[Lauf 39956455038](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39956455038): 242 Tests und Build bestanden; zehn bisherige Browserfälle bestanden. Der neue Fall bestätigte Einfügen, Undo/Redo und Download, scheiterte dann an der alten Knochenzahl-Vorprüfung im Projektladeweg. Diese berücksichtigt nun die gespeicherten Unterteilungen. Der [Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749) besteht alle elf Browserfälle einschließlich des Projektladens.

### Ergänzende damalige Prüfnotizen

**0.47.0:** 242 Tests und Build bestanden. Fünf neue Tests prüfen echte Knochen, Hautgewichte, Grundformerhalt, Beugung, Posen, Undo/Redo, Projekt-/Katalogpersistenz, mehrere Unterteilungen sowie Mika und Nori. 242 Tests, Build und alle elf Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39957177749)). Der neue Fall bestätigt Einfügen, Undo/Redo und Projekt-Download/-Import. [Prüfbericht](PRUEFUNG.md#version-0470).

## Version 0.46.0

- Produktionsbuild und TypeScript-Prüfung bestanden; bekannte Bundle-Warnung.
- Playwright listet zehn Browserfälle in fünf Dateien auf.
- 237 Tests, Build und alle zehn Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594)).
- Geprüfter Commit: `ecd8275e97fe5130c2e8a36eb8cfccf9bebb158d`; Chromium-Laufzeit 1,6 Minuten.

### Neuer Browserfall

Ein importiertes Test-GLB erhält zwei Posen und einen Move mit wiederholter Startpose. Der Test lädt die Move-Datei herunter und importiert sie über den Dateiauswahldialog. Er prüft die konfliktfreie neue Move-ID, neue Posen-IDs, wiederholte Verweise und unveränderte Originaldaten. Die neue Bewegung läuft in der Studio-Vorschau und wird über den sichtbaren Stoppknopf angehalten. Ein Screenshot wird als Browserbeleg gespeichert.

Ein Undo entfernt den gesamten Import und stellt die vorherige Figurpose wieder her. Der anschließende Import mit unpassender Modellbindung wird abgewiesen; Projektzustand und Redo bleiben erhalten. Redo stellt den gültigen Import wieder her.

Der korrigierte CI-Lauf bestätigt den gesamten Fall. Manuelle Darstellungskontrolle, Mausgefühl, echte Speicherquoten und Anbieterinferenz bleiben offen. Die Original-Assets werden nicht verändert.

### Erster CI-Lauf

[Erster Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39912344319): 237 Node-Tests und Build bestanden; neun Browserfälle bestanden, der neue Fall scheiterte beim Anklicken des im Studio ausgeblendeten Player-Pauseknopfs. Download, Import und laufende Figurenbewegung waren bereits erfolgreich geprüft. Der Test verwendet nun ausschließlich die sichtbaren Studio-Steuerungen; der [Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594) besteht alle zehn Browserfälle.

### Ergänzende damalige Prüfnotizen

**0.46.0:** 237 Tests, Build und alle zehn Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39913313594)). Der zusätzliche Fall bestätigt Move-Download, Dateiauswahl, konfliktfreien Import, Wiedergabe, Undo/Redo und Ablehnung einer unpassenden Modellbindung. [Prüfbericht](PRUEFUNG.md#version-0460).

## Version 0.45.0

- `npm test`: 237 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung.
- Alle neun Chromium-Browserfälle bestanden auf dem GitHub-Runner (1,5 Minuten; [CI-Lauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987)).
- Geprüfter Commit: `b4fe7204aa35d7d0af7c8b29dfcbe5e17727cdc8`; Job `120247737733` erfolgreich abgeschlossen.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Neue Prüfungen

Zwei DOM-Tests prüfen Nachrichten erst nach erfolgreichem Speichern, ausschließlich Metadatenaktualisierung, Auswahlbeibehaltung, gesammelte Aktualisierung während eines laufenden Schreibvorgangs, Abbau und Fokusaktualisierung. Fehlgeschlagene Schreibvorgänge senden keine Änderungsmeldung und laden kein Modell.

Ein Browserfall speichert ein importiertes GLB mit zwei Posen, einem Move und Bearbeitungspose, lädt die Seite neu und öffnet die Kopie über ihre stabile gespeicherte ID. Ein weiterer öffnet zwei Tabs, prüft automatische Aktualisierung nach Speichern, abgebrochenes und bestätigtes Löschen sowie den Erhalt des bereits geladenen Avatars im zweiten Tab.

Der tatsächliche CI-Lauf bestätigt beide neuen Browserfälle und alle sieben bisherigen Fälle. Er verwendet Chromium mit Software-WebGL und lokale Testdaten; keine echte Anbieterinferenz. Reale Speicherquoten, sehr große Projekte und manuelle Maus-/Darstellungsabnahme bleiben offen.

### Ergänzende damalige Prüfnotizen

**0.45.0:** 237 Tests, Build und alle neun Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39902736987)). Die beiden neuen Fälle bestätigen echte IndexedDB-Persistenz nach F5 und Listenänderungen zwischen zwei Tabs. [Prüfbericht](PRUEFUNG.md#version-0450).

## Version 0.44.0

- `npm test`: 235 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Tatsächlicher Browserbefund

[CI-Lauf 39776867884](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39776867884), Commit `eba828cf62fd2f4596d9e782148d865e43985ed6`: Chromium lief auf dem GitHub-Runner. Original-Transformation und der vollständige Sequenzvorschau-Test bestanden. Fünf Fälle scheiterten: Generierungsablauf wartete auf den nie gesetzten Originalnamen; Modellwechsel-Undo zeigte weiterhin Mika als Überschrift; drei Playerfälle warteten vergeblich auf die Rückkehr aus einmaligen Bewegungen.

### Korrekturen und Nachweise

- Originalwechsel setzt die sichtbaren Metadaten, leert die 3D-Move-Liste und synchronisiert die Wiedergabeanzeige. Das erklärt die beiden beobachteten Beschriftungsfehler; die weiteren Generierungsschritte benötigen den Folgelauf.
- Viewer reicht tatsächliche Vordergrundzeit statt höchstens 50 ms pro Renderbild weiter. Bisher verursachte niedrige Software-Renderbildrate eine künstliche Zeitlupe. Sichtbarkeitswechsel setzen die Uhr zurück; Hintergrundzeit wird nicht nachgeholt.
- Neuer Geometrielauf prüft echte Three.js-Clip-Wiedergabe und Rückkehr zur Grundbewegung bei 16, 250 und 500 ms Renderabstand.
- Zweiter Test prüft Hintergrund-Zeitreset sowie ungültige/rückläufige Zeitstempel.

Die Ursachen wurden anhand CI-Protokoll und Code identifiziert. Der [vollständige Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209) für Commit `5474cb169515da8a2bb70d66176396f64770c09f` ist erfolgreich: **235 Tests, Build und alle sieben Chromium-E2E-Fälle bestanden**. Der Browserteil dauerte 1,8 Minuten; das Artefakt `browser-evidence` wurde erfolgreich hochgeladen. Lokale Chromium-Ausführung bleibt durch Socket-Berechtigungen blockiert. Keine echte Cloud-Inferenz oder vollständige manuelle Mausabnahme.

### Ergänzende damalige Prüfnotizen

[GitHub-Lauf 39776867884](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39776867884) für 0.43.0: Node-Tests und Build erfolgreich; Browserstart erfolgreich, **2 von 7 E2E-Fällen bestanden**. Original-Transformation und KI-Sequenzvorschau sind damit erstmals im automatisierten Browser nachgewiesen. Fünf Fälle sind fehlgeschlagen; der Gesamtlauf ist rot.

0.44.0 korrigiert die fehlenden Original-Metadaten und die bei niedriger Bildrate künstlich verlangsamte Animationszeit. 235 Node-Tests und Build bestehen. Der [Folgelauf](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/39826526209) für Commit `5474cb169515da8a2bb70d66176396f64770c09f` besteht **alle sieben Browserfälle** (1,8 Minuten). Das bestätigt die automatisierten Abläufe, ersetzt aber keine vollständige manuelle Maus-/UI-Abnahme. [Prüfbericht](PRUEFUNG.md#version-0440).

## Version 0.43.0

- `npm test`: 233 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 369 kB gzip).
- `npx playwright test --list`: sieben Browserfälle in drei Dateien erkannt.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Browser-Versuch und Grenze

Der erste Lauf scheiterte am fehlenden Chromium. Nach Installation über einen alternativen offiziellen Downloadserver wurde der Browserprozess gestartet, brach jedoch vor Seitenaufruf mit `socket() failed: Operation not permitted` ab. Alle sechs damals vorhandenen Fälle blieben dadurch ohne Anwendungsnachweis. Der anschließend ergänzte siebte Fall ist typgeprüft und aufgelistet, aber lokal nicht erfolgreich ausgeführt.

### Vorbereiteter Ablauf

Das neue E2E-Szenario richtet Mika und zwei unterschiedliche Posen über die echte Studio-Schnittstelle ein. Ein simulierter Ollama-Dienst liefert einen Sequenzvorschlag. Der Test bedient Vorher/Nachher und Stopp, prüft Wiederherstellung ohne Datenänderung, übernimmt den Vorschlag und macht ihn per Undo rückgängig. Ein Screenshot dokumentiert die Vorschau, sobald der Fall auf einem geeigneten Runner läuft.

Der neue GitHub-Actions-Workflow installiert Node 24 und Chromium, führt Tests/Build/E2E aus und sammelt HTML-Bericht, Fehler-Screenshots und Traces für 14 Tage. Keine echten Anbieterkonten, keine Secrets und kein Deployment. Die Workflow-Veröffentlichung ist noch kein erfolgreicher CI-Lauf; dessen Ergebnis muss gesondert geprüft werden.

Quellen für den Aufbau: [Playwright CI](https://playwright.dev/docs/ci), offizielle Release-Metadaten von [checkout](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node](https://github.com/actions/setup-node/releases/tag/v7.1.0) und [upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.2), geprüft am 22.10.2026.

### Ergänzende damalige Prüfnotizen

`npm run test:e2e` umfasst sieben Fälle in drei Dateien. `npx playwright test --list` erkennt alle sieben; TypeScript/Build bestehen. Sechs vorhandene Fälle wurden lokal gestartet, scheiterten aber vor dem Seitenaufruf beim Chromium-Prozessstart: `socket() failed: Operation not permitted`. Der Browser wurde zuvor erfolgreich vom zweiten Downloadserver installiert. Das ist ein Umgebungsfehler, kein bestandener Anwendungstest.

Der neue Workflow [verify.yml](../.github/workflows/verify.yml) installiert Chromium samt Betriebssystemabhängigkeiten auf einem GitHub-Runner und stellt `browser-evidence` bereit. HTML-Bericht öffnen und bei Fehlern die Traces mit `npx playwright show-trace <datei.zip>` ansehen. Ein erfolgreicher Lauf muss zusätzlich auf sichtbare Fehler und brauchbares Mausgefühl geprüft werden. Echte Cloud-Inferenz wird von den simulierten Anbieterfällen nicht abgenommen. [Prüfbericht](PRUEFUNG.md#version-0430).

## Version 0.42.0

- `npm test`: 233 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 369 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Fünf neue Tests

1. Temporäre Folge wird kopiert und tatsächlich über Three.js/StudioRig gesampelt: abweichende Dauer, Zwischenposition, Seek und Pause; Bearbeitung während Wiedergabe gesperrt. Stopp stellt Figur, Daten, Revision und Undo-Status wieder her.
2. Automatisches Ende einer einmaligen Vorschau und ausdrücklicher Schleifenstopp stellen die Bearbeitungspose wieder her. Veraltete Aufräumfunktionen stoppen weder eine neuere Vorschau noch normale Wiedergabe.
3. Fehlende Moves/Posen, ungültige Folgen, fremde Sitzung, veraltete Revision, Ziehgesten und Rig-Modus werden vor dem Start abgewiesen.
4. Verlassen und Entsorgen des Editors beenden die Vorschau; beim Wiedereintritt bleibt die vorherige Bearbeitungspose erhalten.
5. Assistentenpanel startet Vorher/Nachher nur per Klick, beendet die vorherige Vorschau vor Wechsel/Übernahme und räumt bei Profilwechsel auf.

Tests nutzen reale Three.js-Transformationen und happy-dom. Keine gerenderte WebGL-/Mausabnahme und kein echter Anbieter-/MCP-Host-Lauf. Vorschau erfolgt lokal, je Move einzeln; keine geteilte 3D-Ansicht, keine automatische Korrektur und keine Änderung des MCP-Protokolls.

### Ergänzende damalige Prüfnotizen

**0.42.0:** 233 Tests und Build bestanden. Fünf neue Tests prüfen temporäre Sequenzanimation, Positions-/Dauersampling, Pause/Seek, Wiederherstellung, Lebenszyklus, Konflikte und Panelsteuerung. [Prüfbericht](PRUEFUNG.md#version-0420).

## Version 0.41.0

- `npm test`: 228 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 369 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Fünf neue Tests

1. Einzel- und Paketvorschläge lesen paginierte Move-/Posennamen, erhalten wiederholte Schritte und verändern weder Eingaben noch Studio-Daten. Andere Vorschlagsarten lösen keine Vergleichsabfragen aus.
2. Abweichende Revision auf jeder möglichen Seite oder bei abschließender Statusprüfung sowie geschlossenes Studio sperren den Vergleich.
3. Fehlende Moves/Posen und inkonsistente Seitenzähler/Folgeoffsets werden abgewiesen.
4. Tabellen zeigen Einfügen/Entfernen, DE/EN-Beschriftung und Projekttexte wörtlich; HTML-/Script-Texte werden nicht als Elemente eingefügt.
5. Das echte Assistentenpanel zeigt den lokalen Vergleich vor Übernahme, führt nur einmal aus und bietet veraltete Sequenzvorschläge nicht zur Übernahme an.

DOM-Prüfung mit happy-dom und simulierten Anbieterantworten; keine gerenderte Browser- oder echte Anbieterabnahme. Vorher/Nachher bezieht sich auf Reihenfolge und Namen, nicht auf eine animierte 3D-Vorschau. MCP-Protokoll und Projektformat bleiben unverändert.

### Ergänzende damalige Prüfnotizen

**0.41.0:** 228 Tests und Build bestanden. Fünf neue Tests prüfen lokal paginierte Vergleiche, Revisionskonflikte, ungültige Daten, Textdarstellung/DE–EN und einmalige Übernahme im Assistentenpanel. [Prüfbericht](PRUEFUNG.md#version-0410).

## Version 0.40.0

- `npm test`: 223 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 368 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Neue Nachweise

1. Mehrere Moves ändern sich mit einer Revision und einem Undo-/Redo-Schritt. Eingaben werden kopiert; unbeteiligte Moves, Posenwerte und Figur bleiben erhalten. Unveränderte Pakete erzeugen keine neue Revision.
2. Ein ungültiger späterer Eintrag verändert weder erste Einträge noch Daten, Dirty-Status, Revision und bestehenden Redo-Verlauf.
3. Höchstens acht verschiedene Moves und 200 Posenverweise insgesamt; strikte verschachtelte Felder, vorhandene Ziele, Freigabe, Sitzung/Revision und Bearbeitungszustand geprüft. Die exakte Obergrenze wird akzeptiert.
4. Assistent gibt ein Paket nur als Bestätigungsvorschlag zurück und führt keine Bearbeitung aus (simulierter Anbieter).
5. Bestehender echter Node-MCP-stdio-Test transportiert `update_moves` samt Einträgen unverändert.
6. Python-Pydantic-Datenklassen isoliert geladen und Paket-Roundtrip geprüft; kein gestarteter Python-MCP-/MQTT-Dienst.

Keine gerenderte Browser-, externe Anbieter- oder MCP-Host-Abnahme. Transaktionen sind auf Posenfolgen bestehender Moves begrenzt; keine allgemeine Mehraktionsvorschau, keine Skeletttransaktion und keine automatische Bewegungskorrektur.

### Ergänzende damalige Prüfnotizen

**0.40.0:** 223 Tests und Build bestanden. Vier neue Tests für Sequenzpakete und Assistentenvorschläge; Node-MCP-Transporttest erweitert, Python-DTO isoliert geprüft. [Prüfbericht](PRUEFUNG.md#version-0400).

## Version 0.39.0

- `npm test`: 219 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Warnung zum großen gemeinsamen Bundle (rund 1,33 MB / 367 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Fünf neue Tests

1. Native Cursor-Folgeseiten bleiben am konfigurierten Endpoint einschließlich Proxy-Präfix; Sonderzeichen werden korrekt als Querywert kodiert. Schlüssel nur im Header; Ergebnisse sortiert und dedupliziert.
2. Fehlende/falsche/wiederholte Cursor, leere Seiten mit Fortsetzungsflag und ungültiges `has_more` verwerfen die ganze Abfrage.
3. Maximal zehn Seiten beziehungsweise 5000 empfangene Einträge; keine endlosen Folgen trotz neuer Cursor.
4. Fehler auf späteren Seiten bleiben klassifiziert (401/429/500); keine Teilliste als Erfolg.
5. Ein Abbruch beziehungsweise Timeout gilt auch auf Folgeseiten. Späte Antworten starten keine weiteren Anfragen.

Protokolltests mit simuliertem Fetch; keine echte Anthropic-Anmeldung, Browser-CORS- oder Modellqualitätsabnahme. Andere Anbieter bleiben bei ihrem bisherigen Modelllistenprotokoll. Keine Änderung an Profilen, Rollen oder gespeicherten Zugangsdaten.

### Ergänzende damalige Prüfnotizen

**0.39.0:** 219 Tests und Build bestanden. Fünf neue Tests prüfen paginierte Anthropic-Modellermittlung einschließlich Cursorfehlern, Grenzen, späteren HTTP-Fehlern und Abbruch/Timeout. Kein echter Kontoaufruf. [Prüfbericht](PRUEFUNG.md#version-0390).

## Version 0.38.0

- `npm test`: 214 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Warnung zum großen gemeinsamen Bundle.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Neue Nachweise

1. Sequenzlesen liefert isolierte Kopien; Agentenänderung unterstützt wiederholte Posen, erhält übrige Move-Felder/Posendaten/Figur und bildet einen Undo-/Redo-Schritt. Identische Folge bleibt ohne neue Revision.
2. Ungültige/mangelnde Felder, fehlende Ziele/Posen, fehlende Freigabe, veraltete Sitzung/Revision, Ziehgesten, Wiedergabe und Rig-Modus werden ohne Mutation abgewiesen.
3. 100 Moves mit je 100 langen Unicode-Posenverweisen lassen sich vollständig und unter dem Transportlimit paginieren.
4. Assistent liest die Sequenz und gibt `update_move` nur als Bestätigungsvorschlag zurück; kein automatischer Edit-Aufruf (simulierter Anbieter).
5. Bestehender echter Node-MCP-stdio-Test erweitert: `update_move` wird einschließlich wiederholter Posen unverändert transportiert.
6. Python-Pydantic-DTO isoliert aus dem Quelltext geladen und gültigen `update_move`-Roundtrip geprüft; kein gestarteter Python-MCP-/MQTT-Dienst.

Three.js/happy-dom und Node-Transport ersetzen keine gerenderte Browserabnahme oder Prüfung mit einem externen KI-Anbieter/MCP-Host. Keine automatische Bewegungskorrektur und keine unabhängigen Zeiten je Vorkommen.

### Ergänzende damalige Prüfnotizen

**0.38.0:** 214 Tests und Build bestanden; vier neue Tests sowie erweiterter Node-MCP-Transporttest für Sequenzänderungen. Python-DTO isoliert geprüft, kein neuer Python-MCP-Livelauf. [Prüfbericht](PRUEFUNG.md#version-0380).

## Version 0.37.0

- `npm test`: 210 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,33 MB / 367 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Vier neue Tests

1. Änderung betrifft ausschließlich die ausgewählte Move-Folge. Posen und aktuelle Figur bleiben erhalten; Dauer/Export folgen der neuen Reihenfolge, Undo/Redo stellt sie wieder her. Eingabearray wird kopiert.
2. Fehlende Posen/Moves, Anzahlgrenzen, veraltete Revision, Wiedergabe und Rig-Modus werden ohne Datenänderung abgewiesen. Identische Folge erzeugt keine neue Revision.
3. DOM-Steuerung verschiebt/entfernt einzelne wiederholte Vorkommen, fügt Posen ein und ersetzt sie. Projektposen bleiben unverändert; mindestens zwei Schritte bleiben erforderlich.
4. Übernommene Prüfpose kann per Bedienung einen bestehenden Schritt ersetzen. Änderung während einer laufenden Beugegrenzenprüfung verwirft deren Ergebnis.

Three.js und happy-dom, keine gerenderte Browserabnahme. Kein neuer MCP-/Python-Livelauf. Keine Agentenbearbeitung bestehender Folgen, keine unabhängigen Zeiten pro Vorkommen und keine automatische Bewegungskorrektur.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.37.0](PRUEFUNG.md#version-0370): vier neue Tests zu isolierter Sequenzänderung, Export/Undo, Grenzen, Mausbedienung und übernommenen Prüfposen. 210 Tests und Build bestanden; gerenderte Abnahme und Agenten-Sequenzbearbeitung offen.

## Version 0.36.0

- `npm test`: 206 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,32 MB / 366 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

### Vier neue Tests

1. Exaktes Prüfbild öffnet pausiert und bleibt trotz Zeitupdate stehen. Stopp stellt Bearbeitungspose und unverändertes Projekt wieder her; Revision und Dirty-Status bleiben erhalten.
2. Übernahme erzeugt eine unabhängige neue Pose. Bestehender Move bleibt unverändert; Undo/Redo stellt Daten und jeweilige angezeigte Pose wieder her.
3. Unbekannte Moves, ungültige Zeitpunkte, veraltete Revision und geschlossenes Studio werden abgewiesen. Der exakte Endpunkt ist erreichbar; bei 100 Posen wird die Übernahme verhindert.
4. DOM-Ablauf vom Prüfen über „Auffälliges Bild ansehen“ bis zur ausdrücklichen Posenübernahme. Die Übernahme-Schaltfläche ist in der pausierten Prüfvorschau bedienbar.

Tests verwenden Three.js und happy-dom, keinen gerenderten Browser. Keine automatische Korrektur, keine automatische Einfügung in bestehende Moves und kein kontinuierlicher Grenznachweis. Kein neuer MCP-/Python-Livelauf.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.36.0](PRUEFUNG.md#version-0360): vier neue Tests für exakte pausierte Inspektion, Wiederherstellung, Posenübernahme/Undo und den tatsächlichen DOM-Ablauf vom Bericht. 206 Tests und Build bestanden; gerenderte Abnahme offen.

## Version 0.35.0

- `npm test`: 202 Tests bestanden; keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,32 MB / 365 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich der 72 Transformationsbilder besteht.

### Fünf neue Tests

1. Zwei gültige Schlüsselposen mit ungültiger Zwischenbeugung: Interpolation meldet Verletzungen; Daten, Live-Pose und Weltmatrizen bleiben unverändert.
2. Ungleiche Dauern, wiederholte Posen, Übergangsgrenzen und Schleifenrückweg; maximal 1601 Stichproben.
3. Abbruch und ungültiger Studio-Stand verwerfen Ergebnisse; getrennte Ketten werden nicht als bestandene Gelenke ausgegeben.
4. Editorprüfung verändert weder Revision, Dirty-Status noch Projekt. Abbruch, Bearbeitung und Verlassen verhindern Veröffentlichung; Bedienelemente werden wieder freigegeben.
5. DOM zeigt Stichprobenhinweis, Verletzung und Namen als Text; Bearbeitung entfernt alte Ergebnisse.

Die bestehenden realen Mika-/Nori-Geometrie- und Posenmessungstests laufen mit. Neue Bewegungsprüfungen verwenden synthetische Three.js-Ketten und happy-dom, keine gerenderte Browserabnahme. Keine kontinuierliche Garantie, Kollisionsprüfung, Originalclip-Prüfung oder automatische Korrektur. Kein neuer Python-/MCP-Livelauf.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.35.0](PRUEFUNG.md#version-0350): fünf neue Tests zu Zwischenverletzungen, Zeitplan/Schleifen, Abbruch, veralteten Ergebnissen und UI-Bericht. 202 Tests und Build bestanden; kontinuierliche Garantie und gerenderte Abnahme offen.

## Version 0.34.0

- `npm test`: 197 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,32 MB / 364 kB gzip.
- Originaldateien-Erhaltungsprüfung einschließlich der 72 Transformationsbilder besteht.

### Fünf neue Tests

1. Gespeicherte direkte Gelenkdrehung außerhalb der Grenze wird gemessen; aktuelle Gelenktransformationen, Weltmatrizen, Daten und gespeicherte Pose bleiben unverändert.
2. Randwerte gelten innerhalb der Toleranz als gültig; degenerierte Segmente und getrennte Ketten werden als nicht auswertbar gemeldet. Fehlende Grenzen ergeben keinen erfundenen Erfolgsnachweis.
3. Messung stimmt bei rotierten/skalierten Quellknochen mit IK überein und bleibt von der aktuellen Figurpose unabhängig.
4. DOM-Bericht zeigt Namen als Text, ändert weder Revision noch Dirty-Status oder Projekt; neue Auswahl/Bearbeitung entfernt alte Ergebnisse, geschlossenes Studio weist Aufrufe ab.
5. Am tatsächlichen Mika-Modell stimmen gespeicherte Winkel mit geometrisch gemessenen Gelenkpositionen überein; die inzwischen zurückgesetzte aktuelle Pose bleibt erhalten.

Keine gerenderte Browserprüfung. Die Tests verwenden Three.js-Geometrie und happy-dom. Keine Messung aller Bewegungszwischenbilder, Kollisionen, Originalclips oder Twistgrenzen. Prüfberichte bleiben flüchtig; kein automatisches Korrigieren oder Löschen bestehender Prüfmarkierungen. Kein neuer MCP-Transport oder Python-Livelauf.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.34.0](PRUEFUNG.md#version-0340): fünf neue Tests für lesende Posenprüfung, Grenzfälle, Skalen-/Rotationsraum, UI-Bericht und tatsächliches Mika-Modell. 197 Tests und Build bestanden; Zwischenbilder, Kollisionen und gerenderte Abnahme offen.

## Version 0.33.0

- `npm test`: 192 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,31 MB / 363 kB gzip.
- Erhaltungsprüfung: 83 Originaldateien einschließlich 72 Transformationsbildern unverändert.

### Neue und erweiterte Nachweise

Sieben neue Tests:

1. Nahe/ferne Ziele halten die Beugegrenzen einer Zweiglied-Kette ein. Anker und lokale Knochenverschiebungen bleiben erhalten; auch gleiche Minimum-/Maximumwerte werden geprüft.
2. Figurrotation und uniforme Skalierung; Entfernen einer Grenze stellt die bisherige Erreichbarkeit wieder her.
3. Projekt-/Befehlsvalidierung weist fehlerhafte Grenzen ab; Move-Kompatibilität erkennt geänderte Grenzen.
4. Setzen/Entfernen markiert gespeicherte Posen, ohne deren Transformationen zu ändern.
5. Editor mit happy-dom: Checkbox-/Reglerereignisse, Undo/Redo, freigegebene Agentenänderung; Pose-Modus weist Grenzänderungen ab.
6. Tatsächliche Mika-/Nori-Modelle: Ellenbogen und Knie halten Grenzwerte ein; berechnete skinned Vertexpositionen bewegen sich mit.
7. Katalogprojekt-Export erhält Grenzen und den neuen Prüfgrund.

Der vorhandene echte Node-MCP-Prozesstest prüft zusätzlich Transport von Grenzwerten und explizitem null. Python-Klassen wurden aus dem Quelltext mit Pydantic auf Schema/Serialisierung und Erkennung expliziten null geprüft; kein neuer Python-MCP-/MQTT-Livelauf. Die endgültige Bereichs-/Modusprüfung liegt im Studio-Router.

### Grenzen

Keine gerenderte Browser-/Mausabnahme. Die numerische Toleranz für den vollständig gestreckten Grenzfall beträgt im Test 0,00001 Grad. Geometrietests ersetzen keine anatomische Bewertung. Grenzen gelten nur für IK-Ziehen, nicht für direkte Drehung, Originalclips oder gespeicherte Moves. Keine automatischen Beugerichtungen, Twistgrenzen, Kollisionen oder Ganzkörper-IK. Ältere Software kann neue Prüfgründe ablehnen beziehungsweise Grenzen ignorieren.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.33.0](PRUEFUNG.md#version-0330): sieben neue Tests für Beugegrenzen, echte Mika-/Nori-Geometrie, Editor-Undo, Datenprüfung und Export; Node-MCP-Test um Setzen/Entfernen erweitert. 192 Tests und Build bestanden. Python-Datenmodell separat geprüft; kein neuer Python-MCP-Livelauf oder gerenderter Browser.

## Version 0.32.0

- `npm test`: 185 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Vite bestanden; bekannte Bundle-Warnung (rund 1,31 MB / 362 kB gzip).
- Die vollständige Erhaltungsprüfung für 83 Originaldateien einschließlich 72 Transformationsbildern besteht.

### Sieben neue Tests

1. Zwei Sammlungen für verschiedene Modellbindungen zusammenführen: bytegleiche Dateien, korrekte Prüfsummen, Quellen unverändert. Kompatibler Import gelingt; unpassendes Zielmodell wird weiterhin abgewiesen.
2. Doppelte IDs und Pfade scheitern vor Ausgabeerstellung.
3. Fehlerhafte JSON-Dateien, Posen, Posenreferenzen, falsche Move-ID und fehlende Dateien scheitern ohne Ausgabe.
4. Entweichende Symlinks, Ausgabe innerhalb einer Quelle und übergroße Move-Dateien werden abgewiesen.
5. Tatsächlicher CLI-Unterprozess erzeugt Sammlung; wiederholter Aufruf überschreibt die Ausgabe nicht.
6. Leere Sammlung lässt sich ergänzen; echte Dateien an der Einzelgrößengrenze überschreiten zusammen das 64-MiB-Limit und werden vor dem Schreiben abgewiesen.
7. Eigenständige Strukturprüfung erkennt unterschiedliche Spurensätze, unbenutzte Posen und ungültige Quaternionen; wiederholte Posen bleiben erhalten.

Die bestehenden Tests für Studio-Import, Kompatibilitätsgrenzen, Undo/Redo und veraltete Downloads bestehen weiterhin. Keine gerenderte Browser-/Hosting-Abnahme und kein Nachweis anatomischer Qualität. Strukturvalidierung und Prüfsummen sind kein Herkunftsnachweis; Kompatibilität wird am tatsächlichen Zielprojekt geprüft.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.32.0](PRUEFUNG.md#version-0320): sieben neue Tests mit tatsächlichen Dateien/CLI, Strukturprüfung, Konflikten, Größenlimit und erhaltenen Modellbindungen. 185 Tests und Build bestanden; gerenderte Abnahme offen.

## Version 0.31.0

- `npm test`: 178 Tests bestanden; keine Fehler, übersprungenen oder ausstehenden Tests.
- `npm run build`: TypeScript und Vite bestanden. Bekannte Warnung zum gemeinsamen Bundle (rund 1,30 MB / 361 kB gzip).
- Erhaltungsprüfung: 83 Originaldateien einschließlich 72 Transformationsbildern unverändert.

### Sieben neue Tests

1. Katalogschema: eindeutige IDs/Pfade, Ablehnung externer URLs und Pfadmanipulationen.
2. Anwendungsbasis, Abrufe ohne Zugangsdaten/Redirects und Prüfung der Move-ID gegen den Katalog.
3. Stream-/Headergrößen, HTTP-Fehler, ungültiges UTF-8 und Abbruch vor Annahme eines Katalogs.
4. Echter CLI-Unterprozess mit temporären Dateien: Export, Laden über den Katalog und validierter Move-Import; Quelle unverändert, vorhandene Ausgabe nicht überschrieben.
5. Fehlerhafte oder leere Projekte erzeugen keinen Ausgabeordner.
6. Studio mit happy-dom und Three.js: Katalogbeschriftung als Text, Import und ein Undo-Schritt ohne automatische Wiedergabe.
7. Verzögerte Downloads nach Bearbeitung, Verlassen oder Entsorgen des Studios werden nicht übernommen.

Der vollständige Testlauf schließt die bisherigen Kompatibilitäts-, Projektgrenzen-, SHA-256- und Undo/Redo-Prüfungen ein. Transporttests verwenden kontrollierte Responses/Streams. Kein gerenderter Browser- oder Hosting-Test; kein Nachweis von Bewegungsqualität oder Retargeting. Die ausgelieferte Sammlung ist bewusst leer.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.31.0](PRUEFUNG.md#version-0310): sieben neue Tests für Move-Katalog, begrenztes Laden, echten CLI-Export, Editor-Undo und veraltete Downloads. 178 Tests und Build bestanden; gerenderte Bedienabnahme offen.

## Version 0.30.0

- `npm test`: 171 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Vite erfolgreich; bekannte Warnung zum gemeinsamen JS-Bundle (rund 1,30 MB / 359 kB gzip).
- Erhaltungsprüfung für 83 Originaldateien einschließlich 72 Transformationsbildern im vollständigen Testlauf bestanden.

### Neue Nachweise

Sechs Tests verwenden echte temporäre Dateien, die mitgelieferten Mika-/Nori-Modelle, ein synthetisches reales GLB und einen tatsächlichen CLI-Unterprozess:

1. Zusammenführung von mitgeliefertem Katalog und Projektpaket; Katalog lesbar, Modelle/Projekte bytegenau erhalten, Bericht mit korrekten Größen und SHA-256-Prüfsummen, Quellen unverändert.
2. Doppelte IDs und normalisierte Pfadkonflikte scheitern vor Erstellung der Ausgabe.
3. Fehlende, fehlerhafte und zur ID unpassende Projekte scheitern vor Erstellung der Ausgabe.
4. Entweichende Symlinks und Ausgabe innerhalb der Quelle werden abgewiesen.
5. Externe Modellressourcen und reservierte IDs werden abgewiesen.
6. CLI führt tatsächlich zusammen; ein bestehender Ausgabeordner wird nicht überschrieben.

### Grenzen

Keine gerenderte Browser-, Hosting- oder Qualitätsabnahme. Container-/Ressourcenprüfungen belegen keine anatomisch korrekte Geometrie. Die Ausgabe enthält nur katalogreferenzierte Modelle/Projekte; keine vollständige Anwendung. Schreibfehler können einen unvollständigen neuen Ordner hinterlassen. Kein automatisches Deployment.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.30.0](PRUEFUNG.md#version-0300): sechs neue Tests mit echten Dateien und CLI-Prozess für Zusammenführung, Konflikte, Quellenprüfung und Überschreibschutz. 171 Tests und Build bestanden; visuelle Veröffentlichung weiterhin offen.

## Version 0.29.0

Zeitstempel: 2026-10-19T16:46:59+02:00 (Europe/Berlin)

- `npm test`: 165 Tests bestanden; Originaldateien einschließlich 72 Transformationsbildern unverändert.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlegrößenwarnung bleibt bestehen.
- Sechs neue Tests in `tests/zoo-export.test.mjs`: bereinigtes Projektpaket und echtes synthetisches GLB erneut laden; relative Quellen, reservierte IDs und Quellmehrdeutigkeit; falsche Projekt-ID, JSON, HTTP-Fehler, Größenheader und Abbruch; Chunk-Zusammensetzung und tatsächliche Streamgrenze mit Abbruch des Readers; neuer Ausgabeordner und Überschreibschutz; ungültige Eingabe ohne Dateischreibzugriff und echter CLI-Prozess.
- Nach Ergänzung der Streamgrößenprüfung alle sechs Export-/Ladetests nochmals bestanden. HTTP-Antworten sind Testdoubles, Dateioperationen und CLI-Prozess sind real.
- Codeabgleich: Katalogprojekt wird vor dem vorhandenen Modelllader strukturell geprüft und anschließend durch dieselben Modell-/Geometrie-/Revisionsprüfungen und die vorbereitete 3D-Installation geführt.
- Kein gerenderter Browser-/Hosting-Test, kein automatisches Deployment, keine Anatomie-/Textur-/GPU-Abnahme. Das Exportskript validiert die Projektstruktur; visuelle Modellqualität wird damit nicht zugesichert.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.29.0](PRUEFUNG.md#version-0290): Exportpaket, realer CLI-Prozess, GLB-Roundtrip, relative Katalogpfade und begrenzte Projektabrufe geprüft; gerenderter Veröffentlichungsablauf offen.

## Version 0.28.0

Zeitstempel: 2026-10-19T16:09:32+02:00 (Europe/Berlin)

- `npm test`: 159 Tests bestanden, einschließlich Originaldatei-Erhaltung.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlegrößenwarnung bleibt bestehen.
- Zwei neue Katalogtests: gemeinsame eindeutige IDs, nur Metadaten, genau ein ausgewählter gespeicherter Avatar; gelöschte aktive Kopie bleibt als Sitzungsidentität erhalten und verschwindet beim Wechsel.
- Drei neue DOM-/Metadatentests: Validierung und isolierte Listenkopien; Laden über gemeinsame Auswahl mit richtiger gespeicherter Identität, Sperre konkurrierender Auswahl und Aktualisierung nach Löschen; fehlerhafte/veraltete Listen werden nicht veröffentlicht.
- Codeabgleich: `list_avatars`, Dropdown und Karten verwenden dieselbe Katalogfunktion; Laden übergibt die gespeicherte ID an die vorhandene Modellinstallation. Die StateMachine übernimmt sie aus dem installierten Avatar. Keine Änderungen am MCP-Transportprotokoll.
- Die Tests verwenden happy-dom und Speicher-Testdoubles. Kein neuer Live-Nachweis für IndexedDB, gerenderte Auswahl, WebGL oder einen externen MCP-Host. Browserstart war zuvor durch einen verbotenen Socket-Systemaufruf blockiert; nicht erneut versucht.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.28.0](PRUEFUNG.md#version-0280): gemeinsamer Katalog, Metadatenvalidierung, gespeicherte Ladeidentität und Sitzungsreste nach Löschen geprüft; Browser-/MCP-Liveabnahme offen.

## Version 0.27.0

Zeitstempel: 2026-10-18T13:47:58+02:00 (Europe/Berlin)

- `npm test`: 154 Tests bestanden, einschließlich Originaldatei-Erhaltung.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlegrößenwarnung bleibt bestehen.
- Fünf neue Dateiformattests: nur verwendete Posen, Reihenfolge und Wiederholungen, Prüfhinweise, Gesamtspuren; neue IDs und Schlagwortkonflikte; Modell-/Punkt-/Verbindungsgrenzen gegenüber kosmetischen Änderungen; ungültige Versionen/Daten und Gesamtkapazität; Einzelpose mit mehrfacher Referenz. Web Crypto berechnet echte SHA-256-Werte.
- Zwei neue Editorprüfungen mit happy-dom und Three.js: Import als einzelne Änderung mit Undo/Redo, unveränderter aktueller Pose und ohne Wiedergabestart; Ablehnung nach manueller Änderung, Ziehbeginn, Verlassen oder Dispose während des Hashens.
- Kein echter Dateidialog-/Downloadtest, keine gerenderte Bewegungsvorschau und kein Retargeting-Nachweis. Browserstart war zuvor durch einen verbotenen Socket-Systemaufruf blockiert; nicht erneut versucht. GPU-/Anbieterabnahme bleibt offen.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.27.0](PRUEFUNG.md#version-0270): Move-Dateien mit realer SHA-256-Berechnung, Kompatibilitätsprüfung, Editor-Undo/Redo und Race-Schutz; gerenderte Browserabnahme ausstehend.

## Version 0.26.0

Zeitstempel: 2026-10-18T12:38:23+02:00 (Europe/Berlin)

- `npm test`: 147 Tests bestanden. Enthält Originaldatei-Erhaltung; 72 Transformationsbilder bleiben unverändert.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Warnung zum gemeinsamen JS-Bundle bleibt bestehen.
- Sieben neue Tests: isolierte gültige Projektkopien und Namensgrenzen; fehlendes IndexedDB; Speichern/Laden und erneutes Mounten; fehlgeschlagene Speicherung; Revision/Dispose während des Lesens; bestätigtes Löschen; Erfolg erst nach Transaktionsabschluss sowie Abort und 50-Eintragsgrenze.
- DOM-Tests verwenden happy-dom und einen Speicher-Testdouble. Der IndexedDB-Vertrag wird mit einem gesonderten Transaktions-Testdouble geprüft. Kein Nachweis einer echten IndexedDB-Implementierung oder Persistenz über einen Browserneustart.
- Codeprüfung: Laden nutzt weiterhin den bestehenden GLB-/Projektpfad mit Revisionsschutz, vorbereiteter Installation und Modellwechsel-Verlauf. Sammlung speichert Kopien und verändert keine Originaldateien oder Anbieterprofile.
- Offen: echter Browserlauf mit F5, mehreren Tabs, privatem Modus und Kontingentfehlern; gerenderte Modellübernahme; GPU-Inferenz. Chromium-Start war zuvor durch einen verbotenen Socket-Systemaufruf blockiert und wurde für diesen Meilenstein nicht erneut versucht.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.26.0](PRUEFUNG.md#version-0260): lokale Projektkopien und Sammlung; DOM und Transaktions-Testdouble geprüft, echte IndexedDB-Browserabnahme ausstehend.

## Version 0.25.0

Zeitstempel: 2026-10-18T04:55:02+02:00 (Europe/Berlin)

- `npm test`: 140 Tests bestanden, keine fehlgeschlagenen oder übersprungenen Tests. Enthält die Originaldatei-Erhaltungsprüfung.
- `npm run build`: TypeScript und Vite erfolgreich; bekannte Warnung zum gemeinsamen JS-Bundle (rund 1,29 MB / 354 kB gzip).
- Drei neue Auftragskerntests: opt-in Fallbacks nur vor Ausführung; keine weitere Ausführung bei Anbieter-/Validierungsfehlern; nicht reagierende Prüfung und verspätete Antwort; Revisionsprüfung; Abbruch auch durch Statusbeobachter.
- Zwei neue DOM-Tests: expliziter nächster Anbieter mit eigenem Schlüssel; gesperrte Wiederholung nach Projektänderung und Verwerfen bei Tresorsperre.
- Dienste in diesen neuen Prüfungen sind Testdoubles. Kein echter Cloud-Auftrag oder TripoSR-Inferenzlauf.
- Browserprüfung nicht erneut versucht: in 0.24.0 scheiterte der installierte Chromium vor dem Seitenstart an einem verbotenen Socket-Systemaufruf. Gerenderte WebGL-/Mausprüfung und GPU-/Qualitätsabnahme bleiben offen.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.25.0](PRUEFUNG.md#version-0250): Generator-Fallbacks nur vor Ausführung, bewusster nächster Auftrag und profilbezogene Schlüssel. 140 Tests und Build bestanden; Browser-/GPU-Abnahme weiterhin offen.

## Version 0.24.0

Zeitstempel: 2026-10-18T00:55:06+02:00

### Ergebnis

- `npm test`: 135 Tests bestanden, keine Fehler oder übersprungenen Tests; darunter Erhaltungsprüfung der Originaldateien und exakt 72 Transformationsbilder.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Vite-Bundlewarnung, rund 1,28 MB / 353 kB gzip.
- Fünf neue Vorbereitungs-/Rollbacktests bestanden.
- Chromium 141 / Playwright-Build 1194 installiert. `npx playwright test tests/e2e/generation.spec.ts`: beide Tests vor Anwendungsstart blockiert. Chromium bricht mit `socket() failed: Operation not permitted` ab. Keine Browserabnahme.

### Umfang der erfolgreichen Tests

Echte DOM-Knoten, Ereignisbindungen, Attribute und Auswahlwerte werden nach einer injizierten Veröffentlichungsstörung wieder eingesetzt. Die StateMachine erhält ihre vorherige Adapterbindung zurück und kann sie weiter ausführen. Alte Ressourcen werden bei Fehlschlag nicht freigegeben. Bei Erfolg erfolgt deren Freigabe erst nach Veröffentlichung; eine Cleanup-Störung zerstört den gültigen neuen Stand nicht. Kandidaten-Cleanup läuft auch bei gemeldetem Rollbackfehler.

Weitere Fehler werden beim Anzeigen, Erstellen der Studio-Ansicht und Rendern des Editors injiziert. Vorbereitete Knoten bleiben unmontiert; aktive Host-Rückmeldungen werden nicht ausgelöst; Ressourcen werden freigegeben. Ein erfolgreicher Kandidat verwendet echte GLTF-Daten, StudioRig, Editor und Playback mit ersetztem WebGL-Viewer. Geprüft werden normalisierte Oberflächenkoordinaten und idempotente Freigabe.

### Grenzen

Der WebGL-Viewer ist in den erfolgreichen Komponententests ersetzt. Die zwei Playwright-Abläufe (Generierung/Übernahme/Undo sowie injizierter Veröffentlichungsfehler) erreichen wegen der Umgebungssperre keine Seite. Kein tatsächlicher GPU-Generierungslauf, keine Qualitäts- oder Rigging-Abnahme. Die 3D-Übergabe ist abgesichert, nicht der separate Originalplayer-Neustart oder ein Prozess-/GPU-Ausfall.

Während der Vorbereitung existieren alter und neuer Viewer gleichzeitig; dies benötigt zusätzlichen Arbeitsspeicher und GPU-Ressourcen. In 0.22.0/0.23.0 gespeicherte freie Punkte/Posen sind nach der korrigierten Normalisierungsreihenfolge visuell zu prüfen; Format 1 erlaubt keine eindeutige automatische Herkunftserkennung.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.24.0](PRUEFUNG.md#version-0240): fünf neue Vorbereitungs-/Rollbacktests. Zwei Playwright-Tests vor Anwendungsstart blockiert: Chromium vorhanden, `socket() failed: Operation not permitted`.

## Version 0.23.0

Zeitstempel: 2026-10-17T17:12:59+02:00

### Ergebnis

- `npm test`: 130 Tests bestanden, keine Fehler oder übersprungenen Tests; einschließlich Erhaltungsprüfung der Originaldateien und exakt 72 Transformationsbilder.
- `npm run build`: TypeScript und Produktionsbuild bestanden. Bekannte Vite-Bundlewarnung bleibt bestehen.
- Sechs neue Tests: vier Verlaufstests sowie Projektaufnahme/-rekonstruktion und frühzeitige Viewer-Geometrieprüfung.

### Umfang

Der Verlauf wird mit Änderungen auf beiden Seiten eines Modellwechsels getestet. Kopien sind isoliert; Undo/Redo tauscht gespeicherten und aktuellen Stand. Abgelehnte und fehlgeschlagene Wiederherstellung lässt den Rücksprung erhalten. Eine konkurrierende Wiederherstellung wird blockiert; ein neuer Checkpoint macht eine alte Operation ungültig. Speichergrenze wird vor dem Restore geprüft, neue Wechsel ersetzen ältere und explizites Leeren entfernt den Verlauf.

Der DOM-/Three.js-Test erzeugt eine veränderte Oberfläche mit Entwurfspose, zwei Posen und einem Move, exportiert einen isolierten Projektstand und rekonstruiert einen echten StudioRig daraus. Der Player-Snapshot bewahrt den Entwurf statt der aktuellen Wiedergabephase; Dirty-Status und Speicherbutton werden geprüft. Ein weiterer Test weist leere Geometrie ab, bevor `Viewer.show` das bestehende Modell freigibt.

### Grenzen

Der vorbereitete Playwright-Test wurde um Original → generierter Entwurf → zurück → wiederholen erweitert. Er wurde in diesem Meilenstein nicht ausgeführt; der dokumentierte Chromium-Fehler aus 0.22.0 ist weiterhin ungelöst. Keine gerenderte Browser-/Mausabnahme, keine tatsächliche GPU-Inferenz oder Riggingprüfung.

Der Verlauf hält einen Sitzungs-Snapshot, keinen dauerhaften Versionsspeicher. Einzelgesten-Undo, Kamera, Auswahl, Agentenfreigabe und laufende Originalplayer-Animation werden nicht rekonstruiert. Zielprüfung und frühzeitige Validierung ersetzen keinen vollständigen Rollback beliebiger Fehler nach dem Modelltausch.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.23.0](PRUEFUNG.md#version-0230): Modellwechsel-Verlauf, vollständige Projektaufnahme und frühzeitige Geometrieabweisung geprüft; gerenderte Browserabnahme bleibt offen.

## Version 0.22.0

Zeitstempel: 2026-10-17T12:25:46+02:00

### Ergebnis

- `npm test`: 124 Tests bestanden, keine Fehler oder übersprungenen Tests. Erhaltungsprüfung der 83 Originaldateien einschließlich 72 Transformationsbilder bestanden.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung, rund 1,28 MB / 352 kB gzip.
- Sechs neue DOM-/Geometrie-Integrationstests bestanden.
- `npx playwright test tests/e2e/generation.spec.ts`: vor dem ersten Browserschritt blockiert. Chromium-Programmdatei unter dem von Playwright erwarteten Cachepfad fehlt. **Keine gerenderte Browserabnahme.**

### Neue Prüfungen

Die Tests nutzen happy-dom für Bildauswahl, ausdrückliches Starten, Vorschau-/Freigabestatus und Bedienereignisse. Der tatsächliche GLTFLoader und die neue Geometrievalidierung prüfen eine synthetische GLB. Netzadapter und WebGL-Viewer werden in diesen DOM-Tests ersetzt; der HTTP-Transport bleibt durch die vorhandenen Diensttests separat abgedeckt.

Geprüft: Auswahl sendet nichts; Vorschau übernimmt nichts automatisch; explizite Übernahme und Verwerfen räumen den Viewer auf. Geänderte Zielrevision sperrt die Übernahme. Tresorsperre bricht den Auftrag ab und verwirft späte Backend-Ergebnisse. Falscher Bildtyp und ungültige Modellbytes erzeugen keine Übernahmeaktion. Anbieterwechsel verwirft die Vorschau. Eine Tresorsperre während der asynchronen Importvorbereitung invalidiert den an den Host übergebenen Commit-Schutz.

Der neue Playwright-Test ist für Auswahl, gerenderte Vorschau, Erhalt des Originalplayers und anschließenden Modellimport vorbereitet. Er verwendet ebenfalls synthetische Dienstantworten und konnte hier nicht ausgeführt werden.

### Grenzen und nächster Nachweis

Echte TripoSR-/GPU-Inferenz, visuelle Qualität, CORS im gerenderten Browser und tatsächliches Mausgefühl der zweiten Vorschau sind nicht abgenommen. Die Übernahme nutzt den vorhandenen Modellimport mit erneuter Zielprüfung; sie hat noch kein projektübergreifendes Undo. Originaldateien bleiben unverändert. Anatomisches Rigging, Cloud-Fachadapter, automatische Geometrie-Fallbacks und freie Korrekturprompts bleiben offen.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.22.0](PRUEFUNG.md#version-0220): Bildauswahl, Vorschau-Lebenszyklus, Importfreigabe und Sperren geprüft; Playwright-Start wegen fehlender Chromium-Datei blockiert.

## Version 0.21.0

Zeitstempel: 2026-10-17T12:07:48+02:00

### Ergebnis

- `npm test`: 118 Tests bestanden, keine Fehler oder übersprungenen Tests. Einschließlich bytegenauem Erhalt der 83 Originaldateien und 72 Transformationsbilder.
- `npm run build`: TypeScript-Prüfung und Produktionsbuild bestanden. Bekannte Vite-Warnung zum gemeinsamen Bundle bleibt bestehen.
- Neun gezielte Generatortests bestanden: vier bisherige Wrapperprüfungen und fünf neue Dienst-/Adapterprüfungen.

### Neuer Nachweis

Der Test öffnet einen tatsächlichen HTTP-Server auf IPv4-Loopback. Der produktive Browseradapter fragt Fähigkeiten ab und sendet Bildbytes. Der Dienst ruft den bestehenden Generator-Wrapper auf; nur dessen Python-Umgebungsprüfung und Inferenzprozess werden ersetzt. Eine gültige synthetische GLB wird durch den echten GLTFLoader geprüft, an den Auftragskern geliefert und dort erneut geprüft. Ein veralteter Zielstand verhindert die Übernahme. Quellenbytes bleiben erhalten und temporäre Uploaddaten werden entfernt.

Weitere Fälle: fehlendes Token, falscher Origin/Host, enge CORS-Vorabprüfung, falsche Bildsignatur, generische Backendfehler ohne Detailleck, belegter Generator und Verbindungsabbruch mit Signal am Backend. Adapter weist entfernte Ziele, falsche Modelle/Rollen, übergroße deklarierte Antworten, falschen Medientyp und ungültige GLB ab. Echte Node-Unterprozesse prüfen Abbruch, Zeitlimit und normalen Abschluss.

### Grenzen

Kein TripoSR-/GPU-Lauf, kein Original-PaKaChi als 3D-Ergebnis und keine Qualitäts- oder Rigging-Abnahme. Das synthetische Dreieck belegt den Transport und die Prüfstrecke, keine generative Leistung. Keine gerenderte WebGL-Prüfung oder reale Browser-CORS-Abnahme. Der Adapter ist noch nicht in einer sichtbaren Generierungsoberfläche registriert. Prozessabbruch ist für den direkten Unterprozess geprüft, nicht für beliebige Kindprozessbäume. Kein Cloud-Generator, keine automatischen Geometrie-Fallbacks.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.21.0](PRUEFUNG.md#version-0210): echter lokaler Generatortransport mit synthetischem Inferenzbackend; keine GPU-/Qualitätsabnahme.

## Version 0.20.0

17.10.2026. 113 Tests bestanden; TypeScript und Produktionsbuild bestanden. Bestehende Vite-Bundlewarnung bleibt. Original-Erhaltungsprüfung unverändert bestanden.

Fünf zusätzliche Tests gegenüber 0.19.0: Passwortwechsel mit echter Web Crypto, Erhalt mehrerer gespeicherter Schlüssel, Ablehnung des bisherigen Passworts nach Wechsel, falsches Passwort/Schreibfehler/veraltete Operationen, UI-Bestätigung und Leeren von Passwortfeldern; dazu Integration der Sitzungssperre mit Profilverwaltung und Assistent. Geprüft sind Schlüsselentwürfe, Erhalt der Modell-/Profilkonfiguration und verschlüsselter Ablage, abgebrochene Anfrage, verworfene späte Vorschläge und erneutes Entsperren nach invalidierter laufender Entsperrung.

Keine echten Anbieteranfragen oder Kosten. Kein unabhängiges Sicherheitsaudit und keine visuelle Browserabnahme. Eine Sperre kann bereits gesendete Serveranfragen nicht zurücknehmen. Keine Garantie physischer Löschung sämtlicher JavaScript-Speicherkopien; die aktuelle Seite entfernt den verwendbaren Schlüsselzustand. Andere Tabs werden nicht gesperrt. Ungespeicherte Schlüssel gehen verloren; gespeicherte bleiben verschlüsselt erhalten.

[Anleitung](ANBIETER.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

### Ergänzende damalige Prüfnotizen

Zwischenprüfung vor 0.20.0 (17.10.2026): Acht Tresortests einschließlich zweier neuer Passwortwechsel-Prüfungen und Produktionsbuild bestanden. Kein erneuter vollständiger Testlauf oder unabhängiges Sicherheitsaudit für diese Ergänzung.

[Prüfbericht 0.20.0](PRUEFUNG.md#version-0200): Passwortwechsel und Sitzungssperre zusammen geprüft; 113 Tests und Build bestanden.

## Version 0.19.0

16.10.2026. 108 Tests bestanden; TypeScript und Produktionsbuild bestanden. Bestehende Vite-Bundlewarnung bleibt. Original-Erhaltungsprüfung weiterhin bestanden.

Sechs neue Tests verwenden echte Web Crypto (AES-GCM/PBKDF2), keine Kryptografie-Testdoubles: verschlüsselter Roundtrip, frische Zufallswerte, keine sichtbaren Klartextschlüssel/Passwörter in der Ablage, falsches Passwort, manipulierte Chiffretexte, unbekannte Versionen, Eingabegrenzen, Erhalt unbekannter Schlüssel, ausdrückliche Löschung, Endpunktwechsel, Speicherfehler und veraltete Operationen. DOM-Prüfungen testen Passwortbestätigung, Leeren beim Dialogschluss und tatsächliches Entsperren eines vorher gespeicherten Schlüssels in der Profiloberfläche.

Keine echte Cloud-Anfrage, keine Benutzerzugangsdaten und keine Modellinferenz. Keine unabhängige kryptografische Sicherheitsprüfung oder visuelle Browserabnahme. Web-Crypto-Verfahren werden durch die Plattformbibliothek ausgeführt. Sitzungsschlüssel bleiben während der Nutzung im Arbeitsspeicher. Kein Schutz gegen schädlichen Code im entsperrten Browser, keine Passwortwiederherstellung und keine automatische Browser-/Gerätesynchronisierung.

Die Profilkonfiguration bleibt kompatibel; der optionale Tresor hat einen eigenen versionierten Speicherbereich. Python-/MQTT-Integration wurde nicht erneut ausgeführt.

[Anleitung](ANBIETER.md#optionaler-schlüsseltresor-seit-0190) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.19.0](PRUEFUNG.md#version-0190): Schlüsseltresor mit echter Web Crypto und Profiloberfläche geprüft.

## Version 0.18.0

16.10.2026. 102 Tests bestanden; TypeScript und Produktionsbuild bestanden. Bestehende Vite-Bundlewarnung bleibt. Original-Erhaltungsprüfung weiterhin bestanden.

Fünf neue Tests prüfen unabhängige Rollenrouten und ihre Speicherung, alte Konfigurationen ohne Fallbacks, doppelte/ungültige Referenzen, Profilentfernung, Schlüsseltrennung nach Profil und Endpunkt, tatsächliche Assistenten-Reihenfolge mit richtigem Schlüssel, Abbruch/Studio-Konflikte ohne Fallback und DOM-Profilwechsel einschließlich bearbeiteter Modell- und Schlüsselentwürfe. Bestehende Tests wurden an die ausdrücklich geänderte Anforderung angepasst: Dialogschluss und Profilwechsel dürfen Schlüssel nicht mehr löschen.

Fallback-Ausführung wurde mit Testadaptern geprüft, keine echten Konten verwendet. Generator-/Rigging-Routen sind konfigurierbar, ihre Fachausführung fehlt weiterhin. Schlüssel sind nur im Arbeitsspeicher der Seitensitzung und nicht über Neuladen hinweg erhalten. Profil-/Routenkonfiguration ist dauerhaft im Browserspeicher. Keine visuelle Browser-, echte Modell- oder neue Python-/MQTT-Abnahme.

[Anbieter](ANBIETER.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.18.0](PRUEFUNG.md#version-0180): Mehranbieterprofile, erhaltene Sitzungsschlüssel und unabhängige Fallback-Routen geprüft.

## Version 0.17.1

16.10.2026. Anbieter-Einrichtung; keine Änderung am Projekt- oder Profilformat.

- 14 bestehende Anbieter-/Discovery-Tests bestanden.
- Zusätzliche einmalige DOM-Bedienprüfung: alle sechs Vorlagen, konkrete Vorgabeadressen, Entfernen von Schlüssel/Modell-ID, eigene Adressentwürfe beim Schnittstellenwechsel und ausdrückliches Zurücksetzen geprüft.
- Produktionsbuild mit TypeScript bestanden; bekannte Vite-Bundlewarnung bleibt.
- Keine echte Cloud-Anfrage und keine Modellinferenz ausgeführt. Keine erneute visuelle WebGL- oder Python-/MQTT-Prüfung. Letzter vollständiger Lauf: 97 bestandene Tests in 0.17.0.

Einrichtungsvorlagen garantieren keine Modell-, Parameter- oder CORS-Kompatibilität. OAuth und Fachgenerierung bleiben offen.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.17.1](PRUEFUNG.md#version-0171): Anbieter-Einrichtung, 14 relevante Tests und DOM-Bedienprüfung bestanden; Build geprüft. Letzter vollständiger Testlauf weiterhin 0.17.0.

## Version 0.17.0

Datum: 16.10.2026. Projektformat weiterhin 1.

- `npm test`: 97 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bestehende Warnung zum großen gemeinsamen Bundle bleibt.
- Original-Erhaltungsprüfung weiterhin bestanden: 83 Dateien einschließlich 72 Transformationsbildern unverändert.
- Fünf neue Anthropic-Tests: unabhängige Rollen/Profile, Endpunktpräfixe, native Authentifizierungsheader, vollständige Modelllisten, Werkzeughin-/rückweg einschließlich Thinking-Blöcken, keine automatische Mutation, Fehlerkennzeichnung und Abweisung unbekannter/abgeschnittener/mehrfacher Werkzeugantworten.

Tests verwenden Fetch-/RPC-Testdoubles. Keine API-Schlüssel benutzt, keine echte Cloud-Anfrage und keine Kosten ausgelöst. Kein Nachweis für tatsächliche Modellqualität oder Konto-/Browser-CORS. Bestehende Assistenten-, DOM- und Studio-Tests wurden im vollständigen Lauf erneut ausgeführt. Python-/MQTT-Liveintegration und visuelle Browserabnahme wurden nicht wiederholt.

Die native Schnittstelle ersetzt keine Fachverfahren für 3D oder Rigging. Profilzuordnung bleibt für alle Rollen möglich; ausgeführt wird derzeit nur der Assistent. OAuth, Workspace-Auswahl, vollständige Pagination und geschützte dauerhafte Schlüsselablage bleiben offen.

[Anbieter](ANBIETER.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.17.0](PRUEFUNG.md#version-0170): native Anthropic-Protokolle mit Testdoubles geprüft; echte Kontoabnahme offen.

## Version 0.16.0

Datum: 16.10.2026. Projektformat unverändert 1.

- `npm test`: **92 bestanden**, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Produktionsbuild bestanden; weiterhin Vite-Warnung zum gemeinsamen Bundle über 500 kB.
- Bestehende Erhaltungsprüfung bestätigt 83 unveränderte Originaldateien einschließlich 72 Transformationsbildern.
- Acht neue Assistententests prüfen Ollama-/OpenAI-kompatible Anfrage- und Antwortformate, Werkzeugantworten, keine automatische Mutation, Header statt persistierter Schlüssel, unbekannte Werkzeuge/Argumente, erfundene Revisionen, abgeschnittene Antworten, fünf-Runden-Grenze, veränderten Studio-Stand, unsichere Schlüsselübertragung, Timeout/Abbruch und verspätete Antworten.
- DOM-Prüfungen bestätigen ausdrückliches Senden, Darstellung als Text, einmalige Übernahme und Verwerfen von Antworten/Schlüsseln bei Profilwechsel.
- Bestehende Studio-Tests prüfen weiterhin Freigabe, Revision und Undo des verwendeten Editorwegs. Ein bei der Profilbenachrichtigung entdeckter DOM-Ereignisfehler wurde behoben und der vollständige Testlauf wiederholt.

Keine Modellgewichte geladen, keine API-Schlüssel verwendet und keine reale Modellinferenz ausgeführt. HTTP-Antworten der Assistententests sind Testdoubles. Echte Modellqualität, Cloud-/CORS-Kompatibilität und visuelle Browserbedienung sind noch abzunehmen. Die vorhandene Python-/MQTT-Integration wurde in diesem Meilenstein nicht erneut ausgeführt.

Die Änderungsvorschau ist eine konkrete JSON-Befehlsanzeige, keine simulierte 3D-Vorschau. Ein Vorschlag wird erst mit ausdrücklicher Übernahme und gültiger Studio-Freigabe ausgeführt. Der Generator-/Rigging-Auftragskern bleibt separat und erhält durch diesen Meilenstein keinen produktiven Fachadapter.

[Prüfstand](PRUEFUNG.md) · [Assistent](ASSISTENT.md) · [Changelog](CHANGELOG.md)

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.16.0](PRUEFUNG.md#version-0160): begrenzter Assistentenablauf, Protokolle und DOM mit Testdoubles geprüft; echte Modell-/Cloud-Abnahme offen.

## Version 0.15.0

Datum: 16.10.2026. Software 0.15.0; Projektformat unverändert 1.

- `npm test`: **84 bestanden**, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript und Produktionsbuild bestanden. JS-Bundle 1.234,82 kB, gzip 337,80 kB; bestehende Vite-Größenwarnung bleibt.
- Erhaltungsprüfung im Testlauf: 83 Originaldateien einschließlich 72 Transformationsbildern unverändert.
- Acht neue Discovery-Tests: tatsächlicher lokaler HTTP-Testserver mit Ollama-/OpenAI-Antwortformaten, Header, URL-Regeln, Fehler-/Antwortgrenzen, Timeout/Abbruch und DOM-Lebenszyklus. Keine Live-Abnahme eines echten Ollama-, LM-Studio- oder Cloud-Kontos.
- Sieben neue Setup-Tests: NVIDIA-Messdaten, VRAM/RAM/Platte, unbekannte Hardware, CPU-Opt-in, Manifest-/Pull-Protokoll und Laufzeitprüfung mit API-Testdoubles. 32-GiB-Modell auf 16-GiB-VRAM wird trotz großem RAM ausgeschlossen.
- Zusätzlicher Rollen-Test: jede Rolle kann sowohl lokales als auch Cloud-Profil verwenden, sofern der Testadapter die erforderliche Fähigkeit bestätigt. Kein Beweis für die Fähigkeiten realer Modelle.

Die Registry-Metadaten für einen kuratierten Tag wurden während der Entwicklung erfolgreich gelesen; das ersetzt keinen echten Modelllauf. Keine Gewichte heruntergeladen, kein echter GPU-Ladetest und keine qualitative Modellfreigabe. Der Helfer führt solche lokalen Basistests erst beim Nutzer nach dessen Bestätigung aus. Die zwei einfachen Werkzeugtests decken weder Bildverständnis noch komplexe Studio-Aufgaben ab.

DOM-Tests ersetzen keine visuelle WebGL-/Mausprüfung. Python-/MQTT-Integration und Original-Testprogramme wurden in diesem Meilenstein nicht erneut ausgeführt; ihre letzten Nachweise bleiben im allgemeinen Prüfstand vermerkt. Native Cloud-Adapter, OAuth, geschützte dauerhafte Schlüsselablage sowie echte Generator-/Rigging-Aufträge sind weiterhin offen.

[Prüfstand](PRUEFUNG.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.15.0](PRUEFUNG.md#version-0150): Modelllisten, Sitzungsschlüssel, Hardwarebudgets und freie Wahl für alle Rollen; echte Modellinferenz weiterhin nicht abgenommen.

## Version 0.14.0

Stand: 15.10.2026. Umfang: interner Auftragskern und Adaptervertrag.

- `npm test`: 68 Tests bestanden, darunter zehn neue Tests für Aufträge.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Warnung zum großen JS-Bundle bleibt bestehen.
- Originaldateien unverändert; Erhaltungsprüfung Bestandteil der Tests.

### Geprüfte Risiken

Fester Anbieter-/Eingabestand trotz späterer Änderungen, genau eine ausdrückliche Übernahme, Sitzungs- und Revisionskonflikte, Verwerfen, nicht reagierende Fähigkeitsprüfung und Ausführung, Zeitlimit, Abbruch während Ergebnisprüfung, verspätete Antworten/Fortschrittsmeldungen, monotone Fortschrittswerte, ungeeignete Ergebnisse, Validatorfehler, fehlende Ausführung, Beobachterfehler und abgewiesene Host-Transaktionen. Vorschaukopien und Validatoren können die intern gehaltenen Modellbytes nicht verändern.

### Prüfgrenzen

Alle neuen Dienste, Ergebnisse und Host-Transaktionen sind Testdoubles. Es wurde kein echter KI-Auftrag ausgeführt. Es gibt noch keine neue sichtbare Auftrags-/3D-Vorschauoberfläche und keinen durch diesen Kern ausgeführten Studio-Modellwechsel mit Undo. Die verpflichtende Formatprüfung ist ein Vertrag, noch keine neu implementierte GLB-/Anatomieprüfung. Abbruch bestätigt nur den lokalen Endzustand.

Bestehende DOM-/Geometrieprüfungen ersetzen keine gerenderte Browserabnahme. Python-MCP und die separaten Originalplayer-Tests wurden nicht erneut ausgeführt; die bisherigen Nachweise gelten unverändert. [Prüfstand](PRUEFUNG.md).

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.14.0](PRUEFUNG.md#version-0140): Interner Auftragskern mit simulierten Adaptern und Übernahmetransaktionen geprüft; keine echte Anbieter-/Studio-Integration.

## Version 0.13.0

Stand: 15.10.2026. Meilenstein: Anbieterprofile und unabhängige Rollenzuordnung.

### Nachgewiesen

- `npm test`: 58 Tests bestanden, darunter fünf neue Tests für Anbieter-Konfiguration und Optionsoberfläche.
- `npm run build`: TypeScript und Vite erfolgreich. Bundle weiterhin groß: rund 1,23 MB / 335 kB gzip; keine neue Abhängigkeit hinzugefügt.
- Original-Erhaltungsprüfung innerhalb von `npm test` erfolgreich; keine Originalbilder verändert.
- Getrennte Rollen und mehrere Profile überstehen Speichern/Lesen. Löschen eines gemeinsam verwendeten Profils hebt ausschließlich betroffene Zuordnungen auf.
- Ungültige URLs, Zugangsdatenfelder, doppelte IDs und fehlende Profilreferenzen werden abgewiesen. Speicherfehler verändern den aktiven Stand nicht.
- Registry mit simulierten Adaptern: fehlender Adapter, falsches Modell, ungeeignete Rollenfähigkeit und Abbruch werden abgewiesen; kein Ersatzanbieter wird gewählt.
- DOM-Prüfung mit happy-dom: Profile anlegen, bearbeiten, zuordnen und entfernen; Sprachwechsel erhält Eingaben; Profilnamen werden als Text dargestellt. Fehler beim Speichern erhalten den Formularentwurf und die bisherige Zuordnung.

### Grenzen

Die UI-Prüfung verwendet DOM-Ereignisse, keinen gerenderten Browser. Visuelle Prüfung von Dialoggröße, Scrollen, Fokus und Bedienung auf dem Nutzergerät bleibt offen. Die bisherige Umgebung konnte Chromium nicht starten; dies wurde nicht als bestandene Browserprüfung gewertet.

Noch keine produktiven Netzwerkadapter: Es gab keine Verbindung zu Ollama, LM Studio oder einem Cloud-Anbieter, keinen OAuth-Login und keine reale Generierungs-/Rigging-Inferenz. Die Registry-Prüfung mit Testadaptern bestätigt keine Fähigkeiten konkreter Modelle. Python-MCP und separater Originalplayer-Test wurden in diesem Meilenstein nicht erneut ausgeführt; ihre letzten Nachweise bleiben im [Prüfstand](PRUEFUNG.md) ausgewiesen.

### Manuell nachprüfen

1. Optionen öffnen, drei Profile mit unterschiedlichen Namen und Modell-IDs anlegen und den drei Rollen zuordnen.
2. Dialog schließen und Seite neu laden; Profile und Zuordnungen kontrollieren.
3. Ein Profil bearbeiten und während eines Formularentwurfs Deutsch/English wechseln; Eingaben sollen erhalten bleiben.
4. Ein zugeordnetes Profil entfernen; nur dessen Rollenzuordnungen müssen leer werden.
5. Bei schmalem Fenster bis zum Schließen-Button scrollen. Keine neue Studio-Betriebsart und keine Netzwerkanfrage durch Profiländerungen erwarten.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.13.0](PRUEFUNG.md#version-0130): Profilverwaltung und interne Fähigkeitsprüfung bestanden; echte Anbieteranbindung und visuelle Optionsdialog-Abnahme stehen aus.

## Version 0.12.0

- `npm test`: 53 Tests bestanden, davon vier neue Tests für lokale Generierungsabläufe, Fehlerberichte, getrennte Ausgaben und echte GLB-Ladung über den produktiven Player-Lader. Backend-Aufrufe sind Testdoubles; die Geometrie ist synthetisch.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung unverändert.
- `npm run generate:model -- --check`: tatsächlich ausgeführt; Exitcode 2/ready=false. Python vorhanden, aber torch/tsr/rembg/xatlas/torchmcubes fehlen; keine verfügbare CUDA-Laufzeit. Keine Generierung gestartet.
- Originaldateien unverändert: reguläre Prüfung aller 83 Dateien einschließlich 72 Transformationsbildern.
- Python-MCP-Integration zuletzt in 0.10.0, Original-Testprogramme in 0.9.0 bestanden.

Kein echter TripoSR-Inferenzlauf, kein erzeugter Original-PaKaChi in 3D, kein Qualitätsvergleich, kein automatisches Rigging und keine WebGL-Abnahme. Die 0.12.0-Teststrecke schafft die Voraussetzungen zur späteren Messung; sie ersetzt deren Nachweis nicht.

### Ergänzende damalige Prüfnotizen

[Prüfbericht 0.12.0](PRUEFUNG.md#version-0120): Generierungsadapter mit Testdoubles geprüft; reale Inferenz und Original-PaKaChi-3D weiterhin offen.

## Version 0.11.1

- `npm test`: 49 Tests bestanden. Zwei neue Regressionstests prüfen Drehung um die gesamte Modellmitte bei versetztem Zoom-/Pan-Ziel, erhaltenen Kameraabstand und Bildausschnitt, Modellverschiebung sowie einen festen Drehpunkt pro Geste. Die Integrationsprüfung verwendet echte ArcballControls und DOM-Pointerereignisse.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung bleibt bestehen (rund 1,14 MB / 309 kB gzip).
- Alle 83 Originaldateien einschließlich 72 Transformationsbildern sind unverändert (reguläre Erhaltungsprüfung).
- Keine erneute gerenderte WebGL-Abnahme; die Korrektur muss im Browser nachgeprüft werden. Python-Prozessintegration zuletzt in 0.10.0, Original-Testprogramme in 0.9.0.

Manuell nachprüfen: Mika öffnen, über einer Schulter zoomen, rechts ziehen und danach mit gedrücktem Mausrad drehen. Die ganze Figur soll um ihre Mitte rotieren und der Bildausschnitt ohne Sprung erhalten bleiben. Nach Gesamtverschiebung der Figur erneut prüfen.

### Ergänzende damalige Prüfnotizen

Nutzerrückmeldung zu 0.11.0: Mitteltasten-Drehung nach Zoom/Pan um Schulter statt Figurenmitte. In 0.11.1 korrigiert und mit Kamera-Mathematik sowie tatsächlichen ArcballControls/DOM-Pointerereignissen geprüft. Visuelle Nachprüfung bleibt offen. [Prüfbericht 0.11.1](PRUEFUNG.md#version-0111).

## Version 0.11.0

Auslöser: Im Browser meldete der Nutzer bei 0.10.0 auseinanderziehbare Körperteile, fehlende Kettenbewegung und Probleme mit der Ausrichtung. Die Korrektur ist automatisiert geprüft, noch nicht erneut visuell abgenommen.

- `npm test`: 47 Tests bestanden. Vier neue Tests umfassen Handziele, maximale/minimale Reichweite, gerade Ausgangsketten, feste Knochenabstände, tatsächliche SkinnedMesh-Verformung, Quaternion-Ausrichtung, Figurtransformation, Datei-/Posenrundlauf, entfernte Verbindungen und echte DOM-Pointerereignisse mit Undo.
- Für Mika und Nori: vollständige automatische Skelettverbindungen, beide Fuß-/Beinketten, Rumpfbewegung und Hals-/Kopfverbindung geprüft.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung (rund 1,14 MB / 309 kB gzip).
- `npm run generate:avatars`: beide technischen Testmodelle mit Hand-, Knie-, Fuß- und Halsknochen als Rig 2 erzeugt.
- Alle 83 Originaldateien einschließlich 72 Transformationsbildern bleiben bytegenau erhalten (reguläre Erhaltungsprüfung).
- Python-MCP-/aMQTT-Prozessintegration zuletzt in 0.10.0 bestanden; Original-Testprogramme zuletzt in 0.9.0. Node-MCP läuft in den regulären Tests.

Noch offen: gerenderte WebGL-/Maus-Nachprüfung, anatomische Winkelgrenzen, Kollisionen, Bodenfixierung, vollständige Körper-IK, komplexe Import-Rigs und anatomische Generierung ohne Skelett. DOM und Geometrie ersetzen keine visuelle Abnahme.

### Ergänzende damalige Prüfnotizen

Vier neue Tests in 0.11.0 prüfen Hand-/Fußziele, feste Knochenabstände, den ganzen erkannten Körper, Hals/Kopf und Rumpf, tatsächliche Hautverformung, gespeicherte Posen sowie direktes Ziehen/Drehen mit Undo. Nutzertest von 0.10.0 meldete auseinanderziehbare Knochen und Probleme mit der Ausrichtung; die visuelle Nachprüfung der Korrektur 0.11.0 steht aus.

## Version 0.10.0

- `npm test`: 43 Tests bestanden. Drei neue Tests prüfen skalierte SkinnedMesh-Vertices und Gesichtspunkte, Bearbeitung und Originalwiederherstellung, nicht gleichmäßig skalierte Eltern, Interpolation und Schleifen, Dateirundlauf/Altdateien sowie den Mausregler mit einem Undo-Schritt und MCP-Konfliktschutz.
- `PAKACHI_PYTHON=/tmp/pakachi-python/bin/python npm run test:python`: reale Python-MCP-2.3.0-/aMQTT-Integration bestanden; gültige Skalierung gelangt bis zum Studio, ungültige wird abgewiesen. Weiterhin acht Tools.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Bundlewarnung, JavaScript rund 1,13 MB / 308 kB gzip.
- Erhaltungsprüfung in `npm test`: alle 83 Originaldateien einschließlich 72 Transformationsbildern bytegenau erhalten.
- Die unveränderten Original-Testprogramme wurden zuletzt in 0.9.0 erfolgreich ausgeführt.

Die Tests verwenden Three.js-Geometrie und happy-dom ohne gerendertes WebGL. Visuelle Maus-/WebGL-Abnahme, externer KI-Host und externer NanoMQ-Broker bleiben offen.

## Version 0.9.0

- `npm test`: 40 Tests bestanden. Neue Tests prüfen tatsächliche Studio-Bearbeitung bis zum gespeicherten/abspielbaren Move, Undo, fehlende Freigabe, veraltete Sitzungen/Revisionen, manuelle Änderungen, laufende Gesten, ungültige Befehle ohne Seiteneffekte und begrenzte Antwortseiten.
- `PAKACHI_PYTHON=/tmp/pakachi-python/bin/python npm run test:python`: echter Python-MCP-2.3.0-Prozess, aMQTT 0.12.1, produktiver PlayerMQTT und echter StudioEditor mit happy-dom. Acht Tools gelistet, Punkte angelegt und Pose gespeichert; fehlende Freigabe/veraltete Revision abgewiesen. Bisherige Authentifizierungs-, Zustands-, Duplikat-, Ablauf- und Opt-out-Prüfungen bleiben enthalten.
- Node-MCP-Handshake und Studio-Befehlsweitergabe mit simulierter Browser-Gegenstelle in den regulären Tests bestanden.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Bundlegröße bleibt bestehen (rund 1,13 MB / 307 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau erhalten.

Die Prozessintegration verwendet echte lokale Netzwerkverbindungen, jedoch keine gerenderte Oberfläche. Visuelle WebGL-Abnahme, konkreter externer KI-Host und externer NanoMQ-Broker bleiben offen.

## Version 0.8.0

- `npm test`: 37 Tests bestanden. Drei neue Prüfungen decken Gesamtdrehung skinned Geometrie, mitgeführte Gesichtspunkte und weitere Bearbeitung nach Drehung, Rückkehr zu Originalclips, knochenlose Modelle unter ungleichmäßiger Elternskalierung, Projektpersistenz, Slerp und den Editorablauf mit Undo ab.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Bundlegröße bleibt bestehen (rund 1,12 MB / 305 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau erhalten.

Three.js-Geometrie und happy-dom-Ereignisse sind automatisiert geprüft. Die gerenderte Browserabnahme bleibt wegen der bekannten Chromium-Startbeschränkung offen. Die unveränderte Python-MCP-Integration wurde nicht erneut ausgeführt; diese Änderung erweitert die Daten und Wiedergabe vorhandener Moves, nicht die Agentenprotokolle.

## Version 0.7.0

- `npm test`: 34 Tests bestanden. Vier neue Prüfungen decken Änderungsgründe, unveränderte Posenwerte, ausgenommene kosmetische Änderungen, Ableitung betroffener Moves, Persistenz/Importvalidierung und den Editorablauf mit Undo/Redo, Bestätigung und Ersetzen ab.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Bundlegröße bleibt bestehen (rund 1,12 MB / 304 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau erhalten.

Die neuen Bedienprüfungen nutzen happy-dom. Die visuelle WebGL-/Mausprüfung bleibt wegen der bekannten Chromium-Startbeschränkung offen. Die unveränderte Python-MCP-Integration wurde nicht erneut ausgeführt; die neuen Review-Felder werden in der produktiven Fähigkeitsliste erstellt und von vorhandenen Tools weitergereicht. Ein eigener Live-Test dieser Felder mit einem externen Host steht noch aus.

## Version 0.6.0

- `npm test`: 30 Tests bestanden. Neue Prüfungen decken die Weltverschiebung echter skinned Geometrie, Kontrollpunkte, Rückkehr zur Originalposition, knochenlose Modelle unter rotierten/skalierten Elternobjekten, Interpolation, Projektvalidierung, alte Projekte sowie den Editorablauf mit Undo/Redo ab.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; bekannte Vite-Warnung zur Größe des gemeinsamen Bundles bleibt bestehen.
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau unverändert.

DOM-Tests verwenden happy-dom; Geometrietests Three.js und echte GLTF-Testmodelle. Die visuelle WebGL-/Mausprüfung bleibt wegen der bekannten Chromium-Startbeschränkung offen. Python-MCP blieb unverändert und wurde in diesem Meilenstein nicht erneut integriert getestet; letzter tatsächlicher Integrationstest siehe 0.4.0.

## Version 0.5.0

- `npm test`: 27 Tests bestanden, einschließlich vier neuer Prüfungen für Erkennung/Einzellöschung/Undo, mittlere Maustaste und Inversion, Sprachwechsel und Speicherung sowie direktes Punktziehen am produktiven StudioView.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich. Vite meldet weiterhin das große gemeinsame Bundle (ca. 1,12 MB / 303 kB gzip).
- Alle 83 Originaldateien einschließlich exakt 72 Transformationsbildern bleiben bytegenau unverändert.

DOM- und Ereignistests laufen mit happy-dom; Geometrieprüfungen mit Three.js. Eine reale gerenderte Browserprüfung konnte wegen der bekannten Chromium-Startbeschränkung nicht erfolgen. Insbesondere das Mausgefühl bleibt visuell abzunehmen. Die unveränderte Python-MCP-Integration wurde in diesem Meilenstein nicht erneut ausgeführt; ihr letzter echter Integrationstest ist im Prüfstand 0.4.0 dokumentiert.

## Version 0.4.0

- `npm test`: 23 Tests bestanden. Enthalten sind die bisherigen Player-, Studio-, Geometrie-, MQTT-, Node-MCP- und Erhaltungsprüfungen sowie die Kameradrehung um alle Achsen.
- `npm run test:legacy`: beide Original-Testprogramme bestanden.
- `npm run build`: TypeScript-Prüfung und Produktionsbuild erfolgreich. Das gemeinsame JavaScript-Bundle einschließlich Three.js, Arcball und MQTT.js umfasst etwa 1,10 MB unkomprimiert / 296 kB gzip; Vite meldet die Chunkgröße.
- `PAKACHI_PYTHON=<Python-Umgebung> npm run test:python`: ein Integrationstest mit mehreren Prüfungen bestanden. Der echte Python-MCP-2.3.0-Prozess startet aMQTT 0.12.1; ein offizieller MCP-Client ruft die sechs Tools auf. Der produktive MQTT-Playerclient läuft über WebSocket und steuert den echten gemeinsamen Zustandsrouter. Erfolge und Ablehnungen werden über MQTT bis zur MCP-Antwort zurückgeführt.
- Zusätzlich im Integrationstest geprüft: falsches Broker-Passwort, fehlender Player, nicht unterstützter Zustand, direkter MQTT-Befehl, doppelte Anfragen, abgelaufene Anfragen, mehrere mögliche Player und wirksames Ausschalten des Empfangs.
- Die Kamera-Prüfung bestätigt erreichbare Unterseite, Rückseite und Rollbewegung bei gleichbleibendem Drehzentrum. Ansichtsdrehung verändert keine Modelldaten.
- Alle 83 wiederhergestellten Originaldateien einschließlich der 72 Transformationsbilder bleiben bytegenau erhalten.

Die Python-Integration wurde mit Python 3.12 getestet. Sie verwendet echte Netzwerkverbindungen und den produktiven Transportcode, aber keine gerenderte Browseroberfläche. Die visuelle Arcball-/WebGL-Abnahme bleibt wegen der bekannten Chromium-Startbeschränkung offen. Ein konkreter externer KI-Host und ein externer NanoMQ-Broker wurden nicht live eingerichtet; deren Konfiguration ist in [PYTHON-MCP.md](PYTHON-MCP.md) beschrieben.

## Version 0.3.0

- `npm test`: 22 Tests bestanden, einschließlich der bisherigen Player-, MQTT-, MCP- und Erhaltungsprüfungen.
- Neue Geometrieprüfungen verwenden tatsächlich geladene glTF-Skelette: Grundoberfläche bleibt bei Drehpunktänderung erhalten; Posieren bewegt Vertices; die ursprüngliche Hautbindung lässt sich wiederherstellen.
- Freie Gesichtspunkte wirken innerhalb ihres Einflussradius auf ihr Teilmodell. Punktgröße beeinflusst die Verformung nicht. Ein Gesichtspunkt folgt dem gedrehten Kopf und lässt sich in dieser Ansicht weiter bewegen.
- Posen interpolieren Positionen und Quaternionen. Modell, Rig, Posen und Moves lassen sich über das Projektformat wiederherstellen. Ungültige Verbindungen, nichtendliche Werte, fehlende Pose-Werte und doppelte Moves werden abgewiesen.
- Der DOM-Test betätigt die echten Editor-Bedienelemente für Hinzufügen, Größe, Verbinden, Rückgängig/Wiederholen, Posen und eine abspielbare Bewegung. Dabei wird ein echter Three.js-Geometrie-Rig mit einer simulierten 3D-Eingabeansicht verwendet.
- `npm run test:legacy`: beide ursprünglichen Testprogramme bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich. Das gebündelte JavaScript umfasst mit Three.js und Editor etwa 735 kB unkomprimiert; Vite weist weiterhin auf die Chunkgröße hin.
- Die Erhaltungsprüfung bestätigt alle 83 Originaldateien einschließlich genau 72 Transformationsbildern unverändert.

Playwright-Abläufe für tatsächliche Mausbedienung, Projekt-Download/-Import und Steuerung sind erweitert. Sie wurden hier nicht ausgeführt: Chromium kann wegen der bekannten Socket-Beschränkung der Umgebung nicht starten. DOM- und Geometrietests ersetzen keine visuelle Browserabnahme. Ebenfalls noch offen: Live-Abnahme mit einem externen Agenten/NanoMQ sowie Qualität an komplexen Fremdmodellen.

Die funktionalen Grenzen dieser ersten Editor-Version stehen in [STUDIO.md](STUDIO.md), insbesondere Quellknochenumbau, IK, Gewichtsneuzuordnung, GLB-Export und Bild-zu-3D.

## Version 0.2.0

- `npm test`: 16 Tests bestanden. Enthalten sind glTF-Laden und reale Knochenanimation, Zustands-/Move-Verhalten, MQTT-Protokoll bis zum Router, WebSocket-Kopplung und echter MCP-stdio-Handshake mit Tool-Aufrufen.
- `npm run test:legacy`: Original-Controller und MQTT-Lebenszyklus bestanden.
- `npm run build`: TypeScript-Prüfung und Produktionsbuild erfolgreich. Vite meldet weiterhin das große Three.js-Bundle (ca. 675 kB unkomprimiert).
- Erhaltungsprüfung: alle 83 wiederhergestellten Originaldateien, darunter genau 72 Transformationsbilder, stimmen bytegenau mit dem gesicherten Stand überein.

Die Browserabläufe sind als Playwright-Tests hinterlegt, wurden hier aber nicht ausgeführt: Chromium scheitert an der Socket-Beschränkung der Ausführungsumgebung. Daher keine visuelle Abnahme behauptet. Es gab keine Live-Abnahme mit NanoMQ oder einem externen Agenten; der MCP-Test verwendet den offiziellen SDK-Client und eine simulierte Player-Gegenstelle.

Noch nicht implementiert: Gelenk-/Posenbearbeitung, freie Gesichtspunkte, editierbare Studio-Projekte, Bild-zu-3D und die 3D-Übertragung der beiden Originalformen.

## Version 0.1.0

Datum: 13.10.2026

### Bestanden

- TypeScript-Prüfung und Vite-Produktionsbuild.
- Katalogvalidierung, reale Clip-Zuordnung und Unterdrückung fehlender Fähigkeiten.
- Animationssteuerung: Schleifen, einmalige Moves, Rückkehr zur Grundbewegung, Pause, Tempo, Scrubbing und erneutes Abspielen.
- Wiederhergestellter Originalplayer: vorhandene Tests für Formwechsel, Halten, Richtungswechsel, ungültige Nachrichten sowie MQTT-Opt-in und Wiederverbindung.
- SHA-256-Abgleich aller 83 Originaldateien aus dem wiederhergestellten ZIP, einschließlich exakt 72 PNG-Frames.

### Grenzen

- Die Browser-Abnahmetests sind hinterlegt, konnten in dieser Ausführungsumgebung aber nicht ausgeführt werden: Chromium scheitert beim Start an einer gesperrten Betriebssystem-Socket-Funktion. Es gibt daher noch keine bestätigte visuelle Browserabnahme oder Mobilprüfung.
- Kein Test gegen einen echten NanoMQ-Broker. Die vorhandenen Legacy-Tests verwenden Testgegenstellen beziehungsweise simulierte Verbindungen.
- Kein Windows-Installer; die Windows-Startdatei wurde hier nicht auf Windows ausgeführt.
- Der Build meldet einen Größenhinweis zum Three.js-Bundle, keinen Buildfehler.
- PaKaChi-Bildanimation bleibt der erhaltene Entwurf mit bekannten visuellen Mängeln; eine neue 3D-Version ist noch nicht erstellt.

Lokale Browserprüfung: `npx playwright install chromium`, anschließend `npm run test:e2e`.

## Zwischenprüfung 2026-10-29



## Zwischenprüfung 2026-10-28

Lokaler Nachweis am 28.10.2026 für den vorbereiteten Unreleased-Stand: `npm run verify` erfolgreich, **286 Node-Tests bestanden**, TypeScript und Produktionsbuild bestanden. Die bekannte Warnung zum großen JavaScript-Bundle bleibt bestehen. `verify:full` wurde hier wegen des bereits nachgewiesenen Chromium-Startblockers nicht ausgeführt; die 22 Browserfälle bleiben unbestätigt.
