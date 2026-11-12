# PaKaChi – Cluster-Architektur

Stand: 2026-11-12 · Arbeitsbranch: `develop`

## Zweck

Die Originalformen von PaKaChi werden als Cluster aus anatomisch zugeordneten Teilnetzen organisiert. Anatomie, Oberflächenaufbau, Mesh-Identität und Sortierreihenfolge sind getrennte Konzepte. Das Modell gilt identisch für Tierform (`animal`) und Arbeitsform (`humanoid`).

Diese Architektur ist eine nicht-destruktive Organisations- und Ableitungsschicht. Sie ist kein Redesign und ersetzt weder die Original-GLBs noch deren Charaktergestaltung.

## 1. Vier getrennte Identitäten

### Anatomie

`partId` bezeichnet die semantische Körperregion, zum Beispiel `head`, `torso`, `left_forearm` oder `tail_segment_1`. Anatomische Eltern-Kind-Beziehungen und Rig-Zuordnungen werden explizit gespeichert. Eine Sortiernummer darf niemals eine anatomische Elternbeziehung implizieren.

### Oberflächenebene

`surfaceLayerId` bezeichnet die sichtbare oder technische Schicht, zum Beispiel `body_surface`, `fur`, `joint_cover`, `paw_pad` oder `detail`. Eine Schicht verweist auf eine anatomische Region, ist aber nicht selbst die Anatomie. Fell kann dadurch dem Kopf oder Rumpf zugeordnet werden, ohne mit dem Körpermesh verschmolzen zu werden.

### Mesh-Identität

Jedes Quell- und Ableitungsmesh erhält eine stabile, unveränderliche ID. IDs werden nie aus Positionen, Namen oder Sortiernummern berechnet. Umbenennen, Umsortieren oder Einfügen neuer Teile ändert keine bestehende ID.

### Reihenfolge

`orderKey` ist ein lexikografisch verglichener ganzzahliger Pfad. Beispiele: `[1]`, `[1,1]`, `[1,2]`, `[2]`. Wird zwischen 1 und 2 ein Teil eingefügt, kann es `[1,1]` erhalten; weitere Einfügungen erhalten `[1,2]` usw. Die Reihenfolge ist reine Darstellung/Organisation, niemals Identität oder Parent-Child-Beziehung. Bei Bedarf kann ein Teilbaum später neu nummeriert werden, ohne IDs oder Verbindungen zu ändern.

## 2. Datenvertrag

Der erste Manifestvertrag verwendet folgende Felder:

```ts
type PakachiForm = 'animal' | 'humanoid';

type ClusterPart = {
  id: string;                 // stabile partId
  form: PakachiForm;
  parentPartId: string | null;
  orderKey: number[];
  rigBoneIds: string[];
};

type SurfaceLayer = {
  id: string;                 // stabile surfaceLayerId
  partId: string;
  kind: 'body' | 'fur' | 'skin' | 'joint-cover' | 'pad' | 'detail';
  orderKey: number[];
};

type MeshSource = {
  id: string;                 // stabile meshId
  form: PakachiForm;
  sourceAssetSha256: string;
  sourceMeshIndex: number;
  sourceMeshName: string;
  sourcePrimitiveIndex: number;
};

type MeshClusterAssignment = {
  meshId: string;
  partId: string;
  surfaceLayerId: string;
  orderKey: number[];
  assignment: 'direct' | 'weighted' | 'boundary' | 'ambiguous';
  confidence: number;
};

type TriangleOrigin = {
  meshId: string;
  sourceTriangleId: number;
  partId: string | null;
  assignment: 'direct' | 'weighted' | 'boundary' | 'ambiguous';
  confidence: number;
};
```

Die Typen sind der Datenvertrag, noch keine Behauptung einer bereits implementierten Laufzeitfunktion. Vor der Implementierung werden Namenskonventionen, ID-Namespace und Manifestversion im Code festgelegt und getestet.

## 3. Gemeinsame Anatomie beider Formen

Beide Formen verwenden dieselben logischen `partId`-Werte, soweit die Anatomie vorhanden ist. Geometrie und Anzahl der Meshes dürfen abweichen. Fehlende Teile werden als nicht vorhanden ausgewiesen und nicht durch Ersatzgeometrie simuliert.

Grundbereiche:

- Kopf: Schädel, Kiefer, Ohren, Schnauze, Nase und Augenbereiche.
- Rumpf: Becken, Wirbelsäule, Brustkorb und Hals.
- Arme: Oberarm, Unterarm, Hand sowie Finger/Daumen.
- Beine: Oberschenkel, Unterschenkel, Fuß sowie Zehen.
- Schwanz: Basis, Segmente und Spitze; formabhängige Segmentanzahl.
- Oberflächen: Fell und andere sichtbare Schichten, jeweils einer Anatomie zugeordnet.
- Mechanische Details: tatsächlich vorhandene Gelenkabdeckungen und Ringe mit Referenz auf den zugehörigen Bereich bzw. das Gelenk.

Gesichts-, Hand-, Finger-, Fuß- und Zehenmeshes, die bereits getrennt vorliegen, werden zuerst direkt zugeordnet. Die großen Körper- und Fellnetze werden danach anhand der Skin-Gewichte und Rig-Ketten dreiecksgenau klassifiziert.

## 4. Herkunft und Nicht-Destruktivität

Jedes abgeleitete Dreieck muss auf Quellasset-Hash, Quellmesh, Primitive und Quell-Dreiecksindex zurückführbar sein. Grenzdreiecke werden als `boundary` oder `ambiguous` ausgewiesen, bis eine belastbare Zuordnung vorliegt. Kein Dreieck darf stillschweigend verloren gehen oder doppelt zugeordnet werden.

Bei der Ableitung sind mindestens folgende Attribute zu erhalten und zu vergleichen:

- Positionen und Indizes
- UVs, Normalen und Vertexfarben
- Material-/Primitive-Zuordnung
- Skin-Indizes und Skin-Gewichte
- Morph-Ziele und deren Attribute

Keine globale Neuverschweißung, kein Remeshing und keine Retopologie im ersten Zerlegungsschritt. Original-GLBs werden niemals überschrieben.

## 5. Validierungsregeln

Ein Manifest ist nur gültig, wenn:

1. alle IDs innerhalb ihres jeweiligen Namespace eindeutig und stabil sind;
2. jede referenzierte Elternregion und Oberflächenschicht existiert;
3. anatomische Elternbeziehungen azyklisch sind;
4. jeder `orderKey` aus nichtnegativen Ganzzahlen besteht und nur für Sortierung verwendet wird;
5. jede Mesh-Zuordnung auf ein Mesh des passenden Form-/Asset-Hashes verweist;
6. jede Dreiecksherkunft einen gültigen Quellindex besitzt;
7. direkte, gewichtete, Grenz- und mehrdeutige Zuordnungen getrennt ausgewiesen werden;
8. die Summe der abgeleiteten Quellflächen mit der Quellinventur abgeglichen wird; Mehrfachzuordnung ist nur mit expliziter Begründung zulässig.

Die Zuordnungskonfidenz ist ein Diagnosewert und keine automatische Freigabe. Unklare Grenzfälle bleiben sichtbar und werden nicht durch einen willkürlichen Schwellenwert versteckt.

## 6. Umsetzung in kleinen, prüfbaren Schritten

1. Manifest-Schema und Validator implementieren; synthetische Tests für IDs, Elternzyklen, Sortierschlüssel und Referenzen.
2. Asset-Hashes und reproduzierbares Mesh-/Primitive-Inventar beider Originalformen erfassen.
3. Bereits getrennte Gesichts-, Hand-, Finger-, Fuß- und Zehenmeshes direkt zuordnen.
4. Skin-Gewichte pro Dreieck auswerten und Körper/Fell anatomisch klassifizieren.
5. Grenz- und Mehrdeutigkeitsflächen visualisieren und als Herkunftsdaten ausgeben.
6. Nicht-destruktive Teilnetze ableiten und sämtliche Attribute/Herkunftsindizes vergleichen.
7. Repräsentative Gelenkposen beider Formen prüfen; erst danach Übernahme in den Model Zoo.

Rigging-Verbesserung und gemeinsame Morph-Topologie bauen auf dieser Zuordnung auf. Die reversible Normalform↔Arbeitsform-Animation bleibt nachgelagert.

## Abnahmekriterien

- Dieselben logischen Anatomie-IDs für Tier- und Arbeitsform.
- Keine Änderung an Original-GLBs oder bestehenden Charakterreferenzen.
- Vollständige, reproduzierbare Dreiecksherkunft.
- Keine verlorenen Attribute oder unmarkierten Mehrdeutigkeiten.
- Neue Teile lassen sich einsortieren, ohne bestehende IDs oder Parent-Beziehungen zu ändern.
- Einfügen und Umsortieren verändert ausschließlich `orderKey`.
- Tierform und Arbeitsform durchlaufen denselben Validator und dieselbe Ableitungspipeline.
