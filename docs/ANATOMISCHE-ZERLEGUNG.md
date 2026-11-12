# Anatomische Zerlegung der PaKaChi-Originalformen

Stand: 2026-11-12 · Arbeitsbranch: `develop`

## Ziel und Schutzregeln

Tierform und humanoide Arbeitsform bleiben derselbe festgelegte PaKaChi-Charakter. Die erhaltenen Referenzen und Original-Assets sind verbindlich. Diese Zerlegung ist eine technische Datenorganisation, kein Redesign und keine Freigabe, Geometrie zu glätten, neu zu modellieren oder Teile zu ersetzen.

Beide Formen erhalten dieselbe logische `partId`-Nomenklatur, auch wenn Mesh-Anzahl und Geometrie abweichen. Die Ausgangs-GLBs bleiben unverändert; alle ersten Teilnetze werden separat und nicht-destruktiv abgeleitet.

Erhalten bleiben müssen UVs, Material-/Primitive-Zuordnung, Normalen, Vertexfarben, Skin-Indizes/-Gewichte und vorhandene Morph-Ziele. Jedes abgeleitete Dreieck behält `sourceMeshId` und `sourceTriangleId`. Mehrdeutige Grenzdreiecke werden als solche ausgewiesen und nicht stillschweigend einer Seite zugeschlagen. Keine globale Neuverschweißung, kein Remeshing und keine Retopologie während der Inventarisierung.

## Inventar der vorhandenen Originalformen

Quelle: erfolgreiches, rein lesendes Originalformen-Artefakt #6. Zahlen gelten für die dort geprüften GLB-Datei-Hashes; vor jeder Umsetzung werden die Hashes erneut geprüft.

| Form | Meshes | Vertices gesamt | Hauptkörper | Fell |
| --- | ---: | ---: | --- | --- |
| Arbeitsform / humanoid | 92 | 190.375 | `PaKaChi_body`: 49.592 Vertices, 99.176 Dreiecke | `PaKaChi_fur`: 121.275 Vertices, 40.425 Dreiecke |
| Tierform / animal | 90 | 231.739 | `PaKaChi_body`: 80.500 Vertices, 160.976 Dreiecke | `PaKaChi_fur`: 132.027 Vertices, 44.009 Dreiecke |

### Bereits getrennte Bereiche

- **Gesicht:** `Muzzle_smile`, `Soft_nose`, je Auge `Eye_socket`, `Green_iris`, `Pupil` und `Eye_highlight`; die Augen liegen als nummerierte Meshes vor.
- **Hände:** Handflächen, Pads und einzelne Finger-/Daumensegmente samt Knöchel- und grünen Spitzen-Meshes.
- **Füße:** Fußflächen/Pads und einzelne Zehensegmente samt Knöchel- und grünen Spitzen-Meshes.
- **Fell:** separates skinned Mesh, aber noch nicht anatomisch unterteilt.
- **Hauptkörper:** ein einziges großes skinned Mesh; Kopf, Rumpf, Arme, Beine und Schwanz sind darin nicht als eigenständige anatomische Meshes getrennt.
- **Formunterschied:** Die Arbeitsform enthält zusätzlich je Hand einen `wrist_rim`; in der Tierform existiert dieses Mesh nicht. Das wird nicht durch Geometrieersatz angeglichen.

Die Mesh-Anzahl suggeriert somit eine stärkere Trennung, als tatsächlich vorhanden ist. Die beiden großen Hauptkörpermeshes enthalten weiterhin die entscheidenden zusammenhängenden Bereiche.

## Gemeinsame logische Anatomie

| Bereich | Beispielhafte `partId` | Rig-Kette / Hinweis |
| --- | --- | --- |
| Kopf | `head`, `jaw`, `left_ear`, `right_ear`, `muzzle`, `nose`, `left_eye_*`, `right_eye_*` | `Neck → Head → Jaw`; Gesichtsdetails bleiben separate Oberflächen |
| Rumpf | `pelvis`, `spine`, `chest`, `neck` | `Pelvis → Spine → Chest → Neck` |
| Arme | `left_upper_arm`, `left_forearm`, `left_hand` und rechts entsprechend | Schulter, Ellbogen, Handgelenk; Finger/Daumen als Unterteile |
| Beine | `left_thigh`, `left_lower_leg`, `left_foot` und rechts entsprechend | Hüfte, Knie, Knöchel; Zehen als Unterteile |
| Schwanz | `tail_base`, `tail_segment_1..n`, `tail_tip` | Eigene Kette, in der Tierform besonders wichtig |
| Fell/Äußeres | `fur_head`, `fur_torso`, `fur_left_arm` usw. | Separate Oberflächenlage, anatomisch zugeordnet, nicht mit Körper verschmolzen |
| Mechanische Details | `joint_cover_*`, `wrist_rim_*` | Nur tatsächlich vorhandene Teile, Referenz auf Gelenk |

## Dreiecksgenaue Herkunft

Jede Teilfläche erhält eine stabile Herkunftsadresse:

```ts
type AnatomicalTriangleRef = {
  form: "animal" | "humanoid";
  sourceAssetSha256: string;
  sourceMeshIndex: number;
  sourceMeshName: string;
  sourcePrimitiveIndex: number;
  sourceTriangleId: number;
  partId: string;
  confidence: number;
  assignment: "direct" | "weighted" | "boundary" | "ambiguous";
};
```

Die erste Zuordnung erfolgt aus Mesh-Namen und Skin-Gewichten/Rig-Ketten. Bei `PaKaChi_body` und `PaKaChi_fur` reicht der Mesh-Name nicht aus: Dreiecke werden anhand der Gewichte ihrer drei Eckpunkte klassifiziert. Dreiecke mit deutlich unterschiedlichen anatomischen Bindungen an ihren Eckpunkten werden zunächst als Grenzflächen markiert. Eine physische Trennung muss diese Grenzen topologisch sauber auflösen und alle Attribute übertragen.

## Umsetzungsreihenfolge

1. Beide GLBs laden, Asset-Hashes prüfen und Mesh-/Primitive-/Attributdaten sowie Dreiecksanzahlen reproduzierbar protokollieren.
2. Vorhandene Gesichts-, Hand-, Finger-, Fuß- und Zehenmeshes direkt zuordnen; Körper und Fell dreiecksgenau anhand Skinning und Rig-Ketten klassifizieren.
3. Mehrdeutige Dreiecke und Übergänge zwischen Kopf/Rumpf/Gliedmaßen/Schwanz sichtbar und maschinenlesbar ausweisen.
4. Zunächst nur abgeleitete Teilnetze mit vollständiger Herkunftsabbildung erzeugen; Original-GLBs nicht verändern.
5. Vertex-/Corner-Attribute, Materialien, Gewichte, Morph-Ziele, Bounding-Volumen und Dreiecksherkunft vergleichen; repräsentative Gelenkposen prüfen.
6. Erst nach Abnahme getrennte GLBs und gemeinsame Anatomie-Metadaten in den Model Zoo übernehmen. Die reversible Morph-Animation bleibt nachgelagert.

## Status

- [x] Originalformen-Meshinventar aus Lauf #6 ausgewertet.
- [x] Bereits getrennte Gesichts-/Pfoten-/Finger-/Zehenbereiche identifiziert.
- [x] Hauptkörper- und Fellmeshes als primären Zerlegungsbedarf identifiziert.
- [ ] Reproduzierbares Inventar- und Herkunftsmanifest implementieren.
- [ ] Skinning-basierte Dreieckszuordnung für Körper und Fell implementieren.
- [ ] Grenzflächen- und Attributerhalt bei abgeleiteten Teilnetzen nachweisen.
- [ ] Visuelle und posebasierte Abnahme beider Formen.
