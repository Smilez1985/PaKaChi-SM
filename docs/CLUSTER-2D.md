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

Implementiert sind ein validierter PaKaChi-Startkatalog mit stabilen, formübergreifenden Anatomie- und Oberflächen-IDs, die Provenienzvalidierung, die regiongebundene Klassifikationsvorschlagsfunktion sowie die Landmarkenbearbeitung im integrierten Bildreferenz-Editor. Ein Ausschnitt mit mehreren Part-/Surface-Layer-Zielen bleibt bewusst ungelöst, auch wenn ein Landmarkenpunkt räumlich näher liegt; zusammengesetzte Referenzen müssen erst explizit getrennt oder vom Nutzer aufgelöst werden. Punkte können auf bestätigten Regionen gesetzt, per Maus oder Pixel-Feldern verschoben, semantisch beschriftet und gelöscht werden. Das version-1-Bildreferenz-Dokument speichert die Landmarken quellpixelgebunden; ein Adapter leitet Avatar/Form/Ansicht ausschließlich aus der bestehenden Hierarchie ab. Projekt-Roundtrip und Browserregressionen decken die Integration ab. Offen bleiben Undo/Redo, die bearbeitbare Katalogverwaltung und die spätere kalibrierte 2D/3D-Korrespondenz. Der Startkatalog ist ein gemeinsamer Vorschlag, keine Behauptung, dass jedes anatomische Teil in beiden Formen vorhanden ist.

## 2D/3D-Korrespondenz durch geprüfte Oberflächenpunkte

Neben kalibrierter Mehransicht-Triangulation gibt es jetzt einen getrennten Resolver für explizit vom Nutzer ausgewählte Mesh-Oberflächenpunkte. Eine gespeicherte 2D-Landmarke wird dabei über Quellbildhash, Avatar, Form, Ansicht und Pose an ein konkretes Quellmesh und Dreieck gebunden. Baryzentrische Koordinaten bestimmen den Punkt im Mesh-Lokalraum. Der Resolver prüft zusätzlich den 3D-Assethash, Mesh-Inventar, Dreiecksindex, Anatomie-/Surface-Layer-IDs und eine ausdrückliche Bestätigung.

Das Ergebnis ist eine nutzerverursachte, gesperrte Korrespondenz (origin: user, policy: locked) und ein 3D-Landmarken-Seed. Sie wird noch nicht automatisch in das Manifest übernommen. Die interaktive Mesh-Auswahl und persistente Speicherung bleiben offen. Siehe [Korrespondenzvertrag](CLUSTER-2D-3D-KORRESPONDENZ.md).
