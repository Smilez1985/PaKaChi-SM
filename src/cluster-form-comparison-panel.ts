import { compareClusterCharacterForms } from './cluster-form-comparison.ts';
import type { ClusterFormComparison } from './cluster-form-comparison.ts';
import type { Cluster2DSemanticCatalog } from './cluster-2d-classifier.ts';
import type { ClusterManifest } from './cluster-architecture.ts';
import type { ClusterFormManifestPair } from './studio-data.ts';
const MAX_MANIFEST_BYTES = 20 * 1024 * 1024;
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}
async function readManifest(input: HTMLInputElement, form: 'animal' | 'humanoid'): Promise<ClusterManifest> {
  const file = input.files?.[0];
  if (!file) throw new Error(form === 'animal' ? 'Tierform-Manifest fehlt.' : 'Arbeitsform-Manifest fehlt.');
  if (file.size > MAX_MANIFEST_BYTES) throw new Error('Manifest ist größer als 20 MB.');
  let value: unknown;
  try { value = JSON.parse(await file.text()); } catch { throw new Error('Die Datei enthält kein gültiges JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value) || (value as {form?: unknown}).form !== form) {
    throw new Error(form === 'animal' ? 'Die Datei ist kein Tierform-Manifest.' : 'Die Datei ist kein Arbeitsform-Manifest.');
  }
  return value as ClusterManifest;
}
function render(host: HTMLElement, report: ClusterFormComparison): void {
  host.replaceChildren();
  host.append(node('strong', 'Vergleich für ' + report.characterId));
  const totals = node('div'); totals.className = 'form-comparison-totals';
  for (const [label, form] of [['Tierform', report.animal], ['Arbeitsform', report.humanoid]] as const) {
    const card = node('section');
    card.append(node('b', label), node('span', form.totalTriangles.toLocaleString('de-DE') + ' Dreiecke'), node('small', form.unassignedTriangles.toLocaleString('de-DE') + ' ohne Anatomie-Part'), node('small', 'Quellasset SHA-256: ' + form.sourceAssetSha256));
    totals.append(card);
  }
  host.append(totals);
  const rows = (title: string, values: Array<{id:string;label:string;animalTriangles:number;humanoidTriangles:number;triangleDelta:number}>) => {
    host.append(node('h4', title));
    const table = node('table'), head = node('tr');
    for (const label of ['Semantik', 'Tierform', 'Arbeitsform', 'Differenz']) head.append(node('th', label));
    table.append(head);
    for (const value of values) {
      const tr = node('tr');
      tr.append(node('th', value.label + ' · ' + value.id), node('td', String(value.animalTriangles)), node('td', String(value.humanoidTriangles)), node('td', (value.triangleDelta > 0 ? '+' : '') + value.triangleDelta));
      table.append(tr);
    }
    host.append(table);
  };
  rows('Anatomische Abdeckung', report.parts);
  rows('Oberflächen-Layer', report.surfaceLayers);
  const details = node('details'); details.append(node('summary', 'Formgebundene Mesh-IDs anzeigen'));
  for (const [label, form] of [['Tierform', report.animal], ['Arbeitsform', report.humanoid]] as const) {
    const section = node('section'); section.append(node('b', label));
    for (const part of form.parts) if (part.meshIds.length) section.append(node('p', part.id + ': ' + part.meshIds.join(', ')));
    for (const layer of form.surfaceLayers) if (layer.meshIds.length) section.append(node('p', layer.id + ': ' + layer.meshIds.join(', ')));
    details.append(section);
  }
  host.append(details, node('p', 'Dreieckszahlen messen nur semantische Abdeckung. Sie belegen weder geometrische Gleichheit noch Morph-Kompatibilität. Mesh-IDs bleiben je Form getrennt.'));
}
export function mountClusterFormComparison(host: HTMLElement, getCatalog: () => Cluster2DSemanticCatalog | undefined, getSavedPair: () => ClusterFormManifestPair | undefined = () => undefined, onSave: (pair: ClusterFormManifestPair) => void = () => {}): {dispose: () => void} {
  const panel = node('section'); panel.className = 'form-comparison';
  panel.append(node('h3', 'Tierform ↔ Arbeitsform vergleichen'));
  panel.append(node('p', 'Lade beide Cluster-Manifeste. Sie werden gegen den gemeinsamen Charakterkatalog des geöffneten Studio-Projekts validiert.'));
  const animalLabel = node('label', 'Tierform-Manifest (JSON)'), animal = node('input');
  animal.type = 'file'; animal.accept = '.json,application/json'; animalLabel.append(animal);
  const humanoidLabel = node('label', 'Arbeitsform-Manifest (JSON)'), humanoid = node('input');
  humanoid.type = 'file'; humanoid.accept = '.json,application/json'; humanoidLabel.append(humanoid);
  const pairingLabel = node('label', 'Ich habe geprüft: Beide Manifeste gehören zu demselben PaKaChi-Charakter.');
  const pairing = node('input'); pairing.type = 'checkbox'; pairing.id = 'form-comparison-same-character'; pairingLabel.prepend(pairing);
  const button = node('button', 'Formen vergleichen'); button.type = 'button'; button.disabled = true;
  const status = node('p', 'Beide Manifeste auswählen und die gemeinsame Charakteridentität ausdrücklich bestätigen.'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  const output = node('div'); output.className = 'form-comparison-report';
  const update = () => { button.disabled = !animal.files?.length || !humanoid.files?.length || !pairing.checked; };
  const saved=getSavedPair();
  if(saved){try{const catalog=getCatalog();if(!catalog)throw new Error('Katalog fehlt.');render(output,compareClusterCharacterForms(catalog,saved.animal,saved.humanoid));status.textContent='Gespeichertes Manifestpaar geladen.';}catch(error){status.textContent='Gespeichertes Manifestpaar ungültig: '+(error instanceof Error?error.message:String(error));}}
  animal.addEventListener('change', update); humanoid.addEventListener('change', update); pairing.addEventListener('change', update);
  button.addEventListener('click', async () => {
    button.disabled = true; output.replaceChildren();
    try {
      const catalog = getCatalog();
      if (!catalog) throw new Error('Zuerst ein Studio-Projekt mit gemeinsamem Charakterkatalog öffnen.');
      const [a, h] = await Promise.all([readManifest(animal, 'animal'), readManifest(humanoid, 'humanoid')]);
      const pair={animal:a,humanoid:h};
      render(output, compareClusterCharacterForms(catalog, a, h));
      onSave(pair);
      status.textContent = 'Vergleich erfolgreich. Beide Manifeste wurden gemeinsam im Studio-Projekt gespeichert.';
    } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
    finally { update(); }
  });
  panel.append(animalLabel, humanoidLabel, pairingLabel, button, status, output); host.replaceChildren(panel);
  return {dispose: () => { animal.removeEventListener('change', update); humanoid.removeEventListener('change', update); pairing.removeEventListener('change', update); host.replaceChildren(); }};
}
