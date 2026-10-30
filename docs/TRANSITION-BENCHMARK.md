# Player-Überblendung auf der CPU messen

Seit 0.71.0, nach `npm ci` mit Node.js ab Version 24:

```sh
npm run benchmark:transitions
```

Für JSON ohne npm-Kopfzeilen:

```sh
node scripts/benchmark-playback-transition.mjs > transition-messung.json
```

Das Werkzeug lädt den mitgelieferten Mika und baut ein StudioRig auf. Jeweils keine, eine oder alle Oberflächen werden in eine kontrolliert veränderte Zielgeometrie überführt. Jeder Fall läuft dreimal in einem eigenen Node-Prozess mit expliziter Garbage Collection. Zwölf Schritte mit jeweils 16 ms Animationszeit schließen den 180-ms-Übergang ab. Quelldateien bleiben unverändert. Jeder Kindprozess hat höchstens zwei Minuten Laufzeit.

Gemessen werden Startzeit und einzelne CPU-Schritte einschließlich Wiederherstellung, Kopie, Interpolation, Normalen- und Begrenzungsberechnung. Modell-/Rig-Laden, Vorbereitung der Testverformung, Prüfsummen, Garbage Collection, Animator/IK, UI und WebGL sind nicht in den Zeiten enthalten. 16 ms sind hier der Simulationsschritt, keine erreichte Framezeit. Es gibt keinen hardwareunabhängigen Bestehensgrenzwert.

Der Bericht enthält CPU-/Node-/Plattformangaben, Modellprüfsumme, Anzahl betroffener Meshes/Vertices, Median und Maximum der gemessenen Schritte sowie eine Prüfsumme der angezeigten Positionen und Normalen. Diese muss pro Fall zwischen Wiederholungen übereinstimmen. Die Prüfsumme bewertet Wiederholbarkeit, keine visuelle Qualität.

Speicher wird nach Garbage Collection im ersten Übergangsschritt relativ zum geladenen Rig gemessen. Das ist eine Momentaufnahme, kein Spitzenbedarf. Garbage Collection kann auch zuvor angefallene Daten freigeben; deshalb sind negative Differenzen möglich und bedeuten keinen negativen Speicherbedarf. Zielpuffer-Wiederverwendung reduziert laufende Neuanlagen, nicht den notwendigen Speicher für Ausgangs- und Zielgeometrie.

## Vergleich

- [Vor Optimierung, 0.70.0](benchmarks/transition-0.70.0.json): Ausgangscode aus Commit `5cfb0d5c077bafcaa65a3c04c4ce67d67c9ec939`, mit demselben neu ergänzten Benchmark ausgeführt.
- [Nach Optimierung, 0.71.0](benchmarks/transition-0.71.0.json).

Alle neun Positionen-/Normalen-Prüfsummen stimmen zwischen Vorher und Nachher überein. Für alle Mika-Meshes (196.875 Vertices über 25 Mesh-Instanzen) liegen die Mediane der drei Prozesse vorher bei 24,94 / 26,76 / 26,86 ms, danach bei 15,23 / 13,10 / 16,93 ms. Der festgehaltene ArrayBuffer-Zuwachs beträgt in beiden Reihen rund 8,34 MiB. Lokale Messreihe, keine garantierte Beschleunigung auf anderer Hardware und kein Nachweis von 60 FPS.

Große eigene Modelle, kombinierte Animation/IK und die Zeit bis zum gerenderten Bild bleiben offen. Die Formveränderung im Benchmark ist kontrollierte Testgeometrie auf dem echten Mika-Modell, keine Abnahme einer echten Gesichtsanimation.
