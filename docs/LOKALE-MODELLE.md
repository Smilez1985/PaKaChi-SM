# Modelle nach Aufgabe auswählen

**Stand 0.15.0 · 16.10.2026.** Die Auswahl beginnt bei den drei Aufgaben. Es wird kein vollständiger Ollama-Katalog durchsucht. Für **jede** Rolle bleiben lokale Dienste, Cloud-Anbieter und eigene Modelle unabhängig wählbar. Die folgenden Kandidaten sind Einstiegshilfen, keine Beschränkung des Harness.

| Rolle | Benötigtes Ergebnis | Lokaler Einstieg | Cloud / eigene Dienste |
| --- | --- | --- | --- |
| Assistent | Anweisungen verstehen und validierte Studio-Werkzeuge aufrufen | Qwen3.5-Kandidaten über Ollama; LM Studio als weitere Laufzeit | Geeignete Modelle über austauschbare Anbieteradapter |
| 3D-Generator | Prüfbare Geometrie aus Vorlagen / Korrekturen | Experimenteller TripoSR-Ablauf vorhanden; TRELLIS.2 als weiterer Forschungskandidat | Fach-API oder LLM mit tatsächlich angebundener Geometrie-Werkzeugkette |
| Rigging-Dienst | Skelett und Hautgewichte passend zum Modell | UniRig als Forschungskandidat; noch nicht integriert | Fach-API oder LLM mit tatsächlich angebundener Rigging-Werkzeugkette |

Ein Sprachmodell darf jede Rolle übernehmen, sofern sein Adapter einschließlich Fachwerkzeugen die Aufgabe erfüllt. Eine Modell-ID allein macht aus einem Sprachmodell keinen direkten Mesh- oder Hautgewichtegenerator. TripoSR, TRELLIS.2 und UniRig sind separate Fachlaufzeiten, keine vorgesehenen Ollama-Pull-Tags. Der Nutzer darf dennoch für jede Rolle den gewünschten lokalen oder Cloud-Zugang wählen; fehlende Fähigkeiten müssen verständlich angezeigt werden.

## Optionaler Ollama-Helfer

Voraussetzungen: Node.js ab 24, laufendes lokales Ollama auf `127.0.0.1:11434`, vorhandener Modellordner. Windows: **Ollama-Einrichten.cmd**. Alternativ:

```sh
npm run setup:ollama -- --check
npm run setup:ollama
npm run setup:ollama -- --model qwen3.5:4b-q8_0
npm run setup:ollama -- --cpu --models-dir /pfad/zum/modellspeicher
```

`--check` misst Hardware und liest Dienst-/Registry-Metadaten; es lädt keine Modellgewichte und startet keine Inferenz. Ohne diese Option folgen Auswahl und eine ausdrückliche Rückfrage vor Pull und Ladetest. Eigene öffentliche Ollama-Tags sind mit `--model name:tag` möglich. Manuell installierte Modelle bleiben in der Studio-Auswahl möglich, unabhängig vom kuratierten Katalog.

| Kandidat und offizieller Pull-Befehl | Quantisierung | Mindestbudget freier VRAM des Helfers, inklusive Reserve |
| --- | --- | --- |
| `ollama pull qwen3.5:4b-q4_K_M` | Q4_K_M | 6,5 GiB |
| `ollama pull qwen3.5:4b-q8_0` | Q8_0 | 9 GiB |
| `ollama pull qwen3.5:9b-q4_K_M` | Q4_K_M | 10,5 GiB |
| `ollama pull qwen3.5:9b-q8_0` | Q8_0 | 14 GiB |

Die Werte sind konservative Vorauswahlbudgets, keine gemessenen Leistungs- oder Qualitätsgarantien. Größere tatsächliche Manifestgewichte erhöhen das Budget. Zusätzlich werden freier RAM und Plattenplatz geprüft. Modellgewichte, Kontext-/Laufzeitreserve und Studioreserve werden getrennt berücksichtigt. Dedizierter VRAM wird niemals mit RAM addiert. Ein 32-GiB-Modell wird auf einer 16-GiB-GPU nicht angeboten.

Gemessen werden Betriebssystem-RAM, freier Speicher des Modelllaufwerks und NVIDIA-VRAM über `nvidia-smi`. Automatische GPU-Freigabe derzeit nur bei genau einer zuverlässig gemessenen NVIDIA-GPU. AMD, Intel, Apple und mehrere GPUs bleiben bis zu passenden Probes gesperrt; CPU-Betrieb erfordert ausdrücklich `--cpu` und ausreichend freien RAM. Der angezeigte Modellordner muss zum laufenden Ollama-Dienst gehören; bei abweichender Installation `--models-dir` angeben. Ein entfernter Server kann mit dieser lokalen Messung nicht bewertet werden.

Der Helfer liest die öffentlichen Registry-Manifeste einschließlich Projektor und weiterer Schichten. Dieser Registry-Endpunkt ist kein zugesicherter stabiler Ollama-API-Vertrag: unbekannte Metadaten, geänderte kuratierte Digests oder nicht messbarer Speicher verhindern den Download. Vor dem Pull wird erneut gemessen. Bereits geladene Modelle werden nicht ungefragt entladen; die Einrichtung fordert einen freien Dienst.

Nach dem Pull werden Digest, Werkzeugfähigkeit, zwei einfache deutsche/englische `get_state`-Aufrufe und der tatsächliche Laufzeitkontext von 4096 geprüft. Im GPU-Modus wird vollständige GPU-Belegung verlangt, im CPU-Modus keine GPU-Belegung. Werkzeuge werden dabei nicht ausgeführt. Anschließend wird das Testmodell entladen und bei Erfolg ein eigener `pakachi-assistant-…`-Alias mit festgelegtem Kontext angelegt. Der Bericht liegt lokal unter `generated/ollama-setup/`. Das Studio-Profil wird nicht automatisch verändert.

Ein fehlgeschlagener Test führt zu keiner Freigabe; bereits heruntergeladene Gewichte werden nicht automatisch gelöscht. Die zwei Basistests beweisen weder komplexes Studio-Verständnis noch Bildqualität oder anatomisch richtiges Rigging. Dafür fehlen noch aufgabenbezogene Qualitätsprüfungen pro Modell und Quantisierung. Eigene Kontext-Overrides und parallele Aufträge können den Speicherbedarf erhöhen.

## Quellen und verbleibende Integration

Offizielle Tags: [4B Q4_K_M](https://ollama.com/library/qwen3.5:4b-q4_K_M), [4B Q8_0](https://ollama.com/library/qwen3.5:4b-q8_0), [9B Q4_K_M](https://ollama.com/library/qwen3.5:9b-q4_K_M), [9B Q8_0](https://ollama.com/library/qwen3.5:9b-q8_0). Laufzeitprüfung: [Ollama /api/ps](https://docs.ollama.com/api/ps), [Modellalias anlegen](https://docs.ollama.com/api/create).

Fachverfahren: [TripoSR](https://github.com/VAST-AI-Research/TripoSR), [TRELLIS.2](https://github.com/microsoft/TRELLIS.2), [UniRig](https://github.com/VAST-AI-Research/UniRig). Kandidaten müssen vor Integration auf Zielhardware, Ausgabeformat, Qualität und vollständige Abhängigkeitslizenzen geprüft werden. Es wurde kein Code dieser Projekte übernommen.

Cloud-Adapter für unter anderem Anthropic, OpenAI, DeepInfra und OpenRouter, geschützte Schlüsselverwaltung und offiziell unterstützte OAuth-Anmeldung stehen auf der [Roadmap](ROADMAP.md). Diese Wahl gilt für alle Rollen; ein lokaler Download ist keine Voraussetzung für Cloud-Nutzung.
