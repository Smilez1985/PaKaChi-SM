# Anbieter vorbereiten

Seit **0.13.0** unter **Optionen → KI-Anbieter · Vorbereitung**. Die Anwendung stellt weiterhin genau zwei Studio-Bearbeitungsmodi bereit.

1. Profilnamen vergeben, beispielsweise „Lokaler Assistent“.
2. Schnittstelle auswählen: OpenAI-kompatibel, Ollama, LM Studio oder eigener 3D-/Rigging-Dienst.
3. Serveradresse und Modell-ID eintragen und **Profil hinzufügen** wählen.
4. Weitere Profile anlegen und unabhängig **Assistent**, **3D-Generator** und **Rigging-Dienst** zuordnen.
5. Über **Bearbeiten** die Angaben ändern oder über **Entfernen** das Profil löschen. Zugehörige Rollenzuordnungen werden dabei aufgehoben; andere Profile bleiben erhalten.

Die Schnittstellennamen sind vorbereitete Konfigurationsarten, keine bereits verbundenen Anbieter. Beliebige Rollenzuordnung bescheinigt einem Modell keine Fähigkeit. Ein Sprachmodell erzeugt nicht allein durch Auswahl ein 3D-Modell oder Hautgewichte.

## Speicherung und Fehler

Maximal 64 Profile werden unter `pakachi-providers-v1` im lokalen Browserspeicher abgelegt. Ein Profil enthält ID, Anzeigenamen, Schnittstellenart, Serveradresse und Modell-ID. Die Daten sind unabhängig vom Avatar-Projekt; Projekt laden/speichern transportiert diese Einstellungen nicht. Ein anderer Browser beziehungsweise eine andere App-Adresse besitzt einen eigenen Speicherstand. Browserdaten löschen entfernt die Profile.

Es gibt noch keine Zugangsdatenverwaltung. **Keine API-Schlüssel oder Tokens in die Felder eintragen.** Die Adresse muss HTTP(S) verwenden; eingebetteter Benutzername/Passwort, Suchparameter und URL-Fragmente werden abgewiesen. Unbekannte Felder, doppelte IDs und Verweise auf fehlende Profile werden beim Einlesen abgewiesen. Bei beschädigten gespeicherten Daten erscheint ein Hinweis; sie werden erst beim nächsten erfolgreichen Speichern ersetzt. Schlägt das Speichern fehl, bleiben die zuvor aktiven Einstellungen und der Formularentwurf erhalten.

Deutsch/English wird im selben Optionsdialog umgeschaltet; selbst gewählte Namen und Formularentwürfe bleiben erhalten.

## Technischer Stand und nächste Schritte

`src/ai-providers.ts` trennt Profilformat, Speicherung und Adapter-Registry. `resolve` verlangt genau das zugeordnete Profil, einen registrierten Adapter, das angeforderte Modell und die erforderliche Fähigkeit (`tool-calling`, `image-to-3d` oder `rigging`). Fehlende oder ungeeignete Adapter führen zum Fehler, nicht zu einem Anbieterwechsel. Der geprüfte Profilstand wird als unveränderliche Kopie zurückgegeben. Die Registry ist die Grundlage für spätere Aufträge und wird noch nicht für echte Netzwerkaufrufe verwendet.

**Noch offen:** produktive Netzwerkadapter, Verbindungsprüfung, Modelllisten, API-/OAuth-Anmeldung, tatsächliche Assistentenaufrufe und Generierungs-/Rigging-Aufträge einschließlich Vorschau. Das Eintragen oder Zuordnen eines Profils löst keine Netzwerkverbindung aus. Die vorhandenen MCP-/MQTT-Verbindungen werden weiterhin separat eingerichtet.

[Design](KONZEPT.md#11-studio-als-ki-harness-und-freie-anbieterwahl) · [Roadmap](ROADMAP.md#7-studio-harness-und-anbieteranbindung)
