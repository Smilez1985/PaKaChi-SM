# Prüfbericht 0.80.0

Zeitstempel: 2026-11-07T10:12:57+01:00 (Europe/Berlin)

## Oberflächenanimation

Freie Punktverformung wird mit derselben reinen Geometrieberechnung wie im Editor erzeugt. Pro betroffenem Mesh ein Morph-Ziel je unterschiedlicher Oberflächenpose; unverformte Posen verwenden Nullgewichte. Gewichte interpolieren an den ursprünglichen Schlüsselzeiten. Skinning und Figurenkanäle bleiben erhalten, auch Animationen ohne Skelett sind möglich.

Vorhandene relative und absolute Positions-/Normal-Morphs behalten ihre konstanten Gewichte. Bei absoluten vorhandenen Zielen wird die Wirkung auf den verformten Basiszustand berücksichtigt. Native Namen bleiben erhalten. Normalen sind an den Zielposen berechnet und dazwischen interpoliert, keine allgemeine pixelgenaue Rendergarantie.

## Regressionen

Echte GLB-Ausgabe und erneutes Laden für vier Kombinationen (mit/ohne Skelett, relative/absolute native Morphs): animierte Vertexpositionen, mesh-gebundene/globale Punkte, bestehende Morph-Gewichte/-Namen, deduplizierte Oberflächenposen, Figurenbewegung, wiederholte Posen und Schleifenschluss. Quelle, Daten und Geometrie bleiben unverändert. Budgettests lehnen zu viele Ziele und zu große Attributdaten vor dem Kopieren der Figur ab.

Browserfall erstellt einen freien Punkt und Move auf einer ungeriggten Oberfläche, lädt die GLB herunter, prüft Morph-/Clipdaten und den unveränderten Projektstand, importiert erneut und spielt den Clip ab. Artefakt `exported-glb-surface-move.png`. Aktueller vollständiger CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

## Grenzen

64 Ziele je Mesh, 64 MiB Morph-Attributdaten einschließlich nativer Daten und Ergänzungen, 20 Millionen geschätzte Punkt-/Vertex-/Normalen-Arbeitseinheiten sowie die bisherigen Sample-/Kanalbudgets. Versteckte Meshes erhalten keine neuen Morph-Spuren. Andere native Morph-Attribute als Position/Normal werden mit Hinweis abgewiesen. Originalclip-Übernahme und Retargeting bleiben offen.

Lokaler Nachweis: `npm run verify` erfolgreich, **324 Node-Tests bestanden**, TypeScript und Produktionsbuild bestanden. Normalen werden zusätzlich an Schlüsselposen verglichen; unsichtbare ungebundene Knochen erzeugen keine ungültigen Animationsspuren. Bekannte Bundle-Größenwarnung bleibt.

CI-Korrektur (2026-11-07): Der erste Lauf bestand 28 von 29 Browsertests. Der neue Test verwendete beim Anlegen des Oberflächenpunkts einen unzulässigen Radius von 2 (Befehlsgrenze: 0,6). Der Test setzt den Punkt jetzt mit zulässigem Radius direkt auf einen Vertex der normalisierten Dreiecksfigur und prüft zusätzlich eine tatsächlich positive Verformung im exportierten Morph-Ziel. Keine Produktionsgrenze geändert, kein Test übersprungen und kein Zeitlimit erhöht. Vollständiges Ergebnis des korrigierten Stands siehe PR #1.
