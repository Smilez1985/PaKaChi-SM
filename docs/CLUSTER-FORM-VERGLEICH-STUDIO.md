# Tierform-/Arbeitsform-Vergleich im Studio

Der integrierte Studio-Bericht vergleicht zwei ausdrücklich ausgewählte Cluster-Manifeste gegen den gemeinsamen semantischen Charakterkatalog des geöffneten Studio-Projekts.

## Ablauf

1. Ein Studio-Projekt mit dem gewünschten gemeinsamen Charakterkatalog öffnen.
2. Das Cluster-Manifest der Tierform als JSON auswählen.
3. Das Cluster-Manifest der Arbeitsform als JSON auswählen.
4. **Formen vergleichen** ausführen.

Beide Dateien müssen gültige Manifeste mit `form: "animal"` beziehungsweise `form: "humanoid"` sein. Anatomie-Part- und Oberflächen-Layer-IDs müssen im Projektkatalog existieren. Ungültige oder unpassende Dateien werden nicht verglichen.

## Bericht

- Dreiecksabdeckung je semantischem Anatomie-Part und Oberflächen-Layer
- Differenz Arbeitsform minus Tierform
- Gesamtzahl der Dreiecke und nicht anatomisch zugewiesene Dreiecke je Form
- getrennte Mesh-IDs und Mesh-Inventare je Form

Die Dateien werden nur gelesen. Der Bericht verändert weder GLB-Dateien noch Manifeste oder das Studio-Projekt.

## Grenzen

Die Manifeste werden derzeit manuell ausgewählt und nicht dauerhaft als Tier-/Arbeitsform-Paar am Charakter gespeichert. Gleiche semantische IDs bezeichnen dieselbe Bedeutung, nicht dieselbe Geometrie. Dreieckszahlen beweisen weder geometrische Gleichheit noch Rig-/Morph-Kompatibilität. Es gibt keine automatische Mesh-Zuordnung zwischen den Formen.
