# Anbieter, Modelle und Fallbacks

**Stand 0.18.0.** Alle Anbieter können gleichzeitig eingerichtet bleiben. Ein Profil bezeichnet eine konkrete Kombination aus Anzeigename, Schnittstelle, API-Adresse und Modell. Für mehrere Modelle desselben Anbieters mehrere Profile anlegen. Alle Profile lassen sich unabhängig den Rollen **Assistent**, **3D-Generator** und **Rigging-Dienst** zuordnen.

## Einrichtung

1. **Anbietervorlage einsetzen** wählen oder eigene Schnittstelle und Adresse angeben. Adressen bleiben editierbar.
2. Profilname, Modell und gegebenenfalls API-Schlüssel eintragen. **Verbindung prüfen & Modelle laden** fragt ausschließlich Modellmetadaten ab; eine Modell-ID darf auch manuell eingetragen werden.
3. **Profil hinzufügen** beziehungsweise **Änderungen speichern**. Weitere Profile hinzufügen, ohne vorhandene Verbindungen zu entfernen.
4. Für jede Rolle das Hauptprofil wählen. Mit **Fallback hinzufügen** weitere Profile anhängen; ↑/↓ bestimmt deren Reihenfolge. Eine Rolle kann dieselben Profile in anderer Reihenfolge verwenden.
5. Ein Profil bearbeiten oder zwischen Anbietern wechseln: Modell- und Schlüsselentwürfe bleiben erhalten. Nur die aktive Modellliste und laufende Abfrage werden verworfen, damit verspätete Antworten nicht zur falschen Verbindung gehören.

| Vorlage | Schnittstelle | Vorgabeadresse |
| --- | --- | --- |
| Anthropic | Anthropic | `https://api.anthropic.com` |
| OpenAI | OpenAI-kompatibel | `https://api.openai.com/v1` |
| OpenRouter | OpenAI-kompatibel | `https://openrouter.ai/api/v1` |
| DeepInfra | OpenAI-kompatibel | `https://api.deepinfra.com/v1/openai` |
| Ollama | Ollama | `http://localhost:11434` |
| LM Studio | LM Studio | `http://localhost:1234/v1` |

Eigene 3D-/Rigging-Dienste bleiben zusätzlich konfigurierbar. Die Vorlagen starten keine Anfrage und bescheinigen keine Modellfähigkeit. Generische APIs verwenden `/models` und `/chat/completions` relativ zur konfigurierten Basis; Ollama `/api/tags` und `/api/chat`.

## Schlüssel und Speicherung

Profilkonfiguration und Rollenzuordnungen einschließlich Fallback-Reihenfolge bleiben im lokalen Browserspeicher. Das bestehende Profilformat wurde um optionale Fallback-Listen erweitert; ältere Konfigurationen sind weiterhin lesbar. Schlüssel stehen ausdrücklich nicht darin und nicht in Projektdateien.

API-Schlüssel bleiben **je Profil und tatsächlichem Endpunkt im Arbeitsspeicher der laufenden Seite**. Sie werden beim Bearbeiten wieder angezeigt und vom Assistenten für genau dieses Profil verwendet. Dialogschluss, Wechsel zum anderen Anbieter und Rollenumstellung löschen sie nicht. Ein Schlüssel wird nicht automatisch an eine neu eingetragene Adresse übertragen; beim Zurückwechseln steht der ursprüngliche Schlüssel wieder bereit. „Schlüssel vergessen“ und Entfernen eines Profils sind ausdrückliche Löschaktionen. Beim Neuladen/Beenden der Seite gehen Sitzungsschlüssel verloren; dauerhafte geschützte Schlüsselablage ist noch offen.

Nach dem Bearbeiten eines gespeicherten Schlüssels im Optionsdialog diesen Dialog schließen oder Profil speichern, damit der Assistent ihn verwendet. Unterschiedliche Profile können unterschiedliche Schlüssel besitzen, auch beim gleichen Anbieter. Rollen können ein Profil und damit dessen Schlüssel gemeinsam verwenden.

## Fallback-Verhalten

Die Reihenfolge lautet Hauptprofil → erster Fallback → zweiter Fallback usw. Im Assistenten wird die vollständige Route vor dem Senden angezeigt. Das ausdrückliche Senden autorisiert diese konfigurierte Route, auch wenn sie lokale und Cloud-Profile kombiniert. Jeder Kandidat wird höchstens einmal versucht; aktuelle und erfolgreiche Anbieter werden angezeigt. Schlüssel, Profile und Reihenfolge werden für den Auftrag festgehalten.

Der Assistent wechselt bei Netzwerk-/HTTP-Fehlern, fehlender Anmeldung, Zeitlimit, leerer/abgeschnittener Antwort oder nicht unterstütztem Adapter zum nächsten eingetragenen Profil. Bei Abbruch, veraltetem Studio-Stand oder ungültigen Werkzeugbefehlen erfolgt **kein** Fallback. Pro Profil gelten bis zu fünf API-Runden; ein Zeitlimit kann serverseitige Arbeit nicht zurücknehmen. Deshalb können fehlgeschlagene Cloud-Versuche bereits Kosten verursacht haben. Keine zusätzlichen Anbieter außerhalb der konfigurierten Liste werden gewählt.

Für Generator und Rigging werden eigene Routen gespeichert. Deren produktive Fachadapter und Fallback-Ausführung sind noch nicht integriert. Eine Rollenzuordnung macht aus einem Sprachmodell keinen Fachgenerator.

## Anthropic und Verbindungsgrenzen

Anthropic verwendet `x-api-key`, `anthropic-version: 2023-06-01` und den Header für direkten Browserzugriff. Workspace-gebundene API-Schlüssel verwenden; zusätzliche Workspace-Auswahl ist noch offen. `/v1/models` fordert höchstens 1000 Einträge an; eine unvollständige Antwort wird abgewiesen. Modell-ID dann gegebenenfalls manuell eintragen. OAuth ist noch nicht umgesetzt; ein Chat-Abonnement bedeutet nicht automatisch API-Zugang.

Der Browser spricht die angezeigte Adresse direkt an. CORS muss vom Dienst erlaubt werden; bei Ollama über `OLLAMA_ORIGINS`, bei LM Studio über die Servereinstellungen. Organisationsrichtlinien werden nicht umgangen. Schlüssel außerhalb von Loopback erfordern HTTPS. Große Modelllisten können an Antwortgrenzen scheitern. Echte Modell-/Konto-/Browserabnahme bleibt offen.

[Assistent](ASSISTENT.md) · [Design](KONZEPT.md) · [Roadmap](ROADMAP.md)
