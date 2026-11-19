# 2D-Cluster-Vertrag und Landmarken

Stand: 2026-11-19 · Arbeitsbranch: `develop`

## Zweck und Grenze

Der 2D-Clusterkern ist die semantische Referenzbasis vor der 3D-Rekonstruktion. Er verbindet bestätigte Bildregionen mit explizit gesetzten 2D-Landmarken und stabilen anatomischen bzw. Oberflächen-IDs. Diese IDs können später von 3D-Mesh-Clustern wiederverwendet werden; die Geometrien bleiben strikt getrennt.

- 2D-Koordinaten sind Pixel des unveränderten Quellbildes, keine 3D-Positionen.
- Jede Landmarke ist an Quellbild, Avatar, Form, Ansicht und Pose gebunden.
- Unterschiedliche Ansichten oder Animationsposen werden nicht ohne Kalibrierung und explizite Korrespondenz fusioniert.
- Tier- und Arbeitsform können denselben Charakterkatalog und dieselben semantischen IDs verwenden, bleiben aber getrennte Form-/Ansichtskontexte.
- Anatomie (Part-IDs) und Oberflächenlagen (Layer-IDs wie Fell, Haut, Panzerung oder Mechanik) sind unabhängig.
- Automatische Resultate sind Vorschläge. Sie werden niemals automatisch bestätigt oder als finale Clusterzuordnung ausgegeben.
- Nicht belegte oder mehrdeutige Regionen bleiben ungelöst.

## Datenvertrag

`Cluster2DSemanticCatalog` enthält eine stabile Charakter-ID sowie vom Projekt definierte anatomische Parts und Surface-Layer. `Cluster2DLandmarkSeed` enthält einen expliziten semantischen Anker in Quellpixeln mit `avatarId`, `formId`, `viewId` und `poseId`. `Cluster2DRegionAssignment` verweist auf die bestehende Bildregion statt ihre Kontur zu duplizieren und speichert Herkunft, Konfidenz, Reviewstatus und verwendete Landmarken-IDs.

Der Klassifikator berücksichtigt nur bestätigte Regionen und Landmarken aus exakt derselben Avatar-/Form-/Ansicht. Eine abweichende Pose wird nicht stillschweigend kombiniert. Das Ergebnis bleibt `suggested`; Mehrdeutigkeit oder fehlende Evidenz ergibt `unresolved`.

## Abgrenzung zur 3D-Pipeline

`cluster-landmark-classifier.ts` bleibt ein nachgelagerter 3D-Konsument mit Mesh-lokalen XYZ-Seeds. Der neue `cluster-2d-classifier.ts` arbeitet ausschließlich mit Bildpixeln. Zwischen beiden Stufen liegt später eine explizite Korrespondenz-/Projektionsstufe mit kalibrierten Kameras oder geprüfter Nutzerzuordnung. Ein einzelnes Bild liefert keine Tiefe; aus einer 2D-Landmarke wird daher keine 3D-Koordinate abgeleitet.

## Aktueller Umfang

Implementiert sind der unabhängige 2D-Semantikkatalog, die Provenienzvalidierung für Landmarken, die regiongebundene Klassifikationsvorschlagsfunktion und Regressionen für mehrere Formen, Pose-Trennung, Mehrdeutigkeit und ungültige Provenienz. UI-Platzierung/-Bearbeitung von Landmarken, persistente Projektintegration und die spätere kalibrierte 2D/3D-Korrespondenz bleiben offen.
