# PaKaChi – Cluster-Architektur

Stand: 2026-11-12 · Arbeitsbranch: `develop`

## Zweck

Die Cluster-Architektur ist eine **generische, wiederverwendbare Pipeline-Stufe** des Bild-zu-3D-Ablaufs – kein PaKaChi-spezifischer Einmal-Schritt. Sie wird nach der 3D-Geometrieerzeugung und vor dem endgültigen Rigging ausgeführt. Sie gilt für Tierform (`animal`), Arbeitsform (`humanoid`) und später importierte Figuren.

Die erste Cluster-Struktur wird automatisch vorgeschlagen. Nutzer und LLM dürfen sie anschließend über dieselben kontrollierten Änderungsoperationen anpassen. Das Studio bietet zusätzlich eine explizite Neuberechnung an, die aktuelle Geometrie, neue Evidenz und geschützte manuelle Festlegungen berücksichtigt. Die Architektur ist nicht-destruktiv: Original-Assets bleiben erhalten; Ableitungen und Zuordnungen sind nachvollziehbar.

PaKaChi Tier- und Arbeitsform dienen als hochwertige Referenz- und Regressionstestfälle für den allgemeinen Algorithmus. Sie dürfen nicht als fest codierte Anatomie-Regeln missverstanden werden.

## Verbindliche visuelle Zielreferenz

Die vom Nutzer am 2026-11-13 ausdrücklich bestätigte Referenz ist das Bild mit **beiden** PaKaChi-Erscheinungsformen nebeneinander: links die dunkle, fellbedeckte vierbeinige Tierform, rechts die aufrechte, ebenfalls fellbedeckte humanoide Arbeitsform. Dieses Bild ist die maßgebliche visuelle Abnahmegrundlage für den finalen Original-PaKaChi-Avatar.

Beide Formen müssen die gemeinsame Charakteridentität sichtbar bewahren: dunkles dichtes Fell, cremefarbene Gesichtszeichnung und Schnauze, große grüne Augen, grün leuchtende Innenohren und Wangenakzente, großer buschiger schwarz-grüner Schweif, grün leuchtender Brust-Energiekern sowie sichtbare mechanische Gelenke und grüne technische Leuchtelemente. Die Arbeitsform ist ausdrücklich **kein** weißer Fahrzeugroboter und keine bloß aufgerichtete Fremdfigur; sie ist die humanoide, fellbedeckte PaKaChi-Form aus der bestätigten Referenz.

Die beiden vorhandenen GLB-Modelle bleiben als zusätzliche technische Testmodelle erhalten. Sie sind nützlich für Loader-, Inventar-, Cluster-, Geometrie- und Rigging-Regressionen, gelten aber nicht automatisch als visuelle Referenz oder als finales Original-PaKaChi. Der finale Avatar ist ein separates, zusätzliches Modellziel mit zwei eigenständig korrekt aufgebauten und riggbaren Formen. Bestehende Testmodelle werden dafür weder überschrieben noch gelöscht.

**Abnahmeregel:** Technische Gültigkeit (GLB lädt, Meshes sind inventarisiert, Tests bestehen) ist keine visuelle Designfreigabe. Das finale Modell darf erst als Original-PaKaChi gelten, wenn Tierform und Arbeitsform jeweils gegen die bestätigte Referenz visuell geprüft wurden. Gemeinsames Schema und wiederverwendbare Pipeline bedeuten nicht identische Anatomie oder identische Mesh-Struktur. Morphing folgt erst nach der separaten Modell- und Rig-Abnahme beider Formen.


## Verbindlicher 2D-zu-3D-Grundsatz: bildgetriebene Rekonstruktion

Die 2D-Referenz ist die **primäre Quelle und geometrische Gestaltungsgrundlage**. Eine Textbeschreibung darf Metadaten, semantische Benennung oder Prüfhinweise liefern, aber niemals das Bild ersetzen und niemals eine freie Neugenerierung des Charakters autorisieren. Das Ziel ist Rekonstruktion plus vorsichtige Ergänzung fehlender räumlicher Information – keine textbasierte Neuinterpretation.

### 1. Originalquelle sichern und zusammengesetzte Referenz trennen

- Das unveränderte Originalbild wird als read-only Quellasset mit SHA-256, Pixelmaßen, Farbprofil/Orientierung (soweit vorhanden) und Herkunft gespeichert.
- Enthält eine Vorlage mehrere Formen, werden vor jeder Rekonstruktion getrennte Form-Assets daraus angelegt. Im bestätigten PaKaChi-Beispiel ist die linke Figur die Tierform (animal), die rechte Figur die Arbeitsform (humanoid).
- Die Trennung erfolgt über nachvollziehbare Regions-/Segmentmasken und begrenzende Ausschnitte. Crop-Rechtecke, Masken, Quellkoordinaten und Formzuordnung werden gespeichert; das Originalbild bleibt als gemeinsame unveränderte Quelle erhalten. Die beiden Formen dürfen nicht versehentlich zu einem einzigen 3D-Körper verschmolzen werden.
- Bei überlappenden Figuren, Schweifen oder Schatten müssen Segmentgrenzen geprüft und bei Bedarf manuell korrigierbar sein. Keine stillschweigende automatische Zuordnung unsicherer Pixel.
- Jede Form erhält ein eigenes Rekonstruktionsprojekt, behält aber einen Verweis auf das gemeinsame Quellbild und dessen exakte Pixelregion.

### 2. Bildbeobachtungen statt Prompt-Neugenerierung

Aus dem jeweiligen Form-Ausschnitt werden sichtbare Evidenzen extrahiert und auf Quellpixel zurückgeführt: Silhouette, Konturen, Landmarken, Proportionen, Farb- und Materialregionen, Fellgrenzen, Augen, Ohren, Schnauze, Schweif, Brustkern, Gelenke und technische Details. Beobachtungen speichern mindestens Quellbildhash, Pixel-/normalisierte Koordinaten, Maske/Region, semantisches Label, Konfidenz und Bearbeitungsherkunft.

Ein Textprompt darf diese Messungen nicht überschreiben. Ein Generator muss die Bilddaten bzw. daraus abgeleitete Bildmerkmale tatsächlich als Conditioning verwenden (z. B. Bild-/Masken-/Tiefen-/Konturbedingungen oder direkte geometrische Projektion). Ein rein textgesteuerter Text-zu-Bild- oder Text-zu-3D-Lauf ist für das finale Original-PaKaChi kein zulässiger Rekonstruktionsschritt.

### 3. Fehlende Dimensionen kontrolliert ergänzen

Die 3D-Rekonstruktion ergänzt Tiefe, Rückseiten, Volumen und verdeckte Geometrie, die eine einzelne 2D-Aufnahme nicht direkt enthält. Dabei gilt:
- Sichtbare, belegte Bildmerkmale sind harte bzw. priorisierte Randbedingungen und dürfen nicht zugunsten einer plausibleren, aber anderen Figur verändert werden.
- Nicht sichtbare Bereiche werden als inferiert markiert, mit Methode und Konfidenz. Sie dürfen nicht als direkt aus dem Bild gemessene Fakten ausgegeben werden.
- Wo mehrere 3D-Lösungen mit dem Bild vereinbar sind, wird die Unsicherheit dokumentiert; zusätzliche Ansichten oder Nutzerentscheidung haben Vorrang vor freier Erfindung.
- Symmetrie, Anatomie und physikalische Plausibilität sind Hilfsbedingungen, keine Erlaubnis, sichtbare Vorlage-Merkmale zu verändern.
- Originalbild, Masken, Beobachtungen und vorherige Rekonstruktionsstände bleiben unverändert versioniert. Jede 3D-Änderung ist auf die Evidenz zurückführbar, die sie begründet.

### 4. Iterativer Render-/Bildvergleich bis auf Pixelebene

Der Rekonstruktionsprozess ist eine geschlossene Schleife: 3D-Kandidat erzeugen/ändern → aus der passenden Referenzkamera rendern → Render und Originalregion geometrisch ausrichten → Abweichungen messen → lokale Korrekturen vorschlagen → erneut rendern und vergleichen. Die Kamera-/Projektionsannahmen müssen dokumentiert sein; ohne passende Kamerapose ist ein Pixelvergleich nicht aussagekräftig.

Der Vergleich muss mehrstufig und lokal sein:
- Pixelmetriken (z. B. MAE/RMSE und robuste Farbabweichung) auf ausgerichteten, gleich skalierten Bildregionen;
- Silhouetten-/Maskenüberlappung und Konturabstand;
- Landmarken- und Proportionsabweichungen;
- struktur-/perzeptionsbasierte Vergleiche als Ergänzung, nicht als Ersatz für Pixel- und Konturprüfung;
- separate Fehlerkarten pro Region (Gesicht, Ohren, Pfoten/Hände, Rumpf, Schweif, Brustkern, Gelenke) und Auflösung, einschließlich hochauflösender Detailausschnitte.

Hintergrund, Schatten, Beleuchtung, Fellmikrostruktur und unbekannte Kamera-/Materialparameter können Pixelwerte beeinflussen. Deshalb müssen Bildausrichtung, Maske, Farb-/Lichtnormalisierung und Metrik getrennt ausgewiesen werden. Ein niedriger globaler Durchschnitt darf keine lokal gravierende Abweichung im Gesicht oder an charakteristischen Merkmalen verdecken. Pixelgenaue Prüfung ist ausdrücklich erwünscht, aber nur zusammen mit Registrierung, Maskierung und regionaler Fehleranalyse sinnvoll.

### 5. Abnahme und Schutz vor Design-Drift

Ein Kandidat wird nicht allein durch erfolgreiche Generierung, Mesh-Inventar oder Rigging freigegeben. Er benötigt für jede Form einen nachvollziehbaren Vergleichsbericht mit Quellhash, Crop-/Maskenversion, Kameraannahmen, Metriken, Fehlerkarten und offenen inferierten Bereichen. Sichtbare Schlüsselmerkmale erhalten eigene Mindestprüfungen. Nutzerfreigabe ist erforderlich, bevor eine Rekonstruktion als finales Original-PaKaChi markiert wird. Textbeschreibung und LLM-Vorschläge dürfen nur Korrekturvorschläge erzeugen; sie dürfen den Referenzpixeln nicht stillschweigend widersprechen.

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

### Ergänzung: Erkennung, Overrides und Neuberechnung

Das Manifest muss neben dem Ergebnis auch dessen Entstehung und Bearbeitungsstatus speichern. Die konkrete Laufzeit-API wird bei der Implementierung versioniert; konzeptionell gelten mindestens diese Informationen:

```ts
type AssignmentOrigin = 'automatic' | 'user' | 'llm' | 'imported';
type OverridePolicy = 'recomputable' | 'prefer' | 'locked';

type ClusterOverride = {
  targetId: string;
  operation: 'assign' | 'unassign' | 'split' | 'merge' | 'rename' | 'reparent' | 'reorder' | 'set-layer';
  origin: AssignmentOrigin;
  policy: OverridePolicy;
  payload: unknown;
  createdAt: string;
};

type ClusterManifest = {
  schemaVersion: number;
  sourceAssetSha256: string;
  algorithmId: string;
  algorithmVersion: string;
  generatedAt: string;
  parts: ClusterPart[];
  layers: SurfaceLayer[];
  meshes: MeshSource[];
  assignments: MeshClusterAssignment[];
  overrides: ClusterOverride[];
};
```

`locked`-Overrides sind verbindlich und dürfen bei Neuberechnung nicht still überschrieben werden. `prefer`-Overrides sind starke Hinweise, die bei Konflikten als solche ausgewiesen werden. `recomputable`-Einträge dürfen neu bewertet werden. Änderungen durch Nutzer und LLM werden als nachvollziehbare Operationen gespeichert; das LLM verwendet dieselben validierten Operationen wie die Studio-Oberfläche und erhält keine direkte Schreibberechtigung auf rohe Geometriepuffer.

Eine Neuberechnung erzeugt zunächst einen neuen Kandidatenmanifest-Stand. Sie vergleicht Quellhash, Algorithmusversion, bisherige Zuordnungen und Overrides, zeigt Konflikte bzw. Mehrdeutigkeiten und wird erst nach Validierung übernommen. Vorherige Stände bleiben über Undo/Versionierung wiederherstellbar. IDs werden soweit semantisch identisch stabil weitergeführt; neu erkannte oder nicht mehr vorhandene Teile werden ausdrücklich ausgewiesen.

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

Die Erkennung darf **nicht** voraussetzen, dass bereits ein Rig oder Skin-Gewichte existieren. Sie muss mit ungeriggten Generatorausgaben und einem einzelnen zusammenhängenden Mesh funktionieren. Vorhandene getrennte Meshes werden über Generator-Metadaten, Namen, Geometrie und semantische Hinweise direkt oder mit Konfidenz zugeordnet. Zusammenhängende Netze werden über 2D-Semantik/Landmarken, 3D-Geometrie, räumliche Kontinuität und anatomische Plausibilität klassifiziert. Sobald Rig und Skin-Gewichte existieren, dienen Knochenketten und Gewichte als zusätzliche Evidenz und können die Zuordnung verfeinern.

Die generische Erkennung kennt keine fest codierten PaKaChi-Koordinaten oder -Mesh-Namen. Solche Informationen dürfen ausschließlich in Test-Fixtures, Referenzprofilen oder expliziten Importadaptern liegen.

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

## 5.1 Implementierter Laufzeitkern auf `develop`

`src/cluster-architecture.ts` enthält den ersten generischen Manifestkern:

- TypeScript-Verträge für Anatomieteile, Oberflächenebenen, Quellmeshes, Dreieckszuordnungen und Overrides.
- Validierung eindeutiger IDs, Elternreferenzen und Zyklen, Sortierschlüssel, Mesh-/Primitive-Grenzen, genau einer Zuordnung je Quell-Dreieck sowie gültiger Override-Operationen.
- Gemeinsame kontrollierte Editoperationen für Nutzer und LLM; Änderungen werden mit Ursprung, Schutzrichtlinie und Zeitstempel protokolliert.
- Nicht-destruktive Kandidaten-Neuberechnung. Bereits gesperrte manuelle Zuordnungen werden anhand der Quellmesh-ID und Dreiecksnummer übernommen; fehlen solche Dreiecke im neuen Vorschlag, wird die Neuberechnung abgebrochen.
- SHA-256-Quellenidentität über Web Crypto, damit das Modul browserfähig bleibt.
- Read-only-Inventuradapter `src/cluster-inventory.ts`: erfasst die vom produktiven Three.js-`GLTFLoader` bereitgestellten Mesh-Primitives mit Quellindex, Name, Vertex-/Dreieckszahl und hashgebundener Mesh-ID. Er verändert weder Geometriepuffer noch Materialien oder Transformationen.
- `resolveClusterMeshBindings()` löst jede Inventar-ID auf das exakte GLTF-Meshobjekt und liefert sichere Kopien der mesh-lokalen XYZ-Positionen und Indizes sowie die Weltmatrix. Vorhandene GLTF-Node-/Mesh-/Primitive-Assoziationen sind maßgeblich; Traversierungspositionen dienen nur als Fallback für nicht assoziierte Szenen. Skinning und Positions-Morph-Targets werden abgewiesen, damit keine falsche Restpose-Geometrie in die Projektion gelangt. Die echten Tier- und Arbeitsform-GLBs bestehen die Bindungsregression.
- `createUnclassifiedClusterManifest` überführt die Inventur in einen vollständigen, validierbaren Ausgangsmanifest-Stand. Jedes Dreieck wird ausdrücklich als ungeklärt geführt (`partId: null`, Konfidenz 0); es wird keine Anatomie geraten. Dieser Stand kann als gemeinsame Basis für segmentierte und zusammenhängende Meshes dienen.

Synthetische Regressionstests liegen in `tests/cluster-architecture.test.ts` und `tests/cluster-inventory.test.ts`. `src/cluster-landmark-classifier.ts` ergänzt einen generischen, nicht-destruktiven Vorschlagsklassifikator: caller-supplied Seed-Punkte, Anatomie-IDs und Radien bewerten die drei Eckpunkte plus Schwerpunkt jedes Dreiecks. Das funktioniert unabhängig davon, ob die Quelle aus einem einzelnen zusammenhängenden oder mehreren Meshes besteht. Pro Dreieck wird höchstens eine Region vorgeschlagen; außerhalb aller Radien liegende und zwischen konkurrierenden Regionen mehrdeutige Dreiecke bleiben `partId: null`. Die Konfidenz ist nur ein Diagnosewert. Die Funktion verändert keine Geometrie und enthält keine PaKaChi-spezifischen Koordinaten. `tests/cluster-landmark-classifier.test.ts` prüft segmentfreie synthetische Dreiecke, Ambiguität, fehlende Evidenz, indizierte Geometrie und ungültige Eingaben. Der Klassifikator, die 2D-Projektion, die Manifestpipeline und beide realen GLB-Fixtures sind im gezielten CI-Lauf #43427196738 gemeinsam geprüft: **29/29 Tests bestanden; TypeScript-Prüfung erfolgreich.** Noch offen bleiben echte kalibrierte 2D-Aufnahmen, räumliche Normalisierung für unterschiedliche Generatoren, Generator-Metadatenübernahme, Studio-Ansicht und LLM-Werkzeugaufruf. Das Modul verändert keine GLB- oder Three.js-Geometrie.

## 6. Einbindung in die allgemeine Bild-zu-3D-Pipeline

Die verbindliche Reihenfolge lautet:

1. **2D-Eingabeanalyse:** Bildorientierung, Silhouette, sichtbare Körperteile, semantische Hinweise und Landmarken erfassen.
2. **3D-Geometrieerzeugung:** Generatoradapter liefert eine unveränderte, versionierte Geometriequelle – getrennte Meshes sind optional, kein Muss.
3. **Automatische anatomische Cluster-Erkennung:** Anatomie, Elternbeziehungen, Oberflächenebenen und Mesh-/Dreieckszuordnungen vorschlagen. Unklarheiten bleiben explizit.
4. **Studio-/LLM-Korrektur:** Nutzer und LLM können dieselben kontrollierten Operationen anwenden; Herkunft und Override-Schutz werden gespeichert.
5. **Neuberechnung:** Auf Knopfdruck Zuordnungen anhand des aktuellen Modells, der Algorithmusversion und aller Overrides neu bewerten; Konflikte vor Übernahme anzeigen.
6. **Rigging und Skinning:** Erst jetzt werden Knochenketten und Gewichte erzeugt bzw. angepasst. Diese Daten dürfen anschließend als zusätzliche Evidenz in eine weitere Cluster-Neuberechnung einfließen.
7. **Validierung und Ableitung:** Attribute/Herkunft prüfen, Teilnetze oder Cluster-Ansichten ableiten und repräsentative Posen testen.
8. **Model Zoo / Moves / Morph:** Nur validierte und ausdrücklich übernommene Stände werden als Avatarbasis weiterverwendet.

### Erkennungsadapter

- **Segmentierter Generatoroutput:** vorhandene Mesh-Grenzen, Metadaten und Namen als Hinweise verwenden; Zuordnungen mit Konfidenz dokumentieren.
- **Einzelnes zusammenhängendes Mesh:** zunächst semantische/Geometrieanalyse, Landmarken und räumliche Kontinuität nutzen; Dreiecke und Grenzbereiche nachvollziehbar zuordnen.
- **Bereits geriggter Import:** Knochenhierarchie und Skin-Gewichte zusätzlich auswerten; nicht blind als Wahrheit übernehmen.

### Studio-Verhalten

Der Editor benötigt eine Cluster-Ansicht mit Auswahl, Umbenennen, Hinzufügen, Teilen, Zusammenführen, Umhängen, Neu-Zuordnen und Sortieren. Ein klarer Befehl **Cluster neu berechnen** startet einen nicht-destruktiven Kandidatenlauf. Vor dem Übernehmen zeigt das Studio geänderte Zuordnungen, Konflikte, unsichere Bereiche und Auswirkungen auf Rig-/Oberflächenreferenzen. Undo/Redo und Versionierung gelten auch für Cluster-Änderungen.

### Umsetzungsstufen

1. Manifest-Schema, Override-Modell und Validator implementieren; synthetische Regressionstests für IDs, Elternzyklen, Reihenfolge, Konflikte und Neuberechnung.
2. Generatorunabhängige Pipeline-Schnittstelle und reproduzierbare Mesh-/Primitive-Inventur einführen.
3. Segmentierten und unsegmentierten Eingabepfad mit gemeinsamen Zuweisungsergebnissen implementieren.
4. 2D-Landmarken und 3D-Geometrie als Primärsignale klassifizieren; Rig-/Gewichtsinformationen nur als optionale spätere Evidenz ergänzen.
5. Studio-Korrekturen, LLM-Operationen, geschützte Overrides und Neuberechnung implementieren.
6. Nicht-destruktive Ableitungen und vollständige Attribute-/Herkunftsprüfung.
7. PaKaChi Tier- und Arbeitsform als Referenzfälle und anschließend weitere generische Testkörper prüfen.

Rigging-Verbesserung und gemeinsame Morph-Topologie bauen auf der validierten Cluster-Struktur auf. Die reversible Normalform↔Arbeitsform-Animation bleibt nachgelagert.

## Abnahmekriterien

- Dieselben logischen Anatomie-IDs für Tier- und Arbeitsform.
- Keine Änderung an Original-GLBs oder bestehenden Charakterreferenzen.
- Vollständige, reproduzierbare Dreiecksherkunft.
- Keine verlorenen Attribute oder unmarkierten Mehrdeutigkeiten.
- Neue Teile lassen sich einsortieren, ohne bestehende IDs oder Parent-Beziehungen zu ändern.
- Einfügen und Umsortieren verändert ausschließlich `orderKey`.
- Tierform und Arbeitsform durchlaufen denselben Validator und dieselbe Ableitungspipeline.
