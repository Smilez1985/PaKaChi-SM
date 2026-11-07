# Prüfbericht 0.82.0

Zeitstempel: 2026-11-07T12:30:50+01:00 (Europe/Berlin)

## Umhängen mit Skalierungsausgleich

Die beiden Äste unter ihrem nächsten gemeinsamen Knochen dürfen unterschiedliche positive gleichmäßige Maßstäbe besitzen. Das Verhältnis Quellast/Zielast wird als fester positiver Faktor auf die lokale Skalierung des verschobenen Knochens angewandt. Der gemeinsame Vorfahr darf weiterhin invertierbar ungleichmäßig oder negativ skaliert sein. Die eigene Skalierung des verschobenen Knochens wird aus der Drehungsumrechnung herausgehalten; ihre Spiegelungsachsen bleiben erhalten.

Grundstellung, gespeicherte Schlüsselposen, Entwurf und aktuelle Pose werden vor dem Umschalten umgerechnet. Nicht endliche, außerhalb des Projektbereichs liegende oder nicht verlustfrei rekonstruierbare Rahmen werden abgewiesen. Replay rekonstruiert den Ausgleich aus Quellmodell und Umbaufolge. Die ursprüngliche Quelle einschließlich lokaler Skalierungen bleibt wiederherstellbar; bei bisher unterstützten gleichen Astmaßstäben bleibt Faktor 1 erhalten.

## Nachweise

- 330 Node-Tests lokal bestanden, keine Fehler oder übersprungenen Tests. TypeScript und Produktionsbuild lokal bestanden; die bekannte Bundle-Größenwarnung bleibt.
- Drei ungleiche Astverhältnisse, verschachtelte Eltern, gemeinsame nicht gleichmäßige Spiegelung, eigene Skalierung/Spiegelung des verschobenen Knochens, Gesamtfigurenbewegung, gespeicherte Posen/Entwurf und verschachtelte starre Anbauteile. Verglichen werden Weltvertices und Anbaumatrizen; mehrfacher Reset darf den Faktor nicht erneut aufmultiplizieren.
- Gemischte Folge aus Umhängen ganzer Teilbäume, Rückhängen, Gewichtsübertragung, Einfügen, Löschen und Projektladen: identische Gewichte und rekonstruierte Skalierungen. Zu kleiner nicht invertierbarer Ausgleich wird vor Änderung von Daten oder Hierarchie abgewiesen.
- Mika und Nori mit Quellastmaßstab 2, Zielastmaßstab 3 und eigener gespiegelter Fußskalierung: alle Hautvertices vor/nach Umhängen und erneutem Laden verglichen.
- Animierter GLB-Rundlauf mit tatsächlicher Skinning- und Anbaumatrixprüfung an vier Zeitpunkten; Export verändert den Quellstand nicht. Gespeicherte Beugeprüfung mit unabhängigem geometrischem Winkelvergleich.
- Zusätzlicher Chromium-Fall für entsprechend angepassten Mika mit starrem Anbauteil: echte UI-Umhängung, erhaltene Weltposition, Undo/Redo, Projektdatei und erneutes Laden. Artefakt `reparented-scaled-bone.png`. Ergebnis, vollständige Logs und Artefakte des getesteten Commits sind in [PR #1](https://github.com/Smilez1985/PaKaChi-SM/pull/1) verknüpft. Die Suite umfasst jetzt 32 Browserfälle; kein lokaler Browsernachweis, da Chromium hier weiterhin beim Socket-Aufbau blockiert ist.

## Format und Grenzen

Projektformat bleibt Version 1, keine neue freie Skalierungsspur oder neue Bedienoption. Der Faktor wird deterministisch rekonstruiert. Projekte mit diesem neuen Fall benötigen mindestens 0.82.0; ältere Versionen weisen die ungleichen Astmaßstäbe beim Wiederaufbau ab. Bisherige gleiche Astmaßstäbe behalten ihre Interpretation.

Nicht gleichmäßige oder negative Skalierung auf den getrennten Elternästen, Wurzel-/Kreis-/Fremdskelettverbindungen, eigene Skelette an Anbauteilen und numerisch nicht invertierbare Fälle bleiben gesperrt. Das Löschen mit Anbauteilen und weitere Umbauten skalierter Zwischenknochen bleiben eigene Aufgaben. Schlüsselposen sind erhalten; eine unveränderte Zwischenbewegung wird wegen der geänderten Elternhierarchie nicht zugesichert. Haut-/IK-Qualität und manuelles Mausgefühl bleiben separat abzunehmen. Keine bestehenden Tests übersprungen oder Zeitlimits erhöht.
