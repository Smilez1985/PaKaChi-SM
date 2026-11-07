# Prüfbericht 0.78.0

Zeitstempel: 2026-11-07T02:12:55+01:00 (Europe/Berlin)

## Rig-Export

Eigenständige GLB mit aktuellem Hautskelett, Gewichten und Bindematrizen; keine Clips oder Studio-Moves. Die Figurenhierarchie wird mit neu zugeordneten Knochen kopiert, Geometrie und Materialien sind unabhängig, Texturbilder werden nur gelesen. Die Welttransformation der Quelle bleibt trotz externer Viewer-Normalisierung erhalten.

Node-Tests exportieren und laden eine echte GLB erneut: verformte Weltpositionen bleiben erhalten, Knochendrehung bewegt die Haut nach dem Laden. Ein bearbeiteter Mika mit eingefügtem Gelenk, Knochenlöschung und anschließender Gewichtsübertragung behält geprüfte Vertexpositionen und Hautgewichte. Quellgeometrie, Materialien und Skelett werden nicht durch Freigabe der Kopie entsorgt. Modelle ohne Hautskelett sowie versteckte/externe Knochen werden abgewiesen.

Browserfall: Mika-Gelenk einfügen, GLB mit Rig herunterladen, Skin-/Bufferdaten prüfen, Projektstand vergleichen, Datei wieder laden und ein Gelenk über die Studio-Schnittstelle drehen. Aktueller vollständiger CI-Nachweis am jeweiligen Commit in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1).

## Bekannter separater Befund

Einfügen eines Zwischengelenks → Gewichte vom Elternknochen auf das neue Gelenk übertragen → denselben Elternknochen löschen kann beim Topologie-Replay die frühere Übertragung als wirkungslos ablehnen. Dieser Fehler entsteht vor dem Export und ist in der Roadmap offen. Der Mika-Rundlauftest löscht zuerst und überträgt danach. Keine pauschale Freigabe aller gemischten Topologiefolgen.

## Grenzen

Keine Animationsausgabe, kein Retargeting, keine allgemeine Material-/Texturqualitätsabnahme. Studio-Projekt zusätzlich speichern.

Lokaler Nachweis: `npm run verify` erfolgreich, **318 Node-Tests bestanden**, TypeScript und Produktionsbuild bestanden. Bekannte Bundle-Größenwarnung bleibt.
