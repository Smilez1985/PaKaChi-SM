# Prüfbericht 0.70.0

Zeitstempel: 2026-10-30T08:51:57+01:00 (Europe/Berlin)

## Gezielte Nachweise

Sieben Übergangstests bestanden, davon zwei neue Fälle:

- Zwischengeometrie und Begrenzung bei halbem Übergang; exakte Wiederherstellung der Zielpositionen, Zielnormalen, Bounding Box und Bounding Sphere. Wiederholter Wechsel startet an der sichtbaren Zwischenform, Abbruch stellt das Ziel wieder her. Eine ausgetauschte Geometrie wird nicht überschrieben.
- Ein frei gesetzter Mundpunkt verformt eine echte Three.js-Fläche. Originalclip → Studio-Move → Originalclip überblendet deren Vertex-Positionen in beide Richtungen, einschließlich Pause. Projektdaten und Dirty-Status bleiben unverändert.

Die bestehenden Transformations-, Morph-, Skinning-, Kurzclip- und Hierarchieprüfungen bleiben erhalten. Es werden keine Hautgewichte interpoliert oder gespeichert.

## Gesamtprüfung

`npm run verify`: **300 Node-Tests und TypeScript-/Produktionsbuild bestanden**. Die zusätzliche Kontrolle eines nicht betroffenen Meshes wurde anschließend im gezielten Übergangstest geprüft.

## Grenzen

Node/Three.js und happy-dom, kein gerenderter Browsernachweis. Kombinationen mit großen skinned Modellen und die sichtbare Normalen-/Hautqualität bleiben manuell zu prüfen. Bearbeitete Knochen-Grundstellung, Topologie-/Gewichtsumbauten und Schertransformationen verwenden weiterhin den direkten Wechsel. Bekannte Bundle-Größenwarnung bleibt bestehen. Keine Actions gestartet; main unverändert, Sicherung auf `work/local-verification-model-zoo`.
